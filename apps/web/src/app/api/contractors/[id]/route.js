import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { syncToGoogleSheets } from "@/app/api/utils/google-sheets";

// Mendapatkan detail kontraktor
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const contractors = await sql`SELECT * FROM contractors WHERE id = ${id}`;

    if (contractors.length === 0) {
      return Response.json(
        { error: "Kontraktor tidak ditemukan" },
        { status: 404 },
      );
    }

    // Ambil data terkait
    const certifications =
      await sql`SELECT * FROM certifications WHERE contractor_id = ${id}`;
    const projects =
      await sql`SELECT * FROM projects WHERE contractor_id = ${id}`;
    const documents =
      await sql`SELECT * FROM documents WHERE contractor_id = ${id}`;

    return Response.json({
      contractor: contractors[0],
      certifications,
      projects,
      documents,
    });
  } catch (error) {
    console.error("Error fetching contractor:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Update data kontraktor
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      "full_name",
      "birth_place",
      "birth_date",
      "phone",
      "email",
      "address",
      "city",
      "company_name",
      "company_type",
      "npwp",
      "company_address",
      "company_phone",
      "establishment_year",
      "business_field",
      "small_classification",
      "medium_classification",
      "large_classification",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return Response.json(
        { error: "Tidak ada data yang diupdate" },
        { status: 400 },
      );
    }

    setClauses.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    paramIndex++;

    const query = `UPDATE contractors SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json(
        { error: "Kontraktor tidak ditemukan" },
        { status: 404 },
      );
    }

    // Sync to Google Sheets
    await syncToGoogleSheets({
      action: 'UPDATE',
      contractor: result[0],
    });

    return Response.json({ contractor: result[0] });
  } catch (error) {
    console.error("Error updating contractor:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
