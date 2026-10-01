import { surahsList } from "../data/surahList";
import { tafsirMukhtasarText } from "../data/tafsirMukhtasarData";
import mukhtasarFullJson from "../data/mukhtasar_full.json";
import { MUKHTASAR_SURAH_MAQASID } from "../data/mukhtasarMaqasid";

interface AyahTafsirMap {
  [ayahNumber: number]: string;
}

const fullMukhtasarDict = mukhtasarFullJson as Record<string, string>;
let mukhtasarCache: Map<number, AyahTafsirMap> | null = null;

export function getSurahIntroMukhtasar(surahNumber: number): string | null {
  const meta = MUKHTASAR_SURAH_MAQASID[surahNumber];
  if (!meta) return null;
  const surahObj = surahsList.find((s) => s.number === surahNumber);
  const sName = surahObj ? surahObj.name : "";
  let header = `سورة ${sName}\n${meta.classification}\n\n[مِنْ مَقَاصِدِ السُّورَةِ]\n${meta.maqsid}`;
  if (meta.namingIntro) {
    header += `\n\n[التَّفْسِيرُ]\n${meta.namingIntro}`;
  }
  return header;
}

function normalizeName(str: string): string {
  return str
    .replace(/[\u064B-\u065F]/g, "") // remove tashkeel
    .replace(/[أإآء]/g, "ا")
    .replace(/ة\b/g, "ه")
    .trim();
}

function parseMukhtasarText(): Map<number, AyahTafsirMap> {
  if (mukhtasarCache) return mukhtasarCache;

  const result = new Map<number, AyahTafsirMap>();
  if (!tafsirMukhtasarText) return result;

  // Split by "سورة " headers
  const surahBlocks = tafsirMukhtasarText.split(/(?=سورة\s+)/g);

  for (const block of surahBlocks) {
    const firstLine = block.trim().split("\n")[0] || "";
    if (!firstLine.startsWith("سورة")) continue;

    // Find matching surah from surahsList
    const cleanHeader = normalizeName(firstLine);
    const surah = surahsList.find((s) => {
      const cleanSurahName = normalizeName(s.name);
      return cleanHeader.includes(cleanSurahName);
    });

    if (!surah) continue;

    const ayahMap: AyahTafsirMap = {};
    const lines = block.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      // Match lines like: "1 - ..." or "3 - 4 - ..." or "17 - ..."
      const match = trimmed.match(/^(\d+)(?:\s*-\s*(\d+))?\s*-\s*(.+)$/);
      if (match) {
        const startAyah = parseInt(match[1], 10);
        const endAyah = match[2] ? parseInt(match[2], 10) : startAyah;
        const text = match[3].trim();

        for (let a = startAyah; a <= endAyah; a++) {
          ayahMap[a] = text;
        }
      }
    }

    if (Object.keys(ayahMap).length > 0) {
      result.set(surah.number, ayahMap);
    }
  }

  mukhtasarCache = result;
  return result;
}

export function getOfflineMukhtasarTafsir(
  surahNumber: number,
  ayahNumber: number
): string | null {
  const key = `${surahNumber}:${ayahNumber}`;
  let baseTafsir = fullMukhtasarDict[key];
  if (!baseTafsir) {
    const cache = parseMukhtasarText();
    const surahMap = cache.get(surahNumber);
    if (surahMap && surahMap[ayahNumber]) {
      baseTafsir = surahMap[ayahNumber];
    }
  }

  if (baseTafsir && ayahNumber === 1) {
    const intro = getSurahIntroMukhtasar(surahNumber);
    if (intro && !baseTafsir.includes("[مِنْ مَقَاصِدِ السُّورَةِ]")) {
      const cleanAyahTafsir = baseTafsir.replace(/^[0-9]+\s*-\s*/, "");
      return `${intro}\n\n1 - ${cleanAyahTafsir}`;
    }
  }

  return baseTafsir || null;
}

export function getOfflineMukhtasarTafsirFallback(
  surahNumber: number,
  ayahNumber: number,
  surahName?: string,
  ayahText?: string
): string {
  if (ayahNumber === 1) {
    const intro = getSurahIntroMukhtasar(surahNumber);
    if (intro) {
      return `${intro}\n\n1 - إيضاح وتوجيه مبارك للعمل بما أنزله الله، والتزام التقوى والطاعة والإيمان بآيات الله ورسله، وبيان مقاصد الشريعة والعمل الصالح.`;
    }
  }
  return `إيضاح وتوجيه مبارك للعمل بما أنزله الله، والتزام التقوى والطاعة والإيمان بآيات الله ورسله، وبيان مقاصد الشريعة والعمل الصالح.`;
}
