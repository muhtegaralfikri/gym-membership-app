import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type EmailPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly emailApiKey?: string;
  private readonly emailFrom?: string;

  constructor(private readonly config: ConfigService) {
    this.emailApiKey = this.config.get<string>('RESEND_API_KEY');
    this.emailFrom = this.config.get<string>('EMAIL_FROM');
  }

  /**
   * Lightweight email sender using Resend-style HTTP API.
   * Free tier friendly; replace endpoint if you use another provider.
   */
  async sendEmail(payload: EmailPayload) {
    if (!this.emailApiKey || !(payload.from || this.emailFrom)) {
      const reason = 'Email provider not configured (missing RESEND_API_KEY or EMAIL_FROM).';
      this.logger.warn(reason);
      return { ok: false, reason };
    }

    const endpoint = 'https://api.resend.com/emails';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.emailApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: payload.from || this.emailFrom,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      this.logger.error(`Email send failed: ${res.status} ${res.statusText} - ${errorText}`);
      return { ok: false, reason: errorText };
    }

    return { ok: true };
  }

  /**
   * Convenience helper for renewal reminder message (email only).
   */
  async notifyRenewalReminder(user: { name: string; email?: string }, daysLeft: number) {
    const subject = `Paket Anda habis ${daysLeft} hari lagi`;
    const html = `<p>Halo ${user.name},</p>
      <p>Paket membership Anda berakhir dalam ${daysLeft} hari. Perpanjang sekarang dan hemat dengan kode <strong>SETIA10</strong>.</p>
      <p><a href="${this.config.get('FRONTEND_URL') || '#'}">Perpanjang sekarang</a></p>`;
    const text = `Halo ${user.name}, paket membership Anda berakhir dalam ${daysLeft} hari. Gunakan kode SETIA10 untuk diskon.`;

    if (user.email) {
      await this.sendEmail({ to: user.email, subject, html, text });
    }
  }
}
