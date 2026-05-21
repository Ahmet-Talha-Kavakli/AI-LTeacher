import { NativeTabs } from "@/components/native-tabs";
import { useTheme } from "@/hooks/use-theme";

export default function TabLayout() {
  const theme = useTheme();
  return (
    <NativeTabs
      tabBarActiveTintColor={theme.colors.accent}
      screenOptions={{ tabBarActiveTintColor: theme.colors.accent }}
    >
      <NativeTabs.Screen
        name="learn"
        options={{
          title: "Öğren",
          tabBarIcon: () => ({ sfSymbol: "house.fill" }),
        }}
      />
      <NativeTabs.Screen
        name="practice"
        options={{
          title: "Pratik",
          tabBarIcon: () => ({ sfSymbol: "sparkles" }),
        }}
      />
      <NativeTabs.Screen
        name="tutor"
        options={{
          title: "Öğretmen",
          tabBarIcon: () => ({ sfSymbol: "bubble.left.and.bubble.right.fill" }),
        }}
      />
      <NativeTabs.Screen
        name="leaderboard"
        options={{
          title: "Lider",
          tabBarIcon: () => ({ sfSymbol: "trophy.fill" }),
        }}
      />
      <NativeTabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: () => ({ sfSymbol: "person.crop.circle.fill" }),
        }}
      />
    </NativeTabs>
  );
}
