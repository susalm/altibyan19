import { lyadabbarooGroup1Text } from "../data/lyadabbarooGroup1Data";
import { lyadabbarooGroup2Text } from "../data/lyadabbarooGroup2Data";
import { lyadabbarooGroup3Text } from "../data/lyadabbarooGroup3Data";
import { lyadabbarooGroup4Text } from "../data/lyadabbarooGroup4Data";
import { lyadabbarooGroup5Text } from "../data/lyadabbarooGroup5Data";
import { surahsList } from "../data/surahList";

export interface TdabrInsight {
  title: string;
  ayahText?: string;
  tadabburText: string;
  author: string;
  source: string;
  surahNumber?: number;
  ayahNumber?: number;
  groupNum?: number;
}

export interface TadabburSection {
  title?: string;
  content: string;
  author?: string;
  source?: string;
  bookName?: string;
  groupNum?: number;
}

export interface TdabrGroupInfo {
  num: number;
  id: string;
  title: string;
  shortTitle: string;
}

export const TDABR_GROUPS: TdabrGroupInfo[] = [
  { num: 1, id: "book_tadabbur_1", title: "ليدبروا آياته - المجموعة الأولى", shortTitle: "المجموعة الأولى" },
  { num: 2, id: "book_tadabbur_2", title: "ليدبروا آياته - المجموعة الثانية", shortTitle: "المجموعة الثانية" },
  { num: 3, id: "book_tadabbur_3", title: "ليدبروا آياته - المجموعة الثالثة", shortTitle: "المجموعة الثالثة" },
  { num: 4, id: "book_tadabbur_4", title: "ليدبروا آياته - المجموعة الرابعة", shortTitle: "المجموعة الرابعة" },
  { num: 5, id: "book_tadabbur_5", title: "ليدبروا آياته - المجموعة الخامسة", shortTitle: "المجموعة الخامسة" },
];

const groupMaps = new Map<number, Map<string, string[]>>();
const allGroupsMap = new Map<string, Array<{ groupNum: number; groupTitle: string; rawText: string }>>();
let isInitialized = false;

