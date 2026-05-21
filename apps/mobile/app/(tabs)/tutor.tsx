import { View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { SPACING } from "@/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/use-theme";

const MODES = [
  { id: "voice", icon: "mic.fill", title: "Sesli Sohbet", desc: "Gerçek zamanlı AI öğretmenle konuş", route: "/tutor/voice" as const },
  { id: "video", icon: "video.fill", title: "Video Ders", desc: "Pixar tarzı 3D karakterle yüz yüze", route: "/tutor/voice" as const },
  { id: "text", icon: "text.bubble.fill", title: "Yazılı Sohbet", desc: "Klavyeyle pratik yap, anlık düzeltme", route: "/tutor/voice" as const },
];

export default function TutorScreen() {
  const theme = useTheme();
  return (
    <Screen scroll>
      <Text variant="title">AI Öğretmen</Text>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: SPACING.xl }}>
        Bir mod seç, hemen konuşmaya başla.
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
                  <Text variant="heading">{m.title}</Text>
                  <Text variant="caption" color="textSecondary">{m.desc}</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={theme.colors.textSecondary} />
              </View>
            </Card>
          </Link>
        ))}
      </View>

      <Card variant="accent" style={{ marginTop: SPACING.xl }}>
        <Text variant="bodyMedium">Aksanını seç</Text>
        <Text variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
          American · British · Scottish · Australian — öğretmen aksana göre konuşur ve düzeltir.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
});
