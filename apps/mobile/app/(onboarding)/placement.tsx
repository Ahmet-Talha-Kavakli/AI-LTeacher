import { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SPACING, RADIUS } from "@/theme";
import { useTheme } from "@/hooks/use-theme";
import { useOnboardingStore } from "@/state/onboarding";
import type { PlacementQuestion, PlacementAnswer } from "@ailt/shared";

// V1: use a local bank for the placement quiz so onboarding works without backend.
// Once auth is wired, swap to GET /api/placement/start.
const LOCAL_BANK: Record<string, PlacementQuestion[]> = {
  en: [
    { id: "en_a1_1", prompt: "Hello, how ___ you?", type: "multiple_choice", options: ["is", "are", "am", "be"], difficulty: "A1" },
    { id: "en_a2_1", prompt: "Yesterday I ___ to the cinema.", type: "multiple_choice", options: ["go", "went", "gone", "going"], difficulty: "A2" },
    { id: "en_b1_1", prompt: "If I ___ more time, I would learn another language.", type: "multiple_choice", options: ["have", "had", "would have", "having"], difficulty: "B1" },
    { id: "en_b2_1", prompt: "Closest in meaning to 'ubiquitous':", type: "multiple_choice", options: ["rare", "everywhere", "ancient", "useful"], difficulty: "B2" },
    { id: "en_c1_1", prompt: "Closest in meaning to 'to mitigate':", type: "multiple_choice", options: ["worsen", "ease", "ignore", "repeat"], difficulty: "C1" },
  ],
  es: [
    { id: "es_a1_1", prompt: "¿Cómo ___ llamas?", type: "multiple_choice", options: ["te", "me", "se", "le"], difficulty: "A1" },
    { id: "es_a2_1", prompt: "Ayer ___ al parque.", type: "multiple_choice", options: ["voy", "fui", "iré", "iba"], difficulty: "A2" },
    { id: "es_b1_1", prompt: "Si ___ tiempo, viajaría más.", type: "multiple_choice", options: ["tengo", "tuviera", "tendré", "tuve"], difficulty: "B1" },
    { id: "es_b2_1", prompt: "Significado de 'a menudo':", type: "multiple_choice", options: ["raramente", "frecuentemente", "nunca", "ayer"], difficulty: "B2" },
    { id: "es_c1_1", prompt: "El término 'soslayar' significa:", type: "multiple_choice", options: ["evitar", "enfrentar", "perder", "buscar"], difficulty: "C1" },
  ],
  de: [
    { id: "de_a1_1", prompt: "Wie ___ du?", type: "multiple_choice", options: ["heißt", "heißen", "heiße", "heißt du"], difficulty: "A1" },
    { id: "de_a2_1", prompt: "Er ___ jeden Tag Kaffee.", type: "multiple_choice", options: ["trinkt", "trink", "trinken", "trank"], difficulty: "A2" },
    { id: "de_b1_1", prompt: "Wenn ich Zeit ___, würde ich reisen.", type: "multiple_choice", options: ["habe", "hätte", "hatte", "haben"], difficulty: "B1" },
    { id: "de_b2_1", prompt: "Bedeutung von 'allerdings':", type: "multiple_choice", options: ["außerdem", "jedoch", "deshalb", "anschließend"], difficulty: "B2" },
    { id: "de_c1_1", prompt: "Synonym für 'erörtern':", type: "multiple_choice", options: ["diskutieren", "verschweigen", "vergessen", "loben"], difficulty: "C1" },
  ],
};

export default function PlacementScreen() {
  const router = useRouter();
  const theme = useTheme();
  const language = useOnboardingStore((s) => s.language);
  const setAnswers = useOnboardingStore((s) => s.setAnswers);

  const questions = useMemo<PlacementQuestion[]>(
    () => (language ? LOCAL_BANK[language] ?? [] : []),
    [language],
  );

  const [index, setIndex] = useState(0);
  const [collected, setCollected] = useState<PlacementAnswer[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    setStartedAt(Date.now());
    setPick(null);
  }, [index]);

  if (!language || questions.length === 0) {
    return (
      <Screen>
        <Text variant="body">Önce dil seçmelisin.</Text>
        <Button label="Geri dön" onPress={() => router.back()} />
      </Screen>
    );
  }

  const q = questions[index];
  const isLast = index === questions.length - 1;
  const progress = (index + 1) / questions.length;

  function submit() {
    if (!pick) return;
    const answer: PlacementAnswer = {
      questionId: q.id,
      answer: pick,
      timeMs: Date.now() - startedAt,
    };
    const next = [...collected, answer];
    setCollected(next);
    if (isLast) {
      setAnswers(next);
      router.replace("/(onboarding)/result");
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <Screen>
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: theme.colors.accent, width: `${progress * 100}%` }]} />
      </View>

      <Text variant="caption" color="textSecondary" style={{ marginTop: SPACING.lg }}>
        Soru {index + 1} / {questions.length} · {q.difficulty}
      </Text>
      <Text variant="heading" style={{ marginTop: SPACING.sm, marginBottom: SPACING.xl }}>
        {q.prompt}
      </Text>

      <View style={{ gap: SPACING.md, flex: 1 }}>
        {q.options?.map((opt) => {
          const isActive = pick === opt;
          return (
            <Card
              key={opt}
              variant={isActive ? "accent" : "surface"}
              onPress={() => setPick(opt)}
              style={isActive ? { borderColor: theme.colors.accent, borderWidth: 2 } : undefined}
            >
              <Text variant="bodyMedium" color={isActive ? "accent" : "text"}>{opt}</Text>
            </Card>
          );
        })}
      </View>

      <Button label={isLast ? "Bitir ve sonucu gör" : "Sonraki"} onPress={submit} disabled={!pick} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressTrack: {
    height: 6,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: RADIUS.pill },
});
