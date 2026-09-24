import { surahsList } from "../data/surahList";
import { lyadabbarooGroup1Text } from "../data/lyadabbarooGroup1Data";
import { lyadabbarooGroup2Text } from "../data/lyadabbarooGroup2Data";
import { lyadabbarooGroup3Text } from "../data/lyadabbarooGroup3Data";
import { lyadabbarooGroup4Text } from "../data/lyadabbarooGroup4Data";
import { lyadabbarooGroup5Text } from "../data/lyadabbarooGroup5Data";
import { Srf1Text } from "../data/Srf1Data";
import { Srf2Text } from "../data/Srf2Data";
import {
  generateAllBooksTadabbur,
  formatMultiBookTadabbur,
  parseTadabburSections,
  TadabburBookSection
} from "./tdabrMultiBook";

export { parseTadabburSections, formatMultiBookTadabbur };
export type { TadabburBookSection };

export interface TdabrInsight {
  title?: string;
  ayahText?: string;
  tadabburText: string;
  author?: string;
  source: string;
  surahNumber?: number;
  ayahNumber?: number;
}

function cleanArabic(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u064B-\u065F\u0670\u0671]/g, "")
    .replace(/[أإآءٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/^سورة\s+/, "")
    .replace(/^سوره\s+/, "")
    .replace(/[\(\)\[\]:.\-_]/g, "")
    .trim();
}

function matchSurahNames(surahNum: number, canonicalName: string, lineSurahStr: string): boolean {
  const cNorm = cleanArabic(canonicalName).replace(/^ال/, "");
  const lNorm = cleanArabic(lineSurahStr).replace(/^ال/, "");
  if (!cNorm || !lNorm) return false;
  if (cNorm === lNorm) return true;

  if (surahNum === 9 && (lNorm.includes("براءه") || lNorm.includes("توبه"))) return true;
  if (surahNum === 17 && (lNorm.includes("اسراء") || lNorm.includes("بني اسرائيل"))) return true;
  if (surahNum === 76 && (lNorm.includes("انسان") || lNorm.includes("دهر"))) return true;
  if (surahNum === 94 && (lNorm.includes("شرح") || lNorm.includes("انشراح"))) return true;
  if (surahNum === 112 && (lNorm.includes("اخلاص") || lNorm.includes("توحيد"))) return true;

  if (cNorm.length > 2 && lNorm.length > 2) {
    return lNorm.includes(cNorm) || cNorm.includes(lNorm);
  }
  return false;
}

function parseHeader(header: string): { surahIdent: string | number; ayahStart: number; ayahEnd: number } | null {
  const cleanH = header.trim();
  // e.g. "2: 255" or "سورة 2: 255" or "2 255"
  const numPrefixMatch = cleanH.match(/^(?:سورة\s+)?(\d+)\s*[\:\s]\s*(\d+)(?:\s*[\-\–]\s*(\d+))?/i);
  if (numPrefixMatch) {
    const sNum = parseInt(numPrefixMatch[1], 10);
    const aStart = parseInt(numPrefixMatch[2], 10);
    const aEnd = numPrefixMatch[3] ? parseInt(numPrefixMatch[3], 10) : aStart;
    return { surahIdent: sNum, ayahStart: aStart, ayahEnd: aEnd };
  }

  // e.g. "سورة البقرة 255" or "البقرة: 255-257" or "سورة آل عمران آية 17"
  const nameMatch = cleanH.match(/^(?:سورة\s+)?([^\d\:\-]+)[\s\:\-]+(?:آية\s+)?(\d+)(?:\s*[\-\–]\s*(\d+))?/i);
  if (nameMatch) {
    const sName = nameMatch[1].trim();
    const aStart = parseInt(nameMatch[2], 10);
    const aEnd = nameMatch[3] ? parseInt(nameMatch[3], 10) : aStart;
    return { surahIdent: sName, ayahStart: aStart, ayahEnd: aEnd };
  }

  return null;
}

