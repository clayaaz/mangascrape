/**
 * useDownloadWorker — background-safe download engine
 *
 * Uses:
 *  - expo-task-manager + expo-background-fetch for OS background time
 *  - FileSystem.createDownloadResumable for resumable native downloads
 *  - Persistent queue so every restart picks up where it stopped
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import * as FileSystem from "expo-file-system/legacy";
import * as TaskManager from "expo-task-manager";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import {
    dequeue,
    enqueue,
    loadQueue,
    QueueEntry,
    resetStaleDownloads,
    updateQueueEntry,
} from "./downloadQueue";

// ─── Constants ────────────────────────────────────────────────────────────────

const BG_TASK = "MANGA_DOWNLOAD_TASK";
const INDEX_KEY = "downloaded_chapters";
// Stores FileSystem resumable snapshots keyed by localPath
const RESUMABLE_KEY = "download_resumables";

// ─── Reactive pub/sub ─────────────────────────────────────────────────────────

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

// ─── Resumable snapshot store ─────────────────────────────────────────────────
// FileSystem.createDownloadResumable can save/restore its state as a JSON string
// so downloads survive process death.

async function loadResumables(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(RESUMABLE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveResumable(localPath: string, snapshot: string) {
  const r = await loadResumables();
  r[localPath] = snapshot;
  await AsyncStorage.setItem(RESUMABLE_KEY, JSON.stringify(r));
}

async function clearResumable(localPath: string) {
  const r = await loadResumables();
  delete r[localPath];
  await AsyncStorage.setItem(RESUMABLE_KEY, JSON.stringify(r));
}

// ─── Download index ───────────────────────────────────────────────────────────

type IndexEntry = {
  mangaLink: string;
  mangaTitle: string;
  mangaImg: string;
  chapterName: string;
  clink: string;
  pages: string[];
  downloadedAt: number;
  totalPages: number;
};

async function readIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeIndex(index: IndexEntry[]) {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

// ─── File system helpers ──────────────────────────────────────────────────────

function sanitise(s: string) {
  return s.replace(/https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "_");
}

async function ensureDir(mangaLink: string, clink: string): Promise<string> {
  const dir = `${FileSystem.documentDirectory}manga/${sanitise(mangaLink)}/${sanitise(clink)}/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

// ─── Page scraper ─────────────────────────────────────────────────────────────

async function scrapePages(clink: string): Promise<string[]> {
  const res = await fetch(clink, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const m = /var thzq=\[(.*?),\]/.exec(html);
  if (!m) return [];
  return m[1].split(",").map((p) => p.trim().replace(/['"]/g, ""));
}

// ─── Core download loop ───────────────────────────────────────────────────────

let isRunning = false;

async function processQueue(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    while (true) {
      const queue = await loadQueue();
      const entry = queue.find((e) => e.status === "pending");
      if (!entry) break;

      console.log(`[worker] ▶ ${entry.chapterName}`);
      await updateQueueEntry(entry.clink, { status: "downloading" });
      notify(entry.clink, 0, "downloading");

      try {
        // 1 — Get page URLs (reuse stored ones to avoid re-scraping after a kill)
        let pageUrls = entry.pageUrls?.length
          ? entry.pageUrls
          : await scrapePages(entry.clink);
        if (!pageUrls.length) throw new Error("No pages found");
        if (!entry.pageUrls?.length) {
          await updateQueueEntry(entry.clink, { pageUrls });
        }

        const dir = await ensureDir(entry.mangaLink, entry.clink);
        const localPages: string[] = [];
        const resumables = await loadResumables();
        const startFrom = entry.pagesDownloaded ?? 0;

        // Re-build list of already-finished pages
        for (let i = 0; i < startFrom; i++) {
          const ext = pageUrls[i].split(".").pop()?.split("?")[0] ?? "jpg";
          localPages.push(`${dir}page_${String(i).padStart(4, "0")}.${ext}`);
        }

        // 2 — Download remaining pages using createDownloadResumable
        for (let i = startFrom; i < pageUrls.length; i++) {
          const url = pageUrls[i];
          const ext = url.split(".").pop()?.split("?")[0] ?? "jpg";
          const localPath = `${dir}page_${String(i).padStart(4, "0")}.${ext}`;

          // Check if already exists (from a previous partial run)
          const info = await FileSystem.getInfoAsync(localPath);
          if (!info.exists) {
            // Restore a previous resumable snapshot if one exists
            const snapshot = resumables[localPath];
            let dl: FileSystem.DownloadResumable;

            if (snapshot) {
              dl = FileSystem.createDownloadResumable(
                url,
                localPath,
                { headers: { "User-Agent": "Mozilla/5.0" } },
                undefined,
                snapshot,
              );
            } else {
              dl = FileSystem.createDownloadResumable(url, localPath, {
                headers: { "User-Agent": "Mozilla/5.0" },
              });
            }

            // Save resumable state so we can restore after a kill
            const snap = dl.savable();
            await saveResumable(localPath, JSON.stringify(snap));

            const result = await dl.downloadAsync();
            if (!result?.uri) throw new Error(`Download failed for page ${i}`);

            await clearResumable(localPath);
          }

          localPages.push(localPath);
          const progress = (i + 1) / pageUrls.length;
          await updateQueueEntry(entry.clink, { pagesDownloaded: i + 1 });
          notify(entry.clink, progress, "downloading");
        }

        // 3 — Commit to index
        const index = await readIndex();
        await writeIndex([
          {
            mangaLink: entry.mangaLink,
            mangaTitle: entry.mangaTitle,
            mangaImg: entry.mangaImg,
            chapterName: entry.chapterName,
            clink: entry.clink,
            pages: localPages,
            downloadedAt: Date.now(),
            totalPages: localPages.length,
          },
          ...index.filter((c) => c.clink !== entry.clink),
        ]);

        await dequeue(entry.clink);
        notify(entry.clink, 1, "done");
        console.log(`[worker] ✓ ${entry.chapterName}`);
      } catch (err: any) {
        console.error(`[worker] ✗ ${entry.chapterName}:`, err?.message);
        await updateQueueEntry(entry.clink, {
          status: "error",
          error: err?.message ?? "Unknown error",
        });
        notify(entry.clink, 0, "error");
      }
    }
  } finally {
    isRunning = false;
  }
}

function kick() {
  processQueue().catch((e) => console.error("[worker] crash:", e));
}

// ─── Background task (registered at module level, outside any component) ──────
// The OS wakes the app periodically (every ~15 min) and calls this.
// It re-kicks the queue for any downloads that were interrupted.

TaskManager.defineTask(BG_TASK, async () => {
  try {
    console.log("[bg-task] woke up — checking queue");
    await resetStaleDownloads();
    await processQueue();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function registerBackgroundTask() {
  try {
    await BackgroundFetch.registerTaskAsync(BG_TASK, {
      minimumInterval: 60, // 1 minute minimum (OS may delay further)
      stopOnTerminate: false, // keep running after app is force-closed
      startOnBoot: true, // resume after phone restart
    });
    console.log("[bg-task] registered");
  } catch (e) {
    console.warn("[bg-task] registration failed (simulator?):", e);
  }
}

// ─── Hook — mount once in root _layout.tsx ────────────────────────────────────

export function useDownloadWorker() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Register the OS background task
    registerBackgroundTask();
    // Reset stale entries then start immediately
    resetStaleDownloads().then(kick);

    // Re-kick when foregrounded
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        console.log("[worker] foregrounded — kicking queue");
        kick();
      }
      appState.current = next;
    });

    return () => sub.remove();
  }, []);
}

// ─── Called by DownloadButton ─────────────────────────────────────────────────

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
