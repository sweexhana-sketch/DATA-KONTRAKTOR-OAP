import { sameOrigin } from "@/app/api/utils/security";
export function verifyCsrf(request) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return null;
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan lintas origin ditolak" }, { status: 403 });
  const header = request.headers.get("x-requested-with");
  if (header !== "XMLHttpRequest") return Response.json({ error: "Permintaan tidak valid" }, { status: 403 });
  return null;
}
