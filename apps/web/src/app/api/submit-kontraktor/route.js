import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { verifyCsrf } from "@/app/api/utils/csrf";
import { rateLimit, getClientIp } from "@/app/api/utils/rate-limit";
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeNik } from "@/app/api/utils/sanitize";

const submitRl = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

export async function POST(request) {
  try {
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!submitRl.check(getClientIp(request)).ok) return Response.json({ error: "Terlalu banyak permintaan" }, { status: 429 });

    const body = await request.json();
    const namaPerusahaan = sanitizeText(body.namaPerusahaan, { maxLength: 200 });
    const namaDirektur = sanitizeText(body.namaDirektur, { maxLength: 150 });
    const nikDirektur = sanitizeNik(body.nikDirektur);
    const jenisUsaha = sanitizeText(body.jenisUsaha, { maxLength: 100 });
    const alamat = sanitizeText(body.alamat, { maxLength: 300 });
    const kota = sanitizeText(body.kota, { maxLength: 100 });
    const telepon = sanitizePhone(body.telepon);
    const email = sanitizeEmail(body.email);
    const siujkKlasifikasi = sanitizeText(body.siujkKlasifikasi, { maxLength: 200 });
    const npwpPerusahaanNo = sanitizeText(body.npwpPerusahaanNo, { maxLength: 30 });
    if (!namaPerusahaan || !namaDirektur) return Response.json({ error: "Nama perusahaan dan nama direktur wajib diisi" }, { status: 400 });

    const existing = nikDirektur ? await sql`SELECT id FROM contractors WHERE nik = ${nikDirektur} AND user_id = ${session.user.id}` : [];
    if (existing.length) {
      await sql`UPDATE contractors SET company_name=${namaPerusahaan}, full_name=${namaDirektur}, company_type=${jenisUsaha || null}, company_address=${alamat || null}, city=${kota || null}, phone=${telepon || null}, email=${email || null}, small_classification=${siujkKlasifikasi || null}, npwp=${npwpPerusahaanNo || null}, status='pending', updated_at=NOW() WHERE id=${existing[0].id}`;
    } else {
      await sql`INSERT INTO contractors (user_id, nik, full_name, company_name, company_type, company_address, city, phone, email, small_classification, npwp, status) VALUES (${session.user.id}, ${nikDirektur || `OAP-${crypto.randomUUID()}`}, ${namaDirektur}, ${namaPerusahaan}, ${jenisUsaha || null}, ${alamat || null}, ${kota || null}, ${telepon || null}, ${email || session.user.email || null}, ${siujkKlasifikasi || null}, ${npwpPerusahaanNo || null}, 'pending')`;
    }
    return Response.json({ ok: true, message: "Data perusahaan berhasil disimpan" });
  } catch (error) {
    console.error("Error submit-kontraktor", error?.name || "ServerError");
    return Response.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
