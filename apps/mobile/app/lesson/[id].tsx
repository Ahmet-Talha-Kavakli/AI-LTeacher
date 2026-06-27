import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { SPACING } from "@/theme";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md }}>
        <Text variant="title">{t("lesson.titleHash", { id })}</Text>
        <Text variant="body" color="textSecondary" align="center">
          {t("lesson.stubBody")}
        </Text>
      </View>
      <Button label={t("common.close")} onPress={() => router.back()} />
    </Screen>
  );
}
