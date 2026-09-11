/**
 * POST /api/auth/send-otp
 * Step 1 login: validasi email+password, kirim OTP 6 digit via WhatsApp
 */
import sql from '@/app/api/utils/sql';
import { compare } from 'bcryptjs';
import { sendOtpWhatsApp } from '@/app/api/auth/utils/whatsapp';
import { verifyCsrf } from '@/app/api/utils/csrf';
import { sanitizeEmail } from '@/app/api/utils/sanitize';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request, context, c) {
  try {
    // CSRF check
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;

    let body;
    if (c) {
      body = await c.req.json();
    } else {
      body = await request.json();
    }

    const email    = sanitizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return Response.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Cek User & Password
    const users = await sql`SELECT id, email, name, password, phone FROM auth_users WHERE email ILIKE ${normalizedEmail}`;
    const user = users[0];

    const passwordValid = user ? await compare(password, user.password) : false;
    if (!passwordValid) {
      return Response.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    if (!user.phone) {
      return Response.json({ error: 'Akun ini belum memiliki Nomor WhatsApp. Hubungi admin.' }, { status: 400 });
    }

    // 2. Rate limit: max 5 OTP request per email per 15 menit
    const recentOtps = await sql`
      SELECT COUNT(*) as count FROM login_otps
      WHERE email = ${normalizedEmail} 
        AND created_at > NOW() - INTERVAL '15 minutes'
    `;
    if (parseInt(recentOtps[0].count) >= 5) {
      return Response.json({ error: 'Terlalu banyak permintaan OTP. Coba lagi dalam 15 menit.' }, { status: 429 });
    }

    // 3. Buat OTP baru (5 menit expired)
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await sql`
      INSERT INTO login_otps (email, otp, expires_at)
      VALUES (${normalizedEmail}, ${otp}, ${expiresAt})
    `;

    // 4. Kirim WhatsApp OTP
    await sendOtpWhatsApp({ phone: user.phone, otp, name: user.name });

    // Jangan mengirim nomor HP secara utuh sebagai respons untuk privasi, cukup sebagian
    const maskedPhone = user.phone.slice(0, 4) + '****' + user.phone.slice(-3);

    return Response.json({ ok: true, message: `Kode OTP telah dikirim ke WhatsApp Anda (${maskedPhone})` });

  } catch (error) {
    console.error('[send-otp] Error:', error);
    return Response.json({ error: 'Terjadi kesalahan pada sistem. Silakan coba lagi.' }, { status: 500 });
  }
}

