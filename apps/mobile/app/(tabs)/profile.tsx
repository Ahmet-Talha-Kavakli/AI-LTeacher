import { View, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SPACING, RADIUS } from "@/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/use-theme";
import { signOut } from "@/lib/auth-actions";
import { useLocaleStore } from "@/state/locale";
import { getDeviceLanguage } from "@/lib/i18n";

type RowKey = "appLanguage" | "languageAndAccent" | "notifications" | "appearance" | "subscription" | "privacy" | "help";
type Row = { key: RowKey; icon: string; valueKey?: "on" | "system" | "free"; onPress?: () => void };

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const appLanguage = useLocaleStore((s) => s.appLanguage);
  const activeAppLang = appLanguage ?? getDeviceLanguage();

  async function handleSignOut() {
    try {
      await signOut();
      router.replace("/(onboarding)");
    } catch (err: any) {
      Alert.alert(t("profile.signOutFailedTitle"), err?.message ?? t("common.error"));
    }
  }

  const rows: Row[] = [
    {
      key: "appLanguage",
      icon: "character.book.closed.fill",
      onPress: () => router.push("/settings/app-language"),
    },
    { key: "languageAndAccent", icon: "globe" },
    { key: "notifications", icon: "bell.fill", valueKey: "on" },
    { key: "appearance", icon: "moon.fill", valueKey: "system" },
    { key: "subscription", icon: "creditcard.fill", valueKey: "free" },
    { key: "privacy", icon: "lock.fill" },
    { key: "help", icon: "questionmark.circle.fill" },
  ];

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.accent }]}>
          <Text variant="display" color="white">T</Text>
        </View>
        <Text variant="title" style={{ marginTop: SPACING.md }}>Talha</Text>
        <Text variant="caption" color="textSecondary">@talha · {t("profile.rankPrefix")}547</Text>
      </View>

      <View style={styles.statRow}>
        <StatBox label={t("profile.stats.xp")} value="220" color={theme.colors.xp} icon="bolt.fill" theme={theme} />
        <StatBox label={t("profile.stats.streak")} value="3" color={theme.colors.streak} icon="flame.fill" theme={theme} />
        <StatBox label={t("profile.stats.trophies")} value="2" color={theme.colors.accent} icon="trophy.fill" theme={theme} />
      </View>

      <Text variant="heading" style={{ marginTop: SPACING.xl, marginBottom: SPACING.md }}>
        {t("profile.settingsTitle")}
      </Text>
      <View style={{ gap: SPACING.sm }}>
        {rows.map((row) => {
          const label = t(`profile.rows.${row.key}`);
          let value: string | null = null;
          if (row.key === "appLanguage") {
            value = activeAppLang === "tr" ? t("appLanguage.turkish") : t("appLanguage.english");
          } else if (row.valueKey) {
            value = t(`profile.values.${row.valueKey}`);
          }
          return (
            <Card key={row.key} onPress={row.onPress}>
              <View style={styles.row}>
                <IconSymbol name={row.icon as any} size={20} color={theme.colors.accent} />
                <Text variant="bodyMedium" style={{ flex: 1 }}>{label}</Text>
                {value ? <Text variant="callout" color="textSecondary">{value}</Text> : null}
                <IconSymbol name="chevron.right" size={18} color={theme.colors.textSecondary} />
              </View>
            </Card>
          );
        })}
      </View>

      <View style={{ marginTop: SPACING.xxl, gap: SPACING.sm }}>
        <Text variant="caption" color="textSecondary" align="center">
          {t("profile.devMode")}
        </Text>
        <Button
          label={t("profile.signOut")}
          variant="secondary"
          onPress={handleSignOut}
        />
      </View>
    </Screen>
  );
}

function StatBox({ label, value, color, icon, theme }: { label: string; value: string; color: string; icon: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <Card style={{ flex: 1, alignItems: "center", padding: SPACING.md }}>
      <IconSymbol name={icon as any} size={22} color={color} />
      <Text variant="heading" style={{ marginTop: 4 }}>{value}</Text>
      <Text variant="caption" color="textSecondary">{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingVertical: SPACING.xl },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  statRow: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.lg },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
});
