import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/use-theme";
import { SPACING } from "@/theme";
import { useLocaleStore } from "@/state/locale";
import { getDeviceLanguage, SUPPORTED_APP_LANGUAGES, type AppLanguage } from "@/lib/i18n";

const LABELS: Record<AppLanguage, { native: string; flag: string }> = {
  en: { native: "English", flag: "🇬🇧" },
  tr: { native: "Türkçe", flag: "🇹🇷" },
};

export default function AppLanguageSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const appLanguage = useLocaleStore((s) => s.appLanguage);
  const setAppLanguage = useLocaleStore((s) => s.setAppLanguage);
  const device = getDeviceLanguage();
  const active = appLanguage ?? device;

  function pick(lang: AppLanguage) {
    setAppLanguage(lang);
    router.back();
  }

  return (
    <Screen scroll>
      <Text variant="title">{t("appLanguage.title")}</Text>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: SPACING.xl }}>
        {t("appLanguage.subtitle")}
      </Text>

      <View style={{ gap: SPACING.md }}>
        {SUPPORTED_APP_LANGUAGES.map((lang) => {
          const isActive = active === lang;
          const labels = LABELS[lang];
          return (
            <Card
              key={lang}
              variant={isActive ? "accent" : "surface"}
              onPress={() => pick(lang)}
              style={isActive ? { borderColor: theme.colors.accent, borderWidth: 2 } : undefined}
            >
              <View style={styles.row}>
                <Text variant="display">{labels.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="heading">{labels.native}</Text>
                  {lang === device ? (
                    <Text variant="caption" color="textSecondary">
                      {t("appLanguage.automaticHint")}
                    </Text>
                  ) : null}
                </View>
                {isActive ? (
                  <IconSymbol name="checkmark.circle.fill" size={28} color={theme.colors.accent} />
                ) : null}
              </View>
            </Card>
          );
        })}
      </View>

      <Text variant="caption" color="textSecondary" align="center" style={{ marginTop: SPACING.xl }}>
        {t("appLanguage.moreSoon")}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.lg },
});
