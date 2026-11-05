/**
 * POST /api/auth/verify-otp
 * Step 2 login: verifikasi OTP, jika valid return credentials untuk signIn
 */
import sql from '@/app/api/utils/sql';

export async function POST(request, context, c) {
  try {
    let body;
    if (c) {
      body = await c.req.json();
    } else {
      body = await request.json();
    }
    const { email, otp } = body;

    if (!email || !otp) {
      return Response.json({ error: 'Email dan OTP wajib diisi' }, { status: 400 });
    }

    // Tabel percobaan gagal (dibuat jika belum ada)
    await sql`CREATE TABLE IF NOT EXISTS login_otp_attempts (
      id SERIAL PRIMARY KEY, email TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW())`;

    // Batas percobaan: maks 5 salah per email dalam 15 menit
    const fails = await sql`
      SELECT COUNT(*) AS count FROM login_otp_attempts
      WHERE email = ${email.toLowerCase().trim()}
        AND created_at > NOW() - INTERVAL '15 minutes'
    `;
    if (parseInt(fails[0].count) >= 5) {
      return Response.json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' }, { status: 429 });
    }

    // Cari OTP yang valid (cocok dengan input user)
    const otps = await sql`
      SELECT id, otp, expires_at, used FROM login_otps
      WHERE email = ${email.toLowerCase().trim()}
        AND otp = ${otp.trim()}
        AND used = false
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (otps.length === 0) {
      await sql`INSERT INTO login_otp_attempts (email) VALUES (${email.toLowerCase().trim()})`;
      return Response.json({ error: 'Kode OTP salah atau sudah kedaluwarsa' }, { status: 400 });
    }

    const record = otps[0];

    // Cek sudah expired
    if (new Date() > new Date(record.expires_at)) {
      return Response.json({ error: 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.' }, { status: 400 });
    }

    // Cek OTP cocok
    if (record.otp !== otp.trim()) {
      return Response.json({ error: 'Kode OTP salah' }, { status: 400 });
    }

    // Mark OTP sebagai sudah dipakai
    await sql`UPDATE login_otps SET used = true WHERE id = ${record.id}`;

    return Response.json({ ok: true });

  } catch (error) {
    console.error('[verify-otp] Error:', error);
    return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
