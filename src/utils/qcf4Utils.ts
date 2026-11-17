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
const fontDataUrlCache = new Map<string, string>();
const inFlightFontLoads = new Map<string, Promise<void>>();

function isValidFontBuffer(buffer: ArrayBuffer | null | undefined): buffer is ArrayBuffer {
  if (!buffer || buffer.byteLength < 512) return false;
  const bytes = new Uint8Array(buffer, 0, 4);
  const isWoff2 = bytes[0] === 0x77 && bytes[1] === 0x4f && bytes[2] === 0x46 && bytes[3] === 0x32; // wOF2
  const isWoff = bytes[0] === 0x77 && bytes[1] === 0x4f && bytes[2] === 0x46 && bytes[3] === 0x46; // wOFF
  const isOtf = bytes[0] === 0x4f && bytes[1] === 0x54 && bytes[2] === 0x54 && bytes[3] === 0x4f; // OTTO
  const isTtf = bytes[0] === 0x00 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00;
  const isTrue = bytes[0] === 0x74 && bytes[1] === 0x72 && bytes[2] === 0x75 && bytes[3] === 0x65; // true
  return isWoff2 || isWoff || isOtf || isTtf || isTrue;
}

function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType = "font/woff2"): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

function getQcf4FontUrls(fontName: string) {
  const fileName =
    fontName === "QCF4_QBSML" || fontName.endsWith("_W")
      ? `${fontName}.woff2`
      : `${fontName}_W.woff2`;
  return {
    fileName,
    primaryUrl: `/api/qcf4/font/${fontName}`,
    staticLocalUrl: `/fonts/${fileName}`,
    cdnUrl: `https://cdn.jsdelivr.net/gh/MohamadHajjRabee/quran-qcf4@main/fonts-woff2/${fileName}`,
  };
}

async function fetchValidFontBuffer(fontName: string): Promise<ArrayBuffer | null> {
  const { primaryUrl, staticLocalUrl, cdnUrl } = getQcf4FontUrls(fontName);
  const isBundledStatic = fontName === "QCF4_QBSML" || fontName === "QCF4_Hafs_01" || fontName === "QCF4_Hafs_01_W";
  const candidates = isBundledStatic
    ? [staticLocalUrl, primaryUrl, cdnUrl]
    : [primaryUrl, cdnUrl, staticLocalUrl];

  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      if (contentType.includes("text/html") || contentType.includes("application/json")) {
        continue;
      }
      const buf = await res.arrayBuffer();
      if (isValidFontBuffer(buf)) {
        return buf;
      }
    } catch {
      // Try next URL candidate
    }
  }
  return null;
}

/**
 * Dynamically loads a QCF4 font into document.fonts with IndexedDB offline persistence
 */
export async function loadQcf4Font(fontName: string): Promise<void> {
  if (!fontName || typeof window === "undefined") return;
  if (loadedFonts.has(fontName)) return;

  const existingPromise = inFlightFontLoads.get(fontName);
  if (existingPromise) return existingPromise;

  const loadPromise = (async () => {
    try {
      // 1. Check local IndexedDB offline storage first (must pass binary header validation)
      const cachedBuffer = await getCachedFontBuffer(fontName);
      if (isValidFontBuffer(cachedBuffer)) {
        try {
          if (!fontDataUrlCache.has(fontName)) {
            fontDataUrlCache.set(fontName, arrayBufferToDataUrl(cachedBuffer));
          }
          const ff = new FontFace(fontName, cachedBuffer);
          await ff.load();
          document.fonts.add(ff);
          loadedFonts.add(fontName);
          return;
        } catch (e) {
          console.warn(`[QCF4] Failed to load cached font ${fontName}, fetching fresh:`, e);
        }
      }

      // 2. Fetch verified binary from API / static local / CDN
      const arrayBuf = await fetchValidFontBuffer(fontName);
      if (arrayBuf) {
        if (!fontDataUrlCache.has(fontName)) {
          fontDataUrlCache.set(fontName, arrayBufferToDataUrl(arrayBuf));
        }
        const ff = new FontFace(fontName, arrayBuf);
        await ff.load();
        document.fonts.add(ff);
        loadedFonts.add(fontName);
        saveFontBuffer(fontName, arrayBuf);
        return;
      }

      // 3. Fallback to CSS url FontFace via CDN
      const { cdnUrl } = getQcf4FontUrls(fontName);
      try {
        const ffFallback = new FontFace(fontName, `url(${cdnUrl})`);
        await ffFallback.load();
        document.fonts.add(ffFallback);
        loadedFonts.add(fontName);
      } catch (cdnErr) {
        console.error(`[QCF4] Failed to load font ${fontName}:`, cdnErr);
      }
    } finally {
      inFlightFontLoads.delete(fontName);
    }
  })();

  inFlightFontLoads.set(fontName, loadPromise);
  return loadPromise;
}

