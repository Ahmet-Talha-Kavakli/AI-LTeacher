import { router } from "expo-router";
import { supabase } from "./supabase";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`API ${status}`);
  }
}

// Guard so we don't fire the 401 handler in a loop (sign-out itself
// shouldn't trigger API calls, but defensive).
let handling401 = false;

async function handle401() {
  if (handling401) return;
  handling401 = true;
  try {
    // Best-effort: clear local session (SecureStore wipe via supabase-js)
    await supabase.auth.signOut().catch(() => null);
    // Land the user on welcome so they can re-auth from scratch.
    router.replace("/(onboarding)");
  } finally {
    // Reset guard after a tick so future 401s can still be handled.
    setTimeout(() => {
      handling401 = false;
    }, 2000);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    // Token references a user the server no longer recognizes
    // (deleted, expired, or invalidated). Sign out + redirect.
    void handle401();
    throw new ApiError(401, { error: "unauthorized" });
  }

  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
