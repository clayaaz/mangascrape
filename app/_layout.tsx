import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "rgba(8, 8, 12, 0.85)",
        },
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
      <Stack.Screen name="index" />
      <Stack.Screen name="manga" />
      <Stack.Screen name="chapter" />
    </Stack>
  );
}
