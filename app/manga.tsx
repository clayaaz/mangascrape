import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import cheerio from "react-native-cheerio";
import { chapterStore } from "./store";

type Book = {
  title: string;
  img: string;
  summary: string;
  genres: string[];
};

type Chapter = {
  chapter: string;
  clink: string;
};

async function scrape(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  return {
    book: $("#single_book")
      .map(function (i: number, el: any) {
        return {
          title: $(el).find(".info .heading").text(),
          img: $(el).find(".cover img").attr("src"),
          summary: $(el).find(".summary p").text(),
          genres: $(el)
            .find(".genres a")
            .map(function (i: number, el: any) {
              return $(el).text();
            })
            .get(),
        };
      })
      .get() as Book[],
    chapters: $(".chapters .chapter")
      .map(function (i: number, el: any) {
        return {
          chapter: $(el).find("a").text(),
          clink: $(el).find("a").attr("href"),
        };
      })
      .get() as Chapter[],
  };
}

export default function Manga() {
  const router = useRouter();
  const manga = useLocalSearchParams();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [book, setBook] = useState<Book | null>(null);
  const [isHovered, setIsHovered] = useState<Record<number, boolean>>({});

  useEffect(() => {
    scrape(manga.link as string).then((result) => {
      setBook(result.book[0] ?? null);
      setChapters(result.chapters);
    });
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerTitle: book?.title }} />
      <View style={{ flex: 1, flexDirection: "column" }}>
        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              padding: 10,
              flexDirection: "column",
              borderBottomWidth: 1,
              backgroundColor: "#fff",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{ uri: book?.img }}
                style={{ width: 200, height: 284 }}
              />
              <View
                style={{
                  flexDirection: "column",
                  marginLeft: 10,
                  gap: 4,
                  paddingLeft: 10,
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                  Genres:
                </Text>
                {book?.genres.map((genre, i) => (
                  <Text
                    key={i}
                    style={{
                      paddingLeft: 10,
                      fontSize: 15,
                      borderRadius: 4,
                      borderColor: "#61f0fa",
                      borderWidth: 1,
                      padding: 4,
                    }}
                  >
                    {genre}
                  </Text>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: "column", marginLeft: 10, flex: 1 }}>
              <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                {book?.title}
              </Text>
              <Text style={{ fontSize: 12 }}>{book?.summary}</Text>
            </View>
          </View>
          {chapters.map((chapter, i) => (
            <Pressable
              key={i}
              onPress={() => {
                chapterStore.chapters = chapters;
                chapterStore.currentIndex = i;
                router.push({
                  pathname: "/chapter",
                  params: {
                    ...manga,
                    ...chapters[i],
                    chapterIndex: i,
                  },
                });
              }}
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
