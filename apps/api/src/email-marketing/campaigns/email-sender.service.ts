import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface EmailPayload {
  to: string;
  from: string;
  fromName: string;
  subject: string;
  html: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  messageId?: string;
}

type EmailSettingsRow = {
  provider: string;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpSecure?: boolean;
  fromEmail?: string | null;
  fromName?: string | null;
} | null;

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getWorkspaceSettings(workspaceId: string): Promise<EmailSettingsRow> {
    return this.prisma.emailSettings.findUnique({ where: { workspaceId } });
  }

  async send(payload: EmailPayload, workspaceId?: string): Promise<void> {
    const settings = workspaceId ? await this.getWorkspaceSettings(workspaceId) : null;
    return this.sendWithSettings(payload, settings);
  }

  async sendWithSettings(payload: EmailPayload, settings: EmailSettingsRow): Promise<void> {
    const provider = settings?.provider ?? 'RESEND';

    if (provider === 'SMTP' && settings?.smtpHost && settings?.smtpUser && settings?.smtpPass) {
      return this.sendViaSMTP(payload, settings);
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && !apiKey.startsWith('re_placeholder')) {
      return this.sendViaResend(payload, apiKey);
    }

    this.logger.log(
      `[MOCK EMAIL] To: ${payload.to} | CC: ${payload.cc?.join(',')} | BCC: ${payload.bcc?.join(',')} | Subject: ${payload.subject}`,
    );
  }

  private async sendViaSMTP(payload: EmailPayload, settings: NonNullable<EmailSettingsRow>): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost!,
      port: settings.smtpPort ?? 587,
      secure: settings.smtpSecure ?? false,
      auth: { user: settings.smtpUser!, pass: settings.smtpPass! },
    });

    await transporter.sendMail({
      from: `"${payload.fromName}" <${payload.from}>`,
      to: payload.to,
      cc: payload.cc?.join(', '),
      bcc: payload.bcc?.join(', '),
      replyTo: payload.replyTo,
      subject: payload.subject,
      html: payload.html,
      headers: payload.messageId ? { 'X-Email-Log-Id': payload.messageId } : undefined,
    });
  }

  private async sendViaResend(payload: EmailPayload, apiKey: string): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${payload.fromName} <${payload.from}>`,
        to: [payload.to],
        cc: payload.cc?.length ? payload.cc : undefined,
        bcc: payload.bcc?.length ? payload.bcc : undefined,
        reply_to: payload.replyTo,
        subject: payload.subject,
        html: payload.html,
        tags: payload.messageId
          ? [{ name: 'email_log_id', value: payload.messageId }]
          : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Resend API error for ${payload.to}: ${error}`);
      throw new Error(`Email delivery failed: ${error}`);
    }
  }
}
