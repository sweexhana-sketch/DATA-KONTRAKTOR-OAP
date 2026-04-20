import sql from "@/app/api/utils/sql";

// Mendapatkan statistik untuk dashboard admin — no auth() needed
export async function GET(request) {
  try {
    const [totalContractors, pendingApprovals, approvedContractors, ditunjukContractors, rejectedContractors, recentSubmissions] =
      await Promise.all([
        sql`SELECT COUNT(*) as count FROM contractors`,
        sql`SELECT COUNT(*) as count FROM contractors WHERE status = 'pending'`,
        sql`SELECT COUNT(*) as count FROM contractors WHERE status = 'approved'`,
        sql`SELECT COUNT(*) as count FROM contractors WHERE status = 'ditunjuk'`,
        sql`SELECT COUNT(*) as count FROM contractors WHERE status = 'rejected'`,
        sql`SELECT id, full_name, company_name, status, created_at FROM contractors ORDER BY created_at DESC LIMIT 5`,
      ]);

    // Count users safely — column may not exist yet
    let totalUsers = [{ count: 0 }];
    try {
      totalUsers = await sql`SELECT COUNT(*) as count FROM auth_users`;
    } catch {}

    return Response.json({
      stats: {
        total: parseInt(totalContractors[0].count),
        pending: parseInt(pendingApprovals[0].count),
        approved: parseInt(approvedContractors[0].count),
        ditunjuk: parseInt(ditunjukContractors[0].count),
        rejected: parseInt(rejectedContractors[0].count),
        totalUsers: parseInt(totalUsers[0].count),
      },
      recentSubmissions,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
