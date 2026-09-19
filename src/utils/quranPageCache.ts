/**
 * Offline storage and background downloading manager for Quran SVG Pages using IndexedDB.
 * Stores Quran SVG pages locally in a hidden application database ('quran_mushaf_db_v1')
 * for instant offline loading and seamless background pre-caching.
 */

const DB_NAME = "quran_mushaf_db_v12";
const STORE_NAME = "pages_svg";
const DB_VERSION = 12;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.onclose = () => {
        dbPromise = null;
      };
      db.onversionchange = () => {
        try { db.close(); } catch (e) {}
        dbPromise = null;
      };
      db.onerror = () => {
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Get cached SVG string for a page from IndexedDB
 */
export async function getCachedPageSvg(pageNum: number, provider: string = "quran-svg"): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const db = await getDB();
      const key = `page_${pageNum}_${provider}`;
      return await new Promise<string | null>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, "readonly");
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => resolve((req.result as string) || null);
          req.onerror = () => resolve(null);
        } catch (txErr) {
          dbPromise = null;
          resolve(null);
        }
      });
    } catch (e) {
      dbPromise = null;
    }
  }
  return null;
}

/**
 * Save SVG string for a page into IndexedDB
 */
export async function saveCachedPageSvg(pageNum: number, provider: string = "quran-svg", svgText: string): Promise<void> {
  if (!svgText || svgText.length < 50) return;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const db = await getDB();
      const key = `page_${pageNum}_${provider}`;
      return await new Promise<void>((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(svgText, key);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        } catch (txErr) {
          dbPromise = null;
          resolve();
        }
      });
    } catch (e) {
      dbPromise = null;
    }
  }
}

/**
 * Get cached Surah Ayahs from IndexedDB
 */
export async function getCachedSurahAyahs(surahNumber: number): Promise<any[] | null> {
  try {
    const db = await getDB();
    const key = `surah_ayahs_${surahNumber}`;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result) {
            try {
              const parsed = typeof req.result === "string" ? JSON.parse(req.result) : req.result;
              resolve(parsed);
            } catch {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

/**
 * Save Surah Ayahs to IndexedDB for permanent offline access
 */
export async function saveCachedSurahAyahs(surahNumber: number, ayahs: any[]): Promise<void> {
  if (!ayahs || ayahs.length === 0) return;
  try {
    const db = await getDB();
    const key = `surah_ayahs_${surahNumber}`;
    const serialized = JSON.stringify(ayahs);
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(serialized, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch (_) {}
}

/**
 * Get total number of cached pages for a given provider
 */
export async function getCachedPagesCount(provider: string = "quran-svg"): Promise<number> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const db = await getDB();
      return await new Promise<number>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, "readonly");
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAllKeys();
          req.onsuccess = () => {
            const keys = (req.result as string[]) || [];
            const prefix = `page_`;
            const suffix = `_${provider}`;
            const count = keys.filter(k => typeof k === "string" && k.startsWith(prefix) && k.endsWith(suffix)).length;
            resolve(count);
          };
          req.onerror = () => resolve(0);
        } catch (txErr) {
          dbPromise = null;
          resolve(0);
        }
      });
    } catch (e) {
      dbPromise = null;
    }
  }
  return 0;
}

/**
 * Clear offline cache for Quran pages
 */
export async function clearQuranPageCache(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (txErr) {
        dbPromise = null;
        resolve();
      }
    });
  } catch (e) {
    dbPromise = null;
    console.warn("Failed to clear IndexedDB cache:", e);
  }
}

// Global state for background downloader
let isDownloadingActive = false;
let autoDownloadController: AbortController | null = null;

/**
 * Automatically downloads all Quran pages in the background into the hidden IndexedDB store.
 * Skips pages already saved.
 */
export function startAutoQuranDownload(
  provider: string = "quran-svg",
  fetchFn: (page: number, provider: string, signal?: AbortSignal) => Promise<string>,
  onProgress?: (downloaded: number, total: number, isComplete: boolean) => void
): () => void {
  if (isDownloadingActive) {
    return () => {
      if (autoDownloadController) autoDownloadController.abort();
    };
  }

  isDownloadingActive = true;
  autoDownloadController = new AbortController();
  const signal = autoDownloadController.signal;

  (async () => {
    const TOTAL_PAGES = 604;
    let currentCount = await getCachedPagesCount(provider);
    if (onProgress) onProgress(currentCount, TOTAL_PAGES, currentCount >= TOTAL_PAGES);

    if (currentCount >= TOTAL_PAGES) {
      isDownloadingActive = false;
      return;
    }

    // Sequence of pages to download: prioritize first pages 1..10, then 11..604
    const pageQueue: number[] = [];
    for (let p = 1; p <= TOTAL_PAGES; p++) {
      pageQueue.push(p);
    }

    for (const pageNum of pageQueue) {
      if (signal.aborted) break;

      // Check if already in cache
      const existing = await getCachedPageSvg(pageNum, provider);
      if (existing) {
        continue;
      }

      try {
        // Fetch page SVG
        const svgText = await fetchFn(pageNum, provider, signal);
        if (svgText && !signal.aborted) {
          await saveCachedPageSvg(pageNum, provider, svgText);
          currentCount = await getCachedPagesCount(provider);
          if (onProgress) onProgress(currentCount, TOTAL_PAGES, currentCount >= TOTAL_PAGES);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") break;
        console.warn(`Background auto-downloader skipped page ${pageNum}:`, err);
      }

      // Small delay between page downloads to be polite to browser & network resources
      await new Promise((r) => setTimeout(r, 150));
    }

    isDownloadingActive = false;
    const finalCount = await getCachedPagesCount(provider);
    if (onProgress) onProgress(finalCount, TOTAL_PAGES, finalCount >= TOTAL_PAGES);
  })();

  return () => {
    if (autoDownloadController) {
      autoDownloadController.abort();
      autoDownloadController = null;
    }
    isDownloadingActive = false;
  };
}
