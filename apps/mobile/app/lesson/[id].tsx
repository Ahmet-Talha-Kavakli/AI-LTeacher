import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { SPACING } from "@/theme";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md }}>
        <Text variant="title">Ders #{id}</Text>
        <Text variant="body" color="textSecondary" align="center">
          Bu ekran yakında interaktif egzersizler, telaffuz puanlama ve XP ödülleriyle dolacak.
        </Text>
      </View>
      <Button label="Kapat" onPress={() => router.back()} />
    </Screen>
  );
}
