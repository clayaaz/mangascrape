import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import BlobImage from "./components/blobimage";

async function scrape(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();

  const regex = /var thzq=\[(.*?),\]/;
  let m = regex.exec(html);
  if (m != null) {
    return {
      pages: m[1]
        .split(",")
        .map((p) => ({ image: p.trim().replace(/['"]/g, "") })),
    };
  }

  return {
    pages: [],
  };
}

export default function Chapter() {
  const router = useRouter();
  const chapter = useLocalSearchParams();
  const [pages, setPages] = useState<string[]>([]);
  useEffect(() => {
    scrape(chapter.clink).then((result) => setPages(result.pages));
  }, []);
  return (
    <>
      <Stack.Screen options={{ headerTitle: chapter?.chapter }} />
      <ScrollView style={{ flex: 1, flexDirection: "column" }}>
        {pages.map((page, i) => (
          <View key={i}>
            <BlobImage url={page.image} />
            <Text style={{ textAlign: "center" }}>
              {i + 1}/{pages.length}
            </Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
}
