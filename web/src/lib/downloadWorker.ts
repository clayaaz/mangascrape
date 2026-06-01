import { savePageBlob } from "./blobStore";
import {
  loadDownloadIndex,
  saveDownloadIndex,
  type DownloadedChapter,
} from "./downloadStore";
import {
  dequeue,
  enqueue,
  loadQueue,
  resetStaleDownloads,
  updateQueueEntry,
  type QueueEntry,
} from "./downloadQueue";
import { fetchProxiedBlob } from "./proxy";
import { scrapeChapterPages } from "./scraper";

type Listener = (progress: number, status: QueueEntry["status"]) => void;
const listeners = new Map<string, Set<Listener>>();

export function subscribeToDownload(clink: string, fn: Listener): () => void {
  if (!listeners.has(clink)) listeners.set(clink, new Set());
  listeners.get(clink)!.add(fn);
  return () => listeners.get(clink)?.delete(fn);
}

function notify(clink: string, progress: number, status: QueueEntry["status"]) {
  listeners.get(clink)?.forEach((fn) => fn(progress, status));
}

let isRunning = false;

async function downloadPage(url: string): Promise<Blob> {
  return fetchProxiedBlob(url);
}

async function processQueue(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    while (true) {
      const queue = await loadQueue();
      const entry = queue.find((e) => e.status === "pending");
      if (!entry) break;

      await updateQueueEntry(entry.clink, { status: "downloading" });
      notify(entry.clink, 0, "downloading");

      try {
        let pageUrls = entry.pageUrls?.length
          ? entry.pageUrls
          : await scrapeChapterPages(entry.clink);
        if (!pageUrls.length) throw new Error("No pages found");
        if (!entry.pageUrls?.length) {
          await updateQueueEntry(entry.clink, { pageUrls });
        }

        const startFrom = entry.pagesDownloaded ?? 0;

        for (let i = startFrom; i < pageUrls.length; i++) {
          const blob = await downloadPage(pageUrls[i]);
          await savePageBlob(entry.clink, i, blob);
          const progress = (i + 1) / pageUrls.length;
          await updateQueueEntry(entry.clink, { pagesDownloaded: i + 1 });
          notify(entry.clink, progress, "downloading");
        }

        const index = await loadDownloadIndex();
        const newEntry: DownloadedChapter = {
          mangaLink: entry.mangaLink,
          mangaTitle: entry.mangaTitle,
          mangaImg: entry.mangaImg,
          chapterName: entry.chapterName,
          clink: entry.clink,
          pageCount: pageUrls.length,
          downloadedAt: Date.now(),
          totalPages: pageUrls.length,
        };
        await saveDownloadIndex([
          newEntry,
          ...index.filter((c) => c.clink !== entry.clink),
        ]);

        await dequeue(entry.clink);
        notify(entry.clink, 1, "done");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        await updateQueueEntry(entry.clink, { status: "error", error: message });
        notify(entry.clink, 0, "error");
      }
    }
  } finally {
    isRunning = false;
  }
}

function kick() {
  processQueue().catch((e) => console.error("[worker]", e));
}

export function initDownloadWorker(): void {
  resetStaleDownloads().then(kick);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") kick();
  });
}

export async function queueDownload(params: {
  clink: string;
  mangaLink: string;
  mangaTitle: string;
  mangaImg: string;
  chapterName: string;
}): Promise<void> {
  await enqueue({ ...params, pageUrls: [] });
  kick();
}
