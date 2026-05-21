import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase/admin";

export type AuthedUser = { id: string; email: string | null };

export async function requireUser(req: NextRequest): Promise<AuthedUser | NextResponse> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "missing_token" }, { status: 401 });
  }
  const token = auth.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }
  return { id: data.user.id, email: data.user.email ?? null };
}
