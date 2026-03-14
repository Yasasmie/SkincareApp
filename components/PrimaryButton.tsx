import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";
import { RADIUS, SPACING } from "../constants/theme";
import { useAppTheme } from "./ThemeProvider";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
};

export function PrimaryButton({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
}: Props) {
  const { colors } = useAppTheme();
  const isPrimary = variant === "primary";
  const isDisabled = loading || disabled;
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#FFF" : colors.primary} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary ? styles.textPrimary : styles.textSecondary,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
  button: {
    height: 56,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: SPACING.s,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  text: { fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  textPrimary: { color: "#FFF" },
  textSecondary: { color: colors.primary },
  disabled: { opacity: 0.5 },
});
