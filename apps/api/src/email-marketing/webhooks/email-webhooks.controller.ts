import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service.js';

interface ResendWebhookEvent {
  type: string;
  data?: {
    email_id?: string;
    to?: string[];
    tags?: Record<string, string>;
    bounce?: { message?: string };
  };
}

@ApiTags('email-marketing / webhooks')
@Controller('email-marketing/webhooks')
export class EmailWebhooksController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('resend')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Resend delivery webhook events (public, no auth)' })
  async handleResend(
    @Body() event: ResendWebhookEvent,
    @Headers('svix-signature') _signature: string,
  ) {
    const emailLogId = event.data?.tags?.['email_log_id'];

    if (!emailLogId) return { received: true };

    const log = await this.prisma.emailLog.findUnique({
      where: { id: emailLogId },
      include: { subscriber: true },
    });

    if (!log) return { received: true };

    switch (event.type) {
      case 'email.delivered':
        await this.prisma.emailLog.update({
          where: { id: emailLogId },
          data: { status: 'DELIVERED' },
        });
        break;

      case 'email.bounced':
        await this.prisma.$transaction([
          this.prisma.emailLog.update({
            where: { id: emailLogId },
            data: {
              status: 'BOUNCED',
              bounceReason: event.data?.bounce?.message ?? 'Unknown bounce',
            },
          }),
          this.prisma.emailSubscriber.update({
            where: { id: log.subscriberId },
            data: { status: 'CLEANED' },
          }),
        ]);
        break;

      case 'email.complained':
        await this.prisma.$transaction([
          this.prisma.emailLog.update({
            where: { id: emailLogId },
            data: { status: 'SPAM' },
          }),
          this.prisma.emailSubscriber.update({
            where: { id: log.subscriberId },
            data: { status: 'UNSUBSCRIBED' },
          }),
        ]);
        break;
    }

    return { received: true };
  }
}
