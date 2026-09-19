/**
 * Quran Content API Client
 * Implementation of the "Quran Content" API collection:
 * - Boot Data: /{{language}}/api/boot-data
 * - Single Language (Translation Books): /{{language}}/api/language/:lang
 * - Languages List: /{{language}}/api/languages
 * - Ayas Of Sura: /{{language}}/api/suras/:sura
 * - Page Data: /{{language}}/api/page/:page
 * - Aya Translation: /{{language}}/api/aya-translation/:aya_id (with translation_book & language)
 * - Translation Books Catalog: /{{language}}/api/aya_translations
 * - Arabic Ayas: /{{language}}/api/arabic_ayas
 */

import { getOfflineEnglishTranslation } from "./englishTranslation";

export const QURAN_CONTENT_DEFAULT_BASE_URL = "https://quran.islamcontent.com";

// Number of verses in each of the 114 Surahs (standard Hafs numbering)
export const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
  123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
  34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
  60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
  28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
  5, 4, 5, 6
];

/**
 * Calculates absolute ayah ID (1 to 6236)
 */
export function getAbsoluteAyahNumber(surahNumber: number, ayahNumberInSurah: number): number {
  if (surahNumber < 1 || surahNumber > 114) return ayahNumberInSurah;
  let count = 0;
  for (let s = 1; s < surahNumber; s++) {
    count += SURAH_AYAH_COUNTS[s - 1] || 0;
  }
  return count + ayahNumberInSurah;
}

export interface ApiLanguage {
  id: number;
  abr: string;
  arabic_name: string;
  english_name: string;
  localized_name: string;
  dir: "ltr" | "rtl";
}

export interface ApiTranslationBook {
  id: number;
  translation_book_id?: number;
  title: string;
  description: string;
  key: string;
  pdf?: string | null;
  pdf_size?: string | null;
  language_abr?: string;
  language_name?: string;
}

export interface AyaTranslationData {
  id: number;
  translated_meaning: string;
  footnotes?: string;
  rawText?: string;
  bookKey: string;
  language: string;
}

// In-memory cache for fast lookups
const memoryTranslationCache = new Map<string, AyaTranslationData>();
let cachedLanguages: ApiLanguage[] | null = null;
let cachedBooksList: ApiTranslationBook[] | null = null;

/**
 * Infer the language ISO code from a translation book key.
 * e.g. "english_rwwad" -> "en", "french_rashid" -> "fr"
 */
export function getLanguageCodeFromBookKey(bookKey: string): string {
  const cleanKey = bookKey.replace(/^translation_/, "").toLowerCase();
  if (cleanKey.startsWith("english") || cleanKey.startsWith("hilali")) return "en";
  if (cleanKey.startsWith("french")) return "fr";
  if (cleanKey.startsWith("spanish")) return "es";
  if (cleanKey.startsWith("german")) return "de";
  if (cleanKey.startsWith("urdu")) return "ur";
  if (cleanKey.startsWith("turkish")) return "tr";
  if (cleanKey.startsWith("indonesian")) return "id";
  if (cleanKey.startsWith("russian")) return "ru";
  if (cleanKey.startsWith("bengali")) return "bn";
  if (cleanKey.startsWith("persian")) return "fa";
  if (cleanKey.startsWith("bosnian")) return "bs";
  if (cleanKey.startsWith("italian")) return "it";
  if (cleanKey.startsWith("portuguese")) return "pt";
  if (cleanKey.startsWith("swahili")) return "sw";
  if (cleanKey.startsWith("somali")) return "so";
  if (cleanKey.startsWith("amharic")) return "am";
  if (cleanKey.startsWith("hausa")) return "ha";
  if (cleanKey.startsWith("yoruba")) return "yo";
  if (cleanKey.startsWith("oromo")) return "om";
  if (cleanKey.startsWith("kurdish")) return "ku";
  if (cleanKey.startsWith("chinese")) return "zh";
  if (cleanKey.startsWith("japanese")) return "ja";
  if (cleanKey.startsWith("korean")) return "ko";
  if (cleanKey.startsWith("dutch")) return "nl";
  if (cleanKey.startsWith("swedish")) return "sv";
  if (cleanKey.startsWith("tagalog")) return "tl";
  if (cleanKey.startsWith("hindi")) return "hi";
  if (cleanKey.startsWith("tamil")) return "ta";
  if (cleanKey.startsWith("telugu")) return "te";
  if (cleanKey.startsWith("malayalam")) return "ml";
  if (cleanKey.startsWith("pashto")) return "ps";
  if (cleanKey.startsWith("uzbek")) return "uz";
  if (cleanKey.startsWith("tajik")) return "tg";
  if (cleanKey.startsWith("uyghur")) return "ug";
  return "en";
}

