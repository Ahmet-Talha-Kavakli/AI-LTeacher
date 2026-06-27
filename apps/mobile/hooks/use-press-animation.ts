import { useSharedValue, withSpring, type SharedValue } from "react-native-reanimated";

/**
 * Apple-style press animation: gentle scale-down with a critically-damped
 * spring. Use the returned `scale` with Animated.View's transform.
 *
 *   const { scale, onPressIn, onPressOut } = usePressAnimation();
 *   <Animated.View style={{ transform: [{ scale }] }} />
 *
 * Tuned to match iOS UIKit's default control highlighting (subtle, fast).
 */
export function usePressAnimation(opts: { scale?: number } = {}): {
  scale: SharedValue<number>;
  onPressIn: () => void;
  onPressOut: () => void;
} {
  const target = opts.scale ?? 0.97;
  const scale = useSharedValue(1);

  return {
    scale,
    onPressIn: () => {
      scale.value = withSpring(target, { damping: 18, stiffness: 320, mass: 0.6 });
    },
    onPressOut: () => {
      scale.value = withSpring(1, { damping: 18, stiffness: 320, mass: 0.6 });
    },
  };
}
