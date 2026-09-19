// src/utils/audioOfflineCache.ts
/**
 * Real Offline Audio Caching & Download Engine
 * Uses both CacheStorage API and IndexedDB for guaranteed persistent 100% offline playback.
 */

const AUDIO_CACHE_NAME = "quran_audio_cache_v1";
const IDB_NAME = "quran_audio_offline_db";
const IDB_VERSION = 1;
const IDB_STORE = "audio_blobs";

let dbInstance: IDBDatabase | null = null;

async function getIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return null;
  }
  if (dbInstance) return dbInstance;

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          const store = db.createObjectStore(IDB_STORE, { keyPath: "key" });
          store.createIndex("reciterId", "reciterId", { unique: false });
          store.createIndex("reciter_surah", ["reciterId", "surah"], { unique: false });
        }
      };
      request.onsuccess = (e) => {
        dbInstance = (e.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };
      request.onerror = (err) => {
        console.warn("[AudioOfflineCache] IndexedDB open error:", err);
        resolve(null);
      };
    } catch (err) {
      console.warn("[AudioOfflineCache] IndexedDB error:", err);
      resolve(null);
    }
  });
}

export function parseAudioUrlKey(urlOrKey: string): { reciterId: string; surah: number; ayah: number; filename: string; key: string } | null {
  try {
    // Examples:
    // /api/everyayah/Alafasy_128kbps/001001.mp3
    // https://everyayah.com/data/Alafasy_128kbps/001001.mp3
    // Alafasy_128kbps/001001.mp3
    let clean = urlOrKey.split("?")[0].split("#")[0];
    if (clean.startsWith("/api/everyayah/")) {
      clean = clean.replace(/^\/api\/everyayah\/?/, "");
    } else if (clean.includes("everyayah.com/data/")) {
      clean = clean.split("everyayah.com/data/")[1];
    } else if (clean.includes("mirrors.quranicaudio.com/everyayah/")) {
      clean = clean.split("mirrors.quranicaudio.com/everyayah/")[1];
    }

    const parts = clean.split("/");
    if (parts.length >= 2) {
      const reciterId = parts[0];
      const filename = parts[parts.length - 1];
      const nameMatch = filename.match(/^(\d{3})(\d{3})\.mp3$/i);
      if (nameMatch) {
        const surah = parseInt(nameMatch[1], 10);
        const ayah = parseInt(nameMatch[2], 10);
        return {
          reciterId,
          surah,
          ayah,
          filename,
          key: `${reciterId}/${filename}`
        };
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Check if a specific Ayah is cached offline
 */
export async function isAyahAudioCached(reciterId: string, surah: number, ayah: number): Promise<boolean> {
  const surahStr = String(surah).padStart(3, "0");
  const ayahStr = String(ayah).padStart(3, "0");
  const filename = `${surahStr}${ayahStr}.mp3`;
  const key = `${reciterId}/${filename}`;

  // 1. Check CacheStorage
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const match = await cache.match(`/api/everyayah/${key}`);
      if (match && match.ok) return true;
    } catch (_) {}
  }

  // 2. Check IndexedDB
  try {
    const db = await getIndexedDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(key);
        req.onsuccess = () => {
          resolve(!!req.result && !!req.result.data);
        };
        req.onerror = () => resolve(false);
      });
    }
  } catch (_) {}

  return false;
}

/**
 * Retrieve cached ArrayBuffer for audio playback
 */
export async function getCachedAudioArrayBuffer(urlOrKey: string): Promise<ArrayBuffer | null> {
  const parsed = parseAudioUrlKey(urlOrKey);
  const key = parsed ? parsed.key : urlOrKey;

  // 1. Try CacheStorage
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const candidates = [
        `/api/everyayah/${key}`,
        `https://everyayah.com/data/${key}`,
        `https://mirrors.quranicaudio.com/everyayah/${key}`,
        urlOrKey
      ];
      for (const cand of candidates) {
        const match = await cache.match(cand);
        if (match && match.ok) {
          const buf = await match.arrayBuffer();
          if (buf && buf.byteLength > 1000) {
            return buf;
          }
        }
      }
    } catch (e) {
      console.warn("[AudioOfflineCache] CacheStorage match failed:", e);
    }
  }

  // 2. Try IndexedDB
  try {
    const db = await getIndexedDB();
    if (db && key) {
      const record = await new Promise<any>((resolve) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });

      if (record && record.data) {
        if (record.data instanceof ArrayBuffer) {
          return record.data;
        } else if (record.data instanceof Blob) {
          return await record.data.arrayBuffer();
        }
      }
    }
  } catch (e) {
    console.warn("[AudioOfflineCache] IndexedDB match failed:", e);
  }

  return null;
}

