import { NextRequest } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import {
  CEFR_LEVELS,
  CefrLevel,
  PlacementSubmitRequest,
  type PlacementSubmitResponse,
} from "@ailt/shared";
import { LIGHT_MODEL, cachedSystemMessage } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const ResultSchema = z.object({
  level: z.enum(CEFR_LEVELS as [CefrLevel, ...CefrLevel[]]),
  confidence: z.number().min(0).max(1),
  rationale: z.string().max(280),
});

const SYSTEM = `You are an experienced CEFR placement examiner specializing in self-study language learners (English, Spanish, German).

Given a learner's answers to a short adaptive placement quiz, output:
- level: a single CEFR band (A1–C2)
- confidence: in [0, 1], where 1 is high
- rationale: one sentence, max 280 chars, in English

CALIBRATION GUIDANCE
- A1: needs basic phrases and survival vocabulary.
- A2: handles simple, routine exchanges.
- B1: deals with most situations while travelling; main points of clear input.
- B2: interacts fluently and spontaneously on a range of topics; complex text on concrete/abstract topics.
- C1: expresses ideas fluently and spontaneously; flexible and effective use.
- C2: near-native; full nuance.

DECISION RULES
- Be conservative. If performance is uneven, prefer the lower bound.
- A correct C1 answer alone does not imply C1; sustained accuracy across the band matters.
- A miss at a level the learner consistently gets right elsewhere is noise; do not let one mistake drop them a band.
- Single-attempt placement → confidence rarely exceeds 0.8.`;

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const parsed = PlacementSubmitRequest.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "bad_request", details: parsed.error.format() }, { status: 400 });
  }
  if (parsed.data.userId !== user.id) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { language, answers, userId } = parsed.data;

  const { object } = await generateObject({
    model: LIGHT_MODEL,
    schema: ResultSchema,
    messages: [
      cachedSystemMessage(SYSTEM),
      { role: "user", content: `Language: ${language}\nAnswers:\n${JSON.stringify(answers, null, 2)}` },
    ],
  });

  await supabaseAdmin().from("placement_results").insert({
    user_id: userId,
    language,
    level: object.level,
    confidence: object.confidence,
    rationale: object.rationale,
    raw_answers: answers,
  });

  await supabaseAdmin()
    .from("user_languages")
    .upsert(
      { user_id: userId, language, accent: defaultAccent(language), current_level: object.level, is_primary: true },
      { onConflict: "user_id,language" },
    );

  const body: PlacementSubmitResponse = { result: object };
  return Response.json(body);
}

function defaultAccent(language: string) {
  switch (language) {
    case "en":
      return "en-US";
    case "es":
      return "es-ES";
    case "de":
      return "de-DE";
    default:
      return "en-US";
  }
}
