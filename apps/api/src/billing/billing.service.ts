import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service.js';
import Stripe from 'stripe';

/**
 * Campos que leemos del objeto de suscripción de Stripe en tiempo de ejecución.
 * Según la versión del API, `current_period_end` vive en la raíz de la
 * suscripción (versiones antiguas) o dentro de cada item (versiones nuevas).
 * Los webhooks llegan con la versión del endpoint/cuenta, así que soportamos
 * ambas formas.
 */
interface StripeSubscriptionRuntime {
  status: string;
  items: {
    data: Array<{ price: { id: string }; current_period_end?: number }>;
  };
  current_period_end?: number;
  cancel_at_period_end: boolean;
}

/** Devuelve el fin del periodo actual sin importar la versión del API. */
function subscriptionPeriodEnd(sub: StripeSubscriptionRuntime): Date {
  const ts = sub.current_period_end ?? sub.items.data[0]?.current_period_end;
  if (!ts) {
    // Último recurso: un mes a partir de ahora (no debería ocurrir).
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  return new Date(ts * 1000);
}

@Injectable()
export class BillingService {
  private stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia' as unknown as Stripe.LatestApiVersion,
    });
  }

  async createCheckoutSession(userId: string, workspaceId: string, priceId: string) {
    // 1. El usuario necesita el permiso de facturación (el OWNER lo tiene siempre).
    await this.access.assertPermission(userId, workspaceId, 'canManageBilling');

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { owner: true },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    let customerId = workspace.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: workspace.owner.email,
        metadata: {
          workspaceId: workspace.id,
          userId: workspace.ownerUserId,
        },
      });
      customerId = customer.id;

      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { stripeCustomerId: customerId },
      });
    }

    // 2. Create session
    try {
      if (!priceId || priceId.includes('...')) {
        throw new Error(`Invalid Price ID: ${priceId}. Please check your environment variables.`);
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${this.configService.get('APP_URL')}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('APP_URL')}/dashboard/billing?canceled=true`,
        metadata: {
          workspaceId,
          userId,
        },
      });

      return { url: session.url };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Stripe Checkout Session creation failed: ${message}`, stack);
      throw new Error(`Billing Error: ${message}`);
    }
  }

  async createCustomerPortalSession(userId: string, workspaceId: string) {
    await this.access.assertPermission(userId, workspaceId, 'canManageBilling');

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || !workspace.stripeCustomerId) {
      throw new Error('Customer not found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${this.configService.get('APP_URL')}/dashboard/billing`,
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    }
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook signature verification failed: ${message}`);
      throw new Error(`Webhook Error: ${message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutSessionCompleted(session);
        break;
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(subscription);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Mapea un priceId de Stripe al plan que otorga. ENTERPRISE se cobra por
   * empresa (una sola suscripción del dueño cubre todos sus workspaces).
   */
  private planForPrice(priceId: string | undefined): 'PRO' | 'ENTERPRISE' {
    const enterprisePriceId = this.configService.get<string>('STRIPE_ENTERPRISE_PRICE_ID');
    return enterprisePriceId && priceId === enterprisePriceId ? 'ENTERPRISE' : 'PRO';
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const workspaceId = session.metadata?.workspaceId;
    const subscriptionId = session.subscription as string;

    if (!workspaceId || !subscriptionId) return;

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const sub = subscription as unknown as StripeSubscriptionRuntime;
    const plan = this.planForPrice(sub.items.data[0]?.price.id);

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        stripeSubscriptionId: subscriptionId,
        plan,
      },
    });

    if (plan === 'ENTERPRISE') {
      // La suscripción ENTERPRISE es por empresa: cubre todos los workspaces
      // del dueño, no sólo el que inició el checkout.
      await this.prisma.workspace.updateMany({
        where: { ownerUserId: workspace.ownerUserId },
        data: { plan: 'ENTERPRISE' },
      });
    }

    // Update or create subscription record
    await this.prisma.subscription.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        status: sub.status,
        priceId: sub.items.data[0].price.id,
        currentPeriodEnd: subscriptionPeriodEnd(sub),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
      update: {
        status: sub.status,
        priceId: sub.items.data[0].price.id,
        currentPeriodEnd: subscriptionPeriodEnd(sub),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!workspace) return;

    const sub = subscription as unknown as StripeSubscriptionRuntime;
    const status = sub.status;
    const paidPlan = this.planForPrice(sub.items.data[0]?.price.id);
    const isActive = status === 'active' || status === 'trialing';
    const plan = isActive ? paidPlan : 'FREE';

    await this.prisma.workspace.update({
      where: { id: workspace.id },
      data: { plan },
    });

    if (paidPlan === 'ENTERPRISE') {
      // ENTERPRISE es por empresa: al activarse sube todos los workspaces del
      // dueño; al cancelarse, sólo baja los que estaban en ENTERPRISE.
      if (isActive) {
        await this.prisma.workspace.updateMany({
          where: { ownerUserId: workspace.ownerUserId },
          data: { plan: 'ENTERPRISE' },
        });
      } else {
        await this.prisma.workspace.updateMany({
          where: { ownerUserId: workspace.ownerUserId, plan: 'ENTERPRISE' },
          data: { plan: 'FREE' },
        });
      }
    }

    await this.prisma.subscription.update({
      where: { workspaceId: workspace.id },
      data: {
        status: sub.status,
        currentPeriodEnd: subscriptionPeriodEnd(sub),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
  }
}