/**
 * Builds embedded base64 @font-face CSS rules for a list of QCF4 font names so SVG/DOM image capture
 * renders QCF4 glyphs identically on both web and Android WebView (even offline).
 */
export async function getQcf4FontEmbedCss(fontNames: string[]): Promise<string> {
  if (typeof window === "undefined") return "";
  const uniqueNames = Array.from(new Set(fontNames.map((n) => (n || "").trim()).filter(Boolean)));
  if (uniqueNames.length === 0) return "";

  const rules = await Promise.all(
    uniqueNames.map(async (fontName) => {
      try {
        let dataUrl = fontDataUrlCache.get(fontName);
        if (!dataUrl) {
          const cachedBuffer = await getCachedFontBuffer(fontName);
          if (isValidFontBuffer(cachedBuffer)) {
            dataUrl = arrayBufferToDataUrl(cachedBuffer);
            fontDataUrlCache.set(fontName, dataUrl);
          }
        }
        if (!dataUrl) {
          const arrayBuf = await fetchValidFontBuffer(fontName);
          if (arrayBuf) {
            dataUrl = arrayBufferToDataUrl(arrayBuf);
            fontDataUrlCache.set(fontName, dataUrl);
            saveFontBuffer(fontName, arrayBuf);
          }
        }
        if (!dataUrl) return "";
        return `@font-face { font-family: '${fontName}'; src: url('${dataUrl}') format('woff2'); font-display: swap; }`;
      } catch {
        return "";
      }
    })
  );

  return rules.filter(Boolean).join("\n");
}

/**
 * Ensures the QBSML header font is loaded for Surah/Juz titles
 */
export async function ensureQbsmlLoaded(): Promise<void> {
  return loadQcf4Font("QCF4_QBSML");
}

/**
 * Checks if any specific QCF4 font is actively loaded and ready in document.fonts
 */
export function isQcf4FontLoaded(fontName: string): boolean {
  if (!fontName || typeof window === "undefined") return false;
  if (loadedFonts.has(fontName)) return true;
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      return document.fonts.check(`16px "${fontName}"`);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Checks if the QCF4_QBSML font is actively loaded in document.fonts
 */
export function isQbsmlLoaded(): boolean {
  return isQcf4FontLoaded("QCF4_QBSML");
}

/**
 * Checks if the QCF4_Hafs_01 font is actively loaded in document.fonts
 */
export function isQcfHafs01Loaded(): boolean {
  if (typeof window === "undefined") return false;
  if (loadedFonts.has("QCF4_Hafs_01")) return true;
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      return document.fonts.check("16px QCF4_Hafs_01");
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Returns the authentic Medina Mushaf text/glyph for Bismillah in QCF4 font (\uF8DD),
 * or falls back to the standard Arabic text if QCF4_Hafs_01 is not loaded.
 */
export function getBismillahGlyph(fallbackText = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"): string {
  if (isQcfHafs01Loaded()) {
    return "\uF8DD";
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

/**
 * QCF4_QBSML PUA word glyphs for Isti'adhah:
 * \uFADB (أَعُوذُ), \uFADC (بِاللَّهِ), \uFADD (مِنَ), \uFADE (الشَّيْطَانِ), \uFADF (الرَّجِيمِ)
 */
export const QCF4_QBSML_ISTIADHAH_GLYPHS = [
  "\uFADB",
  "\uFADC",
  "\uFADD",
  "\uFADE",
  "\uFADF",
] as const;

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
