// app/_layout.tsx
import { Stack } from "expo-router";
import { ThemeProvider } from "../components/ThemeProvider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="expert-dashboard" />
        <Stack.Screen name="dashboard/home" />
        <Stack.Screen name="dashboard/expert" />
        <Stack.Screen name="dashboard/profile" />
        <Stack.Screen name="dashboard/notifications" />
        <Stack.Screen name="dashboard/history" />
        <Stack.Screen name="dashboard/consultation" />
        <Stack.Screen name="dashboard/settings" />
        <Stack.Screen name="forms/userdetails" />
        <Stack.Screen name="camera/capture" />
        <Stack.Screen name="camera/results" />
      </Stack>
    </ThemeProvider>
  );
}
