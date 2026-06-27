import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/use-theme";
import { SPACING, RADIUS } from "@/theme";

type Props = {
  cooldownUntil: string; // ISO string
  onExpired: () => void;
};

export function CooldownCard({ cooldownUntil, onExpired }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const [remainingSec, setRemainingSec] = useState(() =>
    Math.max(0, Math.ceil((new Date(cooldownUntil).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.ceil((new Date(cooldownUntil).getTime() - Date.now()) / 1000));
      setRemainingSec(left);
      if (left === 0) onExpired();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil, onExpired]);

  return (
    <View style={styles.container}>
      <Card style={{ alignItems: "center", padding: SPACING.xl }}>
        <View style={[styles.icon, { backgroundColor: theme.colors.accentSoft }]}>
          <IconSymbol name="pause.circle.fill" size={48} color={theme.colors.accent} />
        </View>

        <Text variant="heading" align="center" style={{ marginTop: SPACING.lg }}>
          Bir mola verelim
        </Text>
        <Text variant="bodyMedium" color="textSecondary" align="center" style={{ marginTop: SPACING.sm }}>
          Bugünkü dersimizi burada bitirdik. Aşağıdaki süre sonunda öğretmen seni tekrar bekliyor olacak.
        </Text>

        <View style={[styles.timer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <Text variant="display" align="center" color="accent">
            {format(remainingSec)}
          </Text>
        </View>

        <Text variant="caption" color="textSecondary" align="center" style={{ marginTop: SPACING.md }}>
          O zamana kadar derslerine ya da lider tablosuna göz atabilirsin.
        </Text>
      </Card>

      <View style={{ gap: SPACING.sm, marginTop: SPACING.lg }}>
        <Button
          label="Derslerime dön"
          variant="primary"
          onPress={() => router.replace("/(tabs)/learn")}
        />
        <Button
          label="Lider tablosuna bak"
          variant="secondary"
          onPress={() => router.replace("/(tabs)/leaderboard")}
        />
      </View>
    </View>
  );
}

function format(totalSec: number): string {
  if (totalSec <= 0) return "00:00";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING.xl,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  timer: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 200,
  },
});
