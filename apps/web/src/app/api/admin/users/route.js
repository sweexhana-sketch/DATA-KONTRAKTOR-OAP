import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/require-admin";

// GET /api/admin/users — Admin only: list all registered users with contractor submission status
export async function GET(request) {
  try {
    const check = await requireAdmin();
    if (check.error) return check.error;
    const session = check.session;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "all";

    let users;
    if (search && roleFilter !== "all") {
      const like = `%${search}%`;
      users = await sql`
        SELECT u.id, u.email, u.name, u.role, u.created_at,
          c.id AS contractor_id, c.full_name AS contractor_name,
          c.company_name, c.status AS submission_status, c.created_at AS submitted_at
        FROM auth_users u
        LEFT JOIN contractors c ON c.user_id = u.id
        WHERE (LOWER(u.email) LIKE LOWER(${like}) OR LOWER(u.name) LIKE LOWER(${like}))
        AND u.role = ${roleFilter}
        ORDER BY u.created_at DESC
      `;
    } else if (search) {
      const like = `%${search}%`;
      users = await sql`
        SELECT u.id, u.email, u.name, u.role, u.created_at,
          c.id AS contractor_id, c.full_name AS contractor_name,
          c.company_name, c.status AS submission_status, c.created_at AS submitted_at
        FROM auth_users u
        LEFT JOIN contractors c ON c.user_id = u.id
        WHERE (LOWER(u.email) LIKE LOWER(${like}) OR LOWER(u.name) LIKE LOWER(${like}))
        ORDER BY u.created_at DESC
      `;
    } else if (roleFilter !== "all") {
      users = await sql`
        SELECT u.id, u.email, u.name, u.role, u.created_at,
          c.id AS contractor_id, c.full_name AS contractor_name,
          c.company_name, c.status AS submission_status, c.created_at AS submitted_at
        FROM auth_users u
        LEFT JOIN contractors c ON c.user_id = u.id
        WHERE u.role = ${roleFilter}
        ORDER BY u.created_at DESC
      `;
    } else {
      users = await sql`
        SELECT u.id, u.email, u.name, u.role, u.created_at,
          c.id AS contractor_id, c.full_name AS contractor_name,
          c.company_name, c.status AS submission_status, c.created_at AS submitted_at
        FROM auth_users u
        LEFT JOIN contractors c ON c.user_id = u.id
        ORDER BY u.created_at DESC
      `;
    }

    return Response.json({ users });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
