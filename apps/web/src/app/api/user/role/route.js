import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    // 1. Wajib login untuk mengakses endpoint ini
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return Response.json({ error: "Parameter email diperlukan" }, { status: 400 });
    }

    // 2. User hanya boleh query role milik email mereka sendiri
    //    Admin boleh query role siapapun
    const sessionEmail = session.user.email?.toLowerCase().trim();
    const requestedEmail = email.toLowerCase().trim();

    if (sessionEmail !== requestedEmail) {
      // Cek apakah user yang request adalah admin
      const selfRole = await sql`
        SELECT role FROM auth_users WHERE id = ${session.user.id}
      `;
      const isAdmin = selfRole[0]?.role === "admin";

      if (!isAdmin) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 3. Pastikan kolom role ada (migration guard)
    try {
      await sql`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`;
    } catch {}

    const result = await sql`
      SELECT role, wilayah_id FROM auth_users WHERE email = ${requestedEmail}
    `;

    if (result.length === 0) {
      return Response.json({ role: "kontraktor" });
    }

    return Response.json({
      role: result[0].role || "kontraktor",
      wilayah_id: result[0].wilayah_id,
    });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
