import { useState } from "react";
import { Alert, View, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";
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
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || password.length < 6) {
      Alert.alert("Eksik bilgi", "E-posta ve en az 6 karakterli şifre gerekli.");
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
      Alert.alert("Hata", err?.message ?? "Bir şeyler ters gitti.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text variant="title">{mode === "signup" ? "Hesap oluştur" : "Giriş yap"}</Text>
      <Text variant="caption" color="textSecondary" style={{ marginBottom: SPACING.xl }}>
        E-posta ile ilerleyebilirsin. Apple Sign-In yakında.
      </Text>

      <Card style={{ gap: SPACING.md }}>
        <View>
          <Text variant="caption" color="textSecondary">E-posta</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="ornek@email.com"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, TEXT.bodyMedium, { color: theme.colors.text, borderColor: theme.colors.border }]}
          />
        </View>
        <View>
          <Text variant="caption" color="textSecondary">Şifre</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="En az 6 karakter"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, TEXT.bodyMedium, { color: theme.colors.text, borderColor: theme.colors.border }]}
          />
        </View>
      </Card>

      <View style={{ marginTop: SPACING.xl, gap: SPACING.md }}>
        <Button
          label={mode === "signup" ? "Kayıt ol" : "Giriş yap"}
          onPress={submit}
          loading={loading}
        />
        <Button
          label={mode === "signup" ? "Zaten hesabım var" : "Hesap oluştur"}
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
