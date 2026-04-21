import sql from "@/app/api/utils/sql";

/**
 * GET /api/admin/migrate
 * Menjalankan migrasi database untuk fitur multi-wilayah.
 * Panggil sekali: /api/admin/migrate?key=INIT_MIGRATION_2025
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== "INIT_MIGRATION_2025") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steps = [];

  try {
    // ─── 1. Tabel wilayah ───────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS wilayah (
        id         SERIAL PRIMARY KEY,
        kode       VARCHAR(20) UNIQUE NOT NULL,
        nama       TEXT NOT NULL,
        tipe       VARCHAR(20) NOT NULL DEFAULT 'kabupaten',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    steps.push("✅ Tabel wilayah dibuat");

    // Seed data wilayah Papua Barat Daya (6 kabupaten/kota)
    await sql`
      INSERT INTO wilayah (kode, nama, tipe) VALUES
        ('KOTA_SOR',  'Kota Sorong',              'kota'),
        ('KAB_SOR',   'Kabupaten Sorong',          'kabupaten'),
        ('KAB_SORSEL','Kabupaten Sorong Selatan',  'kabupaten'),
        ('KAB_MAY',   'Kabupaten Maybrat',         'kabupaten'),
        ('KAB_TAM',   'Kabupaten Tambrauw',        'kabupaten'),
        ('KAB_RA',    'Kabupaten Raja Ampat',      'kabupaten')
      ON CONFLICT (kode) DO NOTHING
    `;
    // Hapus data lama yang salah jika ada
    await sql`DELETE FROM wilayah WHERE kode = 'KAB_MNK'`;
    steps.push("✅ Seed data 6 wilayah Papua Barat Daya");

    // ─── 2. Kolom wilayah_id pada auth_users ───────────────────────────
    await sql`
      ALTER TABLE auth_users
        ADD COLUMN IF NOT EXISTS wilayah_id INTEGER REFERENCES wilayah(id)
    `;
    steps.push("✅ Kolom wilayah_id ditambahkan ke auth_users");

    // Upgrade role admin lama → admin_provinsi
    await sql`
      UPDATE auth_users
      SET role = 'admin_provinsi'
      WHERE role = 'admin'
    `;
    steps.push("✅ Role 'admin' lama diupgrade ke 'admin_provinsi'");

    // ─── 3. Tabel admin_wilayah ────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS admin_wilayah (
        id          SERIAL PRIMARY KEY,
        user_id     TEXT NOT NULL,
        wilayah_id  INTEGER NOT NULL REFERENCES wilayah(id),
        is_active   BOOLEAN DEFAULT TRUE,
        assigned_by TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `;
    steps.push("✅ Tabel admin_wilayah dibuat");

    // Mengecek tipe data dari contractors.id
    const colType = await sql`SELECT data_type FROM information_schema.columns WHERE table_name = 'contractors' AND column_name = 'id'`;
    const contractorIdType = colType?.[0]?.data_type === 'uuid' || colType?.[0]?.data_type === 'text' ? 'UUID' : 'INTEGER';

    // ─── 4. Tabel penugasan_kontraktor ─────────────────────────────────
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS penugasan_kontraktor (
        id              SERIAL PRIMARY KEY,
        contractor_id   ${contractorIdType} NOT NULL REFERENCES contractors(id),
        wilayah_id      INTEGER NOT NULL REFERENCES wilayah(id),
        nama_paket      TEXT NOT NULL,
        tahun_anggaran  INTEGER NOT NULL,
        tanggal_mulai   DATE NOT NULL,
        tanggal_selesai DATE NOT NULL,
        status          VARCHAR(20) DEFAULT 'aktif',
        assigned_by     TEXT NOT NULL,
        catatan         TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT no_concurrent_region
          EXCLUDE USING GIST (
            contractor_id WITH =,
            daterange(tanggal_mulai, tanggal_selesai, '[]') WITH &&
          ) WHERE (status = 'aktif')
      )
    `;
    
    // Some postgres versions might complain about the EXCLUDE constraint if btree_gist is not installed
    // Let's create it without the EXCLUDE constraint first, we will manage collision via API
    const createTableQuerySafe = `
      CREATE TABLE IF NOT EXISTS penugasan_kontraktor (
        id              SERIAL PRIMARY KEY,
        contractor_id   ${contractorIdType} NOT NULL REFERENCES contractors(id),
        wilayah_id      INTEGER NOT NULL REFERENCES wilayah(id),
        nama_paket      TEXT NOT NULL,
        tahun_anggaran  INTEGER NOT NULL,
        tanggal_mulai   DATE NOT NULL,
        tanggal_selesai DATE NOT NULL,
        status          VARCHAR(20) DEFAULT 'aktif',
        assigned_by     TEXT NOT NULL,
        catatan         TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql(createTableQuerySafe);
    steps.push("✅ Tabel penugasan_kontraktor dibuat");

    // Index untuk performa
    await sql`
      CREATE INDEX IF NOT EXISTS idx_penugasan_contractor
        ON penugasan_kontraktor(contractor_id, status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_penugasan_wilayah
        ON penugasan_kontraktor(wilayah_id, status)
    `;
    steps.push("✅ Index penugasan_kontraktor dibuat");

    return Response.json({
      success: true,
      message: "Migrasi selesai!",
      steps,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return Response.json({
      success: false,
      error: error.message,
      steps,
    }, { status: 500 });
  }
}
