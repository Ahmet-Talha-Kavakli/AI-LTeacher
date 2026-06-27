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
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@ailt/shared";
import { useOnboardingStore } from "@/state/onboarding";

export default function LanguageScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const setLanguage = useOnboardingStore((s) => s.setLanguage);
  const [selected, setSelected] = useState<LanguageCode | null>(null);

  return (
    <Screen scroll>
      <Text variant="title">{t("language.title")}</Text>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: SPACING.xl }}>
        {t("language.hint")}
      </Text>

      <View style={{ gap: SPACING.md }}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = selected === lang.code;
          return (
            <Card
              key={lang.code}
              variant={isActive ? "accent" : "surface"}
              onPress={() => setSelected(lang.code)}
              style={isActive ? { borderColor: theme.colors.accent, borderWidth: 2 } : undefined}
            >
              <View style={styles.row}>
                <Text variant="display">{lang.flagEmoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="heading">{lang.nameNative}</Text>
                  <Text variant="caption" color="textSecondary">{lang.nameEn}</Text>
                </View>
                {isActive && <IconSymbol name="checkmark.circle.fill" size={28} color={theme.colors.accent} />}
              </View>
            </Card>
          );
        })}
      </View>

      <View style={{ marginTop: SPACING.xl }}>
        <Button
          label={t("common.continue")}
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            setLanguage(selected);
            router.push("/(onboarding)/accent");
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.lg },
});
