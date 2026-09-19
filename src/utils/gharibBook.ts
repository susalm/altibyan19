import { surahsList } from "../data/surahList";
import { sirajGharibRaw } from "../data/sirajGharibData";

interface GharibEntry {
  ayahNumber: number | string; // number or '*'
  word: string;
  meaning: string;
}

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
  } catch (e) {
    // fallback
  }
  return "";
}

function parseSirajGharibFile(): Map<number, GharibEntry[]> {
  if (parsedSurahsCache) return parsedSurahsCache;

  const sirajGharibText = getSirajGharibText();
  const surahMap = new Map<number, GharibEntry[]>();
  if (!sirajGharibText) return surahMap;

  // Split by surah header line: e.g. "ترتيبها 1 ... سُورَةُ الفَاتِحَةِ ..." or "ترتيبها 2 ..."
  const surahBlocks = sirajGharibText.split(/(?=ترتيبها\s+\d+)/g);

  for (const block of surahBlocks) {
    const surahHeaderMatch = block.match(/ترتيبها\s+(\d+)/i);
    if (!surahHeaderMatch) continue;

    const surahNum = parseInt(surahHeaderMatch[1], 10);
    const entries: GharibEntry[] = [];

    // Match lines like:
    // (1) ... {بِسْمِ اللهِ} ... أَيْ: أَبْتَدِئُ قِرَاءَتِي...
    // * ... {أَعُوذُ} ... أَلْتَجِئُ وَأَعْتَصِمُ.
    // Filter out preamble lines with '*' (like Istiadha) and match true ayah numbers
    const lineMatches = block.matchAll(/(?:\((\d+)\)|\*)\s*\.\.\.\s*\{([^\}]+)\}\s*\.\.\.\s*([^\n\r]+)/g);
    for (const match of lineMatches) {
      if (!match[1]) continue; // Skip lines marked with '*' (preamble/non-ayah)
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

export function getOfflineGharib(
  surahNumber: number,
  ayahNumber: number,
  surahNameInput?: string,
  _ayahText?: string
): string | null {
  const surahMeta = surahsList.find((s) => s.number === surahNumber);
  const surahName = surahNameInput || (surahMeta ? surahMeta.name : `سورة رقم ${surahNumber}`);

  const surahMap = parseSirajGharibFile();

  if (!surahMap.has(surahNumber)) {
    // If surah is not in local al_siraj_gharib.txt, return null to fallback to API/Gemini
    return null;
  }

  const surahEntries = surahMap.get(surahNumber) || [];

  // Filter entries strictly for this specific ayah
  const matchedEntries = surahEntries.filter((e) => {
    return e.ayahNumber === ayahNumber;
  });

  if (matchedEntries.length === 0) {
    return "لم يُدوّن غريب مفردات خاص لهذه الآية الكريمة";
  }

  return matchedEntries
    .map((e) => `(${e.word}): ${e.meaning}`)
    .join("\n");
}
