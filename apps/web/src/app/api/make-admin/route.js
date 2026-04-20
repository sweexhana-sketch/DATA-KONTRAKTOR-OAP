import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Endpoint untuk membuat user pertama menjadi admin
// PENTING: Hapus endpoint ini setelah admin pertama dibuat!
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized — silakan login dulu" }, { status: 401 });
    }

    // Pastikan kolom 'role' ada di tabel auth_users
    try {
      await sql`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`;
    } catch (alterErr) {
      console.log("[make-admin] role column mungkin sudah ada:", alterErr.message);
    }

    // Pastikan kolom terkait verifikasi ada di tabel contractors
    try {
      await sql`ALTER TABLE contractors ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ`;
      await sql`ALTER TABLE contractors ADD COLUMN IF NOT EXISTS verified_by TEXT`;
      await sql`ALTER TABLE contractors ADD COLUMN IF NOT EXISTS rejection_reason TEXT`;
      await sql`ALTER TABLE contractors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;
    } catch (colErr) {
      console.log("[make-admin] contractor columns mungkin sudah ada:", colErr.message);
    }

    // Update user menjadi admin
    const result = await sql`
      UPDATE auth_users 
      SET role = 'admin' 
      WHERE id = ${session.user.id}
      RETURNING id, email, role
    `;

    if (result.length === 0) {
      return Response.json({ error: "User tidak ditemukan di database" }, { status: 404 });
    }

    return Response.json({
      message: "User berhasil dijadikan admin",
      user: result[0],
    });
  } catch (error) {
    console.error("Error making admin:", error);
    return Response.json({ error: `Gagal: ${error.message}` }, { status: 500 });
  }
}
