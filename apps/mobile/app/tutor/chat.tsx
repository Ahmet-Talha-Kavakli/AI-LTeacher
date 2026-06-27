import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { Session } from "@supabase/supabase-js";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
// expo/fetch is WinterTC-compliant — exposes response.body as a real
// ReadableStream, which RN's default fetch does not in SDK 54. Required
// for AI SDK streaming to work.
import { fetch as expoFetch } from "expo/fetch";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/use-theme";
import { useSession } from "@/hooks/use-session";
import { usePrimaryLanguage, type PrimaryLanguage } from "@/hooks/use-primary-language";
import { useQuotaStatus } from "@/hooks/use-quota-status";
import { CooldownCard } from "@/components/cooldown-card";
import { supabase } from "@/lib/supabase";
import { SPACING, RADIUS, TEXT } from "@/theme";
import { LANGUAGES } from "@ailt/shared";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export default function TutorChatScreen() {
  const theme = useTheme();
  const router = useRouter();
  const session = useSession();
  const primary = usePrimaryLanguage(session?.user.id);
  const { t } = useTranslation();

  if (session === undefined || primary === undefined) {
    return (
      <Screen>
        <View style={center}><ActivityIndicator color={theme.colors.accent} /></View>
      </Screen>
    );
  }
  if (!session || !primary) {
    return (
      <Screen>
        <View style={[center, { gap: SPACING.lg, paddingHorizontal: SPACING.xl }]}>
          <Text variant="heading" align="center">{t("chatTutor.needLanguageTitle")}</Text>
          <Text variant="bodyMedium" color="textSecondary" align="center">
            {t("chatTutor.needLanguageBody")}
          </Text>
          <Button
            label={t("chatTutor.goToLanguagePicker")}
            onPress={() => router.replace("/(onboarding)/language")}
          />
        </View>
      </Screen>
    );
  }

  // Body only renders once both session and primary are loaded —
  // useChat is then initialized with a fully-configured transport.
  return <ChatBody session={session} primary={primary} />;
}

function ChatBody({ session, primary }: { session: Session; primary: PrimaryLanguage }) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList<UIMessage>>(null);
  const quota = useQuotaStatus(true);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${API_BASE}/api/tutor/chat`,
        fetch: expoFetch as unknown as typeof fetch,
        prepareSendMessagesRequest: async ({ messages, body }) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: {
              ...body,
              messages,
              language: primary.language,
              accent: primary.accent,
              level: primary.level,
            },
          };
        },
      }),
    [primary.language, primary.accent, primary.level],
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onFinish: () => {
      quota.refresh();
    },
  });

  useEffect(() => {
    if (messages.length === 0) return;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length, status]);

  const cooldownUntil = quota.data?.moderation?.cooldownUntil;
  if (cooldownUntil) {
    return (
      <Screen>
        <CooldownCard cooldownUntil={cooldownUntil} onExpired={quota.refresh} />
      </Screen>
    );
  }

  const langName = LANGUAGES[primary.language].nameNative;
  const isStreaming = status === "submitted" || status === "streaming";

  function onSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <IconSymbol name="chevron.left" size={26} color={theme.colors.accent} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text variant="bodyMedium">{t("chatTutor.headerTitle")}</Text>
            <Text variant="caption" color="textSecondary">
              {langName} · {primary.accent.replace(/^[a-z]+-/, "")} · {primary.level}
            </Text>
          </View>
          <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
        </View>

        {messages.length === 0 ? (
          <View style={[styles.empty, { padding: SPACING.xl }]}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.accent }]}>
              <IconSymbol name="quote.bubble.fill" size={36} color="#FFFFFF" />
            </View>
            <Text variant="heading" align="center" style={{ marginTop: SPACING.lg }}>
              {t("chatTutor.welcomeMessage")}
            </Text>
            <Text variant="bodyMedium" color="textSecondary" align="center" style={{ marginTop: SPACING.sm }}>
              {t("chatTutor.introHelp", { langName, level: primary.level })}
            </Text>
            <View style={{ marginTop: SPACING.xl, gap: SPACING.sm, width: "100%" }}>
              <Suggestion text={t("chatTutor.suggestions.greetings")} onTap={(s) => sendMessage({ text: s })} theme={theme} />
              <Suggestion text={t("chatTutor.suggestions.orderCoffee")} onTap={(s) => sendMessage({ text: s })} theme={theme} />
              <Suggestion text={t("chatTutor.suggestions.correctMistakes")} onTap={(s) => sendMessage({ text: s })} theme={theme} />
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <MessageBubble message={item} theme={theme} />}
            contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.md }}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm }}>
            <Text variant="caption" color="textSecondary">{t("chatTutor.typing")}</Text>
          </View>
        )}

        {error && (
          <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm }}>
            <Text variant="caption" color="error">{readableError(error, t)}</Text>
          </View>
        )}

        <View style={[styles.inputBar, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t("chatTutor.inputPlaceholder")}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            style={[
              styles.input,
              TEXT.body,
              {
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          />
          <Pressable
            onPress={onSend}
            disabled={!input.trim() || isStreaming}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: !input.trim() || isStreaming ? theme.colors.border : theme.colors.accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <IconSymbol
              name={isStreaming ? "stop.fill" : "arrow.up"}
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Suggestion({ text, onTap, theme }: { text: string; onTap: (t: string) => void; theme: ReturnType<typeof useTheme> }) {
  return (
    <Pressable onPress={() => onTap(text)}>
      <Card variant="surface">
        <Text variant="callout">{text}</Text>
      </Card>
    </Pressable>
  );
}

function MessageBubble({ message, theme }: { message: UIMessage; theme: ReturnType<typeof useTheme> }) {
  const isUser = message.role === "user";
  const text = extractText(message);
  if (!text) return null;
  return (
    <View
      style={[
        styles.bubble,
        {
          alignSelf: isUser ? "flex-end" : "flex-start",
          backgroundColor: isUser ? theme.colors.accent : theme.colors.surface,
          borderBottomRightRadius: isUser ? 4 : RADIUS.lg,
          borderBottomLeftRadius: isUser ? RADIUS.lg : 4,
        },
      ]}
    >
      <Text style={[TEXT.body, { color: isUser ? "#FFFFFF" : theme.colors.text }]}>{text}</Text>
    </View>
  );
}

function extractText(m: UIMessage): string {
  return m.parts
    .filter((p): p is Extract<UIMessage["parts"][number], { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function readableError(err: unknown, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (!err) return "";
  const msg = (err as Error)?.message ?? String(err);
  if (msg.includes("402") || msg.includes("quota")) return t("chatTutor.errors.quotaExceeded");
  if (msg.includes("429")) return t("chatTutor.errors.rateLimit");
  if (msg.includes("401")) return t("chatTutor.errors.sessionExpired");
  return t("chatTutor.errors.generic", { message: msg.slice(0, 80) });
}

const center = { flex: 1, justifyContent: "center" as const, alignItems: "center" as const };

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
