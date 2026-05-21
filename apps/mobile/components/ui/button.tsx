import { Pressable, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/use-theme";
import { RADIUS, SPACING, TEXT } from "@/theme";
import { Text } from "./text";

type Variant = "primary" | "secondary" | "ghost";
type Size = "lg" | "md" | "sm";

type Props = {
  label: string;
  onPress?: () => void | Promise<void>;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  loading,
  disabled,
  fullWidth = true,
  style,
}: Props) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? theme.colors.accent
      : variant === "secondary"
        ? theme.colors.accentSoft
        : "transparent";
  const fg =
    variant === "primary"
      ? "#FFFFFF"
      : variant === "secondary"
        ? theme.colors.accent
        : theme.colors.text;

  const heights = { lg: 56, md: 48, sm: 40 };

  return (
    <Pressable
      onPress={async () => {
        if (isDisabled || !onPress) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          height: heights[size],
          alignSelf: fullWidth ? "stretch" : "flex-start",
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          paddingHorizontal: SPACING.xl,
        },
        style,
      ]}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[TEXT.button, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
