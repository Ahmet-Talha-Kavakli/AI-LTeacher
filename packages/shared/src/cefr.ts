import { z } from "zod";

export const CefrLevel = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export type CefrLevel = z.infer<typeof CefrLevel>;

export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const CEFR_DESCRIPTIONS: Record<CefrLevel, string> = {
  A1: "Beginner — basic phrases and everyday expressions",
  A2: "Elementary — simple, routine tasks and familiar topics",
  B1: "Intermediate — main points of clear standard input",
  B2: "Upper intermediate — complex text on concrete or abstract topics",
  C1: "Advanced — flexible and effective use of language",
  C2: "Mastery — full understanding and nuanced expression",
};

export const PlacementAnswer = z.object({
  questionId: z.string(),
  answer: z.string(),
  timeMs: z.number().int().nonnegative(),
});
export type PlacementAnswer = z.infer<typeof PlacementAnswer>;

export const PlacementResult = z.object({
  level: CefrLevel,
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  recommendedPathId: z.string().optional(),
});
export type PlacementResult = z.infer<typeof PlacementResult>;
