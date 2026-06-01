const DB_NAME = "manga_ikuzo_blobs";
const STORE = "pages";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

function chapterKey(clink: string, pageIndex: number) {
  return `${clink}::${pageIndex}`;
}

export async function savePageBlob(
  clink: string,
  pageIndex: number,
  blob: Blob,
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, chapterKey(clink, pageIndex));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPageBlob(
  clink: string,
  pageIndex: number,
): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(chapterKey(clink, pageIndex));
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteChapterBlobs(clink: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.openCursor();
    const prefix = `${clink}::`;
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        if (String(cursor.key).startsWith(prefix)) cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getChapterBlobUrls(clink: string): Promise<string[]> {
  const db = await openDb();
  const keys: string[] = [];
  const prefix = `${clink}::`;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const key = String(cursor.key);
        if (key.startsWith(prefix)) keys.push(key);
        cursor.continue();
      } else resolve();
    };
    req.onerror = () => reject(req.error);
  });

  keys.sort((a, b) => {
    const ai = Number(a.split("::")[1]);
    const bi = Number(b.split("::")[1]);
    return ai - bi;
  });

  const urls: string[] = [];
  for (const key of keys) {
    const idx = Number(key.split("::")[1]);
    const blob = await getPageBlob(clink, idx);
    if (blob) urls.push(URL.createObjectURL(blob));
  }
  return urls;
}
