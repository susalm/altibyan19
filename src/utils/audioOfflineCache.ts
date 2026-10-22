/**
 * Offline Audio Cache for Quran Recitations
 * Stores fetched ayah MP3 ArrayBuffers in IndexedDB / CacheStorage for seamless offline playback
 */

const AUDIO_CACHE_NAME = 'mushaf_altibyan_audio_cache_v1';
const AUDIO_DB_NAME = 'mushaf_altibyan_audio_db_v1';
const AUDIO_STORE_NAME = 'ayah_audio_buffers';

function openAudioDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(AUDIO_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
          db.createObjectStore(AUDIO_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function parseAudioUrlKey(url: string): string {
  try {
    const u = new URL(url, "https://cdn.islamic.network");
    return u.pathname;
  } catch {
    return url.replace(/^https?:\/\/[^/]+/, "");
  }
}

export async function getCachedAudioArrayBuffer(urlOrKey: string): Promise<ArrayBuffer | null> {
  const key = parseAudioUrlKey(urlOrKey);
  const db = await openAudioDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(AUDIO_STORE_NAME, "readonly");
      const store = tx.objectStore(AUDIO_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveAudioToOfflineCache(urlOrKey: string, buffer: ArrayBuffer): Promise<void> {
  if (!buffer || buffer.byteLength === 0) return;
  const key = parseAudioUrlKey(urlOrKey);
  const db = await openAudioDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(AUDIO_STORE_NAME, "readwrite");
      const store = tx.objectStore(AUDIO_STORE_NAME);
      store.put(buffer, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function isAyahAudioCached(reciterId: string, surah: number, ayah: number): Promise<boolean> {
  const key = `/audio/${reciterId}/${surah}_${ayah}.mp3`;
  const buf = await getCachedAudioArrayBuffer(key);
  return !!buf;
}

export interface DownloadProgressInfo {
  percent: number;
  currentAyah: number;
  totalAyahs: number;
  completedAyahs: number;
  bytesDownloaded: number;
  speedMBps: string;
}

export async function downloadSingleAyah(
  reciterId: string,
  surah: number,
  ayah: number,
  signal?: AbortSignal
): Promise<{ success: boolean; bytes?: number; error?: string }> {
  const key = `/audio/${reciterId}/${surah}_${ayah}.mp3`;
  try {
    const res = await fetch(`https://cdn.islamic.network/quran/audio/128/${reciterId}/${surah}${String(ayah).padStart(3, '0')}.mp3`, { signal });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      await saveAudioToOfflineCache(key, buf);
      return { success: true, bytes: buf.byteLength };
    }
    return { success: false, error: `HTTP ${res.status}` };
  } catch (e: any) {
    if (e?.name === "AbortError") return { success: false, error: "تم إلغاء التحميل" };
    return { success: false, error: e?.message || "فشل التحميل" };
  }
}

export async function downloadSurahOffline(
  reciterId: string,
  surah: number,
  totalAyahs: number,
  signal?: AbortSignal,
  onProgress?: (info: DownloadProgressInfo) => void
): Promise<{ success: boolean; error?: string }> {
  let successCount = 0;
  let totalBytes = 0;
  const startTime = Date.now();

  for (let a = 1; a <= totalAyahs; a++) {
    if (signal?.aborted) return { success: false, error: "تم إلغاء التحميل" };
    const res = await downloadSingleAyah(reciterId, surah, a, signal);
    if (res.success) {
      successCount++;
      totalBytes += res.bytes || 120000;
    }
    const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
    const speed = ((totalBytes / (1024 * 1024)) / elapsedSec).toFixed(1);
    onProgress?.({
      percent: Math.round((a / totalAyahs) * 100),
      currentAyah: a,
      totalAyahs,
      completedAyahs: successCount,
      bytesDownloaded: totalBytes,
      speedMBps: speed,
    });
    await new Promise((r) => setTimeout(r, 40));
  }
  return { success: successCount > 0, error: successCount === 0 ? "فشل تحميل آيات السورة" : undefined };
}

export async function getSurahOfflineStatus(
  reciterId: string,
  surah: number,
  totalAyahs: number
): Promise<{ isComplete: boolean; cachedCount: number; percent: number }> {
  let count = 0;
  for (let a = 1; a <= totalAyahs; a++) {
    const isCached = await isAyahAudioCached(reciterId, surah, a);
    if (isCached) count++;
  }
  return {
    isComplete: count >= totalAyahs,
    cachedCount: count,
    percent: totalAyahs > 0 ? Math.round((count / totalAyahs) * 100) : 0,
  };
}

export async function removeSurahOfflineAudio(reciterId: string, surah: number, totalAyahs: number = 286): Promise<void> {
  const db = await openAudioDB();
  if (!db) return;

  for (let a = 1; a <= Math.max(totalAyahs, 286); a++) {
    const key = `/audio/${reciterId}/${surah}_${a}.mp3`;
    try {
      const tx = db.transaction(AUDIO_STORE_NAME, "readwrite");
      tx.objectStore(AUDIO_STORE_NAME).delete(key);
    } catch {}
  }
}
