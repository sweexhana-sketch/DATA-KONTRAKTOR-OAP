/**
 * POST /api/signup/send-otp
 * Step 1 Signup: Cek ketersediaan email, simpan draft phone, dan kirim OTP via WA
 */
import sql from '@/app/api/utils/sql';
import { sendOtpWhatsApp } from '@/app/api/auth/utils/whatsapp';
import { verifyCsrf } from '@/app/api/utils/csrf';
import { sanitizeEmail, sanitizePhone } from '@/app/api/utils/sanitize';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request, context, c) {
  try {
    // CSRF check (mendukung Next.js dan Hono context)
    const csrfError = verifyCsrf(request, c);
    if (csrfError) return csrfError;

    let body;
    if (c) {
      body = await c.req.json();
    } else {
      body = await request.json();
    }

    const email = sanitizeEmail(body.email);
    const phone = sanitizePhone(body.phone);

    if (!email || !phone) {
      return Response.json({ error: 'Email dan Nomor HP/WhatsApp wajib diisi' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Cek apakah email sudah terdaftar
    const existing = await sql`SELECT id FROM auth_users WHERE email = ${normalizedEmail}`;
    if (existing.length > 0) {
      return Response.json({ error: 'Email sudah terdaftar. Silakan login.' }, { status: 400 });
    }

    // 2. Cek apakah nomor HP sudah dipakai (Opsional, tergantung aturan Anda. Saat ini kita biarkan bebas).
    const existingPhone = await sql`SELECT id FROM auth_users WHERE phone = ${phone}`;
    if (existingPhone.length > 0) {
      return Response.json({ error: 'Nomor WhatsApp sudah digunakan akun lain.' }, { status: 400 });
    }

    // 3. Rate limit (opsional tapi bagus)
    const recentOtps = await sql`
      SELECT COUNT(*) as count FROM login_otps
      WHERE email = ${normalizedEmail} 
        AND created_at > NOW() - INTERVAL '15 minutes'
    `;
    if (parseInt(recentOtps[0].count) >= 5) {
      return Response.json({ error: 'Terlalu banyak permintaan OTP. Coba lagi nanti.' }, { status: 429 });
    }

    // 4. Buat OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    // Catatan: kita simpan OTP berdasar email (sebagai ID registrasi sementara)
    await sql`
      INSERT INTO login_otps (email, otp, expires_at)
      VALUES (${normalizedEmail}, ${otp}, ${expiresAt})
    `;

    // 5. Kirim WhatsApp
    try {
      await sendOtpWhatsApp({ phone: phone, otp, name: 'Calon Pengguna' });
    } catch (waError) {
      console.error('[signup-send-otp] WhatsApp error:', waError.message);
      return Response.json({ 
        error: waError.message || 'Gagal mengirim OTP ke WhatsApp. Pastikan nomor WhatsApp valid dan coba lagi.' 
      }, { status: 500 });
    }

    return Response.json({ ok: true, message: 'Kode OTP telah dikirim ke WhatsApp Anda' });

  } catch (error) {
    console.error('[signup-send-otp] Error:', error);
    return Response.json({ error: 'Terjadi kesalahan pada sistem. Silakan coba lagi.' }, { status: 500 });
  }
}

