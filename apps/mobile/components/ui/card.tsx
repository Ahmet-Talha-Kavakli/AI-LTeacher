import { Pressable, StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { RADIUS, SPACING } from "@/theme";

type Props = ViewProps & {
  onPress?: () => void;
  variant?: "surface" | "accent";
  style?: ViewStyle;
};

export function Card({ onPress, variant = "surface", style, children, ...rest }: Props) {
  const theme = useTheme();
  const bg = variant === "accent" ? theme.colors.accentSoft : theme.colors.surface;
  const Component: any = onPress ? Pressable : View;
  return (
    <Component
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean }) => [
        styles.base,
        { backgroundColor: bg, borderColor: theme.colors.border, opacity: pressed ? 0.9 : 1 },
        style,
      ]}
      {...rest}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
