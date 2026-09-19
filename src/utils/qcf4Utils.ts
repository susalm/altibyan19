// Utility functions for handling QCF4 font rendering (MohamadHajjRabee/quran-qcf4)

export interface Qcf4Word {
  id?: number;
  word_number?: number;
  char: string;
  font: string;
  type: "word" | "end" | "surah_header" | "bismillah";
  verse_key?: string;
  text?: string;
}

export interface Qcf4Line {
  line: number;
  type?: string;
  words: Qcf4Word[];
}

export interface Qcf4PageData {
  page: number;
  font: string;
  lines: Qcf4Line[];
}

const DB_NAME = "quran_qcf4_offline_v1";
const FONT_STORE = "fonts";
const PAGE_STORE = "pages";
let dbInstancePromise: Promise<IDBDatabase> | null = null;

function getQcf4DB(): Promise<IDBDatabase> {
  if (dbInstancePromise) return dbInstancePromise;
  dbInstancePromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB unavailable"));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(FONT_STORE)) {
        db.createObjectStore(FONT_STORE);
      }
      if (!db.objectStoreNames.contains(PAGE_STORE)) {
        db.createObjectStore(PAGE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbInstancePromise = null;
      reject(req.error);
    };
  });
  return dbInstancePromise;
}

async function getCachedFontBuffer(fontName: string): Promise<ArrayBuffer | null> {
  try {
    const db = await getQcf4DB();
    return new Promise<ArrayBuffer | null>((res) => {
      const tx = db.transaction(FONT_STORE, "readonly");
      const store = tx.objectStore(FONT_STORE);
      const getReq = store.get(fontName);
      getReq.onsuccess = () => res(getReq.result || null);
      getReq.onerror = () => res(null);
    });
  } catch {
    return null;
  }
}

async function saveFontBuffer(fontName: string, buffer: ArrayBuffer): Promise<void> {
  try {
    const db = await getQcf4DB();
    const tx = db.transaction(FONT_STORE, "readwrite");
    const store = tx.objectStore(FONT_STORE);
    store.put(buffer, fontName);
  } catch {
    // Ignore store error
  }
}

async function getCachedPageData(pageNum: number): Promise<Qcf4PageData | null> {
  try {
    const db = await getQcf4DB();
    return new Promise<Qcf4PageData | null>((res) => {
      const tx = db.transaction(PAGE_STORE, "readonly");
      const store = tx.objectStore(PAGE_STORE);
      const getReq = store.get(pageNum);
      getReq.onsuccess = () => res(getReq.result || null);
      getReq.onerror = () => res(null);
    });
  } catch {
    return null;
  }
}

async function savePageData(pageNum: number, data: Qcf4PageData): Promise<void> {
  try {
    const db = await getQcf4DB();
    const tx = db.transaction(PAGE_STORE, "readwrite");
    const store = tx.objectStore(PAGE_STORE);
    store.put(data, pageNum);
  } catch {
    // Ignore store error
  }
}

const loadedFonts = new Set<string>();

/**
 * Dynamically loads a QCF4 font into document.fonts with IndexedDB offline persistence
 */
