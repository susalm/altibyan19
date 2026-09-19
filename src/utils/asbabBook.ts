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

const normalize = (text: string) => {
  return text
    .replace(/[\u064B-\u065F]/g, "") // Remove diacritics
    .replace(/[أإآء]/g, "ا")        // Normalize alef/hamza
    .replace(/ة\b/g, "ه");          // Normalize ta marbuta
};

export function getOfflineAsbab(
  surahNumber: number,
  ayahNumber: number,
  surahNameInput?: string,
  _ayahText?: string
): string | null {
  const surahMeta = surahsList.find((s) => s.number === surahNumber);
  const surahName = surahNameInput || (surahMeta ? surahMeta.name : `سورة رقم ${surahNumber}`);

  const muharrarAsbabText = getMuharrarAsbabText();
  if (!muharrarAsbabText) {
    return null;
  }

  const content = muharrarAsbabText;
  const cleanContent = normalize(content);

  const surahKeys: { [key: number]: string } = {
    2: "سورة البقرة",
    3: "سورة ال عمران",
    4: "سورة النساء",
    5: "سورة المائدة",
    6: "سورة الانعام",
    7: "سورة الاعراف",
    8: "سورة الانفال",
    9: "سورة التوبة",
    11: "سورة هود",
    13: "سورة الرعد",
    14: "سورة ابراهيم",
    15: "سورة الحجر",
    16: "سورة النحل",
    18: "سورة الكهف",
    19: "سورة مريم",
    22: "سورة الحج",
    23: "سورة المؤمنون",
    24: "سورة النور",
    25: "سورة الفرقان",
    28: "سورة القصص",
    29: "سورة العنكبوت",
    30: "سورة الروم",
    31: "سورة لقمان",
    33: "سورة الاحزاب",
    36: "سورة يس",
    38: "سورة ص",
    39: "سورة الزمر",
    41: "سورة فصلت",
    42: "سورة الشورى",
    43: "سورة الزخرف",
    44: "سورة الدخان",
    46: "سورة الاحقاف",
    48: "سورة الفتح",
    61: "سورة الصف",
    62: "سورة الجمعة",
    63: "سورة المنافقون",
    64: "سورة التغابن",
    66: "سورة التحريم",
    93: "سورة الضحى",
    96: "سورة العلق",
    97: "سورة القدر",
    108: "سورة الكوثر",
    111: "سورة المسد",
    112: "سورة الاخلاص"
  };

  const key = surahKeys[surahNumber];
  if (key) {
    const normalizedKey = normalize(key);
    const surahIndex = cleanContent.indexOf(normalizedKey);
    if (surahIndex !== -1) {
      let nextSurahIndex = cleanContent.length;
      for (const k of Object.values(surahKeys)) {
        const normK = normalize(k);
        const idx = cleanContent.indexOf(normK, surahIndex + normalizedKey.length);
        if (idx !== -1 && idx < nextSurahIndex) {
          nextSurahIndex = idx;
        }
      }

      const surahSection = content.substring(surahIndex, nextSurahIndex);
      const itemRegex = /(?:\r?\n|^)(\d+\s*-\s*قال\s+الله\s+تعالى:[\s\S]*?)(?=(?:\r?\n\d+\s*-\s*قال\s+الله\s+تعالى:)|$)/g;
      let match;
      while ((match = itemRegex.exec(surahSection)) !== null) {
        const itemText = match[1];
        const parenRegex = new RegExp(`\\(\\s*${ayahNumber}\\s*\\)`);
        if (parenRegex.test(itemText)) {
          return `### 📖 المصدر: كتاب المحرر في أسباب النزول (د. خالد المزيني)\n\n${itemText.trim()}`;
        }
      }

      const paragraphs = surahSection.split(/\r?\n\r?\n/);
      for (const para of paragraphs) {
        if (para.includes(`(${ayahNumber})`)) {
          return `### 📖 المصدر: كتاب المحرر في أسباب النزول (د. خالد المزيني)\n\n${para.trim()}`;
        }
      }
    }
  }

  return `### 📖 المصدر: كتاب المحرر في أسباب النزول (د. خالد بن سليمان المزيني)
لم يثبت سبب نزول صريح وخاص بالآية الكريمة رقم ${ayahNumber} من سورة ${surahName} في المراجع الحديثية المعتمدة في كتاب المحرر، وتعتبر الآية نازلة ابتداءً في الهداية والأحكام العامة.`;
}
