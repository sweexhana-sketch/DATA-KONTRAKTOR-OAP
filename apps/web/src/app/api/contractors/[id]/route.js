import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { syncToGoogleSheets } from "@/app/api/utils/google-sheets";

// Mendapatkan detail kontraktor (pemilik atau admin)
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

    const contractor = contractors[0];

    // IDOR Protection: hanya pemilik data atau admin yang boleh melihat detail
    const selfRole = await sql`SELECT role FROM auth_users WHERE id = ${session.user.id}`;
    const isAdmin = selfRole[0]?.role === "admin";
    const isOwner = contractor.user_id === session.user.id;

    if (!isAdmin && !isOwner) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ambil data terkait
    const certifications =
      await sql`SELECT * FROM certifications WHERE contractor_id = ${id}`;
    const projects =
      await sql`SELECT * FROM projects WHERE contractor_id = ${id}`;
    const documents =
      await sql`SELECT * FROM documents WHERE contractor_id = ${id}`;

    return Response.json({
      contractor,
      certifications,
      projects,
      documents,
    });
  } catch (error) {
    console.error("Error fetching contractor:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Update data kontraktor (hanya pemilik atau admin)
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // IDOR Protection: ambil data kontraktor terlebih dahulu untuk verifikasi kepemilikan
    const existing = await sql`SELECT user_id, status FROM contractors WHERE id = ${id}`;
    if (existing.length === 0) {
      return Response.json({ error: "Kontraktor tidak ditemukan" }, { status: 404 });
    }

    const selfRole = await sql`SELECT role FROM auth_users WHERE id = ${session.user.id}`;
    const isAdmin = selfRole[0]?.role === "admin";
    const isOwner = existing[0].user_id === session.user.id;

    if (!isAdmin && !isOwner) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // User biasa hanya boleh edit data saat masih berstatus 'pending'
    if (!isAdmin && existing[0].status !== "pending") {
      return Response.json(
        { error: "Data yang sudah diverifikasi tidak dapat diedit" },
        { status: 403 },
      );
    }

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
