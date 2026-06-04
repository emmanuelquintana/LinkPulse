import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia' as any,
    });
  }

  async createCheckoutSession(userId: string, workspaceId: string, priceId: string) {
    // 1. Get or create customer
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { owner: true },
    });

    if (!workspace || workspace.ownerUserId !== userId) {
      throw new Error('Workspace not found or unauthorized');
    }

    let customerId = (workspace as any).stripeCustomerId;

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
        data: { stripeCustomerId: customerId } as any,
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
    } catch (err: any) {
      this.logger.error(`Stripe Checkout Session creation failed: ${err.message}`, err.stack);
      throw new Error(`Billing Error: ${err.message}`);
    }
  }

  async createCustomerPortalSession(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || workspace.ownerUserId !== userId || !(workspace as any).stripeCustomerId) {
      throw new Error('Customer not found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: (workspace as any).stripeCustomerId,
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
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new Error(`Webhook Error: ${err.message}`);
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
    const sub = subscription as any;

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        stripeSubscriptionId: subscriptionId,
        plan: 'PRO', // Assuming only PRO for now
      } as any,
    });

    // Update or create subscription record
    await (this.prisma as any).subscription.upsert({
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
      where: { stripeSubscriptionId: subscription.id } as any,
    });

    if (!workspace) return;

    const sub = subscription as any;
    const status = sub.status;
    const plan = (status === 'active' || status === 'trialing') ? 'PRO' : 'FREE';

    await this.prisma.workspace.update({
      where: { id: workspace.id },
      data: { plan },
    });

    await (this.prisma as any).subscription.update({
      where: { workspaceId: workspace.id },
      data: {
        status: sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
  }
}
