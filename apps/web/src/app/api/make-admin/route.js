import sql from "@/app/api/utils/sql";

// Endpoint untuk membuat user pertama menjadi admin
// PENTING: Hapus endpoint ini setelah admin pertama dibuat!
export async function POST(request) {
  try {
    // Ambil email dari request body (dikirim dari halaman make-first-admin)
    let email;
    try {
      const body = await request.json();
      email = body.email;
    } catch {
      // fallback: tidak ada body
    }

    if (!email) {
      return Response.json({ error: "Email diperlukan" }, { status: 400 });
    }

    // Pastikan kolom 'role' ada di tabel auth_users
    try {
      await sql`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`;
    } catch (alterErr) {
      console.log("[make-admin] role column:", alterErr.message);
    }

    // Pastikan kolom verifikasi ada di tabel contractors
    try {
      await sql`ALTER TABLE contractors ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ`;
      await sql`ALTER TABLE contractors ADD COLUMN IF NOT EXISTS verified_by TEXT`;
      await sql`ALTER TABLE contractors ADD COLUMN IF NOT EXISTS rejection_reason TEXT`;
      await sql`ALTER TABLE contractors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;
    } catch (colErr) {
      console.log("[make-admin] contractor cols:", colErr.message);
    }

    // Cari user berdasarkan email
    const users = await sql`SELECT id, email FROM auth_users WHERE email = ${email}`;
    if (users.length === 0) {
      return Response.json({ error: `User dengan email ${email} tidak ditemukan` }, { status: 404 });
    }

    // Update user menjadi admin
    const result = await sql`
      UPDATE auth_users 
      SET role = 'admin' 
      WHERE email = ${email}
      RETURNING id, email, role
    `;

    return Response.json({
      message: "User berhasil dijadikan admin",
      user: result[0],
    });
  } catch (error) {
    console.error("Error making admin:", error);
    return Response.json({ error: `Gagal: ${error.message}` }, { status: 500 });
  }
}
