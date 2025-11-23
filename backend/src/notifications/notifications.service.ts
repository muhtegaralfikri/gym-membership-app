import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type EmailPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

type WhatsAppPayload = {
  to: string;
  message: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly emailApiKey?: string;
  private readonly emailFrom?: string;
  private readonly waToken?: string;
  private readonly waPhoneNumberId?: string;

  constructor(private readonly config: ConfigService) {
    this.emailApiKey = this.config.get<string>('RESEND_API_KEY');
    this.emailFrom = this.config.get<string>('EMAIL_FROM');
    this.waToken = this.config.get<string>('WA_TOKEN');
    this.waPhoneNumberId = this.config.get<string>('WA_PHONE_NUMBER_ID');
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
   * Sends plain text WhatsApp message via Meta Cloud API (cheapest entry).
   * Assumes the user already has an active conversation; otherwise use a template.
   */
  async sendWhatsAppText(payload: WhatsAppPayload) {
    if (!this.waToken || !this.waPhoneNumberId) {
      const reason = 'WhatsApp not configured (missing WA_TOKEN or WA_PHONE_NUMBER_ID).';
      this.logger.warn(reason);
      return { ok: false, reason };
    }

    const phone = this.normalizeMsisdn(payload.to);
    if (!phone) {
      const reason = 'Nomor WhatsApp tidak valid.';
      this.logger.warn(reason);
      return { ok: false, reason };
    }

    const url = `https://graph.facebook.com/v18.0/${this.waPhoneNumberId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.waToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { preview_url: false, body: payload.message },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      this.logger.error(`WhatsApp send failed: ${res.status} ${res.statusText} - ${errorText}`);
      return { ok: false, reason: errorText };
    }

    return { ok: true };
  }

  /**
   * Convenience helper for renewal reminder message (email + WA).
   */
  async notifyRenewalReminder(user: { name: string; email?: string; phone?: string }, daysLeft: number) {
    const subject = `Paket Anda habis ${daysLeft} hari lagi`;
    const html = `<p>Halo ${user.name},</p>
      <p>Paket membership Anda berakhir dalam ${daysLeft} hari. Perpanjang sekarang dan hemat dengan kode <strong>SETIA10</strong>.</p>
      <p><a href="${this.config.get('FRONTEND_URL') || '#'}">Perpanjang sekarang</a></p>`;
    const text = `Halo ${user.name}, paket membership Anda berakhir dalam ${daysLeft} hari. Gunakan kode SETIA10 untuk diskon.`;

    if (user.email) {
      await this.sendEmail({ to: user.email, subject, html, text });
    }
    if (user.phone) {
      await this.sendWhatsAppText({ to: user.phone, message: text });
    }
  }

  /**
   * Basic validation/normalization for E.164 numbers.
   */
  private normalizeMsisdn(input: string) {
    const digits = input.replace(/[^\d+]/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('0')) {
      // assume Indonesian default country code 62
      return `+62${digits.slice(1)}`;
    }
    if (/^\d+$/.test(digits)) return `+${digits}`;
    return null;
  }
}
