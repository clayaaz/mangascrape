import AsyncStorage from "@react-native-async-storage/async-storage";

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
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch (e) {
    console.error("[historyStore] loadHistory failed:", e);
    return [];
  }
}

export async function recordRead(
  entry: Omit<HistoryEntry, "readAt">,
): Promise<void> {
  // Don't save if the core identifiers are missing
  if (!entry.link || !entry.title) {
    console.warn(
      "[historyStore] recordRead skipped — missing link or title",
      entry,
    );
    return;
  }

  try {
    const history = await loadHistory();
    const filtered = history.filter((h) => h.link !== entry.link);
    const updated: HistoryEntry[] = [
      { ...entry, readAt: Date.now() },
      ...filtered,
    ];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("[historyStore] recordRead failed:", e);
  }
}

export async function removeEntry(link: string): Promise<HistoryEntry[]> {
  try {
    const history = await loadHistory();
    const updated = history.filter((h) => h.link !== link);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("[historyStore] removeEntry failed:", e);
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("[historyStore] clearHistory failed:", e);
  }
}