export async function loadQcf4Font(fontName: string): Promise<void> {
  if (!fontName || loadedFonts.has(fontName) || typeof window === "undefined") return;

  // 1. Check local IndexedDB offline storage first
  const cachedBuffer = await getCachedFontBuffer(fontName);
  if (cachedBuffer) {
    try {
      const ff = new FontFace(fontName, cachedBuffer);
      await ff.load();
      document.fonts.add(ff);
      loadedFonts.add(fontName);
      return;
    } catch (e) {
      console.warn(`[QCF4] Failed to load cached font ${fontName}, fetching fresh:`, e);
    }
  }

  const fileName = fontName === "QCF4_QBSML" || fontName.endsWith("_W") ? `${fontName}.woff2` : `${fontName}_W.woff2`;
  const primaryUrl = `/api/qcf4/font/${fontName}`;
  const staticLocalUrl = `/fonts/${fileName}`;
  const cdnUrl = `https://cdn.jsdelivr.net/gh/MohamadHajjRabee/quran-qcf4@main/fonts-woff2/${fileName}`;

  try {
    const res = await fetch(staticLocalUrl).catch(() => fetch(primaryUrl)).catch(() => fetch(cdnUrl));
    if (res && res.ok) {
      const arrayBuf = await res.arrayBuffer();
      const ff = new FontFace(fontName, arrayBuf);
      await ff.load();
      document.fonts.add(ff);
      loadedFonts.add(fontName);
      // Save for instant offline access
      saveFontBuffer(fontName, arrayBuf);
      return;
    }
  } catch (err) {
    console.warn(`[QCF4] Font binary fetch failed for ${fontName}, trying url fallback:`, err);
  }

  // Fallback to CSS url FontFace
  try {
    const ffFallback = new FontFace(fontName, `url(${cdnUrl})`);
    await ffFallback.load();
    document.fonts.add(ffFallback);
    loadedFonts.add(fontName);
  } catch (cdnErr) {
    console.error(`[QCF4] Failed to load font ${fontName}:`, cdnErr);
  }
}

/**
 * Ensures the QBSML header font is loaded for Surah/Juz titles
 */
export async function ensureQbsmlLoaded(): Promise<void> {
  return loadQcf4Font("QCF4_QBSML");
}

/**
 * Checks if the QCF4_QBSML font is actively loaded in document.fonts
 */
