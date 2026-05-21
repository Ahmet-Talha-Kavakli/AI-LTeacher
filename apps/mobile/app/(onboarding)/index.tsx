import { useEffect, useState } from "react";
import { Alert, View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { SPACING } from "@/theme";
import { useTheme } from "@/hooks/use-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useSession } from "@/hooks/use-session";
import { signInAnonymously, hasCompletedOnboarding } from "@/lib/auth-actions";
import { BRAND } from "@ailt/shared";

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const session = useSession();
  const [busy, setBusy] = useState(false);

  // If we already have a session, route the user past welcome.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    hasCompletedOnboarding(session.user.id).then((done) => {
      if (cancelled) return;
      if (done) router.replace("/(tabs)/learn");
      else router.replace("/(onboarding)/language");
    });
    return () => {
      cancelled = true;
    };
  }, [session, router]);

  async function tryFree() {
    try {
      setBusy(true);
      await signInAnonymously();
    } catch (err: any) {
      setBusy(false);
      const msg =
        err?.message?.includes("disabled") || err?.code === "anonymous_provider_disabled"
          ? "Anonim girişler bu projede kapalı. Supabase Dashboard → Authentication → Sign In/Up → 'Allow anonymous sign-ins' açmalısın."
          : err?.message ?? "Giriş başarısız.";
      Alert.alert("Misafir girişi başarısız", msg);
    }
  }

  if (session === undefined) {
    return (
      <Screen padded>
        <View style={styles.hero}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded>
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: theme.colors.accent }]}>
          <IconSymbol name="quote.bubble.fill" size={56} color="#FFFFFF" />
        </View>
        <Text variant="display" align="center" style={{ marginTop: SPACING.xl }}>
          {BRAND.name}
        </Text>
        <Text variant="bodyMedium" color="textSecondary" align="center" style={{ marginTop: SPACING.sm }}>
          {BRAND.tagline}
        </Text>
        <Text variant="caption" color="textSecondary" align="center" style={{ marginTop: SPACING.xs }}>
          AI öğretmenle konuş, eğlen, öğren.
        </Text>
      </View>

      <View style={{ gap: SPACING.md }}>
        <Button label="Misafir Olarak Dene" onPress={tryFree} loading={busy} />
        <Button
          label="E-posta ile devam et"
          variant="secondary"
          onPress={() => router.push("/(onboarding)/sign-up")}
        />
      </View>

      <Text variant="caption" color="textSecondary" align="center" style={{ marginTop: SPACING.lg }}>
        Devam ederek Kullanım Koşulları ve Gizlilik Politikası'nı kabul etmiş olursun.{"\n"}
        Apple ile giriş yakında.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: "center", alignItems: "center" },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
});
