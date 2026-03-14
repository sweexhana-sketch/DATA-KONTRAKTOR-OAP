/**
 * Utility kirim email OTP via nodemailer (Gmail SMTP)
 * Env vars:
 *   SMTP_USER  = your-email@gmail.com
 *   SMTP_PASS  = App Password Gmail (16 karakter)
 *   SMTP_FROM  = "Dinas PUPR Papua Barat Daya <your-email@gmail.com>"
 */
import nodemailer from 'nodemailer';

/** Cek apakah SMTP sudah dikonfigurasi dengan benar (bukan placeholder) */
function isSmtpConfigured() {
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  return (
    user.length > 0 &&
    pass.length > 0 &&
    !user.includes('GANTI') &&
    !pass.includes('GANTI')
  );
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendOtpEmail({ to, otp, name }) {
  // Jika SMTP belum dikonfigurasi, tampilkan OTP di console (dev mode)
  if (!isSmtpConfigured()) {
    console.warn('[mailer] SMTP belum dikonfigurasi — OTP tidak dikirim via email.');
    console.log(`\n=============================`);
    console.log(`  OTP untuk ${to}: ${otp}`);
    console.log(`=============================\n`);
    return; // Tidak throw — biarkan flow login tetap berjalan
  }

  try {
    const transporter = createTransport();
    const from = process.env.SMTP_FROM || `"Dinas PUPR Papua Barat Daya" <${process.env.SMTP_USER}>`;

    await transporter.sendMail({
      from,
      to,
      subject: `Kode OTP Login — Sistem Pendataan Kontraktor OAP`,
      html: `
        <!DOCTYPE html>
        <html lang="id">
        <body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#1a3a6b,#2563eb);padding:32px;text-align:center;">
                    <p style="color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 4px;">Pemerintah Provinsi</p>
                    <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 4px;">Papua Barat Daya</h1>
                    <div style="width:40px;height:3px;background:#facc15;margin:10px auto 6px;border-radius:2px;"></div>
                    <p style="color:#fde68a;font-size:14px;font-weight:700;margin:0;">Dinas PUPR</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px 28px;">
                    <p style="color:#374151;font-size:15px;margin:0 0 8px;">Halo, <strong>${name || 'Pengguna'}</strong></p>
                    <p style="color:#6b7280;font-size:14px;margin:0 0 28px;line-height:1.6;">
                      Gunakan kode OTP berikut untuk menyelesaikan proses login ke Sistem Pendataan Kontraktor OAP.
                      Kode ini berlaku selama <strong>5 menit</strong> dan hanya dapat digunakan sekali.
                    </p>
                    <!-- OTP Box -->
                    <div style="background:#f0f4ff;border:2px dashed #bfdbfe;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                      <p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Kode OTP Anda</p>
                      <p style="font-size:44px;font-weight:900;letter-spacing:12px;color:#1a3a6b;margin:0;font-family:'Courier New',monospace;">${otp}</p>
                    </div>
                    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
                      Jika Anda tidak mencoba login, abaikan email ini.<br>
                      Jangan bagikan kode ini kepada siapapun.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:11px;margin:0;">
                      © 2025 Dinas PUPR Provinsi Papua Barat Daya<br>
                      Sistem Pendataan Kontraktor OAP
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`[mailer] OTP berhasil dikirim ke ${to}`);
  } catch (err) {
    // Jangan throw — catat error tapi biarkan OTP flow tetap jalan
    console.error('[mailer] Gagal kirim email OTP:', err.message);
    console.log(`[mailer] OTP untuk ${to} (fallback console): ${otp}`);
  }
}