/**
 * Normalizes book keys from the app's standard representation
 */
export function normalizeTranslationBookKey(bookKey: string): string {
  let key = bookKey;
  if (key.startsWith("translation_")) {
    key = key.replace("translation_", "");
  }
  if (key === "hilali_khan" || key === "english") {
    return "english_hilali_khan";
  }
  if (key === "rwwad") {
    return "english_rwwad";
  }
  if (key === "saheeh") {
    return "english_saheeh";
  }
  return key;
}

/**
 * 1. Boot Data endpoint: GET /{{language}}/api/boot-data
 */
export async function fetchBootData(language = "ar"): Promise<any> {
  try {
    const res = await fetch(`/api/quran-content/${encodeURIComponent(language)}/boot-data`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Direct proxy failed, trying fallback:", err);
  }
  try {
    const res = await fetch(`${QURAN_CONTENT_DEFAULT_BASE_URL}/${encodeURIComponent(language)}/api/boot-data`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

/**
 * 2. Languages List endpoint: GET /{{language}}/api/languages
 */
export async function fetchLanguages(language = "ar"): Promise<ApiLanguage[]> {
  if (cachedLanguages && cachedLanguages.length > 0) {
    return cachedLanguages;
  }
  try {
    const res = await fetch(`/api/quran-content/${encodeURIComponent(language)}/languages`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.languages)) {
        cachedLanguages = data.languages;
        return cachedLanguages;
      }
    }
  } catch {}
  try {
    const res = await fetch(`${QURAN_CONTENT_DEFAULT_BASE_URL}/${encodeURIComponent(language)}/api/languages`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.languages)) {
        cachedLanguages = data.languages;
        return cachedLanguages;
      }
    }
  } catch {}
  return [];
}

/**
 * 3. Single Language Books endpoint: GET /{{language}}/api/language/:lang
 */
export async function fetchSingleLanguage(targetLang = "ar", language = "ar"): Promise<{ language?: ApiLanguage; translation_books?: ApiTranslationBook[] }> {
  try {
    const res = await fetch(`/api/quran-content/${encodeURIComponent(language)}/language/${encodeURIComponent(targetLang)}`);
    if (res.ok) return await res.json();
  } catch {}
  try {
    const res = await fetch(`${QURAN_CONTENT_DEFAULT_BASE_URL}/${encodeURIComponent(language)}/api/language/${encodeURIComponent(targetLang)}`);
    if (res.ok) return await res.json();
  } catch {}
  return { translation_books: [] };
}

/**
 * 4. Ayas Of Sura endpoint: GET /{{language}}/api/suras/:sura
 */
