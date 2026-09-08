import sql from "@/app/api/utils/sql";
import { requireAdmin } from "@/app/api/utils/require-admin";
import { syncToGoogleSheets } from "@/app/api/utils/google-sheets";

// Verifikasi/Approve atau Reject kontraktor (Admin only)
export async function POST(request) {
  try {
    const check = await requireAdmin();
    if (check.error) return check.error;
    const session = check.session;


    const body = await request.json();
    const { contractor_id, status, rejection_reason } = body;

    if (
      !contractor_id ||
      !status ||
      !["approved", "rejected", "ditunjuk"].includes(status)
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
