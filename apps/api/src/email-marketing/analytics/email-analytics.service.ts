import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class EmailAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCampaignStats(userId: string, workspaceId: string, campaignId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
    if (!member) throw new ForbiddenException('You do not have access to this workspace');

    const campaign = await this.prisma.emailCampaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const logs = await this.prisma.emailLog.findMany({
      where: { campaignId },
      include: { opens: true, clicks: true },
    });

    const total = logs.length;
    const delivered = logs.filter((l: any) => ['DELIVERED', 'OPENED', 'CLICKED'].includes(l.status)).length;
    const bounced = logs.filter((l: any) => l.status === 'BOUNCED').length;
    const spam = logs.filter((l: any) => l.status === 'SPAM').length;

    const uniqueOpens = logs.filter((l: any) => l.opens.length > 0).length;
    const uniqueClicks = logs.filter((l: any) => l.clicks.length > 0).length;
    const unsubscribed = await this.prisma.emailSubscriber.count({
      where: {
        workspaceId,
        status: 'UNSUBSCRIBED',
        logs: { some: { campaignId } },
      },
    });

    const openRate = delivered > 0 ? (uniqueOpens / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (uniqueClicks / delivered) * 100 : 0;
    const bounceRate = total > 0 ? (bounced / total) * 100 : 0;
    const unsubscribeRate = delivered > 0 ? (unsubscribed / delivered) * 100 : 0;

    // Device breakdown from opens
    const allOpens = logs.flatMap((l: any) => l.opens);
    const deviceBreakdown = this.countByField(allOpens, 'deviceType');

    // OS breakdown from opens
    const osBreakdown = this.countByField(allOpens, 'os');

    // Top clicked URLs
    const allClicks = logs.flatMap((l: any) => l.clicks);
    const urlCounts: Record<string, number> = {};
    for (const click of allClicks) {
      urlCounts[click.url] = (urlCounts[click.url] ?? 0) + 1;
    }
    const topLinks = Object.entries(urlCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([url, count]) => ({ url, count }));

    // Activity timeline (opens + clicks per day)
    const timeline = this.buildTimeline(logs);

    return {
      campaign: {
        id: campaign.id,
        subject: campaign.subject,
        status: campaign.status,
        sentAt: campaign.sentAt,
      },
      summary: {
        total,
        delivered,
        bounced,
        spam,
        uniqueOpens,
        uniqueClicks,
        unsubscribed,
      },
      rates: {
        openRate: +openRate.toFixed(2),
        clickRate: +clickRate.toFixed(2),
        bounceRate: +bounceRate.toFixed(2),
        unsubscribeRate: +unsubscribeRate.toFixed(2),
      },
      deviceBreakdown,
      osBreakdown,
      topLinks,
      timeline,
    };
  }

  private countByField(items: Array<Record<string, any>>, field: string) {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const key = item[field] ?? 'UNKNOWN';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }

  private buildTimeline(logs: Array<{ opens: Array<{ openedAt: Date }>; clicks: Array<{ clickedAt: Date }> }>) {
    const days: Record<string, { opens: number; clicks: number }> = {};

    for (const log of logs) {
      for (const open of log.opens) {
        const day = open.openedAt.toISOString().split('T')[0];
        if (!days[day]) days[day] = { opens: 0, clicks: 0 };
        days[day].opens++;
      }
      for (const click of log.clicks) {
        const day = click.clickedAt.toISOString().split('T')[0];
        if (!days[day]) days[day] = { opens: 0, clicks: 0 };
        days[day].clicks++;
      }
    }

    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));
  }
}
