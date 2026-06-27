import { useTranslation } from "react-i18next";

import { NativeTabs } from "@/components/native-tabs";
import { useTheme } from "@/hooks/use-theme";

export default function TabLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <NativeTabs
      tabBarActiveTintColor={theme.colors.accent}
      screenOptions={{ tabBarActiveTintColor: theme.colors.accent }}
    >
      <NativeTabs.Screen
        name="learn"
        options={{
          title: t("tabs.learn"),
          tabBarIcon: () => ({ sfSymbol: "house.fill" }),
        }}
      />
      <NativeTabs.Screen
        name="practice"
        options={{
          title: t("tabs.practice"),
          tabBarIcon: () => ({ sfSymbol: "sparkles" }),
        }}
      />
      <NativeTabs.Screen
        name="tutor"
        options={{
          title: t("tabs.tutor"),
          tabBarIcon: () => ({ sfSymbol: "bubble.left.and.bubble.right.fill" }),
        }}
      />
      <NativeTabs.Screen
        name="leaderboard"
        options={{
          title: t("tabs.leaderboard"),
          tabBarIcon: () => ({ sfSymbol: "trophy.fill" }),
        }}
      />
      <NativeTabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: () => ({ sfSymbol: "person.crop.circle.fill" }),
        }}
      />
    </NativeTabs>
  );
}
