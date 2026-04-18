import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Endpoint untuk membuat user pertama menjadi admin
// PENTING: Hapus endpoint ini setelah admin pertama dibuat!
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user menjadi admin
    const result = await sql`
      UPDATE auth_users 
      SET role = 'admin' 
      WHERE id = ${session.user.id}
      RETURNING id, email, role
    `;

    return Response.json({
      message: "User berhasil dijadikan admin",
      user: result[0],
    });
  } catch (error) {
    console.error("Error making admin:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