export function isQbsmlLoaded(): boolean {
  if (typeof window === "undefined") return false;
  if (loadedFonts.has("QCF4_QBSML")) return true;
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      return document.fonts.check("16px QCF4_QBSML");
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Returns the character glyph for Bismillah in QCF4_QBSML font (\uFAD0\uFAD1\uFAD2\uFAD3),
 * or falls back to standard Amiri Arabic text if font is not loaded.
 */
export function getBismillahGlyph(fallbackText = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"): string {
  if (isQbsmlLoaded()) {
    // In LTR PUA rendering, ordering \uFAD3 \uFAD2 \uFAD1 \uFAD0 places \uFAD0 (Bismi) on the right and \uFAD3 (Ar-Rahim) on the left
    return "\uFAD3 \uFAD2 \uFAD1 \uFAD0";
  }
  return fallbackText;
}

/**
 * Returns the character glyph for a Surah title header in QCF4_QBSML font (0xF100 to 0xF171),
 * or falls back to the Surah name in Amiri Arabic font if QCF4_QBSML is not loaded.
 */
export function getSurahHeaderGlyph(surahNumber: number, fallbackName?: string): string {
  if (surahNumber < 1 || surahNumber > 114) return fallbackName || "";
  if (isQbsmlLoaded()) {
    return String.fromCharCode(0xF100 + (surahNumber - 1));
  }
  return fallbackName || `سورة ${surahNumber}`;
}

/**
 * Returns the character glyph for a Juz header ornament in QCF4_QBSML font (0xF1D8 to 0xF1F5),
 * or falls back to the Juz text in Amiri Arabic font if QCF4_QBSML is not loaded.
 */
export function getJuzHeaderGlyph(juzNumber: number, fallbackText?: string): string {
  if (juzNumber < 1 || juzNumber > 30) return fallbackText || "";
  if (isQbsmlLoaded()) {
    return String.fromCharCode(0xF1D8 + (juzNumber - 1));
  }
  return fallbackText || `الجزء ${juzNumber}`;
}

const pageCache = new Map<number, Qcf4PageData>();

/**
 * Fetches page JSON data for pageNum (1-604) with in-memory caching
 */
export async function fetchQcf4Page(pageNum: number, signal?: AbortSignal): Promise<Qcf4PageData> {
  if (pageCache.has(pageNum)) {
    return pageCache.get(pageNum)!;
  }

  // 1. Check offline IndexedDB cache first
  const offlinePage = await getCachedPageData(pageNum);
  if (offlinePage) {
    pageCache.set(pageNum, offlinePage);
    return offlinePage;
  }

  const pagePadded = String(pageNum).padStart(3, "0");
  const primaryUrl = `/api/qcf4/page/${pageNum}`;
  const cdnUrl = `https://cdn.jsdelivr.net/gh/MohamadHajjRabee/quran-qcf4@main/pages/${pagePadded}.json`;

  try {
    const res = await fetch(primaryUrl, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Qcf4PageData = await res.json();
    pageCache.set(pageNum, data);
    savePageData(pageNum, data);
    return data;
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    console.warn(`[QCF4] Primary fetch failed for page ${pageNum}, fetching from CDN...`);
    try {
      const cdnRes = await fetch(cdnUrl, { signal });
      if (!cdnRes.ok) throw new Error(`Failed to fetch QCF4 page ${pageNum}`);
      const data: Qcf4PageData = await cdnRes.json();
      pageCache.set(pageNum, data);
      savePageData(pageNum, data);
      return data;
    } catch (cdnErr: any) {
      if (cdnErr?.name === "AbortError") throw cdnErr;
      // If network fails completely, re-check indexedDB in case saved earlier
      const fallbackData = await getCachedPageData(pageNum);
      if (fallbackData) {
        pageCache.set(pageNum, fallbackData);
        return fallbackData;
      }
      throw cdnErr;
    }
  }
}

/**
 * Fetches all QCF4 words for a specific verse (surah:ayah)
 */
export async function fetchQcf4VerseWords(
  surahNumber: number,
  ayahNumber: number,
  providedPage?: number,
  signal?: AbortSignal
): Promise<{ words: Qcf4Word[]; font: string; page: number }> {
  let page = providedPage;
  const verseKey = `${surahNumber}:${ayahNumber}`;

  if (!page) {
    try {
      const versesIndex = await fetchQcf4VersesIndex();
      if (versesIndex && versesIndex[verseKey]) {
        page = versesIndex[verseKey].page;
      }
    } catch (e) {
      console.warn(`[QCF4] Failed to get page from verses index for ${verseKey}:`, e);
    }
  }

  // Fallback estimation if page still not resolved
  if (!page || page < 1 || page > 604) {
    page = 1; // Default fallback
  }

  const pageData = await fetchQcf4Page(page, signal);
  if (pageData.font) {
    await loadQcf4Font(pageData.font);
  }

  const words: Qcf4Word[] = [];
  pageData.lines.forEach((line) => {
    line.words.forEach((w) => {
      if (w.verse_key === verseKey) {
        words.push(w);
      }
    });
  });

  return { words, font: pageData.font, page };
}


/**
 * Fetches verses index
 */
let versesIndexCache: Record<string, any> | null = null;
export async function fetchQcf4VersesIndex(): Promise<Record<string, any>> {
  if (versesIndexCache) return versesIndexCache;
  try {
    const res = await fetch("/api/qcf4/verses");
    if (!res.ok) throw new Error("HTTP " + res.status);
    versesIndexCache = await res.json();
    return versesIndexCache!;
  } catch {
    const cdnRes = await fetch("https://cdn.jsdelivr.net/gh/MohamadHajjRabee/quran-qcf4@main/verses.json");
    versesIndexCache = await cdnRes.json();
    return versesIndexCache!;
  }
}

/**
 * Prefetch nearby QCF4 pages and their fonts in background
 */
export async function prefetchQcf4Pages(currentPage: number): Promise<void> {
  const nearby = [currentPage + 1, currentPage + 2, currentPage + 3, currentPage - 1]
    .filter((p) => p >= 1 && p <= 604);

  for (const p of nearby) {
    if (pageCache.has(p)) continue;
    try {
      const data = await fetchQcf4Page(p);
      const fontNames = new Set<string>();
      if (data.font) fontNames.add(data.font);
      data.lines?.forEach((line) => {
        line.words?.forEach((w) => {
          if (w.font) fontNames.add(w.font);
        });
      });
      fontNames.forEach((f) => loadQcf4Font(f));
    } catch {
      // Ignore background errors
    }
  }
}
