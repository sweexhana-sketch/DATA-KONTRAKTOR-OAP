import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { requireAdmin } from "@/app/api/utils/require-admin";
import { syncToGoogleSheets } from "@/app/api/utils/google-sheets";

// Mendapatkan daftar kontraktor (hanya untuk admin)
export async function GET(request) {
  try {
    // Hanya admin yang bisa melihat SEMUA data kontraktor
    const check = await requireAdmin();
    if (check.error) return check.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let contractors;
    const like = search ? `%${search}%` : null;

    if (status && status !== "all" && like) {
      contractors = await sql`
        SELECT * FROM contractors
        WHERE status = ${status}
          AND (LOWER(full_name) LIKE LOWER(${like}) OR LOWER(company_name) LIKE LOWER(${like}) OR nik LIKE ${like})
        ORDER BY created_at DESC
      `;
    } else if (status && status !== "all") {
      contractors = await sql`
        SELECT * FROM contractors
        WHERE status = ${status}
        ORDER BY created_at DESC
      `;
    } else if (like) {
      contractors = await sql`
        SELECT * FROM contractors
        WHERE (LOWER(full_name) LIKE LOWER(${like}) OR LOWER(company_name) LIKE LOWER(${like}) OR nik LIKE ${like})
        ORDER BY created_at DESC
      `;
    } else {
      contractors = await sql`SELECT * FROM contractors ORDER BY created_at DESC`;
    }

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
