import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function getDbRole(userId) {
  const rows = await sql`SELECT role, wilayah_id FROM auth_users WHERE id = ${userId}`;
  return rows[0] || null;
}

export async function requireAdminRole() {
  const result = await requireSession();
  if (result.error) return result;
  const dbUser = await getDbRole(result.session.user.id);
  if (!dbUser || !["admin", "admin_provinsi", "admin_wilayah"].includes(dbUser.role)) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session: result.session, dbUser };
}

export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export function securityHeaders(headers = {}) {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    ...headers,
  };
}
