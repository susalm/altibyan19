import { surahsList } from "../data/surahList";
import { muharrarAsbabRaw } from "../data/muharrarAsbabData";

function getMuharrarAsbabText(): string {
  if (muharrarAsbabRaw && typeof muharrarAsbabRaw === "string" && muharrarAsbabRaw.trim().length > 0) {
    return muharrarAsbabRaw;
  }
  try {
    if (typeof process !== "undefined" && process.versions && process.versions.node) {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "src", "data", "al_muharar_asbab.txt");
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf-8");
      }
    }
  } catch (e) {
    // fallback
  }
  return "";
}

const normalizeName = (name: string) =>
  name
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[أإآء]/g, "ا")
    .replace(/ة\b/g, "ه")
    .trim();

let cachedSurahMap: Map<string, string> | null = null;

function getSurahAsbabMap(): Map<string, string> {
  if (cachedSurahMap) {
    return cachedSurahMap;
  }
  const text = getMuharrarAsbabText();
  const map = new Map<string, string>();
  if (!text) {
    cachedSurahMap = map;
    return map;
  }

  const chunks = text.split(/\nسورة\s+/);
  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];
    const newlineIdx = chunk.indexOf("\n");
    if (newlineIdx !== -1) {
      const title = chunk.substring(0, newlineIdx).trim();
      const body = chunk.substring(newlineIdx + 1);
      map.set(normalizeName(title), body);
    }
  }

  cachedSurahMap = map;
  return map;
}

export function getOfflineAsbab(
  surahNumber: number,
  ayahNumber: number,
  surahNameInput?: string,
  _ayahText?: string
): string | null {
  const surahMeta = surahsList.find((s) => s.number === surahNumber);
  const surahName = surahNameInput || (surahMeta ? surahMeta.name : `سورة رقم ${surahNumber}`);

  const surahMap = getSurahAsbabMap();
  const normSurahName = normalizeName(surahMeta ? surahMeta.name : surahName);
  const surahSection = surahMap.get(normSurahName);

  if (surahSection) {
    const itemRegex = /(?:\r?\n|^)(\d+\s*-\s*قال\s+الله\s+تعالى:[\s\S]*?)(?=(?:\r?\n\d+\s*-\s*قال\s+الله\s+تعالى:)|$)/g;
    let match;
    while ((match = itemRegex.exec(surahSection)) !== null) {
      const itemText = match[1];
      // 1. Direct match with paren: (14) or ( 14 )
      const parenRegex = new RegExp(`\\(\\s*${ayahNumber}\\s*\\)`);
      if (parenRegex.test(itemText)) {
        return `### 📖 المصدر: كتاب المحرر في أسباب النزول (د. خالد المزيني)\n\n${itemText.trim()}`;
      }
      // 2. Range match: (11 - 12) or (142 - 144)
      const rangeRegex = /\(\s*(\d+)\s*[-–]\s*(\d+)\s*\)/g;
      let rMatch;
      while ((rMatch = rangeRegex.exec(itemText)) !== null) {
        const start = parseInt(rMatch[1], 10);
        const end = parseInt(rMatch[2], 10);
        if (ayahNumber >= start && ayahNumber <= end) {
          return `### 📖 المصدر: كتاب المحرر في أسباب النزول (د. خالد المزيني)\n\n${itemText.trim()}`;
        }
      }
    }

    const paragraphs = surahSection.split(/\r?\n\r?\n/);
    for (const para of paragraphs) {
      if (para.includes(`(${ayahNumber})`)) {
        return `### 📖 المصدر: كتاب المحرر في أسباب النزول (د. خالد المزيني)\n\n${para.trim()}`;
      }
      const rangeRegex = /\(\s*(\d+)\s*[-–]\s*(\d+)\s*\)/g;
      let rMatch;
      while ((rMatch = rangeRegex.exec(para)) !== null) {
        const start = parseInt(rMatch[1], 10);
        const end = parseInt(rMatch[2], 10);
        if (ayahNumber >= start && ayahNumber <= end) {
          return `### 📖 المصدر: كتاب المحرر في أسباب النزول (د. خالد المزيني)\n\n${para.trim()}`;
        }
      }
    }
  }

  return `### 📖 المصدر: كتاب المحرر في أسباب النزول (د. خالد بن سليمان المزيني)
لم يثبت سبب نزول صريح وخاص بالآية الكريمة رقم ${ayahNumber} من سورة ${surahName} في المراجع الحديثية المعتمدة في كتاب المحرر، وتعتبر الآية نازلة ابتداءً في الهداية والأحكام العامة.`;
}
