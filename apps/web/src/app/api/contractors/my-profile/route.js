import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Mendapatkan profil kontraktor dari user yang sedang login
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contractors = await sql`
      SELECT * FROM contractors WHERE user_id = ${session.user.id}
    `;

    if (contractors.length === 0) {
      return Response.json({ contractor: null });
    }

    const contractorId = contractors[0].id;

    // Ambil data terkait
    const certifications =
      await sql`SELECT * FROM certifications WHERE contractor_id = ${contractorId}`;
    const projects =
      await sql`SELECT * FROM projects WHERE contractor_id = ${contractorId}`;
    const documents =
      await sql`SELECT * FROM documents WHERE contractor_id = ${contractorId}`;

    return Response.json({
      contractor: contractors[0],
      certifications,
      projects,
      documents,
    });
  } catch (error) {
    console.error("Error fetching my profile:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
