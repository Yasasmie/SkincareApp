export const LIGHT_COLORS = {
  primary: "#6A9C89",
  secondary: "#C4DAD2",
  background: "#F9F7F2",
  card: "#FFFFFF",
  text: "#16423C",
  textLight: "#6A9C89",
  textSecondary: "#8B9E92",
  surface: "#F5F3ED",
  border: "#E8E4DB",
  accent: "#E6BAA3",
  error: "#FF6B6B",
  overlay: "rgba(0,0,0,0.5)",
  header: "#6A9C89",
  muted: "#F0F0F0",
};

export const DARK_COLORS = {
  primary: "#3FAF74",
  secondary: "#1C2622",
  background: "#050505",
  card: "#111111",
  text: "#F2F7F4",
  textLight: "#7FD5A5",
  textSecondary: "#95A39C",
  surface: "#1A1A1A",
  border: "#2B2B2B",
  accent: "#4E6E5B",
  error: "#FF7D7D",
  overlay: "rgba(0,0,0,0.7)",
  header: "#0D0D0D",
  muted: "#222222",
};

export type AppColors = typeof LIGHT_COLORS;
export type AppThemeMode = "light" | "dark";

export const COLORS = LIGHT_COLORS;

export function getThemeColors(mode: AppThemeMode): AppColors {
  return mode === "dark" ? DARK_COLORS : LIGHT_COLORS;
}

export const SPACING = {
  s: 8,
  m: 16,
  l: 24,
  xl: 40,
};

export const RADIUS = {
  s: 8,
  m: 16,
  l: 24,
  xl: 40,
  round: 50,
};
