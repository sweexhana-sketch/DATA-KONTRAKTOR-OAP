import sql from "@/app/api/utils/sql";

/**
 * POST /api/admin/assign-wilayah
 * Admin Provinsi menugaskan seorang user sebagai Admin Wilayah.
 * Body: { admin_email, wilayah_id, assigned_by_email }
 */
export async function POST(request) {
  try {
    const { admin_email, wilayah_id, assigned_by_email } = await request.json();

    if (!admin_email || !wilayah_id || !assigned_by_email) {
      return Response.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Cek apakah yang assign adalah admin_provinsi
    const assigner = await sql`
      SELECT role FROM auth_users WHERE email = ${assigned_by_email}
    `;
    if (!assigner.length || assigner[0].role !== 'admin_provinsi') {
      return Response.json(
        { error: "Hanya admin provinsi yang dapat menugaskan admin wilayah" },
        { status: 403 }
      );
    }

    // Cek apakah target user ada
    const targetUser = await sql`
      SELECT id, email, name FROM auth_users WHERE email = ${admin_email}
    `;
    if (!targetUser.length) {
      return Response.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const userId = targetUser[0].id;

    // Set role menjadi admin_wilayah dan hubungkan ke wilayah
    await sql`
      UPDATE auth_users
      SET role = 'admin_wilayah', wilayah_id = ${wilayah_id}
      WHERE id = ${userId}
    `;

    // Upsert tabel admin_wilayah
    await sql`
      INSERT INTO admin_wilayah (user_id, wilayah_id, assigned_by)
      VALUES (${userId}, ${wilayah_id}, ${assigned_by_email})
      ON CONFLICT (user_id)
      DO UPDATE SET
        wilayah_id  = EXCLUDED.wilayah_id,
        assigned_by = EXCLUDED.assigned_by,
        is_active   = TRUE,
        created_at  = NOW()
    `;

    const wilayah = await sql`SELECT nama FROM wilayah WHERE id = ${wilayah_id}`;

    return Response.json({
      success: true,
      message: `${targetUser[0].name || admin_email} berhasil ditugaskan sebagai Admin ${wilayah[0]?.nama || "Wilayah"}`,
    });
  } catch (error) {
    console.error("POST /api/admin/assign-wilayah error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET /api/admin/assign-wilayah
 * Daftar semua admin wilayah yang sudah ditugaskan.
 */
export async function GET() {
  try {
    const admins = await sql`
      SELECT
        au.id, au.name, au.email, au.role,
        aw.is_active, aw.assigned_by, aw.created_at AS assigned_at,
        w.id AS wilayah_id, w.nama AS wilayah_nama, w.kode, w.tipe
      FROM admin_wilayah aw
      JOIN auth_users au ON au.id = aw.user_id
      JOIN wilayah w ON w.id = aw.wilayah_id
      ORDER BY w.tipe DESC, w.nama ASC
    `;
    return Response.json({ admins });
  } catch (error) {
    console.error("GET /api/admin/assign-wilayah error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
