import { NextRequest } from "next/server";
import { z } from "zod";
import {
  CefrLevel,
  LanguageCode,
  PlacementQuestion,
} from "@ailt/shared";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

const Body = z.object({
  language: LanguageCode,
});

/**
 * Returns a curated, adaptive sequence of placement questions.
 * V1: static question bank per language, sampled across CEFR levels.
 * V2: AI-generated adaptive items.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const { language } = parsed.data;
  const questions = buildQuestionBank(language);
  return Response.json({ questions });
}

function buildQuestionBank(language: LanguageCode): PlacementQuestion[] {
  const bank = QUESTION_BANK[language];
  const sample = (level: CefrLevel) =>
    bank.filter((q) => q.difficulty === level).slice(0, 2);
  return [
    ...sample("A1"),
    ...sample("A2"),
    ...sample("B1"),
    ...sample("B2"),
    ...sample("C1"),
  ];
}

// V1 seed bank — small but real. Will grow with usage.
const QUESTION_BANK: Record<LanguageCode, PlacementQuestion[]> = {
  en: [
    { id: "en_a1_1", prompt: "Hello, how ___ you?", type: "multiple_choice", options: ["is", "are", "am", "be"], difficulty: "A1" },
    { id: "en_a1_2", prompt: "I ___ a student.", type: "multiple_choice", options: ["am", "is", "are", "be"], difficulty: "A1" },
    { id: "en_a2_1", prompt: "Yesterday I ___ to the cinema.", type: "multiple_choice", options: ["go", "went", "gone", "going"], difficulty: "A2" },
    { id: "en_a2_2", prompt: "She ___ coffee every morning.", type: "multiple_choice", options: ["drink", "drinks", "drinking", "drank"], difficulty: "A2" },
    { id: "en_b1_1", prompt: "If I ___ more time, I would learn another language.", type: "multiple_choice", options: ["have", "had", "would have", "having"], difficulty: "B1" },
    { id: "en_b1_2", prompt: "By the time we arrived, the film ___ already started.", type: "multiple_choice", options: ["has", "had", "have", "was"], difficulty: "B1" },
    { id: "en_b2_1", prompt: "Choose the closest meaning to 'ubiquitous':", type: "multiple_choice", options: ["rare", "everywhere", "ancient", "useful"], difficulty: "B2" },
    { id: "en_b2_2", prompt: "I wish I ___ told her the truth.", type: "multiple_choice", options: ["have", "had", "would", "did"], difficulty: "B2" },
    { id: "en_c1_1", prompt: "The committee's recommendations were largely ___ by management.", type: "multiple_choice", options: ["overlooked", "overseen", "overtaken", "overcome"], difficulty: "C1" },
    { id: "en_c1_2", prompt: "Closest in meaning to 'to mitigate':", type: "multiple_choice", options: ["worsen", "ease", "ignore", "repeat"], difficulty: "C1" },
  ],
  es: [
    { id: "es_a1_1", prompt: "¿Cómo ___ llamas?", type: "multiple_choice", options: ["te", "me", "se", "le"], difficulty: "A1" },
    { id: "es_a1_2", prompt: "Yo ___ de Turquía.", type: "multiple_choice", options: ["soy", "es", "estoy", "está"], difficulty: "A1" },
    { id: "es_a2_1", prompt: "Ayer ___ al parque.", type: "multiple_choice", options: ["voy", "fui", "iré", "iba"], difficulty: "A2" },
    { id: "es_a2_2", prompt: "Mi hermana ___ médica.", type: "multiple_choice", options: ["es", "está", "ser", "estar"], difficulty: "A2" },
    { id: "es_b1_1", prompt: "Si ___ tiempo, viajaría más.", type: "multiple_choice", options: ["tengo", "tuviera", "tendré", "tuve"], difficulty: "B1" },
    { id: "es_b1_2", prompt: "Espero que ___ pronto.", type: "multiple_choice", options: ["vienes", "vengas", "vendrás", "viniste"], difficulty: "B1" },
    { id: "es_b2_1", prompt: "Significado de 'a menudo':", type: "multiple_choice", options: ["raramente", "frecuentemente", "nunca", "ayer"], difficulty: "B2" },
    { id: "es_b2_2", prompt: "Aunque ___ cansado, fue al gimnasio.", type: "multiple_choice", options: ["está", "estaba", "estuviera", "esté"], difficulty: "B2" },
    { id: "es_c1_1", prompt: "El término 'soslayar' significa:", type: "multiple_choice", options: ["evitar", "enfrentar", "perder", "buscar"], difficulty: "C1" },
    { id: "es_c1_2", prompt: "Sinónimo de 'efímero':", type: "multiple_choice", options: ["eterno", "fugaz", "lento", "denso"], difficulty: "C1" },
  ],
  de: [
    { id: "de_a1_1", prompt: "Wie ___ du?", type: "multiple_choice", options: ["heißt", "heißen", "heiße", "heißt du"], difficulty: "A1" },
    { id: "de_a1_2", prompt: "Ich ___ aus der Türkei.", type: "multiple_choice", options: ["bin", "ist", "bist", "sind"], difficulty: "A1" },
    { id: "de_a2_1", prompt: "Gestern ___ ich ins Kino gegangen.", type: "multiple_choice", options: ["bin", "habe", "war", "hatte"], difficulty: "A2" },
    { id: "de_a2_2", prompt: "Er ___ jeden Tag Kaffee.", type: "multiple_choice", options: ["trinkt", "trink", "trinken", "trank"], difficulty: "A2" },
    { id: "de_b1_1", prompt: "Wenn ich Zeit ___, würde ich reisen.", type: "multiple_choice", options: ["habe", "hätte", "hatte", "haben"], difficulty: "B1" },
    { id: "de_b1_2", prompt: "Das Buch, ___ ich lese, ist spannend.", type: "multiple_choice", options: ["der", "das", "die", "den"], difficulty: "B1" },
    { id: "de_b2_1", prompt: "Bedeutung von 'allerdings':", type: "multiple_choice", options: ["außerdem", "jedoch", "deshalb", "anschließend"], difficulty: "B2" },
    { id: "de_b2_2", prompt: "Er tat, als ob er müde ___.", type: "multiple_choice", options: ["ist", "war", "wäre", "sei"], difficulty: "B2" },
    { id: "de_c1_1", prompt: "Synonym für 'erörtern':", type: "multiple_choice", options: ["diskutieren", "verschweigen", "vergessen", "loben"], difficulty: "C1" },
    { id: "de_c1_2", prompt: "Bedeutung von 'durchaus':", type: "multiple_choice", options: ["niemals", "absolut", "kaum", "fast"], difficulty: "C1" },
  ],
};
