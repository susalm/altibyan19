import { surahsList } from "../data/surahList";
import { tafsirAysarText } from "../data/tafsirAysarData";
import aysarFullJson from "../data/aysar_full.json";
import mukhtasarFullJson from "../data/mukhtasar_full.json";
import { getOfflineGharib } from "./gharibBook";
import { getOfflineTdabr } from "./tdabrBook";

interface AyahTafsirMap {
  [ayahNumber: number]: string;
}

interface AysarPassage {
  startAyah: number;
  endAyah: number;
  content: string;
}

const rawAysarDict = aysarFullJson as Record<string, string>;
const rawMukhtasarDict = mukhtasarFullJson as Record<string, string>;

let aysarCache: Map<number, AyahTafsirMap> | null = null;
let surahPassageMap: Map<number, AysarPassage[]> | null = null;

function normalizeName(str: string): string {
  return str
    .replace(/[\u064B-\u065F]/g, "") // remove tashkeel
    .replace(/[أإآء]/g, "ا")
    .replace(/ة\b/g, "ه")
    .trim();
}

function parseAysarText(): Map<number, AyahTafsirMap> {
  if (aysarCache) return aysarCache;

  const result = new Map<number, AyahTafsirMap>();
  if (!tafsirAysarText) return result;

  const surahBlocks = tafsirAysarText.split(/(?=سورة\s+)/g);

  for (const block of surahBlocks) {
    const firstLine = block.trim().split("\n")[0] || "";
    if (!firstLine.startsWith("سورة")) continue;

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

  aysarCache = result;
  return result;
}

// Stitch passages cleanly and build fast index
function getSurahPassageMap(): Map<number, AysarPassage[]> {
  if (surahPassageMap) return surahPassageMap;

  const sortedKeys = Object.keys(rawAysarDict).sort((a, b) => {
    const [s1, a1] = a.split(":").map(Number);
    const [s2, a2] = b.split(":").map(Number);
    return s1 !== s2 ? s1 - s2 : a1 - a2;
  });

  const stitchedDict: Record<string, string> = {};

  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const text = rawAysarDict[key];
    const ayahMatch = text.search(/\{[^\}]+\(\d+\)/);

    if (i > 0 && ayahMatch > 0) {
      const prevKey = sortedKeys[i - 1];
      const prevSurah = parseInt(prevKey.split(":")[0], 10);
      const currSurah = parseInt(key.split(":")[0], 10);

      // Only transfer preamble if both keys belong to the same surah
      if (prevSurah === currSurah) {
        const preamble = text.slice(0, ayahMatch).trim();
        const currentBody = text.slice(ayahMatch).trim();
        stitchedDict[prevKey] = (stitchedDict[prevKey] || rawAysarDict[prevKey]) + "\n\n" + preamble;
        stitchedDict[key] = currentBody;
        continue;
      }
    }

    if (!stitchedDict[key]) {
      stitchedDict[key] = text;
    }
  }

  const map = new Map<number, AysarPassage[]>();

  // Group start ayahs by surah
  const surahKeyMap = new Map<number, number[]>();
  for (const key of sortedKeys) {
    const [s, a] = key.split(":").map(Number);
    if (!surahKeyMap.has(s)) surahKeyMap.set(s, []);
    surahKeyMap.get(s)!.push(a);
  }

  for (const [s, startAyahs] of surahKeyMap.entries()) {
    const sMeta = surahsList.find((x) => x.number === s);
    const totalAyahs = sMeta ? sMeta.numberOfAyahs : 999;
    const passages: AysarPassage[] = [];

    for (let i = 0; i < startAyahs.length; i++) {
      const start = startAyahs[i];
      let end: number;
      if (i + 1 < startAyahs.length) {
        end = startAyahs[i + 1] - 1;
      } else {
        // Special case: Surah 5 in aysar_full covers up to Ayah 14
        if (s === 5) {
          end = 14;
        } else {
          end = totalAyahs;
        }
      }
      if (end < start) end = start;
      const key = `${s}:${start}`;
      passages.push({
        startAyah: start,
        endAyah: end,
        content: stitchedDict[key] || rawAysarDict[key],
      });
    }

    map.set(s, passages);
  }

  surahPassageMap = map;
  return map;
}

