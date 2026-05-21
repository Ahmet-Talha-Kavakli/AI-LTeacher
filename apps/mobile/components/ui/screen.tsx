import { SafeAreaView, ScrollView, StyleSheet, View, ViewProps } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { SPACING } from "@/theme";

type Props = ViewProps & {
  scroll?: boolean;
  padded?: boolean;
};

export function Screen({ children, scroll, padded = true, style, ...rest }: Props) {
  const theme = useTheme();
  const Container = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Container
        contentContainerStyle={scroll ? [padded && styles.padded, style] : undefined}
        style={!scroll ? [styles.flex, padded && styles.padded, style] : styles.flex}
        {...rest}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  padded: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg },
});
