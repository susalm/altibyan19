/**
 * Background Download & Pre-cache Manager for:
 * 1. صفحات المصحف (Quran SVG Pages)
 * 2. كتب المكتبة (Library Books & Tafsirs)
 * 3. خدمات الآية (Verse Services: Tafsir, I'rab, Sarf, Balagha, Asbab, Gharib, Tadabbur, Mutashabihat)
 */

import { startAutoQuranDownload, getCachedPagesCount } from "./quranPageCache";
import { fetchQuranSvg } from "./quranApi";
import { getOfflineMukhtasarTafsir } from "./mukhtasarBook";
import { getOfflineAysarTafsir } from "./aysarBook";
import { getOfflineEnglishTranslation } from "./englishTranslation";
import { getOfflineGharib } from "./gharibBook";
import { getOfflineAsbab } from "./asbabBook";
import { getOfflineSarf } from "./sarfBook";
import { getOfflineTdabr } from "./tdabrBook";
import { getOfflineMutashabihat } from "./mutashabihatBook";
import { warmupSurahBooks, saveBatchToLibraryCache, isBookOfflineCached, cleanupCorruptTafsirPacks } from "./libraryOfflineEngine";
import { ensureAllFontsOffline } from "./fontOfflineCache";
import mukhtasarFullJson from "../data/mukhtasar_full.json";
import aysarFullJson from "../data/aysar_full.json";
import englishTranslationJson from "../data/english_translation.json";

// Complete list of library books and verse service packages
export const CORE_LIBRARY_BOOK_IDS = [
  // 1. كتب التفسير المعتمدة
  "tafsir_mukhtasar",
  "tafsir_muyassar",
  "tafsir_sadi",
  "tafsir_kathir",
  "tafsir_tabari",
  "tafsir_qurtubi",
  "tafsir_baghawi",

  // 2. ترجمة معاني القرآن المعتمدة
  "translation_hilali_khan",

  // 3. كتب اللغويات والإعراب والصرف والبلاغة
  "suraj_garib_quran",
  "book_irab",
  "book_sarf",
  "book_balagha",

  // 4. كتب علوم القرآن وأحكام القرآن وأسباب النزول
  "ahkam_quran_jassas",
  "ahkam_quran_arabi",
  "muharrar_asbab",
  "asbab_nuzul",

  // 5. كتب التدبر والهدايات واللطائف
  "book_tadabbur",

  // 6. كتب المتشابهات اللفظية والضبط بالتقعيد
  "book_mutashabihat_saghir",

  // 7. كناشات وتقييدات المستخدم
  "user_notes_books",
  "user_notes_ayah",
];

export const SETTINGS_PACKAGE_IDS = [
  "mushaf-core",
  "tafsir-moyassar",
  "tafsir-mukhtasar",
  "tafsir-sadi",
  "tafsir-ibnkathir",
  "tafsir-tabari",
  "tafsir-qurtubi",
  "tafsir-baghawi",
  "sciences-asbab-nuzool",
  "sciences-vocab",
];

let backgroundDownloadsInitialized = false;

/**
 * Initializes background downloading of Quran pages, library books, and verse services
 * Runs asynchronously and politely without blocking the main UI thread.
 */
