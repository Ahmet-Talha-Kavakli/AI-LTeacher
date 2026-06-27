import { z } from "zod";
import { CefrLevel, PlacementAnswer, PlacementResult } from "./cefr";
import { LanguageCode, AccentCode } from "./languages";

export const PlacementStartRequest = z.object({
  language: LanguageCode,
  userId: z.string().uuid(),
});
export type PlacementStartRequest = z.infer<typeof PlacementStartRequest>;

export const PlacementCategory = z.enum(["grammar", "vocabulary", "context"]);
export type PlacementCategory = z.infer<typeof PlacementCategory>;

export const PlacementQuestion = z.object({
  id: z.string(),
  prompt: z.string(),
  type: z.enum(["multiple_choice", "fill_blank", "translate", "listen"]),
  category: PlacementCategory.optional(),
  options: z.array(z.string()).optional(),
  audioUrl: z.string().optional(),
  difficulty: CefrLevel,
  explanation: z.string().optional(),
});
export type PlacementQuestion = z.infer<typeof PlacementQuestion>;

export const PlacementSubmitRequest = z.object({
  language: LanguageCode,
  userId: z.string().uuid(),
  answers: z.array(PlacementAnswer).min(1),
});
export type PlacementSubmitRequest = z.infer<typeof PlacementSubmitRequest>;

export const PlacementSubmitResponse = z.object({
  result: PlacementResult,
});
export type PlacementSubmitResponse = z.infer<typeof PlacementSubmitResponse>;

export const VoiceSessionTokenRequest = z.object({
  language: LanguageCode,
  accent: AccentCode,
  userId: z.string().uuid(),
  level: CefrLevel,
  lessonId: z.string().optional(),
});
export type VoiceSessionTokenRequest = z.infer<typeof VoiceSessionTokenRequest>;

export const VoiceSessionTokenResponse = z.object({
  signedUrl: z.string().url(),
  expiresAt: z.string(),
  agentId: z.string(),
});
export type VoiceSessionTokenResponse = z.infer<typeof VoiceSessionTokenResponse>;
