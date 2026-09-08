/**
 * Helper: requireAdmin
 * 
 * Memeriksa apakah request berasal dari user yang sudah login
 * DAN memiliki role 'admin'. Digunakan di semua API endpoint admin
 * untuk menghindari duplikasi kode pengecekan.
 * 
 * Penggunaan:
 *   const check = await requireAdmin();
 *   if (check.error) return check.error;
 *   // check.session berisi data session yang valid
 */

import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

/**
 * @returns {{ session: object } | { error: Response }}
 */
export async function requireAdmin() {
  // 1. Cek session login
  let session;
  try {
    session = await auth();
  } catch {
    return {
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!session?.user?.id) {
    return {
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // 2. Verifikasi role di database (tidak hanya dari JWT/session)
  try {
    const rows = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id}
    `;

    if (!rows[0] || rows[0].role !== "admin") {
      return {
        error: Response.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
  } catch {
    return {
      error: Response.json(
        { error: "Gagal memverifikasi akses" },
        { status: 500 }
      ),
    };
  }

  return { session };
}
