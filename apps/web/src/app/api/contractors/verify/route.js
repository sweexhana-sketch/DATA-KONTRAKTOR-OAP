import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { syncToGoogleSheets } from "@/app/api/utils/google-sheets";

// Verifikasi/Approve atau Reject kontraktor (Admin only)
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cek apakah user adalah admin
    const adminCheck =
      await sql`SELECT role FROM auth_users WHERE id = ${session.user.id}`;
    if (!adminCheck[0] || adminCheck[0].role !== "admin") {
      return Response.json(
        { error: "Hanya admin yang dapat melakukan verifikasi" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { contractor_id, status, rejection_reason } = body;

    if (
      !contractor_id ||
      !status ||
      !["approved", "rejected"].includes(status)
    ) {
      return Response.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const result = await sql`
      UPDATE contractors 
      SET status = ${status},
          verified_at = ${new Date()},
          verified_by = ${session.user.id},
          rejection_reason = ${status === "rejected" ? rejection_reason : null},
          updated_at = ${new Date()}
      WHERE id = ${contractor_id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Kontraktor tidak ditemukan" },
        { status: 404 },
      );
    }

    // Sync to Google Sheets
    await syncToGoogleSheets({
      action: 'VERIFY',
      contractor: result[0],
    });

    return Response.json({ contractor: result[0] });
  } catch (error) {
    console.error("Error verifying contractor:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
