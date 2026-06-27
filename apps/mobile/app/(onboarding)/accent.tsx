import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SPACING } from "@/theme";
import { useTheme } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LANGUAGES, type AccentCode } from "@ailt/shared";
import { useOnboardingStore } from "@/state/onboarding";

export default function AccentScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useOnboardingStore((s) => s.language);
  const setAccent = useOnboardingStore((s) => s.setAccent);
  const [selected, setSelected] = useState<AccentCode | null>(null);

  if (!language) {
    return (
      <Screen>
        <Text variant="body">{t("accent.needLanguageFirst")}</Text>
        <Button label={t("common.back")} onPress={() => router.back()} />
      </Screen>
    );
  }

  const def = LANGUAGES[language];

  return (
    <Screen scroll>
      <Text variant="title">{t("accent.title")}</Text>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: SPACING.xl }}>
        {t("accent.hint")}
      </Text>

      <View style={{ gap: SPACING.md }}>
        {def.accents.map((accent) => {
          const isActive = selected === accent.code;
          return (
            <Card
              key={accent.code}
              variant={isActive ? "accent" : "surface"}
              onPress={() => setSelected(accent.code)}
              style={isActive ? { borderColor: theme.colors.accent, borderWidth: 2 } : undefined}
            >
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text variant="heading">{accent.label}</Text>
                  <Text variant="caption" color="textSecondary">{accent.region}</Text>
                </View>
                {isActive && <IconSymbol name="checkmark.circle.fill" size={28} color={theme.colors.accent} />}
              </View>
            </Card>
          );
        })}
      </View>

      <View style={{ marginTop: SPACING.xl }}>
        <Button
          label={t("accent.continueToTest")}
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setAccent(selected);
            router.push("/(onboarding)/placement");
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.lg },
});
