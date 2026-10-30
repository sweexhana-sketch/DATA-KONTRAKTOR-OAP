import sql from "@/app/api/utils/sql";
import { requireSession, getDbRole } from "@/app/api/utils/security";
export async function GET(request) {
  try {
    const check = await requireSession();
    if (check.error) return check.error;
    const dbUser = await getDbRole(check.session.user.id);
    return Response.json({ role: dbUser?.role || "kontraktor", wilayah_id: dbUser?.wilayah_id ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error fetching user role", error?.name || "DatabaseError");
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
