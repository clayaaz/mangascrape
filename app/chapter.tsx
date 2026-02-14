import { BlurView } from "expo-blur";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BlobImage from "./components/blobimage";
import { recordRead } from "./historyStore";
import { chapterStore } from "./store";

async function scrape(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();

  const regex = /var thzq=\[(.*?),\]/;
  const m = regex.exec(html);

  if (m != null) {
    return {
      pages: m[1].split(",").map((p) => ({
        image: p
          .trim()
          .replace(/['"]/g, "")
          .replace("i1", "i" + Math.ceil(Math.random() * 3)),
      })),
    };
  }

  return { pages: [] };
}

function NavButton({
  title,
  onPress,
  disabled,
  direction,
}: {
  title: string;
  onPress: () => void;
  disabled: boolean;
  direction: "prev" | "next";
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.navBtn,
        pressed && !disabled && styles.navBtnPressed,
        disabled && styles.navBtnDisabled,
      ]}
    >
      {direction === "prev" && (
        <Text style={[styles.navArrow, disabled && styles.navArrowDisabled]}>
          ‹
        </Text>
      )}
      <Text style={[styles.navBtnText, disabled && styles.navBtnTextDisabled]}>
        {title}
      </Text>
      {direction === "next" && (
        <Text style={[styles.navArrow, disabled && styles.navArrowDisabled]}>
          ›
        </Text>
      )}
    </Pressable>
  );
}

function NavBar({
  currentIndex,
  totalChapters,
  onPrev,
  onNext,
}: {
  currentIndex: number;
  totalChapters: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const isFirst = currentIndex === totalChapters - 1;
  const isLast = currentIndex === 0;

  return (
    <BlurView
      intensity={60}
      tint="dark"
      style={[
        styles.navBlur,
        Platform.OS === "android" && styles.navBlurAndroid,
      ]}
    >
      <View style={styles.navRow}>
        <NavButton
          title="Prev"
          onPress={onPrev}
          disabled={isFirst}
          direction="prev"
        />
        <View style={styles.navDivider} />
        <NavButton
          title="Next"
          onPress={onNext}
          disabled={isLast}
          direction="next"
        />
      </View>
    </BlurView>
  );
}

export default function Chapter() {
  const router = useRouter();
  const chapter = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const chapters = chapterStore.chapters;
  const currentIndex = Number(chapter.chapterIndex);

  const NAV_BAR_HEIGHT = Platform.OS === "ios" ? 44 : 56;
  const headerBottom = insets.top + NAV_BAR_HEIGHT;

  const goToChapter = (index: number) => {
    chapterStore.currentIndex = index;
    router.replace({
      pathname: "/chapter",
      params: {
        // Carry manga identity forward explicitly
        title: chapter.title as string,
        img: chapter.img as string,
        link: chapter.link as string,
        // New chapter data
        chapter: chapters[index].chapter,
        clink: chapters[index].clink,
        chapterIndex: index,
      },
    });
  };

  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPages([]);

    // Save to history whenever a chapter is opened
    recordRead({
      title: chapter.title as string,
      img: chapter.img as string,
      link: chapter.link as string,
      chapter: chapter.chapter as string,
      chapterIndex: currentIndex,
    });

    scrape(chapter.clink as string).then((result) => {
      setPages(result.pages as any);
      setLoading(false);
    });
  }, [chapter.clink]);

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerTitle: chapter?.chapter as string,
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: "#e8e0ff",
          headerTitleStyle: {
            fontSize: 14,
            fontWeight: "700",
            color: "#c4b5fd",
            letterSpacing: 0.3,
          },
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer for transparent header */}
        <View style={{ height: headerBottom + 8 }} />

        {/* TOP NAV */}
        <View style={styles.navWrapper}>
          <NavBar
            currentIndex={currentIndex}
            totalChapters={chapters.length}
            onPrev={() => goToChapter(currentIndex + 1)}
            onNext={() => goToChapter(currentIndex - 1)}
          />
        </View>

        {/* Chapter label */}
        <View style={styles.chapterLabelRow}>
          <View style={styles.chapterLabelPill}>
            <Text style={styles.chapterLabelText}>
              {chapter?.chapter as string}
            </Text>
          </View>
          {!loading && (
            <Text style={styles.pageCountLabel}>{pages.length} pages</Text>
          )}
        </View>

        {/* Loading state */}
        {loading && (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color="#a78bfa" />
            <Text style={styles.loadingText}>Loading pages...</Text>
          </View>
        )}

        {/* Pages */}
        {pages.map((page, i) => (
          <View key={i} style={styles.pageWrapper}>
            <BlobImage url={page.image} />
          </View>
        ))}

        {/* BOTTOM NAV */}
        {!loading && pages.length > 0 && (
          <View style={[styles.navWrapper, { marginTop: 16, marginBottom: 8 }]}>
            <NavBar
              currentIndex={currentIndex}
              totalChapters={chapters.length}
              onPrev={() => goToChapter(currentIndex + 1)}
              onNext={() => goToChapter(currentIndex - 1)}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#08080C",
  },
  scrollContent: {
    alignItems: "stretch",
  },

  // Nav bar
  navWrapper: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
  },
  navBlur: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  navBlurAndroid: {
    backgroundColor: "rgba(14,13,22,0.95)",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  navDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(167,139,250,0.15)",
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(167,139,250,0.1)",
    borderRadius: 10,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  navBtnPressed: {
    backgroundColor: "rgba(167,139,250,0.28)",
    borderColor: "rgba(167,139,250,0.7)",
  },
  navBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.06)",
  },
  navBtnText: {
    color: "#c4b5fd",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  navBtnTextDisabled: {
    color: "#3a3350",
  },
  navArrow: {
    color: "#a78bfa",
    fontSize: 20,
    fontWeight: "300",
    lineHeight: 22,
  },
  navArrowDisabled: {
    color: "#2e2840",
  },

  // Chapter label
  chapterLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 14,
  },
  chapterLabelPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "rgba(167,139,250,0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  chapterLabelText: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  pageCountLabel: {
    color: "#4a4060",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Pages
  pageWrapper: {
    marginBottom: 2,
    alignItems: "center",
  },
  // Loading
  loadingBlock: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    color: "#5a4e7a",
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
