/**
 * Jalankan script ini SEKALI untuk membuat tabel login_otps di database:
 * node apps/web/migrate-otp.js
 */
import sql from './src/app/api/utils/sql.js';

async function migrate() {
  try {
    console.log('Membuat tabel login_otps...');
    await sql`
      CREATE TABLE IF NOT EXISTS login_otps (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Index untuk query cepat
    await sql`
      CREATE INDEX IF NOT EXISTS idx_login_otps_email ON login_otps(email)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_login_otps_created ON login_otps(created_at)
    `;

    console.log('✅ Tabel login_otps berhasil dibuat!');

    // Auto cleanup OTP lama (opsional, jalankan via cron)
    await sql`
      DELETE FROM login_otps WHERE expires_at < NOW() - INTERVAL '1 day'
    `;
    console.log('✅ OTP lama sudah dibersihkan.');

  } catch (err) {
    console.error('❌ Gagal:', err);
  }
}

migrate();
