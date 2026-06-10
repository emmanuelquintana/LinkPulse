import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpsertEmailSettingsDto } from '../dto/email-settings.dto.js';
import { EmailSenderService } from '../campaigns/email-sender.service.js';
import { testEmailTemplate } from '../templates/email-templates.js';

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

  async getSettings(userId: string, workspaceId: string) {
    await this.assertOwnerOrAdmin(userId, workspaceId);
    const settings = await this.prisma.emailSettings.findUnique({ where: { workspaceId } });
    if (!settings) return null;
    // Never return raw secrets
    return {
      ...settings,
      smtpPass: settings.smtpPass ? '••••••••' : null,
      resendApiKey: settings.resendApiKey ? '••••••••' : null,
    };
  }

  async upsert(userId: string, workspaceId: string, dto: UpsertEmailSettingsDto) {
    await this.assertOwnerOrAdmin(userId, workspaceId);

    const MASK = '••••••••';
    const isResend = dto.provider === 'RESEND';

    // Campos segregados por proveedor: con RESEND limpiamos los de SMTP (y
    // viceversa) para no mezclar datos ni filtrar secretos en campos ajenos.
    const data = {
      provider: dto.provider,
      smtpHost: isResend ? null : dto.smtpHost ?? null,
      smtpPort: dto.smtpPort ?? 587,
      smtpUser: isResend ? null : dto.smtpUser ?? null,
      smtpPass: isResend
        ? null
        : dto.smtpPass && dto.smtpPass !== MASK
          ? dto.smtpPass
          : undefined,
      smtpSecure: isResend ? false : dto.smtpSecure ?? false,
      resendApiKey: isResend
        ? dto.resendApiKey && dto.resendApiKey !== MASK
          ? dto.resendApiKey
          : undefined
        : null,
      fromEmail: dto.fromEmail ?? null,
      fromName: dto.fromName ?? null,
    };

    const settings = await this.prisma.emailSettings.upsert({
      where: { workspaceId },
      create: { workspaceId, ...data },
      update: data,
    });

    return {
      ...settings,
      smtpPass: settings.smtpPass ? '••••••••' : null,
      resendApiKey: settings.resendApiKey ? '••••••••' : null,
    };
  }

  async sendTestEmail(userId: string, workspaceId: string, to: string): Promise<{ success: boolean; message: string }> {
    await this.assertOwnerOrAdmin(userId, workspaceId);

    const settings = await this.prisma.emailSettings.findUnique({ where: { workspaceId } });

    try {
      const { subject, html } = testEmailTemplate();
      await this.emailSender.sendWithSettings(
        {
          to,
          from: settings?.fromEmail ?? 'noreply@linkpulse.app',
          fromName: settings?.fromName ?? 'LinkPulse',
          subject,
          html,
        },
        settings,
      );
      return { success: true, message: 'Test email sent successfully' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send test email';
      return { success: false, message };
    }
  }
}
