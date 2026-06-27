import { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SPACING, RADIUS } from "@/theme";
import { useTheme } from "@/hooks/use-theme";
import { useOnboardingStore } from "@/state/onboarding";
import type { PlacementQuestion, PlacementAnswer } from "@ailt/shared";
import { api, ApiError } from "@/lib/api";

export default function PlacementScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useOnboardingStore((s) => s.language);
  const setAnswers = useOnboardingStore((s) => s.setAnswers);

  const [questions, setQuestions] = useState<PlacementQuestion[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [collected, setCollected] = useState<PlacementAnswer[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!language) return;
    let cancelled = false;
    setLoadError(null);
    api<{ questions: PlacementQuestion[] }>("/api/placement/start", {
      method: "POST",
      body: JSON.stringify({ language }),
    })
      .then((res) => {
        if (cancelled) return;
        setQuestions(res.questions);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof ApiError
          ? t("placement.loadFailedBodyHttp", { status: err.status })
          : t("placement.loadFailedBodyGeneric");
        setLoadError(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [language, t]);

  useEffect(() => {
    setStartedAt(Date.now());
    setPick(null);
  }, [index]);

  if (!language) {
    return (
      <Screen>
        <Text variant="body">{t("placement.needLanguageFirst")}</Text>
        <Button label={t("placement.back")} onPress={() => router.back()} />
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md }}>
          <Text variant="heading" align="center">{t("placement.loadFailedTitle")}</Text>
          <Text variant="caption" color="textSecondary" align="center">{loadError}</Text>
        </View>
        <Button label={t("placement.tryAgain")} onPress={() => {
          setLoadError(null);
          setQuestions(null);
          router.replace("/(onboarding)/placement");
        }} />
      </Screen>
    );
  }

  if (!questions) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md }}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
          <Text variant="caption" color="textSecondary">{t("placement.loading")}</Text>
        </View>
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

  const categoryLabel = q.category ? t(`placement.category.${q.category}`, { defaultValue: "" }) : "";

  return (
    <Screen>
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: theme.colors.accent, width: `${progress * 100}%` }]} />
      </View>

      <Text variant="caption" color="textSecondary" style={{ marginTop: SPACING.lg }}>
        {t("placement.questionOf", { i: index + 1, total: questions.length })} · {q.difficulty}
        {categoryLabel ? ` · ${categoryLabel}` : ""}
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

      <Button
        label={isLast ? t("placement.submitLast") : t("placement.submitNext")}
        onPress={submit}
        disabled={!pick}
      />
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
