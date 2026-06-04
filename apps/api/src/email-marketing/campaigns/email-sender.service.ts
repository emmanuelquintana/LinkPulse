import { Injectable, Logger } from '@nestjs/common';

export interface EmailPayload {
  to: string;
  from: string;
  fromName: string;
  subject: string;
  html: string;
  messageId?: string;
}

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);

  async send(payload: EmailPayload): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey.startsWith('re_placeholder')) {
      this.logger.log(`[MOCK EMAIL] To: ${payload.to} | Subject: ${payload.subject}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${payload.fromName} <${payload.from}>`,
        to: [payload.to],
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
