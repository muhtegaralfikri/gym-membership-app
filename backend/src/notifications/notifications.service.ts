import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly gmailUser?: string;
  private readonly gmailPass?: string;
  private readonly emailFrom?: string;
  private readonly resendApiKey?: string;
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {
    this.gmailUser = this.config.get<string>('GMAIL_USER');
    this.gmailPass = this.config.get<string>('GMAIL_PASS');
    this.resendApiKey = this.config.get<string>('RESEND_API_KEY');
    this.emailFrom = this.config.get<string>('EMAIL_FROM') || this.gmailUser;

    if (this.gmailUser && this.gmailPass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.gmailUser,
          pass: this.gmailPass,
        },
      });
    } else {
      this.logger.warn('GMAIL_USER or GMAIL_PASS not set; emails will be skipped.');
    }
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

    const html = this.buildBookingConfirmationHtml({
      heading: 'Booking Kelas Berhasil',
      title: payload.classTitle,
      subtitle: 'Jadwal kelas kamu sudah dikonfirmasi',
      startText,
      endText: `${endText} WIB`,
      location: payload.location,
      instructor: payload.instructor,
      bookingId: payload.bookingId,
      actionUrl,
      footerNote: 'Perlu ubah booking atau batal? Lakukan lewat aplikasi sebelum kelas dimulai.',
    });

    return this.sendEmail(payload.to, subject, text, html);
  }

  /**
   * Email konfirmasi pembayaran/member activation dengan template yang lebih kaya.
   */
  async sendMembershipPaymentEmail(payload: {
    to: string;
    userName: string;
    packageName: string;
    startDate: Date | string;
    endDate: Date | string;
  }) {
    const formatDate = (value: Date | string) =>
      new Date(value).toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

    const startText = formatDate(payload.startDate);
    const endText = formatDate(payload.endDate);
    const subject = `Pembayaran paket ${payload.packageName} berhasil`;
    const baseUrl = (this.config.get('FRONTEND_URL') || '').replace(/\/$/, '');
    const actionUrl = baseUrl ? `${baseUrl}/profile` : undefined;

    const text = [
      `Hai ${payload.userName},`,
      `Pembayaran paket ${payload.packageName} berhasil.`,
      `Aktif: ${startText} - ${endText}.`,
      actionUrl ? `Lihat detail membership di ${actionUrl}.` : '',
      'Simpan email ini sebagai bukti. Selamat berlatih!',
    ]
      .filter(Boolean)
      .join('\n');

    const html = this.buildBookingConfirmationHtml({
      heading: 'Pembayaran Berhasil',
      title: payload.packageName,
      subtitle: 'Membership kamu sudah aktif',
      startText,
      endText,
      highlightLabel: 'Periode',
      highlightValue: `${startText} s.d. ${endText}`,
      actionUrl,
      footerNote:
        'Gunakan fitur check-in tepat waktu, dan pantau riwayat transaksi serta booking kelas via aplikasi.',
    });

    return this.sendEmail(payload.to, subject, text, html);
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
      await this.sendEmail(user.email, subject, text, html);
    }
  }

  /**
   * Send email using Gmail + Nodemailer.
   */
  async sendEmail(to: string, subject: string, text: string, html?: string) {
    if (this.resendApiKey) {
      try {
        await this.sendViaResend({ to, subject, text, html });
        return { ok: true, provider: 'resend' };
      } catch (err) {
        this.logger.error(`Resend send failed: ${String(err)}`);
      }
    }

    if (!this.transporter) {
      const reason = 'No email provider configured; email skipped.';
      this.logger.warn(reason);
      return { ok: false, reason };
    }

    try {
      await this.transporter.sendMail({
        from: this.emailFrom,
        to,
        subject,
        text,
        html,
      });
      return { ok: true };
    } catch (err) {
      this.logger.error(`Email send failed: ${String(err)}`);
      return { ok: false, reason: String(err) };
    }
  }

  private async sendViaResend(params: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }) {
    if (!this.resendApiKey) {
      throw new Error('Resend API key not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.emailFrom || this.gmailUser,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend responded ${response.status}: ${body}`);
    }
  }

  private buildBookingConfirmationHtml(params: {
    heading: string;
    title: string;
    subtitle?: string;
    startText: string;
    endText: string;
    location?: string | null;
    instructor?: string | null;
    bookingId?: number;
    actionUrl?: string;
    highlightLabel?: string;
    highlightValue?: string;
    footerNote?: string;
  }) {
    const infoRows = [
      params.location
        ? `<tr>
            <td style="color:#475569;padding:4px 0;">Lokasi</td>
            <td style="font-weight:600;padding:4px 0;text-align:right;">${params.location}</td>
          </tr>`
        : '',
      params.instructor
        ? `<tr>
            <td style="color:#475569;padding:4px 0;">Instruktur/Trainer</td>
            <td style="font-weight:600;padding:4px 0;text-align:right;">${params.instructor}</td>
          </tr>`
        : '',
      params.bookingId
        ? `<tr>
            <td style="color:#475569;padding:4px 0;">ID Booking</td>
            <td style="font-weight:600;padding:4px 0;text-align:right;">#${params.bookingId}</td>
          </tr>`
        : '',
    ]
      .filter(Boolean)
      .join('');

    const infoTable = infoRows
      ? `<table role="presentation" width="100%" style="margin-bottom:10px;">${infoRows}</table>`
      : '';

    const highlight =
      params.highlightLabel && params.highlightValue
        ? `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;background:#f8fafc;margin-top:10px;">
            <table role="presentation" width="100%" style="font-weight:600;">
              <tr>
                <td style="padding:0;">${params.highlightLabel}</td>
                <td style="padding:0;text-align:right;">${params.highlightValue}</td>
              </tr>
            </table>
          </div>`
        : '';

    const cta = params.actionUrl
      ? `<a href="${params.actionUrl}" style="display:inline-block;margin-top:16px;background:#0ea5e9;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Lihat di aplikasi</a>`
      : '';

    return `
      <div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f7fb;padding:24px;color:#0f172a;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 12px 36px rgba(15,23,42,0.08);">
          <div style="background:linear-gradient(135deg,#0ea5e9,#6366f1);color:white;padding:20px 24px;">
            <div style="font-size:13px;opacity:0.9;">${params.heading}</div>
            <div style="font-size:22px;font-weight:800;margin-top:4px;">${params.title}</div>
            ${params.subtitle ? `<div style="margin-top:6px;font-size:14px;opacity:0.9;">${params.subtitle}</div>` : ''}
          </div>
          <div style="padding:24px;">
            <table role="presentation" width="100%" style="margin-bottom:12px;">
              <tr>
                <td style="vertical-align:top;padding-right:8px;">
                  <div style="font-size:13px;color:#64748b;">Mulai</div>
                  <div style="font-size:16px;font-weight:700;">${params.startText}</div>
                </td>
                <td style="vertical-align:top;padding-left:8px;text-align:right;">
                  <div style="font-size:13px;color:#64748b;">Sampai</div>
                  <div style="font-size:16px;font-weight:700;">${params.endText}</div>
                </td>
              </tr>
            </table>
            ${infoTable}
            ${highlight}
            ${cta}
            <p style="margin:18px 0 0 0;font-size:13px;color:#475569;">
              ${params.footerNote || 'Simpan email ini dan datang tepat waktu.'}
            </p>
          </div>
        </div>
        <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:14px;">Email ini dikirim otomatis, balasan tidak dipantau.</p>
      </div>
    `;
  }

  buildPTBookingHtml(params: {
    heading: string;
    title: string;
    subtitle?: string;
    startText: string;
    endText: string;
    durationMinutes: number;
    trainerName?: string;
    memberName?: string;
    role: 'member' | 'trainer';
    notes?: string | null;
    actionUrl?: string;
    footerNote?: string;
  }) {
    const infoRows = [
      params.role === 'member' && params.trainerName
        ? `<tr>
            <td style="color:#475569;padding:4px 0;">Trainer</td>
            <td style="font-weight:600;padding:4px 0;text-align:right;">${params.trainerName}</td>
          </tr>`
        : '',
      params.role === 'trainer' && params.memberName
        ? `<tr>
            <td style="color:#475569;padding:4px 0;">Member</td>
            <td style="font-weight:600;padding:4px 0;text-align:right;">${params.memberName}</td>
          </tr>`
        : '',
      `<tr>
        <td style="color:#475569;padding:4px 0;">Durasi</td>
        <td style="font-weight:600;padding:4px 0;text-align:right;">${params.durationMinutes} menit</td>
      </tr>`,
    ]
      .filter(Boolean)
      .join('');

    const infoTable = infoRows
      ? `<table role="presentation" width="100%" style="margin-bottom:10px;">${infoRows}</table>`
      : '';

    const notesBlock = params.notes
      ? `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;background:#f8fafc;margin-top:12px;">
          <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Catatan</div>
          <div style="font-size:14px;color:#0f172a;">${params.notes}</div>
        </div>`
      : '';

    const cta = params.actionUrl
      ? `<a href="${params.actionUrl}" style="display:inline-block;margin-top:16px;background:#059669;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Lihat jadwal PT</a>`
      : '';

    return `
      <div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f7fb;padding:24px;color:#0f172a;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 12px 36px rgba(15,23,42,0.08);">
          <div style="background:linear-gradient(135deg,#0ea5e9,#10b981);color:white;padding:20px 24px;">
            <div style="font-size:13px;opacity:0.9;">${params.heading}</div>
            <div style="font-size:22px;font-weight:800;margin-top:4px;">${params.title}</div>
            ${params.subtitle ? `<div style="margin-top:6px;font-size:14px;opacity:0.9;">${params.subtitle}</div>` : ''}
          </div>
          <div style="padding:24px;">
            <table role="presentation" width="100%" style="margin-bottom:12px;">
              <tr>
                <td style="vertical-align:top;padding-right:8px;">
                  <div style="font-size:13px;color:#64748b;">Mulai</div>
                  <div style="font-size:16px;font-weight:700;">${params.startText}</div>
                </td>
                <td style="vertical-align:top;padding-left:8px;text-align:right;">
                  <div style="font-size:13px;color:#64748b;">Sampai</div>
                  <div style="font-size:16px;font-weight:700;">${params.endText}</div>
                </td>
              </tr>
            </table>
            ${infoTable}
            <div style="border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;background:#f0fdf4;margin-top:6px;">
              <table role="presentation" width="100%" style="font-weight:700;color:#166534;">
                <tr>
                  <td style="padding:0;">Status</td>
                  <td style="padding:0;text-align:right;">Dikonfirmasi</td>
                </tr>
              </table>
            </div>
            ${notesBlock}
            ${cta}
            <p style="margin:18px 0 0 0;font-size:13px;color:#475569;">
              ${params.footerNote || 'Datang 10 menit lebih awal, dan sampaikan tujuan latihan ke trainer.'}
            </p>
          </div>
        </div>
        <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:14px;">Email ini dikirim otomatis, balasan tidak dipantau.</p>
      </div>
    `;
  }
}
