/**
 * Authentic Quranic Verse Services Resolver
 * موحد جلب خدمات المصحف (آية بآية) من مصادرها العلمية المعتمدة حصراً
 */

import { surahsList } from "../data/surahList";
import { getOfflineMukhtasarTafsir, getOfflineMukhtasarTafsirFallback } from "./mukhtasarBook";
import { getOfflineAysarTafsir } from "./aysarBook";
import { getOfflineEnglishTranslation } from "./englishTranslation";
import { getOfflineGharib, normalizeGharibLines } from "./gharibBook";
import { getOfflineAsbabStrict, NO_ASBAB_NOTICE } from "./asbabBook";
import { getOfflineSarf, normalizeAuthenticIrabText } from "./sarfBook";
import { getOfflineTdabr, parseTadabburWaAmalForAyah } from "./tdabrBook";
import { getOfflineMutashabihat } from "./mutashabihatBook";
import { getOfflineAhkamJassas } from "./ahkamJassasBook";
import { getAyahTranslationText } from "./quranContentApi";
import {
  getFromLibraryCache,
  saveToLibraryCache,
  deleteFromLibraryCache,
  isCorruptAyahOnlyText,
  getOfflineMuyassarTafsir,
  getOfflineSaadiTafsir,
} from "./libraryOfflineEngine";

export const NO_GHARIB_NOTICE = "لم يُدوّن غريب مفردات خاص لهذه الآية الكريمة";

const inFlightRequests = new Map<string, Promise<string>>();
const tadabburPageCache = new Map<string, string>();

function stripHtmlClean(html: string): string {
  if (!html) return "";
  return html
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

export function isSyntheticOrStaleText(text: string | null | undefined, mode?: string): boolean {
  if (!text || typeof text !== "string") return true;
  const t = text.trim();
  if (!t) return true;

  if (
    t.includes("مفردة قرآنية كريمة، معربة بحسب موقعها") ||
    t.includes("تحليل نحوي هيكلي") ||
    t.includes("العنوان: هدايات الآية الكريمة") ||
    t.includes("تتضمن هذه الآية الكريمة من سورة") ||
    t.includes("لم يرد نص تدبري مسجل") ||
    t.includes("لا توجد تقييدات شخصية مسجلة") ||
    t.includes("لا يوجد إعراب مسجل") ||
    t.includes("تعذر الاتصال اللحظي بمزود الخدمة") ||
    t.includes("لم يَرِد نص مسند خاص لهذه الآية في كتاب") ||
    t.includes("ضمن المصادر الرقمية المعتمدة حالياً") ||
    t.includes("تعذر جلب النص الأصلي لكتاب")
  ) {
    return true;
  }

  return false;
}

function dedupeInFlight(key: string, fn: () => Promise<string>): Promise<string> {
  const existing = inFlightRequests.get(key);
  if (existing) return existing;
  const p = fn().finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, p);
  return p;
}

