import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Sign-out companion endpoint. If the caller is an anonymous user (one who
 * never registered with email/Apple), permanently delete them and their
 * cascading data so we don't accumulate ghost profiles. Registered users
 * are a no-op (their account survives sign-out as normal).
 *
 * Called from mobile BEFORE supabase.auth.signOut().
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.getUserById(user.id);
  if (error || !data?.user) {
    return Response.json({ error: "user_not_found" }, { status: 404 });
  }

  if (!data.user.is_anonymous) {
    return Response.json({ deleted: false, reason: "not_anonymous" });
  }

  // Cascade clean-up happens automatically via FK ON DELETE CASCADE chains:
  // auth.users → profiles → user_languages / placement_results / user_quotas /
  // user_lesson_progress / moderation_events / tutor_sessions / xp_events.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return Response.json({ error: "delete_failed", message: deleteError.message }, { status: 500 });
  }

  return Response.json({ deleted: true });
}
