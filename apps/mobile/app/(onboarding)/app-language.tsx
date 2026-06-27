import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/use-theme";
import { SPACING } from "@/theme";
import { useLocaleStore } from "@/state/locale";
import { getDeviceLanguage, SUPPORTED_APP_LANGUAGES, type AppLanguage } from "@/lib/i18n";

const LABELS: Record<AppLanguage, { native: string; en: string; flag: string }> = {
  en: { native: "English", en: "English", flag: "🇬🇧" },
  tr: { native: "Türkçe", en: "Turkish", flag: "🇹🇷" },
};

export default function FirstRunAppLanguageScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const setAppLanguage = useLocaleStore((s) => s.setAppLanguage);
  const device = getDeviceLanguage();

  function pick(lang: AppLanguage) {
    setAppLanguage(lang);
    router.replace("/(onboarding)");
  }

  return (
    <Screen scroll>
      <Text variant="title">{t("appLanguage.title")}</Text>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: SPACING.xl }}>
        {t("appLanguage.subtitle")}
      </Text>

      <View style={{ gap: SPACING.md }}>
        {SUPPORTED_APP_LANGUAGES.map((lang) => {
          const isDevice = lang === device;
          const labels = LABELS[lang];
          return (
            <Card key={lang} onPress={() => pick(lang)}>
              <View style={styles.row}>
                <Text variant="display">{labels.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="heading">{labels.native}</Text>
                  {isDevice ? (
                    <Text variant="caption" color="textSecondary">
                      {t("appLanguage.automaticHint")}
                    </Text>
                  ) : null}
                </View>
                <IconSymbol name="chevron.right" size={20} color={theme.colors.textSecondary} />
              </View>
            </Card>
          );
        })}
      </View>

      <Text variant="caption" color="textSecondary" align="center" style={{ marginTop: SPACING.xl }}>
        {t("appLanguage.moreSoon")}
      </Text>

      <View style={{ marginTop: SPACING.md }}>
        <Button
          label={t("appLanguage.automatic")}
          variant="ghost"
          onPress={() => pick(device)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.lg },
});
