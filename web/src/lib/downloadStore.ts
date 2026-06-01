import { deleteChapterBlobs } from "./blobStore";

export type DownloadedChapter = {
  mangaLink: string;
  mangaTitle: string;
  mangaImg: string;
  chapterName: string;
  clink: string;
  pageCount: number;
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
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as DownloadedChapter[]) : [];
  } catch {
    return [];
  }
}

export async function saveDownloadIndex(
  index: DownloadedChapter[],
): Promise<void> {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
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
  await deleteChapterBlobs(clink);
  const index = await loadDownloadIndex();
  const updated = index.filter((c) => c.clink !== clink);
  await saveDownloadIndex(updated);
  return updated;
}

export async function deleteAllForManga(
  mangaLink: string,
): Promise<DownloadedChapter[]> {
  const index = await loadDownloadIndex();
  for (const entry of index.filter((c) => c.mangaLink === mangaLink)) {
    await deleteChapterBlobs(entry.clink);
  }
  const updated = index.filter((c) => c.mangaLink !== mangaLink);
  await saveDownloadIndex(updated);
  return updated;
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
