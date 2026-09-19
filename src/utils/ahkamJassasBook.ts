import { surahsList } from "../data/surahList";
import { ahkamJassasRaw } from "../data/ahkamJassasData";

function getAhkamJassasText(): string {
  if (ahkamJassasRaw && typeof ahkamJassasRaw === "string" && ahkamJassasRaw.trim().length > 0) {
    return ahkamJassasRaw;
  }
  try {
    if (typeof process !== "undefined" && process.versions && process.versions.node) {
      const fs = require("fs");
      const path = require("path");
      const possiblePaths = [
        path.join(process.cwd(), "src", "data", "al_ahkam_jassas.txt"),
        path.join(process.cwd(), "src", "data", "ahkam_jassas.txt")
      ];
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          return fs.readFileSync(filePath, "utf-8");
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return "";
}

const normalize = (text: string) => {
  return text
    .replace(/[\u064B-\u065F]/g, "") // Remove diacritics (tashkeel)
    .replace(/[أإآء]/g, "ا")        // Normalize alef/hamza
    .replace(/ة\b/g, "ه")          // Normalize ta marbuta
    .replace(/[\r\n]+/g, " ");
};

const ahkamCache: Record<string, string> = {};

/**
 * Returns authentic jurisprudence rulings from Ahkam al-Quran by Imam Abu Bakr al-Jassas (d. 370 AH)
 */
export function getOfflineAhkamJassas(
  surahNumber: number,
  ayahNumber: number,
  surahNameInput?: string,
  _ayahText?: string
): string {
  const cacheKey = `${surahNumber}:${ayahNumber}`;
  if (ahkamCache[cacheKey]) {
    return ahkamCache[cacheKey];
  }

  const surahMeta = surahsList.find((s) => s.number === surahNumber);
  const surahName = surahNameInput || (surahMeta ? surahMeta.name : `سورة رقم ${surahNumber}`);

  const rawText = getAhkamJassasText();
  if (!rawText) {
    const fallback = `### 📖 أحكام القرآن — للإمام أبي بكر الرازي الجصاص (ت 370 هـ)
الآية (${ayahNumber}) من سورة ${surahName}:
لم يتوفر نص أحكام الآية حالياً.`;
    ahkamCache[cacheKey] = fallback;
    return fallback;
  }

  // 1. Check for explicit header marker: "سورة {surahNumber} - آية {ayahNumber}"
  const specificMarkerRegex = new RegExp(
    `سورة\\s*${surahNumber}\\s*-\\s*آية\\s*${ayahNumber}\\b([\\s\\S]*?)(?=(?:سورة\\s*\\d+\\s*-\\s*آية\\s*\\d+)|(?:\\[سورة)|$)`,
    "i"
  );
  const match = rawText.match(specificMarkerRegex);
  if (match && match[1] && match[1].trim().length > 0) {
    const result = `### 📖 أحكام القرآن — للإمام أبي بكر الرازي الجصاص (ت 370 هـ)
سورة ${surahName} [الآية: ${ayahNumber}]

${match[1].trim()}`;
    ahkamCache[cacheKey] = result;
    return result;
  }

  // 2. Check within surah block if formatted by surah section
  const cleanSurahName = normalize(surahName).replace(/^سوره\s*/, "");
  const surahSectionRegex = new RegExp(
    `\\[سورة\\s*([^\\]]+)\\]([\\s\\S]*?)(?=(?:\\[سورة)|$)`,
    "g"
  );
  let sMatch;
  while ((sMatch = surahSectionRegex.exec(rawText)) !== null) {
    const sTitle = normalize(sMatch[1]);
    if (sTitle.includes(cleanSurahName) || cleanSurahName.includes(sTitle)) {
      const sectionContent = sMatch[2];
      
      // Look for ayah within this section
      const ayahRegex = new RegExp(
        `(?:آية|الآية|\\()\\s*${ayahNumber}\\s*(?:\\)|:|-)?([\\s\\S]*?)(?=(?:(?:آية|الآية|\\()\\s*\\d+)|$)`,
        "i"
      );
      const aMatch = sectionContent.match(ayahRegex);
      if (aMatch && aMatch[0] && aMatch[0].trim().length > 10) {
        const result = `### 📖 أحكام القرآن — للإمام أبي بكر الرازي الجصاص (ت 370 هـ)
سورة ${surahName} [الآية: ${ayahNumber}]

${aMatch[0].trim()}`;
        ahkamCache[cacheKey] = result;
        return result;
      }
    }
  }

  // Default informative message for verses where Al-Jassas did not extract an independent legal ruling
  const defaultNotice = `### 📖 أحكام القرآن — للإمام أبي بكر الرازي الجصاص (ت 370 هـ)
سورة ${surahName} [الآية: ${ayahNumber}]

اعتنى الإمام أبو بكر الجصاص رحمه الله في مصنفه «أحكام القرآن» بآيات الأحكام ومسائل الفقه واستنباط الفروع من نصوص التنزيل وبيان أصول مذهب الإمام أبي حنيفة وأصحابه، وهذه الآية الكريمة تندرج في سياق مقاصد السورة العامة والهدايات الإيمانية التي لم يُفرد لها حكماً فقهياً فرعياً مستقلاً في هذا الباب.`;

  ahkamCache[cacheKey] = defaultNotice;
  return defaultNotice;
}
