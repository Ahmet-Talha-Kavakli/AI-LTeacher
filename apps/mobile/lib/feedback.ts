import * as Haptics from "expo-haptics";

/**
 * Apple-native haptic helpers. Centralised so the entire app uses the same
 * "voice" — never call Haptics.* directly from screens. Pick the semantic
 * meaning here (selection, action, success), not the raw intensity.
 *
 * All functions are no-throw — if the device has no haptic engine (iPad,
 * older devices, Android), they silently no-op.
 */

/** Light tap — for tapping a card, switching a segmented control. */
export function hapticSelection() {
  Haptics.selectionAsync().catch(() => {});
}

/** Medium tap — for confirming a primary action (button press). */
export function hapticAction() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Stronger tap — for important state changes (paywall unlock, lesson start). */
export function hapticHeavy() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Success notification — for lesson complete, streak saved, payment success. */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Warning notification — for streak-at-risk, quota near limit. */
export function hapticWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

/** Error notification — for failed payment, sign-in error. */
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
