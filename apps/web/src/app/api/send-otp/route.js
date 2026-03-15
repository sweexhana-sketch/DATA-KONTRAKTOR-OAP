/**
 * POST /api/auth/send-otp
 * Step 1 login: validasi email+password, kirim OTP 6 digit ke email
 */
import sql from '@/app/api/utils/sql';
import { compare } from 'bcryptjs';
import { sendOtpEmail } from '@/app/api/auth/utils/mailer';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request, context, c) {
  try {
    let body;
    if (c) {
      body = await c.req.json();
    } else {
      body = await request.json();
    }
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Database Check
    let user;
    try {
      const users = await sql`SELECT id, email, name, password FROM auth_users WHERE email ILIKE ${normalizedEmail}`;
      user = users[0];
    } catch (e) {
      return Response.json({ error: `ERR_DB: ${e.message}` }, { status: 500 });
    }

    // 2. Password Validation
    let passwordValid;
    try {
      passwordValid = user ? await compare(password, user.password) : false;
    } catch (e) {
      return Response.json({ error: `ERR_BCRYPT: ${e.message}` }, { status: 500 });
    }

    if (!passwordValid) {
      return Response.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    // 3. Rate Limit check
    try {
      const recentOtps = await sql`
        SELECT COUNT(*) as count FROM login_otps
        WHERE email = ${normalizedEmail} 
          AND created_at > NOW() - INTERVAL '15 minutes'
      `;
      if (parseInt(recentOtps[0].count) >= 5) {
        return Response.json({ error: 'Terlalu banyak permintaan OTP. Coba lagi dalam 15 menit.' }, { status: 429 });
      }
    } catch (e) {
      return Response.json({ error: `ERR_LIMIT: ${e.message}` }, { status: 500 });
    }

    // 4. Create OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    try {
      await sql`
        INSERT INTO login_otps (email, otp, expires_at)
        VALUES (${normalizedEmail}, ${otp}, ${expiresAt})
      `;
    } catch (e) {
      return Response.json({ error: `ERR_STORAGE: ${e.message}` }, { status: 500 });
    }

    // 5. Send Email (Awaited for debug)
    try {
      await sendOtpEmail({ to: user.email, otp, name: user.name });
    } catch (e) {
      return Response.json({ error: `ERR_MAIL: ${e.message}` }, { status: 500 });
    }

    return Response.json({ ok: true, message: 'Kode OTP telah dikirim ke email Anda' });

  } catch (error) {
    console.error('[send-otp] Panic Error:', error);
    return Response.json({ error: `PANIC: ${error.message}` }, { status: 500 });
  }
}
