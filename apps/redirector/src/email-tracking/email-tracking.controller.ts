import { Controller, Get, Param, Query, Headers, Ip, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { EmailTrackingService } from './email-tracking.service.js';

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

@Controller('t')
export class EmailTrackingController {
  constructor(private readonly trackingService: EmailTrackingService) {}

  @Get('o/:emailLogId')
  async trackOpen(
    @Param('emailLogId') emailLogId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
    @Res() reply: FastifyReply,
  ) {
    // Fire and forget — respond immediately, record asynchronously
    this.trackingService.trackOpen(emailLogId, ip ?? 'unknown', userAgent).catch(() => {});

    return reply
      .type('image/gif')
      .header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      .send(TRANSPARENT_GIF);
  }

  @Get('c/:emailLogId')
  async trackClick(
    @Param('emailLogId') emailLogId: string,
    @Query('u') encodedUrl: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
    @Res() reply: FastifyReply,
  ) {
    let destinationUrl = process.env.APP_URL ?? 'http://localhost:3000';

    try {
      if (encodedUrl) {
        destinationUrl = Buffer.from(encodedUrl, 'base64url').toString('utf-8');
      }
    } catch {
      // Use fallback URL if decoding fails
    }

    // Fire and forget tracking
    this.trackingService
      .trackClick(emailLogId, ip ?? 'unknown', userAgent, destinationUrl)
      .catch(() => {});

    return reply.status(302).redirect(destinationUrl);
  }

  @Get('u/:emailLogId')
  async unsubscribe(
    @Param('emailLogId') emailLogId: string,
    @Res() reply: FastifyReply,
  ) {
    const redirectTo = await this.trackingService.unsubscribe(emailLogId);
    return reply.status(302).redirect(redirectTo);
  }
}
