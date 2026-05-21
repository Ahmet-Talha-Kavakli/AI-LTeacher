import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getQuotaStatus } from "@/lib/quota";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const status = await getQuotaStatus(user.id);
  return Response.json(status);
}
