import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';
import { DeviceType } from '@linkpulse/db';

@Injectable()
export class EmailTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async trackOpen(emailLogId: string, ip: string, userAgent: string | undefined): Promise<void> {
    try {
      const log = await this.prisma.emailLog.findUnique({ where: { id: emailLogId } });
      if (!log) return;

      const { browser, os, deviceType } = this.parseUA(userAgent);
      const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

      await Promise.all([
        this.prisma.emailOpen.create({
          data: {
            emailLogId,
            ipHash,
            userAgent: userAgent?.substring(0, 2000) ?? null,
            browser,
            os,
            deviceType,
          },
        }),
        this.prisma.emailLog.update({
          where: { id: emailLogId },
          data: {
            status: log.status === 'DELIVERED' ? 'OPENED' : log.status,
            openedAt: log.openedAt ?? new Date(),
          },
        }),
      ]);
    } catch {
      // Fire and forget — swallow errors
    }
  }

  async trackClick(
    emailLogId: string,
    ip: string,
    userAgent: string | undefined,
    url: string,
  ): Promise<string | null> {
    try {
      const log = await this.prisma.emailLog.findUnique({ where: { id: emailLogId } });
      if (!log) return null;

      const { browser, os, deviceType } = this.parseUA(userAgent);
      const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

      await Promise.all([
        this.prisma.emailClick.create({
          data: {
            emailLogId,
            url,
            ipHash,
            userAgent: userAgent?.substring(0, 2000) ?? null,
            browser,
            os,
            deviceType,
          },
        }),
        this.prisma.emailLog.update({
          where: { id: emailLogId },
          data: {
            status: 'CLICKED',
            clickedAt: log.clickedAt ?? new Date(),
          },
        }),
      ]);

      return url;
    } catch {
      return url;
    }
  }

  async unsubscribe(emailLogId: string): Promise<string> {
    const frontendUrl = process.env.APP_URL ?? 'http://localhost:3000';

    try {
      const log = await this.prisma.emailLog.findUnique({
        where: { id: emailLogId },
        include: { subscriber: true },
      });

      if (log?.subscriber) {
        await this.prisma.emailSubscriber.update({
          where: { id: log.subscriber.id },
          data: { status: 'UNSUBSCRIBED' },
        });
      }
    } catch {
      // Continue to redirect even on DB error
    }

    return `${frontendUrl}/unsubscribe-success`;
  }

  private parseUA(userAgent: string | undefined) {
    const parser = new UAParser(userAgent);
    const parsed = parser.getResult();

    const browser = parsed.browser.name
      ? `${parsed.browser.name} ${parsed.browser.version ?? ''}`.trim()
      : null;
    const os = parsed.os.name
      ? `${parsed.os.name} ${parsed.os.version ?? ''}`.trim()
      : null;

    let deviceType: DeviceType = DeviceType.UNKNOWN;
    if (parsed.device.type === 'mobile') deviceType = DeviceType.MOBILE;
    else if (parsed.device.type === 'tablet') deviceType = DeviceType.TABLET;
    else if (!parsed.device.type && parsed.os.name) deviceType = DeviceType.DESKTOP;

    if (userAgent?.toLowerCase().includes('bot') || userAgent?.toLowerCase().includes('spider')) {
      deviceType = DeviceType.BOT;
    }

    return { browser, os, deviceType };
  }
}
