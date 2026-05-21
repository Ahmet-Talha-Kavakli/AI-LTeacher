import { View, StyleSheet, Image } from "react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { SPACING, RADIUS } from "@/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/use-theme";

const SETTINGS_ROWS = [
  { icon: "globe", label: "Dil ve aksan", value: "English · American" },
  { icon: "bell.fill", label: "Bildirimler", value: "Açık" },
  { icon: "moon.fill", label: "Görünüm", value: "Sistem" },
  { icon: "creditcard.fill", label: "Abonelik", value: "Free" },
  { icon: "lock.fill", label: "Gizlilik", value: "" },
  { icon: "questionmark.circle.fill", label: "Yardım & destek", value: "" },
];

export default function ProfileScreen() {
  const theme = useTheme();
  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.accent }]}>
          <Text variant="display" color="white">T</Text>
        </View>
        <Text variant="title" style={{ marginTop: SPACING.md }}>Talha</Text>
        <Text variant="caption" color="textSecondary">@talha · Sıra #547</Text>
      </View>

      <View style={styles.statRow}>
        <StatBox label="XP" value="220" color={theme.colors.xp} icon="bolt.fill" theme={theme} />
        <StatBox label="Seri" value="3" color={theme.colors.streak} icon="flame.fill" theme={theme} />
        <StatBox label="Kupa" value="2" color={theme.colors.accent} icon="trophy.fill" theme={theme} />
      </View>

      <Text variant="heading" style={{ marginTop: SPACING.xl, marginBottom: SPACING.md }}>Ayarlar</Text>
      <View style={{ gap: SPACING.sm }}>
        {SETTINGS_ROWS.map((row) => (
          <Card key={row.label}>
            <View style={styles.row}>
              <IconSymbol name={row.icon as any} size={20} color={theme.colors.accent} />
              <Text variant="bodyMedium" style={{ flex: 1 }}>{row.label}</Text>
              {row.value ? <Text variant="callout" color="textSecondary">{row.value}</Text> : null}
              <IconSymbol name="chevron.right" size={18} color={theme.colors.textSecondary} />
            </View>
          </Card>
        ))}
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
