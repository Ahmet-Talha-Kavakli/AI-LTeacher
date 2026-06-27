import { View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { SPACING } from "@/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/use-theme";

type ModeKey = "text" | "voice" | "video";
const MODES: { id: ModeKey; icon: string; route: "/tutor/chat" | "/tutor/voice" }[] = [
  { id: "text", icon: "text.bubble.fill", route: "/tutor/chat" },
  { id: "voice", icon: "mic.fill", route: "/tutor/voice" },
  { id: "video", icon: "video.fill", route: "/tutor/voice" },
];

export default function TutorScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Screen scroll>
      <Text variant="title">{t("tutorTab.title")}</Text>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: SPACING.xl }}>
        {t("tutorTab.subtitle")}
      </Text>

      <View style={{ gap: SPACING.md }}>
        {MODES.map((m) => (
          <Link key={m.id} href={m.route} asChild>
            <Card>
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: theme.colors.accent }]}>
                  <IconSymbol name={m.icon as any} size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="heading">{t(`tutorTab.modes.${m.id}.title`)}</Text>
                  <Text variant="caption" color="textSecondary">{t(`tutorTab.modes.${m.id}.desc`)}</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={theme.colors.textSecondary} />
              </View>
            </Card>
          </Link>
        ))}
      </View>

      <Card variant="accent" style={{ marginTop: SPACING.xl }}>
        <Text variant="bodyMedium">{t("tutorTab.accentCard.title")}</Text>
        <Text variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
          {t("tutorTab.accentCard.subtitle")}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
});
