/**
 * Offline font caching and preloader utility.
 * Stores core fonts in IndexedDB and registers them in document.fonts
 * to ensure 100% offline availability without needing an internet connection.
 */

const DB_NAME = "quran_fonts_cache_v1";
const STORE_NAME = "font_binaries";

let dbInstance: Promise<IDBDatabase> | null = null;

function getFontDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbInstance = null;
      reject(req.error);
    };
  });
  return dbInstance;
}

async function getCachedFont(fontKey: string): Promise<ArrayBuffer | null> {
  try {
    const db = await getFontDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(fontKey);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveFont(fontKey: string, buffer: ArrayBuffer): Promise<void> {
  try {
    const db = await getFontDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(buffer, fontKey);
  } catch {
    // ignore
  }
}

export interface FontConfig {
  family: string;
  url: string;
  weight?: string;
  style?: string;
}

const CORE_FONTS: FontConfig[] = [
  { family: "UthmanicHafs", url: "/fonts/uthman-tn1-ver10.woff2", weight: "400" },
  { family: "UthmanicHafs", url: "/fonts/uthman-tn1-b-ver10.woff2", weight: "700" },
  { family: "UthmanTaha", url: "/fonts/uthman-tn1-ver10.woff2", weight: "400" },
  { family: "UthmanTaha", url: "/fonts/uthman-tn1-b-ver10.woff2", weight: "700" },
  { family: "UthmanTaha", url: "/fonts/uthman-taha.woff2" },
  { family: "UthmanTahaNaskh", url: "/fonts/uthman-tn1-ver10.woff2", weight: "400" },
  { family: "UthmanTahaNaskh", url: "/fonts/uthman-tn1-b-ver10.woff2", weight: "700" },
  { family: "QCF4_QBSML", url: "/fonts/QCF4_QBSML.woff2" },
  { family: "QCF4_Hafs_01", url: "/fonts/QCF4_Hafs_01_W.woff2" },
  { family: "Amiri", url: "/fonts/amiri-regular.woff2", weight: "400" },
  { family: "Amiri", url: "/fonts/amiri-bold.woff2", weight: "700" },
  { family: "Cairo", url: "/fonts/cairo-arabic.woff2" },
  { family: "Cairo", url: "/fonts/cairo-variable.woff2" },
  { family: "Noto Naskh Arabic", url: "/fonts/noto-naskh-arabic-regular.woff2", weight: "400" },
  { family: "Noto Naskh Arabic", url: "/fonts/noto-naskh-arabic-bold.woff2", weight: "700" },
  { family: "Scheherazade New", url: "/fonts/scheherazade-new-regular.woff2", weight: "400" },
  { family: "Scheherazade New", url: "/fonts/scheherazade-new-bold.woff2", weight: "700" },
  { family: "Aref Ruqaa", url: "/fonts/aref-ruqaa-regular.ttf", weight: "400" },
  { family: "Aref Ruqaa", url: "/fonts/aref-ruqaa-bold.ttf", weight: "700" },
];

/**
 * Pre-caches and loads core Arabic & Quranic fonts offline into document.fonts
 * Immediately registers existing IndexedDB cached fonts, then fetches any missing fonts.
 */
export async function initOfflineFonts(): Promise<void> {
  if (typeof window === "undefined" || !("fonts" in document)) return;

  // 1. Instant pass: immediately register any fonts that are already stored in IndexedDB
  for (const font of CORE_FONTS) {
    try {
      const cacheKey = `${font.family}_${font.weight || "normal"}_${font.url}`;
      const buffer = await getCachedFont(cacheKey);
      if (buffer && !document.fonts.check(`14px "${font.family}"`)) {
        const fontFace = new FontFace(font.family, buffer, {
          weight: font.weight || "normal",
          style: font.style || "normal",
        });
        await fontFace.load();
        document.fonts.add(fontFace);
      }
    } catch (_) {}
  }

  // 2. Background sync: fetch and save any un-cached fonts
  const syncRemaining = async () => {
    for (const font of CORE_FONTS) {
      try {
        const cacheKey = `${font.family}_${font.weight || "normal"}_${font.url}`;
        let buffer = await getCachedFont(cacheKey);

        if (!buffer) {
          try {
            const res = await fetch(font.url);
            if (res.ok) {
              buffer = await res.arrayBuffer();
              saveFont(cacheKey, buffer);
            }
          } catch {
            // offline fetch fallback
          }
        }

        if (buffer && !document.fonts.check(`14px "${font.family}"`)) {
          const fontFace = new FontFace(font.family, buffer, {
            weight: font.weight || "normal",
            style: font.style || "normal",
          });
          await fontFace.load();
          document.fonts.add(fontFace);
        }
      } catch (e) {
        // quiet fallback
      }
    }
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(() => syncRemaining(), { timeout: 1500 });
  } else {
    setTimeout(syncRemaining, 1000);
  }
}

/**
 * Explicitly forces pre-caching of all core fonts for guaranteed offline usage
 */
export async function ensureAllFontsOffline(onProgress?: (loaded: number, total: number) => void): Promise<boolean> {
  if (typeof window === "undefined") return true;
  let loaded = 0;
  const total = CORE_FONTS.length;

  for (const font of CORE_FONTS) {
    try {
      const cacheKey = `${font.family}_${font.weight || "normal"}_${font.url}`;
      let buffer = await getCachedFont(cacheKey);
      if (!buffer) {
        const res = await fetch(font.url);
        if (res.ok) {
          buffer = await res.arrayBuffer();
          await saveFont(cacheKey, buffer);
        }
      }
      if (buffer && typeof document !== "undefined" && "fonts" in document) {
        if (!document.fonts.check(`14px "${font.family}"`)) {
          const fontFace = new FontFace(font.family, buffer, {
            weight: font.weight || "normal",
            style: font.style || "normal",
          });
          await fontFace.load();
          document.fonts.add(fontFace);
        }
      }
      loaded++;
      if (onProgress) onProgress(loaded, total);
    } catch (_) {
      // Continue with remaining fonts
    }
  }

  return true;
}
