import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { SPACING, RADIUS } from "@/theme";
import { useTheme } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function VoiceTutorScreen() {
  const router = useRouter();
  const theme = useTheme();
  return (
    <Screen>
      <View style={styles.body}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.accent }]}>
          <IconSymbol name="person.crop.circle.fill" size={96} color="#FFFFFF" />
        </View>
        <Text variant="title" align="center" style={{ marginTop: SPACING.xl }}>
          AI Öğretmen
        </Text>
        <Text variant="caption" color="textSecondary" align="center" style={{ marginTop: SPACING.sm }}>
          ElevenLabs Conversational AI bağlantısı yakında.{"\n"}
          Pixar tarzı 3D avatar Meshy'den gelecek.
        </Text>

        <View style={styles.micWrap}>
          <View style={[styles.mic, { backgroundColor: theme.colors.accent }]}>
            <IconSymbol name="mic.fill" size={48} color="#FFFFFF" />
          </View>
          <Text variant="caption" color="textSecondary" align="center" style={{ marginTop: SPACING.sm }}>
            Konuşmak için dokun
          </Text>
        </View>
      </View>

      <Button label="Bitir" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingVertical: SPACING.xl },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  micWrap: { alignItems: "center", marginBottom: SPACING.xl },
  mic: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
