import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  clearHistory,
  HistoryEntry,
  loadHistory,
  removeEntry,
} from "../historyStore";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function History() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pressedLink, setPressedLink] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setHistory);
    }, []),
  );

  const handleRemove = async (link: string) => {
    const updated = await removeEntry(link);
    setHistory(updated);
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear History",
      "Remove all reading history? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await clearHistory();
            setHistory([]);
          },
        },
      ],
    );
  };

  const handleResume = (entry: HistoryEntry) => {
    router.push({
      pathname: "/manga",
      params: {
        title: entry.title,
        img: entry.img,
        link: entry.link,
      },
    });
  };

  return (
    <View style={styles.root}>
      {/* In-body header row — brand + clear button */}
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerBrand}>
          <Text style={styles.headerBrandAccent}>H</Text>ISTORY
        </Text>
        {history.length > 0 && (
          <Pressable onPress={handleClearAll} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>RECENTLY READ</Text>
          <Text style={styles.entryCount}>{history.length} titles</Text>
        </View>

        {history.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              Chapters you open will appear here so you can pick up where you
              left off.
            </Text>
          </View>
        )}

        {history.map((entry) => (
          <Pressable
            key={entry.link}
            onPress={() => handleResume(entry)}
            onPressIn={() => setPressedLink(entry.link)}
            onPressOut={() => setPressedLink(null)}
            style={[
              styles.card,
              pressedLink === entry.link && styles.cardPressed,
            ]}
          >
            <View style={styles.coverContainer}>
              <Image
                source={{ uri: entry.img }}
                style={styles.cover}
                resizeMode="cover"
              />
            </View>

            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>
                {entry.title}
              </Text>

              <View style={styles.chapterRow}>
                <View style={styles.chapterPill}>
                  <Text style={styles.chapterPillText} numberOfLines={1}>
                    {entry.chapter}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.timeAgo}>{timeAgo(entry.readAt)}</Text>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => handleResume(entry)}
                    style={styles.resumeBtn}
                  >
                    <Text style={styles.resumeBtnText}>Resume →</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemove(entry.link)}
                    style={styles.removeBtn}
                    hitSlop={8}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.topHighlight} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#08080C",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerBrand: {
    fontSize: 22,
    fontWeight: "800",
    color: "#e8e0ff",
    letterSpacing: 4,
    marginLeft: 4,
  },
  headerBrandAccent: {
    color: "#a78bfa",
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    marginRight: 4,
  },
  clearBtnText: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionLabel: {
    color: "#5a4e7a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  entryCount: {
    color: "#4a4060",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    color: "#c9bfe8",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    color: "#4a4060",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.1)",
    position: "relative",
  },
  cardPressed: {
    backgroundColor: "rgba(167,139,250,0.1)",
    borderColor: "rgba(167,139,250,0.3)",
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  coverContainer: {
    position: "relative",
  },
  cover: {
    width: 80,
    height: 116,
  },
  coverFade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 24,
  },
  info: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  title: {
    color: "#e8e0ff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.2,
    lineHeight: 19,
  },
  chapterRow: {
    marginTop: 6,
  },
  chapterPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(167,139,250,0.12)",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.22)",
  },
  chapterPillText: {
    color: "#a78bfa",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeAgo: {
    color: "#4a4060",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resumeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(167,139,250,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  resumeBtnText: {
    color: "#c4b5fd",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtnText: {
    color: "#f87171",
    fontSize: 10,
    fontWeight: "800",
  },
});