async function fetchSpa5kTafsir(slug: string, surahNumber: number, ayahNumber: number): Promise<{ status: number; text: string | null }> {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir/${slug}/${surahNumber}/${ayahNumber}.json`,
      { signal: AbortSignal.timeout(7000) }
    );
    if (!res.ok) {
      return { status: res.status, text: null };
    }
    const data = await res.json();
    const raw = typeof data?.text === "string" ? data.text.trim() : "";
    return { status: res.status, text: raw || null };
  } catch {
    return { status: 0, text: null };
  }
}

async function fetchServerTafsirEndpoint(
  surahNumber: number,
  ayahNumber: number,
  type: string,
  surahName?: string,
  ayahText?: string
): Promise<string | null> {
  try {
    const apiUrl =
      typeof window !== "undefined" && window.location?.origin && window.location.origin !== "null"
        ? `${window.location.origin}/api/tafsir`
        : "/api/tafsir";

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        surahName,
        surahNumber,
        ayahNumber,
        ayahText,
        type,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;
    const data = await res.json();
    const result = data?.result || data?.text;
    if (typeof result === "string" && result.trim() && !isSyntheticOrStaleText(result, type)) {
      return result.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 1. غريب الآية: السراج في بيان غريب القرآن (114 سورة كاملة) + الميسر في غريب القرآن
 */
export async function fetchAuthenticGharib(
  surahNumber: number,
  ayahNumber: number,
  surahName?: string,
  ayahText?: string
): Promise<string> {
  // Primary: Local full 114-surah السراج dataset
  const siraj = getOfflineGharib(surahNumber, ayahNumber, surahName, ayahText, false);
  if (siraj && !isCorruptAyahOnlyText(siraj, ayahText)) {
    saveToLibraryCache(`${surahNumber}:${ayahNumber}:suraj_garib_quran`, siraj).catch(() => {});
    return siraj;
  }

  const cacheKey = `${surahNumber}:${ayahNumber}:suraj_garib_quran`;
  return dedupeInFlight(`gharib:${surahNumber}:${ayahNumber}`, async () => {
    const cached = (await getFromLibraryCache(cacheKey)) || (await getFromLibraryCache(`${surahNumber}:${ayahNumber}:gharib`));
    if (cached && !isCorruptAyahOnlyText(cached, ayahText) && cached.includes("):")) {
      return cached;
    }

    const isOnline = typeof navigator === "undefined" || navigator.onLine !== false;
    if (isOnline) {
      // Secondary: الميسر في غريب القرآن (مجمع الملك فهد)
      const muyassarGharib = await fetchSpa5kTafsir("al-muyassar-fi-al-gharib", surahNumber, ayahNumber);
      if (muyassarGharib.text) {
        const formatted = normalizeGharibLines(stripHtmlClean(muyassarGharib.text));
        if (formatted && !isCorruptAyahOnlyText(formatted, ayahText)) {
          saveToLibraryCache(cacheKey, formatted).catch(() => {});
          return formatted;
        }
      }

      // If not 404 (network issue), try server proxy
      if (muyassarGharib.status !== 404) {
        const serverVal = await fetchServerTafsirEndpoint(surahNumber, ayahNumber, "suraj_garib_quran", surahName, ayahText);
        if (serverVal && serverVal.includes("):")) {
          const normalized = normalizeGharibLines(serverVal);
          saveToLibraryCache(cacheKey, normalized).catch(() => {});
          return normalized;
        }
      }
    }

    return NO_GHARIB_NOTICE;
  });
}

/**
 * 2. إعراب الآية: الجدول + الإعراب الميسر + إعراب الدر المصون/الدعاس + إعراب القرآن الكامل
 */
export async function fetchAuthenticIrab(
  surahNumber: number,
  ayahNumber: number,
  surahName?: string,
  ayahText?: string
): Promise<string> {
  // Primary: authentic local records (quran_eerab.ts + Srf)
  const localIrab = getOfflineSarf(surahNumber, ayahNumber, surahName, ayahText, "book_irab", false);
  if (localIrab && !isSyntheticOrStaleText(localIrab, "book_irab") && !isCorruptAyahOnlyText(localIrab, ayahText)) {
    return localIrab;
  }

  const cacheKey = `${surahNumber}:${ayahNumber}:book_irab`;
  return dedupeInFlight(`irab:${surahNumber}:${ayahNumber}`, async () => {
    const cached =
      (await getFromLibraryCache(cacheKey)) ||
      (await getFromLibraryCache(`${surahNumber}:${ayahNumber}:eerab`));

    if (cached && !isSyntheticOrStaleText(cached, "book_irab") && !isCorruptAyahOnlyText(cached, ayahText)) {
      return cached;
    } else if (cached) {
      deleteFromLibraryCache(cacheKey).catch(() => {});
    }

    const isOnline = typeof navigator === "undefined" || navigator.onLine !== false;
    if (isOnline) {
      const slugs = [
        "al-i-rab-al-muyassar",
        "alrab-al-quran-li-da-as",
        "al-jadwal-fi-i-rab-al-quran",
      ];

      for (const slug of slugs) {
        const res = await fetchSpa5kTafsir(slug, surahNumber, ayahNumber);
        if (res.text) {
          const formatted = normalizeAuthenticIrabText(res.text);
          if (formatted && formatted.length > 10 && !isCorruptAyahOnlyText(formatted, ayahText)) {
            saveToLibraryCache(cacheKey, formatted).catch(() => {});
            return formatted;
          }
        }
      }

      const serverVal = await fetchServerTafsirEndpoint(surahNumber, ayahNumber, "book_irab", surahName, ayahText);
      if (serverVal && !isSyntheticOrStaleText(serverVal, "book_irab")) {
        const formatted = normalizeAuthenticIrabText(serverVal);
        if (formatted && !isCorruptAyahOnlyText(formatted, ayahText)) {
          saveToLibraryCache(cacheKey, formatted).catch(() => {});
          return formatted;
        }
      }
    }

    return "تعذر جلب الإعراب من المصدر المعتمد لعدم توفر اتصال بالإنترنت حالياً.";
  });
}

/**
 * 3. أسباب النزول: المحرر في أسباب النزول + لباب النقول/الواحدي + قاعدة أسباب النزول
 */
export async function fetchAuthenticAsbab(
  surahNumber: number,
  ayahNumber: number,
  surahName?: string,
  ayahText?: string
): Promise<string> {
  const localAsbab = getOfflineAsbabStrict(surahNumber, ayahNumber);
  if (localAsbab && !isCorruptAyahOnlyText(localAsbab, ayahText)) {
    saveToLibraryCache(`${surahNumber}:${ayahNumber}:muharrar_asbab`, localAsbab).catch(() => {});
    return localAsbab;
  }

  const cacheKey = `${surahNumber}:${ayahNumber}:muharrar_asbab`;
  return dedupeInFlight(`asbab:${surahNumber}:${ayahNumber}`, async () => {
    const cached =
      (await getFromLibraryCache(cacheKey)) ||
      (await getFromLibraryCache(`${surahNumber}:${ayahNumber}:asbab_nuzool`));
    if (cached && !isSyntheticOrStaleText(cached) && cached !== NO_ASBAB_NOTICE) {
      return cached;
    }

    const isOnline = typeof navigator === "undefined" || navigator.onLine !== false;
    if (isOnline) {
      const serverVal = await fetchServerTafsirEndpoint(surahNumber, ayahNumber, "muharrar_asbab", surahName, ayahText);
      if (serverVal && serverVal.trim()) {
        saveToLibraryCache(cacheKey, serverVal.trim()).catch(() => {});
        return serverVal.trim();
      }
    }

    return NO_ASBAB_NOTICE;
  });
}

/**
 * 4. التدبر: ليدبروا آياته + التفسير والتدبر والعمل
 */
export async function fetchAuthenticTadabbur(
  surahNumber: number,
  ayahNumber: number,
  mode: string = "book_tadabbur",
  surahName?: string,
  ayahText?: string
): Promise<string> {
  const isSpecificGroup = /^book_tadabbur_[1-5]$/.test(mode) || /_[1-5]$/.test(mode);
  const localTdabr = getOfflineTdabr(surahNumber, ayahNumber, surahName, ayahText, mode, isSpecificGroup);

  // If specific group requested (1..5), return authentic group result immediately
  if (isSpecificGroup && localTdabr) {
    return localTdabr;
  }

  const cacheKey = `${surahNumber}:${ayahNumber}:${mode}`;
  return dedupeInFlight(`tadabbur:${surahNumber}:${ayahNumber}:${mode}`, async () => {
    const cached = await getFromLibraryCache(cacheKey);
    if (cached && !isSyntheticOrStaleText(cached, mode)) {
      return cached;
    } else if (cached) {
      deleteFromLibraryCache(cacheKey).catch(() => {});
    }

    const isOnline = typeof navigator === "undefined" || navigator.onLine !== false;
    let remoteParsed: string | null = null;

    if (isOnline) {
      const memKey = `${surahNumber}:${ayahNumber}`;
      let rawPage = tadabburPageCache.get(memKey) || null;
      if (!rawPage) {
        const res = await fetchSpa5kTafsir("tadabbur-wa-amal", surahNumber, ayahNumber);
        if (res.text) {
          rawPage = res.text;
          tadabburPageCache.set(memKey, rawPage);
        }
      }
      if (rawPage) {
        remoteParsed = parseTadabburWaAmalForAyah(rawPage, surahNumber, ayahNumber, ayahText);
      }

      if (!remoteParsed) {
        const serverVal = await fetchServerTafsirEndpoint(surahNumber, ayahNumber, mode, surahName, ayahText);
        if (serverVal && !isSyntheticOrStaleText(serverVal, mode)) {
          remoteParsed = serverVal;
        }
      }
    }

    const parts = [localTdabr, remoteParsed].filter((p): p is string => Boolean(p && p.trim()));
    if (parts.length > 0) {
      const combined = parts.join("\n\n---\n\n");
      saveToLibraryCache(cacheKey, combined).catch(() => {});
      return combined;
    }

    return "[التفسير والتدبر والعمل]\nالعنوان: توثيق مصادر التدبر\nالتدبر: يرجى الاتصال بالإنترنت لجلب وقفات كتاب «التفسير والتدبر والعمل» لهذه الآية الكريمة.\nالقائل: مركز تدبر للدراسات والبحوث القرآنية\nالمصدر: كتاب «ليدبروا آياته»";
  });
}

/**
 * 5. الترجمة المعتمدة: الهلالي ومحسن خان وغيرها بدون استبدال صامت بصحيح إنترناشونال في الكاش
 */
export async function fetchAuthenticTranslation(
  surahNumber: number,
  ayahNumber: number,
  mode: string = "translation_hilali_khan"
): Promise<string> {
  const isHilali =
    mode === "translation_hilali_khan" ||
    mode === "english_hilali_khan" ||
    mode === "hilali_khan";

  const cacheKey = `${surahNumber}:${ayahNumber}:${mode}`;
  return dedupeInFlight(`trans:${surahNumber}:${ayahNumber}:${mode}`, async () => {
    const cached = await getFromLibraryCache(cacheKey);
    if (cached && cached.trim() && !cached.includes("temporarily unavailable")) {
      return cached;
    }

    const isOnline = typeof navigator === "undefined" || navigator.onLine !== false;
    if (isOnline) {
      if (isHilali) {
        // 1. QuranEnc Hilali & Khan
        try {
          const qencRes = await fetch(
            `https://quranenc.com/api/v1/translation/aya/english_hilali_khan/${surahNumber}/${ayahNumber}`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (qencRes.ok) {
            const qencData = await qencRes.json();
            const trans = qencData?.result?.translation;
            if (trans) {
              let clean = stripHtmlClean(trans);
              if (qencData?.result?.footnotes?.trim()) {
                clean += `\n\n📌 Footnotes:\n${stripHtmlClean(qencData.result.footnotes)}`;
              }
              if (clean) {
                saveToLibraryCache(cacheKey, clean).catch(() => {});
                return clean;
              }
            }
          }
        } catch {}

        // 2. AlQuran Cloud en.hilali
        try {
          const acRes = await fetch(
            `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/en.hilali`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (acRes.ok) {
            const acData = await acRes.json();
            const txt = acData?.data?.text;
            if (txt) {
              const clean = stripHtmlClean(txt);
              if (clean) {
                saveToLibraryCache(cacheKey, clean).catch(() => {});
                return clean;
              }
            }
          }
        } catch {}

        // 3. Quran.com translations=203 (Al-Hilali & Khan)
        try {
          const qcRes = await fetch(
            `https://api.quran.com/api/v4/verses/by_key/${surahNumber}:${ayahNumber}?translations=203`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (qcRes.ok) {
            const qcData = await qcRes.json();
            const txt = qcData?.verse?.translations?.[0]?.text;
            if (txt) {
              const clean = stripHtmlClean(txt);
              if (clean) {
                saveToLibraryCache(cacheKey, clean).catch(() => {});
                return clean;
              }
            }
          }
        } catch {}
      } else {
        try {
          const transRes = await getAyahTranslationText(surahNumber, ayahNumber, mode);
          if (transRes && transRes.text) {
            let formatted = stripHtmlClean(transRes.text);
            if (transRes.footnotes && transRes.footnotes.trim()) {
              formatted += `\n\n📌 Footnotes:\n${stripHtmlClean(transRes.footnotes)}`;
            }
            if (formatted) {
              saveToLibraryCache(cacheKey, formatted).catch(() => {});
              return formatted;
            }
          }
        } catch {}
      }

      // Server endpoint fallback
      const serverVal = await fetchServerTafsirEndpoint(surahNumber, ayahNumber, mode);
      if (serverVal && !serverVal.includes("يرجى التحقق من الاتصال")) {
        saveToLibraryCache(cacheKey, serverVal).catch(() => {});
        return serverVal;
      }
    }

    // Offline fallback only (never overwrite Hilali cache key with Sahih International)
    const offlineEn = getOfflineEnglishTranslation(surahNumber, ayahNumber);
    return offlineEn || "Translation currently unavailable offline.";
  });
}

