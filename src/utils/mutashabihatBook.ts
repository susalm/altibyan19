import { surahsList } from "../data/surahList";
import { dalilMutashabihatText as mutashabihatRawText } from "../data/dalilMutashabihatData";

function cleanArabic(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u064B-\u065F\u0670\u0671]/g, "") // remove diacritics & superscript alef
    .replace(/[أإآءٱ]/g, "ا")             // normalize alef variants
    .replace(/ة/g, "ه")                  // ta marbuta to ha
    .replace(/ى/g, "ي")                  // alef maqsura to ya
    .replace(/^سورة\s+/, "")             // strip "سورة" prefix
    .replace(/^سوره\s+/, "")
    .replace(/[\(\)\[\]:.\-_]/g, "")     // punctuation
    .trim();
}

function matchSurahNames(surahNum: number, canonicalName: string, lineSurahStr: string): boolean {
  const cNorm = cleanArabic(canonicalName);
  const lNorm = cleanArabic(lineSurahStr);
  if (!cNorm || !lNorm) return false;
  if (cNorm === lNorm) return true;

  const cNoAl = cNorm.replace(/^ال/, "");
  const lNoAl = lNorm.replace(/^ال/, "");
  if (cNoAl && lNoAl && cNoAl === lNoAl) return true;

  // Special surah alias cases
  if (surahNum === 9 && (lNorm.includes("براءه") || lNorm.includes("توبه"))) return true;
  if (surahNum === 17 && (lNorm.includes("اسراء") || lNorm.includes("بني اسرائيل"))) return true;
  if (surahNum === 76 && (lNorm.includes("انسان") || lNorm.includes("دهر"))) return true;
  if (surahNum === 94 && (lNorm.includes("شرح") || lNorm.includes("انشراح"))) return true;
  if (surahNum === 111 && (lNorm.includes("مسد") || lNorm.includes("لهب") || lNorm.includes("تبت"))) return true;

  return lNorm.includes(cNoAl) || cNorm.includes(lNoAl);
}

let fileContentCache: string | null = null;

export function getBookText(): string {
  if (fileContentCache) return fileContentCache;
  if (mutashabihatRawText) {
    fileContentCache = mutashabihatRawText;
    return fileContentCache;
  }
  return "";
}

/**
 * Searches the book "دليل المتشابهات اللفظية في القرآن الكريم - د محمد بن عبد الله الصغير"
 * for a given Surah number and Ayah number.
 */
export function getOfflineMutashabihat(
  surahNumber: number,
  ayahNumber: number,
  surahNameInput?: string,
  _ayahText?: string,
  bookType?: string
): string {
  const surahMeta = surahsList.find((s) => s.number === surahNumber);
  const surahName = surahNameInput || (surahMeta ? surahMeta.name : "");

  let bookTitle = "دليل المتشابهات اللفظية في القرآن الكريم";
  let authorName = "د. محمد بن عبد الله الصغير (دار طيبة للنشر والتوزيع)";
  if (bookType === "book_taqeeda_saghir") {
    bookTitle = "كتاب الضبط بالتقعيد للمتشابهات اللفظية";
    authorName = "الشيخ فواز الصغير / د. محمد بن عبد الله الصغير";
  } else if (bookType === "book_durrat_tanzil") {
    bookTitle = "درة التنزيل وغرة التأويل في المتشابهات";
    authorName = "الخطيب الإسكافي";
  } else if (bookType === "book_malak_tawil") {
    bookTitle = "ملاك التأويل القاطع بجميع التساؤلات";
    authorName = "ابن الزبير الغرناطي";
  }

  const content = getBookText();
  if (!content) {
    return "( لا يوجد متشابه لفظي لهذه الاية )";
  }

  const rawBlocks = content.split(/\n\s*\n/);
  const matchedBlocks: string[][] = [];

  for (const block of rawBlocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let matchedInBlock = false;

    for (const line of lines) {
      // Ignore header or intro lines
      if (
        line.startsWith("[") ||
        line.startsWith("دليل") ||
        line.startsWith("في القرآن") ||
        line.startsWith("دار طيبة") ||
        line.startsWith("المقدمة")
      ) {
        continue;
      }

      const m = line.match(/^([^\d:]+)\s+(\d+):?/);
      if (m) {
        const lineSurahStr = m[1].trim();
        const lineAyah = parseInt(m[2], 10);
        if (lineAyah === ayahNumber && matchSurahNames(surahNumber, surahName, lineSurahStr)) {
          matchedInBlock = true;
          break;
        }
      }
    }

    if (matchedInBlock) {
      const cleanLines = lines.filter(
        (l) =>
          !l.startsWith("[") &&
          !l.startsWith("دليل") &&
          !l.startsWith("في القرآن") &&
          !l.startsWith("دار طيبة") &&
          !l.startsWith("المقدمة")
      );
      if (cleanLines.length > 0) {
        matchedBlocks.push(cleanLines);
      }
    }
  }

  if (matchedBlocks.length > 0) {
    const header = `"${bookTitle}"
تأليف: ${authorName}

سورة ${surahName} - آية ${ayahNumber}:
`;

    const formattedBlocks = matchedBlocks
      .map((b, idx) => {
        const bText = b
          .map((line) => {
            const cleanLine = line.replace(/[*_]/g, "").trim();
            const parts = cleanLine.split(":");
            if (parts.length >= 2) {
              const ref = parts[0].trim();
              const txt = parts.slice(1).join(":").trim().replace(/^[\s\(\{«]+|[\s\)\}»]+$/g, "");
              return `${ref}: (${txt})`;
            }
            return cleanLine;
          })
          .join("\n");

        return matchedBlocks.length > 1 ? `الموضع المتشابه (${idx + 1}):\n${bText}` : bText;
      })
      .join("\n\n---\n\n");

    const footer = `\n\n---\n📚 المصدر: كتاب (${bookTitle} - ${authorName}).`;

    return header + "\n" + formattedBlocks + footer;
  }

  return "( لا يوجد متشابه لفظي لهذه الاية )";
}
