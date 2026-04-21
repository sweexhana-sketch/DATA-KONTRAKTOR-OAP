import sql from "@/app/api/utils/sql";

/**
 * GET /api/penugasan
 * Daftar semua penugasan.
 * Query params: wilayah_id, status, contractor_id
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wilayah_id = searchParams.get("wilayah_id");
    const status = searchParams.get("status");
    const contractor_id = searchParams.get("contractor_id");

    let query = `
      SELECT
        pk.*,
        c.company_name, c.full_name, c.company_type, c.phone,
        w.nama AS wilayah_nama, w.kode AS wilayah_kode, w.tipe AS wilayah_tipe
      FROM penugasan_kontraktor pk
      JOIN contractors c ON c.id = pk.contractor_id
      JOIN wilayah w ON w.id = pk.wilayah_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (wilayah_id) { query += ` AND pk.wilayah_id = $${idx++}`; params.push(wilayah_id); }
    if (status)     { query += ` AND pk.status = $${idx++}`; params.push(status); }
    if (contractor_id) { query += ` AND pk.contractor_id = $${idx++}`; params.push(contractor_id); }

    query += ` ORDER BY pk.created_at DESC`;

    const penugasan = await sql(query, params);
    return Response.json({ penugasan });
  } catch (error) {
    console.error("GET /api/penugasan error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/penugasan
 * Menunjuk satu kontraktor ke satu wilayah untuk satu paket pekerjaan.
 * COLLISION GUARD: menolak jika ada penugasan aktif yang periode-nya overlap.
 *
 * Body: {
 *   contractor_id, wilayah_id, nama_paket, tahun_anggaran,
 *   tanggal_mulai, tanggal_selesai, catatan, assigned_by_email
 * }
 */
export async function POST(request) {
  try {
    const {
      contractor_id,
      wilayah_id,
      nama_paket,
      tahun_anggaran,
      tanggal_mulai,
      tanggal_selesai,
      catatan,
      assigned_by_email,
    } = await request.json();

    // ── Validasi input ──────────────────────────────────────────────────
    if (!contractor_id || !wilayah_id || !nama_paket || !tanggal_mulai || !tanggal_selesai || !assigned_by_email) {
      return Response.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    if (new Date(tanggal_selesai) <= new Date(tanggal_mulai)) {
      return Response.json({ error: "Tanggal selesai harus setelah tanggal mulai" }, { status: 400 });
    }

    // ── Cek autoritas pengguna (minimal admin_wilayah atau admin_provinsi) ──
    const assigner = await sql`
      SELECT role, wilayah_id FROM auth_users WHERE email = ${assigned_by_email}
    `;
    if (!assigner.length || !['admin_wilayah', 'admin_provinsi'].includes(assigner[0].role)) {
      return Response.json({ error: "Tidak memiliki izin untuk menunjuk kontraktor" }, { status: 403 });
    }
    // Admin wilayah hanya boleh menunjuk ke wilayahnya sendiri
    if (assigner[0].role === 'admin_wilayah' && String(assigner[0].wilayah_id) !== String(wilayah_id)) {
      return Response.json({ error: "Admin wilayah hanya dapat menunjuk ke wilayahnya sendiri" }, { status: 403 });
    }

    // ── COLLISION GUARD ─────────────────────────────────────────────────
    // Cari apakah kontraktor ini punya penugasan AKTIF yang periodenya overlap
    const collision = await sql`
      SELECT
        pk.id,
        pk.nama_paket,
        pk.tanggal_mulai,
        pk.tanggal_selesai,
        w.nama AS wilayah_nama,
        w.kode AS wilayah_kode
      FROM penugasan_kontraktor pk
      JOIN wilayah w ON w.id = pk.wilayah_id
      WHERE pk.contractor_id = ${contractor_id}
        AND pk.status = 'aktif'
        AND pk.tanggal_mulai <= ${tanggal_selesai}
        AND pk.tanggal_selesai >= ${tanggal_mulai}
    `;

    if (collision.length > 0) {
      const c = collision[0];
      const mulai = new Date(c.tanggal_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const selesai = new Date(c.tanggal_selesai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

      return Response.json({
        error: "CONFLICT",
        message: `Perusahaan ini sedang aktif mengerjakan paket "${c.nama_paket}" di ${c.wilayah_nama} (${mulai} – ${selesai}). Penunjukan di wilayah lain tidak dapat dilakukan pada periode yang sama.`,
        collision: {
          wilayah: c.wilayah_nama,
          wilayah_kode: c.wilayah_kode,
          paket: c.nama_paket,
          tanggal_mulai: c.tanggal_mulai,
          tanggal_selesai: c.tanggal_selesai,
        },
      }, { status: 409 }); // 409 Conflict
    }

    // ── Cek apakah kontraktor sudah berstatus 'approved' atau 'ditunjuk' ─
    const contractor = await sql`SELECT status, company_name FROM contractors WHERE id = ${contractor_id}`;
    if (!contractor.length) {
      return Response.json({ error: "Kontraktor tidak ditemukan" }, { status: 404 });
    }
    if (!['approved', 'ditunjuk'].includes(contractor[0].status)) {
      return Response.json({ error: "Kontraktor belum diverifikasi (status harus approved)" }, { status: 400 });
    }

    // ── Simpan penugasan ────────────────────────────────────────────────
    const result = await sql`
      INSERT INTO penugasan_kontraktor
        (contractor_id, wilayah_id, nama_paket, tahun_anggaran,
         tanggal_mulai, tanggal_selesai, status, assigned_by, catatan)
      VALUES
        (${contractor_id}, ${wilayah_id}, ${nama_paket}, ${tahun_anggaran || new Date().getFullYear()},
         ${tanggal_mulai}, ${tanggal_selesai}, 'aktif', ${assigned_by_email}, ${catatan || null})
      RETURNING *
    `;

    // Update status kontraktor → ditunjuk
    await sql`UPDATE contractors SET status = 'ditunjuk' WHERE id = ${contractor_id}`;

    return Response.json({
      success: true,
      penugasan: result[0],
      message: `${contractor[0].company_name} berhasil ditunjuk`,
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/penugasan error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
