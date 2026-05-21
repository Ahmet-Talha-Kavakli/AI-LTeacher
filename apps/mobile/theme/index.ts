import { COLORS, BRAND, type ThemeMode } from "@ailt/shared";

export const FONT = {
  regular: "Sora_400Regular",
  medium: "Sora_500Medium",
  semibold: "Sora_600SemiBold",
  bold: "Sora_700Bold",
  extrabold: "Sora_800ExtraBold",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const TEXT = {
  display: { fontFamily: FONT.extrabold, fontSize: 36, lineHeight: 42 },
  title: { fontFamily: FONT.bold, fontSize: 28, lineHeight: 34 },
  heading: { fontFamily: FONT.semibold, fontSize: 22, lineHeight: 28 },
  body: { fontFamily: FONT.regular, fontSize: 17, lineHeight: 24 },
  bodyMedium: { fontFamily: FONT.medium, fontSize: 17, lineHeight: 24 },
  callout: { fontFamily: FONT.medium, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: FONT.semibold, fontSize: 17, lineHeight: 22 },
} as const;

export type Theme = {
  mode: ThemeMode;
  colors: (typeof COLORS)[ThemeMode];
};

export { COLORS, BRAND };
