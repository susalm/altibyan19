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

// Group-specific map: group number -> map of "surahNum:ayahNum" -> array of blocks
const groupMaps = new Map<number, Map<string, string[]>>();
// Combined map: "surahNum:ayahNum" -> array of items with group tag
const allGroupsMap = new Map<string, Array<{ groupNum: number; groupTitle: string; rawText: string }>>();
let isInitialized = false;

function cleanArabicName(name: string): string {
  return name.replace(/[أإآء]/g, "ا").replace(/[\u064B-\u065F]/g, "").trim();
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

          // Add to individual group map
          const existingInGroup = gMap.get(key) || [];
          existingInGroup.push(trimmed);
          gMap.set(key, existingInGroup);

          // Add to all groups aggregated map
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

export function getOfflineTdabr(
  surahNumber: number,
  ayahNumber: number,
  surahName?: string,
  _ayahText?: string,
  mode?: string,
  _allowFallback?: boolean
): string {
  initTdabr();
  const key = `${surahNumber}:${ayahNumber}`;

  // Detect which group is requested (1 to 5) or all
  let targetGroup = 0;
  if (mode) {
    if (mode === "book_tadabbur_1" || mode.endsWith("_1")) targetGroup = 1;
    else if (mode === "book_tadabbur_2" || mode.endsWith("_2")) targetGroup = 2;
    else if (mode === "book_tadabbur_3" || mode.endsWith("_3")) targetGroup = 3;
    else if (mode === "book_tadabbur_4" || mode.endsWith("_4")) targetGroup = 4;
    else if (mode === "book_tadabbur_5" || mode.endsWith("_5")) targetGroup = 5;
  }

  // 1. If a specific group is requested
  if (targetGroup >= 1 && targetGroup <= 5) {
    const groupData = groupMaps.get(targetGroup)?.get(key);
    const grpInfo = TDABR_GROUPS.find(g => g.num === targetGroup);
    const grpTitle = grpInfo?.title || `المجموعة ${targetGroup}`;

    if (groupData && groupData.length > 0) {
      return groupData.map(b => `[${grpTitle}]\n${b}`).join("\n\n---\n\n");
    }

    // If this specific group doesn't have an entry for this ayah, check if other groups have it
    const otherGroupsWithData = TDABR_GROUPS.filter(g => {
      if (g.num === targetGroup) return false;
      const d = groupMaps.get(g.num)?.get(key);
      return d && d.length > 0;
    });

    const sName = surahName || surahsList.find((s) => s.number === surahNumber)?.name || `السورة ${surahNumber}`;
    if (otherGroupsWithData.length > 0) {
      const otherNames = otherGroupsWithData.map(g => g.shortTitle).join("، ");
      return `[تنبيه تدبري]\nالعنوان: لا توجد وقفة مدونة في ${grpTitle} لهذه الآية\nالتدبر: لم ترد وقفة تدبرية لهذه الآية الكريمة من سورة ${sName} في (${grpTitle}).\n\n💡 توجد وقفات تدبرية لهذه الآية في: ${otherNames}.\nيمكنك التبديل إلى أحد هذه الكتب أو اختيار (المجموعات ١ - ٥ كاملة) لعرض كافة اللطائف والوقفات الواردة في الآية.`;
    }

    return `[وقفة تدبرية]\nالعنوان: هدايات الآية الكريمة\nالتدبر: تتضمن هذه الآية الكريمة من سورة ${sName} هدايات إيمانية جليلة تدعو إلى تعظيم أمر الله واستشعار عظمته وتدبر آياته ومقاصد تنزيله، والعمل بمقتضى أمره واجتناب نهيه.\n(مركز تدبر للدراسات القرآنية)`;
  }

  // 2. All groups combined (book_tadabbur or default)
  const allEntries = allGroupsMap.get(key);
  if (allEntries && allEntries.length > 0) {
    return allEntries.map(e => `[${e.groupTitle}]\n${e.rawText}`).join("\n\n---\n\n");
  }

  const sName = surahName || surahsList.find((s) => s.number === surahNumber)?.name || `السورة ${surahNumber}`;
  return `[وقفة تدبرية]\nالعنوان: هدايات الآية الكريمة\nالتدبر: تتضمن هذه الآية الكريمة من سورة ${sName} هدايات إيمانية جليلة تدعو إلى تعظيم أمر الله واستشعار عظمته وتدبر آياته ومقاصد تنزيله، والعمل بمقتضى أمره واجتناب نهيه.\n(مركز تدبر للدراسات والبحوث القرآنية)`;
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

    // Detect group / book title
    let bookName = "";
    let groupNum = 0;
    const groupMatch = trimmed.match(/\[(ليدبروا آياته\s*-\s*المجموعة\s*[^\]]+|المجموعة\s*[^\]]+)\]/);
    if (groupMatch) {
      bookName = groupMatch[1].trim();
      if (bookName.includes("الأولى") || bookName.includes("١") || bookName.includes("1")) groupNum = 1;
      else if (bookName.includes("الثانية") || bookName.includes("٢") || bookName.includes("2")) groupNum = 2;
      else if (bookName.includes("الثالثة") || bookName.includes("٣") || bookName.includes("3")) groupNum = 3;
      else if (bookName.includes("الرابعة") || bookName.includes("٤") || bookName.includes("4")) groupNum = 4;
      else if (bookName.includes("الخامسة") || bookName.includes("٥") || bookName.includes("5")) groupNum = 5;
    }

    const titleMatch = trimmed.match(/العنوان:\s*([^\n\r]+)/);
    const contentMatch = trimmed.match(/التدبر:\s*([\s\S]+)/);

    let content = contentMatch ? contentMatch[1].trim() : trimmed;
    // Clean headers and title lines from content
    content = content
      .replace(/\[(?:ليدبروا آياته|المجموعة|سورة|وقفة|تنبيه)[^\]]*\]\s*/g, "")
      .replace(/^العنوان:[^\n]+\n*/, "")
      .replace(/^الآية:[^\n]+\n*/, "")
      .trim();

    let author = "";
    let source = bookName || "مركز تدبر";

    const parenMatch = content.match(/\(([^)]+)\)\s*$/);
    if (parenMatch) {
      const cite = parenMatch[1].trim();
      content = content.slice(0, content.lastIndexOf(parenMatch[0])).trim();

      if (cite.includes("-")) {
        const parts = cite.split("-").map((p) => p.trim());
        author = parts[0];
        source = parts.slice(1).join(" - ");
      } else {
        author = cite;
      }
    }

    if (!author && trimmed.includes("مركز تدبر")) {
      author = "مركز تدبر للدراسات والبحوث القرآنية";
    }

    if (!source) {
      source = bookName || "كتاب ليدبروا آياته";
    }

    sections.push({
      title: titleMatch ? titleMatch[1].trim() : "لطيفة تدبرية",
      content,
      author,
      source,
      bookName: bookName || (groupNum ? `ليدبروا آياته - المجموعة ${groupNum}` : "كتاب ليدبروا آياته"),
      groupNum,
    });
  }

  if (sections.length === 0 && rawTrimmed) {
    sections.push({ 
      title: "وقفة تدبرية",
      content: rawTrimmed,
      author: "مركز تدبر للدراسات والبحوث القرآنية",
      source: "كتاب ليدبروا آياته"
    });
  }

  return sections;
}