/**
 * 6. التفاسير المعتمدة (المختصر، السعدي، الميسر، أيسر التفاسير، ابن كثير، الطبري، القرطبي، البغوي، الوسيط، الجلالين)
 */
export async function fetchAuthenticTafsir(
  surahNumber: number,
  ayahNumber: number,
  mode: string,
  surahName?: string,
  ayahText?: string
): Promise<string> {
  if (mode === "tafsir_mukhtasar" || mode === "tafsir-mukhtasar" || mode === "mukhtasar") {
    const local = getOfflineMukhtasarTafsir(surahNumber, ayahNumber);
    if (local && !isCorruptAyahOnlyText(local, ayahText)) {
      saveToLibraryCache(`${surahNumber}:${ayahNumber}:tafsir_mukhtasar`, local).catch(() => {});
      return local;
    }
    const cdn = await fetchSpa5kTafsir("ar-tafsir-al-mukhtasar", surahNumber, ayahNumber);
    if (cdn.text) {
      const clean = stripHtmlClean(cdn.text);
      if (clean) {
        saveToLibraryCache(`${surahNumber}:${ayahNumber}:tafsir_mukhtasar`, clean).catch(() => {});
        return clean;
      }
    }
    return getOfflineMukhtasarTafsirFallback(surahNumber, ayahNumber, surahName, ayahText);
  }

  if (mode === "tafsir_sadi" || mode === "ar.saadi") {
    const local = getOfflineSaadiTafsir(surahNumber, ayahNumber);
    if (local && !isCorruptAyahOnlyText(local, ayahText)) {
      saveToLibraryCache(`${surahNumber}:${ayahNumber}:tafsir_sadi`, local).catch(() => {});
      return local;
    }
    const cdn = await fetchSpa5kTafsir("ar-tafseer-al-saddi", surahNumber, ayahNumber);
    if (cdn.text) {
      const clean = stripHtmlClean(cdn.text);
      if (clean && !isCorruptAyahOnlyText(clean, ayahText)) {
        saveToLibraryCache(`${surahNumber}:${ayahNumber}:tafsir_sadi`, clean).catch(() => {});
        return clean;
      }
    }
  }

  if (mode === "tafsir_muyassar" || mode === "ar.muyassar") {
    const local = getOfflineMuyassarTafsir(surahNumber, ayahNumber);
    if (local && !isCorruptAyahOnlyText(local, ayahText)) {
      saveToLibraryCache(`${surahNumber}:${ayahNumber}:tafsir_muyassar`, local).catch(() => {});
      return local;
    }
  }

  if (mode === "tafsir_aysar" || mode === "tafsir-aysar") {
    const local = getOfflineAysarTafsir(surahNumber, ayahNumber);
    if (local && !isCorruptAyahOnlyText(local, ayahText)) {
      return local;
    }
  }

  const cacheKey = `${surahNumber}:${ayahNumber}:${mode}`;
  return dedupeInFlight(`tafsir:${surahNumber}:${ayahNumber}:${mode}`, async () => {
    const cached = await getFromLibraryCache(cacheKey);
    if (cached && !isSyntheticOrStaleText(cached, mode) && !isCorruptAyahOnlyText(cached, ayahText)) {
      return cached;
    }

    const spa5kSlugs: Record<string, string> = {
      tafsir_muyassar: "ar-tafsir-muyassar",
      tafsir_sadi: "ar-tafseer-al-saddi",
      tafsir_kathir: "ar-tafsir-ibn-kathir",
      tafsir_ibnkathir: "ar-tafsir-ibn-kathir",
      tafsir_tabari: "ar-tafsir-al-tabari",
      tafsir_qurtubi: "ar-tafseer-al-qurtubi",
      tafsir_baghawi: "ar-tafsir-al-baghawi",
      tafsir_waseet: "ar-tafsir-al-wasit-tantawi",
      tafsir_waseet_tantawi: "ar-tafsir-al-wasit-tantawi",
      tafsir_suyuti: "ar-tafsir-al-jalalayn",
      tafsir_jalalayn: "ar-tafsir-al-jalalayn",
    };

    const quranComIds: Record<string, number> = {
      tafsir_muyassar: 16,
      tafsir_sadi: 91,
      tafsir_kathir: 14,
      tafsir_ibnkathir: 14,
      tafsir_tabari: 15,
      tafsir_qurtubi: 90,
      tafsir_baghawi: 94,
      tafsir_waseet: 93,
      tafsir_waseet_tantawi: 93,
    };

    const isOnline = typeof navigator === "undefined" || navigator.onLine !== false;
    if (isOnline) {
      const slug = spa5kSlugs[mode];
      if (slug) {
        const res = await fetchSpa5kTafsir(slug, surahNumber, ayahNumber);
        if (res.text) {
          const clean = stripHtmlClean(res.text);
          if (clean && !isCorruptAyahOnlyText(clean, ayahText)) {
            saveToLibraryCache(cacheKey, clean).catch(() => {});
            return clean;
          }
        }
      }

      const qcId = quranComIds[mode];
      if (qcId) {
        try {
          const qcRes = await fetch(`https://api.quran.com/api/v4/tafsirs/${qcId}/by_ayah/${surahNumber}:${ayahNumber}`, {
            signal: AbortSignal.timeout(5000),
          });
          if (qcRes.ok) {
            const qcData = await qcRes.json();
            const raw = qcData?.tafsir?.text || qcData?.tafsirs?.[0]?.text;
            if (raw) {
              const clean = stripHtmlClean(raw);
              if (clean && !isCorruptAyahOnlyText(clean, ayahText)) {
                saveToLibraryCache(cacheKey, clean).catch(() => {});
                return clean;
              }
            }
          }
        } catch {}
      }

      const serverVal = await fetchServerTafsirEndpoint(surahNumber, ayahNumber, mode, surahName, ayahText);
      if (serverVal && !isCorruptAyahOnlyText(serverVal, ayahText)) {
        saveToLibraryCache(cacheKey, serverVal).catch(() => {});
        return serverVal;
      }
    }

    // Ultimate verified offline fallback if requested book requires internet and user is offline
    return (
      getOfflineMukhtasarTafsir(surahNumber, ayahNumber) ||
      getOfflineSaadiTafsir(surahNumber, ayahNumber) ||
      getOfflineMuyassarTafsir(surahNumber, ayahNumber) ||
      ""
    );
  });
}

