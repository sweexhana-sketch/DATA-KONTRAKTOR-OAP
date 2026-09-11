import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { verifyCsrf } from "@/app/api/utils/csrf";
import { rateLimit, getClientIp } from "@/app/api/utils/rate-limit";
import { sanitizeText, sanitizeUrl } from "@/app/api/utils/sanitize";

const docRl = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }); // 10x/jam per user

export async function POST(request) {
  try {
    // CSRF check
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;

    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit per user
    const { ok } = docRl.check(session.user.id);
    if (!ok) {
      return Response.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
    }

    const body = await request.json();
    const contractor_id   = sanitizeText(body.contractor_id, { maxLength: 100 });
    const document_type   = sanitizeText(body.document_type, { maxLength: 100 });
    const document_name   = sanitizeText(body.document_name, { maxLength: 200 });
    const document_url    = sanitizeUrl(body.document_url);

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
      VALUES (${contractor_id}, ${document_type}, ${document_name || null}, ${document_url})
      RETURNING *
    `;

    return Response.json({ document: result[0] });
  } catch (error) {
    console.error("Error creating document:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
