import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { requireAdmin } from "@/app/api/utils/require-admin";
import { syncToGoogleSheets } from "@/app/api/utils/google-sheets";
import { verifyCsrf } from "@/app/api/utils/csrf";
import { rateLimit, getClientIp } from "@/app/api/utils/rate-limit";
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeNik } from "@/app/api/utils/sanitize";

const submitRl = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }); // 5x/jam per IP

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
    // CSRF check
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;

    // Rate limit: 5 submit per jam per IP
    const ip = getClientIp(request);
    const { ok } = submitRl.check(ip);
    if (!ok) {
      return Response.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Sanitasi semua input teks
    const nik              = sanitizeNik(body.nik);
    const full_name        = sanitizeText(body.full_name, { maxLength: 150 });
    const birth_place      = sanitizeText(body.birth_place, { maxLength: 100 });
    const birth_date       = body.birth_date || null;
    const phone            = sanitizePhone(body.phone);
    const email            = sanitizeEmail(body.email) || session.user.email;
    const address          = sanitizeText(body.address, { maxLength: 300 });
    const city             = sanitizeText(body.city, { maxLength: 100 });
    const company_name     = sanitizeText(body.company_name, { maxLength: 200 });
    const company_type     = sanitizeText(body.company_type, { maxLength: 100 });
    const npwp             = sanitizeText(body.npwp, { maxLength: 30 });
    const company_address  = sanitizeText(body.company_address, { maxLength: 300 });
    const company_phone    = sanitizePhone(body.company_phone);
    const establishment_year = body.establishment_year || null;
    const business_field   = body.business_field || [];
    const small_classification  = sanitizeText(body.small_classification, { maxLength: 200 });
    const medium_classification = sanitizeText(body.medium_classification, { maxLength: 200 });
    const large_classification  = sanitizeText(body.large_classification, { maxLength: 200 });
    const anggotaAsosiasi  = sanitizeText(body.anggotaAsosiasi, { maxLength: 50 });
    const namaAsosiasi     = sanitizeText(body.namaAsosiasi, { maxLength: 150 });

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
