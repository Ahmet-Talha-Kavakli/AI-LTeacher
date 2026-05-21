import { z } from "zod";

export const SubscriptionTier = z.enum(["free", "plus", "pro"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTier>;

/**
 * Daily quota per tier. Every feature is capped on every tier —
 * "no unlimited anywhere" is a product principle. Tune these by watching
 * real cost per active user.
 */
export interface QuotaLimits {
  /** ElevenLabs voice tutor (Turbo TTS + on-device STT pipeline). */
  voiceSeconds: number;
  /** Meshy-character + lipsync video tutor. Premium-gated. */
  videoSeconds: number;
  /** Text chat tutor messages (gpt-4o-mini). */
  tutorMessages: number;
  /** New lessons started per day. */
  lessonsStarted: number;
  /** AI image generations (FAL) for lesson cards / scenes. */
  imageGenerations: number;
  /** Custom Meshy character generations (Pro only). */
  customAvatarGenerations: number;
}

export const QUOTAS: Record<SubscriptionTier, QuotaLimits> = {
  free: {
    voiceSeconds: 5 * 60,        // 5 dk/gün — "tat"
    videoSeconds: 0,             // hiç
    tutorMessages: 30,           // 30 mesaj — ağıza bal
    lessonsStarted: 3,           // 3 ders/gün
    imageGenerations: 0,         // 0 — content tarafı
    customAvatarGenerations: 0,  // 0 — pool'dan seçer
  },
  plus: {
    voiceSeconds: 30 * 60,       // 30 dk/gün
    videoSeconds: 5 * 60,        // 5 dk/gün video tutor
    tutorMessages: 500,
    lessonsStarted: 25,
    imageGenerations: 10,
    customAvatarGenerations: 0,  // pool'dan seçer
  },
  pro: {
    voiceSeconds: 120 * 60,      // 2 saat/gün
    videoSeconds: 30 * 60,       // 30 dk/gün
    tutorMessages: 5000,
    lessonsStarted: 100,
    imageGenerations: 50,
    customAvatarGenerations: 3,  // günde 3 özel karakter
  },
};

export type QuotaFeature = keyof QuotaLimits;

export const QuotaUsage = z.object({
  voiceSeconds: z.number().int().nonnegative(),
  videoSeconds: z.number().int().nonnegative(),
  tutorMessages: z.number().int().nonnegative(),
  lessonsStarted: z.number().int().nonnegative(),
  imageGenerations: z.number().int().nonnegative(),
  customAvatarGenerations: z.number().int().nonnegative(),
});
export type QuotaUsage = z.infer<typeof QuotaUsage>;

export const QuotaStatus = z.object({
  tier: SubscriptionTier,
  date: z.string(),
  usage: QuotaUsage,
  limits: z.object({
    voiceSeconds: z.number(),
    videoSeconds: z.number(),
    tutorMessages: z.number(),
    lessonsStarted: z.number(),
    imageGenerations: z.number(),
    customAvatarGenerations: z.number(),
  }),
});
export type QuotaStatus = z.infer<typeof QuotaStatus>;
