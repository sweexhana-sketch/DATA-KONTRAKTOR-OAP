import sql from "@/app/api/utils/sql";

/** GET /api/wilayah/[id]/stats — Statistik detail satu wilayah */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [wilayah, penugasanList, adminList] = await Promise.all([
      sql`SELECT * FROM wilayah WHERE id = ${id}`,
      sql`
        SELECT
          pk.*,
          c.company_name,
          c.full_name,
          c.company_type,
          c.status AS contractor_status,
          w.nama AS wilayah_nama
        FROM penugasan_kontraktor pk
        JOIN contractors c ON c.id = pk.contractor_id
        JOIN wilayah w ON w.id = pk.wilayah_id
        WHERE pk.wilayah_id = ${id}
        ORDER BY pk.created_at DESC
      `,
      sql`
        SELECT au.id, au.name, au.email, aw.is_active, aw.created_at
        FROM admin_wilayah aw
        JOIN auth_users au ON au.id = aw.user_id
        WHERE aw.wilayah_id = ${id}
      `,
    ]);

    if (!wilayah.length) {
      return Response.json({ error: "Wilayah tidak ditemukan" }, { status: 404 });
    }

    const aktif = penugasanList.filter(p => p.status === 'aktif').length;
    const selesai = penugasanList.filter(p => p.status === 'selesai').length;
    const dibatalkan = penugasanList.filter(p => p.status === 'dibatalkan').length;

    return Response.json({
      wilayah: wilayah[0],
      stats: { aktif, selesai, dibatalkan, total: penugasanList.length },
      penugasan: penugasanList,
      admins: adminList,
    });
  } catch (error) {
    console.error("GET /api/wilayah/[id]/stats error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
