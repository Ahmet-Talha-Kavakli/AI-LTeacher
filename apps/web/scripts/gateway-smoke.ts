/**
 * Verifies AI Gateway routing for TUTOR_MODEL and LIGHT_MODEL.
 *
 * Run from apps/web:
 *   npx tsx --env-file=.env.local scripts/gateway-smoke.ts
 */
import { generateText } from "ai";
import { TUTOR_MODEL, LIGHT_MODEL } from "../lib/ai";

async function main() {
  console.log("→ TUTOR_MODEL (openai/gpt-4o-mini via gateway)…");
  const t = await generateText({
    model: TUTOR_MODEL,
    prompt: "Reply with exactly: gateway tutor ok",
    maxOutputTokens: 20,
  });
  console.log("  reply:", JSON.stringify(t.text.trim()));
  console.log("  usage:", t.usage);

  console.log("\n→ LIGHT_MODEL (anthropic/claude-haiku-4.5 via gateway)…");
  const l = await generateText({
    model: LIGHT_MODEL,
    prompt: "Reply with exactly: gateway light ok",
    maxOutputTokens: 20,
  });
  console.log("  reply:", JSON.stringify(l.text.trim()));
  console.log("  usage:", l.usage);
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
