import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getQuotaStatus } from "@/lib/quota";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const [status, profile] = await Promise.all([
    getQuotaStatus(user.id),
    supabaseAdmin()
      .from("profiles")
      .select("cooldown_until, strike_count, cooldown_level")
      .eq("id", user.id)
      .single(),
  ]);

  const cooldownUntilStr: string | null = profile.data?.cooldown_until ?? null;
  const now = Date.now();
  const cooldownActive =
    !!cooldownUntilStr && new Date(cooldownUntilStr).getTime() > now;

  return Response.json({
    ...status,
    moderation: {
      strikeCount: profile.data?.strike_count ?? 0,
      cooldownLevel: profile.data?.cooldown_level ?? 0,
      cooldownUntil: cooldownActive ? cooldownUntilStr : null,
    },
  });
}
