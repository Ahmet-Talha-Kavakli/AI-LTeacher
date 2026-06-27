import { NextRequest } from "next/server";
import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { TUTOR_MODEL, tutorSystemPrompt } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { checkLimit } from "@/lib/rate-limit";
import { consume, getTier, quotaExceededResponse } from "@/lib/quota";
import { moderate } from "@/lib/moderation";
import {
  checkChatGate,
  recordStrike,
  COOLDOWN_MESSAGES,
  strikeToneInstruction,
} from "@/lib/strikes";
import { LANGUAGES, type LanguageCode, type AccentCode } from "@ailt/shared";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  language: z.enum(["en", "es", "de"] as [LanguageCode, ...LanguageCode[]]),
  accent: z.string() as z.ZodType<AccentCode>,
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  nativeLanguage: z.string().optional(),
  messages: z.array(z.any()) as z.ZodType<UIMessage[]>,
});

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  // Cooldown gate — refuse before doing anything else (no quota / no AI call)
  const gate = await checkChatGate(user.id);
  if (!gate.allowed) {
    return Response.json(
      { error: "cooldown", cooldownUntil: gate.cooldownUntil.toISOString() },
      { status: 403 },
    );
  }

  const burst = await checkLimit("tutor_chat", user.id, 30, 60);
  if (!burst.success) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  const tier = await getTier(user.id);
  const quota = await consume(user.id, "tutorMessages", 1, tier);
  if (!quota.ok) return quotaExceededResponse(quota.tier, quota.feature, quota.cap);

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "bad_request", details: parsed.error.format() }, { status: 400 });
  }

  const { language, accent, level, nativeLanguage, messages } = parsed.data;
  const langName = LANGUAGES[language].nameEn;
  const baseSystem = tutorSystemPrompt({ language: langName, accent, level, nativeLanguage });

  // Moderate the last user message before sending anywhere.
  const lastUserText = extractLastUserText(messages);
  if (lastUserText) {
    const result = await moderate(lastUserText);
    if (result.triggered) {
      const outcome = await recordStrike(user.id, result, lastUserText);

      // 3rd strike → ders biter, hazır mesaj döner, LLM çağrılmaz.
      if (outcome.type === "cooldown") {
        const text = COOLDOWN_MESSAGES[language] ?? COOLDOWN_MESSAGES.en;
        const stream = createUIMessageStream({
          execute: async ({ writer }) => {
            const id = crypto.randomUUID();
            writer.write({ type: "text-start", id });
            writer.write({ type: "text-delta", id, delta: text });
            writer.write({ type: "text-end", id });
          },
        });
        return createUIMessageStreamResponse({ stream });
      }

      // 1st or 2nd strike → LLM hedef dilde yeniden yönlendir, ton sertleşir.
      const tone = strikeToneInstruction(outcome.strikeCount, outcome.category);
      const warned = streamText({
        model: TUTOR_MODEL,
        system: `${baseSystem}\n\n${tone}`,
        messages: await convertToModelMessages(messages),
      });
      return warned.toUIMessageStreamResponse();
    }
  }

  // Temiz mesaj → normal tutor akışı.
  const result = streamText({
    model: TUTOR_MODEL,
    system: baseSystem,
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}

function extractLastUserText(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last) return "";
  return last.parts
    .map((p) => (p.type === "text" ? (p as { type: "text"; text: string }).text : ""))
    .join("")
    .trim();
}
