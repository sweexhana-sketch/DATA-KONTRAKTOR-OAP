import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await sql`
      SELECT role FROM auth_users WHERE id = ${session.user.id}
    `;

    if (result.length === 0) {
      return Response.json({ role: "kontraktor" });
    }

    return Response.json({ role: result[0].role || "kontraktor" });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
