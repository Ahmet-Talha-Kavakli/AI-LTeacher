import { useState } from "react";
import { Alert, View, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { SPACING, RADIUS, TEXT } from "@/theme";
import { signUpWithEmail, signInWithEmail } from "@/lib/auth-actions";

export default function SignUpScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || password.length < 6) {
      Alert.alert(t("signUp.missingInfoTitle"), t("signUp.missingInfoBody"));
      return;
    }
    try {
      setLoading(true);
      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      router.replace("/(onboarding)/language");
    } catch (err: any) {
      Alert.alert(t("signUp.errorTitle"), err?.message ?? t("signUp.errorFallback"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text variant="title">
        {mode === "signup" ? t("signUp.createAccountTitle") : t("signUp.signInTitle")}
      </Text>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: SPACING.xl }}>
        {t("signUp.appleHint")}
      </Text>

      <Card style={{ gap: SPACING.md }}>
        <View>
          <Text variant="caption" color="textSecondary">{t("signUp.emailLabel")}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder={t("signUp.emailPlaceholder")}
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, TEXT.bodyMedium, { color: theme.colors.text, borderColor: theme.colors.border }]}
          />
        </View>
        <View>
          <Text variant="caption" color="textSecondary">{t("signUp.passwordLabel")}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder={t("signUp.passwordPlaceholderNew")}
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, TEXT.bodyMedium, { color: theme.colors.text, borderColor: theme.colors.border }]}
          />
        </View>
      </Card>

      <View style={{ marginTop: SPACING.xl, gap: SPACING.md }}>
        <Button
          label={mode === "signup" ? t("signUp.registerAction") : t("signUp.signInAction")}
          onPress={submit}
          loading={loading}
        />
        <Button
          label={mode === "signup" ? t("signUp.alreadyHaveAccount") : t("signUp.createAccountSwap")}
          variant="ghost"
          onPress={() => setMode(mode === "signup" ? "signin" : "signup")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
});
