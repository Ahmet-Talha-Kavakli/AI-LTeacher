import { NextRequest } from "next/server";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import { TUTOR_MODEL, tutorSystemPrompt } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { checkLimit } from "@/lib/rate-limit";
import { consume, getTier, quotaExceededResponse } from "@/lib/quota";
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

  const result = streamText({
    model: TUTOR_MODEL,
    system: tutorSystemPrompt({ language: langName, accent, level, nativeLanguage }),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
