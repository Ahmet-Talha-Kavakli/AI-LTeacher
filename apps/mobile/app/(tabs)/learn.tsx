import { View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { SPACING } from "@/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function LearnScreen() {
  const theme = useTheme();
  const lessons = [
    { id: "1", title: "Selamlaşma ve tanışma", subtitle: "Unit 1 · 5 alıştırma", unlocked: true, type: "vocab" as const },
    { id: "2", title: "Sayılar 1-20", subtitle: "Unit 1 · 4 alıştırma", unlocked: true, type: "vocab" as const },
    { id: "3", title: "Basit cümleler", subtitle: "Unit 1 · 6 alıştırma", unlocked: false, type: "grammar" as const },
    { id: "4", title: "Sesli sohbet: tanışma", subtitle: "Unit 1 · 1 sohbet", unlocked: false, type: "speaking" as const },
  ];

  return (
    <Screen scroll>
      <View style={styles.headerRow}>
        <View>
          <Text variant="caption" color="textSecondary">Merhaba 👋</Text>
          <Text variant="title">English · A1</Text>
        </View>
        <View style={styles.statsRow}>
          <Stat icon="flame.fill" value="3" color={theme.colors.streak} />
          <Stat icon="bolt.fill" value="120" color={theme.colors.xp} />
          <Stat icon="heart.fill" value="5" color={theme.colors.error} />
        </View>
      </View>

      <Text variant="heading" style={{ marginTop: SPACING.xl, marginBottom: SPACING.md }}>
        Bugünün yolu
      </Text>

      <View style={{ gap: SPACING.md }}>
        {lessons.map((lesson) => (
          <Link key={lesson.id} href={`/lesson/${lesson.id}`} asChild>
            <Card>
              <View style={styles.lessonRow}>
                <View style={[styles.lessonIcon, { backgroundColor: lesson.unlocked ? theme.colors.accent : theme.colors.border }]}>
                  <IconSymbol
                    name={lesson.unlocked ? "play.fill" : "lock.fill"}
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{lesson.title}</Text>
                  <Text variant="caption" color="textSecondary">{lesson.subtitle}</Text>
                </View>
              </View>
            </Card>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

function Stat({ icon, value, color }: { icon: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <IconSymbol name={icon as any} size={16} color={color} />
      <Text variant="callout" style={{ marginLeft: 4 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statsRow: { flexDirection: "row", gap: SPACING.md },
  stat: { flexDirection: "row", alignItems: "center" },
  lessonRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  lessonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
