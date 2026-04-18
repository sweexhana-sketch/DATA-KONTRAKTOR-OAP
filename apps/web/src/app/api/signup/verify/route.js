/**
 * POST /api/signup/verify
 * Step 2 Signup: Verifikasi OTP dan buat akun
 */
import sql from '@/app/api/utils/sql';
import { hash } from 'bcryptjs';
import { syncToGoogleSheets } from '@/app/api/utils/google-sheets';

export async function POST(request, context, c) {
  try {
    let body;
    if (c) {
      body = await c.req.json();
    } else {
      body = await request.json();
    }
    const { email, password, name, otp } = body;

    if (!email || !password || !name || !otp) {
      return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verifikasi OTP
    const otps = await sql`
      SELECT * FROM login_otps 
      WHERE email = ${normalizedEmail} 
        AND otp = ${otp} 
        AND used = false 
        AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;

    if (otps.length === 0) {
      return Response.json({ error: 'Kode OTP salah atau sudah kadaluarsa' }, { status: 400 });
    }

    // 2. Tandai OTP digunakan
    await sql`UPDATE login_otps SET used = true WHERE id = ${otps[0].id}`;

    // 3. Double check email (safety)
    const existing = await sql`SELECT id FROM auth_users WHERE email = ${normalizedEmail}`;
    if (existing.length > 0) {
      return Response.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    // 4. Buat User
    const id = 'user_' + Date.now();
    const hashedPassword = await hash(password, 10);
    
    const result = await sql`
      INSERT INTO auth_users (id, email, name, password, role)
      VALUES (${id}, ${normalizedEmail}, ${name}, ${hashedPassword}, 'user')
      RETURNING id, email, name, role
    `;
    const newUser = result[0];

    // 5. Sync ke Google Sheets (DATA AKUN)
    try {
      await syncToGoogleSheets({
        action: 'SIGNUP',
        user: newUser
      });
    } catch (e) {
      console.error('Safe to ignore: signup sync failed', e);
    }

    return Response.json({ ok: true, message: 'Akun berhasil dibuat. Silakan login.' });

  } catch (error) {
    console.error('[signup-verify] Error:', error);
    return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
