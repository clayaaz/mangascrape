import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import cheerio from "react-native-cheerio";
async function scrape(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();

  const $ = cheerio.load(html);

  return {
    chapters: $(".chapters .chapter")
      .map(function (i: number, el: any) {
        return {
          chapter: $(el).find("a").text(),
          clink: $(el).find("a").attr("href"),
        };
      })
      .get(),
  };
}

export default function Manga() {
  const router = useRouter();
  const manga = useLocalSearchParams();
  const [chapters, setChapters] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState({});
  useEffect(() => {
    scrape(manga.link).then((result) => setChapters(result.chapters));
  }, []);
  return (
    <>
      <Stack.Screen options={{ headerTitle: manga?.title }} />
      <View style={{ flex: 1, flexDirection: "column" }}>
        <View
          style={{
            padding: 10,
            flexDirection: "row",
            borderBottomWidth: 1,
            backgroundColor: "#fff",
          }}
        >
          <Image
            source={{ uri: manga?.img }}
            style={{ width: 100, height: 142 }}
          ></Image>
          <View
            style={{
              flexDirection: "column",
              marginLeft: 10,
              flex: 1,
            }}
          >
            <Text style={{ fontWeight: "bold" }}>{manga?.title}</Text>
            <Text
              style={{
                fontSize: 12,
              }}
            >
              {manga?.summary}
            </Text>
          </View>
        </View>
        <ScrollView style={{ flex: 1 }}>
          {chapters.map((chapter, i) => (
            <Pressable
              key={i}
              onPress={() =>
                router.push({
                  pathname: "/chapter",
                  params: { ...manga, ...chapters[i] },
                })
              }
              style={{
                padding: 10,
                borderBottomWidth: 1,
                backgroundColor: isHovered[i] ? "#5a5a5a" : "#fff",
              }}
              onPressIn={() => setIsHovered({ ...isHovered, [i]: true })}
              onPressOut={() => setIsHovered({ ...isHovered, [i]: false })}
            >
              <Text>{chapter.chapter}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </>
  );
}
