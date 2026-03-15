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

    // Cek user ada
    const users = await sql`SELECT id, email, name, password FROM auth_users WHERE email ILIKE ${normalizedEmail}`;
    const user = users[0];

    // Validasi password
    const passwordValid = user ? await compare(password, user.password) : false;

    if (!passwordValid) {
      // Delay kecil untuk anti-timing attack
      await new Promise(r => setTimeout(r, 300));
      return Response.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    // Rate limit: max 5 OTP request per email per 15 menit
    const recentOtps = await sql`
      SELECT COUNT(*) as count FROM login_otps
      WHERE email = ${normalizedEmail} 
        AND created_at > NOW() - INTERVAL '15 minutes'
    `;
    if (parseInt(recentOtps[0].count) >= 5) {
      return Response.json({ error: 'Terlalu banyak permintaan OTP. Coba lagi dalam 15 menit.' }, { status: 429 });
    }

    // Buat OTP baru (5 menit expired)
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await sql`
      INSERT INTO login_otps (email, otp, expires_at)
      VALUES (${normalizedEmail}, ${otp}, ${expiresAt})
    `;

    // Kirim email OTP
    await sendOtpEmail({ to: user.email, otp, name: user.name });

    return Response.json({ ok: true, message: 'Kode OTP telah dikirim ke email Anda' });

  } catch (error) {
    console.error('[send-otp] Error:', error);
    return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
