import { Controller, Get, Headers, Ip, Param, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { RedirectService } from './redirect.service.js';

@Controller()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get(':shortCode')
  async redirect(
    @Param('shortCode') shortCode: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string | undefined,
    @Res() reply: FastifyReply,
  ) {
    const rateLimit = await this.redirectService.checkRateLimit(ipAddress ?? 'unknown');

    if (!rateLimit.allowed) {
      return reply.status(429).send({
        message: 'Too many requests',
        userAgent: userAgent ?? null,
      });
    }

    const link = await this.redirectService.resolveShortCode(shortCode);
    console.log(`[Redirect] Resolved link for ${shortCode}:`, link);

    if (!link || link.status !== 'ACTIVE') {
      const fallback = this.redirectService.getFallbackUrl();
      console.log(`[Redirect] Link not active or not found. Redirecting to fallback: ${fallback}`);
      return reply.redirect(fallback);
    }

    // Fire and forget click tracking
    const referer = reply.request?.headers?.referer;
    this.redirectService.recordClick(link.id, ipAddress ?? 'unknown', userAgent, referer).catch(err => {
      console.error('Failed to log click event in background', err);
    });

    console.log(`[Redirect] Redirecting to: "${link.originalUrl}"`);
    
    // Ensure URL is absolute for redirect
    let target = link.originalUrl;
    if (!target.startsWith('http')) {
      target = `http://${target}`;
    }

    return reply.status(302).redirect(target);
  }
}
