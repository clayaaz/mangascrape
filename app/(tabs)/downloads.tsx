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
    deleteAllForManga,
    deleteChapter,
    DownloadedChapter,
    groupByManga,
    loadDownloadIndex,
    MangaDownloadGroup,
} from "../downloadStore";
import { chapterStore } from "../store";

function formatBytes(pages: number): string {
  // rough estimate: ~200KB per page
  const kb = pages * 200;
  if (kb < 1024) return `~${kb} KB`;
  return `~${(kb / 1024).toFixed(1)} MB`;
}

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

// ─── Chapter row inside an expanded manga ─────────────────────────────────────

function ChapterRow({
  chapter,
  mangaLink,
  mangaTitle,
  mangaImg,
  onDeleted,
}: {
  chapter: DownloadedChapter;
  mangaLink: string;
  mangaTitle: string;
  mangaImg: string;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  const handleRead = () => {
    // Build a minimal chapters array just for this offline chapter
    chapterStore.chapters = [
      { chapter: chapter.chapterName, clink: chapter.clink },
    ];
    chapterStore.currentIndex = 0;
    router.push({
      pathname: "/chapter",
      params: {
        title: mangaTitle,
        img: mangaImg,
        link: mangaLink,
        chapter: chapter.chapterName,
        clink: chapter.clink,
        chapterIndex: 0,
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete chapter?",
      `Remove offline copy of "${chapter.chapterName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteChapter(chapter.clink);
            onDeleted();
          },
        },
      ],
    );
  };

  return (
    <Pressable
      onPress={handleRead}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.chapterRow, pressed && styles.chapterRowPressed]}
    >
      <View style={styles.chapterRowInner}>
        <View style={styles.chapterOfflineDot} />
        <View style={styles.chapterInfo}>
          <Text style={styles.chapterName} numberOfLines={1}>
            {chapter.chapterName}
          </Text>
          <Text style={styles.chapterMeta}>
            {chapter.totalPages} pages · {formatBytes(chapter.totalPages)} ·{" "}
            {timeAgo(chapter.downloadedAt)}
          </Text>
        </View>
        <Pressable
          onPress={handleDelete}
          style={styles.deleteChapterBtn}
          hitSlop={8}
        >
          <Text style={styles.deleteChapterIcon}>✕</Text>
        </Pressable>
        <Text style={styles.readArrow}>›</Text>
      </View>
    </Pressable>
  );
}

// ─── Manga card with expandable chapter list ──────────────────────────────────

function MangaGroup({
  group,
  onChanged,
}: {
  group: MangaDownloadGroup;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [chapters, setChapters] = useState(group.chapters);

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete all chapters?",
      `Remove all ${chapters.length} downloaded chapters of "${group.mangaTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            await deleteAllForManga(group.mangaLink);
            onChanged();
          },
        },
      ],
    );
  };

  const handleChapterDeleted = async () => {
    // Reload just this group's chapters
    const { loadDownloadIndex } = await import("../downloadStore");
    const index = await loadDownloadIndex();
    const remaining = index.filter((c) => c.mangaLink === group.mangaLink);
    if (remaining.length === 0) {
      onChanged(); // remove the whole group
    } else {
      setChapters(remaining);
    }
  };

  return (
    <View style={styles.mangaCard}>
      {/* Card header */}
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={styles.mangaCardHeader}
      >
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: group.mangaImg }}
            style={styles.cover}
            resizeMode="cover"
          />
        </View>

        <View style={styles.mangaInfo}>
          <Text style={styles.mangaTitle} numberOfLines={2}>
            {group.mangaTitle}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillText}>
                {chapters.length} chapters
              </Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillText}>
                {formatBytes(group.totalPages)}
              </Text>
            </View>
          </View>

          <View style={styles.mangaActions}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/manga",
                  params: {
                    title: group.mangaTitle,
                    img: group.mangaImg,
                    link: group.mangaLink,
                  },
                })
              }
              style={styles.viewBtn}
            >
              <Text style={styles.viewBtnText}>View Manga</Text>
            </Pressable>
            <Pressable
              onPress={handleDeleteAll}
              style={styles.deleteAllBtn}
              hitSlop={4}
            >
              <Text style={styles.deleteAllBtnText}>Delete All</Text>
            </Pressable>
          </View>
        </View>

        {/* Expand chevron */}
        <Text style={[styles.chevron, expanded && styles.chevronOpen]}>›</Text>
        <View style={styles.topHighlight} />
      </Pressable>

      {/* Expanded chapter list */}
      {expanded && (
        <View style={styles.chapterList}>
          <View style={styles.chapterListDivider} />
          {chapters.map((ch) => (
            <ChapterRow
              key={ch.clink}
              chapter={ch}
              mangaLink={group.mangaLink}
              mangaTitle={group.mangaTitle}
              mangaImg={group.mangaImg}
              onDeleted={handleChapterDeleted}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Downloads() {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<MangaDownloadGroup[]>([]);

  const reload = useCallback(async () => {
    const index = await loadDownloadIndex();
    setGroups(groupByManga(index));
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const totalChapters = groups.reduce((s, g) => s + g.chapters.length, 0);
  const totalPages = groups.reduce((s, g) => s + g.totalPages, 0);

  return (
    <View style={styles.root}>
      {/* In-body header */}
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerBrand}>
          <Text style={styles.headerBrandAccent}>D</Text>OWNLOADS
        </Text>
        {totalChapters > 0 && (
          <Text style={styles.headerMeta}>
            {totalChapters} chapters · {formatBytes(totalPages)}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>SAVED FOR OFFLINE</Text>
          <Text style={styles.entryCount}>{groups.length} titles</Text>
        </View>

        {groups.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⬇</Text>
            <Text style={styles.emptyTitle}>No downloads yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the download button on any chapter to save it for offline
              reading.
            </Text>
          </View>
        )}

        {groups.map((group) => (
          <MangaGroup key={group.mangaLink} group={group} onChanged={reload} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#08080C" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

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
  },
  headerBrandAccent: { color: "#a78bfa" },
  headerMeta: {
    color: "#4a4060",
    fontSize: 11,
    fontWeight: "600",
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
  entryCount: { color: "#4a4060", fontSize: 12, fontWeight: "600" },

  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
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

  // Manga card
  mangaCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.12)",
  },
  mangaCardHeader: {
    flexDirection: "row",
    position: "relative",
    alignItems: "center",
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  coverContainer: { position: "relative" },
  cover: { width: 80, height: 116 },
  coverFade: { position: "absolute", right: 0, top: 0, bottom: 0, width: 24 },

  mangaInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  mangaTitle: {
    color: "#e8e0ff",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 19,
  },

  statsRow: { flexDirection: "row", gap: 6 },
  statPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: "rgba(167,139,250,0.1)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  statPillText: {
    color: "#7c6aaa",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  mangaActions: { flexDirection: "row", gap: 8, marginTop: 2 },
  viewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(167,139,250,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  viewBtnText: {
    color: "#c4b5fd",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  deleteAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  deleteAllBtnText: {
    color: "#f87171",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  chevron: {
    color: "#4a4060",
    fontSize: 22,
    paddingRight: 14,
    transform: [{ rotate: "90deg" }],
  },
  chevronOpen: { transform: [{ rotate: "-90deg" }], color: "#a78bfa" },

  // Chapter list
  chapterList: { paddingBottom: 4 },
  chapterListDivider: {
    height: 1,
    backgroundColor: "rgba(167,139,250,0.08)",
    marginHorizontal: 16,
  },

  chapterRow: {
    paddingVertical: 1,
    backgroundColor: "transparent",
  },
  chapterRowPressed: { backgroundColor: "rgba(167,139,250,0.07)" },
  chapterRowInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 16,
    gap: 10,
  },
  chapterOfflineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  chapterInfo: { flex: 1 },
  chapterName: { color: "#c9bfe8", fontSize: 13, fontWeight: "600" },
  chapterMeta: {
    color: "#4a4060",
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  deleteChapterBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteChapterIcon: { color: "#f87171", fontSize: 10, fontWeight: "800" },
  readArrow: { color: "#4a4060", fontSize: 18 },
});
