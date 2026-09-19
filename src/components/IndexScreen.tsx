import React, { useState, useEffect, useRef } from "react";
import { Surah, Bookmark } from "../types";
import { surahsList } from "../data/surahList";
import { juzList } from "../data/juzList";
import { quartersList, QuarterInfo } from "../data/quartersData";
import { quranSvgPageMetadata, getSurahStartPage } from "../data/quranSvgPageMetadata";
import { motion } from "motion/react";
import { Search, Heart, BookOpen, Layers, MapPin, Sparkles, X, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { translations } from "../data/translations";
import { fetchAlquranCloud, fetchQuranSvg } from "../utils/quranApi";
import { ensureQbsmlLoaded, getSurahHeaderGlyph, getJuzHeaderGlyph } from "../utils/qcf4Utils";
import { Qcf4VerseText } from "./Qcf4VerseText";

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
  return ordinals[num] || "";
};

const toArabicNumerals = (num: number): string => {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((char) => {
      const parsed = parseInt(char, 10);
      return isNaN(parsed) ? char : digits[parsed];
    })
    .join("");
};

const renderQuarterIcon = (quarterNumber: number, isDark: boolean, theme?: string) => {
  const fraction = quarterNumber % 4;
  const hizbNumber = Math.ceil(quarterNumber / 4);

  if (fraction === 1) {
    return (
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border transition-colors shadow-xs ${
        theme === "navy-velvet"
          ? "bg-[#3F63C6]/10 border-[#3F63C6]/30 text-[#3F63C6]"
          : theme === "gold-velvet"
            ? "bg-[#c5a85c]/15 border-[#c5a85c]/35 text-[#c5a85c]"
            : theme === "emerald-velvet"
              ? "bg-[#c5a85c]/15 border-[#c5a85c]/35 text-[#c5a85c]"
              : isDark 
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" 
                : "bg-emerald-50 border-emerald-100 text-emerald-800"
      }`}>
        {toArabicNumerals(hizbNumber)}
      </div>
    );
  }

  let strokeColor = isDark ? "#064e3b" : "#d1fae5";
  let sliceColor = isDark ? "#10b981" : "#059669";
  let dotColor = isDark ? "#34d399" : "#047857";

  if (theme === "navy-velvet") {
    strokeColor = "#CBD5E1"; // slate-300
    sliceColor = "#3F63C6";  // blue
    dotColor = "#2563EB";
  } else if (theme === "gold-velvet") {
    strokeColor = "#4b4129"; // dark warm gold
    sliceColor = "#c5a85c";  // gold
    dotColor = "#b2934a";
  } else if (theme === "emerald-velvet") {
    strokeColor = "#012c1e"; // deep emerald border color
    sliceColor = "#c5a85c";  // gold
    dotColor = "#b2934a";
  }
  
  if (fraction === 2) {
    return (
      <svg className="w-9 h-9" viewBox="0 0 36 36" aria-label="ربع حزب">
        <circle cx="18" cy="18" r="15" fill="none" stroke={strokeColor} strokeWidth="2" />
        <path d="M18,18 L18,3 A15,15 0 0,1 33,18 Z" fill={sliceColor} />
        <circle cx="18" cy="18" r="2.5" fill={dotColor} />
      </svg>
    );
  } else if (fraction === 3) {
    return (
      <svg className="w-9 h-9" viewBox="0 0 36 36" aria-label="نصف حزب">
        <circle cx="18" cy="18" r="15" fill="none" stroke={strokeColor} strokeWidth="2" />
        <path d="M18,18 L18,3 A15,15 0 0,1 18,33 Z" fill={sliceColor} />
        <circle cx="18" cy="18" r="2.5" fill={dotColor} />
      </svg>
    );
  } else {
    return (
      <svg className="w-9 h-9" viewBox="0 0 36 36" aria-label="ثلاثة أرباع حزب">
        <circle cx="18" cy="18" r="15" fill="none" stroke={strokeColor} strokeWidth="2" />
        <path d="M18,18 L18,3 A15,15 0 1,1 3,18 Z" fill={sliceColor} />
        <circle cx="18" cy="18" r="2.5" fill={dotColor} />
      </svg>
    );
  }
};

const getBeginningOfVerse = (text: string): string => {
  if (!text) return "";
  const clean = text.trim().replace(/\s+/g, " ");
  const words = clean.split(" ");
  
  // If the first token is "۞" or similar non-word symbol, let's treat it as part of the count or take 6 tokens.
  const hasSymbol = words[0] === "۞";
  const limit = hasSymbol ? 6 : 5;
  
  if (words.length <= limit) {
    return clean;
  }
  return words.slice(0, limit).join(" ") + "...";
};

const getHizbStartAndEnd = (hizbNumber: number) => {
  let currentHizb: any = null;
  let nextHizb: any = null;
  
  for (const juz of juzList) {
    for (const h of juz.hizbs) {
      if (h.number === hizbNumber) {
        currentHizb = h;
      } else if (h.number === hizbNumber + 1) {
        nextHizb = h;
      }
    }
  }
  
  if (hizbNumber === 60) {
    return {
      startSurah: currentHizb ? currentHizb.startSurahNumber : 112,
      startAyah: currentHizb ? currentHizb.startAyahNumber : 1,
      endSurah: 114,
      endAyah: 6
    };
  }
  
  if (currentHizb && nextHizb) {
    return {
      startSurah: currentHizb.startSurahNumber,
      startAyah: currentHizb.startAyahNumber,
      endSurah: nextHizb.startSurahNumber,
      endAyah: nextHizb.startAyahNumber
    };
  }
  
  return {
    startSurah: currentHizb ? currentHizb.startSurahNumber : 1,
    startAyah: currentHizb ? currentHizb.startAyahNumber : 1,
    endSurah: 114,
    endAyah: 6
  };
};

const getQuarterEstimate = (
  startSurah: number,
  startAyah: number,
  endSurah: number,
  endAyah: number,
  quarterFraction: number
) => {
  if (startSurah === endSurah) {
    const delta = endAyah - startAyah;
    const estimatedAyah = Math.round(startAyah + delta * quarterFraction);
    return { surahNumber: startSurah, startAyah: estimatedAyah };
  } else {
    let totalVerses = 0;
    const firstSurahMeta = surahsList.find(s => s.number === startSurah);
    const firstSurahTotal = firstSurahMeta ? firstSurahMeta.numberOfAyahs : 100;
    totalVerses += (firstSurahTotal - startAyah + 1);
    
    for (let s = startSurah + 1; s < endSurah; s++) {
      const meta = surahsList.find(sm => sm.number === s);
      if (meta) {
        totalVerses += meta.numberOfAyahs;
      }
    }
    
    totalVerses += endAyah;
    const targetVerseIndex = Math.round(totalVerses * quarterFraction);
    
    let currentSum = 0;
    const firstSurahRemaining = firstSurahTotal - startAyah + 1;
    if (targetVerseIndex <= firstSurahRemaining) {
      return { surahNumber: startSurah, startAyah: startAyah + targetVerseIndex - 1 };
    }
    
    currentSum += firstSurahRemaining;
    for (let s = startSurah + 1; s < endSurah; s++) {
      const meta = surahsList.find(sm => sm.number === s);
      const surahSize = meta ? meta.numberOfAyahs : 100;
      if (currentSum + surahSize >= targetVerseIndex) {
        return { surahNumber: s, startAyah: targetVerseIndex - currentSum };
      }
      currentSum += surahSize;
    }
    
    return { surahNumber: endSurah, startAyah: Math.min(endAyah, Math.max(1, targetVerseIndex - currentSum)) };
  }
};

const getPopupCellsData = (juz: any) => {
  const h1 = juz.hizbs[0].number;
  const h2 = juz.hizbs[1].number;
  
  const h1Bounds = getHizbStartAndEnd(h1);
  const h2Bounds = getHizbStartAndEnd(h2);
  
  const q1_25 = getQuarterEstimate(h1Bounds.startSurah, h1Bounds.startAyah, h1Bounds.endSurah, h1Bounds.endAyah, 0.25);
  const q1_50 = getQuarterEstimate(h1Bounds.startSurah, h1Bounds.startAyah, h1Bounds.endSurah, h1Bounds.endAyah, 0.5);
  const q1_75 = getQuarterEstimate(h1Bounds.startSurah, h1Bounds.startAyah, h1Bounds.endSurah, h1Bounds.endAyah, 0.75);
  
  const q2_25 = getQuarterEstimate(h2Bounds.startSurah, h2Bounds.startAyah, h2Bounds.endSurah, h2Bounds.endAyah, 0.25);
  const q2_50 = getQuarterEstimate(h2Bounds.startSurah, h2Bounds.startAyah, h2Bounds.endSurah, h2Bounds.endAyah, 0.5);
  const q2_75 = getQuarterEstimate(h2Bounds.startSurah, h2Bounds.startAyah, h2Bounds.endSurah, h2Bounds.endAyah, 0.75);

  const getSurahName = (num: number) => {
    return surahsList.find(s => s.number === num)?.name || "السورة";
  };

  const findPage = (s: number, a: number) => {
    const q = quartersList.find(item => item.surahNumber === s && item.ayahNumber === a);
    if (q) return q.page;
    return getSurahStartPage(s);
  };

  return [
    // Row 1 (Visual RTL order: right-most is index 0, middle is index 1, left-most is index 2)
    { text: `الجزء ${juz.number}`, sub: `سورة ${getSurahName(juz.startSurahNumber)}: ${juz.startAyahNumber}`, surah: juz.startSurahNumber, ayah: juz.startAyahNumber, page: findPage(juz.startSurahNumber, juz.startAyahNumber) },
    { text: "ربع الجزء", sub: `سورة ${getSurahName(q1_25.surahNumber)}: ${q1_25.startAyah}`, surah: q1_25.surahNumber, ayah: q1_25.startAyah, page: findPage(q1_25.surahNumber, q1_25.startAyah) },
    { text: "ثلاثة أرباع الحزب", sub: `سورة ${getSurahName(q1_75.surahNumber)}: ${q1_75.startAyah}`, surah: q1_75.surahNumber, ayah: q1_75.startAyah, page: findPage(q1_75.surahNumber, q1_75.startAyah) },

    // Row 2
    { text: `الحزب ${h1}`, sub: `سورة ${getSurahName(juz.hizbs[0].startSurahNumber)}: ${juz.hizbs[0].startAyahNumber}`, surah: juz.hizbs[0].startSurahNumber, ayah: juz.hizbs[0].startAyahNumber, page: findPage(juz.hizbs[0].startSurahNumber, juz.hizbs[0].startAyahNumber) },
    { text: "ربع الحزب", sub: `سورة ${getSurahName(q1_25.surahNumber)}: ${q1_25.startAyah}`, surah: q1_25.surahNumber, ayah: q1_25.startAyah, page: findPage(q1_25.surahNumber, q1_25.startAyah) },
    { text: "نصف الحزب", sub: `سورة ${getSurahName(q1_50.surahNumber)}: ${q1_50.startAyah}`, surah: q1_50.surahNumber, ayah: q1_50.startAyah, page: findPage(q1_50.surahNumber, q1_50.startAyah) },

    // Row 3
    { text: "نصف الجزء", sub: `سورة ${getSurahName(juz.hizbs[1].startSurahNumber)}: ${juz.hizbs[1].startAyahNumber}`, surah: juz.hizbs[1].startSurahNumber, ayah: juz.hizbs[1].startAyahNumber, page: findPage(juz.hizbs[1].startSurahNumber, juz.hizbs[1].startAyahNumber) },
    { text: "ثلاثة أرباع الجزء", sub: `سورة ${getSurahName(q1_75.surahNumber)}: ${q1_75.startAyah}`, surah: q1_75.surahNumber, ayah: q1_75.startAyah, page: findPage(q1_75.surahNumber, q1_75.startAyah) },
    { text: "ثلاثة أرباع الحزب", sub: `سورة ${getSurahName(q2_75.surahNumber)}: ${q2_75.startAyah}`, surah: q2_75.surahNumber, ayah: q2_75.startAyah, page: findPage(q2_75.surahNumber, q2_75.startAyah) },

    // Row 4
    { text: `الحزب ${h2}`, sub: `سورة ${getSurahName(juz.hizbs[1].startSurahNumber)}: ${juz.hizbs[1].startAyahNumber}`, surah: juz.hizbs[1].startSurahNumber, ayah: juz.hizbs[1].startAyahNumber, page: findPage(juz.hizbs[1].startSurahNumber, juz.hizbs[1].startAyahNumber) },
    { text: "ربع الحزب", sub: `سورة ${getSurahName(q2_25.surahNumber)}: ${q2_25.startAyah}`, surah: q2_25.surahNumber, ayah: q2_25.startAyah, page: findPage(q2_25.surahNumber, q2_25.startAyah) },
    { text: "نصف الحزب", sub: `سورة ${getSurahName(q2_50.surahNumber)}: ${q2_50.startAyah}`, surah: q2_50.surahNumber, ayah: q2_50.startAyah, page: findPage(q2_50.surahNumber, q2_50.startAyah) }
  ];
};

const surahStartPages = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594, 
  595, 595, 596, 596, 597, 597, 598, 598, 599, 599, 
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 
  603, 604, 604, 604
];

const juzStartPages = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 
  202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582
];

interface IndexScreenProps {
  onSelectSurah: (surahNumber: number, startAyah?: number, pageNumber?: number) => void;
  bookmarks: Bookmark[];
  isDark: boolean;
  theme?: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet";
  language?: "ar" | "en";
  initialTab?: "surahs" | "quarters" | "go";
  onTabChange?: (tab: "surahs" | "quarters" | "go") => void;
  hideInternalHeader?: boolean;
}

type TabType = "surahs" | "quarters" | "go";

export default function IndexScreen({ 
  onSelectSurah, 
  bookmarks, 
  isDark: _isDark, 
  theme: _theme = "light",
  language = "ar",
  initialTab = "surahs",
  onTabChange,
  hideInternalHeader = false
}: IndexScreenProps) {
  const isDark = _isDark;
  const theme = _theme;
  const t = translations[language];
  const isRtl = language === "ar";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSelect = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery("");
    setExpandedJuz(null);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  useEffect(() => {
    ensureQbsmlLoaded();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [revelationFilter, setRevelationFilter] = useState<"all" | "Meccan" | "Medinan">("all");
  const [expandedJuz, setExpandedJuz] = useState<number | null>(null);
  const [selectedJuzForPopup, setSelectedJuzForPopup] = useState<any | null>(null);
  const [expandedQuarter, setExpandedQuarter] = useState<number | null>(null);

  // Synchronized page-navigation pickers
  const [selectedAyah, setSelectedAyah] = useState<number>(1);
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [selectedJuz, setSelectedJuz] = useState<number>(1);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  const rollScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef<any>(null);

  // Synchronize scrolling of the rolling page picker when page changes
  useEffect(() => {
    if (rollScrollRef.current) {
      const targetTop = (selectedPage - 1) * 54;
      if (Math.abs(rollScrollRef.current.scrollTop - targetTop) > 2) {
        rollScrollRef.current.scrollTo({
          top: targetTop,
          behavior: "smooth"
        });
      }
    }
  }, [selectedPage, activeTab]);

  // Handle manual scroll / drag on the page picker
  const handleRollScroll = () => {
    if (!rollScrollRef.current) return;
    
    if (isScrollingRef.current) {
      clearTimeout(isScrollingRef.current);
    }

    isScrollingRef.current = setTimeout(() => {
      if (rollScrollRef.current) {
        const scrollTop = rollScrollRef.current.scrollTop;
        const page = Math.round(scrollTop / 54) + 1;
        const boundedPage = Math.max(1, Math.min(604, page));
        if (boundedPage !== selectedPage) {
          handlePageChange(boundedPage);
        }
      }
    }, 150);
  };

  // Synchronized scrolling for picker wheel items
  useEffect(() => {
    if (activeTab === "go") {
      const delay = setTimeout(() => {
        const item = document.getElementById(`picker-surah-${selectedSurah}`);
        if (item) item.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      return () => clearTimeout(delay);
    }
  }, [selectedSurah, activeTab]);

  useEffect(() => {
    if (activeTab === "go") {
      const delay = setTimeout(() => {
        const item = document.getElementById(`picker-ayah-${selectedAyah}`);
        if (item) item.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      return () => clearTimeout(delay);
    }
  }, [selectedAyah, activeTab]);

  useEffect(() => {
    if (activeTab === "go") {
      const delay = setTimeout(() => {
        const item = document.getElementById(`picker-juz-${selectedJuz}`);
        if (item) item.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      return () => clearTimeout(delay);
    }
  }, [selectedJuz, activeTab]);



  const handleSurahChange = (surahNum: number) => {
    setSelectedSurah(surahNum);
    setSelectedAyah(1);
    const pNum = surahStartPages[surahNum - 1] || 1;
    setSelectedPage(pNum);
    const sObj = surahsList.find(s => s.number === surahNum);
    if (sObj) setSelectedJuz(sObj.juzStart);
  };

  const handlePageChange = (pageNum: number) => {
    setSelectedPage(pageNum);
    let sNum = 1;
    for (let i = surahStartPages.length - 1; i >= 0; i--) {
      if (surahStartPages[i] <= pageNum) {
        sNum = i + 1;
        break;
      }
    }
    setSelectedSurah(sNum);
    setSelectedAyah(1);

    let jNum = 1;
    for (let j = juzStartPages.length - 1; j >= 0; j--) {
      if (juzStartPages[j] <= pageNum) {
        jNum = j + 1;
        break;
      }
    }
    setSelectedJuz(jNum);
  };

  const handleJuzChange = (juzNum: number) => {
    setSelectedJuz(juzNum);
    const pNum = juzStartPages[juzNum - 1] || 1;
    setSelectedPage(pNum);

    let sNum = 1;
    for (let i = surahStartPages.length - 1; i >= 0; i--) {
      if (surahStartPages[i] <= pNum) {
        sNum = i + 1;
        break;
      }
    }
    setSelectedSurah(sNum);
    setSelectedAyah(1);
  };

  const handleAyahChange = (ayahNum: number) => {
    setSelectedAyah(ayahNum);
  };

  const handleQuickGo = async () => {
    setIsNavigating(true);
    try {
      const data = await fetchAlquranCloud(`v1/page/${selectedPage}/quran-simple`);
      if (data && data.data && data.data.ayahs && data.data.ayahs.length > 0) {
        const firstAyah = data.data.ayahs[0];
        onSelectSurah(firstAyah.surah.number, firstAyah.numberInSurah, selectedPage);
      } else {
        const pageMeta = quranSvgPageMetadata.find(p => p.page === selectedPage);
        const sNum = pageMeta ? pageMeta.surahNumber : selectedSurah;
        onSelectSurah(sNum, selectedAyah, selectedPage);
      }
    } catch (e) {
      const pageMeta = quranSvgPageMetadata.find(p => p.page === selectedPage);
      const sNum = pageMeta ? pageMeta.surahNumber : selectedSurah;
      onSelectSurah(sNum, selectedAyah, selectedPage);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filter surahs
  const filteredSurahs = surahsList.filter((surah) => {
    const matchesSearch =
      surah.name.includes(searchQuery) ||
      surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.number.toString() === searchQuery;
    
    if (revelationFilter === "all") return matchesSearch;
    return matchesSearch && surah.revelationType === revelationFilter;
  });

  // Filter Juzs
  const filteredJuzs = juzList.filter((juz) =>
    juz.nameAr.includes(searchQuery) ||
    juz.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    juz.number.toString() === searchQuery
  );

  return (
    <motion.div
      id="index-screen-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      onClick={(e) => e.stopPropagation()}
      className={`w-full max-w-full h-full min-h-0 overflow-y-auto rounded-2xl border p-3 sm:p-4 ${
        isDark
          ? "bg-slate-950 border-slate-800 text-slate-100"
          : theme === "emerald-velvet"
            ? "bg-white border-[#c5a85c]/30 text-[#011c14]"
            : theme === "gold-velvet"
              ? "bg-white border-[#c5a85c]/30 text-[#011c14]"
              : theme === "navy-velvet"
                ? "bg-white border-slate-200 text-slate-850"
                : "bg-white border-slate-200/80 text-slate-800"
      }`}
      style={{
        backgroundColor: isDark ? "#020617" : "#ffffff"
      }}
    >
      {/* Drag Handle Accent */}
      <div className={`w-12 h-1 rounded-full mx-auto mb-4 shrink-0 ${
        theme === "emerald-velvet" || theme === "gold-velvet"
          ? "bg-[#c5a85c]/30"
          : theme === "navy-velvet"
            ? "bg-[#3F63C6]/30"
            : isDark
              ? "bg-slate-700/50"
              : "bg-slate-200"
      }`} />
      
      {/* Top Header Selector: Mic Button on left & tab switches on right */}
      {!hideInternalHeader && (
        <div className="flex items-center gap-3 mb-6 select-none" dir={isRtl ? "rtl" : "ltr"}>
          {/* Tab switcher on the right in RTL visual order: [السور] [الأرباع] [اذهب] */}
          <div id="index-tabs" className={`flex-1 grid grid-cols-3 p-1 rounded-2xl h-12 items-center ${
            theme === "emerald-velvet"
              ? "bg-[#011a12] border border-[#c5a85c]/30 text-[#FAF8F5]"
              : theme === "navy-velvet"
                ? "bg-[#EFF6FF] border border-[#3F63C6]/25 text-slate-800"
                : theme === "gold-velvet"
                  ? "bg-[#FAF5E6] border border-[#c5a85c]/30 text-slate-800"
                  : isDark
                    ? "bg-slate-900 border border-slate-800 text-slate-100"
                    : "bg-slate-100/80 border border-slate-200/80 text-slate-800"
          }`}>
            <button
              id="tab-btn-surahs"
              type="button"
              onClick={() => handleTabSelect("surahs")}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-bold h-10 transition-all cursor-pointer ${
                activeTab === "surahs"
                  ? (theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-xs font-black" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-sm font-black" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black" : isDark ? "bg-emerald-600 text-white shadow-sm font-black" : "bg-emerald-700 text-white shadow-sm font-black")
                  : (theme === "emerald-velvet" ? "text-[#c5a85c]/70 hover:text-[#FAF8F5]" : theme === "navy-velvet" ? "text-[#3F63C6]/80 hover:text-[#2563EB]" : theme === "gold-velvet" ? "text-[#8c6b23] hover:text-[#011c14]" : isDark ? "text-slate-400 hover:text-slate-100" : "text-emerald-800/70 hover:text-emerald-950")
              }`}
            >
              <span>{language === "en" ? "Surahs" : "السور"}</span>
            </button>

            <button
              id="tab-btn-quarters"
              type="button"
              onClick={() => handleTabSelect("quarters")}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-bold h-10 transition-all cursor-pointer ${
                activeTab === "quarters"
                  ? (theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-xs font-black" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-sm font-black" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black" : isDark ? "bg-emerald-600 text-white shadow-sm font-black" : "bg-emerald-700 text-white shadow-sm font-black")
                  : (theme === "emerald-velvet" ? "text-[#c5a85c]/70 hover:text-[#FAF8F5]" : theme === "navy-velvet" ? "text-[#3F63C6]/80 hover:text-[#2563EB]" : theme === "gold-velvet" ? "text-[#8c6b23] hover:text-[#011c14]" : isDark ? "text-slate-400 hover:text-slate-100" : "text-emerald-800/70 hover:text-emerald-950")
              }`}
            >
              <span>{language === "en" ? "Quarters" : "الأرباع"}</span>
            </button>

            <button
              id="tab-btn-go"
              type="button"
              onClick={() => handleTabSelect("go")}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-bold h-10 transition-all cursor-pointer ${
                activeTab === "go"
                  ? (theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-xs font-black" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-sm font-black" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black" : isDark ? "bg-emerald-600 text-white shadow-sm font-black" : "bg-emerald-700 text-white shadow-sm font-black")
                  : (theme === "emerald-velvet" ? "text-[#c5a85c]/70 hover:text-[#FAF8F5]" : theme === "navy-velvet" ? "text-[#3F63C6]/80 hover:text-[#2563EB]" : theme === "gold-velvet" ? "text-[#8c6b23] hover:text-[#011c14]" : isDark ? "text-slate-400 hover:text-slate-100" : "text-emerald-800/70 hover:text-emerald-950")
              }`}
            >
              <span>{language === "en" ? "Quick Go" : "اذهب"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Input ONLY shown when list searching is active (Sura and Quarters tabs) */}
      {(activeTab === "surahs" || activeTab === "quarters") && (
        <div id="search-container" className="relative mb-6" dir={isRtl ? "rtl" : "ltr"}>
          <label htmlFor="quran-search" className="sr-only">البحث في المصحف الشريف</label>
          <div id="search-input-wrapper" className={`relative flex items-center border-2 rounded-2xl shadow-xs overflow-hidden transition-all ${
            theme === "emerald-velvet"
              ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5] focus-within:border-[#c5a85c] focus-within:ring-2 focus-within:ring-[#c5a85c]/30"
              : theme === "navy-velvet"
                ? "bg-[#F8FAFC] border-[#3F63C6]/30 text-slate-900 focus-within:border-[#3F63C6] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3F63C6]/20"
                : theme === "gold-velvet"
                  ? "bg-[#FAF5E6] border-[#c5a85c]/35 text-[#011c14] focus-within:border-[#c5a85c] focus-within:bg-[#FFFDF5] focus-within:ring-2 focus-within:ring-[#c5a85c]/25"
                  : isDark 
                    ? "bg-slate-900 border-slate-800 text-slate-100 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20" 
                    : "bg-white border-slate-200 text-slate-800 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20"
          }`}>
            <input
              id="quran-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t.searchPlaceholder}
              className={`w-full py-4.5 pr-12 pl-4 bg-transparent outline-none font-medium h-12 ${isRtl ? "text-right" : "text-left"} ${
                theme === "emerald-velvet"
                  ? "text-[#FAF8F5] placeholder-[#c5a85c]/50"
                  : theme === "gold-velvet"
                    ? "text-[#011c14] placeholder-[#8c6b23]/50"
                    : theme === "navy-velvet"
                      ? "text-slate-900 placeholder-[#3F63C6]/50"
                      : isDark ? "text-slate-100 placeholder-slate-500" : "text-slate-800 placeholder-slate-400"
              }`}
            />
            <div className={`absolute ${isRtl ? "right-4" : "left-4"} ${
              theme === "emerald-velvet"
                ? "text-[#c5a85c]"
                : theme === "navy-velvet"
                  ? "text-[#3F63C6]"
                  : theme === "gold-velvet"
                    ? "text-[#8c6b23]"
                    : isDark
                      ? "text-emerald-400"
                      : "text-emerald-600"
            }`}>
              <Search id="search-icon-svg" size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Sub-Filters for Revelation Type ONLY shown in "surahs" tab */}
      {activeTab === "surahs" && (
        <div id="sub-filters-container" className="flex gap-2 mb-6 justify-start overflow-x-auto pb-1" dir={isRtl ? "rtl" : "ltr"}>
          <button
            id="filter-all"
            onClick={() => setRevelationFilter("all")}
            className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer border ${
              revelationFilter === "all"
                ? (theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011c14] font-bold border-transparent" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white border-transparent font-bold" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] font-bold border-transparent" : isDark ? "bg-emerald-600 text-white font-black border-transparent" : "bg-emerald-800 text-white border-transparent")
                : theme === "emerald-velvet"
                  ? "bg-[#011a12] text-[#FAF8F5]/85 border-[#c5a85c]/30 hover:bg-[#012519]"
                  : theme === "navy-velvet"
                    ? "bg-[#EFF6FF] text-[#3F63C6] border-[#3F63C6]/25 hover:bg-[#DBEAFE]"
                    : theme === "gold-velvet"
                      ? "bg-[#FAF5E6] text-[#011c14] border-[#c5a85c]/30 hover:bg-[#f5eedc] font-medium"
                      : isDark ? "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 border-slate-800" : "bg-emerald-100/60 text-emerald-900 hover:bg-emerald-100 border-emerald-200/80"
            }`}
          >
            {language === "en" ? "All" : "الكل"} ({surahsList.length})
          </button>
          <button
            id="filter-meccan"
            onClick={() => setRevelationFilter("Meccan")}
            className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer border ${
              revelationFilter === "Meccan"
                ? (theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011c14] font-bold border-transparent" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white border-transparent font-bold" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] font-bold border-transparent" : isDark ? "bg-emerald-600 text-white font-black border-transparent" : "bg-emerald-800 text-white border-transparent")
                : theme === "emerald-velvet"
                  ? "bg-[#011a12] text-[#FAF8F5]/85 border-[#c5a85c]/30 hover:bg-[#012519]"
                  : theme === "navy-velvet"
                    ? "bg-[#EFF6FF] text-[#3F63C6] border-[#3F63C6]/25 hover:bg-[#DBEAFE]"
                    : theme === "gold-velvet"
                      ? "bg-[#FAF5E6] text-[#011c14] border-[#c5a85c]/30 hover:bg-[#f5eedc] font-medium"
                      : isDark ? "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 border-slate-800" : "bg-emerald-100/60 text-emerald-900 hover:bg-emerald-100 border-emerald-200/80"
            }`}
          >
            {language === "en" ? "Meccan" : "مكية"} ({surahsList.filter(s => s.revelationType === "Meccan").length})
          </button>
          <button
            id="filter-medinan"
            onClick={() => setRevelationFilter("Medinan")}
            className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer border ${
              revelationFilter === "Medinan"
                ? (theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011c14] font-bold border-transparent" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white border-transparent font-bold" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] font-bold border-transparent" : isDark ? "bg-emerald-600 text-white font-black border-transparent" : "bg-emerald-800 text-white border-transparent")
                : theme === "emerald-velvet"
                  ? "bg-[#011a12] text-[#FAF8F5]/85 border-[#c5a85c]/30 hover:bg-[#012519]"
                  : theme === "navy-velvet"
                    ? "bg-[#EFF6FF] text-[#3F63C6] border-[#3F63C6]/25 hover:bg-[#DBEAFE]"
                    : theme === "gold-velvet"
                      ? "bg-[#FAF5E6] text-[#011c14] border-[#c5a85c]/30 hover:bg-[#f5eedc] font-medium"
                      : isDark ? "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 border-slate-800" : "bg-emerald-100/60 text-emerald-900 hover:bg-emerald-100 border-emerald-200/80"
            }`}
          >
            {language === "en" ? "Medinan" : "مدنية"} ({surahsList.filter(s => s.revelationType === "Medinan").length})
          </button>
        </div>
      )}

      {/* List Container mapped to framer-motion stagger animations */}
      <div
        id="index-list-container"
        className={activeTab === "surahs" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" : "space-y-3"}
      >
        {activeTab === "surahs" && (
          filteredSurahs.length > 0 ? (
            filteredSurahs.map((surah) => {
              const startPage = getSurahStartPage(surah.number);
              return (
                <div
                  id={`surah-card-${surah.number}`}
                  key={surah.number}
                  onClick={() => onSelectSurah(surah.number, 1, startPage)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer hover:scale-[1.015] active:scale-[0.98] ${
                  theme === "emerald-velvet"
                    ? "bg-[#011a12] border-[#c5a85c]/35 hover:border-[#c5a85c] text-[#FAF8F5] hover:bg-[#012519]"
                    : theme === "navy-velvet"
                      ? "bg-[#F8FAFC] border-[#3F63C6]/25 hover:border-[#3F63C6] text-slate-850 hover:bg-[#EFF6FF]"
                      : theme === "gold-velvet"
                        ? "bg-[#FFFDF5] border-[#c5a85c]/35 hover:border-[#c5a85c] text-[#011c14] hover:bg-[#FAF5E6]"
                        : isDark
                          ? "bg-slate-900 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 text-slate-100 shadow-md shadow-black/20"
                          : "bg-white border-slate-200/80 hover:border-emerald-600 hover:bg-slate-50/70 hover:shadow-md text-slate-800"
                }`}
                  style={{
                    backgroundColor: theme === "emerald-velvet" ? undefined : theme === "gold-velvet" ? undefined : theme === "navy-velvet" ? undefined : isDark ? undefined : "#ffffff"
                  }}
              >
                {/* Right Side: Number & Name */}
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 rounded-xl items-center justify-center font-amiri font-extrabold text-[13.375px] border shrink-0 ${
                    theme === "emerald-velvet"
                      ? "bg-[#c5a85c]/15 text-[#c5a85c] border-[#c5a85c]/30"
                      : theme === "navy-velvet"
                        ? "bg-[#3F63C6]/10 text-[#3F63C6] border-[#3F63C6]/20"
                        : theme === "gold-velvet"
                          ? "bg-[#c5a85c]/10 text-[#8c6b23] border-[#c5a85c]/30"
                          : isDark ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}>
                    {toArabicNumerals(surah.number)}
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className={`text-[10px] font-normal leading-none select-none ${
                      theme === "emerald-velvet"
                        ? "text-[#FAF8F5]"
                        : theme === "gold-velvet"
                          ? "text-[#011c14]"
                          : isDark ? "text-slate-100" : "text-slate-900"
                    }`} style={{ fontFamily: "QCF4_QBSML, 'Amiri', serif" }}>
                      {getSurahHeaderGlyph(surah.number, surah.name)}
                    </span>
                  </div>
                </div>

                {/* Left Side: Revelation Designation / Verses */}
                <div className="text-left flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    surah.revelationType === "Meccan" 
                      ? theme === "emerald-velvet"
                        ? "bg-[#c5a85c]/15 text-[#c5a85c] border border-[#c5a85c]/30 font-bold"
                        : theme === "navy-velvet"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c]/15 text-[#8c6b23] border border-[#c5a85c]/30 font-bold"
                            : isDark
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                      : theme === "emerald-velvet"
                        ? "bg-[#011c12] text-[#FAF8F5]/90 border border-[#c5a85c]/20 font-bold"
                        : theme === "navy-velvet"
                          ? "bg-[#3F63C6]/10 text-[#3F63C6] border border-[#3F63C6]/25"
                          : theme === "gold-velvet"
                            ? "bg-[#011c14]/5 text-[#011c14]/90 border border-[#011c14]/10 font-bold"
                            : isDark
                              ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
                              : "bg-teal-50 text-teal-700 border border-teal-100"
                  }`}>
                    {surah.arabicType}
                  </span>
                  <span className={`font-amiri text-sm font-bold px-2 py-1 rounded-lg ${
                    theme === "emerald-velvet"
                      ? "text-[#c5a85c] bg-[#c5a85c]/10 border border-[#c5a85c]/20"
                      : theme === "navy-velvet"
                        ? "text-[#3F63C6] bg-[#3F63C6]/10 border border-[#3F63C6]/20"
                        : theme === "gold-velvet"
                          ? "text-[#8c6b23] bg-[#c5a85c]/10 border border-[#c5a85c]/20"
                          : isDark ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-emerald-800 bg-emerald-50/50"
                  }`}>
                    {toArabicNumerals(surah.numberOfAyahs)} آية
                  </span>
                </div>
              </div>
            );
          })
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Sparkles className="mx-auto mb-3" size={32} />
              <p>لم نجد سورة مطابقة لبحثك</p>
            </div>
          )
        )}

        {activeTab === "quarters" && (() => {
          const filteredQuarters = quartersList.filter((q) => {
            if (!searchQuery) return true;
            return (
              q.text.includes(searchQuery) ||
              q.surahName.includes(searchQuery) ||
              q.quarterNumber.toString() === searchQuery ||
              q.page.toString() === searchQuery ||
              `الجزء ${q.juz}`.includes(searchQuery) ||
              getJuzOrdinalName(q.juz).includes(searchQuery)
            );
          });

          // Group by Juz number
          const grouped: Record<number, typeof quartersList> = {};
          filteredQuarters.forEach((q) => {
            if (!grouped[q.juz]) {
              grouped[q.juz] = [];
            }
            grouped[q.juz].push(q);
          });

          const juzNumbers = Object.keys(grouped).map(Number).sort((a, b) => a - b);

          if (juzNumbers.length === 0) {
            return (
              <div className="text-center py-12 text-slate-400">
                <p>عذراً، لم نجد أي ربع مطابق لبحثك</p>
              </div>
            );
          }

          return (
            <div className="space-y-6 w-full" dir="rtl">
              {juzNumbers.map((juzNum) => {
                const juzQuarters = grouped[juzNum];
                return (
                  <div key={juzNum} className="space-y-3">
                    {/* Group Header: Juz Name */}
                    <div className={`text-center py-4 px-6 rounded-2xl font-amiri shadow-sm my-2 transition-all flex items-center justify-center ${
                      theme === "navy-velvet"
                        ? "bg-[#3F63C6]/15 text-[#3F63C6] border border-[#3F63C6]/30"
                        : theme === "gold-velvet"
                          ? "bg-[#f5eedc] text-[#8c6b23] border border-[#c5a85c]/40"
                          : theme === "emerald-velvet"
                            ? "bg-[#011a12] text-[#c5a85c] border border-[#c5a85c]/30"
                            : isDark
                              ? "bg-slate-900 text-emerald-400 border border-emerald-500/30"
                              : "bg-emerald-100/80 text-emerald-900 border border-emerald-200"
                    }`}>
                      <span className="text-[10px] font-normal leading-none select-none opacity-100" style={{ fontFamily: "QCF4_QBSML, 'Amiri', serif" }}>
                        {getJuzHeaderGlyph(juzNum, `الجزء ${toArabicNumerals(juzNum)}`)}
                      </span>
                    </div>

                    {/* List of Quarters in this Juz */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                      {juzQuarters.map((quarter) => {
                        return (
                          <div
                            id={`quarter-row-${quarter.quarterNumber}`}
                            key={quarter.quarterNumber}
                            className="flex flex-col w-full"
                          >
                            <div
                              onClick={() => onSelectSurah(quarter.surahNumber, quarter.ayahNumber, quarter.page)}
                              className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                                theme === "navy-velvet"
                                  ? "bg-[#F8FAFC] border-[#3F63C6]/25 hover:border-[#3F63C6] text-slate-850 hover:bg-[#EFF6FF]"
                                  : theme === "gold-velvet"
                                    ? "bg-[#FFFDF5] border-[#c5a85c]/35 hover:border-[#c5a85c] text-[#011c14] hover:bg-[#FAF5E6]"
                                    : theme === "emerald-velvet"
                                      ? "bg-[#011a12] border-[#c5a85c]/35 hover:border-[#c5a85c] text-[#FAF8F5] hover:bg-[#012519]"
                                      : isDark
                                        ? "bg-slate-900 border-slate-800 hover:border-emerald-500/50 text-slate-100"
                                        : "bg-white border-slate-200/80 hover:border-emerald-600 hover:bg-slate-50/70 hover:shadow-md text-slate-850"
                              }`}
                            >
                              {/* Right Side: Pie Chart fraction/badge indicator */}
                              <div className="flex-shrink-0">
                                {renderQuarterIcon(quarter.quarterNumber, isDark, theme)}
                              </div>

                              {/* Left Side: Text & Subtitle (aligned right in RTL) */}
                              <div className="flex-1 text-right">
                                {/* Quarter Start Text */}
                                <p 
                                  className={`text-2xl leading-loose font-uthmanic font-bold ${
                                    theme === "emerald-velvet"
                                      ? "text-[#FAF8F5]"
                                      : theme === "gold-velvet"
                                        ? "text-[#011c14]"
                                        : isDark ? "text-slate-100" : "text-slate-900"
                                  }`}
                                  style={{ fontFamily: "'UthmanicHafs', 'Amiri', serif" }}
                                >
                                  <Qcf4VerseText
                                    surah={quarter.surahNumber}
                                    ayah={quarter.ayahNumber}
                                    page={quarter.page}
                                    fallbackText={getBeginningOfVerse(quarter.text)}
                                    fontSize="1.35rem"
                                    maxWords={5}
                                    theme={theme}
                                    isDark={isDark}
                                  />
                                </p>
                                
                                {/* Location Metadata */}
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                  <span className={`text-[10px] font-normal leading-none select-none ${
                                    theme === "navy-velvet"
                                      ? "text-[#3F63C6]"
                                      : theme === "gold-velvet" || theme === "emerald-velvet"
                                        ? "text-[#c5a85c]"
                                        : isDark
                                          ? "text-emerald-400"
                                          : "text-emerald-700"
                                  }`} style={{ fontFamily: "QCF4_QBSML, 'Amiri', serif" }}>
                                    {getSurahHeaderGlyph(quarter.surahNumber, surahsList.find(s => s.number === quarter.surahNumber)?.name)}
                                  </span>
                                  <span className={`font-amiri text-[10px] font-semibold ${
                                    theme === "navy-velvet"
                                      ? "text-[#3F63C6]"
                                      : theme === "gold-velvet" || theme === "emerald-velvet"
                                        ? "text-[#c5a85c]/80"
                                        : isDark
                                          ? "text-emerald-300/80"
                                          : "text-emerald-700"
                                  }`}>
                                    الآية {toArabicNumerals(quarter.ayahNumber)} • الصفحة {toArabicNumerals(quarter.page)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {activeTab === "go" && (() => {
          // Dynamic calculation of Surah and Juz for current selectedPage
          let curSurahName = "";
          for (let i = surahStartPages.length - 1; i >= 0; i--) {
            if (surahStartPages[i] <= selectedPage) {
              curSurahName = surahsList[i]?.name || "";
              break;
            }
          }
          let curJuzNum = 1;
          for (let j = juzStartPages.length - 1; j >= 0; j--) {
            if (juzStartPages[j] <= selectedPage) {
              curJuzNum = j + 1;
              break;
            }
          }
          return (
            <div className="space-y-6 animate-fade-in text-center" dir="rtl">
              {/* Dynamic Information Display Card */}
              <div className={`p-4 rounded-2xl border-2 transition-all ${
                theme === "navy-velvet"
                  ? "bg-[#EFF6FF] border-[#3F63C6]/25 text-slate-800"
                  : theme === "gold-velvet"
                    ? "bg-[#FAF5E6] border-[#c5a85c]/35 text-[#011c14]"
                    : theme === "emerald-velvet"
                      ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]"
                      : isDark 
                        ? "bg-slate-900 border-slate-800 text-slate-100" 
                        : "bg-emerald-50/80 border-emerald-200 text-[#1A3A22]"
              }`}>
                <p className={`text-xs font-bold mb-2 ${theme === "gold-velvet" || theme === "emerald-velvet" ? "text-[#c5a85c]" : isDark ? "text-emerald-400" : "text-emerald-700"}`}>الموقع الحالي في المصحف الشريف</p>
                <div className="flex justify-around items-center text-sm font-bold">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block">الجزء</span>
                    <span className={`font-amiri text-lg font-bold ${
                      theme === "navy-velvet" ? "text-slate-800" : theme === "gold-velvet" || theme === "emerald-velvet" ? "text-[#c5a85c]" : isDark ? "text-emerald-300" : "text-amber-600"
                    }`}>
                      الجزء {toArabicNumerals(curJuzNum)}
                    </span>
                  </div>
                  <div className={`h-8 w-[1px] ${isDark ? "bg-slate-800" : "bg-slate-300"}`} />
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block">السورة</span>
                    <span className={`font-amiri text-lg font-bold ${
                      theme === "navy-velvet" ? "text-[#3F63C6]" : theme === "gold-velvet" || theme === "emerald-velvet" ? "text-[#c5a85c]" : isDark ? "text-emerald-300" : "text-emerald-700"
                    }`}>
                      سورة {curSurahName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Interactive Controller with Plus, Minus, Slider, and Direct Number input */}
              <div className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-4 ${
                theme === "navy-velvet"
                  ? "bg-[#FFFFFF] border-[#3F63C6]/25 shadow-sm text-slate-850"
                  : theme === "gold-velvet"
                    ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14] shadow-sm"
                    : theme === "emerald-velvet"
                      ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]"
                      : isDark 
                        ? "bg-slate-900 border-slate-800 shadow-sm text-slate-100" 
                        : "bg-white border-slate-200/80 shadow-sm text-slate-850"
              }`}>
                <span className={`text-xs font-bold ${theme === "emerald-velvet" ? "text-[#FAF8F5]/70" : theme === "gold-velvet" ? "text-[#8c6b23]" : "text-slate-400"}`}>اختر أو اكتب رقم الصفحة (١ - ٦٠٤)</span>
                
                {/* Numeric Controls Block */}
                <div className="flex items-center gap-4 justify-center w-full">
                  {/* Plus Button (next page) */}
                  <button
                    type="button"
                    onClick={() => {
                      handlePageChange(Math.min(604, selectedPage + 1));
                    }}
                    className={`w-12 h-12 rounded-full border-2 font-bold text-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                      theme === "navy-velvet"
                        ? "bg-[#EFF6FF] border-[#3F63C6]/30 hover:bg-[#DBEAFE] text-[#3F63C6]"
                        : theme === "gold-velvet"
                          ? "bg-[#FAF5E6] border-[#c5a85c]/40 hover:bg-[#f5eedc] text-[#011c14]"
                          : theme === "emerald-velvet"
                            ? "bg-[#012519] border-[#c5a85c]/40 hover:bg-[#012c1e] text-[#c5a85c]"
                            : isDark 
                              ? "bg-slate-800 border-slate-700 hover:bg-slate-750 text-emerald-400" 
                              : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-850"
                    }`}
                  >
                    +
                  </button>

                  {/* Number Input Box */}
                  <div className="relative w-36 h-[58px]">
                    <div
                      className={`w-full h-full border-2 rounded-2xl overflow-hidden relative select-none ${
                        theme === "navy-velvet"
                          ? "bg-[#F8FAFC] border-[#3F63C6]/30 text-slate-800 focus-within:border-[#3F63C6] focus-within:bg-white"
                          : theme === "gold-velvet"
                            ? "bg-[#FAF5E6] border-[#c5a85c]/40 text-[#011c14] focus-within:border-[#c5a85c] focus-within:bg-[#FFFDF5]"
                            : theme === "emerald-velvet"
                              ? "bg-[#012519] border-[#c5a85c]/40 text-[#FAF8F5] focus-within:border-[#c5a85c]"
                              : isDark 
                                ? "bg-slate-950 border-slate-800 text-emerald-400 focus-within:border-emerald-500" 
                                : "bg-emerald-50/50 border-emerald-200 text-[#1A3A22] focus-within:border-emerald-600 focus-within:bg-white"
                      }`}
                    >
                      {/* Gradient shadows for 3D scrolling effect */}
                      <div className="absolute top-0 left-0 right-0 h-3.5 bg-gradient-to-b from-black/10 to-transparent pointer-events-none z-10 dark:from-black/40" />
                      <div className="absolute bottom-0 left-0 right-0 h-3.5 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-10 dark:from-black/40" />

                      {/* Scroll container */}
                      <div
                        ref={rollScrollRef}
                        onScroll={handleRollScroll}
                        className="w-full h-full overflow-y-auto scrollbar-none snap-y snap-mandatory flex flex-col"
                      >
                        {Array.from({ length: 604 }, (_, i) => i + 1).map((p) => {
                          const isSel = p === selectedPage;
                          return (
                            <div
                              key={p}
                              id={`roll-page-${p}`}
                              onClick={() => {
                                handlePageChange(p);
                              }}
                              className={`h-[54px] w-full flex items-center justify-center snap-center shrink-0 cursor-pointer transition-all duration-200 font-amiri text-3xl font-extrabold ${
                                isSel
                                  ? (theme === "navy-velvet" ? "text-[#3F63C6] scale-100" : theme === "gold-velvet" || theme === "emerald-velvet" ? "text-[#c5a85c] scale-100" : isDark ? "text-emerald-400 scale-100" : "text-[#1A3A22] scale-100")
                                  : "text-slate-300 dark:text-slate-700 scale-90"
                              }`}
                            >
                              {toArabicNumerals(p)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <span className="absolute bottom-1 right-2 text-[9px] font-bold text-slate-400 select-none z-20">صفحة</span>
                  </div>

                  {/* Minus Button (previous page) */}
                  <button
                    type="button"
                    onClick={() => {
                      handlePageChange(Math.max(1, selectedPage - 1));
                    }}
                    className={`w-12 h-12 rounded-full border-2 font-bold text-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                      theme === "navy-velvet"
                        ? "bg-[#EFF6FF] border-[#3F63C6]/30 hover:bg-[#DBEAFE] text-[#3F63C6]"
                        : theme === "gold-velvet"
                          ? "bg-[#FAF5E6] border-[#c5a85c]/40 hover:bg-[#f5eedc] text-[#011c14]"
                          : theme === "emerald-velvet"
                            ? "bg-[#012519] border-[#c5a85c]/40 hover:bg-[#012c1e] text-[#c5a85c]"
                            : isDark 
                              ? "bg-slate-800 border-slate-700 hover:bg-slate-750 text-emerald-400" 
                              : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-850"
                    }`}
                  >
                    -
                  </button>
                </div>

                {/* Range Slider */}
                <div className="w-full px-4 mt-2">
                  <input
                    type="range"
                    min={1}
                    max={604}
                    value={selectedPage}
                    onChange={(e) => {
                      handlePageChange(Number(e.target.value));
                    }}
                    className={`w-full cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none ${
                      theme === "navy-velvet" ? "accent-[#3F63C6]" : theme === "gold-velvet" || theme === "emerald-velvet" ? "accent-[#c5a85c]" : isDark ? "accent-emerald-500" : "accent-emerald-600"
                    }`}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5 px-1">
                    <span>الصفحة ١</span>
                    <span>الجزء ١٥ (نصف المصحف)</span>
                    <span>الصفحة ٦٠٤</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  id="quick-go-btn"
                  onClick={handleQuickGo}
                  disabled={isNavigating}
                  className={`w-full max-w-xs py-3.5 px-6 rounded-2xl text-md font-extrabold border-2 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                    theme === "navy-velvet"
                      ? "border-[#3F63C6] bg-[#3F63C6] text-white hover:bg-[#3252a8] font-bold"
                      : theme === "gold-velvet"
                        ? "border-[#c5a85c] bg-[#c5a85c] text-[#011c14] hover:bg-[#d8bd70] font-black"
                        : theme === "emerald-velvet"
                          ? "border-[#c5a85c] bg-[#c5a85c] text-[#011a12] hover:bg-[#d8bd70] font-black"
                          : isDark
                            ? "border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-500 font-black"
                            : "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800 font-bold"
                  }`}
                >
                  {isNavigating ? (
                    <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "انتقل للصفحة المحددة"
                  )}
                </button>
              </div>

            </div>
          );
        })()}
      </div>
    </motion.div>
  );
}

interface QuarterSvgPreviewProps {
  page: number;
  isDark: boolean;
  theme: string;
  onOpenPage: () => void;
}

function QuarterSvgPreview({ page, isDark, theme, onOpenPage }: QuarterSvgPreviewProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchSvg = async () => {
      setLoading(true);
      setError(null);
      try {
        const text = await fetchQuranSvg(page, "quran-svg");
        if (active) {
          setSvgContent(text);
        }
      } catch (err) {
        if (active) {
          setError("عذراً، فشل تحميل صفحة المصحف.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchSvg();
    return () => {
      active = false;
    };
  }, [page]);

  const colors = {
    container: theme === "navy-velvet"
      ? "bg-white border-slate-200"
      : theme === "gold-velvet"
        ? "bg-[#FCF9F2] border-[#c5a85c]/20"
        : theme === "emerald-velvet"
          ? "bg-[#022319] border-[#c5a85c]/25 text-[#FAF8F5]"
          : isDark
            ? "bg-[#030d0a] border-emerald-950 text-emerald-100"
            : "bg-[#fcfdfd] border-emerald-900/10 text-[#0f4c3a]",
    button: theme === "navy-velvet"
      ? "bg-[#3F63C6] hover:bg-[#3F63C6]/90 text-white"
      : theme === "gold-velvet"
        ? "bg-[#c5a85c] hover:bg-[#c5a85c]/90 text-[#011c14]"
        : theme === "emerald-velvet"
          ? "bg-[#c5a85c] hover:bg-[#c5a85c]/90 text-[#011a12]"
          : isDark
            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
            : "bg-emerald-800 hover:bg-emerald-700 text-white",
  };

  return (
    <div className={`mt-3 p-4 rounded-2xl border ${colors.container} flex flex-col items-center gap-3 w-full max-w-lg mx-auto`}>
      {loading && (
        <div className="py-8 flex flex-col items-center gap-2">
          <div className={`animate-spin rounded-full h-8 w-8 border-4 ${
            theme === "emerald-velvet" ? "border-[#34d399]" :
            theme === "gold-velvet" ? "border-[#c5a85c]" :
            theme === "navy-velvet" ? "border-[#3F63C6]" :
            "border-emerald-500"
          } border-t-transparent`}></div>
          <p className={`text-xs font-semibold ${
            theme === "emerald-velvet" ? "text-[#34d399]" :
            theme === "gold-velvet" ? "text-[#c5a85c]" :
            theme === "navy-velvet" ? "text-[#3F63C6]" :
            "text-slate-400"
          }`}>جاري تحميل صفحة المصحف {toArabicNumerals(page)}...</p>
        </div>
      )}

      {!loading && error && (
        <p className="text-xs text-red-500 font-bold py-4">{error}</p>
      )}

      {!loading && !error && svgContent && (
        <div className="w-full relative">
          <div 
            className="w-full max-h-[400px] overflow-y-auto overflow-x-hidden p-2 rounded-xl bg-white dark:bg-[#021c15] flex justify-center items-center select-none shadow-inner"
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{
              filter: isDark ? "invert(0.93) hue-rotate(150deg) brightness(1.1) contrast(1.1)" : "none",
            }}
          />
          <style dangerouslySetInnerHTML={{ __html: `
            .ayahPolygon { fill: transparent !important; stroke: transparent !important; }
          `}} />
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenPage();
        }}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md ${colors.button}`}
      >
        فتح صفحة المصحف التفاعلية الكاملة 📖
      </button>
    </div>
  );
}