/**
 * Save audio ArrayBuffer to both CacheStorage and IndexedDB
 */
export async function saveAudioToOfflineCache(
  reciterId: string,
  surah: number,
  ayah: number,
  buffer: ArrayBuffer
): Promise<void> {
  const surahStr = String(surah).padStart(3, "0");
  const ayahStr = String(ayah).padStart(3, "0");
  const filename = `${surahStr}${ayahStr}.mp3`;
  const key = `${reciterId}/${filename}`;

  // 1. CacheStorage API
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const blob = new Blob([buffer], { type: "audio/mpeg" });
      const candidates = [
        `/api/everyayah/${key}`,
        `https://everyayah.com/data/${key}`,
        `https://mirrors.quranicaudio.com/everyayah/${key}`,
      ];
      for (const uri of candidates) {
        const resp = new Response(blob, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": String(buffer.byteLength),
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
        await cache.put(uri, resp);
      }
    } catch (e) {
      console.warn("[AudioOfflineCache] CacheStorage save failed:", e);
    }
  }

  // 2. IndexedDB
  try {
    const db = await getIndexedDB();
    if (db) {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.put({
        key,
        reciterId,
        surah,
        ayah,
        data: buffer,
        size: buffer.byteLength,
        savedAt: Date.now()
      });
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }
  } catch (e) {
    console.warn("[AudioOfflineCache] IndexedDB save failed:", e);
  }
}

/**
 * Helper to download a single Ayah audio file from reliable network sources
 */
export async function downloadSingleAyah(
  reciterId: string,
  surah: number,
  ayah: number,
  signal?: AbortSignal
): Promise<{ success: boolean; bytes: number; error?: string }> {
  // Check if already in cache
  const cached = await isAyahAudioCached(reciterId, surah, ayah);
  if (cached) {
    return { success: true, bytes: 0 };
  }

  const surahStr = String(surah).padStart(3, "0");
  const ayahStr = String(ayah).padStart(3, "0");
  const filename = `${surahStr}${ayahStr}.mp3`;

  const candidateUrls = [
    `/api/everyayah/${reciterId}/${filename}`,
    `https://everyayah.com/data/${reciterId}/${filename}`,
    `https://mirrors.quranicaudio.com/everyayah/${reciterId}/${filename}`,
  ];

  let buffer: ArrayBuffer | null = null;
  let lastErr: any = null;

  for (const url of candidateUrls) {
    if (signal?.aborted) {
      return { success: false, bytes: 0, error: "تم إيقاف التنزيل" };
    }
    try {
      const resp = await fetch(url, { signal });
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        if (buf && buf.byteLength > 1000) {
          buffer = buf;
          break;
        }
      }
    } catch (err: any) {
      lastErr = err;
      if (err?.name === "AbortError") {
        return { success: false, bytes: 0, error: "تم إيقاف التنزيل" };
      }
    }
  }

  if (!buffer) {
    return {
      success: false,
      bytes: 0,
      error: lastErr?.message || "تعذر تحميل ملف التلاوة من الخادم"
    };
  }

  await saveAudioToOfflineCache(reciterId, surah, ayah, buffer);
  return { success: true, bytes: buffer.byteLength };
}

/**
 * Get count of cached ayahs for a given surah & reciter
 */
export async function getSurahOfflineStatus(
  reciterId: string,
  surah: number,
  totalAyahs: number
): Promise<{ cachedCount: number; isComplete: boolean; percent: number }> {
  let count = 0;

  // Optimized lookup in IndexedDB
  try {
    const db = await getIndexedDB();
    if (db) {
      const keys = await new Promise<string[]>((resolve) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const index = store.index("reciter_surah");
        const req = index.getAllKeys(IDBKeyRange.only([reciterId, surah]));
        req.onsuccess = () => resolve((req.result as string[]) || []);
        req.onerror = () => resolve([]);
      });
      if (keys.length > 0) {
        count = keys.length;
      }
    }
  } catch (_) {}

  // Fallback to individual check if IndexedDB index is unavailable
  if (count === 0 && totalAyahs <= 30) {
    for (let a = 1; a <= totalAyahs; a++) {
      const cached = await isAyahAudioCached(reciterId, surah, a);
      if (cached) count++;
    }
  }

  const isComplete = count >= totalAyahs && totalAyahs > 0;
  const percent = totalAyahs > 0 ? Math.min(100, Math.round((count / totalAyahs) * 100)) : 0;
  return { cachedCount: count, isComplete, percent };
}

