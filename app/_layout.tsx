import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="manga" />
      <Stack.Screen name="chapter" />
    </Stack>
  );
}
