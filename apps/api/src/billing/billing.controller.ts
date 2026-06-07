import { Controller, Post, Body, Req, UseGuards, Headers, RawBodyRequest, BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { Request } from 'express';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.js';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  @UseGuards(SupabaseAuthGuard)
  async createCheckout(
    @Req() req: AuthenticatedRequest,
    @Body() body: { workspaceId: string; priceId: string },
  ) {
    const userId = req.user?.sub;
    return this.billingService.createCheckoutSession(userId, body.workspaceId, body.priceId);
  }

  @Post('portal')
  @UseGuards(SupabaseAuthGuard)
  async createPortal(
    @Req() req: AuthenticatedRequest,
    @Body() body: { workspaceId: string },
  ) {
    const userId = req.user?.sub;
    return this.billingService.createCustomerPortalSession(userId, body.workspaceId);
  }

  @Post('webhook')
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }
    
    // Stripe requires the raw body for signature verification
    return this.billingService.handleWebhook(signature, req.rawBody);
  }
}
