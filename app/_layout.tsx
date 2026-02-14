import { Stack } from "expo-router";
import { useDownloadWorker } from "./useDownloadWorker";

export default function RootLayout() {
  useDownloadWorker(); // runs once, persists for app lifetime

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerBlurEffect: "dark",
        headerTintColor: "#e8e0ff",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
          color: "#e8e0ff",
          letterSpacing: 0.5,
        },
        contentStyle: {
          backgroundColor: "#08080C",
        },
        cardStyle: {
          backgroundColor: "#08080C",
        },
        // Native slide — enables the back-swipe gesture and back button animation
        animation: "ios_from_right",
      }}
    >
      {/* Tab screens rendered by (tabs)/_layout.tsx */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Full-screen stack screens pushed on top of tabs */}
      <Stack.Screen name="manga" />
      <Stack.Screen name="chapter" />
    </Stack>
  );
}
