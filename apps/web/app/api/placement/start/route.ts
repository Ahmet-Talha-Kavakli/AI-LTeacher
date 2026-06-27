import { NextRequest } from "next/server";
import { z } from "zod";
import { CefrLevel, LanguageCode, PlacementQuestion } from "@ailt/shared";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const Body = z.object({
  language: LanguageCode,
});

// Sample 3 questions per band A1–C1 = 15 questions per placement attempt.
// C2 lives in DB for future adaptive use but is excluded from the standard
// linear quiz (most users aren't C2; if they ace C1 we tag them "C1+").
const BANDS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];
const PER_BAND = 3;

type Row = {
  id: string;
  prompt: string;
  options: string[];
  difficulty: CefrLevel;
  category: "grammar" | "vocabulary" | "context";
};

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const { language } = parsed.data;

  const sampled: Row[] = [];
  for (const band of BANDS) {
    const { data, error } = await supabaseAdmin()
      .from("placement_questions")
      .select("id, prompt, options, difficulty, category")
      .eq("language", language)
      .eq("difficulty", band);

    if (error) {
      return Response.json({ error: "db_error", details: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as Row[];
    if (rows.length === 0) continue;

    // Random sample PER_BAND from this band's pool.
    const shuffled = rows.sort(() => Math.random() - 0.5);
    sampled.push(...shuffled.slice(0, PER_BAND));
  }

  if (sampled.length === 0) {
    return Response.json({ error: "no_questions_seeded" }, { status: 500 });
  }

  const questions: PlacementQuestion[] = sampled.map((r) => ({
    id: r.id,
    prompt: r.prompt,
    type: "multiple_choice",
    category: r.category,
    options: r.options,
    difficulty: r.difficulty,
  }));

  return Response.json({ questions });
}
