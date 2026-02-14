/**
 * downloadStore — read-only query layer over the download index.
 * Writing is handled exclusively by useDownloadWorker to avoid races.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

export type DownloadedChapter = {
  mangaLink: string;
  mangaTitle: string;
  mangaImg: string;
  chapterName: string;
  clink: string;
  pages: string[];
  downloadedAt: number;
  totalPages: number;
};

export type MangaDownloadGroup = {
  mangaLink: string;
  mangaTitle: string;
  mangaImg: string;
  chapters: DownloadedChapter[];
  totalPages: number;
};

const INDEX_KEY = "downloaded_chapters";

export async function loadDownloadIndex(): Promise<DownloadedChapter[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as DownloadedChapter[]) : [];
  } catch {
    return [];
  }
}

// Exposed for the worker to write — do not call from UI code
export async function saveDownloadIndex(
  index: DownloadedChapter[],
): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export async function isChapterDownloaded(clink: string): Promise<boolean> {
  const index = await loadDownloadIndex();
  return index.some((c) => c.clink === clink);
}

export async function getDownloadedChapter(
  clink: string,
): Promise<DownloadedChapter | null> {
  const index = await loadDownloadIndex();
  return index.find((c) => c.clink === clink) ?? null;
}

export async function deleteChapter(
  clink: string,
): Promise<DownloadedChapter[]> {
  try {
    const index = await loadDownloadIndex();
    const entry = index.find((c) => c.clink === clink);
    if (entry?.pages[0]) {
      const dir = entry.pages[0].substring(
        0,
        entry.pages[0].lastIndexOf("/") + 1,
      );
      const info = await FileSystem.getInfoAsync(dir);
      if (info.exists) await FileSystem.deleteAsync(dir, { idempotent: true });
    }
    const updated = index.filter((c) => c.clink !== clink);
    await saveDownloadIndex(updated);
    return updated;
  } catch (e) {
    console.error("[downloadStore] deleteChapter:", e);
    return [];
  }
}

export async function deleteAllForManga(
  mangaLink: string,
): Promise<DownloadedChapter[]> {
  try {
    const index = await loadDownloadIndex();
    for (const entry of index.filter((c) => c.mangaLink === mangaLink)) {
      if (entry.pages[0]) {
        const dir = entry.pages[0].substring(
          0,
          entry.pages[0].lastIndexOf("/") + 1,
        );
        const info = await FileSystem.getInfoAsync(dir);
        if (info.exists)
          await FileSystem.deleteAsync(dir, { idempotent: true });
      }
    }
    const updated = index.filter((c) => c.mangaLink !== mangaLink);
    await saveDownloadIndex(updated);
    return updated;
  } catch (e) {
    console.error("[downloadStore] deleteAllForManga:", e);
    return [];
  }
}

export function groupByManga(index: DownloadedChapter[]): MangaDownloadGroup[] {
  const map = new Map<string, MangaDownloadGroup>();
  for (const chapter of index) {
    if (!map.has(chapter.mangaLink)) {
      map.set(chapter.mangaLink, {
        mangaLink: chapter.mangaLink,
        mangaTitle: chapter.mangaTitle,
        mangaImg: chapter.mangaImg,
        chapters: [],
        totalPages: 0,
      });
    }
    const g = map.get(chapter.mangaLink)!;
    g.chapters.push(chapter);
    g.totalPages += chapter.totalPages;
  }
  return Array.from(map.values());
}
