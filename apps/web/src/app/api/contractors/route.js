import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { syncToGoogleSheets } from "@/app/api/utils/google-sheets";

// Mendapatkan daftar kontraktor (untuk admin)
export async function GET(request) {
  try {
    // Get authentication session, but do not block if it's missing (for SI PRO Integration)
    const session = await auth();
    // if (!session?.user?.id) {
    //   return Response.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = "SELECT * FROM contractors WHERE 1=1";
    const params = [];
    let paramIndex = 1;

    if (status && status !== "all") {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (LOWER(full_name) LIKE LOWER($${paramIndex}) OR LOWER(company_name) LIKE LOWER($${paramIndex}) OR nik LIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += " ORDER BY created_at DESC";

    const contractors = await sql(query, params);

    return Response.json({ contractors });
  } catch (error) {
    console.error("Error fetching contractors:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Membuat data kontraktor baru
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      nik,
      full_name,
      birth_place,
      birth_date,
      phone,
      email,
      address,
      city,
      company_name,
      company_type,
      npwp,
      company_address,
      company_phone,
      establishment_year,
      business_field,
      small_classification,
      medium_classification,
      large_classification,
      anggotaAsosiasi,
      namaAsosiasi,
    } = body;

    // Validasi NIK unik
    const existing = await sql`SELECT id FROM contractors WHERE nik = ${nik}`;
    if (existing.length > 0) {
      return Response.json({ error: "NIK sudah terdaftar" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO contractors (
        user_id, nik, full_name, birth_place, birth_date, phone, email, address, city,
        company_name, company_type, npwp, company_address, company_phone,
        establishment_year, business_field, small_classification,
        medium_classification, large_classification,
        is_association_member, association_name, status
      ) VALUES (
        ${session.user.id}, ${nik}, ${full_name}, ${birth_place || null}, ${birth_date || null},
        ${phone}, ${email || session.user.email}, ${address}, ${city || null},
        ${company_name}, ${company_type || null}, ${npwp || null}, ${company_address || null},
        ${company_phone || null}, ${establishment_year || null}, ${business_field || []},
        ${small_classification || null}, ${medium_classification || null},
        ${large_classification || null},
        ${anggotaAsosiasi || 'Non Asosiasi'}, ${namaAsosiasi || null}, 'pending'
      ) RETURNING *
    `;

    // Sync to Google Sheets
    await syncToGoogleSheets({
      action: 'SUBMIT_KONTRAKTOR',
      contractor: result[0],
    });

    return Response.json({ contractor: result[0] });
  } catch (error) {
    console.error("Error creating contractor:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
