// One-off seed script. Generates ~30 placement questions per language using
// Claude Opus and inserts them into Supabase. Idempotent — re-running with a
// non-empty table is fine; rows are namespaced by a unique id including the
// run timestamp, so duplicates pile up rather than overwriting. For a fresh
// seed, truncate placement_questions in SQL editor first.
//
// Run:  pnpm --filter web tsx scripts/seed-placement-questions.ts
//
// Cost estimate: ~18 Opus calls, ~$1.50 total.

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
] as const;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

// Each (language, level) batch produces 5 questions in this exact order:
// 2 grammar, 2 vocabulary, 1 context. Total seed: 3 langs × 6 levels × 5 = 90.
const DISTRIBUTION = [
  { category: "grammar" as const, count: 2 },
  { category: "vocabulary" as const, count: 2 },
  { category: "context" as const, count: 1 },
];
const QUESTIONS_PER_BATCH = DISTRIBUTION.reduce((s, d) => s + d.count, 0);

const QuestionSchema = z.object({
  category: z.enum(["grammar", "vocabulary", "context"]),
  prompt: z.string().min(3).max(400),
  options: z.array(z.string().min(1).max(120)).length(4),
  correctAnswer: z.string().min(1).max(120),
  explanation: z.string().min(3).max(240),
});

const BatchSchema = z.object({
  questions: z.array(QuestionSchema).length(QUESTIONS_PER_BATCH),
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function generateBatch(language: { code: string; name: string }, level: string) {
  const distSpec = DISTRIBUTION.map(
    (d, i) => `  ${i + 1}. ${d.count} ${d.category} question${d.count > 1 ? "s" : ""}`,
  ).join("\n");

  const { object } = await generateObject({
    model: anthropic("claude-opus-4-7"),
    schema: BatchSchema,
    system:
      "You are an expert language test author. You design CEFR-aligned placement exam items for self-study learners. Your questions discriminate between adjacent CEFR bands precisely. Wrong options are common learner mistakes, never obviously absurd. The stem is always written in the target language. Multiple choice with exactly one correct answer.",
    prompt: `Generate EXACTLY ${QUESTIONS_PER_BATCH} multiple-choice placement questions in this order:
${distSpec}

LANGUAGE: ${language.name} (${language.code})
CEFR LEVEL: ${level}

CATEGORY DEFINITIONS:
- "grammar": tests verb conjugation, tense usage, articles, prepositions, sentence structure
- "vocabulary": tests word meanings, synonyms/antonyms, collocations, idioms appropriate to the level
- "context": a 1–2 sentence scenario with a missing word (___); the learner picks the most natural fit

DIFFICULTY CALIBRATION (must rigorously match):
- A1: top ~500 words, present tense, basic phrases, survival vocabulary
- A2: past/future simple, daily routines, common situations
- B1: conditionals, perfect tenses, mid-frequency vocabulary, simple opinions
- B2: nuanced tenses, abstract topics, advanced collocations, register awareness
- C1: idioms, formal/informal register, sophisticated syntax, rare-but-natural vocabulary
- C2: near-native, full nuance, low-frequency words, complex literary or specialized usage

CRITICAL RULES:
- The "prompt" (question stem) MUST be written in ${language.name}. Do not write the question in English unless the target language IS English.
- All 4 "options" must be in ${language.name}.
- "correctAnswer" must match one of the four options EXACTLY (verbatim string).
- The 3 distractors must be PLAUSIBLE — represent common learner mistakes at the level.
- "explanation" is a short English sentence (max 240 chars) explaining why the answer is correct. It is shown to the learner after they answer.
- Avoid duplicate options. Avoid options that are mere capitalization or whitespace variants.
- For context items, use a recognizable real-life scenario.`,
  });
  return object.questions;
}

async function main() {
  console.log(`\nSeeding placement questions for ${LANGUAGES.length} languages × ${LEVELS.length} levels`);
  console.log(`= ${LANGUAGES.length * LEVELS.length} Opus calls, ${LANGUAGES.length * LEVELS.length * QUESTIONS_PER_BATCH} questions total\n`);

  let totalInserted = 0;
  let counter = 0;
  const total = LANGUAGES.length * LEVELS.length;

  for (const lang of LANGUAGES) {
    for (const level of LEVELS) {
      counter++;
      const tag = `${lang.code}/${level}`;
      const startMs = Date.now();
      process.stdout.write(`[${counter}/${total}] ${tag} ... `);

      try {
        const batch = await generateBatch(lang, level);
        const runTag = Date.now().toString(36);
        const rows = batch.map((q, idx) => ({
          id: `${lang.code}_${level.toLowerCase()}_${q.category}_${runTag}_${idx}`,
          language: lang.code,
          difficulty: level,
          category: q.category,
          prompt: q.prompt,
          options: q.options,
          correct_answer: q.correctAnswer,
          explanation: q.explanation,
        }));
        const { error } = await supabase.from("placement_questions").insert(rows);
        if (error) {
          console.error(`✗ insert failed: ${error.message}`);
          continue;
        }
        totalInserted += rows.length;
        const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
        console.log(`✓ ${rows.length} q (${elapsed}s)`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`✗ generation failed: ${msg}`);
      }
    }
  }

  console.log(`\nDone. Inserted ${totalInserted} questions total.`);
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
