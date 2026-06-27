import { supabase } from "./supabase";
import { api } from "./api";

export async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  // Anonymous users are ghost accounts — delete them on sign-out so the DB
  // doesn't accumulate one row per "try it free" tap. Best-effort: even if
  // the delete API fails, we still sign out locally.
  const { data } = await supabase.auth.getSession();
  if (data.session?.user.is_anonymous) {
    await api("/api/account/delete-if-anonymous", { method: "POST" }).catch(() => null);
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_languages")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}
