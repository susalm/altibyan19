import { muharrarAsbabRaw } from "../data/muharrarAsbabData";
import { surahsList } from "../data/surahList";
import asbabFullData from "../data/asbab_full.json";

type CompactAsbabEntry = [number, number[], string];

const asbabCache = new Map<string, string>();
let isInitialized = false;

function normalizeArabicSurah(str: string): string {
  return str
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u0671]/g, "")
    .replace(/[أإآءٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/^سوره\s+/, "")
    .replace(/^سورة\s+/, "")
    .trim();
}

function initAsbab() {
  if (isInitialized) return;
  isInitialized = true;

  // 1. Parse المحرر في أسباب النزول (al_muharar_asbab.txt)
  if (muharrarAsbabRaw) {
    const surahBlocks = muharrarAsbabRaw.split(/(?=سورة\s+)/g);
    for (const block of surahBlocks) {
      const surahMatch = block.match(/^سورة\s+([^\n\r]+)/);
      if (!surahMatch) continue;

      const surahNameClean = normalizeArabicSurah(surahMatch[1]);
      const foundSurah = surahsList.find(
        (s) => normalizeArabicSurah(s.name) === surahNameClean
      );
      const surahNum = foundSurah ? foundSurah.number : null;
      if (!surahNum) continue;

      const ayahItems = block.split(/(?=\d+\s*-\s*قال الله تعالى)/g);
      for (const item of ayahItems) {
        const ayahNumbers = Array.from(item.matchAll(/[\(（](\d+)[\)）]/g)).map((m) => Number(m[1]));
        if (ayahNumbers.length > 0) {
          const text = item.trim();
          for (const aNum of ayahNumbers) {
            const key = `${surahNum}:${aNum}`;
            if (!asbabCache.has(key)) {
              asbabCache.set(key, text);
            }
          }
        }
      }
    }
  }

  // 2. Supplement all remaining surahs from complete authenticated Asbab dataset (asbab_full.json)
  if (Array.isArray(asbabFullData)) {
    for (const entry of asbabFullData as CompactAsbabEntry[]) {
      const [sNum, ayahs, occText] = entry;
      if (!sNum || !Array.isArray(ayahs) || !occText) continue;
      for (const aNum of ayahs) {
        const key = `${sNum}:${aNum}`;
        if (!asbabCache.has(key)) {
          asbabCache.set(key, occText.trim());
        }
      }
    }
  }
}

export const NO_ASBAB_NOTICE =
  "لم يثبت سبب نزول خاص مسند لهذه الآية الكريمة، ونزلت ابتداءً مع سياق السورة ومقتضى التنزيل الحكيم.";

/**
 * Strict lookup returning null when no local Asbab entry exists,
 * allowing async callers to also query Al-Wahidi's Asbab al-Nuzul JSON.
 */
export function getOfflineAsbabStrict(
  surahNumber: number,
  ayahNumber: number
): string | null {
  initAsbab();
  const key = `${surahNumber}:${ayahNumber}`;
  const found = asbabCache.get(key);
  if (found && found.trim()) {
    return found.trim();
  }
  return null;
}

export function getOfflineAsbab(
  surahNumber: number,
  ayahNumber: number,
  _surahName?: string,
  _ayahText?: string,
  returnEmptyNotice: boolean = true
): string | null {
  const found = getOfflineAsbabStrict(surahNumber, ayahNumber);
  if (found) return found;
  return returnEmptyNotice ? NO_ASBAB_NOTICE : null;
}
