import { Stack } from "expo-router";

export default function RootLayout() {
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
        animation: "fade_from_bottom",
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
