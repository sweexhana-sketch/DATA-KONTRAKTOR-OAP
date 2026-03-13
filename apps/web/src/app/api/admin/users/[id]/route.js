import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// POST /api/admin/users/[id] — Admin only: update a user's role
export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin role
        const roleCheck = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id}
    `;
        if (!roleCheck[0] || roleCheck[0].role !== "admin") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const { role } = await request.json();
        if (!["admin", "user", "kontraktor"].includes(role)) {
            return Response.json({ error: "Invalid role" }, { status: 400 });
        }

        // Prevent admin from demoting themselves
        if (params.id === session.user.id && role !== "admin") {
            return Response.json(
                { error: "Tidak dapat mengubah role akun Anda sendiri" },
                { status: 400 }
            );
        }

        const result = await sql`
      UPDATE auth_users
      SET role = ${role}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING id, email, name, role
    `;

        if (result.length === 0) {
            return Response.json({ error: "User tidak ditemukan" }, { status: 404 });
        }

        return Response.json({ user: result[0] });
    } catch (error) {
        console.error("Error updating user role:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