export function startAppBackgroundDownloads(
  onPageProgress?: (downloaded: number, total: number, isComplete: boolean) => void
): () => void {
  if (backgroundDownloadsInitialized) {
    return () => {};
  }
  backgroundDownloadsInitialized = true;

  // 1. Sync & activate Library Books & Packages in local storage
  try {
    // Sync Settings downloads
    const savedDownloadsRaw = localStorage.getItem("quran_downloads_tebyan");
    let currentDownloads: string[] = [];
    try {
      if (savedDownloadsRaw) currentDownloads = JSON.parse(savedDownloadsRaw);
    } catch {}

    const mergedDownloads = Array.from(new Set([
      ...currentDownloads,
      ...SETTINGS_PACKAGE_IDS,
      ...CORE_LIBRARY_BOOK_IDS,
    ]));
    localStorage.setItem("quran_downloads_tebyan", JSON.stringify(mergedDownloads));

    // Sync Storage Manager items
    const rawStorage = localStorage.getItem("tebyan_storage_manager_items_v3");
    let storageItems: any[] = [];
    try {
      if (rawStorage) storageItems = JSON.parse(rawStorage);
    } catch {}

    if (!Array.isArray(storageItems) || storageItems.length === 0) {
      // Create initial preloaded catalog
      storageItems = CORE_LIBRARY_BOOK_IDS.map((id) => ({
        id,
        isDownloaded: true,
        downloadProgress: 100,
      }));
    } else {
      // Ensure all core items are marked downloaded
      storageItems = storageItems.map((item) => {
        if (CORE_LIBRARY_BOOK_IDS.includes(item.id) || SETTINGS_PACKAGE_IDS.includes(item.id)) {
          return { ...item, isDownloaded: true, downloadProgress: 100 };
        }
        return item;
      });
      // Add any missing core items
      for (const id of CORE_LIBRARY_BOOK_IDS) {
        if (!storageItems.some((item) => item.id === id)) {
          storageItems.push({
            id,
            isDownloaded: true,
            downloadProgress: 100,
          });
        }
      }
    }
    localStorage.setItem("tebyan_storage_manager_items_v3", JSON.stringify(storageItems));
  } catch (err) {
    console.warn("Storage sync during background download init:", err);
  }

  // 2. Warm up Verse Services engines asynchronously during idle time
  const warmupServices = () => {
    try {
      // Fast touch to populate in-memory maps
      getOfflineMukhtasarTafsir(1, 1);
      getOfflineAysarTafsir(1, 1);
      getOfflineEnglishTranslation(1, 1);
      getOfflineGharib(1, 1, "الفاتحة", "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ");
      getOfflineAsbab(1, 1, "الفاتحة", "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ");
      getOfflineSarf(1, 1, "الفاتحة", "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "sarf", false);
      getOfflineTdabr(1, 1, "الفاتحة", "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", undefined, false);
      getOfflineMutashabihat(1, 1, "الفاتحة", "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ");
      warmupSurahBooks(1);
      ensureAllFontsOffline().catch(() => {});
    } catch (e) {
      console.warn("Services warmup:", e);
    }
  };

  if (typeof window !== "undefined") {
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(warmupServices, { timeout: 2000 });
    } else {
      setTimeout(warmupServices, 300);
    }
  }

  // 3. Start Quran pages download FIRST, then seamlessly chain Tafsir books download AFTERWARDS
  let stopQuranDownload: (() => void) | null = null;
  let stopTafsirDownload: (() => void) | null = null;
  let hasTriggeredTafsir = false;

  const triggerTafsirDownload = () => {
    if (hasTriggeredTafsir) return;
    hasTriggeredTafsir = true;
    console.log("[BackgroundDownload] Quran pages completed. Launching Tafsir books download to user device...");
    // Polite 1.5s pause after pages finish before starting book downloads
    setTimeout(() => {
      stopTafsirDownload = startAutoTafsirBooksDownload();
    }, 1500);
  };

  const timer = setTimeout(async () => {
    try {
      const TOTAL_PAGES = 604;
      const currentPages = await getCachedPagesCount("quran-svg");
      
      // If Quran pages are ALREADY fully downloaded from a prior session, start Tafsir books immediately!
      if (currentPages >= TOTAL_PAGES) {
        if (onPageProgress) onPageProgress(currentPages, TOTAL_PAGES, true);
        triggerTafsirDownload();
      } else {
        // Otherwise start Quran pages download, and once finished, start Tafsir books
        stopQuranDownload = startAutoQuranDownload("quran-svg", fetchQuranSvg, (downloaded, total, isComplete) => {
          if (onPageProgress) onPageProgress(downloaded, total, isComplete);
          if (isComplete) {
            triggerTafsirDownload();
          }
        });
      }
    } catch (err) {
      console.warn("Background download orchestrator error:", err);
      // Fallback: still attempt Tafsir download
      triggerTafsirDownload();
    }
  }, 2500);

  return () => {
    clearTimeout(timer);
    if (stopQuranDownload) stopQuranDownload();
    if (stopTafsirDownload) stopTafsirDownload();
    backgroundDownloadsInitialized = false;
  };
}

export interface TafsirBookItemToDownload {
  id: string;
  title: string;
  edition: string;
  isLocal: boolean;
}

export const TAFSIR_OFFLINE_PACKS: TafsirBookItemToDownload[] = [
  // 1. Local bundled comprehensive Tafsirs & Translations
  { id: "tafsir_mukhtasar", title: "المختصر في تفسير القرآن الكريم", edition: "mukhtasar_local", isLocal: true },
  { id: "tafsir_aysar", title: "أيسر التفاسير لكلام العلي الكبير (الجزائري)", edition: "aysar_local", isLocal: true },
  { id: "translation_hilali_khan", title: "ترجمة محمد تقي الدين الهلالي ومحسن خان", edition: "english_local", isLocal: true },
  
  // 2. Authoritative full-Quran Tafsirs
  { id: "tafsir_muyassar", title: "التفسير الميسر (مجمع الملك فهد)", edition: "ar.muyassar", isLocal: false },
  { id: "tafsir_sadi", title: "تيسير الكريم الرحمن (تفسير السعدي)", edition: "ar.saadi", isLocal: false },
  { id: "tafsir_baghawi", title: "معالم التنزيل (تفسير البغوي)", edition: "ar.baghawi", isLocal: false },
  { id: "tafsir_kathir", title: "تفسير القرآن العظيم (ابن كثير)", edition: "ar.ibnkathir", isLocal: false },
  { id: "tafsir_qurtubi", title: "الجامع لأحكام القرآن (القرطبي)", edition: "ar.qurtubi", isLocal: false },
  { id: "tafsir_waseet", title: "التفسير الوسيط (طنطاوي)", edition: "ar.waseet", isLocal: false },
  { id: "tafsir_jalalayn", title: "تفسير الجلالين", edition: "ar.jalalayn", isLocal: false },
  { id: "translation_clear_quran", title: "ترجمة The Clear Quran (مصطفى خطّاب)", edition: "en.itani", isLocal: false },
  { id: "translation_sahih_intl", title: "ترجمة صحيح إنترناشونال", edition: "en.sahih", isLocal: false },
];

