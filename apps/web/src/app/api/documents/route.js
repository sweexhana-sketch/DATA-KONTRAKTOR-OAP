import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contractor_id, document_type, document_name, document_url } = body;

    if (!contractor_id || !document_type || !document_url) {
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
      INSERT INTO documents (contractor_id, document_type, document_name, document_url)
      VALUES (${contractor_id}, ${document_type}, ${document_name}, ${document_url})
      RETURNING *
    `;

    return Response.json({ document: result[0] });
  } catch (error) {
    console.error("Error creating document:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

