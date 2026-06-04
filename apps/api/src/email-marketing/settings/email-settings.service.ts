import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpsertEmailSettingsDto } from '../dto/email-settings.dto.js';
import { EmailSenderService } from '../campaigns/email-sender.service.js';

@Injectable()
export class EmailSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailSender: EmailSenderService,
  ) {}

  private async assertOwnerOrAdmin(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
    if (!member) throw new ForbiddenException('You do not have access to this workspace');
  }

  async getSettings(userId: string, workspaceId: string): Promise<any> {
    await this.assertOwnerOrAdmin(userId, workspaceId);
    const settings = await this.prisma.emailSettings.findUnique({ where: { workspaceId } });
    if (!settings) return null;
    // Never return the raw password
    return { ...settings, smtpPass: settings.smtpPass ? '••••••••' : null };
  }

  async upsert(userId: string, workspaceId: string, dto: UpsertEmailSettingsDto): Promise<any> {
    await this.assertOwnerOrAdmin(userId, workspaceId);

    const data = {
      provider: dto.provider,
      smtpHost: dto.smtpHost ?? null,
      smtpPort: dto.smtpPort ?? 587,
      smtpUser: dto.smtpUser ?? null,
      smtpPass: dto.smtpPass && dto.smtpPass !== '••••••••' ? dto.smtpPass : undefined,
      smtpSecure: dto.smtpSecure ?? false,
      fromEmail: dto.fromEmail ?? null,
      fromName: dto.fromName ?? null,
    };

    const settings = await this.prisma.emailSettings.upsert({
      where: { workspaceId },
      create: { workspaceId, ...data },
      update: data,
    });

    return { ...settings, smtpPass: settings.smtpPass ? '••••••••' : null };
  }

  async sendTestEmail(userId: string, workspaceId: string, to: string): Promise<{ success: boolean; message: string }> {
    await this.assertOwnerOrAdmin(userId, workspaceId);

    const settings = await this.prisma.emailSettings.findUnique({ where: { workspaceId } });

    try {
      await this.emailSender.sendWithSettings(
        {
          to,
          from: settings?.fromEmail ?? 'noreply@linkpulse.app',
          fromName: settings?.fromName ?? 'LinkPulse',
          subject: '✅ Test email from LinkPulse',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="color:#4f46e5;">Connection successful!</h2>
              <p>Your email settings are working correctly.</p>
              <p style="color:#6b7280;font-size:13px;">Sent from LinkPulse Email Marketing</p>
            </div>
          `,
        },
        settings,
      );
      return { success: true, message: 'Test email sent successfully' };
    } catch (err: any) {
      return { success: false, message: err.message ?? 'Failed to send test email' };
    }
  }
}
