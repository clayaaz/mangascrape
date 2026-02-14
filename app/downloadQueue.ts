import AsyncStorage from "@react-native-async-storage/async-storage";

export type QueueStatus = "pending" | "downloading" | "done" | "error";

export type QueueEntry = {
  clink: string;
  mangaLink: string;
  mangaTitle: string;
  mangaImg: string;
  chapterName: string;
  pageUrls: string[];
  pagesDownloaded: number;
  status: QueueStatus;
  addedAt: number;
  error?: string;
};

const QUEUE_KEY = "download_queue_v2";

export async function loadQueue(): Promise<QueueEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueueEntry[]) : [];
  } catch {
    return [];
  }
}

export async function saveQueue(queue: QueueEntry[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(
  entry: Omit<QueueEntry, "status" | "addedAt" | "pagesDownloaded">,
): Promise<void> {
  const queue = await loadQueue();
  const existing = queue.find((e) => e.clink === entry.clink);
  // Don't re-queue if already pending/downloading
  if (existing && existing.status !== "error") return;
  const filtered = queue.filter((e) => e.clink !== entry.clink);
  await saveQueue([
    ...filtered,
    { ...entry, status: "pending", pagesDownloaded: 0, addedAt: Date.now() },
  ]);
}

export async function updateQueueEntry(
  clink: string,
  patch: Partial<QueueEntry>,
): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(
    queue.map((e) => (e.clink === clink ? { ...e, ...patch } : e)),
  );
}

export async function dequeue(clink: string): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(queue.filter((e) => e.clink !== clink));
}

/** Called on app start — any entry stuck as "downloading" was interrupted; reset to "pending" */
export async function resetStaleDownloads(): Promise<void> {
  const queue = await loadQueue();
  const hasStale = queue.some((e) => e.status === "downloading");
  if (!hasStale) return;
  await saveQueue(
    queue.map((e) =>
      e.status === "downloading"
        ? { ...e, status: "pending" as QueueStatus }
        : e,
    ),
  );
}
