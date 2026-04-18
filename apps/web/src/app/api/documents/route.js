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