function formatAysarContent(rawText: string): string {
  let text = rawText.trim();

  // Separate footnotes if present
  let mainBody = text;
  let footnotes = "";
  const fnIndex = text.search(/_{5,}/);
  if (fnIndex !== -1) {
    mainBody = text.slice(0, fnIndex).trim();
    footnotes = text.slice(fnIndex).replace(/_{5,}/g, "").trim();
  }

  // Format headers cleanly into Markdown
  mainBody = mainBody
    .replace(/^\{([^}]+)\}/m, "> الآيات الكريمة: { $1 }\n\n")
    .replace(/شرح الكلمات\s*:/g, "\n\n### 🔍 شرح الكلمات:\n")
    .replace(/معنى الآيات\s*:/g, "\n\n### 💡 معنى الآيات:\n")
    .replace(/معنى الآيتين\s*:/g, "\n\n### 💡 معنى الآيتين:\n")
    .replace(/معنى الآية\s*:/g, "\n\n### 💡 معنى الآية:\n")
    .replace(/مناسبة الآيتين لما قبلهما ومعناهما\s*:/g, "\n\n### 💡 المعنى والمناسبة:\n")
    .replace(/مناسبة الآيات لما قبلها ومعناها\s*:/g, "\n\n### 💡 المعنى والمناسبة:\n")
    .replace(/(?:من\s+)?هداية الآيات\s*:/g, "\n\n### 🌱 من هداية الآيات:\n")
    .replace(/(?:من\s+)?هداية الآيتين\s*:/g, "\n\n### 🌱 من هداية الآيتين:\n")
    .replace(/(?:من\s+)?هداية الآية\s*:/g, "\n\n### 🌱 من هداية الآية:\n");

  let result = `أيسر التفاسير لكلام العلي الكبير - فضيلة الشيخ أبو بكر الجزائري رحمه الله\n\n` + mainBody;
  if (footnotes) {
    result += `\n\n---\nالهوامش والتحقيقات العلمية:\n` + footnotes;
  }
  return result.replace(/\*{1,3}/g, "");
}

export function getOfflineAysarTafsir(
  surahNumber: number,
  ayahNumber: number
): string | null {
  const map = getSurahPassageMap();
  const passages = map.get(surahNumber);
  if (passages && passages.length > 0) {
    const matched = passages.find(
      (p) => ayahNumber >= p.startAyah && ayahNumber <= p.endAyah
    );
    if (matched && matched.content) {
      return formatAysarContent(matched.content)?.replace(/\*{1,3}/g, "") || null;
    }
  }

  // Check fallback mini dictionary (tafsirAysarText)
  const cache = parseAysarText();
  const surahMap = cache.get(surahNumber);
  if (surahMap && surahMap[ayahNumber]) {
    return (`أيسر التفاسير لكلام العلي الكبير - فضيلة الشيخ أبو بكر الجزائري رحمه الله\n\n` + surahMap[ayahNumber]).replace(/\*{1,3}/g, "");
  }

  return null;
}

