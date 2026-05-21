import { Text as RNText, TextProps, StyleProp, TextStyle } from "react-native";
import { TEXT } from "@/theme";
import { useTheme } from "@/hooks/use-theme";

type Variant = keyof typeof TEXT;

type Props = TextProps & {
  variant?: Variant;
  color?: "text" | "textSecondary" | "accent" | "error" | "success" | "white";
  align?: "left" | "center" | "right";
  style?: StyleProp<TextStyle>;
};

export function Text({ variant = "body", color = "text", align, style, ...rest }: Props) {
  const theme = useTheme();
  const palette = {
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    accent: theme.colors.accent,
    error: theme.colors.error,
    success: theme.colors.success,
    white: "#FFFFFF",
  } as const;

  return (
    <RNText
      style={[
        TEXT[variant],
        { color: palette[color], textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}
