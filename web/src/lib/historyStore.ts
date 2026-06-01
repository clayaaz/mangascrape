export type HistoryEntry = {
  title: string;
  img: string;
  link: string;
  chapter: string;
  chapterIndex: number;
  readAt: number;
};

const STORAGE_KEY = "manga_history";

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export async function recordRead(
  entry: Omit<HistoryEntry, "readAt">,
): Promise<void> {
  if (!entry.link || !entry.title) return;
  const history = await loadHistory();
  const filtered = history.filter((h) => h.link !== entry.link);
  const updated: HistoryEntry[] = [
    { ...entry, readAt: Date.now() },
    ...filtered,
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function removeEntry(link: string): Promise<HistoryEntry[]> {
  const history = await loadHistory();
  const updated = history.filter((h) => h.link !== link);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearHistory(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
}