export function getOfflineAysarTafsirFallback(
  surahNumber: number,
  ayahNumber: number,
  surahName?: string,
  ayahText?: string
): string {
  const sName = surahName || (surahsList.find(s => s.number === surahNumber)?.name) || `سورة ${surahNumber}`;
  const key = `${surahNumber}:${ayahNumber}`;

  // 1. Check authentic exegesis from Mukhtasar full dataset
  const mukhtasarText = rawMukhtasarDict[key];
  // 2. Check authentic vocabulary from Al-Siraj Gharib dataset
  const gharibText = getOfflineGharib(surahNumber, ayahNumber, sName, ayahText);
  // 3. Check authentic spiritual reflections from Tadabbur dataset
  const tdabrText = getOfflineTdabr(surahNumber, ayahNumber, sName, ayahText);

  const shortSurahsTafsir: Record<string, string> = {
    "108:1": "إنا أعطيناك يا محمد الخير الكثير والفضل العميم، ومنه نهر الكوثر في الجنة.",
    "108:2": "فأخلص لربك صلاتك كلها، واذبح ذبيحتك له وحده شكراً على نعمه.",
    "108:3": "إن مبغضك وشانئك هو المنقطع أثره، المقطوع من كل خير.",
    "109:1": "قل يا أيها الكافرون بالله ورسوله.",
    "109:2": "لا أعبد ما تعبدون من الأصنام والآلهة الباطلة.",
    "109:3": "ولا أنتم عابدون ما أعبد وهو الله وحده لا شريك له.",
    "109:4": "ولا أنا عابد ما عبدتم من قبل.",
    "109:5": "ولا أنتم عابدون ما أعبد.",
    "109:6": "لكم دينكم الباطل ولِيَ ديني الحق الذي لا أبتغي غيره.",
    "110:1": "إذا تم لك يا محمد فتح مكة ونصرك الله على أعدائك.",
    "110:2": "ورأيت الناس يدخلون في دين الله أفواجاً وجماعات بعد أن كانوا يدخلون فرادى.",
    "110:3": "فسبح بحمد ربك معظماً له وشاكراً لنعمته، واستغفره إنه كان تواباً على المستغفرين.",
    "111:1": "خسرت يدا أبي لهب وهلك، وخسر هو نفسه.",
    "111:2": "ما أغنى عنه ماله الذي جمعه ولا كسبه وولده من عذاب الله شيئاً.",
    "111:3": "سيدخل ناراً ذات لهب شديد يوم القيامة.",
    "111:4": "وتدخل معه امرأته أم جميل حمالة الحطب التي كانت تؤذي النبي صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ.",
    "111:5": "في عنقها حبل محكم من ليف تُعذب به في النار.",
    "112:1": "قل يا محمد: هو الله المنفرد بالألوهية، الواحد الأحد الذي لا شريك له ولا نظير.",
    "112:2": "الله السيد الكامل الذي تصمد إليه الخلائق في جميع حوائجها ورغائبها.",
    "112:3": "لم يلد أحداً ولم يولد من أحد، منزه عن الولد والوالد.",
    "112:4": "ولم يكن له كفؤاً ولا مماثلاً أحد من خلقه بوجه من الوجوه.",
    "113:1": "قل: أعوذ وألتجئ برب الفلق وهو الصبح إذا انفلق عنه الليل.",
    "113:2": "من شر جميع ما خلق من الإنس والجن والدواب والآفات.",
    "113:3": "ومن شر ليل إذا دخل بظلامه وما ينتشر فيه من الشرور.",
    "113:4": "ومن شر السواحر اللاتي يعقدن العقد وينفثن فيها بالسحر.",
    "113:5": "ومن شر حاسد إذا حسد وتمنى زوال النعمة عن غيره.",
    "114:1": "قل: أعوذ وأعتصم برب الناس، خالقهم ومدبر أمورهم.",
    "114:2": "ملك الناس، المتصرف فيهم بما يشاء لا رب لهم ولا ملك سواه.",
    "114:3": "إله الناس، معبودهم الحق الذي لا معبود سواه بحق.",
    "114:4": "من شر الشيطان الموسوس في الصدور، الخناس الذي يختفي ويخنس إذا ذكر الله.",
    "114:5": "الذي يلقي الشبه والشهوات في صدور الناس ويزين لهم الباطل.",
    "114:6": "من شياطين الجن وشياطين الإنس."
  };

  if (shortSurahsTafsir[key]) {
    return shortSurahsTafsir[key];
  }

  if (mukhtasarText) {
    return mukhtasarText.trim();
  }

  return `بيان معاني الآية الكريمة ومقاصدها وهداياتها في التوحيد والعمل الصالح والتزام أمر الله تعالى.`;
}