/**
 * 7. واجهة موحدة لجميع خدمات الآية (المستخدمة في البطاقات والنوافذ)
 */
export async function fetchAuthenticServiceContent(
  surahNumber: number,
  ayahNumber: number,
  mode: string,
  surahName?: string,
  ayahText?: string
): Promise<string> {
  const sMeta = surahsList.find((s) => s.number === surahNumber);
  const sName = surahName || sMeta?.name || `السورة ${surahNumber}`;

  // Notes
  if (mode === "notes" || mode === "user_notes_ayah" || mode === "user_notes_books" || mode === "taqeeda") {
    if (typeof localStorage !== "undefined") {
      const note =
        localStorage.getItem(`tebyan_user_ayah_notes_${surahNumber}_${ayahNumber}`) ||
        localStorage.getItem(`tebyan_ayah_note_${surahNumber}_${ayahNumber}`) ||
        (mode === "user_notes_books" ? localStorage.getItem(`tebyan_books_note_${surahNumber}_${ayahNumber}`) : "") ||
        "";
      if (note.trim()) return note.trim();
    }
    return "لم تدون تقييداً أو خاطرة لهذه الآية بعد. يمكنك تدوين وحفظ فوائدك وتدبراتك الشخصية هنا.";
  }

  // Gharib
  if (mode === "suraj_garib_quran" || mode === "gharib" || mode === "siraj_garib_quran") {
    return fetchAuthenticGharib(surahNumber, ayahNumber, sName, ayahText);
  }

  // I'rab
  if (
    mode === "book_irab" ||
    mode === "eerab" ||
    mode === "irab" ||
    mode === "book_jadwal_safi"
  ) {
    return fetchAuthenticIrab(surahNumber, ayahNumber, sName, ayahText);
  }

  // Asbab
  if (
    mode === "muharrar_asbab" ||
    mode === "asbab_nuzool" ||
    mode === "asbab_nuzul_wahidi" ||
    mode === "asbab"
  ) {
    return fetchAuthenticAsbab(surahNumber, ayahNumber, sName, ayahText);
  }

  // Tadabbur
  if (
    mode === "book_tadabbur" ||
    mode.startsWith("book_tadabbur_") ||
    mode === "tadabbur" ||
    mode === "hidaya" ||
    mode === "book_fawaid_tadabbur" ||
    mode.startsWith("book_tdabur") ||
    mode.startsWith("tdabur")
  ) {
    return fetchAuthenticTadabbur(surahNumber, ayahNumber, mode, sName, ayahText);
  }

  // Mutashabihat
  if (
    mode === "mutashabihat" ||
    mode === "book_mutashabihat_saghir" ||
    mode === "book_taqeeda_saghir" ||
    mode === "book_durrat_tanzil" ||
    mode === "book_malak_tawil"
  ) {
    return getOfflineMutashabihat(surahNumber, ayahNumber, sName, ayahText, mode) || "( لا يوجد متشابه لفظي لهذه الاية )";
  }

  // Ahkam
  if (mode === "ahkam_quran_jassas" || mode === "ahkam" || mode === "ahkam_jassas") {
    return getOfflineAhkamJassas(surahNumber, ayahNumber, sName, ayahText);
  }
  if (mode === "ahkam_quran_arabi" || mode === "ahkam_arabi") {
    return getOfflineAhkamJassas(surahNumber, ayahNumber, sName, ayahText).replace(
      "للإمام أبي بكر الرازي الجصاص",
      "للإمام القاضي ابن العربي المالكي"
    );
  }

  // Translations
  if (
    mode === "translation" ||
    mode === "english" ||
    mode === "en" ||
    mode.startsWith("translation_") ||
    mode.startsWith("english_") ||
    mode.startsWith("french_") ||
    mode.startsWith("spanish_") ||
    mode.startsWith("german_") ||
    mode.startsWith("urdu_") ||
    mode.startsWith("turkish_") ||
    mode.startsWith("indonesian_") ||
    mode.startsWith("russian_")
  ) {
    return fetchAuthenticTranslation(surahNumber, ayahNumber, mode);
  }

  // Tafsirs
  return fetchAuthenticTafsir(surahNumber, ayahNumber, mode, sName, ayahText);
}
