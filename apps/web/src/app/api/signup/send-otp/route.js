/**
 * POST /api/signup/send-otp
 * Step 1 Signup: Cek ketersediaan email dan kirim OTP
 */
import sql from '@/app/api/utils/sql';
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
    const { email } = body;

    if (!email) {
      return Response.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Cek apakah email sudah terdaftar
    const existing = await sql`SELECT id FROM auth_users WHERE email = ${normalizedEmail}`;
    if (existing.length > 0) {
      return Response.json({ error: 'Email sudah terdaftar. Silakan login.' }, { status: 400 });
    }

    // 2. Rate limit (opsional tapi bagus)
    const recentOtps = await sql`
      SELECT COUNT(*) as count FROM login_otps
      WHERE email = ${normalizedEmail} 
        AND created_at > NOW() - INTERVAL '15 minutes'
    `;
    if (parseInt(recentOtps[0].count) >= 5) {
      return Response.json({ error: 'Terlalu banyak permintaan OTP. Coba lagi nanti.' }, { status: 429 });
    }

    // 3. Buat OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    await sql`
      INSERT INTO login_otps (email, otp, expires_at)
      VALUES (${normalizedEmail}, ${otp}, ${expiresAt})
    `;

    // 4. Kirim email (Awaited agar reliabel di Vercel)
    await sendOtpEmail({ to: normalizedEmail, otp, name: 'Calon Pengguna' });

    return Response.json({ ok: true, message: 'Kode OTP telah dikirim ke email Anda' });

  } catch (error) {
    console.error('[signup-send-otp] Error:', error);
    return Response.json({ error: 'Terjadi kesalahan pada sistem. Silakan coba lagi.' }, { status: 500 });
  }
}
