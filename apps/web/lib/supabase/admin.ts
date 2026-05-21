import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Loose typing: we don't generate Database types yet. Tighten later via
// `supabase gen types typescript` once the local DB is provisioned.
type AnyDb = any;

let cached: SupabaseClient<AnyDb> | null = null;

export function supabaseAdmin(): SupabaseClient<AnyDb> {
  if (cached) return cached;
  cached = createClient<AnyDb>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  return cached;
}
