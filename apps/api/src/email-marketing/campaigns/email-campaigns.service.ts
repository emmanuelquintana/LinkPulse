import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateEmailCampaignDto } from '../dto/create-email-campaign.dto.js';
import { EmailSenderService } from './email-sender.service.js';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto.js';

@Injectable()
export class EmailCampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailSender: EmailSenderService,
  ) {}

  private async assertWorkspaceMember(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
    if (!member) throw new ForbiddenException('You do not have access to this workspace');
  }

  async create(userId: string, dto: CreateEmailCampaignDto) {
    await this.assertWorkspaceMember(userId, dto.workspaceId);

    return this.prisma.emailCampaign.create({
      data: {
        workspaceId: dto.workspaceId,
        subject: dto.subject,
        previewText: dto.previewText,
        senderEmail: dto.senderEmail,
        senderName: dto.senderName,
        htmlContent: dto.htmlContent,
        cc: dto.cc?.join(',') ?? null,
        bcc: dto.bcc?.join(',') ?? null,
        replyTo: dto.replyTo ?? null,
        status: 'DRAFT',
      },
    });
  }

  async findAll(userId: string, workspaceId: string, pagination: PaginationQueryDto) {
    await this.assertWorkspaceMember(userId, workspaceId);

    const page = pagination.page ?? 1;
    const size = pagination.limit ?? 20;
    const skip = (page - 1) * size;

    const [items, elements] = await Promise.all([
      this.prisma.emailCampaign.findMany({
        where: { workspaceId },
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailCampaign.count({ where: { workspaceId } }),
    ]);

    return { items, page, size, elements };
  }

  async findOne(userId: string, workspaceId: string, id: string) {
    await this.assertWorkspaceMember(userId, workspaceId);

    const campaign = await this.prisma.emailCampaign.findFirst({
      where: { id, workspaceId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(userId: string, workspaceId: string, id: string, dto: Partial<CreateEmailCampaignDto>) {
    await this.assertWorkspaceMember(userId, workspaceId);

    const campaign = await this.prisma.emailCampaign.findFirst({ where: { id, workspaceId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status !== 'DRAFT') throw new ConflictException('Only DRAFT campaigns can be edited');

    return this.prisma.emailCampaign.update({
      where: { id },
      data: {
        subject: dto.subject,
        previewText: dto.previewText,
        senderEmail: dto.senderEmail,
        senderName: dto.senderName,
        htmlContent: dto.htmlContent,
        cc: dto.cc !== undefined ? (dto.cc?.join(',') ?? null) : undefined,
        bcc: dto.bcc !== undefined ? (dto.bcc?.join(',') ?? null) : undefined,
        replyTo: dto.replyTo !== undefined ? (dto.replyTo ?? null) : undefined,
      },
    });
  }

  async send(userId: string, workspaceId: string, campaignId: string) {
    await this.assertWorkspaceMember(userId, workspaceId);

    const campaign = await this.prisma.emailCampaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status !== 'DRAFT') throw new ConflictException('Campaign has already been sent');

    const subscribers = await this.prisma.emailSubscriber.findMany({
      where: { workspaceId, status: 'SUBSCRIBED' },
    });

    if (!subscribers.length) return { sent: 0, message: 'No active subscribers found' };

    const redirectorUrl = process.env.REDIRECTOR_URL ?? 'http://localhost:3002';
    const settings = await this.emailSender.getWorkspaceSettings(workspaceId);

    const ccList = campaign.cc ? campaign.cc.split(',').map((e: string) => e.trim()).filter(Boolean) : [];
    const bccList = campaign.bcc ? campaign.bcc.split(',').map((e: string) => e.trim()).filter(Boolean) : [];

    await this.prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    });

    let sent = 0;

    for (const subscriber of subscribers) {
      const log = await this.prisma.emailLog.create({
        data: {
          campaignId,
          subscriberId: subscriber.id,
          status: 'PENDING',
          sentAt: new Date(),
        },
      });

      const personalizedHtml = this.buildPersonalizedHtml(
        campaign.htmlContent,
        log.id,
        redirectorUrl,
        subscriber.firstName ?? '',
      );

      try {
        await this.emailSender.sendWithSettings(
          {
            to: subscriber.email,
            from: settings?.fromEmail ?? campaign.senderEmail,
            fromName: settings?.fromName ?? campaign.senderName,
            subject: campaign.subject,
            html: personalizedHtml,
            cc: ccList.length ? ccList : undefined,
            bcc: bccList.length ? bccList : undefined,
            replyTo: campaign.replyTo ?? undefined,
            messageId: log.id,
          },
          settings,
        );

        await this.prisma.emailLog.update({
          where: { id: log.id },
          data: { status: 'DELIVERED', sentAt: new Date() },
        });

        sent++;
      } catch {
        await this.prisma.emailLog.update({
          where: { id: log.id },
          data: { status: 'BOUNCED' },
        });
      }
    }

    await this.prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENT', sentAt: new Date() },
    });

    return { sent, total: subscribers.length };
  }

  private buildPersonalizedHtml(
    htmlContent: string,
    emailLogId: string,
    redirectorUrl: string,
    firstName: string,
  ): string {
    let html = htmlContent.replace(
      /<a\s+([^>]*?)href="([^"]+)"([^>]*?)>/gi,
      (_match, before, url, after) => {
        const encoded = Buffer.from(url).toString('base64url');
        const trackingUrl = `${redirectorUrl}/t/c/${emailLogId}?u=${encoded}`;
        return `<a ${before}href="${trackingUrl}"${after}>`;
      },
    );

    const pixel = `<img src="${redirectorUrl}/t/o/${emailLogId}" width="1" height="1" style="display:none;border:0;" alt="" />`;
    html = html.includes('</body>') ? html.replace('</body>', `${pixel}</body>`) : html + pixel;

    const unsubUrl = `${redirectorUrl}/t/u/${emailLogId}`;
    const footer = `
<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
  <p>You received this email because you subscribed to our list.</p>
  <p><a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a></p>
</div>`;

    html = html.includes('</body>') ? html.replace('</body>', `${footer}</body>`) : html + footer;
    return html.replace(/\{\{firstName\}\}/gi, firstName);
  }
}
