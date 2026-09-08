import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      contractor_id,
      project_name,
      project_location,
      project_value,
      client_name,
      project_type,
      start_date,
      end_date,
      project_status,
      description,
    } = body;

    if (!contractor_id || !project_name) {
      return Response.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Ownership Check: pastikan kontraktor ini milik user yang sedang login
    const selfRole = await sql`SELECT role FROM auth_users WHERE id = ${session.user.id}`;
    const isAdmin = selfRole[0]?.role === "admin";

    if (!isAdmin) {
      const ownerCheck = await sql`SELECT user_id FROM contractors WHERE id = ${contractor_id}`;
      if (!ownerCheck[0] || ownerCheck[0].user_id !== session.user.id) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const result = await sql`
      INSERT INTO projects (
        contractor_id, project_name, project_location, project_value,
        client_name, project_type, start_date, end_date, project_status, description
      ) VALUES (
        ${contractor_id}, ${project_name}, ${project_location || null}, ${project_value || null},
        ${client_name || null}, ${project_type || null}, ${start_date || null},
        ${end_date || null}, ${project_status || null}, ${description || null}
      ) RETURNING *
    `;

    return Response.json({ project: result[0] });
  } catch (error) {
    console.error("Error creating project:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

