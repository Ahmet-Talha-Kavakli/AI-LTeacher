import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Loose typing: we don't generate Database types yet. Tighten later via
// `supabase gen types typescript` once the local DB is provisioned.
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  return cached;
}
