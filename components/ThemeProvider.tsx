import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AppColors,
  AppThemeMode,
  getThemeColors,
} from "../constants/theme";

type ThemeContextValue = {
  themeMode: AppThemeMode;
  colors: AppColors;
  setThemeMode: (mode: AppThemeMode) => Promise<void>;
  ready: boolean;
};

const THEME_STORAGE_KEY = "appThemeMode";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<AppThemeMode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === "light" || storedTheme === "dark") {
          setThemeModeState(storedTheme);
        }
      } catch (error) {
        console.warn("[Theme] Failed to load stored theme:", error);
      } finally {
        setReady(true);
      }
    };

    void loadTheme();
  }, []);

  const setThemeMode = async (mode: AppThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn("[Theme] Failed to persist theme:", error);
    }
  };

  const value = useMemo(
    () => ({
      themeMode,
      colors: getThemeColors(themeMode),
      setThemeMode,
      ready,
    }),
    [ready, themeMode],
  );

  if (!ready) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used inside ThemeProvider");
  }

  return context;
}