export async function fetchAyasOfSura(suraNumber: number, language = "ar"): Promise<any> {
  try {
    const res = await fetch(`/api/quran-content/${encodeURIComponent(language)}/suras/${suraNumber}`);
    if (res.ok) return await res.json();
  } catch {}
  try {
    const res = await fetch(`${QURAN_CONTENT_DEFAULT_BASE_URL}/${encodeURIComponent(language)}/api/suras/${suraNumber}`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

/**
 * 5. Page Data endpoint: GET /{{language}}/api/page/:page
 */
export async function fetchPageData(pageNumber: number, language = "ar"): Promise<any> {
  try {
    const res = await fetch(`/api/quran-content/${encodeURIComponent(language)}/page/${pageNumber}`);
    if (res.ok) return await res.json();
  } catch {}
  try {
    const res = await fetch(`${QURAN_CONTENT_DEFAULT_BASE_URL}/${encodeURIComponent(language)}/api/page/${pageNumber}`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

/**
 * 6. Aya Translation endpoint: GET /{{language}}/api/aya-translation/:aya_id
 * Body/Query: { translation_book: "english_rwwad", language: "en" }
 */
export async function fetchAyaTranslation(
  ayaId: number,
  translationBook = "english_rwwad",
  language = "en",
  apiLanguage = "ar"
): Promise<AyaTranslationData | null> {
  const normBook = normalizeTranslationBookKey(translationBook);
  const langCode = language || getLanguageCodeFromBookKey(normBook);
  const cacheKey = `${ayaId}:${normBook}:${langCode}`;

  if (memoryTranslationCache.has(cacheKey)) {
    return memoryTranslationCache.get(cacheKey)!;
  }

  // 1. Try server proxy endpoint
  try {
    const query = new URLSearchParams({
      translation_book: normBook,
      language: langCode
    }).toString();

    const res = await fetch(`/api/quran-content/${encodeURIComponent(apiLanguage)}/aya-translation/${ayaId}?${query}`, {
      signal: AbortSignal.timeout(9000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.aya_translation?.translated_meaning) {
        const item: AyaTranslationData = {
          id: data.aya_translation.id || ayaId,
          translated_meaning: data.aya_translation.translated_meaning,
          footnotes: data.aya_translation.footnotes || "",
          bookKey: normBook,
          language: langCode
        };
        memoryTranslationCache.set(cacheKey, item);
        return item;
      }
    }
  } catch (err) {
    // console.warn("Proxy call failed, trying direct API:", err);
  }

  // 2. Direct fallback to Quran Content API
  try {
    const directUrl = `${QURAN_CONTENT_DEFAULT_BASE_URL}/${encodeURIComponent(apiLanguage)}/api/aya-translation/${ayaId}?translation_book=${encodeURIComponent(normBook)}&language=${encodeURIComponent(langCode)}`;
    const res = await fetch(directUrl, { signal: AbortSignal.timeout(9000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.aya_translation?.translated_meaning) {
        const item: AyaTranslationData = {
          id: data.aya_translation.id || ayaId,
          translated_meaning: data.aya_translation.translated_meaning,
          footnotes: data.aya_translation.footnotes || "",
          bookKey: normBook,
          language: langCode
        };
        memoryTranslationCache.set(cacheKey, item);
        return item;
      }
    }
  } catch (err) {
    // console.warn("Direct Quran Content API fetch failed:", err);
  }

  return null;
}

/**
 * 7. Translation Books endpoint: GET /{{language}}/api/aya_translations
 */
export async function fetchTranslationBooks(page = 1, language = "ar"): Promise<any> {
  try {
    const res = await fetch(`/api/quran-content/${encodeURIComponent(language)}/aya_translations?page=${page}`);
    if (res.ok) return await res.json();
  } catch {}
  try {
    const res = await fetch(`${QURAN_CONTENT_DEFAULT_BASE_URL}/${encodeURIComponent(language)}/api/aya_translations?page=${page}`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

/**
 * 8. Arabic Ayas endpoint: GET /{{language}}/api/arabic_ayas
 */
export async function fetchArabicAyas(page = 1, language = "ar"): Promise<any> {
  try {
    const res = await fetch(`/api/quran-content/${encodeURIComponent(language)}/arabic_ayas?page=${page}`);
    if (res.ok) return await res.json();
  } catch {}
  try {
    const res = await fetch(`${QURAN_CONTENT_DEFAULT_BASE_URL}/${encodeURIComponent(language)}/api/arabic_ayas?page=${page}`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

/**
 * High-level translation resolver for any Surah and Ayah in the reader.
 * Returns formatted translation text with footnotes, and falls back to offline bundle.
 */
export async function getAyahTranslationText(
  surahNumber: number,
  ayahNumberInSurah: number,
  bookKey = "english_rwwad",
  languageCode?: string
): Promise<{ text: string; footnotes?: string; isRtl: boolean }> {
  const normBook = normalizeTranslationBookKey(bookKey);
  const lang = languageCode || getLanguageCodeFromBookKey(normBook);
  const isRtl = ["ar", "ur", "fa", "ku", "ps", "ug"].includes(lang);

  const ayaId = getAbsoluteAyahNumber(surahNumber, ayahNumberInSurah);

  // Attempt API lookup
  const apiRes = await fetchAyaTranslation(ayaId, normBook, lang);
  if (apiRes && apiRes.translated_meaning) {
    return {
      text: apiRes.translated_meaning,
      footnotes: apiRes.footnotes,
      isRtl
    };
  }

  // Graceful offline fallback for English translations
  if (lang === "en" || normBook.includes("english") || normBook.includes("hilali")) {
    const offlineEn = getOfflineEnglishTranslation(surahNumber, ayahNumberInSurah);
    if (offlineEn) {
      return {
        text: offlineEn,
        isRtl: false
      };
    }
  }

  return {
    text: "الترجمة قيد التحميل من خادم مصحف التبيان...",
    isRtl: false
  };
}

/**
 * Loads all translation books catalog
 */
export async function getAllAvailableTranslationBooks(): Promise<ApiTranslationBook[]> {
  if (cachedBooksList && cachedBooksList.length > 0) {
    return cachedBooksList;
  }

  try {
    const res = await fetchSingleLanguage("ar", "ar");
    if (res.translation_books && res.translation_books.length > 0) {
      cachedBooksList = res.translation_books;
      return cachedBooksList;
    }
  } catch {}

  // Built-in curated fallback catalog
  return [
    { id: 1, key: "english_rwwad", title: "الترجمة الإنجليزية - مركز رواد الترجمة", description: "ترجمة معتمدة ودقيقة من مركز رواد الترجمة بالتعاون مع مكتب دعوة الروابي" },
    { id: 2, key: "english_saheeh", title: "الترجمة الإنجليزية - صحيح إنترناشونال", description: "ترجمة صحيح إنترناشونال المعتمدة" },
    { id: 3, key: "english_hilali_khan", title: "الترجمة الإنجليزية - تقي الدين الهلالي ومحسن خان", description: "ترجمة مجمع الملك فهد لطباعة المصحف الشريف" },
    { id: 4, key: "french_rashid", title: "الترجمة الفرنسية - رشيد معاش", description: "ترجمة معاني القرآن الكريم إلى الفرنسية" },
    { id: 5, key: "spanish_garcia", title: "الترجمة الإسبانية - عيسى غارسيا", description: "ترجمة معتمدة إلى الإسبانية" },
    { id: 6, key: "german_bubenheim", title: "الترجمة الألمانية - فرانك بوبنهايم", description: "ترجمة معتمدة إلى الألمانية" },
    { id: 7, key: "urdu_junagarhi", title: "الترجمة الأردية - مولانا محمد جوناكارهي", description: "ترجمة معتمدة إلى الأردية" },
    { id: 8, key: "turkish_shaban", title: "الترجمة التركية - شعبان بريش", description: "ترجمة معتمدة إلى التركية" },
    { id: 9, key: "indonesian_affairs", title: "الترجمة الإندونيسية - وزارة الشؤون الدينية", description: "ترجمة إندونيسية رسمية" },
    { id: 10, key: "russian_kuliev", title: "الترجمة الروسية - إلمير كولييف", description: "ترجمة معتمدة إلى الروسية" }
  ];
}
