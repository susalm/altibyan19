import React, { useState, useEffect, useRef } from "react";
import { fetchAlquranCloud, fetchTafsirData } from "../utils/quranApi";
import { getOfflineMukhtasarTafsir, getOfflineMukhtasarTafsirFallback } from "../utils/mukhtasarBook";
import { getOfflineAysarTafsir, getOfflineAysarTafsirFallback } from "../utils/aysarBook";
import { getOfflineGharib } from "../utils/gharibBook";
import { getOfflineAsbab } from "../utils/asbabBook";
import { getOfflineMutashabihat } from "../utils/mutashabihatBook";
import { getOfflineTdabr } from "../utils/tdabrBook";
import { getOfflineSarf } from "../utils/sarfBook";
import { getOfflineLibraryContent } from "../utils/libraryOfflineEngine";
import { 
  Search, X, Loader2, BookOpen, ChevronLeft, 
  Fingerprint, List, Network, Image as ImageIcon, 
  BookOpenText, Eye, ChevronDown, Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import { surahsList } from "../data/surahList";
import { quranSvgPageMetadata, getSurahStartPage } from "../data/quranSvgPageMetadata";
import { quranicThemes, mishkatGems, QuranicTheme, MishkatGem } from "../data/searchExtensions";
import { thematicSections, thematicSourceInfo } from "../data/quranThematicIndex";

// Helper to convert Arabic digits to English digits
const toEnglishDigits = (str: string): string => {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return str.replace(/[٠-٩]/g, (w) => String(arabicDigits.indexOf(w)));
};

// Helper to normalize Arabic text
const normalizeArabic = (str: string): string => {
  return str
    .replace(/[\u064B-\u065F]/g, "") // strip tashkeel (diacritics)
    .replace(/[أإآء]/g, "ا")        // normalize alef
    .replace(/ة\b/g, "ه")          // normalize ta marbuta
    .replace(/\s+/g, " ")          // normalize multiple spaces
    .trim()
    .toLowerCase();
};

// We will write a small helper to convert numerals to Arabic if needed, or define it locally to be safe.
const toArabic = (num: number): string => {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((char) => {
      const parsed = parseInt(char, 10);
      return isNaN(parsed) ? char : digits[parsed];
    })
    .join("");
};

const getJuzOrdinalName = (num: number): string => {
  const ordinals = [
    "",
    "الأول",
    "الثاني",
    "الثالث",
    "الرابع",
    "الخامس",
    "السادس",
    "السابع",
    "الثامن",
    "التاسع",
    "العاشر",
    "الحادي عشر",
    "الثاني عشر",
    "الثالث عشر",
    "الرابع عشر",
    "الخامس عشر",
    "السادس عشر",
    "السابع عشر",
    "الثامن عشر",
    "التاسع عشر",
    "العشرون",
    "الحادي والعشرون",
    "الثاني والعشرون",
    "الثالث والعشرون",
    "الرابع والعشرون",
    "الخامس والعشرون",
    "السادس والعشرون",
    "السابع والعشرون",
    "الثامن والعشرون",
    "التاسع والعشرون",
    "الثلاثون"
  ];
  return ordinals[num] || String(num);
};

const ARABIC_VARIATION_MAP: Record<string, string[]> = {
  "بيت": ["بيت", "بيوت"],
  "بيوت": ["بيت", "بيوت"],
  "ولد": ["ولد", "اولاد", "ولدان"],
  "اولاد": ["ولد", "اولاد", "ولدان"],
  "ولدان": ["ولد", "اولاد", "ولدان"],
  "عبد": ["عبد", "عباد", "عبيد", "معبود"],
  "عباد": ["عبد", "عباد", "عبيد"],
  "عبيد": ["عبد", "عباد", "عبيد"],
  "يوم": ["يوم", "ايام"],
  "ايام": ["يوم", "ايام"],
  "ملك": ["ملك", "ملائكه", "ملوك", "ملائكتنا"],
  "ملائكه": ["ملك", "ملائكه", "ملوك"],
  "ملوك": ["ملك", "ملائكه", "ملوك"],
  "رسول": ["رسول", "رسل"],
  "رسل": ["رسول", "رسل"],
  "نبي": ["نبي", "انبياء"],
  "انبياء": ["نبي", "انبياء"],
  "كتاب": ["كتاب", "كتب"],
  "كتب": ["كتاب", "كتب"],
  "نفس": ["نفس", "انفس", "نفوس"],
  "انفس": ["نفس", "انفس", "نفوس"],
  "نفوس": ["نفس", "انفس", "نفوس"],
  "عين": ["عين", "اعين", "عيون"],
  "اعين": ["عين", "اعين", "عيون"],
  "عيون": ["عين", "اعين", "عيون"],
  "وجه": ["وجه", "وجوه"],
  "وجوه": ["وجه", "وجوه"],
  "قلب": ["قلب", "قلوب"],
  "قلوب": ["قلب", "قلوب"],
  "صدر": ["صدر", "صدور"],
  "صدور": ["صدر", "صدور"],
  "اذن": ["اذن", "آذان", "اذان"],
  "آذان": ["اذن", "آذان", "اذان"],
  "اذان": ["اذن", "آذان", "اذان"],
  "يد": ["يد", "ايدي"],
  "ايدي": ["يد", "ايدي"],
  "رجل": ["رجل", "ارجل"],
  "ارجل": ["رجل", "ارجل"],
  "جبل": ["جبل", "جبال"],
  "جبال": ["جبل", "جبال"],
  "بحر": ["بحر", "بحار"],
  "بحار": ["بحر", "بحار"],
  "ارض": ["ارض", "اراضي"],
  "سماء": ["سماء", "سموات", "سماوات"],
  "سموات": ["سماء", "سموات", "سماوات"],
  "سماوات": ["سماء", "سموات", "سماوات"],
  "نجم": ["نجم", "نجوم"],
  "نجوم": ["نجم", "نجوم"],
  "شجر": ["شجر", "اشجار"],
  "اشجار": ["شجر", "اشجار"],
  "ثمر": ["ثمر", "ثمرات"],
  "ثمرات": ["ثمر", "ثمرات"],
  "طير": ["طير", "طيور"],
  "طيور": ["طير", "طيور"],
  "عمل": ["عمل", "اعمال"],
  "اعمال": ["عمل", "اعمال"],
  "قول": ["قول", "اقاويل", "اقوال"],
  "اسم": ["اسم", "اسماء"],
  "اسماء": ["اسم", "اسماء"],
  "اب": ["اب", "آباء", "اباء"],
  "آباء": ["اب", "آباء", "اباء"],
  "ابن": ["ابن", "ابناء", "بنين"],
  "ابناء": ["ابن", "ابناء", "بنين"],
  "بنين": ["ابن", "ابناء", "بنين"],
  "زوج": ["زوج", "ازواج"],
  "ازواج": ["زوج", "ازواج"],
  "امراه": ["امراه", "نساء"],
  "نساء": ["امراه", "نساء"],
  "دار": ["دار", "ديار"],
  "ديار": ["دار", "ديار"],
  "قبر": ["قبر", "قبور"],
  "قبور": ["قبر", "قبور"],
  "طريق": ["طريق", "طرق"],
  "طرق": ["طريق", "طرق"],
  "سبيل": ["سبيل", "سبل"],
  "سبل": ["سبيل", "سبل"],
  "عهد": ["عهد", "عهود"],
  "عهود": ["عهد", "عهود"],
  "مساجد": ["مسجد", "مساجد"],
  "مسجد": ["مسجد", "مساجد"],
  "حمار": ["حمار", "حمير"],
  "حمير": ["حمار", "حمير"],
  "جنة": ["جنه", "جنات"],
  "جنات": ["جنه", "جنات"],
  "جنه": ["جنه", "جنات"],
  "ايات": ["ايه", "ايات"],
  "ايه": ["ايه", "ايات"],
  "صاحب": ["صاحب", "اصحاب"],
  "اصحاب": ["صاحب", "اصحاب"],
};

const isArabicMatchBase = (word: string, query: string, exact: boolean): boolean => {
  if (!word || !query) return false;
  if (word === query) return true;

  // If not exact search, do basic substring check first
  if (!exact && (word.includes(query) || query.includes(word))) {
    return true;
  }

  // Helper to strip common prefixes
  const stripPrefixes = (s: string) => {
    return s.replace(/^(وال|فال|بال|كال|لال|لل|ال|و|ف|ب|ك|ل)/, "");
  };

  // Helper to strip common suffixes
  const stripSuffixes = (s: string) => {
    return s.replace(/(كم|هم|هن|نا|ي|ه|ها|هما|تم|تما|تن|ون|ين|ان|ات|ا|وا|ت|ة)$/, "");
  };

  const wClean = stripPrefixes(stripSuffixes(word));
  const qClean = stripPrefixes(stripSuffixes(query));

  // If after stripping prefixes and suffixes, they are equal or one contains the other, it is a match!
  if (wClean === qClean && wClean.length > 0) return true;
  if (!exact && wClean.length > 0 && qClean.length > 0 && (wClean.includes(qClean) || qClean.includes(wClean))) {
    return true;
  }

  // Arabic broken plurals/root subsequences (e.g., "بيت" in "بيوت")
  if (!exact && qClean.length >= 2 && wClean.length >= qClean.length) {
    let qIdx = 0;
    for (let wIdx = 0; wIdx < wClean.length; wIdx++) {
      if (wClean[wIdx] === qClean[qIdx]) {
        qIdx++;
        if (qIdx === qClean.length) {
          // Found subsequence! Check skipped characters
          const skipped = [];
          let currentQIdx = 0;
          for (let i = 0; i < wClean.length; i++) {
            if (currentQIdx < qClean.length && wClean[i] === qClean[currentQIdx]) {
              currentQIdx++;
            } else {
              skipped.push(wClean[i]);
            }
          }
          const allowedSkipped = /^[و|ا|ي|أ|إ|آ|ؤ|ئ|ة|ت|ن|ه]*$/;
          if (allowedSkipped.test(skipped.join(""))) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

const isArabicMatch = (word: string, query: string, exact: boolean): boolean => {
  if (isArabicMatchBase(word, query, exact)) return true;

  if (!exact) {
    // Check variation map for root/plural variations of the query
    const queryVars = ARABIC_VARIATION_MAP[query] || [];
    for (const v of queryVars) {
      if (isArabicMatchBase(word, v, false)) return true;
    }

    // Check variation map for root/plural variations of the word
    const wordVars = ARABIC_VARIATION_MAP[word] || [];
    for (const v of wordVars) {
      if (isArabicMatchBase(v, query, false)) return true;
    }
  }

  return false;
};

interface QuranWordSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVerse: (surahNumber: number, surahName: string, ayahNumber: number, pageNumber: number, ayahText: string) => void;
  isDark: boolean;
  theme: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet";
  inDrawer?: boolean;
}

interface SearchMatch {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  surah: {
    number: number;
    name: string;
    englishName: string;
    revelationType?: string;
  };
  isPageResult?: boolean;
  isSurahResult?: boolean;
}

const LIBRARY_BOOKS = [
  { id: "tafsir_mukhtasar", name: "المختصر في التفسير", author: "مركز تفسير (susalm/mushaf-altibyan- / tafsir-mcp-main)", badge: "المختصر" },
  { id: "tafsir_muyassar", name: "التفسير الميسر", author: "مجمع الملك فهد", badge: "الميسر" },
  { id: "tafsir_sadi", name: "تفسير السعدي", author: "عبد الرحمن السعدي", badge: "السعدي" },
  { id: "tafsir_kathir", name: "تفسير ابن كثير", author: "ابن كثير الدمشقي", badge: "ابن كثير" },
  { id: "tafsir_tabari", name: "تفسير الطبري", author: "محمد بن جرير الطبري", badge: "الطبري" },
  { id: "tafsir_qurtubi", name: "تفسير القرطبي", author: "القرطبي", badge: "القرطبي" },
  { id: "tafsir_baghawi", name: "تفسير البغوي", author: "البغوي", badge: "البغوي" },
];

export default function QuranWordSearchModal({
  isOpen,
  onClose,
  onSelectVerse,
  isDark,
  theme,
  inDrawer = false,
}: QuranWordSearchModalProps) {
  // Navigation tabs: المصحف، الفهرس، الموضوع، المكتبة، المشكاة
  const [activeSearchTab, setActiveSearchTab] = useState<"mushaf" | "index" | "thematic" | "library" | "mishkat">("mushaf");

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [verseDetails, setVerseDetails] = useState<Record<string, { page: number; juz: number; hizbQuarter: number }>>({});
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [isExactSearch, setIsExactSearch] = useState(false);
  const [isTashkeelMatch, setIsTashkeelMatch] = useState(false);

  // States for thematic search results
  const [selectedThematicSection, setSelectedThematicSection] = useState<string>("all");
  const [matchingThemes, setMatchingThemes] = useState<QuranicTheme[]>([]);
  const [expandedThemeId, setExpandedThemeId] = useState<string | null>(null);

  // States for index search results
  const [matchingIndexResults, setMatchingIndexResults] = useState<{
    type: "surah" | "juz" | "page";
    title: string;
    subtitle: string;
    badge: string;
    surahNumber?: number;
    pageNumber: number;
    ayahNumber?: number;
  }[]>([]);

  // States for library inline Tafsir
  const [openTafsirVerseKey, setOpenTafsirVerseKey] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState<boolean>(false);
  const [tafsirTexts, setTafsirTexts] = useState<Record<string, string>>({});
  const [tafsirBookType, setTafsirBookType] = useState<string>("tafsir_muyassar");

  // States for mishkat search results
  const [matchingGems, setMatchingGems] = useState<MishkatGem[]>([]);
  const [expandedGemId, setExpandedGemId] = useState<string | null>(null);

  const [searchHistory, setSearchHistory] = useState<{
    query: string;
    resultsCount: number;
    isExact: boolean;
    timestamp: number;
  }[]>(() => {
    try {
      const saved = localStorage.getItem("quran_search_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery("");
      setResults([]);
      setVerseDetails({});
      setError(null);
      setSearched(false);
      setMatchingIndexResults([]);
      setMatchingThemes([]);
      setMatchingGems([]);
      setOpenTafsirVerseKey(null);
    }
  }, [isOpen]);

  // Clean open Tafsirs when book type changes
  useEffect(() => {
    if (openTafsirVerseKey) {
      const [surahNumber, ayahNumber] = openTafsirVerseKey.split(":").map(Number);
      const match = results.find(r => r.surah.number === surahNumber && r.numberInSurah === ayahNumber);
      if (match) {
        setTafsirTexts(prev => {
          const next = { ...prev };
          delete next[openTafsirVerseKey];
          return next;
        });
        handleFetchTafsirInline(surahNumber, ayahNumber, match.text, match.surah.name);
      }
    }
  }, [tafsirBookType]);

  const handleFetchTafsirInline = async (
    surahNumber: number,
    ayahNumber: number,
    ayahText: string,
    surahName: string,
    bookTypeOverride?: string
  ) => {
    const activeBook = bookTypeOverride || tafsirBookType;
    const verseKey = `${surahNumber}:${ayahNumber}`;
    const cacheKey = `${verseKey}:${activeBook}`;

    if (openTafsirVerseKey === verseKey && !bookTypeOverride) {
      setOpenTafsirVerseKey(null);
      return;
    }
    setOpenTafsirVerseKey(verseKey);
    
    if (tafsirTexts[cacheKey]) return; // cached

    setTafsirLoading(true);
    let tafsirResult: string | null = null;

    // 1. Try local offline engines first for instant offline response
    if (activeBook === "tafsir_mukhtasar") {
      tafsirResult = getOfflineMukhtasarTafsir(surahNumber, ayahNumber) || getOfflineMukhtasarTafsirFallback(surahNumber, ayahNumber, surahName, ayahText);
    } else if (activeBook === "tafsir_aysar") {
      tafsirResult = getOfflineAysarTafsir(surahNumber, ayahNumber) || getOfflineAysarTafsirFallback(surahNumber, ayahNumber, surahName, ayahText);
    } else if (activeBook === "suraj_garib_quran" || activeBook === "gharib") {
      tafsirResult = getOfflineGharib(surahNumber, ayahNumber, surahName, ayahText);
    } else if (activeBook === "muharrar_asbab" || activeBook === "asbab") {
      tafsirResult = getOfflineAsbab(surahNumber, ayahNumber, surahName, ayahText);
    } else if (activeBook === "mutashabihat") {
      tafsirResult = getOfflineMutashabihat(surahNumber, ayahNumber, surahName, ayahText);
    } else if (activeBook === "tadabbur" || activeBook === "hidaya") {
      tafsirResult = getOfflineTdabr(surahNumber, ayahNumber, surahName, ayahText);
    } else if (activeBook === "sarf" || activeBook === "eerab") {
      tafsirResult = getOfflineSarf(surahNumber, ayahNumber, surahName, ayahText, activeBook, true);
    }

    if (tafsirResult) {
      setTafsirTexts(prev => ({
        ...prev,
        [cacheKey]: tafsirResult!
      }));
      setTafsirLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/tafsir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surahName,
          surahNumber,
          ayahNumber,
          ayahText,
          type: activeBook
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result) {
          tafsirResult = data.result;
        }
      }
    } catch (e) {
      console.warn("Online tafsir fetch failed, using offline fallback:", e);
    }

    if (!tafsirResult) {
      tafsirResult = await getOfflineLibraryContent(surahNumber, ayahNumber, activeBook, surahName, ayahText);
    }

    if (!tafsirResult) {
      // Ultimate offline fallback to ensure non-empty display
      tafsirResult = getOfflineMukhtasarTafsir(surahNumber, ayahNumber) ||
                     getOfflineAysarTafsir(surahNumber, ayahNumber) ||
                     getOfflineMukhtasarTafsirFallback(surahNumber, ayahNumber, surahName, ayahText);
    }

    if (tafsirResult) {
      setTafsirTexts(prev => ({
        ...prev,
        [cacheKey]: tafsirResult!
      }));
    }
    setTafsirLoading(false);
  };

  const handleIndexSearch = (cleanQuery: string) => {
    const normQuery = normalizeArabic(cleanQuery);
    const engQuery = toEnglishDigits(cleanQuery);
    const pageNum = parseInt(engQuery.match(/\d+/)?.[0] || "", 10);

    const indexMatches: any[] = [];

    // 1. Match Surah Names
    surahsList.forEach((surah) => {
      if (
        normalizeArabic(surah.name).includes(normQuery) ||
        surah.englishName.toLowerCase().includes(normQuery.toLowerCase())
      ) {
        indexMatches.push({
          type: "surah",
          title: `سورة ${surah.name}`,
          subtitle: `عدد آياتها: ${toArabic(surah.numberOfAyahs)} • نزولها: ${surah.arabicType} • الجزء الأول منها: ${toArabic(surah.juzStart)}`,
          badge: "سورة",
          surahNumber: surah.number,
          pageNumber: getSurahStartPage(surah.number),
          ayahNumber: 1
        });
      }
    });

    // 2. Match Juz
    const juzOrdinals = [
      "", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر",
      "الحادي عشر", "الثاني عشر", "الثالث عشر", "الرابع عشر", "الخامس عشر", "السادس عشر", "السابع عشر", "الثامن عشر", "التاسع عشر",
      "العشرون", "الحادي والعشرون", "الثاني والعشرون", "الثالث والعشرون", "الرابع والعشرون", "الخامس والعشرون", "السادس والعشرون", "السابع والعشرون", "الثامن والعشرون", "التاسع والعشرون", "الثلاثون"
    ];

    juzOrdinals.forEach((jName, jIdx) => {
      if (jIdx > 0 && (normalizeArabic(jName).includes(normQuery) || (pageNum === jIdx && normQuery.includes("جزء")))) {
        const firstSurah = surahsList.find(s => s.juzStart === jIdx) || surahsList[0];
        indexMatches.push({
          type: "juz",
          title: `الجزء ${getJuzOrdinalName(jIdx)}`,
          subtitle: `يبدأ من سورة: ${firstSurah.name} • الصفحة التقريبية: ${toArabic(getSurahStartPage(firstSurah.number))}`,
          badge: "جزء",
          surahNumber: firstSurah.number,
          pageNumber: getSurahStartPage(firstSurah.number),
          ayahNumber: 1
        });
      }
    });

    // 3. Match Page Number
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= 604) {
      const pageMeta = quranSvgPageMetadata.find(p => p.page === pageNum);
      indexMatches.push({
        type: "page",
        title: `الصفحة رقم ${toArabic(pageNum)}`,
        subtitle: pageMeta 
          ? `تبدأ بآيات من سورة: ${pageMeta.surahNameAr} • الجزء: ${getJuzOrdinalName(pageMeta.juz)}` 
          : "من المصحف الشريف",
        badge: "صفحة",
        surahNumber: pageMeta?.surahNumber || 1,
        pageNumber: pageNum,
        ayahNumber: 1
      });
    }

    setMatchingIndexResults(indexMatches);
  };

  const handleThematicSearch = (cleanQuery: string, sectionFilter?: string) => {
    const normQuery = normalizeArabic(cleanQuery);
    const activeSec = sectionFilter !== undefined ? sectionFilter : selectedThematicSection;

    const matches = quranicThemes.filter((themeObj) => {
      const matchesSection = activeSec === "all" ||
        (activeSec === "pillars" && themeObj.sectionTitle?.includes("أركان")) ||
        (activeSec === "taqwa" && themeObj.sectionTitle?.includes("التقوى")) ||
        (activeSec === "vices" && (themeObj.sectionTitle?.includes("الكفر") || themeObj.sectionTitle?.includes("العصيان")));

      if (!matchesSection) return false;
      if (!normQuery) return true;

      return (
        normalizeArabic(themeObj.name).includes(normQuery) ||
        normalizeArabic(themeObj.description).includes(normQuery) ||
        (themeObj.sectionTitle && normalizeArabic(themeObj.sectionTitle).includes(normQuery)) ||
        themeObj.verses.some((v) => normalizeArabic(v.text).includes(normQuery))
      );
    });
    setMatchingThemes(matches);
  };

  const handleMishkatSearch = (cleanQuery: string) => {
    const normQuery = normalizeArabic(cleanQuery);
    const matches = mishkatGems.filter((gem) => {
      return (
        normalizeArabic(gem.title).includes(normQuery) ||
        normalizeArabic(gem.category).includes(normQuery) ||
        normalizeArabic(gem.surahName || "").includes(normQuery) ||
        normalizeArabic(gem.ayahText).includes(normQuery) ||
        normalizeArabic(gem.tadabburText).includes(normQuery)
      );
    });
    setMatchingGems(matches);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      if (activeSearchTab === "index") {
        handleIndexSearch(cleanQuery);
        setLoading(false);
        return;
      }

      if (activeSearchTab === "thematic") {
        handleThematicSearch(cleanQuery);
        setLoading(false);
        return;
      }

      if (activeSearchTab === "mishkat") {
        handleMishkatSearch(cleanQuery);
        setLoading(false);
        return;
      }

      const engQuery = toEnglishDigits(cleanQuery);
      
      // Parse potential page number search (e.g. "25", "٢٥", "صفحة ٢٥")
      const pageMatch = engQuery.match(/(?:صفحة|صفحه|page|p)?\s*(\d+)/i);
      let parsedPage: number | null = null;
      if (pageMatch) {
        const num = parseInt(pageMatch[1], 10);
        const isExplicitPage = /(?:صفحة|صفحه|page|p)/i.test(cleanQuery);
        const isPureNumber = /^\d+$/.test(engQuery.trim());
        if (num >= 1 && num <= 604 && (isExplicitPage || isPureNumber)) {
          parsedPage = num;
        }
      }

      const customResults: SearchMatch[] = [];

      // Add page search result if matched
      if (parsedPage !== null) {
        const pageMeta = quranSvgPageMetadata.find(p => p.page === parsedPage);
        customResults.push({
          number: parsedPage * 1000,
          text: `انقر هنا للانتقال المباشر والسرعة العالية إلى الصفحة رقم ${toArabic(parsedPage)} من المصحف الشريف.`,
          numberInSurah: 1,
          juz: pageMeta ? pageMeta.juz : 1,
          page: parsedPage,
          surah: {
            number: pageMeta ? pageMeta.surahNumber : 1,
            name: pageMeta ? pageMeta.surahNameAr : "الفاتحة",
            englishName: pageMeta ? pageMeta.surahNameEn : "Al-Fatihah"
          },
          isPageResult: true
        });
      }

      // Also run the general word search API, unless it's a pure number page search
      let apiResults: SearchMatch[] = [];
      const isPureNumberQuery = /^\d+$/.test(engQuery.trim());
      
      if (!isPureNumberQuery && cleanQuery.length >= 2) {
        const edition = isTashkeelMatch ? "quran-simple" : "quran-simple-clean";
        
        // Helper to extract word variations and roots dynamically
        const getSearchTerms = (q: string): string[] => {
          const normalized = normalizeArabic(q);
          const terms = new Set<string>();
          terms.add(q);
          terms.add(normalized);

          const stripPrefixes = (s: string) => {
            return s.replace(/^(وال|فال|بال|كال|لال|لل|ال|و|ف|ب|ك|ل)/, "");
          };
          const stripSuffixes = (s: string) => {
            return s.replace(/(كم|هم|هن|نا|ي|ه|ها|هما|تم|تما|تن|ون|ين|ان|ات|ا|وا|ت|ة)$/, "");
          };

          const core = stripPrefixes(stripSuffixes(normalized));
          if (core && core.length >= 2) {
            terms.add(core);
          }

          // Check direct or core variations in the map
          const vars = ARABIC_VARIATION_MAP[normalized] || ARABIC_VARIATION_MAP[core] || [];
          vars.forEach(v => {
            const vNorm = normalizeArabic(v);
            terms.add(vNorm);
            const vCore = stripPrefixes(stripSuffixes(vNorm));
            if (vCore && vCore.length >= 2) {
              terms.add(vCore);
            }
          });

          return Array.from(terms).filter(t => t.length >= 2);
        };

        const searchTerms = getSearchTerms(cleanQuery);
        const allMatches: any[] = [];
        const seenMatches = new Set<string>();

        // Query Al Quran Cloud for all expanded search terms in parallel
        await Promise.all(
          searchTerms.map(async (term) => {
            try {
              const data = await fetchAlquranCloud(`v1/search/${encodeURIComponent(term)}/all/${edition}`);
              if (data.code === 200 && data.data && data.data.matches) {
                for (const match of data.data.matches) {
                  const key = `${match.surah.number}:${match.numberInSurah}`;
                  if (!seenMatches.has(key)) {
                    seenMatches.add(key);
                    allMatches.push(match);
                  }
                }
              }
            } catch (e) {
              console.warn(`Search failed for term ${term}:`, e);
            }
          })
        );

        let matches = allMatches;

        // Apply exact word match filter if enabled
        if (isExactSearch) {
          matches = matches.filter((match: any) => {
            const normText = normalizeArabic(match.text);
            const normQuery = normalizeArabic(cleanQuery);
            const words = normText.replace(/[\p{P}\p{S}]+/gu, " ").split(/\s+/);
            return words.some(w => isArabicMatch(w, normQuery, true));
          });
        }

        // Apply diacritics match filter if enabled
        if (isTashkeelMatch) {
          matches = matches.filter((match: any) => {
            return match.text.includes(cleanQuery);
          });
        }

        // Filter out any duplicates
        apiResults = matches.filter((match: any) => {
          const isDuplicate = customResults.some(cr => 
            cr.surah.number === match.surah.number && 
            cr.numberInSurah === match.numberInSurah
          );
          return !isDuplicate;
        });
      }

      // Combine both lists
      const finalResults = [...customResults, ...apiResults];
      setResults(finalResults);

      // Save to history
      setSearchHistory(prev => {
        const filtered = prev.filter(item => !(item.query === cleanQuery && item.isExact === isExactSearch));
        const newHistory = [
          {
            query: cleanQuery,
            resultsCount: finalResults.length,
            isExact: isExactSearch,
            timestamp: Date.now()
          },
          ...filtered
        ].slice(0, 10);
        localStorage.setItem("quran_search_history", JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (err: any) {
      console.error("Search failed:", err);
      setError(err.message || "حدث خطأ أثناء إجراء عملية البحث.");
    } finally {
      setLoading(false);
    }
  };

  // Debounced auto-search - runs on query change & tab change!
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim().length >= 2) {
        handleSearch();
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [query, activeSearchTab, isExactSearch, isTashkeelMatch]);

  // Background loader to fetch complete metadata for matches (juz, page, quarter)
  useEffect(() => {
    if (results.length === 0) return;

    let isMounted = true;
    const fetchDetails = async () => {
      const pending = results.filter(r => !r.isPageResult && !verseDetails[`${r.surah.number}:${r.numberInSurah}`]);
      if (pending.length === 0) return;

      const batchSize = 6;
      for (let i = 0; i < pending.length; i += batchSize) {
        if (!isMounted) break;
        const batch = pending.slice(i, i + batchSize);
        await Promise.all(batch.map(async (match) => {
          try {
            const data = await fetchAlquranCloud(`v1/ayah/${match.surah.number}:${match.numberInSurah}`);
            if (data.code === 200 && data.data && isMounted) {
              setVerseDetails(prev => ({
                ...prev,
                [`${match.surah.number}:${match.numberInSurah}`]: {
                  page: data.data.page,
                  juz: data.data.juz,
                  hizbQuarter: data.data.hizbQuarter
                }
              }));
            }
          } catch (e) {
            console.warn("Failed to load verse metadata background:", e);
          }
        }));
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [results]);

  if (!isOpen) return null;

  // Highlight matched keyword in text
  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;
    
    const normalize = (str: string) => {
      return str
        .replace(/[\u064B-\u065F]/g, "") // Strip diacritics
        .replace(/[أإآء]/g, "ا")        // Normalize alef
        .replace(/ة\b/g, "ه");          // Normalize ta marbuta
    };

    const cleanWord = (str: string) => {
      return str.replace(/[\p{P}\p{S}]+/gu, "");
    };

    const normKeyword = normalize(cleanWord(keyword));
    const rawKeyword = cleanWord(keyword);

    const words = text.split(/\s+/);
    return (
      <span className="leading-relaxed">
        {words.map((word, idx) => {
          const rawWord = cleanWord(word);
          let isMatch = false;

          if (isTashkeelMatch) {
            isMatch = isExactSearch ? (rawWord === rawKeyword) : rawWord.includes(rawKeyword);
          } else {
            const normWord = normalize(rawWord);
            isMatch = isArabicMatch(normWord, normKeyword, isExactSearch);
          }

          return (
            <span 
              key={idx} 
              className={isMatch ? (isDark ? "bg-white/20 text-white font-black px-1 py-0.5 rounded shadow-xs" : "bg-amber-500/25 text-amber-900 font-bold px-0.5 rounded animate-pulse") : ""}
            >
              {word}{" "}
            </span>
          );
        })}
      </span>
    );
  };

  // Theme styling classes
  const getThemeClasses = () => {
    switch (theme) {
      case "gold-velvet":
        if (isDark) {
          return {
            bg: "bg-[#14100c]",
            text: "text-white",
            border: "border-[#c5a85c]/30",
            accentText: "text-[#fde047]",
            inputBg: "bg-[#1c1813] border-[#c5a85c]/35 focus:border-[#c5a85c] focus:ring-[#c5a85c]/20 text-white",
            cardHover: "hover:bg-[#1c1813] hover:border-[#c5a85c]/60",
            headerBg: "bg-[#1c1813] border-b border-[#c5a85c]/20",
            badgeBg: "bg-[#c5a85c]/20 text-[#fde047] border border-[#c5a85c]/40",
          };
        }
        return {
          bg: "bg-[#FAF8F5]",
          text: "text-[#292524]",
          border: "border-[#c5a85c]/40",
          accentText: "text-[#451a03]",
          inputBg: "bg-[#FAF8F5] border-[#c5a85c]/40 focus:border-[#c5a85c] focus:ring-[#c5a85c]/20",
          cardHover: "hover:bg-[#FAF6EE] hover:border-[#c5a85c]/60",
          headerBg: "bg-[#FAF6EE] border-b border-[#c5a85c]/20",
          badgeBg: "bg-[#c5a85c]/10 text-[#78350f] border border-[#c5a85c]/25",
        };
      case "navy-velvet":
        if (isDark) {
          return {
            bg: "bg-[#060c18]",
            text: "text-white",
            border: "border-[#3F63C6]/30",
            accentText: "text-[#93c5fd]",
            inputBg: "bg-[#0a1224] border-[#3F63C6]/35 focus:border-[#3F63C6] focus:ring-[#3F63C6]/20 text-white",
            cardHover: "hover:bg-[#0a1224] hover:border-[#3F63C6]/60",
            headerBg: "bg-[#0a1224] border-b border-[#3F63C6]/20",
            badgeBg: "bg-[#3F63C6]/20 text-[#93c5fd] border border-[#3F63C6]/40",
          };
        }
        return {
          bg: "bg-white",
          text: "text-slate-800",
          border: "border-slate-200",
          accentText: "text-[#1b3168]",
          inputBg: "bg-slate-50 border-slate-200 focus:border-[#3F63C6] focus:ring-[#3F63C6]/20",
          cardHover: "hover:bg-slate-50 hover:border-[#3F63C6]/30",
          headerBg: "bg-slate-50 border-b border-slate-100",
          badgeBg: "bg-[#3F63C6]/10 text-[#1b3168] border border-[#3F63C6]/15",
        };
      case "emerald-velvet":
        if (isDark) {
          return {
            bg: "bg-[#011a12]",
            text: "text-white",
            border: "border-[#10b981]/30",
            accentText: "text-[#34d399]",
            inputBg: "bg-[#012519] border-[#10b981]/30 focus:border-[#10b981] focus:ring-[#10b981]/20 text-white",
            cardHover: "hover:bg-[#022f21] hover:border-[#10b981]/50",
            headerBg: "bg-[#012519] border-b border-[#10b981]/20",
            badgeBg: "bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/35",
          };
        }
        return {
          bg: "bg-white",
          text: "text-emerald-950",
          border: "border-emerald-200",
          accentText: "text-emerald-800",
          inputBg: "bg-emerald-50/50 border-emerald-200 focus:border-emerald-600 focus:ring-emerald-600/20",
          cardHover: "hover:bg-emerald-50/70 hover:border-emerald-500/30",
          headerBg: "bg-emerald-50/50 border-b border-emerald-100",
          badgeBg: "bg-emerald-100/80 text-emerald-900 border border-emerald-200",
        };
      default:
        if (isDark) {
          return {
            bg: "bg-slate-900",
            text: "text-white",
            border: "border-slate-800",
            accentText: "text-emerald-400",
            inputBg: "bg-slate-950 border-slate-800 focus:border-emerald-500 text-white focus:ring-emerald-500/20",
            cardHover: "hover:bg-slate-950 hover:border-emerald-500/30",
            headerBg: "bg-slate-950 border-b border-slate-850",
            badgeBg: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
          };
        } else {
          return {
            bg: "bg-white",
            text: "text-slate-800",
            border: "border-slate-200",
            accentText: "text-emerald-700",
            inputBg: "bg-slate-50 border-slate-200 focus:border-emerald-600 focus:ring-emerald-600/20",
            cardHover: "hover:bg-emerald-50/20 hover:border-emerald-600/25",
            headerBg: "bg-slate-50 border-b border-slate-100",
            badgeBg: "bg-emerald-50 text-emerald-850 border border-emerald-100",
          };
        }
    }
  };

  const colors = getThemeClasses();

  const getTafsirBookChipClass = (isSelected: boolean) => {
    if (isDark) {
      if (theme === "gold-velvet") {
        return isSelected
          ? "bg-black text-[#fde047] border-[#c5a85c] ring-2 ring-[#c5a85c]/40 font-black shadow-sm"
          : "bg-black/90 text-[#d6ba6d] border-[#c5a85c]/50 hover:border-[#c5a85c] hover:text-[#fde047]";
      }
      if (theme === "navy-velvet") {
        return isSelected
          ? "bg-black text-[#93c5fd] border-[#3F63C6] ring-2 ring-[#3F63C6]/40 font-black shadow-sm"
          : "bg-black/90 text-[#60a5fa] border-[#3F63C6]/50 hover:border-[#3F63C6] hover:text-[#93c5fd]";
      }
      if (theme === "emerald-velvet") {
        return isSelected
          ? "bg-black text-emerald-300 border-emerald-400 ring-2 ring-emerald-500/40 font-black shadow-sm"
          : "bg-black/90 text-emerald-400 border-emerald-500/50 hover:border-emerald-400 hover:text-emerald-300";
      }
      return isSelected
        ? "bg-black text-emerald-300 border-emerald-400 ring-2 ring-emerald-500/40 font-black shadow-sm"
        : "bg-black/80 text-emerald-400 border-emerald-500/50 hover:border-emerald-400 hover:text-emerald-300";
    }

    // Light Mode (الوضع الفاتح المناسب لكل مظهر)
    if (theme === "gold-velvet") {
      return isSelected
        ? "bg-[#c5a85c] text-white border-[#c5a85c] font-black shadow-sm"
        : "bg-amber-50/90 text-[#78350f] border-[#c5a85c]/40 hover:bg-amber-100 hover:border-[#c5a85c] hover:text-[#451a03]";
    }
    if (theme === "navy-velvet") {
      return isSelected
        ? "bg-[#3F63C6] text-white border-[#3F63C6] font-black shadow-sm"
        : "bg-blue-50/90 text-[#1e3a8a] border-[#3F63C6]/30 hover:bg-blue-100 hover:border-[#3F63C6] hover:text-[#172554]";
    }
    if (theme === "emerald-velvet") {
      return isSelected
        ? "bg-emerald-600 text-white border-emerald-600 font-black shadow-sm"
        : "bg-emerald-50/90 text-emerald-950 border-emerald-500/30 hover:bg-emerald-100 hover:border-emerald-500 hover:text-emerald-900";
    }
    return isSelected
      ? "bg-emerald-600 text-white border-emerald-600 font-black shadow-sm"
      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-800 hover:bg-emerald-50/60";
  };

  const getTafsirBookIconClass = (isSelected: boolean) => {
    if (isDark) {
      if (theme === "gold-velvet") {
        return isSelected ? "text-[#fde047]" : "text-[#d6ba6d]";
      }
      if (theme === "navy-velvet") {
        return isSelected ? "text-[#93c5fd]" : "text-[#60a5fa]";
      }
      if (theme === "emerald-velvet") {
        return isSelected ? "text-emerald-300" : "text-emerald-400";
      }
      return isSelected ? "text-emerald-300" : "text-emerald-400";
    }

    // Light mode icons
    if (theme === "gold-velvet") {
      return isSelected ? "text-white" : "text-[#c5a85c]";
    }
    if (theme === "navy-velvet") {
      return isSelected ? "text-white" : "text-[#3F63C6]";
    }
    if (theme === "emerald-velvet") {
      return isSelected ? "text-white" : "text-emerald-600";
    }
    return isSelected ? "text-white" : "text-emerald-600";
  };

  const getTafsirLabelClass = () => {
    if (isDark) {
      if (theme === "gold-velvet") return "text-[#d6ba6d]";
      if (theme === "navy-velvet") return "text-[#93c5fd]";
      if (theme === "emerald-velvet") return "text-emerald-400";
      return "text-emerald-400";
    }
    if (theme === "gold-velvet") return "text-[#78350f]";
    if (theme === "navy-velvet") return "text-[#1b3168]";
    if (theme === "emerald-velvet") return "text-emerald-800";
    return "text-emerald-800";
  };

  // Helper classes for cards and items across search tabs
  const getSearchCardClass = () => {
    if (isDark) {
      if (theme === "emerald-velvet") return "bg-[#012519]/70 border-[#10b981]/30 text-white hover:border-[#10b981]/60 hover:bg-[#012519]";
      if (theme === "gold-velvet") return "bg-[#1c1813]/90 border-[#c5a85c]/35 text-white hover:border-[#c5a85c]/60 hover:bg-[#221e18]";
      if (theme === "navy-velvet") return "bg-[#0a1224]/90 border-[#3F63C6]/35 text-white hover:border-[#3F63C6]/60 hover:bg-[#0f1a33]";
      return "bg-slate-900 border-slate-800 text-white hover:border-emerald-500/40 hover:bg-slate-900/90";
    }
    if (theme === "emerald-velvet") return "bg-emerald-50/60 border-emerald-500/25 text-emerald-950 hover:bg-emerald-50/90 hover:border-emerald-500/40";
    if (theme === "gold-velvet") return "bg-amber-50/60 border-[#c5a85c]/30 text-amber-950 hover:bg-amber-50/90 hover:border-[#c5a85c]/50";
    if (theme === "navy-velvet") return "bg-blue-50/50 border-[#3F63C6]/25 text-slate-900 hover:bg-blue-50/80 hover:border-[#3F63C6]/45";
    return "bg-white border-slate-200/90 text-slate-800 hover:border-emerald-500/30 shadow-xs";
  };

  const getSubItemCardClass = () => {
    if (isDark) {
      if (theme === "emerald-velvet") return "bg-[#011a12] border-[#10b981]/25 hover:border-[#10b981]/50 hover:bg-[#012519] text-white";
      if (theme === "gold-velvet") return "bg-[#14100c] border-[#c5a85c]/30 hover:border-[#c5a85c]/60 hover:bg-[#1c1813] text-white";
      if (theme === "navy-velvet") return "bg-[#060c18] border-[#3F63C6]/30 hover:border-[#3F63C6]/60 hover:bg-[#0a1224] text-white";
      return "bg-slate-950 border-slate-800/90 hover:border-emerald-500/50 hover:bg-slate-900 text-white";
    }
    if (theme === "emerald-velvet") return "bg-white border-emerald-200 hover:border-emerald-500/50 hover:bg-emerald-50/50";
    if (theme === "gold-velvet") return "bg-white border-amber-200 hover:border-[#c5a85c]/60 hover:bg-amber-50/50";
    if (theme === "navy-velvet") return "bg-white border-blue-200 hover:border-[#3F63C6]/60 hover:bg-blue-50/50";
    return "bg-white border-slate-200 hover:border-emerald-500/50 hover:bg-slate-50";
  };

  const getCardHeaderBorderClass = () => {
    if (isDark) {
      if (theme === "emerald-velvet") return "border-[#10b981]/20";
      if (theme === "gold-velvet") return "border-[#c5a85c]/25";
      if (theme === "navy-velvet") return "border-[#3F63C6]/25";
      return "border-slate-800/80";
    }
    return "border-slate-200/50";
  };

  // Tadabbur Section Dark / Theme styling helpers
  const getTadabburCardClass = () => {
    return getSearchCardClass();
  };

  const getTadabburBoxClass = () => {
    if (isDark) {
      if (theme === "emerald-velvet") return "text-white bg-[#011a12] border-[#10b981]/25";
      if (theme === "gold-velvet") return "text-white bg-[#14100c] border-[#c5a85c]/30";
      if (theme === "navy-velvet") return "text-white bg-[#060c18] border-[#3F63C6]/30";
      return "text-white bg-slate-950 border-slate-800/80";
    }
    if (theme === "emerald-velvet") return "text-emerald-900 bg-emerald-100/40 border-emerald-200/90";
    if (theme === "gold-velvet") return "text-amber-950 bg-amber-100/40 border-[#c5a85c]/25";
    if (theme === "navy-velvet") return "text-slate-800 bg-blue-100/30 border-blue-200/70";
    return "text-slate-700 bg-slate-50 border-slate-200/80";
  };

  const getTadabburAyahTextClass = () => {
    if (isDark) {
      return "text-white";
    }
    if (theme === "emerald-velvet") return "text-emerald-950";
    if (theme === "gold-velvet") return "text-[#78350f]";
    if (theme === "navy-velvet") return "text-[#1b3168]";
    return "text-slate-800";
  };

  const getTadabburLinkClass = () => {
    if (isDark) {
      if (theme === "emerald-velvet") return "text-[#34d399] hover:underline";
      if (theme === "gold-velvet") return "text-[#fde047] hover:underline";
      if (theme === "navy-velvet") return "text-[#93c5fd] hover:underline";
      return "text-emerald-400 hover:underline";
    }
    if (theme === "emerald-velvet") return "text-emerald-700 hover:underline";
    if (theme === "gold-velvet") return "text-[#92400e] hover:underline";
    if (theme === "navy-velvet") return "text-[#1b3168] hover:underline";
    return "text-emerald-600 hover:underline";
  };

  const getTadabburTitleClass = () => {
    if (isDark) {
      if (theme === "emerald-velvet") return "text-[#FAF8F5] hover:text-[#34d399]";
      if (theme === "gold-velvet") return "text-[#FAF8F5] hover:text-[#fde047]";
      if (theme === "navy-velvet") return "text-[#FAF8F5] hover:text-[#93c5fd]";
      return "text-emerald-400 hover:text-emerald-300";
    }
    if (theme === "emerald-velvet") return "text-emerald-950 hover:text-emerald-700";
    if (theme === "gold-velvet") return "text-[#451a03] hover:text-[#92400e]";
    if (theme === "navy-velvet") return "text-[#0f172a] hover:text-[#3F63C6]";
    return "text-slate-800 hover:text-emerald-600";
  };

  // Unified Results Check
  const hasResults = () => {
    if (activeSearchTab === "mushaf" || activeSearchTab === "library") {
      return results.length > 0;
    }
    if (activeSearchTab === "index") {
      return matchingIndexResults.length > 0;
    }
    if (activeSearchTab === "thematic") {
      return matchingThemes.length > 0;
    }
    if (activeSearchTab === "mishkat") {
      return matchingGems.length > 0;
    }
    return false;
  };

  const renderDefaultEmptyView = () => {
    const getEmptyIconBoxStyle = () => {
      if (isDark) {
        if (theme === "emerald-velvet") return "bg-[#10b981]/15 text-[#34d399]";
        if (theme === "gold-velvet") return "bg-[#c5a85c]/15 text-[#d6ba6d]";
        if (theme === "navy-velvet") return "bg-[#3F63C6]/15 text-[#60a5fa]";
        return "bg-emerald-950/30 text-emerald-400";
      }
      if (theme === "emerald-velvet") return "bg-[#10b981]/15 text-[#34d399]";
      if (theme === "gold-velvet") return "bg-[#c5a85c]/15 text-[#d6ba6d]";
      if (theme === "navy-velvet") return "bg-[#3F63C6]/15 text-[#60a5fa]";
      return "bg-emerald-50 text-emerald-600";
    };

    const getEmptyHeadingStyle = () => {
      if (isDark) {
        if (theme === "emerald-velvet") return "text-emerald-300";
        if (theme === "gold-velvet") return "text-[#fde047]";
        if (theme === "navy-velvet") return "text-[#93c5fd]";
        return "text-emerald-400";
      }
      if (theme === "gold-velvet") return "text-[#78350f]";
      if (theme === "navy-velvet") return "text-[#1b3168]";
      return "text-slate-800";
    };

    switch (activeSearchTab) {
      case "mushaf":
        return (
          <div className="py-12 flex flex-col items-center justify-center gap-4 text-center p-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm ${getEmptyIconBoxStyle()}`}>
              <Search size={32} />
            </div>
            <h4 className={`text-sm font-black ${getEmptyHeadingStyle()}`}>البحث بالآيات</h4>
          </div>
        );
      case "index":
        return (
          <div className="py-8 flex flex-col items-center justify-center gap-4 text-center p-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm ${getEmptyIconBoxStyle()}`}>
              <List size={32} />
            </div>
            <h4 className={`text-sm font-black ${getEmptyHeadingStyle()}`}>البحث بالفهرس</h4>

            {/* Quick Index Suggestions */}
            <div className="w-full max-w-md text-right space-y-3 pt-4 border-t border-dashed border-slate-200/60 dark:border-slate-800/80">
              <span className={`text-[11px] font-black block ${getTafsirLabelClass()}`}>سور شائعة الوصول وسريعة:</span>
              <div className="flex flex-wrap gap-2 justify-end">
                {[
                  { name: "الفاتحة", num: 1, page: 1 },
                  { name: "البقرة", num: 2, page: 2 },
                  { name: "آل عمران", num: 3, page: 50 },
                  { name: "الكهف", num: 18, page: 293 },
                  { name: "يوسف", num: 12, page: 235 },
                  { name: "يس", num: 36, page: 440 },
                  { name: "الملك", num: 67, page: 562 },
                  { name: "النبأ", num: 78, page: 582 }
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => {
                      onSelectVerse(s.num, s.name, 1, s.page, "");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xxs font-black transition-all cursor-pointer border ${
                      isDark
                        ? theme === "emerald-velvet"
                          ? "bg-[#012519] border-[#10b981]/30 text-emerald-300 hover:bg-[#013524]"
                          : theme === "gold-velvet"
                          ? "bg-[#1c1813] border-[#c5a85c]/35 text-[#fde047] hover:bg-[#2a241b]"
                          : theme === "navy-velvet"
                          ? "bg-[#0a1224] border-[#3F63C6]/35 text-[#93c5fd] hover:bg-[#141e33]"
                          : "bg-slate-900 border-slate-800 text-emerald-400 hover:border-emerald-500"
                        : theme === "emerald-velvet"
                        ? "bg-white border-emerald-200 text-emerald-950 hover:bg-emerald-50"
                        : theme === "gold-velvet"
                        ? "bg-white border-amber-200 text-amber-950 hover:bg-amber-50"
                        : theme === "navy-velvet"
                        ? "bg-white border-blue-200 text-blue-950 hover:bg-blue-50"
                        : "bg-white border-slate-200 text-slate-800 hover:border-emerald-500 hover:text-emerald-700"
                    }`}
                  >
                    سورة {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case "thematic":
        return (
          <div className="py-12 flex flex-col items-center justify-center gap-4 text-center p-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm ${getEmptyIconBoxStyle()}`}>
              <Network size={32} />
            </div>
            <h4 className={`text-sm font-black ${getEmptyHeadingStyle()}`}>البحث الموضوعي في القرآن الكريم</h4>
          </div>
        );
      case "library":
        return (
          <div className="py-8 flex flex-col items-center justify-center gap-4 text-center p-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm ${getEmptyIconBoxStyle()}`}>
              <BookOpenText size={32} />
            </div>
            <h4 className={`text-sm font-black ${getEmptyHeadingStyle()}`}>البحث في كتب التفسير بالمكتبة</h4>

            {/* Quick Tafsir Books Selection Chips */}
            <div className="w-full max-w-lg text-right space-y-3 pt-4 border-t border-dashed border-slate-200/60 dark:border-slate-800/80">
              <span className={`text-[11px] font-black block ${getTafsirLabelClass()}`}>كتب التفسير المتاحة بالمكتبة:</span>
              <div className="flex flex-wrap gap-2 justify-start" dir="rtl">
                {LIBRARY_BOOKS.map((b) => {
                  const isSelected = tafsirBookType === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setTafsirBookType(b.id);
                        if (inputRef.current) inputRef.current.focus();
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xxs font-black transition-all cursor-pointer border flex items-center gap-1.5 shadow-sm ${
                        getTafsirBookChipClass(isSelected)
                      }`}
                    >
                      <BookOpen size={13} className={`${getTafsirBookIconClass(isSelected)} shrink-0`} />
                      <span>{b.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case "mishkat":
        return (
          <div className="py-6 flex flex-col items-center justify-center gap-4 text-center p-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm ${getEmptyIconBoxStyle()}`}>
              <ImageIcon size={32} />
            </div>
            <h4 className={`text-sm font-black ${getEmptyHeadingStyle()}`}>البحث بمشكاة القرآن وهدايات "ليدبروا آياته"</h4>

            {/* Quick Mishkat Gems showcase */}
            <div className="w-full max-w-2xl grid grid-cols-1 gap-3.5 pt-4 text-right">
              <span className={`text-[11px] font-black block ${getTafsirLabelClass()}`}>أنوار وهدايات تدبرية مختارة:</span>
              {mishkatGems.slice(0, 8).map((gem) => (
                <div
                  key={gem.id}
                  className={`p-4 rounded-2xl border text-right transition-all flex flex-col gap-2 shadow-xs ${getTadabburCardClass()}`}
                >
                  <div className="flex items-center justify-between w-full border-b border-dashed border-slate-200/40 dark:border-slate-800/80 pb-1.5 font-bold">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${colors.badgeBg}`}>{gem.category}</span>
                    <button
                      onClick={() => {
                        onSelectVerse(gem.surahNumber, gem.surahName, gem.ayahNumber, gem.page, gem.ayahText);
                      }}
                      className={`text-[10px] font-black cursor-pointer flex items-center gap-0.5 ${getTadabburLinkClass()}`}
                    >
                      ذهاب للمصحف <ChevronLeft size={10} />
                    </button>
                  </div>
                  <h5 className={`text-xs font-black transition-colors ${getTadabburTitleClass()}`}>{gem.title}</h5>
                  <p className={`font-uthmanic text-sm leading-loose ${getTadabburAyahTextClass()}`} style={{ fontFamily: "'UthmanicHafs', 'Amiri', serif" }}>
                    «{gem.ayahText}» [{gem.surahName}: {toArabic(gem.ayahNumber)}]
                  </p>
                  <p className={`text-[11px] leading-relaxed p-2.5 rounded-xl border ${getTadabburBoxClass()}`}>
                    <strong className={isDark ? "text-slate-100" : "text-slate-900"}>التدبر:</strong> {gem.tadabburText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderIndexResults = () => {
    if (matchingIndexResults.length === 0) {
      return (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-center text-slate-400 dark:text-slate-500">
          <span className="text-2xl">🔍</span>
          <p className="text-xs font-bold">لم يتم العثور على سورة أو جزء أو صفحة مطابقة لـ "{query}"</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 pb-4">
        {matchingIndexResults.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              onSelectVerse(item.surahNumber || 1, item.title, item.ayahNumber || 1, item.pageNumber, "");
            }}
            className={`w-full text-right p-4.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md flex flex-col gap-2 shadow-xs ${getSearchCardClass()}`}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`text-xs font-black ${colors.accentText}`}>{item.title}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badgeBg}`}>{item.badge}</span>
            </div>
            <p className="text-xxs sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.subtitle}</p>
            <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-60 mt-1 justify-end">
              <span>انقر للانتقال المباشر للمصحف</span>
              <ChevronLeft size={10} />
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderThematicResults = () => {
    if (matchingThemes.length === 0) {
      return (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-center text-slate-400 dark:text-slate-500">
          <span className="text-2xl">🔍</span>
          <p className="text-xs font-bold">لم يتم العثور على موضوعات مطابقة لـ "{query}"</p>
        </div>
      );
    }

    return (
      <div className="space-y-3.5 pb-4 text-right">
        {matchingThemes.map((themeObj) => {
          const isExpanded = expandedThemeId === themeObj.id || matchingThemes.length === 1;
          return (
            <div
              key={themeObj.id}
              className={`rounded-2xl border transition-all overflow-hidden shadow-xs ${getSearchCardClass()}`}
            >
              <button
                onClick={() => setExpandedThemeId(isExpanded ? null : themeObj.id)}
                className={`w-full p-4 text-right flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50/70"
                }`}
              >
                <div className="flex flex-col gap-1">
                  {themeObj.sectionTitle && (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md w-max ${
                      isDark ? (theme === "emerald-velvet" ? "text-[#34d399] bg-[#10b981]/15" : theme === "gold-velvet" ? "text-[#fde047] bg-[#c5a85c]/15" : theme === "navy-velvet" ? "text-[#93c5fd] bg-[#3F63C6]/15" : "text-emerald-400 bg-emerald-500/10") : theme === "emerald-velvet" ? "text-[#34d399] bg-[#10b981]/15" : "text-emerald-600 bg-emerald-500/10"
                    }`}>
                      {themeObj.sectionTitle}
                    </span>
                  )}
                  <span className={`text-xs font-black ${colors.accentText}`}>{themeObj.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{themeObj.description}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${colors.badgeBg}`}>
                    {toArabic(themeObj.verses.length)} آيات
                  </span>
                  <ChevronDown size={14} className={`transform transition-transform ${isExpanded ? "rotate-180" : ""} ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                </div>
              </button>

              {isExpanded && (
                <div className={`p-4 border-t border-dashed space-y-4 ${
                  isDark
                    ? theme === "emerald-velvet" ? "border-[#10b981]/20 bg-[#011a12]/60" : theme === "gold-velvet" ? "border-[#c5a85c]/25 bg-[#14100c]/60" : theme === "navy-velvet" ? "border-[#3F63C6]/25 bg-[#060c18]/60" : "border-slate-800 bg-slate-950/40"
                    : "border-slate-200/60 bg-slate-50/40"
                }`}>
                  {themeObj.verses.map((v, vIdx) => {
                    const pageNum = getSurahStartPage(v.surahNumber);
                    return (
                      <div
                        key={vIdx}
                        onClick={() => {
                          onSelectVerse(v.surahNumber, v.surahName, v.ayahNumber, pageNum, v.text);
                        }}
                        className={`p-3.5 rounded-xl border flex flex-col gap-2.5 cursor-pointer transition-all hover:shadow-md ${getSubItemCardClass()}`}
                      >
                        <p className={`font-uthmanic text-base sm:text-lg leading-loose text-right ${getTadabburAyahTextClass()}`} style={{ fontFamily: "'UthmanicHafs', 'Amiri', serif" }}>
                          {v.text}
                        </p>
                        <div className={`flex items-center justify-between w-full border-t border-dashed pt-2 text-[10px] font-bold text-slate-400 dark:text-slate-400 ${getCardHeaderBorderClass()}`}>
                          <span>{v.surahName} • آية {toArabic(v.ayahNumber)}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectVerse(v.surahNumber, v.surahName, v.ayahNumber, pageNum, v.text);
                            }}
                            className={`hover:underline cursor-pointer flex items-center gap-1 font-black text-[10px] px-2.5 py-1 rounded-lg transition-all ${
                              isDark
                                ? theme === "emerald-velvet"
                                ? "text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/20"
                                : theme === "gold-velvet"
                                ? "text-[#fde047] bg-[#14100c] hover:bg-[#1c1813] border border-[#c5a85c]/30"
                                : theme === "navy-velvet"
                                ? "text-[#93c5fd] bg-[#060c18] hover:bg-[#0a1224] border border-[#3F63C6]/30"
                                : "text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/20"
                                : theme === "emerald-velvet"
                                ? "text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100"
                                : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            }`}
                          >
                            <span>الانتقال المباشر للمصحف</span>
                            <ChevronLeft size={12} />
                          </button>
                        </div>
                        <p className={`text-[10px] leading-relaxed p-2 rounded-lg border mt-1 ${getTadabburBoxClass()}`}>
                          💡 {v.context}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderLibraryResults = () => {
    const validMatches = results.filter(r => !r.isPageResult);
    if (validMatches.length === 0) {
      return (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-center text-slate-400 dark:text-slate-500">
          <span className="text-2xl">🔍</span>
          <p className="text-xs font-bold">لم يتم العثور على أي آية مطابقة في كتب التفسير لـ "{query}"</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-xs font-bold opacity-70">نتائج البحث في كتب التفسير لـ: "{query}"</span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${colors.badgeBg}`}>
            {toArabic(validMatches.length)} آيات
          </span>
        </div>

        {validMatches.map((match) => {
          const verseKey = `${match.surah.number}:${match.numberInSurah}`;
          const cacheKey = `${verseKey}:${tafsirBookType}`;
          const isOpen = openTafsirVerseKey === verseKey;
          const detail = verseDetails[verseKey];
          const pageNum = detail?.page || match.page || getSurahStartPage(match.surah.number);

          return (
            <div
              key={verseKey}
              className={`rounded-2xl border transition-all overflow-hidden shadow-sm ${getSearchCardClass()}`}
            >
              {/* Header */}
              <div className={`p-3.5 sm:p-4 border-b border-dashed flex items-center justify-between gap-2 ${getCardHeaderBorderClass()}`}>
                <div className={`px-3 py-1 rounded-full text-xs font-black ${colors.badgeBg}`}>
                  سورة {match.surah.name} • الآية {toArabic(match.numberInSurah)}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectVerse(match.surah.number, match.surah.name, match.numberInSurah, pageNum, match.text);
                  }}
                  className={`hover:underline cursor-pointer flex items-center gap-1 font-black text-xxs px-2.5 py-1 rounded-lg transition-all ${
                    isDark
                      ? theme === "emerald-velvet"
                      ? "text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/20"
                      : theme === "gold-velvet"
                      ? "text-[#fde047] bg-[#14100c] hover:bg-[#1c1813] border border-[#c5a85c]/30"
                      : theme === "navy-velvet"
                      ? "text-[#93c5fd] bg-[#060c18] hover:bg-[#0a1224] border border-[#3F63C6]/30"
                      : "text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/20"
                      : theme === "emerald-velvet"
                      ? "text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100"
                      : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  <span>الانتقال للمصحف</span>
                  <ChevronLeft size={12} />
                </button>
              </div>

              {/* Ayah Text Card Button */}
              <button
                type="button"
                onClick={() => {
                  handleFetchTafsirInline(match.surah.number, match.numberInSurah, match.text, match.surah.name, tafsirBookType);
                }}
                className={`w-full text-right p-4 border-b border-dashed cursor-pointer transition-colors ${getCardHeaderBorderClass()} ${
                  isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-100/40"
                }`}
              >
                <p className={`font-uthmanic text-right text-base sm:text-xl leading-loose font-medium ${getTadabburAyahTextClass()}`} style={{ fontFamily: "'UthmanicHafs', 'Amiri', serif" }}>
                  {highlightText(match.text, query)}
                </p>
                <div className={`mt-2.5 flex items-center gap-1.5 text-[11px] font-black ${
                  isDark
                    ? theme === "emerald-velvet"
                    ? "text-[#34d399]"
                    : theme === "gold-velvet"
                    ? "text-[#fde047]"
                    : theme === "navy-velvet"
                    ? "text-[#93c5fd]"
                    : "text-emerald-400"
                    : theme === "emerald-velvet"
                    ? "text-emerald-700"
                    : "text-emerald-600"
                }`}>
                  <span>{isOpen ? "إخفاء التفسير" : "عرض تفسير الآية من كتب المكتبة"}</span>
                  <ChevronDown size={12} className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Tafsir Body */}
              {isOpen && (
                <div className={`p-4 space-y-3 ${
                  isDark
                    ? theme === "emerald-velvet" ? "bg-[#011a12]/80" : theme === "gold-velvet" ? "bg-[#14100c]/80" : theme === "navy-velvet" ? "bg-[#060c18]/80" : "bg-slate-950/60"
                    : "bg-slate-50/60"
                }`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-black opacity-70">التفسير المختار من كتب المكتبة:</span>
                    
                    {/* Tafsir Book Buttons */}
                    <div className="flex flex-wrap gap-1.5 justify-start" dir="rtl">
                      {LIBRARY_BOOKS.map((b) => {
                        const isSelected = tafsirBookType === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setTafsirBookType(b.id);
                              handleFetchTafsirInline(match.surah.number, match.numberInSurah, match.text, match.surah.name, b.id);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border flex items-center gap-1.5 shadow-xs ${
                              getTafsirBookChipClass(isSelected)
                            }`}
                          >
                            <BookOpen size={11} className={`${getTafsirBookIconClass(isSelected)} shrink-0`} />
                            <span>{b.badge}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tafsir Text Box */}
                  {tafsirLoading && !tafsirTexts[cacheKey] ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className={`animate-spin ${
                        theme === "emerald-velvet" ? "text-[#10b981]" :
                        theme === "gold-velvet" ? "text-[#c5a85c]" :
                        theme === "navy-velvet" ? "text-[#3F63C6]" :
                        "text-emerald-500"
                      }`} size={20} />
                      <span className="text-[10px]">جاري جلب نص التفسير من المكتبة...</span>
                    </div>
                  ) : (
                    <div className={`text-xs sm:text-sm leading-relaxed font-medium whitespace-pre-line p-3.5 rounded-xl border shadow-inner ${getTadabburBoxClass()}`}>
                      {tafsirTexts[cacheKey] || "تعذر جلب التفسير حالياً."}
                    </div>
                  )}

                  {/* Direct Jump to Mushaf Button */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectVerse(match.surah.number, match.surah.name, match.numberInSurah, pageNum, match.text);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                      theme === "emerald-velvet"
                        ? "bg-[#10b981] text-[#011c14] hover:bg-[#10b981]/90"
                        : theme === "gold-velvet"
                        ? "bg-[#c5a85c] text-[#292524] hover:bg-[#d6ba6d]"
                        : theme === "navy-velvet"
                        ? "bg-[#3F63C6] text-white hover:bg-[#4d73dc]"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    <BookOpen size={14} />
                    <span>الانتقال لموضع الآية الكريمة وتلاوتها بالمصحف الشريف</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMishkatResults = () => {
    if (matchingGems.length === 0) {
      return (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-center text-slate-400 dark:text-slate-500">
          <span className="text-2xl">🔍</span>
          <p className="text-xs font-bold">لم يتم العثور على أنوار هداية مطابقة لـ "{query}"</p>
        </div>
      );
    }

    return (
      <div className="space-y-3.5 pb-4">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-xs font-bold opacity-60">نتائج التدبر عن: "{query}"</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badgeBg}`}>
            {toArabic(matchingGems.length)} فائدة وهداية
          </span>
        </div>
        {matchingGems.map((gem) => {
          const isExpanded = expandedGemId === gem.id;
          return (
            <div
              key={gem.id}
              className={`p-4 rounded-2xl border text-right transition-all flex flex-col gap-2 shadow-xs ${getTadabburCardClass()}`}
            >
              <div className="flex items-center justify-between w-full border-b border-dashed border-slate-200/40 dark:border-slate-800/80 pb-1.5 font-bold">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${colors.badgeBg}`}>{gem.category}</span>
                <button
                  onClick={() => {
                    onSelectVerse(gem.surahNumber, gem.surahName, gem.ayahNumber, gem.page, gem.ayahText);
                  }}
                  className={`text-[10px] font-black cursor-pointer flex items-center gap-0.5 ${getTadabburLinkClass()}`}
                >
                  ذهاب للمصحف <ChevronLeft size={10} />
                </button>
              </div>
              <button
                onClick={() => setExpandedGemId(isExpanded ? null : gem.id)}
                className="w-full text-right flex flex-col gap-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h5 className={`text-xs font-black transition-colors ${getTadabburTitleClass()}`}>{gem.title}</h5>
                  <ChevronDown size={14} className={`transform transition-transform ${isExpanded ? "rotate-180" : ""} ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                </div>
                <p className={`font-uthmanic text-base leading-loose mt-1 ${getTadabburAyahTextClass()}`} style={{ fontFamily: "'UthmanicHafs', 'Amiri', serif" }}>
                  «{gem.ayahText}» [{gem.surahName}: {toArabic(gem.ayahNumber)}]
                </p>
              </button>
              
              {isExpanded && (
                <p className={`text-[11px] leading-relaxed p-3 rounded-xl border mt-1 ${getTadabburBoxClass()}`}>
                  <strong className={isDark ? "text-slate-100" : "text-slate-900"}>التدبر:</strong> {gem.tadabburText}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSearchResults = () => {
    switch (activeSearchTab) {
      case "mushaf":
        return (
          <>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-bold opacity-60">نتائج البحث عن: "{query}"</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badgeBg}`}>
                {toArabic(results.length)} مواضع
              </span>
            </div>
            <div className="space-y-4 pb-4">
              {results.map((match) => {
                const isSpecial = match.isPageResult;
                const detail = verseDetails[`${match.surah.number}:${match.numberInSurah}`];
                const pageNum = detail?.page || match.page || getSurahStartPage(match.surah.number);
                const juzNum = detail?.juz || match.juz || 1;
                const quarterInJuz = detail ? (((detail.hizbQuarter - 1) % 8) + 1) : 1;
                const surahInfo = surahsList.find(s => s.number === match.surah.number);
                const arabicType = surahInfo?.arabicType || (match.surah.revelationType === "Meccan" ? "مكية" : "مدنية");

                return (
                  <button
                    key={match.isPageResult ? `page-${match.page}` : `${match.surah.number}-${match.numberInSurah}`}
                    onClick={() => {
                      onSelectVerse(
                        match.surah.number,
                        match.surah.name,
                        match.numberInSurah,
                        pageNum,
                        match.text
                      );
                    }}
                    className={`w-full text-right p-5 rounded-3xl border transition-all cursor-pointer flex flex-col gap-4 shadow-sm hover:shadow-md ${
                      isSpecial
                        ? isDark
                          ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-100"
                          : "bg-emerald-50/70 border-emerald-500/25 text-emerald-950"
                        : getSearchCardClass()
                    }`}
                  >
                    {/* Card Header: Badge with Surah Name and Ayah number */}
                    <div className="flex items-center justify-between w-full">
                      {isSpecial ? (
                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${colors.badgeBg}`}>
                          📖 انتقال سريع للصفحة
                        </span>
                      ) : (
                        <div className={`px-3 py-1 rounded-full text-xs font-black ${colors.badgeBg}`}>
                          {match.surah.name} {toArabic(match.numberInSurah)}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-60">
                        <span>انقر للذهاب للمصحف</span>
                        <ChevronLeft size={12} />
                      </div>
                    </div>

                    {/* Card Body: Matched Text */}
                    <div className="w-full">
                      {isSpecial ? (
                        <p className={`text-xs sm:text-sm font-semibold leading-relaxed ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                          {match.text}
                        </p>
                      ) : (
                        <p className={`font-uthmanic text-right text-lg sm:text-2xl leading-loose font-medium ${getTadabburAyahTextClass()}`} style={{ fontFamily: "'UthmanicHafs', 'Amiri', serif" }}>
                          {highlightText(match.text, query)}
                        </p>
                      )}
                    </div>

                    {/* Card Footer: Detailed Metadata (only for normal verses) */}
                    {!isSpecial && (
                      <div className={`pt-3.5 border-t border-dashed flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-[11px] font-bold opacity-85 w-full ${getCardHeaderBorderClass()}`}>
                        {/* Group 1: Ayah & Juz */}
                        <div className="flex items-center gap-3.5 flex-wrap">
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            الآية: <strong className={colors.accentText}>{toArabic(match.numberInSurah)}</strong>
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            الجزء: <strong className={colors.accentText}>
                              {detail ? getJuzOrdinalName(juzNum) : toArabic(juzNum)}
                            </strong>
                          </span>
                        </div>

                        {/* Group 2: Quarter, Page & Revelation Type */}
                        <div className="flex items-center gap-3.5 flex-wrap">
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            الربع: <strong className={colors.accentText}>
                              {detail ? toArabic(quarterInJuz) : <span className="animate-pulse">...</span>}
                            </strong>
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            الصفحة: <strong className={colors.accentText}>{toArabic(pageNum)}</strong>
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            النزول: <strong className={colors.accentText}>{arabicType}</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        );
      case "index":
        return renderIndexResults();
      case "thematic":
        return renderThematicResults();
      case "library":
        return renderLibraryResults();
      case "mishkat":
        return renderMishkatResults();
      default:
        return null;
    }
  };

  const renderSearchContent = () => (
    <div className="flex flex-col h-full overflow-hidden" dir="rtl">
      {/* Dynamic Navigation Tab Bar at the top - Background removed as requested */}
      <div className={`flex items-center overflow-x-auto scrollbar-none px-4 border-b shrink-0 ${
        theme === "emerald-velvet" ? "border-[#10b981]/15" :
        theme === "gold-velvet" ? "border-[#c5a85c]/15" :
        theme === "navy-velvet" ? "border-[#3F63C6]/15" :
        "border-slate-100 dark:border-slate-900"
      }`}>
        {[
          { id: "mushaf", label: "المصحف", icon: BookOpen },
          { id: "thematic", label: "الموضوع", icon: Network },
          { id: "library", label: "المكتبة", icon: BookOpenText },
          { id: "mishkat", label: "تدبر", icon: ImageIcon }
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeSearchTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSearchTab(tab.id as any);
                setQuery("");
                setResults([]);
                setSearched(false);
                setError(null);
                setMatchingIndexResults([]);
                setMatchingThemes([]);
                setMatchingGems([]);
                setOpenTafsirVerseKey(null);
              }}
              className={`flex-1 min-w-[65px] py-3.5 px-2 text-center flex flex-col items-center gap-1.5 border-b-2 transition-all cursor-pointer relative ${
                isActive
                  ? isDark
                    ? theme === "emerald-velvet"
                      ? "border-[#10b981] text-[#34d399] font-black"
                      : theme === "gold-velvet"
                      ? "border-[#c5a85c] text-[#d6ba6d] font-black"
                      : theme === "navy-velvet"
                      ? "border-[#3F63C6] text-[#60a5fa] font-black"
                      : "border-emerald-500 text-emerald-400 font-black"
                    : theme === "emerald-velvet"
                    ? "border-emerald-600 text-emerald-700 font-black"
                    : theme === "gold-velvet"
                    ? "border-[#c5a85c] text-[#78350f] font-black"
                    : theme === "navy-velvet"
                    ? "border-[#3F63C6] text-[#1b3168] font-black"
                    : "border-emerald-600 text-emerald-600 font-black"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
              }`}
            >
              <IconComponent size={16} className={`${isActive ? "scale-110" : "opacity-75"} transition-transform`} />
              <span className="text-xxs sm:text-xs whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar with input on right and search button on left (RTL natural order) */}
      <div className="border-b border-slate-100 dark:border-slate-900 shrink-0">
        <form onSubmit={handleSearch} className="p-4 pb-2.5 flex items-center gap-3">
          {/* Input field on the Right in RTL */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeSearchTab === "mushaf"
                  ? "اكتب كلمة للبحث بالآيات (مثال: يوسف، مريم)..."
                  : activeSearchTab === "index"
                  ? "اكتب اسم السورة، رقم الجزء، أو رقم الصفحة..."
                  : activeSearchTab === "thematic"
                  ? "اكتب اسم الموضوع (مثال: الصلاة، الصبر)..."
                  : activeSearchTab === "library"
                  ? "اكتب كلمة للبحث عن الآية وتفسيرها..."
                  : "اكتب للبحث في مشكاة الهدايات والتدبر..."
              }
              className={`w-full h-11 px-4 text-xs rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-opacity-25 ${
                isDark
                  ? theme === "emerald-velvet"
                    ? "bg-[#012519] border-[#c5a85c]/35 focus:border-[#c5a85c] text-white focus:ring-[#c5a85c]/20"
                    : theme === "gold-velvet"
                    ? "bg-[#1c1813] border-[#c5a85c]/35 focus:border-[#c5a85c] text-white focus:ring-[#c5a85c]/20"
                    : theme === "navy-velvet"
                    ? "bg-[#0a1224] border-[#3F63C6]/35 focus:border-[#3F63C6] text-white focus:ring-[#3F63C6]/20"
                    : "bg-slate-900 border-slate-800 focus:border-emerald-500 text-white focus:ring-emerald-500/20"
                  : theme === "emerald-velvet"
                  ? "bg-[#011a12] border-[#c5a85c]/35 focus:border-[#c5a85c] text-[#FAF8F5] focus:ring-[#c5a85c]/20"
                  : theme === "gold-velvet"
                  ? "bg-[#FAF5E6] border-[#c5a85c]/40 focus:border-[#c5a85c] text-[#011c14] focus:ring-[#c5a85c]/20"
                  : theme === "navy-velvet"
                  ? "bg-[#F8FAFC] border-[#3F63C6]/30 focus:border-[#3F63C6] text-slate-900 focus:ring-[#3F63C6]/20"
                  : "bg-white border-emerald-200 focus:border-emerald-600 text-slate-800 focus:ring-emerald-600/20"
              }`}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-red-500 dark:text-red-400 hover:text-red-600 cursor-pointer"
                title="مسح"
              >
                <X size={12} className="text-red-500 dark:text-red-400" />
              </button>
            )}
          </div>

          {/* Theme colored Search Button on the Left in RTL */}
          <button
            type="submit"
            title="بحث"
            aria-label="بحث"
            className={`h-11 w-12 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm shrink-0 ${
              theme === "emerald-velvet"
                ? "bg-[#10b981] text-[#011c14] hover:bg-[#10b981]/90"
                : theme === "gold-velvet"
                ? "bg-[#c5a85c] text-[#292524] hover:bg-[#d6ba6d]"
                : theme === "navy-velvet"
                ? "bg-[#3F63C6] text-white hover:bg-[#4d73dc]"
                : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          </button>
        </form>

        {/* Tafsir Book Selection Chips placed to the right of the field */}
        {activeSearchTab === "library" && (
          <div className="px-4 pb-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none justify-start" dir="rtl">
            <span className={`text-[11px] font-black shrink-0 ml-1 ${getTafsirLabelClass()}`}>تفسير:</span>
            {LIBRARY_BOOKS.map((b) => {
              const isSelected = tafsirBookType === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setTafsirBookType(b.id);
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xxs font-black transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 shadow-xs ${
                    getTafsirBookChipClass(isSelected)
                  }`}
                >
                  <BookOpen size={11} className={`${getTafsirBookIconClass(isSelected)} shrink-0`} />
                  <span>{b.badge}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 custom-scroll p-3.5 sm:p-4 space-y-2.5 overflow-y-auto">
        {loading && (
          <div className="h-48 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
            <p className="text-xs text-slate-400">جاري البحث...</p>
          </div>
        )}

        {!loading && error && (
          <div className="h-48 flex flex-col items-center justify-center gap-2 text-center p-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-500 mb-2">
              ⚠️
            </div>
            <p className="text-sm font-bold text-red-500">{error}</p>
            <button 
              onClick={() => handleSearch()} 
              className="mt-2 text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {!loading && !error && !searched && (
          renderDefaultEmptyView()
        )}

        {!loading && !error && searched && !hasResults() && (
          <div className="h-48 flex flex-col items-center justify-center gap-2 text-center text-slate-400">
            <span className="text-2xl">🔍</span>
            <p className="text-xs font-bold">لم يتم العثور على أي نتائج للكلمة "{query}"</p>
            <p className="text-[10px] opacity-60">تأكد من كتابة الكلمة بشكل صحيح وجرب كلمة أخرى</p>
          </div>
        )}

        {!loading && !error && searched && hasResults() && (
          renderSearchResults()
        )}
      </div>
    </div>
  );

  if (inDrawer) {
    return renderSearchContent();
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[160] flex items-end justify-center cursor-default bg-black/45 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <motion.div
        id="quran-search-drawer"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full h-full max-h-[85vh] sm:max-h-[82vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col transition-colors duration-300 ${colors.bg} ${colors.border}`}
        dir="rtl"
      >
        {/* Drag Handle Accent */}
        <div className="w-12 h-1 bg-slate-350/40 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Dynamic Header */}
        <div className={`px-5 pb-3 flex items-center justify-between border-b ${
          theme === "gold-velvet" || theme === "emerald-velvet" ? "border-[#c5a85c]/25" : isDark ? "border-slate-900" : "border-slate-200/60 dark:border-slate-800/60"
        } shrink-0`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${colors.badgeBg}`}>
              <Search size={16} />
            </div>
            <div>
              <h3 className={`font-black text-xs sm:text-sm ${colors.accentText}`}>البحث الشامل والذكي بالمصحف</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 transition-colors cursor-pointer flex items-center justify-center"
            title="إغلاق"
          >
            <X size={16} className="text-red-500 dark:text-red-400 font-bold" />
          </button>
        </div>

        {renderSearchContent()}
      </motion.div>
    </motion.div>
  );
}
