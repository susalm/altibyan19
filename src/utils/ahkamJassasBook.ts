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
        path.join(process.cwd(), "src", "data", "02_shamela023579_أحكام_القرآن_للجصاص_ت_قمحاوي_الجصاص.txt"),
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
    `سورة\\s*${surahNumber}\\s*-\\s*آية\\s*${ayahNumber}(?:\\D|$)`
  );
  
  // Find all sections or entries
  const entries = rawText.split(/(?=\n\s*سورة\s*\d+\s*-\s*آية\s*\d+)/i);
  for (const entry of entries) {
    const trimmed = entry.trim();
    if (specificMarkerRegex.test(trimmed)) {
      // Remove the header line "سورة X - آية Y"
      const content = trimmed.replace(/^سورة\s*\d+\s*-\s*آية\s*\d+[^\n]*\n?/i, "").trim();
      if (content) {
        const result = `### 📖 أحكام القرآن — للإمام أبي بكر الرازي الجصاص (ت 370 هـ)
سورة ${surahName} [الآية: ${ayahNumber}]

${content}`;
        ahkamCache[cacheKey] = result;
        return result;
      }
    }
  }

  // 2. Check within surah block if formatted by surah section [سورة ...]
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
      
      // Look for ayah within this section with strict digit boundary
      const ayahRegex = new RegExp(
        `(?:^|\\n)\\s*(?:سورة\\s*\\d+\\s*-\\s*)?(?:آية|الآية|\\()\\s*${ayahNumber}(?!\\d)(?:\\)|:|-)?([\\s\\S]*?)(?=(?:\\n\\s*(?:سورة\\s*\\d+\\s*-\\s*)?(?:آية|الآية|\\()\\s*\\d+(?!\\d))|$)`,
        "i"
      );
      const aMatch = sectionContent.match(ayahRegex);
      if (aMatch && aMatch[0] && aMatch[0].trim().length > 10) {
        const cleanAyahContent = aMatch[0].replace(/^(?:سورة\s*\d+\s*-\s*)?(?:آية|الآية|\()\s*\d+(?!\d)(?:\)|:|-)?\s*/i, "").trim();
        if (cleanAyahContent) {
          const result = `### 📖 أحكام القرآن — للإمام أبي بكر الرازي الجصاص (ت 370 هـ)
سورة ${surahName} [الآية: ${ayahNumber}]

${cleanAyahContent}`;
          ahkamCache[cacheKey] = result;
          return result;
        }
      }
    }
  }

  // Exact concise notice when the author did not mention or dedicate specific jurisprudence rulings to this verse
  const defaultNotice = `لم يُفرد لها حكماً فقهياً فرعياً مستقلاً في هذا الباب.`;

  ahkamCache[cacheKey] = defaultNotice;
  return defaultNotice;
}
