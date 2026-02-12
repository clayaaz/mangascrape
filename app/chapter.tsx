import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import BlobImage from "./components/blobimage";
import { chapterStore } from "./store";

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

  const chapters = chapterStore.chapters;
  const currnetIndex = Number(chapter.chapterIndex);

  const isFirst = currnetIndex === chapters.length - 1;
  const isLast = currnetIndex === 0;

  const goToChapter = (index: number) => {
    chapterStore.currentIndex = index;
    router.replace({
      pathname: "/chapter",
      params: {
        ...chapter,
        ...chapters[index],
        chapterIndex: index,
        chapters: chapter.chapters,
      },
    });
  };
  const [pages, setPages] = useState<string[]>([]);
  useEffect(() => {
    scrape(chapter.clink as any).then((result) =>
      setPages(result.pages as any),
    );
  }, [chapter.clink]);
  return (
    <>
      <Stack.Screen options={{ headerTitle: chapter?.chapter as any }} />

      <ScrollView style={{ flex: 1, flexDirection: "column" }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            padding: 10,
            backgroundColor: "#fff",
          }}
        >
          <Button
            title="Last Chapter"
            onPress={() => goToChapter(currnetIndex + 1)}
            disabled={isFirst}
          />
          <Button
            title="Next Chapter"
            onPress={() => goToChapter(currnetIndex - 1)}
            disabled={isLast}
          />
        </View>
        {pages.map((page, i) => (
          <View key={i}>
            <BlobImage url={page.image} />
            <Text style={{ textAlign: "center" }}>
              {i + 1}/{pages.length}
            </Text>
          </View>
        ))}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            padding: 10,
            backgroundColor: "#fff",
          }}
        >
          <Button
            title="Last Chapter"
            onPress={() => goToChapter(currnetIndex + 1)}
            disabled={isFirst}
          />
          <Button
            title="Next Chapter"
            onPress={() => goToChapter(currnetIndex - 1)}
            disabled={isLast}
          />
        </View>
      </ScrollView>
    </>
  );
}
