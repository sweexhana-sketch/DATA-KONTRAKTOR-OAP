/**
 * POST /api/auth/verify-otp
 * Step 2 login: verifikasi OTP, jika valid return credentials untuk signIn
 */
import sql from '@/app/api/utils/sql';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return Response.json({ error: 'Email dan OTP wajib diisi' }, { status: 400 });
    }

    // Cari OTP yang valid
    const otps = await sql`
      SELECT id, otp, expires_at, used FROM login_otps
      WHERE email = ${email.toLowerCase().trim()}
        AND used = false
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (otps.length === 0) {
      return Response.json({ error: 'Kode OTP tidak ditemukan atau sudah digunakan' }, { status: 400 });
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
