import { Injectable } from '@nestjs/common';
import { UpstashRedisService } from '../common/upstash-redis.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';
import { DeviceType } from '@linkpulse/db';

interface CachedLink {
  id: string;
  originalUrl: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED' | 'EXPIRED';
  expiresAt: string | null;
}

@Injectable()
export class RedirectService {
  constructor(
    private readonly redis: UpstashRedisService,
    private readonly prisma: PrismaService,
  ) {}

  async checkRateLimit(ipAddress: string) {
    const windowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 60);
    const max = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 60);
    const count = await this.redis.incrementRateLimit(`rl:${ipAddress}`, windowSeconds);

    return {
      allowed: count <= max,
      count,
      max,
    };
  }

  async resolveShortCode(shortCode: string): Promise<CachedLink | null> {
    const cached = await this.redis.get<CachedLink>(`short:${shortCode}`);
    if (cached) {
      console.log(`[Cache Hit] Resolved shortCode: ${shortCode}`);
      if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
        return { ...cached, status: 'EXPIRED' };
      }
      return cached;
    }

    console.log(`[Cache Miss] Resolving shortCode from DB: ${shortCode}`);

    // Consult Prisma/Supabase Postgres
    // Search by both shortCode and customAlias
    const link = await this.prisma.link.findFirst({
      where: {
        OR: [
          { shortCode },
          { customAlias: shortCode },
        ],
      },
      select: { id: true, originalUrl: true, status: true, expiresAt: true },
    });

    if (!link) {
      return null;
    }

    const payload: CachedLink = {
      id: link.id,
      originalUrl: link.originalUrl,
      status: link.status as 'ACTIVE' | 'ARCHIVED' | 'BLOCKED' | 'EXPIRED',
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
    };

    await this.redis.set(`short:${shortCode}`, payload, 60 * 5); // 5 min TTL as default

    if (payload.expiresAt && new Date(payload.expiresAt) < new Date()) {
      return { ...payload, status: 'EXPIRED' };
    }

    return payload;
  }

  async recordClick(
    linkId: string,
    ipAddress: string,
    userAgent: string | undefined,
    referer: string | undefined,
  ): Promise<void> {
    try {
      // 1. Hash IP address for privacy
      const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');

      // 2. Parse User-Agent using ua-parser-js
      const parser = new UAParser(userAgent);
      const parsed = parser.getResult();
      
      const browser = parsed.browser.name ? `${parsed.browser.name} ${parsed.browser.version || ''}`.trim() : null;
      const os = parsed.os.name ? `${parsed.os.name} ${parsed.os.version || ''}`.trim() : null;
      let deviceType: DeviceType = DeviceType.UNKNOWN;

      if (parsed.device.type === 'mobile') {
        deviceType = DeviceType.MOBILE;
      } else if (parsed.device.type === 'tablet') {
        deviceType = DeviceType.TABLET;
      } else if (!parsed.device.type && parsed.os.name) {
        deviceType = DeviceType.DESKTOP; // Fallback heuristic
      }

      // Quick detection for bots
      if (userAgent?.toLowerCase().includes('bot') || userAgent?.toLowerCase().includes('spider')) {
         deviceType = DeviceType.BOT;
      }

      // Geo lookup can be added here optionally later with something like maxmind or vercel geo headers
      const country = null;
      const city = null;

      // UTM parser from URL will happen later or if the redirector passes full URL query params
      // For now we leave UTM tracking placeholders null

      await this.prisma.clickEvent.create({
        data: {
          linkId,
          ipHash,
          userAgent: userAgent && userAgent.length > 2000 ? userAgent.substring(0, 2000) : userAgent || null,
          browser,
          os,
          deviceType,
          referer: referer && referer.length > 2000 ? referer.substring(0, 2000) : referer || null,
          country,
          city,
        },
      });
    } catch (error) {
       console.error(`Failed to record click event for link ${linkId}`, error);
    }
  }

  getFallbackUrl() {
    return process.env.DEFAULT_REDIRECT_FALLBACK_URL ?? 'http://localhost:3000/not-found';
  }
}
