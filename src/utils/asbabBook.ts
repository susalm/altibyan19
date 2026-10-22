import { muharrarAsbabRaw } from "../data/muharrarAsbabData";
import { surahsList } from "../data/surahList";

const asbabCache = new Map<string, string>();
let isInitialized = false;

function initAsbab() {
  if (isInitialized) return;
  isInitialized = true;

  if (!muharrarAsbabRaw) return;

  const surahBlocks = muharrarAsbabRaw.split(/(?=سورة\s+)/g);
  for (const block of surahBlocks) {
    const surahMatch = block.match(/^سورة\s+([^\n\r]+)/);
    if (!surahMatch) continue;

    const surahNameClean = surahMatch[1].replace(/[أإآء]/g, "ا").trim();
    const foundSurah = surahsList.find((s) => s.name.replace(/[أإآء]/g, "ا").trim() === surahNameClean);
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

export function getOfflineAsbab(
  surahNumber: number,
  ayahNumber: number,
  _surahName?: string,
  _ayahText?: string
): string {
  initAsbab();
  const key = `${surahNumber}:${ayahNumber}`;
  const found = asbabCache.get(key);
  if (found && found.trim()) {
    return found.trim();
  }
  return "لم يثبت سبب نزول خاص مسند لهذه الآية الكريمة، ونزلت ابتداءً مع سياق السورة ومقتضى التنزيل الحكيم.";
}