export function parseTdabrSource(
  sourceText: string,
  surahNumber: number,
  ayahNumber: number,
  surahNameInput: string,
  sourceLabel: string
): TdabrInsight[] {
  const results: TdabrInsight[] = [];
  if (!sourceText) return results;

  const surahMeta = surahsList.find((s) => s.number === surahNumber);
  const surahName = surahNameInput || (surahMeta ? surahMeta.name : "");

  const blocks = sourceText.split(/\[([^\]]+)\]/);
  for (let i = 1; i < blocks.length; i += 2) {
    const header = blocks[i];
    const body = blocks[i + 1] || "";

    const parsed = parseHeader(header);
    if (!parsed) continue;

    let isMatch = false;
    if (typeof parsed.surahIdent === "number") {
      isMatch = parsed.surahIdent === surahNumber;
    } else {
      isMatch = matchSurahNames(surahNumber, surahName, parsed.surahIdent);
    }

    if (!isMatch) continue;

    if (ayahNumber < parsed.ayahStart || ayahNumber > parsed.ayahEnd) {
      continue;
    }

    // Extract title, ayah, and tadabbur text from block lines
    let title = "";
    let ayahText = "";
    let tadabburText = "";

    const lines = body.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("العنوان:")) {
        title = trimmed.replace("العنوان:", "").trim();
      } else if (trimmed.startsWith("الآية:") || trimmed.startsWith("الاية:")) {
        ayahText = trimmed.replace(/^(?:الآية|الاية):/, "").trim();
      } else if (trimmed.startsWith("التدبر:") || trimmed.startsWith("الوقفة:")) {
        tadabburText = trimmed.replace(/^(?:التدبر|الوقفة):/, "").trim();
      } else if (trimmed.startsWith("المصدر:") || trimmed.startsWith("===")) {
        continue;
      } else if (!tadabburText && !trimmed.startsWith("العنوان:")) {
        tadabburText += (tadabburText ? " " : "") + trimmed;
      }
    }

    if (tadabburText) {
      results.push({
        title: title || undefined,
        ayahText: ayahText || undefined,
        tadabburText,
        source: sourceLabel,
        surahNumber,
        ayahNumber
      });
    }
  }

  return results;
}

/**
 * Aggregates all available Tadabbur pearls from the 5 canonical volumes of «ليدبروا آياته»
 * for a given ayah, returning every reflection found in the sources.
 */
export function getAllTdabrInsights(
  surahNumber: number,
  ayahNumber: number,
  surahNameInput?: string,
  ayahText?: string
): TdabrInsight[] {
  const surahMeta = surahsList.find((s) => s.number === surahNumber);
  const surahName = surahNameInput || (surahMeta ? surahMeta.name : "");

  const allInsights: TdabrInsight[] = [];

  // Group 1 (المجموعة الأولى: الفاتحة إلى الأنعام)
  if (lyadabbarooGroup1Text) {
    const parsed1 = parseTdabrSource(
      lyadabbarooGroup1Text,
      surahNumber,
      ayahNumber,
      surahName,
      "كتاب «ليدبروا آياته» - المجموعة الأولى"
    );
    for (const item of parsed1) {
      allInsights.push(item);
    }
  }

  // Group 2 (المجموعة الثانية: الأعراف إلى الكهف)
  if (lyadabbarooGroup2Text) {
    const parsed2 = parseTdabrSource(
      lyadabbarooGroup2Text,
      surahNumber,
      ayahNumber,
      surahName,
      "كتاب «ليدبروا آياته» - المجموعة الثانية"
    );
    for (const item of parsed2) {
      allInsights.push(item);
    }
  }

  // Group 3 (المجموعة الثالثة: مريم إلى الزمر)
  if (lyadabbarooGroup3Text) {
    const parsed3 = parseTdabrSource(
      lyadabbarooGroup3Text,
      surahNumber,
      ayahNumber,
      surahName,
      "كتاب «ليدبروا آياته» - المجموعة الثالثة"
    );
    for (const item of parsed3) {
      allInsights.push(item);
    }
  }

  // Group 4 (المجموعة الرابعة: غافر إلى الحديد)
  if (lyadabbarooGroup4Text) {
    const parsed4 = parseTdabrSource(
      lyadabbarooGroup4Text,
      surahNumber,
      ayahNumber,
      surahName,
      "كتاب «ليدبروا آياته» - المجموعة الرابعة"
    );
    for (const item of parsed4) {
      allInsights.push(item);
    }
  }

  // Group 5 (المجموعة الخامسة: المجادلة إلى الناس)
  if (lyadabbarooGroup5Text) {
    const parsed5 = parseTdabrSource(
      lyadabbarooGroup5Text,
      surahNumber,
      ayahNumber,
      surahName,
      "كتاب «ليدبروا آياته» - المجموعة الخامسة"
    );
    for (const item of parsed5) {
      allInsights.push(item);
    }
  }

  // Deduplicate strictly identical texts while keeping distinct insights across groups
  const uniqueInsights: TdabrInsight[] = [];
  for (const item of allInsights) {
    const cleanItemText = cleanArabic(item.tadabburText);
    const existing = uniqueInsights.find((u) => {
      const cleanExistingText = cleanArabic(u.tadabburText);
      return cleanExistingText === cleanItemText;
    });

    if (existing) {
      if (!existing.source.includes(item.source)) {
        existing.source += ` | ${item.source}`;
      }
      if (!existing.title && item.title) {
        existing.title = item.title;
      }
      if (!existing.ayahText && item.ayahText) {
        existing.ayahText = item.ayahText;
      }
    } else {
      uniqueInsights.push({ ...item });
    }
  }

  return uniqueInsights;
}

