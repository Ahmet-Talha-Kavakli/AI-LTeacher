import { NextResponse } from "next/server";
import { QUOTAS, type QuotaFeature, type SubscriptionTier } from "@ailt/shared";
import { supabaseAdmin } from "./supabase/admin";

const FEATURE_TO_QUOTA: Record<QuotaFeature, string> = {
  voiceSeconds: "voice_seconds",
  videoSeconds: "video_seconds",
  tutorMessages: "tutor_messages",
  lessonsStarted: "lessons_started",
  imageGenerations: "image_generations",
  customAvatarGenerations: "custom_avatar_generations",
};

export async function getTier(userId: string): Promise<SubscriptionTier> {
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .single();
  return (data?.subscription_tier as SubscriptionTier) ?? "free";
}

/**
 * Atomically check & consume quota. Returns true if granted, false if would
 * exceed the cap. On false, the caller should return a 402-style response
 * with `feature` + `tier` so the mobile app can show an upsell or downgrade.
 */
export async function consume(
  userId: string,
  feature: QuotaFeature,
  amount = 1,
  tier?: SubscriptionTier,
): Promise<{ ok: true } | { ok: false; tier: SubscriptionTier; feature: QuotaFeature; cap: number }> {
  const userTier = tier ?? (await getTier(userId));
  const cap = QUOTAS[userTier][feature];

  // Cap of 0 means the feature is gated for this tier — short-circuit.
  if (cap === 0) {
    return { ok: false, tier: userTier, feature, cap };
  }

  const { data, error } = await supabaseAdmin().rpc("consume_quota", {
    p_user_id: userId,
    p_feature: FEATURE_TO_QUOTA[feature],
    p_amount: amount,
    p_cap: cap,
  });
  if (error) throw error;

  if (data === true) return { ok: true };
  return { ok: false, tier: userTier, feature, cap };
}

export function quotaExceededResponse(
  tier: SubscriptionTier,
  feature: QuotaFeature,
  cap: number,
) {
  return NextResponse.json(
    {
      error: "quota_exceeded",
      tier,
      feature,
      cap,
      suggestion: tier === "free" ? "upgrade_plus" : tier === "plus" ? "upgrade_pro" : "wait_tomorrow",
    },
    { status: 402 },
  );
}

export async function getQuotaStatus(userId: string) {
  const tier = await getTier(userId);
  const { data } = await supabaseAdmin()
    .from("user_quotas")
    .select("*")
    .eq("user_id", userId)
    .single();

  const usage = {
    voiceSeconds: data?.voice_seconds_used ?? 0,
    videoSeconds: data?.video_seconds_used ?? 0,
    tutorMessages: data?.tutor_messages_used ?? 0,
    lessonsStarted: data?.lessons_started_today ?? 0,
    imageGenerations: data?.image_generations_used ?? 0,
    customAvatarGenerations: data?.custom_avatar_generations_used ?? 0,
  };

  return {
    tier,
    date: data?.quota_date ?? new Date().toISOString().slice(0, 10),
    usage,
    limits: QUOTAS[tier],
  };
}
