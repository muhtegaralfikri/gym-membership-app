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
   * Kirim email konfirmasi booking kelas dengan HTML yang rapi + teks fallback.
   */
  async sendClassBookingEmail(payload: {
    to: string;
    userName: string;
    classTitle: string;
    startTime: Date | string;
    endTime: Date | string;
    location?: string | null;
    instructor?: string | null;
    bookingId?: number;
  }) {
    const formatDateTime = (value: Date | string) =>
      new Date(value).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

    const startText = formatDateTime(payload.startTime);
    const endText = formatDateTime(payload.endTime);
    const subject = `Booking Kelas: ${payload.classTitle}`;
    const baseUrl = (this.config.get('FRONTEND_URL') || '').replace(/\/$/, '');
    const actionUrl = baseUrl ? `${baseUrl}/classes` : undefined;

    const text = [
      `Hai ${payload.userName},`,
      `Booking kelas kamu berhasil untuk "${payload.classTitle}".`,
      `Jadwal: ${startText} - ${endText} WIB.`,
      payload.location ? `Lokasi: ${payload.location}.` : '',
      payload.instructor ? `Instruktur: ${payload.instructor}.` : '',
      payload.bookingId ? `Booking ID: #${payload.bookingId}.` : '',
      actionUrl ? `Lihat detail di ${actionUrl}` : '',
      'Simpan email ini dan datang 10 menit lebih awal untuk check-in.',
    ]
      .filter(Boolean)
      .join('\n');

    const html = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f6f7fb; padding:24px; color:#0f172a;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.08);">
          <div style="background:linear-gradient(135deg,#0ea5e9,#6366f1); color:white; padding:20px 24px;">
            <div style="font-size:14px; opacity:0.9;">Booking Kelas Berhasil</div>
            <div style="font-size:22px; font-weight:700; margin-top:4px;">${payload.classTitle}</div>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px 0; font-size:15px;">Hai ${payload.userName},</p>
            <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6;">
              Booking kelas kamu sudah dikonfirmasi. Simpan detail berikut dan datang 10 menit lebih awal untuk check-in.
            </p>
            <div style="border:1px solid #e2e8f0; border-radius:10px; padding:16px; background:#f8fafc;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-weight:600; font-size:15px;">
                <span>Jadwal</span>
                <span style="text-align:right;">${startText}<br/>s.d. ${endText} WIB</span>
              </div>
              ${payload.location ? `<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px;"><span>Lokasi</span><span style="text-align:right;">${payload.location}</span></div>` : ''}
              ${payload.instructor ? `<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px;"><span>Instruktur</span><span style="text-align:right;">${payload.instructor}</span></div>` : ''}
              ${
                payload.bookingId
                  ? `<div style="display:flex; justify-content:space-between; font-size:13px; color:#475569;"><span>ID Booking</span><span>#${payload.bookingId}</span></div>`
                  : ''
              }
            </div>
            ${
              actionUrl
                ? `<div style="margin:18px 0 6px 0;">
                    <a href="${actionUrl}" style="display:inline-block; background:#0ea5e9; color:white; padding:12px 18px; border-radius:10px; text-decoration:none; font-weight:600;">Lihat jadwal di aplikasi</a>
                  </div>`
                : ''
            }
            <p style="margin:12px 0 0 0; font-size:13px; color:#475569;">
              Perlu ubah booking atau batal? Lakukan lewat aplikasi sebelum kelas dimulai.
            </p>
          </div>
        </div>
        <p style="text-align:center; font-size:12px; color:#94a3b8; margin-top:14px;">Email ini dikirim otomatis, balasan tidak dipantau.</p>
      </div>
    `;

    return this.sendEmail({ to: payload.to, subject, html, text });
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
