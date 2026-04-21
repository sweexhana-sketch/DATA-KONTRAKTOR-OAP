import sql from "@/app/api/utils/sql";

/**
 * PATCH /api/penugasan/[id]
 * Update status penugasan: 'selesai' | 'dibatalkan'
 * Body: { status, catatan, updated_by_email }
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status, catatan, updated_by_email } = await request.json();

    if (!['selesai', 'dibatalkan'].includes(status)) {
      return Response.json({ error: "Status tidak valid. Gunakan 'selesai' atau 'dibatalkan'" }, { status: 400 });
    }

    // Cek autoritas
    const user = await sql`SELECT role, wilayah_id FROM auth_users WHERE email = ${updated_by_email}`;
    if (!user.length || !['admin_wilayah', 'admin_provinsi'].includes(user[0].role)) {
      return Response.json({ error: "Tidak memiliki izin" }, { status: 403 });
    }

    // Ambil penugasan yang akan diupdate
    const existing = await sql`SELECT * FROM penugasan_kontraktor WHERE id = ${id}`;
    if (!existing.length) {
      return Response.json({ error: "Penugasan tidak ditemukan" }, { status: 404 });
    }

    // Admin wilayah hanya boleh update penugasan di wilayahnya
    if (user[0].role === 'admin_wilayah' && String(existing[0].wilayah_id) !== String(user[0].wilayah_id)) {
      return Response.json({ error: "Tidak dapat mengubah penugasan di wilayah lain" }, { status: 403 });
    }

    const updated = await sql`
      UPDATE penugasan_kontraktor
      SET status = ${status}, catatan = COALESCE(${catatan || null}, catatan)
      WHERE id = ${id}
      RETURNING *
    `;

    // Jika ditandai selesai/batal, kembalikan status kontraktor → approved
    // agar bisa ditunjuk ke wilayah lain
    const contractorId = updated[0].contractor_id;
    const masihAktif = await sql`
      SELECT COUNT(*) AS cnt FROM penugasan_kontraktor
      WHERE contractor_id = ${contractorId} AND status = 'aktif'
    `;
    if (parseInt(masihAktif[0].cnt) === 0) {
      await sql`UPDATE contractors SET status = 'approved' WHERE id = ${contractorId}`;
    }

    return Response.json({
      success: true,
      penugasan: updated[0],
      message: `Penugasan berhasil ditandai sebagai ${status}`,
    });
  } catch (error) {
    console.error("PATCH /api/penugasan/[id] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET /api/penugasan/[id]
 * Ambil detail satu penugasan
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const result = await sql`
      SELECT
        pk.*,
        c.company_name, c.full_name, c.company_type, c.phone, c.npwp,
        w.nama AS wilayah_nama, w.kode AS wilayah_kode, w.tipe AS wilayah_tipe
      FROM penugasan_kontraktor pk
      JOIN contractors c ON c.id = pk.contractor_id
      JOIN wilayah w ON w.id = pk.wilayah_id
      WHERE pk.id = ${id}
    `;
    if (!result.length) {
      return Response.json({ error: "Penugasan tidak ditemukan" }, { status: 404 });
    }
    return Response.json({ penugasan: result[0] });
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
