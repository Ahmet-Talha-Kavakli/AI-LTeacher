import { Pressable, StyleSheet, View, ViewProps, ViewStyle, Platform } from "react-native";
import Animated from "react-native-reanimated";
import { BlurView } from "expo-blur";

import { useTheme } from "@/hooks/use-theme";
import { usePressAnimation } from "@/hooks/use-press-animation";
import { hapticSelection } from "@/lib/feedback";
import { RADIUS, SPACING } from "@/theme";

type Variant = "surface" | "accent" | "material";

type Props = ViewProps & {
  onPress?: () => void;
  variant?: Variant;
  style?: ViewStyle;
};

export function Card({ onPress, variant = "surface", style, children, ...rest }: Props) {
  const theme = useTheme();
  const { scale, onPressIn, onPressOut } = usePressAnimation({ scale: 0.985 });

  // Material variant uses a real UIVisualEffectView on iOS (via expo-blur).
  // Falls back to translucent colour on Android.
  if (variant === "material" && Platform.OS === "ios") {
    const Wrapper = onPress ? Animated.View : View;
    const Inner = onPress ? Pressable : View;
    return (
      <Wrapper style={onPress ? { transform: [{ scale }] } : undefined}>
        <Inner
          onPress={onPress}
          onPressIn={onPress ? () => { hapticSelection(); onPressIn(); } : undefined}
          onPressOut={onPress ? onPressOut : undefined}
          style={[styles.materialOuter, style]}
        >
          <BlurView
            tint={theme.mode === "dark" ? "systemThinMaterialDark" : "systemThinMaterialLight"}
            intensity={80}
            style={[StyleSheet.absoluteFill, { borderRadius: RADIUS.lg }]}
          />
          <View style={styles.materialInner} {...rest}>
            {children}
          </View>
        </Inner>
      </Wrapper>
    );
  }

  const bg = variant === "accent" ? theme.colors.accentSoft : theme.colors.surface;

  if (!onPress) {
    return (
      <View
        style={[
          styles.base,
          { backgroundColor: bg, borderColor: theme.colors.border },
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { hapticSelection(); onPressIn(); }}
        onPressOut={onPressOut}
        style={[
          styles.base,
          { backgroundColor: bg, borderColor: theme.colors.border },
          style,
        ]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  materialOuter: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  materialInner: {
    padding: SPACING.lg,
  },
});
