import { View, StyleSheet } from "react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SPACING } from "@/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/use-theme";

const QUICK_PRACTICE = [
  { id: "vocab", icon: "book.fill", title: "Kelime Antrenmanı", desc: "5 dk · 20 XP" },
  { id: "listen", icon: "ear.fill", title: "Dinleme Pratiği", desc: "5 dk · 25 XP" },
  { id: "speak", icon: "mic.fill", title: "Telaffuz Mücadelesi", desc: "3 dk · 30 XP" },
  { id: "story", icon: "books.vertical.fill", title: "Mini Hikaye", desc: "7 dk · 40 XP" },
];

export default function PracticeScreen() {
  const theme = useTheme();
  return (
    <Screen scroll>
      <Text variant="title">Pratik</Text>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: SPACING.xl }}>
        Hızlı bir antrenmanla seriyi koru.
      </Text>

      <Card variant="accent" style={{ marginBottom: SPACING.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}>
          <IconSymbol name="trophy.fill" size={32} color={theme.colors.accent} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">Online Düello</Text>
            <Text variant="caption" color="textSecondary">5 sorulu hızlı kapışma · 50 XP</Text>
          </View>
        </View>
        <Button label="Yakında" disabled style={{ marginTop: SPACING.lg }} />
      </Card>

      <Text variant="heading" style={{ marginBottom: SPACING.md }}>Hızlı seçenekler</Text>
      <View style={{ gap: SPACING.md }}>
        {QUICK_PRACTICE.map((p) => (
          <Card key={p.id}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: theme.colors.accentSoft }]}>
                <IconSymbol name={p.icon as any} size={24} color={theme.colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{p.title}</Text>
                <Text variant="caption" color="textSecondary">{p.desc}</Text>
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
