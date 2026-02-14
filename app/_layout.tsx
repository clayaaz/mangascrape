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
        cardStyle: {
          backgroundColor: "#08080C",
        },
        animation: "ios_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="manga" />
      <Stack.Screen name="chapter" />
    </Stack>
  );
}
