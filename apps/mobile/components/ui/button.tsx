import { Pressable, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { useTheme } from "@/hooks/use-theme";
import { usePressAnimation } from "@/hooks/use-press-animation";
import { hapticAction } from "@/lib/feedback";
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
  const { scale, onPressIn, onPressOut } = usePressAnimation();

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
    <Animated.View
      style={[
        {
          alignSelf: fullWidth ? "stretch" : "flex-start",
          transform: [{ scale }],
        },
        style,
      ]}
    >
      <Pressable
        onPress={async () => {
          if (isDisabled || !onPress) return;
          hapticAction();
          await onPress();
        }}
        onPressIn={isDisabled ? undefined : onPressIn}
        onPressOut={isDisabled ? undefined : onPressOut}
        style={[
          styles.base,
          {
            backgroundColor: bg,
            height: heights[size],
            opacity: isDisabled ? 0.5 : 1,
            paddingHorizontal: SPACING.xl,
          },
        ]}
        disabled={isDisabled}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <Text style={[TEXT.button, { color: fg }]}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
