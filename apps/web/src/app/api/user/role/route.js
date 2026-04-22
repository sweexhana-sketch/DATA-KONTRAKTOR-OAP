import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    // Ambil email dari query param atau header (dikirim dari frontend)
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return Response.json({ role: "kontraktor" });
    }

    // Pastikan kolom role ada
    try {
      await sql`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`;
    } catch {}

    const result = await sql`
      SELECT role, wilayah_id FROM auth_users WHERE email = ${email}
    `;

    if (result.length === 0) {
      return Response.json({ role: "kontraktor" });
    }

    return Response.json({ 
      role: result[0].role || "kontraktor",
      wilayah_id: result[0].wilayah_id 
    });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return Response.json({ role: "kontraktor" });
  }
}
