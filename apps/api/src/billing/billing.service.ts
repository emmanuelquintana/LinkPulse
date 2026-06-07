import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service.js';
import Stripe from 'stripe';

/**
 * Campos que leemos del objeto de suscripción de Stripe en tiempo de ejecución.
 * Se declaran aparte porque los tipos del SDK apuntan a una versión de API más
 * reciente donde `current_period_end` ya no vive en la suscripción, mientras que
 * la versión de API que fijamos (`2025-02-24.acacia`) sí lo expone ahí.
 */
interface StripeSubscriptionRuntime {
  status: string;
  items: { data: Array<{ price: { id: string } }> };
  current_period_end: number;
  cancel_at_period_end: boolean;
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

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const workspaceId = session.metadata?.workspaceId;
    const subscriptionId = session.subscription as string;

    if (!workspaceId || !subscriptionId) return;

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const sub = subscription as unknown as StripeSubscriptionRuntime;

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        stripeSubscriptionId: subscriptionId,
        plan: 'PRO', // Assuming only PRO for now
      },
    });

    // Update or create subscription record
    await this.prisma.subscription.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        status: sub.status,
        priceId: sub.items.data[0].price.id,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
      update: {
        status: sub.status,
        priceId: sub.items.data[0].price.id,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
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
    const plan = (status === 'active' || status === 'trialing') ? 'PRO' : 'FREE';

    await this.prisma.workspace.update({
      where: { id: workspace.id },
      data: { plan },
    });

    await this.prisma.subscription.update({
      where: { workspaceId: workspace.id },
      data: {
        status: sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
  }
}