/**
 * Downloads and saves a specific book to IndexedDB on the device
 */
export async function downloadTafsirBookToDevice(
  book: TafsirBookItemToDownload,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    // 1. Check if already stored in IndexedDB
    const alreadyCached = await isBookOfflineCached(book.id);
    if (alreadyCached) {
      return true;
    }

    // 2. Handle local bundled JSON books
    if (book.isLocal) {
      let dict: Record<string, string> = {};
      if (book.id === "tafsir_mukhtasar") {
        dict = mukhtasarFullJson as Record<string, string>;
      } else if (book.id === "tafsir_aysar") {
        dict = aysarFullJson as Record<string, string>;
      } else if (book.id === "translation_hilali_khan" || book.id === "translation_mukhtasar_en") {
        dict = englishTranslationJson as Record<string, string>;
      }

      const entries = Object.entries(dict);
      if (entries.length > 0) {
        const batch = entries.map(([key, text]) => ({
          key: `${key}:${book.id}`,
          content: text,
        }));
        await saveBatchToLibraryCache(batch);

        if (book.id === "translation_hilali_khan" || book.id === "translation_mukhtasar_en") {
          // Also alias for 'english' key
          const englishAliasBatch = entries.map(([key, text]) => ({
            key: `${key}:english`,
            content: text,
          }));
          await saveBatchToLibraryCache(englishAliasBatch);
        }

        if (typeof localStorage !== "undefined") {
          localStorage.setItem(`tibyan_book_downloaded_${book.id}`, "true");
        }
        return true;
      }
    }

    // 3. Handle remote server book pack endpoint
    const url = `/api/tafsir/book-pack/${book.edition}`;
    const res = await fetch(url, { signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${book.id}: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json && json.data && typeof json.data === "object") {
      const entries = Object.entries(json.data as Record<string, string>);
      if (entries.length > 0) {
        const batch = entries.map(([key, text]) => ({
          key: `${key}:${book.id}`,
          content: text,
        }));
        await saveBatchToLibraryCache(batch);

        if (typeof localStorage !== "undefined") {
          localStorage.setItem(`tibyan_book_downloaded_${book.id}`, "true");
        }
        return true;
      }
    }

    return false;
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log(`[TafsirDownload] Cancelled for ${book.id}`);
    } else {
      console.warn(`[TafsirDownload] Error downloading ${book.id}:`, err);
    }
    return false;
  }
}

/**
 * Automatically downloads all Tafsir books sequentially to device storage
 */
export function startAutoTafsirBooksDownload(
  onProgress?: (downloaded: number, total: number, currentTitle: string, isComplete: boolean) => void
): () => void {
  const abortController = new AbortController();
  let isCancelled = false;

  (async () => {
    // Purge any corrupted tafsir entries (like pure ayah text)
    try {
      await cleanupCorruptTafsirPacks();
    } catch (_) {}

    console.log("[TafsirDownload] Starting sequential download of Tafsir library to device IndexedDB...");
    const total = TAFSIR_OFFLINE_PACKS.length;
    let downloaded = 0;

    if (onProgress) {
      onProgress(downloaded, total, "بدء تحميل كتب التفسير...", false);
    }

    for (let i = 0; i < total; i++) {
      if (isCancelled || abortController.signal.aborted) break;

      const book = TAFSIR_OFFLINE_PACKS[i];
      if (onProgress) {
        onProgress(downloaded, total, book.title, false);
      }

      const success = await downloadTafsirBookToDevice(book, abortController.signal);
      if (success) {
        downloaded++;
        // Sync with storage manager items in localStorage
        try {
          if (typeof localStorage !== "undefined") {
            const rawStorage = localStorage.getItem("tebyan_storage_manager_items_v3");
            const storageItems = rawStorage ? JSON.parse(rawStorage) : [];
            const existingIdx = storageItems.findIndex((it: any) => it.id === book.id);
            if (existingIdx >= 0) {
              storageItems[existingIdx].isDownloaded = true;
              storageItems[existingIdx].downloadProgress = 100;
            } else {
              storageItems.push({
                id: book.id,
                isDownloaded: true,
                downloadProgress: 100,
              });
            }
            localStorage.setItem("tebyan_storage_manager_items_v3", JSON.stringify(storageItems));
            window.dispatchEvent(new CustomEvent("tebyan_storage_updated"));
          }
        } catch (_) {}
      }

      if (onProgress) {
        onProgress(downloaded, total, book.title, i === total - 1);
      }

      // Small delay between downloads to ensure smooth UI responsiveness
      await new Promise((r) => setTimeout(r, 400));
    }

    console.log(`[TafsirDownload] Completed! Successfully processed ${downloaded}/${total} Tafsir books.`);
    if (onProgress) {
      onProgress(downloaded, total, "تم اكتمال تحميل كتب التفسير بنجاح", true);
    }
  })();

  return () => {
    isCancelled = true;
    abortController.abort();
  };
}
