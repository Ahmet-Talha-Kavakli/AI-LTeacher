import { useColorScheme } from "react-native";
import { COLORS } from "@ailt/shared";
import type { Theme } from "@/theme";

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const mode = scheme === "dark" ? "dark" : "light";
  return { mode, colors: COLORS[mode] };
}
