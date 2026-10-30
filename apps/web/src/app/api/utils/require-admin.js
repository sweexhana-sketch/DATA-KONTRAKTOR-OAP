import { requireAdminRole } from "@/app/api/utils/security";
export async function requireAdmin() {
  return requireAdminRole();
}
