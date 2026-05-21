import { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SPACING, RADIUS } from "@/theme";
import { useTheme } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useOnboardingStore } from "@/state/onboarding";
import { CEFR_DESCRIPTIONS, type CefrLevel, type PlacementSubmitResponse } from "@ailt/shared";
import { useSession } from "@/hooks/use-session";
import { api, ApiError } from "@/lib/api";

// Offline fallback: highest difficulty correctly answered.
function scoreLocal(answers: { questionId: string; answer: string }[]): CefrLevel {
  const correct: Record<string, string> = {
    en_a1_1: "are", en_a2_1: "went", en_b1_1: "had", en_b2_1: "everywhere", en_c1_1: "ease",
    es_a1_1: "te",  es_a2_1: "fui",  es_b1_1: "tuviera", es_b2_1: "frecuentemente", es_c1_1: "evitar",
    de_a1_1: "heißt", de_a2_1: "trinkt", de_b1_1: "hätte", de_b2_1: "jedoch", de_c1_1: "diskutieren",
  };
  const levels: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];
  let best: CefrLevel = "A1";
  for (const a of answers) {
    if (correct[a.questionId] === a.answer) {
      const id = a.questionId.match(/_(a1|a2|b1|b2|c1)_/i)?.[1]?.toUpperCase() as CefrLevel | undefined;
      if (id && levels.indexOf(id) > levels.indexOf(best)) best = id;
    }
  }
  return best;
}

export default function ResultScreen() {
  const router = useRouter();
  const theme = useTheme();
  const session = useSession();
  const answers = useOnboardingStore((s) => s.answers);
  const language = useOnboardingStore((s) => s.language);

  const [level, setLevel] = useState<CefrLevel | null>(null);
  const [rationale, setRationale] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    if (!session?.user.id || !language || answers.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api<PlacementSubmitResponse>("/api/placement/submit", {
          method: "POST",
          body: JSON.stringify({ userId: session.user.id, language, answers }),
        });
        if (cancelled) return;
        setLevel(res.result.level);
        setRationale(res.result.rationale);
      } catch (err) {
        if (cancelled) return;
        // Backend not reachable (no API key, offline, etc.) → score locally
        const local = scoreLocal(answers);
        setLevel(local);
        setUsedFallback(true);
        if (!(err instanceof ApiError)) {
          console.warn("placement submit failed", err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id, language, answers]);

  if (!level) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: SPACING.md }}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
          <Text variant="bodyMedium" color="textSecondary">Cevapların değerlendiriliyor…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
          <Text variant="display" color="white">{level}</Text>
        </View>
        <Text variant="title" align="center" style={{ marginTop: SPACING.xl }}>
          Senin seviyen {level}
        </Text>
        <Text variant="bodyMedium" color="textSecondary" align="center" style={{ marginTop: SPACING.md, paddingHorizontal: SPACING.md }}>
          {rationale ?? CEFR_DESCRIPTIONS[level]}
        </Text>

        <Card variant="accent" style={{ marginTop: SPACING.xl, width: "100%" }}>
          <View style={styles.row}>
            <IconSymbol name="sparkles" size={20} color={theme.colors.accent} />
            <Text variant="callout" style={{ flex: 1 }}>
              Sana özel günlük {level === "A1" ? "10 dakikalık" : "15 dakikalık"} bir öğrenme yolu hazırladım.
            </Text>
          </View>
          {usedFallback && (
            <Text variant="caption" color="textSecondary" style={{ marginTop: SPACING.sm }}>
              (Offline puanlama — backend bağlandığında AI puanlaması devreye girecek.)
            </Text>
          )}
        </Card>
      </View>

      <Button label="Öğrenmeye Başla" onPress={() => router.replace("/(tabs)/learn")} />
      <Text variant="caption" color="textSecondary" align="center" style={{ marginTop: SPACING.sm }}>
        {language === "en" ? "English" : language === "es" ? "Español" : "Deutsch"} dersleri seni bekliyor.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 140,
    height: 140,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
});
