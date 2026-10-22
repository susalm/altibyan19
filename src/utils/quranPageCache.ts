/**
 * Offline Cache Manager for Quran Pages (SVG & Vector Pages 1-604)
 * Uses CacheStorage / IndexedDB for robust, high-performance offline storage.
 */

const DB_NAME = 'mushaf_altibyan_page_cache_v1';
const STORE_NAME = 'quran_svg_pages';
const TOTAL_PAGES = 604;

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

const memoryCache = new Map<number, string>();

export async function getCachedPageSvg(pageNumber: number): Promise<string | null> {
  if (memoryCache.has(pageNumber)) {
    return memoryCache.get(pageNumber) || null;
  }

  const db = await openDB();
  if (!db) {
    try {
      const local = localStorage.getItem(`quran_page_svg_${pageNumber}`);
      if (local) {
        memoryCache.set(pageNumber, local);
        return local;
      }
    } catch {}
    return null;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(pageNumber);
      req.onsuccess = () => {
        const res = req.result as string | undefined;
        if (res) {
          memoryCache.set(pageNumber, res);
          resolve(res);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveCachedPageSvg(pageNumber: number, svgContent: string): Promise<void> {
  if (!svgContent) return;
  memoryCache.set(pageNumber, svgContent);

  const db = await openDB();
  if (!db) {
    try {
      // Limit localStorage fallback size
      if (pageNumber <= 20) {
        localStorage.setItem(`quran_page_svg_${pageNumber}`, svgContent);
      }
    } catch {}
    return;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(svgContent, pageNumber);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getCachedPagesCount(): Promise<number> {
  const db = await openDB();
  if (!db) {
    return memoryCache.size;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(memoryCache.size);
    } catch {
      resolve(memoryCache.size);
    }
  });
}

export async function clearQuranPageCache(): Promise<void> {
  memoryCache.clear();
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

let isDownloadingActive = false;
let shouldStopDownload = false;

export function startAutoQuranDownload(
  _type: string,
  fetchPage: (page: number) => Promise<string>,
  onProgress?: (downloaded: number, total: number, isComplete?: boolean) => void
): () => void {
  shouldStopDownload = false;

  const cancelFn = () => {
    shouldStopDownload = true;
    isDownloadingActive = false;
  };

  if (isDownloadingActive) return cancelFn;
  isDownloadingActive = true;

  (async () => {
    try {
      let downloaded = await getCachedPagesCount();
      onProgress?.(downloaded, TOTAL_PAGES, downloaded >= TOTAL_PAGES);

      for (let p = 1; p <= TOTAL_PAGES; p++) {
        if (shouldStopDownload) break;

        const cached = await getCachedPageSvg(p);
        if (!cached) {
          try {
            const svg = await fetchPage(p);
            if (svg) {
              await saveCachedPageSvg(p, svg);
              downloaded++;
              onProgress?.(downloaded, TOTAL_PAGES, false);
            }
          } catch (e) {
            console.warn(`Failed caching page ${p}:`, e);
          }
          // Friendly gentle delay to avoid locking main thread
          await new Promise((r) => setTimeout(r, 60));
        }
      }

      onProgress?.(downloaded, TOTAL_PAGES, true);
    } finally {
      isDownloadingActive = false;
    }
  })();

  return cancelFn;
}

const surahAyahsMemoryCache = new Map<number, any[]>();

export async function getCachedSurahAyahs(surahNumber: number): Promise<any[] | null> {
  if (surahAyahsMemoryCache.has(surahNumber)) {
    return surahAyahsMemoryCache.get(surahNumber) || null;
  }
  try {
    const raw = localStorage.getItem(`quran_cached_surah_${surahNumber}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        surahAyahsMemoryCache.set(surahNumber, parsed);
        return parsed;
      }
    }
  } catch {}
  return null;
}

export async function saveCachedSurahAyahs(surahNumber: number, ayahs: any[]): Promise<void> {
  if (!Array.isArray(ayahs) || ayahs.length === 0) return;
  surahAyahsMemoryCache.set(surahNumber, ayahs);
  try {
    localStorage.setItem(`quran_cached_surah_${surahNumber}`, JSON.stringify(ayahs));
  } catch {}
}

