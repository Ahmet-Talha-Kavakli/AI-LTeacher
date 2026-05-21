import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const { data, error } = await supabaseAdmin()
    .from("avatar_pool")
    .select("id, name, description, art_style, preview_image_url, glb_url, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    return Response.json({ error: "fetch_failed" }, { status: 500 });
  }
  return Response.json({ characters: data ?? [] });
}
