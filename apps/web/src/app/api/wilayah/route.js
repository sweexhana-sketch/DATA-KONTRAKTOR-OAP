import sql from "@/app/api/utils/sql";

/** GET /api/wilayah — Daftar semua wilayah Papua Barat Daya */
export async function GET() {
  try {
    const wilayah = await sql`
      SELECT
        w.*,
        COUNT(aw.id) AS jumlah_admin,
        COUNT(pk.id) FILTER (WHERE pk.status = 'aktif') AS kontraktor_aktif
      FROM wilayah w
      LEFT JOIN admin_wilayah aw ON aw.wilayah_id = w.id AND aw.is_active = true
      LEFT JOIN penugasan_kontraktor pk ON pk.wilayah_id = w.id
      GROUP BY w.id
      ORDER BY w.tipe DESC, w.nama ASC
    `;
    return Response.json({ wilayah });
  } catch (error) {
    console.error("GET /api/wilayah error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
