import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SPACING } from "@/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/use-theme";

type ModeKey = "vocab" | "listen" | "speak" | "story";
const QUICK_PRACTICE: { id: ModeKey; icon: string }[] = [
  { id: "vocab", icon: "book.fill" },
  { id: "listen", icon: "ear.fill" },
  { id: "speak", icon: "mic.fill" },
  { id: "story", icon: "books.vertical.fill" },
];

export default function PracticeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Screen scroll>
      <Text variant="title">{t("practice.title")}</Text>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: SPACING.xl }}>
        {t("practice.subtitle")}
      </Text>

      <Card variant="accent" style={{ marginBottom: SPACING.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}>
          <IconSymbol name="trophy.fill" size={32} color={theme.colors.accent} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">{t("practice.onlineDuel")}</Text>
            <Text variant="caption" color="textSecondary">{t("practice.onlineDuelDesc")}</Text>
          </View>
        </View>
        <Button label={t("common.comingSoon")} disabled style={{ marginTop: SPACING.lg }} />
      </Card>

      <Text variant="heading" style={{ marginBottom: SPACING.md }}>{t("practice.quickOptions")}</Text>
      <View style={{ gap: SPACING.md }}>
        {QUICK_PRACTICE.map((p) => (
          <Card key={p.id}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: theme.colors.accentSoft }]}>
                <IconSymbol name={p.icon as any} size={24} color={theme.colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{t(`practice.modes.${p.id}.title`)}</Text>
                <Text variant="caption" color="textSecondary">{t(`practice.modes.${p.id}.desc`)}</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={theme.colors.textSecondary} />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
