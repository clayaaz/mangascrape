import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
    newChapters: $(".chapters .chapter .new")
      .map(function (i: number, el: any) {
        return {
          chapter: $(el).find("a").text(),
          clink: $(el).find("a").attr("href"),
        };
      })
      .get() as Chapter[],
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
  const [newChapterLinks, setNewChapterLinks] = useState<Set<string>>(
    new Set(),
  );
  const [book, setBook] = useState<Book | null>(null);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  useEffect(() => {
    setBook(manga as any);
    scrape(manga.link as string).then((result) => {
      setBook(result.book[0] ?? null);
      setChapters(result.chapters);
      // Build a Set of new chapter links for O(1) lookup per row
      setNewChapterLinks(new Set(result.newChapters.map((c) => c.clink)));
    });
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: "#e8e0ff",
        }}
      />
      <View style={styles.root}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── Hero Section ── */}
          <View style={styles.hero}>
            {book?.img && (
              <Image
                source={{ uri: book.img }}
                style={styles.heroBackdrop}
                blurRadius={18}
                resizeMode="cover"
              />
            )}
            <LinearGradient
              colors={[
                "rgba(8,8,12,0.35)",
                "rgba(8,8,12,0.7)",
                "rgba(8,8,12,1)",
              ]}
              style={styles.heroGradient}
            />
            <View style={styles.heroContent}>
              <View style={styles.coverShadow}>
                <Image
                  source={{ uri: book?.img }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle}>{book?.title}</Text>
                <View style={styles.genreRow}>
                  {book?.genres?.map((genre, i) => (
                    <View key={i} style={styles.genrePill}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ── Summary Card ── */}
          <View style={styles.summaryCard}>
            <Text style={styles.sectionLabel}>SYNOPSIS</Text>
            <Text style={styles.summaryText}>{book?.summary}</Text>
          </View>

          {/* ── Chapters ── */}
          <View style={styles.chaptersSection}>
            <View style={styles.chapterHeader}>
              <Text style={styles.sectionLabel}>CHAPTERS</Text>
              <Text style={styles.chapterCount}>{chapters.length} total</Text>
            </View>

            {chapters.map((chapter, i) => {
              const isNew = newChapterLinks.has(chapter.clink);
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    chapterStore.chapters = chapters;
                    chapterStore.currentIndex = i;
                    router.push({
                      pathname: "/chapter",
                      params: {
                        title: book?.title ?? (manga.title as string),
                        img: book?.img ?? (manga.img as string),
                        link: manga.link as string,
                        chapter: chapters[i].chapter,
                        clink: chapters[i].clink,
                        chapterIndex: i,
                      },
                    });
                  }}
                  onPressIn={() => setPressedIndex(i)}
                  onPressOut={() => setPressedIndex(null)}
                  style={[
                    styles.chapterRow,
                    pressedIndex === i && styles.chapterRowPressed,
                    i === 0 && styles.chapterRowFirst,
                    isNew && styles.chapterRowNew,
                  ]}
                >
                  <View style={styles.chapterRowInner}>
                    {/* Number badge with optional NEW overlay */}
                    <View style={styles.chapterNumWrapper}>
                      <View
                        style={[
                          styles.chapterNumBadge,
                          isNew && styles.chapterNumBadgeNew,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chapterNumText,
                            isNew && styles.chapterNumTextNew,
                          ]}
                        >
                          {i + 1}
                        </Text>
                      </View>
                      {isNew && (
                        <View style={styles.newOverlayBadge}>
                          <Text style={styles.newOverlayBadgeText}>NEW</Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.chapterTitle,
                        isNew && styles.chapterTitleNew,
                      ]}
                      numberOfLines={1}
                    >
                      {chapter.chapter}
                    </Text>

                    <Text style={styles.chapterArrow}>›</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </>
  );
}

const COVER_WIDTH = 130;
const COVER_HEIGHT = 185;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#08080C",
  },
  scroll: {
    flex: 1,
  },

  // Hero
  hero: {
    height: 320,
    position: "relative",
    justifyContent: "flex-end",
  },
  heroBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  coverShadow: {
    borderRadius: 12,
    shadowColor: "#a78bfa",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  coverImage: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  heroInfo: {
    flex: 1,
    paddingBottom: 4,
    gap: 10,
  },
  heroTitle: {
    color: "#f0ebff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  genrePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "rgba(167,139,250,0.14)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  genreText: {
    color: "#c4b5fd",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  // Summary
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.1)",
  },
  sectionLabel: {
    color: "#5a4e7a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  summaryText: {
    color: "#9585b8",
    fontSize: 13,
    lineHeight: 20,
  },

  // Chapters
  chaptersSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  chapterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  chapterCount: {
    color: "#4a4060",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  chapterRow: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.07)",
    marginBottom: 1,
  },
  chapterRowFirst: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  chapterRowPressed: {
    backgroundColor: "rgba(167,139,250,0.1)",
    borderColor: "rgba(167,139,250,0.3)",
  },
  // New chapter row — subtle green wash
  chapterRowNew: {
    backgroundColor: "rgba(74,222,128,0.05)",
    borderColor: "rgba(74,222,128,0.2)",
  },
  chapterRowInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  chapterNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(167,139,250,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  chapterNumBadgeNew: {
    backgroundColor: "rgba(74,222,128,0.12)",
  },
  chapterNumText: {
    color: "#7c6aaa",
    fontSize: 10,
    fontWeight: "800",
  },
  chapterNumTextNew: {
    color: "#4ade80",
  },
  chapterTitle: {
    flex: 1,
    color: "#c9bfe8",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  chapterTitleNew: {
    color: "#f0fdf4",
    fontWeight: "600",
  },
  chapterArrow: {
    color: "#4a4060",
    fontSize: 20,
    fontWeight: "300",
  },

  // Number badge wrapper — holds the badge + the NEW overlay
  chapterNumWrapper: {
    position: "relative",
  },
  // NEW label pinned to the bottom-right corner of the number badge
  newOverlayBadge: {
    position: "absolute",
    bottom: -5,
    right: -8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: "#166534",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#4ade80",
  },
  newOverlayBadgeText: {
    color: "#4ade80",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
