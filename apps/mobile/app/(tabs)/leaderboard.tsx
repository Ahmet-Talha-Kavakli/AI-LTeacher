import { View, StyleSheet } from "react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { SPACING, RADIUS } from "@/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/use-theme";

type Entry = { rank: number; username: string; xp: number; isMe?: boolean };

const TOP: Entry[] = [
  { rank: 1, username: "polyglot_kid", xp: 18420 },
  { rank: 2, username: "lexi_lopez",   xp: 17100 },
  { rank: 3, username: "tokyo_taro",   xp: 16880 },
  { rank: 4, username: "berlin_b",     xp: 15200 },
  { rank: 5, username: "el_maestro",   xp: 14990 },
];

const MY_ENTRY: Entry = { rank: 547, username: "talha", xp: 220, isMe: true };

export default function LeaderboardScreen() {
  const theme = useTheme();
  const medal = (r: number) =>
    r === 1 ? { sym: "crown.fill", color: "#FFD54A" }
    : r === 2 ? { sym: "medal.fill", color: "#C0C0C0" }
    : r === 3 ? { sym: "medal.fill", color: "#CD7F32" }
    : { sym: "", color: theme.colors.textSecondary };

  return (
    <Screen scroll>
      <Text variant="title">Lider Tablosu</Text>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: SPACING.xl }}>
        Bu haftanın global sıralaması · İlk 100 + senin sıran
      </Text>

      <Card variant="accent" style={{ marginBottom: SPACING.lg }}>
        <Row entry={MY_ENTRY} medal={medal(MY_ENTRY.rank)} theme={theme} />
      </Card>

      <View style={{ gap: SPACING.sm }}>
        {TOP.map((e) => (
          <Card key={e.rank}>
            <Row entry={e} medal={medal(e.rank)} theme={theme} />
          </Card>
        ))}
      </View>
    </Screen>
  );
}

function Row({ entry, medal, theme }: { entry: Entry; medal: { sym: string; color: string }; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.row}>
      <View style={[styles.rankBubble, { backgroundColor: entry.isMe ? theme.colors.accent : theme.colors.surface }]}>
        {medal.sym ? (
          <IconSymbol name={medal.sym as any} size={20} color={medal.color} />
        ) : (
          <Text variant="bodyMedium" color={entry.isMe ? "white" : "text"}>{entry.rank}</Text>
        )}
      </View>
      <Text variant="bodyMedium" style={{ flex: 1 }}>{entry.username}{entry.isMe ? " (sen)" : ""}</Text>
      <Text variant="bodyMedium" color="accent">{entry.xp.toLocaleString()} XP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  rankBubble: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