function cleanArabicName(name: string): string {
  return name
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u0671\u06D6-\u06ED]/g, "")
    .replace(/[أإآءٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

function normalizeForMatch(text: string): string {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u0671\u06D6-\u06ED]/g, "")
    .replace(/[أإآءٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\u0621-\u064A\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function initTdabr() {
  if (isInitialized) return;
  isInitialized = true;

  const rawGroups = [
    { num: 1, text: lyadabbarooGroup1Text, title: "ليدبروا آياته - المجموعة الأولى" },
    { num: 2, text: lyadabbarooGroup2Text, title: "ليدبروا آياته - المجموعة الثانية" },
    { num: 3, text: lyadabbarooGroup3Text, title: "ليدبروا آياته - المجموعة الثالثة" },
    { num: 4, text: lyadabbarooGroup4Text, title: "ليدبروا آياته - المجموعة الرابعة" },
    { num: 5, text: lyadabbarooGroup5Text, title: "ليدبروا آياته - المجموعة الخامسة" },
  ];

  for (const group of rawGroups) {
    const gMap = new Map<string, string[]>();
    groupMaps.set(group.num, gMap);

    if (!group.text) continue;
    const blocks = group.text.split(/(?=\[سورة\s+)/g);

    for (const b of blocks) {
      const trimmed = b.trim();
      if (!trimmed) continue;

      const match = trimmed.match(/\[سورة\s+([^\s\]]+)\s+(\d+)\]/);
      if (match) {
        const surahNameClean = cleanArabicName(match[1]);
        const ayahNum = Number(match[2]);
        const foundSurah = surahsList.find((s) => cleanArabicName(s.name) === surahNameClean);

        if (foundSurah) {
          const key = `${foundSurah.number}:${ayahNum}`;

          const existingInGroup = gMap.get(key) || [];
          existingInGroup.push(trimmed);
          gMap.set(key, existingInGroup);

          const existingInAll = allGroupsMap.get(key) || [];
          existingInAll.push({
            groupNum: group.num,
            groupTitle: group.title,
            rawText: trimmed,
          });
          allGroupsMap.set(key, existingInAll);
        }
      }
    }
  }
}

/**
 * Retrieves strictly authentic recorded Tadabbur insights from local "ليدبروا آياته" books.
 * Never returns synthetic generic placeholder text unless allowFallback is explicitly true.
 */
export function getOfflineTdabr(
  surahNumber: number,
  ayahNumber: number,
  surahName?: string,
  _ayahText?: string,
  mode?: string,
  allowFallback: boolean = false
): string {
  initTdabr();
  const key = `${surahNumber}:${ayahNumber}`;

  let targetGroup = 0;
  if (mode) {
    if (mode === "book_tadabbur_1" || mode.endsWith("_1")) targetGroup = 1;
    else if (mode === "book_tadabbur_2" || mode.endsWith("_2")) targetGroup = 2;
    else if (mode === "book_tadabbur_3" || mode.endsWith("_3")) targetGroup = 3;
    else if (mode === "book_tadabbur_4" || mode.endsWith("_4")) targetGroup = 4;
    else if (mode === "book_tadabbur_5" || mode.endsWith("_5")) targetGroup = 5;
  }

  // 1. Specific group requested
  if (targetGroup >= 1 && targetGroup <= 5) {
    const groupData = groupMaps.get(targetGroup)?.get(key);
    const grpInfo = TDABR_GROUPS.find((g) => g.num === targetGroup);
    const grpTitle = grpInfo?.title || `المجموعة ${targetGroup}`;

    if (groupData && groupData.length > 0) {
      return groupData.map((b) => `[${grpTitle}]\n${b}`).join("\n\n---\n\n");
    }

    if (allowFallback) {
      const otherGroupsWithData = TDABR_GROUPS.filter((g) => {
        if (g.num === targetGroup) return false;
        const d = groupMaps.get(g.num)?.get(key);
        return d && d.length > 0;
      });
      const sName = surahName || surahsList.find((s) => s.number === surahNumber)?.name || `السورة ${surahNumber}`;
      if (otherGroupsWithData.length > 0) {
        const otherNames = otherGroupsWithData.map((g) => g.shortTitle).join("، ");
        return `[تنبيه تدبري]\nالعنوان: لا توجد وقفة مدونة في ${grpTitle} لهذه الآية\nالتدبر: لم ترد وقفة تدبرية لهذه الآية الكريمة من سورة ${sName} في (${grpTitle}).\n\nتوجد وقفات تدبرية لهذه الآية في: ${otherNames}.`;
      }
    }
    return "";
  }

  // 2. All groups combined (book_tadabbur or default)
  const allEntries = allGroupsMap.get(key);
  if (allEntries && allEntries.length > 0) {
    return allEntries.map((e) => `[${e.groupTitle}]\n${e.rawText}`).join("\n\n---\n\n");
  }

  if (allowFallback) {
    return `[التفسير والتدبر والعمل]\nالعنوان: توثيق مصادر التدبر\nالتدبر: لم يرد نص تدبري مسجل محلياً لهذه الآية الكريمة، يرجى الاتصال بالإنترنت لجلب وقفات كتاب «التفسير والتدبر والعمل».\nالقائل: مركز تدبر للدراسات والبحوث القرآنية\nالمصدر: كتاب «ليدبروا آياته»`;
  }

  return "";
}

/**
 * Parses authentic "كتاب التفسير والتدبر والعمل" (tadabbur-wa-amal) page response
 * and extracts the authentic scholarly reflections matching this specific ayah.
 */
export function parseTadabburWaAmalForAyah(
  rawPageText: string,
  _surahNumber: number,
  ayahNumber: number,
  ayahText?: string
): string | null {
  if (!rawPageText || !rawPageText.trim()) return null;

  const stopSectionMatch = rawPageText.match(
    /الوقفات التدبرية\s*([\s\S]*?)(?=\n\s*(?:التوجيهات|العمل بالآيات|معاني الكلمات)\s*(?:\n|$)|$)/
  );
  const stopSection = stopSectionMatch ? stopSectionMatch[1].trim() : rawPageText.trim();

  // Split into numbered items: ١- ... , ٢- ... , etc.
  const rawItems = stopSection
    .split(/(?=(?:^|\n)\s*[٠-٩0-9]+\s*[-–—]\s*)/g)
    .map((s) => s.trim())
    .filter((s) => /^[٠-٩0-9]+\s*[-–—]/.test(s));

  if (rawItems.length === 0) return null;

  interface ParsedStop {
    quote: string;
    body: string;
    question: string;
    author: string;
    source: string;
    score: number;
  }

  const normAyah = normalizeForMatch(ayahText || "");
  const ayahWords = normAyah
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !/^(من|في|على|الى|عن|ما|لا|ان|او|ثم|قد)$/.test(w));

  const parsedStops: ParsedStop[] = rawItems.map((item) => {
    const cleanItem = item.replace(/^[٠-٩0-9]+\s*[-–—]\s*/, "").trim();

    // Extract first ﴿...﴾ quote as the verse reference title
    const firstQuoteMatch = cleanItem.match(/^﴿([^﴾]+?)﴾\s*([\s\S]*)$/);
    const quote = firstQuoteMatch ? firstQuoteMatch[1].replace(/[﴿﴾]/g, "").trim() : "";
    let rest = firstQuoteMatch ? firstQuoteMatch[2].replace(/^﴿\s*﴾\s*/, "").trim() : cleanItem;

    // Extract السؤال if present
    let question = "";
    const qMatch = rest.match(/\n\s*السؤال\s*[:：]\s*([\s\S]+)$/);
    if (qMatch) {
      question = qMatch[1].trim();
      rest = rest.slice(0, qMatch.index).trim();
    }

    // Extract scholarly citation [المؤلف: الجزء/الصفحة] at end of reflection
    let author = "علماء التفسير والتدبر";
    let source = "كتاب التفسير والتدبر والعمل";
    const citeMatch = rest.match(/\[([^\]]+)\]\s*[.،؛]?\s*$/);
    if (citeMatch) {
      const citeRaw = citeMatch[1].replace(/\.\s*$/, "").trim();
      rest = rest.slice(0, citeMatch.index).trim();
      const colonIdx = citeRaw.indexOf(":");
      if (colonIdx !== -1) {
        author = citeRaw.slice(0, colonIdx).trim();
        source = `التفسير والتدبر والعمل (${citeRaw})`;
      } else {
        author = citeRaw;
        source = `التفسير والتدبر والعمل (${citeRaw})`;
      }
    }

    // Score relevance to target ayah
    let score = 0;
    if (normAyah && quote) {
      const normQuote = normalizeForMatch(quote.replace(/\([٠-٩0-9]+\)/g, " "));
      if (normAyah.includes(normQuote) && normQuote.length >= 8) {
        score += 100;
      } else if (normQuote.includes(normAyah) && normAyah.length >= 8) {
        score += 90;
      } else if (ayahWords.length > 0) {
        const quoteWords = normQuote.split(/\s+/);
        let hits = 0;
        for (const w of ayahWords) {
          if (quoteWords.includes(w)) hits++;
        }
        // Boost if contiguous 2-word phrase from ayah appears in quote
        for (let i = 0; i < ayahWords.length - 1; i++) {
          if (normQuote.includes(`${ayahWords[i]} ${ayahWords[i + 1]}`)) {
            hits += 2;
          }
        }
        const ratio = hits / Math.max(ayahWords.length, 1);
        if (hits >= 2 && ratio >= 0.35) {
          score += Math.round(ratio * 60) + hits;
        }
      }
      // Also check explicit verse number marker inside multi-ayah quotes e.g. "(٣)" ONLY if there was already text overlap
      if (score > 0) {
        const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
        const arAyah = String(ayahNumber).replace(/\d/g, (d) => arabicDigits[Number(d)]);
        if (quote.includes(`(${arAyah})`) || quote.includes(`(${ayahNumber})`)) {
          score += 25;
        }
      }
    }

    return {
      quote,
      body: rest,
      question,
      author,
      source,
      score,
    };
  });

  // Prefer ayah-specific matches; fallback to top page reflections if this specific ayah has no dedicated stop on the page
  const directMatches = parsedStops
    .filter((s) => s.score >= 20 && s.body)
    .sort((a, b) => b.score - a.score);

  const selected =
    directMatches.length > 0
      ? directMatches
      : parsedStops.filter((s) => s.body).slice(0, 3);

  if (selected.length === 0) return null;

  const headerTag =
    directMatches.length > 0
      ? "التفسير والتدبر والعمل"
      : "التفسير والتدبر والعمل (وقفات الصفحة)";

  return selected
    .map((s) => {
      const titleText = s.quote ? `﴿${s.quote}﴾` : "وقفة تدبرية";
      const contentText = s.question ? `${s.body}\nالسؤال التدبري: ${s.question}` : s.body;
      return `[${headerTag}]\nالعنوان: ${titleText}\nالتدبر: ${contentText}\nالقائل: ${s.author}\nالمصدر: ${s.source}`;
    })
    .join("\n\n---\n\n");
}

export function parseTadabburSections(rawText: string): TadabburSection[] {
  if (!rawText) return [];

  const rawTrimmed = rawText.trim();
  let entries: string[] = [];

  if (rawTrimmed.includes("---") || rawTrimmed.includes("===")) {
    entries = rawTrimmed.split(/\n\s*---\s*\n|\n\s*===+\s*\n/g);
  } else {
    const surahMatches = rawTrimmed.match(/\[سورة\s+/g);
    if (!surahMatches || surahMatches.length <= 1) {
      entries = [rawTrimmed];
    } else {
      const rawBlocks = rawTrimmed.split(/(?=\[سورة\s+)/g);
      if (rawBlocks.length > 1 && !rawBlocks[0].startsWith("[سورة")) {
        const header = rawBlocks[0].trim();
        const remaining = rawBlocks.slice(1);
        remaining[0] = header + "\n" + remaining[0];
        entries = remaining;
      } else {
        entries = rawBlocks;
      }
    }
  }

  const sections: TadabburSection[] = [];

  for (const e of entries) {
    const trimmed = e.trim();
    if (!trimmed) continue;

    let bookName = "";
    let groupNum = 0;
    const groupMatch = trimmed.match(
      /\[(ليدبروا آياته\s*-\s*المجموعة\s*[^\]]+|المجموعة\s*[^\]]+|التفسير والتدبر والعمل[^\]]*)\]/
    );
    if (groupMatch) {
      bookName = groupMatch[1].trim();
      if (bookName.includes("الأولى") || bookName.includes("١") || bookName.includes("1")) groupNum = 1;
      else if (bookName.includes("الثانية") || bookName.includes("٢") || bookName.includes("2")) groupNum = 2;
      else if (bookName.includes("الثالثة") || bookName.includes("٣") || bookName.includes("3")) groupNum = 3;
      else if (bookName.includes("الرابعة") || bookName.includes("٤") || bookName.includes("4")) groupNum = 4;
      else if (bookName.includes("الخامسة") || bookName.includes("٥") || bookName.includes("5")) groupNum = 5;
    }

    const titleMatch = trimmed.match(/^العنوان:\s*([^\n\r]+)/m);
    const authorExplicitMatch = trimmed.match(/^القائل:\s*([^\n\r]+)/m);
    const sourceExplicitMatch = trimmed.match(/^المصدر:\s*([^\n\r]+)/m);
    const contentMatch = trimmed.match(/^التدبر:\s*([\s\S]+?)(?=(?:\n(?:القائل|المصدر):|$))/m);

    let content = contentMatch ? contentMatch[1].trim() : trimmed;
    content = content
      .replace(/\[(?:ليدبروا آياته|المجموعة|التفسير والتدبر والعمل|سورة|وقفة|تنبيه)[^\]]*\]\s*/g, "")
      .replace(/^العنوان:[^\n]+\n*/, "")
      .replace(/^الآية:[^\n]+\n*/, "")
      .replace(/^القائل:[^\n]+\n*/gm, "")
      .replace(/^المصدر:[^\n]+\n*/gm, "")
      .trim();

    let author = authorExplicitMatch ? authorExplicitMatch[1].trim() : "";
    let source = sourceExplicitMatch ? sourceExplicitMatch[1].trim() : bookName || "مركز تدبر";

    if (!author) {
      const parenMatch = content.match(/\(([^)]+)\)\s*$/);
      if (parenMatch) {
        const cite = parenMatch[1].trim();
        content = content.slice(0, content.lastIndexOf(parenMatch[0])).trim();

        if (cite.includes("-")) {
          const parts = cite.split("-").map((p) => p.trim());
          author = parts[0];
          if (!sourceExplicitMatch) {
            source = parts.slice(1).join(" - ");
          }
        } else {
          author = cite;
        }
      }
    }

    if (!author && trimmed.includes("مركز تدبر")) {
      author = "مركز تدبر للدراسات والبحوث القرآنية";
    }

    if (!source) {
      source = bookName || "كتاب ليدبروا آياته";
    }

    sections.push({
      title: titleMatch ? titleMatch[1].trim() : "وقفة تدبرية",
      content,
      author,
      source,
      bookName: bookName || (groupNum ? `ليدبروا آياته - المجموعة ${groupNum}` : "كتاب التفسير والتدبر والعمل"),
      groupNum,
    });
  }

  if (sections.length === 0 && rawTrimmed) {
    sections.push({
      title: "وقفة تدبرية",
      content: rawTrimmed,
      author: "مركز تدبر للدراسات والبحوث القرآنية",
      source: "كتاب ليدبروا آياته",
    });
  }

  return sections;
}