/**
 * Download an entire surah with concurrency control and real-time progress callbacks
 */
export async function downloadSurahOffline(
  reciterId: string,
  surah: number,
  totalAyahs: number,
  signal?: AbortSignal,
  onProgress?: (info: {
    completedAyahs: number;
    totalAyahs: number;
    currentAyah: number;
    percent: number;
    speedMBps: string;
    bytesDownloaded: number;
  }) => void
): Promise<{ success: boolean; completedAyahs: number; totalBytes: number; error?: string }> {
  let completed = 0;
  let totalBytes = 0;
  const startTime = Date.now();

  // Find remaining ayahs to download
  const ayahsToFetch: number[] = [];
  for (let a = 1; a <= totalAyahs; a++) {
    const cached = await isAyahAudioCached(reciterId, surah, a);
    if (cached) {
      completed++;
    } else {
      ayahsToFetch.push(a);
    }
  }

  // Initial progress notification
  if (onProgress) {
    onProgress({
      completedAyahs: completed,
      totalAyahs,
      currentAyah: ayahsToFetch[0] || 1,
      percent: Math.round((completed / totalAyahs) * 100),
      speedMBps: "0.0",
      bytesDownloaded: 0
    });
  }

  if (ayahsToFetch.length === 0) {
    return { success: true, completedAyahs: totalAyahs, totalBytes: 0 };
  }

  // Concurrent worker queue (concurrency = 3)
  const CONCURRENCY = 3;
  let index = 0;
  let hasError: string | undefined;

  async function worker() {
    while (index < ayahsToFetch.length && !signal?.aborted && !hasError) {
      const currentAyah = ayahsToFetch[index++];
      const result = await downloadSingleAyah(reciterId, surah, currentAyah, signal);
      if (result.success) {
        completed++;
        totalBytes += result.bytes;
        
        const elapsedSec = (Date.now() - startTime) / 1000;
        const speed = elapsedSec > 0 ? (totalBytes / (1024 * 1024)) / elapsedSec : 0;
        const speedMBps = speed.toFixed(1);

        if (onProgress) {
          onProgress({
            completedAyahs: completed,
            totalAyahs,
            currentAyah,
            percent: Math.round((completed / totalAyahs) * 100),
            speedMBps,
            bytesDownloaded: totalBytes
          });
        }
      } else {
        hasError = result.error || `تعذر تنزيل الآية رقم ${currentAyah}`;
        break;
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, ayahsToFetch.length) }, () => worker());
  await Promise.all(workers);

  if (signal?.aborted) {
    return { success: false, completedAyahs: completed, totalBytes, error: "تم إلغاء التنزيل بناءً على طلبك" };
  }

  if (hasError) {
    return { success: false, completedAyahs: completed, totalBytes, error: hasError };
  }

  return { success: true, completedAyahs: completed, totalBytes };
}

/**
 * Delete cached audio files for a surah to free up space
 */
export async function removeSurahOfflineAudio(reciterId: string, surah: number, totalAyahs: number): Promise<void> {
  const surahStr = String(surah).padStart(3, "0");

  // 1. CacheStorage
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      for (let a = 1; a <= totalAyahs; a++) {
        const ayahStr = String(a).padStart(3, "0");
        const key = `${reciterId}/${surahStr}${ayahStr}.mp3`;
        await cache.delete(`/api/everyayah/${key}`);
        await cache.delete(`https://everyayah.com/data/${key}`);
        await cache.delete(`https://mirrors.quranicaudio.com/everyayah/${key}`);
      }
    } catch (_) {}
  }

  // 2. IndexedDB
  try {
    const db = await getIndexedDB();
    if (db) {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      for (let a = 1; a <= totalAyahs; a++) {
        const ayahStr = String(a).padStart(3, "0");
        const key = `${reciterId}/${surahStr}${ayahStr}.mp3`;
        store.delete(key);
      }
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }
  } catch (_) {}
}
