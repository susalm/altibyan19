import { surahsList } from "../data/surahList";
import { sirajGharibRaw } from "../data/sirajGharibData";
import sirajGharibFullJson from "../data/siraj_gharib_full.json";

interface GharibEntry {
  ayahNumber: number;
  word: string;
  meaning: string;
}

const sirajFullMap = sirajGharibFullJson as Record<string, string>;
let parsedSurahsCache: Map<number, GharibEntry[]> | null = null;

function getSirajGharibText(): string {
  if (sirajGharibRaw && typeof sirajGharibRaw === "string" && sirajGharibRaw.trim().length > 0) {
    return sirajGharibRaw;
  }
  try {
    if (typeof process !== "undefined" && process.versions && process.versions.node) {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "src", "data", "al_siraj_gharib.txt");
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf-8");
      }
    }
  } catch {
    // ignore node fs error in browser
  }
  return "";
}

function parseSirajGharibFile(): Map<number, GharibEntry[]> {
  if (parsedSurahsCache) return parsedSurahsCache;

  const sirajGharibText = getSirajGharibText();
  const surahMap = new Map<number, GharibEntry[]>();
  if (!sirajGharibText) {
    parsedSurahsCache = surahMap;
    return surahMap;
  }

  const surahBlocks = sirajGharibText.split(/(?=ترتيبها\s+\d+)/g);

  for (const block of surahBlocks) {
    const surahHeaderMatch = block.match(/ترتيبها\s+(\d+)/i);
    if (!surahHeaderMatch) continue;

    const surahNum = parseInt(surahHeaderMatch[1], 10);
    const entries: GharibEntry[] = [];

    const lineMatches = block.matchAll(/(?:\((\d+)\)|\*)\s*\.\.\.\s*\{([^\}]+)\}\s*\.\.\.\s*([^\n\r]+)/g);
    for (const match of lineMatches) {
      if (!match[1]) continue;
      entries.push({
        ayahNumber: parseInt(match[1], 10),
        word: match[2].replace(/\*/g, "").trim(),
        meaning: match[3].replace(/\*/g, "").trim(),
      });
    }

    if (entries.length > 0) {
      surahMap.set(surahNum, entries);
    }
  }

  parsedSurahsCache = surahMap;
  return surahMap;
}

/**
 * Formats Al-Muyassar / CDN Gharib response lines into consistent (word): meaning lines
 */
export function normalizeGharibLines(rawText: string): string {
  if (!rawText) return "";
  const lines = rawText
    .replace(/\*/g, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const m = line.match(/^(?:﴿([^﴿﴾]+)﴾|\{([^{}]+)\}|\(([^()]+)\))\s*[:：\-–—]\s*(.+)$/);
      if (m) {
        const w = (m[1] || m[2] || m[3] || "").trim();
        const meaning = (m[4] || "").trim();
        return `(${w}): ${meaning}`;
      }
      return line;
    })
    .join("\n")
    .trim();
}

/**
 * Looks up authentic Gharib Al-Quran vocabulary for all 114 surahs from:
 * 1. Complete "السراج في بيان غريب القرآن" dataset (3,654 ayahs across 114 surahs)
 * 2. Local "al_siraj_gharib.txt" fallback
 *
 * When returnEmptyNotice=false, returns null if the ayah isn't in السراج so async callers
 * can also check "الميسر في غريب القرآن" before concluding no gharib entry exists.
 */
export function getOfflineGharib(
  surahNumber: number,
  ayahNumber: number,
  _surahNameInput?: string,
  _ayahText?: string,
  returnEmptyNotice: boolean = false
): string | null {
  const key = `${surahNumber}:${ayahNumber}`;

  // 1. Primary: Complete 114-surah السراج في بيان غريب القرآن JSON
  if (sirajFullMap && sirajFullMap[key] && sirajFullMap[key].trim()) {
    return sirajFullMap[key].trim();
  }

  // 2. Secondary: Local al_siraj_gharib.txt (Surahs 1-5)
  const surahMap = parseSirajGharibFile();
  if (surahMap.has(surahNumber)) {
    const surahEntries = surahMap.get(surahNumber) || [];
    const matchedEntries = surahEntries.filter((e) => e.ayahNumber === ayahNumber);
    if (matchedEntries.length > 0) {
      return matchedEntries.map((e) => `(${e.word}): ${e.meaning}`).join("\n");
    }
  }

  // Verify surah exists in metadata
  const surahExists = surahsList.some((s) => s.number === surahNumber);
  if (!surahExists) return null;

  return returnEmptyNotice ? "لم يُدوّن غريب مفردات خاص لهذه الآية الكريمة" : null;
}