/**
 * Returns comprehensive formatted Tadabbur text for an Ayah,
 * combining all available sources or providing deep thematic reflection.
 */
export function getOfflineTdabr(
  surahNumber: number,
  ayahNumber: number,
  surahNameInput?: string,
  ayahText?: string,
  bookType?: string,
  allowHeuristicFallback: boolean = false
): string | null {
  const surahMeta = surahsList.find((s) => s.number === surahNumber);
  const surahName = surahNameInput || (surahMeta ? surahMeta.name : "");

  // Check كتاب الجدول (Srf1Text & Srf2Data) if requested for Lubab
  if (bookType === "book_lubab") {
    const combinedJadwalText = ((Srf1Text || "") + "\n\n" + (Srf2Text || "")).trim();
    const matchedJadwalBlocks: string[] = [];
    if (combinedJadwalText) {
      const targetSurahNameClean = cleanArabic(surahName);
      const blocks = combinedJadwalText.split(/(?=\[(?:سورة|\d+)|(?:\r?\n){2,})/gi);
      for (const block of blocks) {
        const trimmed = block.trim();
        if (!trimmed || trimmed.startsWith("===") || trimmed.startsWith("المصدر:")) continue;

        let isMatch = false;
        const headerMatch = trimmed.match(/\[(?:سورة\s+)?([^\]\d]+)?\s*(\d+)[\:\s]*(\d+)?\]/i);
        if (headerMatch) {
          const namePart = headerMatch[1] ? cleanArabic(headerMatch[1]) : "";
          const num1 = parseInt(headerMatch[2], 10);
          const num2 = headerMatch[3] ? parseInt(headerMatch[3], 10) : null;
          if (num2 !== null) {
            if (num1 === surahNumber && num2 === ayahNumber) isMatch = true;
          } else {
            if (num1 === ayahNumber && (namePart.includes(targetSurahNameClean) || targetSurahNameClean.includes(namePart))) isMatch = true;
          }
        }
        if (!isMatch) {
          const lineMatch = trimmed.match(/(?:سورة\s+)?([^\d\n]+)?\s*(\d+)[\:\s]+(?:آية\s+)?(\d+)/i);
          if (lineMatch) {
            const namePart = lineMatch[1] ? cleanArabic(lineMatch[1]) : "";
            const sNum = parseInt(lineMatch[2], 10);
            const aNum = parseInt(lineMatch[3], 10);
            if ((sNum === surahNumber || namePart.includes(targetSurahNameClean)) && aNum === ayahNumber) {
              isMatch = true;
            }
          }
        }
        if (isMatch) {
          matchedJadwalBlocks.push(trimmed.replace(/^\[[^\]]+\]\s*/, "").trim());
        }
      }
    }

    if (matchedJadwalBlocks.length > 0) {
      return matchedJadwalBlocks.join("\n\n---\n\n").replace(/\*{1,3}/g, "");
    }
    const allInsights = getAllTdabrInsights(surahNumber, ayahNumber, surahName, ayahText);
    if (allInsights.length > 0) {
      return allInsights.map((i) => `اللمسة البيانية ودقة النظم:\n${i.tadabburText}`).join("\n\n---\n\n").replace(/\*{1,3}/g, "");
    }
    if (allowHeuristicFallback) {
      return `اللمسات البيانية ودقائق التعبير القرآني في الآية:\nتتجلى في هذه الآية الكريمة فصاحة النظم القرآني المعجز وإحكام دلالات الألفاظ واختيار المفردات في موضعها الأوفق للمعنى المراد، حيث جاء التعبير القرآني محكماً في بلاغته وإيجازه وتأثيره.`;
    }
    return null;
  }

  // General Tadabbur: Collect ALL insights for this ayah from the 5 canonical collections
  const allInsights = getAllTdabrInsights(surahNumber, ayahNumber, surahName, ayahText);

  // Generate multi-book insights incorporating all 5 groups
  const multiBookInsights = generateAllBooksTadabbur(
    surahNumber,
    ayahNumber,
    surahName,
    ayahText,
    allInsights
  );

  return formatMultiBookTadabbur(multiBookInsights, surahName, ayahNumber, ayahText)?.replace(/\*{1,3}/g, "") || null;
}
