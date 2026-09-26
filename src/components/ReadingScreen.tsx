import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Surah, Ayah, Bookmark, QuranSettings } from "../types";
import { popularSurahs } from "../data/popularSurahs";
import { surahsList } from "../data/surahList";
import { recitersList as reciters } from "../data/recitersData";
import { quartersList } from "../data/quartersData";
import { quranSvgPageMetadata, getSurahStartPage } from "../data/quranSvgPageMetadata";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import ReactMarkdown from "react-markdown";
import SettingsScreen from "./SettingsScreen";
import QuranWordSearchModal from "./QuranWordSearchModal";
import IndexScreen from "./IndexScreen";
import { Qcf4PageRenderer } from "./Qcf4PageRenderer";
import { Qcf4VerseText } from "./Qcf4VerseText";
import { CustomDropdown } from "./CustomDropdown";
import { SurahSelectModal } from "./SurahSelectModal";
import { ShareAyahModal, ShareAyahData } from "./ShareAyahModal";
import { SurahHeaderFrame } from "./SurahHeaderFrame";
import { AppLogo } from "./AppLogo";
import { DEFAULT_BOOKS, MainCategory, LibraryBookItem } from "../data/booksData";
import { ensureQbsmlLoaded, getSurahHeaderGlyph, getJuzHeaderGlyph, getBismillahGlyph } from "../utils/qcf4Utils";
import { fetchAlquranCloud, fetchQuranSvg, fetchTafsirData } from "../utils/quranApi";
import { getOfflineMutashabihat } from "../utils/mutashabihatBook";
import { getOfflineTdabr, parseTadabburSections } from "../utils/tdabrBook";
import { getOfflineSarf } from "../utils/sarfBook";
import { getOfflineGharib } from "../utils/gharibBook";
import { getOfflineAsbab } from "../utils/asbabBook";
import { getOfflineMukhtasarTafsir, getOfflineMukhtasarTafsirFallback } from "../utils/mukhtasarBook";
import { getOfflineAysarTafsir, getOfflineAysarTafsirFallback } from "../utils/aysarBook";
import { getOfflineAhkamJassas } from "../utils/ahkamJassasBook";
import { getOfflineEnglishTranslation } from "../utils/englishTranslation";
import { getAyahTranslationText } from "../utils/quranContentApi";
import TranslationsCatalogModal from "./TranslationsCatalogModal";
import { 
  getOfflineLibraryContent, 
  getFromLibraryCache, 
  saveToLibraryCache,
  deleteFromLibraryCache,
  isCorruptAyahOnlyText,
  getOfflineMuyassarTafsir,
  getOfflineSaadiTafsir,
  generateOfflineMuyassar,
  generateOfflineAhkam,
  generateOfflineTranslation,
  generateOfflineSaadi,
  generateOfflineIbnKathir,
  generateOfflineTabari,
  generateOfflineQurtubi,
  generateOfflineBaghawi,
  generateOfflineWaseet,
  getOfflineLibraryContentSync
} from "../utils/libraryOfflineEngine";
import { getAyahsForPage } from "../data/quranPageAyahsMap";
import { getCachedSurahAyahs, saveCachedSurahAyahs } from "../utils/quranPageCache";
import { quranAudioEngine } from "../utils/quranAudioEngine";
import { 
  Play, Pause, ChevronRight, ChevronLeft, ChevronDown, Bookmark as BookmarkIcon, 
  Settings, Languages, Volume2, AlignLeft, AlignCenter, AlignRight, Sliders, Info, Copy, Check, Sparkles, AlertCircle,
  Sun, Moon, Zap, Compass, X, BookOpenCheck, BookOpen, BookOpenText, Library, FileText, History, Activity, Heart, BookCheck, Layers, Feather, GitCompare,
  Plus, Minus, SkipForward, SkipBack, Repeat, Infinity as InfinityIcon, Type, Share2, Download, Image, ZoomIn, ZoomOut,
  Search, ChevronsUp, ArrowUp, FolderHeart, Clock, Trash2, RefreshCw, Maximize2, Minimize2, RotateCcw, Globe
} from "lucide-react";

interface ReadingScreenProps {
  surahNumber: number;
  initialAyahNumber?: number;
  initialPageNumber?: number;
  onBack: () => void;
  bookmarks: Bookmark[];
  onToggleBookmark: (surahNumber: number, surahName: string, ayahNumber?: number, category?: "reading" | "revision" | "memorization" | "contemplation") => void;
  settings: QuranSettings;
  onChangeSettings: (newSettings: Partial<QuranSettings>) => void;
  isDark: boolean;
  theme?: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet";
  onChangeTheme?: (newTheme: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet") => void;
  onToggleDarkMode: () => void;
  showBars?: boolean;
  onToggleBars?: () => void;
  scrollCapsuleToggleTrigger?: number;
  mushafClickTrigger?: number;
  activeTab?: string;
  isIndexOpen?: boolean;
  onCloseIndex?: () => void;
  onOpenIndex?: (tab?: "surahs" | "quarters" | "go") => void;
  onChangeSurah?: (surahNumber: number, startAyah?: number, pageNumber?: number) => void;
  onPageChange?: (page: number, surah: number, startAyah: number, selectedAyahNumber?: number) => void;
  onRecitationStateChange?: (active: boolean) => void;
  onShowBarsChange?: (show: boolean) => void;
  onActiveTabChange?: (tab: "home" | "recitation" | "settings" | "khatmah" | "favorites" | "storage") => void;
  onSyncPlaybackStates?: (states: any) => void;
  onOpenShareAyah?: (data: ShareAyahData) => void;
}

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

const renderHizbQuarterIcon = (quarterPart: string | undefined, theme: string, isDark: boolean, customSizeClass?: string) => {
  let strokeColor = isDark ? "#10b981" : "#059669"; 
  let sliceColor = isDark ? "#10b981" : "#059669"; 
  let dotColor = isDark ? "#10b981" : "#059669";

  if (theme === "navy-velvet") {
    strokeColor = "#1b3168"; 
    sliceColor = "#1b3168";  
    dotColor = "#1b3168";
  } else if (theme === "gold-velvet") {
    strokeColor = "#c5a85c"; 
    sliceColor = "#c5a85c";  
    dotColor = "#c5a85c";
  }

  const sizeClass = customSizeClass || "w-5 h-5 sm:w-5.5 sm:h-5.5 flex-shrink-0";

  if (!quarterPart || quarterPart === "بداية الحزب") {
    return (
      <svg className={sizeClass} viewBox="0 0 36 36" aria-label="بداية الحزب">
        <circle cx="18" cy="18" r="15" fill="none" stroke={strokeColor} strokeWidth="3" />
        <circle cx="18" cy="18" r="8" fill={sliceColor} />
      </svg>
    );
  } else if (quarterPart === "ربع الحزب") {
    return (
      <svg className={sizeClass} viewBox="0 0 36 36" aria-label="ربع حزب">
        <circle cx="18" cy="18" r="15" fill="none" stroke={strokeColor} strokeWidth="2.5" />
        <path d="M18,18 L18,3 A15,15 0 0,1 33,18 Z" fill={sliceColor} />
        <circle cx="18" cy="18" r="2.5" fill={dotColor} />
      </svg>
    );
  } else if (quarterPart === "نصف الحزب") {
    return (
      <svg className={sizeClass} viewBox="0 0 36 36" aria-label="نصف حزب">
        <circle cx="18" cy="18" r="15" fill="none" stroke={strokeColor} strokeWidth="2.5" />
        <path d="M18,18 L18,3 A15,15 0 0,1 18,33 Z" fill={sliceColor} />
        <circle cx="18" cy="18" r="2.5" fill={dotColor} />
      </svg>
    );
  } else if (quarterPart === "ثلاثة أرباع") {
    return (
      <svg className={sizeClass} viewBox="0 0 36 36" aria-label="ثلاثة أرباع حزب">
        <circle cx="18" cy="18" r="15" fill="none" stroke={strokeColor} strokeWidth="2.5" />
        <path d="M18,18 L18,3 A15,15 0 1,1 3,18 Z" fill={sliceColor} />
        <circle cx="18" cy="18" r="2.5" fill={dotColor} />
      </svg>
    );
  }

  return null;
};

const getHizbAndJuzMetadata = (page: number) => {
  const pageMeta = quranSvgPageMetadata.find(p => p.page === page);
  if (pageMeta) {
    return {
      juzNum: pageMeta.juz,
      hizbNum: pageMeta.hizb,
      quarterPart: pageMeta.quarterPart,
      surahName: "سُورَةُ " + pageMeta.surahNameAr,
      surahNumber: pageMeta.surahNumber
    };
  }

  const match = quartersList.reduce((prev, curr) => {
    if (curr.page <= page) return curr;
    return prev;
  }, quartersList[0]);

  const juzNum = match.juz;
  const quarterNumber = match.quarterNumber;
  const hizbNum = Math.ceil(quarterNumber / 4);
  const quarterInHizb = (quarterNumber - 1) % 4; // 0, 1, 2, 3

  let quarterPart = "";
  if (quarterInHizb === 0) quarterPart = "بداية الحزب";
  else if (quarterInHizb === 1) quarterPart = "ربع الحزب";
  else if (quarterInHizb === 2) quarterPart = "نصف الحزب";
  else if (quarterInHizb === 3) quarterPart = "ثلاثة أرباع";

  const foundSurah = surahsList.find(s => s.name === match.surahName || "سُورَةُ " + s.name === match.surahName);

  return {
    juzNum,
    hizbNum,
    quarterPart,
    surahName: match.surahName,
    surahNumber: foundSurah ? foundSurah.number : 1
  };
};

const SurahHeaderBanner = ({ 
  surahName, 
  theme, 
  isDark,
  surahNumber,
  onOpenIndex
}: { 
  surahName: string; 
  theme: string; 
  isDark: boolean; 
  surahNumber?: number;
  onOpenIndex?: (tab?: "surahs" | "quarters" | "go") => void;
}) => {
  return (
    <SurahHeaderFrame
      surahName={surahName}
      theme={theme}
      isDark={isDark}
      surahNumber={surahNumber}
      onOpenIndex={onOpenIndex}
    />
  );
};

const BismillahBanner = ({ theme, surahNumber, isDark }: { theme: string; surahNumber?: number; isDark?: boolean }) => {
  useEffect(() => {
    ensureQbsmlLoaded();
  }, []);

  return (
    <div className="w-full flex items-center justify-center my-5 select-none animate-fade-in">
      <div className="flex items-center gap-4 w-full max-w-xl md:max-w-2xl lg:max-w-3xl">
        <div className={`h-[1px] flex-1 bg-gradient-to-l from-transparent ${
          isDark
            ? "via-slate-600 to-slate-400"
            : theme === "gold-velvet"
              ? "via-[#c5a85c]/40 to-[#c5a85c]/85"
              : theme === "emerald-velvet"
                ? "via-[#34d399]/40 to-[#34d399]/85"
                : theme === "navy-velvet"
                  ? "via-[#1b3168]/40 to-[#1b3168]/85"
                  : "via-emerald-700/30 to-emerald-700/75"
        }`}></div>
        <span 
          className={`text-2xl sm:text-3xl md:text-4xl font-normal text-center leading-relaxed select-none px-2 ${
            isDark
              ? "text-slate-100"
              : theme === "emerald-velvet"
                ? "text-[#FAF8F5]"
                : theme === "gold-velvet"
                  ? "text-amber-950"
                  : "text-slate-950"
          }`}
          style={{ 
            fontFamily: "'QCF4_QBSML', 'Amiri', serif",
            color: isDark ? "#f1f5f9" : undefined
          }}
        >
          {getBismillahGlyph()}
        </span>
        <div className={`h-[1px] flex-1 bg-gradient-to-r from-transparent ${
          isDark
            ? "via-slate-600 to-slate-400"
            : theme === "gold-velvet"
              ? "via-[#c5a85c]/40 to-[#c5a85c]/85"
              : theme === "emerald-velvet"
                ? "via-[#34d399]/40 to-[#34d399]/85"
                : theme === "navy-velvet"
                  ? "via-[#1b3168]/40 to-[#1b3168]/85"
                  : "via-emerald-700/30 to-emerald-700/75"
        }`}></div>
      </div>
    </div>
  );
};

const AyahReadingHeader = ({ page, theme, isDark }: { page: number; theme: string; isDark: boolean }) => {
  const meta = getHizbAndJuzMetadata(page);
  const juzText = `الجُزْءُ ${getJuzOrdinalName(meta.juzNum || 1)}`;
  
  let quarterText = "";
  if (meta.quarterPart === "بداية الحزب") quarterText = "بِدَايَةُ الحِزْبِ";
  else if (meta.quarterPart === "ربع الحزب") quarterText = "رُبْعُ الحِزْبِ";
  else if (meta.quarterPart === "نصف الحزب") quarterText = "نِصْفُ الحِزْبِ";
  else if (meta.quarterPart === "ثلاثة أرباع") quarterText = "ثَلَاثَةُ أَرْبَاعِ الحِزْبِ";
  else quarterText = meta.quarterPart || "";

  const hizbText = meta.hizbNum ? `${quarterText} ${toArabicNumerals(meta.hizbNum)}` : "";
  const infoText = hizbText ? `${juzText} | ${hizbText}` : juzText;

  let surahTitle = meta.surahName || "سُورَةُ البَقَرَةِ";
  if (!surahTitle.startsWith("سُورَةُ") && !surahTitle.startsWith("سورة")) {
    surahTitle = `سُورَةُ ${surahTitle}`;
  }

  // Colors
  let borderColor = "#044f31";
  let bgFill = "#ECEAE4";
  let textColor = "#044f31";

  if (theme === "navy-velvet") {
    bgFill = "#E4F2FE";
    borderColor = isDark ? "#60a5fa" : "#1b3168";
    textColor = isDark ? "#bfdbfe" : "#1b3168";
  } else if (theme === "gold-velvet") {
    bgFill = "#FFFDF5";
    borderColor = isDark ? "#fcd34d" : "#967228";
    textColor = isDark ? "#fef08a" : "#715112";
  } else if (theme === "emerald-velvet") {
    bgFill = isDark ? "#01241A" : "#ECEAE4";
    borderColor = isDark ? "#34D399" : "#044f31";
    textColor = isDark ? "#a7f3d0" : "#044f31";
  } else if (isDark) {
    bgFill = "#1E293B";
    borderColor = "#34D399";
    textColor = "#a7f3d0";
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-3 px-2 select-none animate-fade-in">
      <svg
        width="100%"
        height="38"
        viewBox="0 0 900 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-2xs"
      >
        {/* Outer Banner Path with Ornamental Islamic Arched Ends */}
        <path
          d="M 45,6 
             L 855,6 
             Q 868,6 875,13 
             Q 882,19 875,25 
             Q 868,32 855,32 
             L 45,32 
             Q 32,32 25,25 
             Q 18,19 25,13 
             Q 32,6 45,6 Z"
          fill={bgFill}
          stroke={borderColor}
          strokeWidth="1.5"
        />
        {/* Inner Fine Border */}
        <path
          d="M 47,8 
             L 853,8 
             Q 865,8 871,14 
             Q 877,19 871,24 
             Q 865,30 853,30 
             L 47,30 
             Q 35,30 29,24 
             Q 23,19 29,14 
             Q 35,8 47,8 Z"
          fill="none"
          stroke={borderColor}
          strokeWidth="0.8"
          opacity="0.6"
        />

        {/* Left Tip Floral Finial */}
        <circle cx="16" cy="19" r="3" fill={borderColor} opacity="0.8" />
        <circle cx="9" cy="19" r="1.8" fill={borderColor} opacity="0.6" />

        {/* Right Tip Floral Finial */}
        <circle cx="884" cy="19" r="3" fill={borderColor} opacity="0.8" />
        <circle cx="891" cy="19" r="1.8" fill={borderColor} opacity="0.6" />

        {/* Left Side: Surah Name */}
        <text
          x="65"
          y="19"
          textAnchor="start"
          dominantBaseline="central"
          fill={textColor}
          style={{ fontFamily: "'Amiri', 'UthmanicHafs', serif", fontWeight: "bold" }}
          className="text-[15px] sm:text-[17px]"
        >
          {surahTitle}
        </text>

        {/* Right Side: Juz / Hizb Info */}
        <text
          x="835"
          y="19"
          textAnchor="end"
          dominantBaseline="central"
          fill={textColor}
          style={{ fontFamily: "'Amiri', 'UthmanicHafs', serif", fontWeight: "bold" }}
          className="text-[13px] sm:text-[15px]"
        >
          {infoText}
        </text>
      </svg>
    </div>
  );
};

const FATIHA_TAFSIR: Record<number, string> = {
  1: "سورة الفاتحة سميت هذه السورة بالفاتحة؛ لأنه يفتتح بها القرآن العظيم، وتسمى المثاني؛ لأنها تقرأ في كل ركعة، ولها أسماء أخر. أبتدئ قراءة القرآن باسم الله مستعينا به، (الله) علم على الرب -تبارك وتعالى- المعبود بحق دون سواه، وهو أخص أسماء الله تعالى، ولا يسمى به غيره سبحانه. (الرَّحْمَنِ) ذي الرحمة العامة الذي وسعت رحمته جميع الخلق، (الرَّحِيمِ) بالمؤمنين، وهما اسمان من أسمائه تعالى، يتضمنان إثبات صفة الرحمة لله تعالى كما يليق بجلاله.",
  2: "(الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ) الثناء على الله بصفاته التي كلها أوصاف كمال، وبنعمه الظاهرة والباطنة، الدينية والدنيوية، وفي ضمنه أَمْرٌ لعباده أن يحمدوه، فهو المستحق له وحده، وهو سبحانه المنشئ للخلق، القائم بأمورهم، المدبر لشؤونهم، المربي لجميع خلقه بالنعم.",
  3: "(الرَّحْمَنِ) الذي وسعت رحمته جميع الخلق، (الرَّحِيمِ) بالمؤمنين.",
  4: "(مَالِكِ يَوْمِ الدِّينِ) وهو يوم الجزاء والحساب، وتخصيص الملك بيوم الدين؛ لأنه لا يدعي أحد هناك ملكًا، ولا يتكلم أحد إلا بإذنه.",
  5: "(إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ) نخصك وحدك بالعبادة، ونستعين بك وحدك في جميع أمورنا.",
  6: "(اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ) دلنا ووفقنا إلى الطريق المستقيم والحديث عنه واسلك بنا فيه.",
  7: "(صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ) طريق النبيين والصديقين والشهداء والصالحين، (غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ) وهم الذين عرفوا الحق ولم يعملوا به، كاليهود، (وَلَا الضَّالِّينَ) وهم الذين تركوا الحق عن جهل وضلال، كالنصارى."
};

const AyahEndMarkerSvg = ({ 
  number, 
  toArabicNumerals, 
  theme, 
  isDark 
}: { 
  number: number; 
  toArabicNumerals: (n: number) => string; 
  theme: string; 
  isDark: boolean; 
}) => {
  const strokeColor = 
    theme === "navy-velvet" ? (isDark ? "#60a5fa" : "#1b3168") :
    theme === "gold-velvet" ? (isDark ? "#fcd34d" : "#c5a85c") :
    theme === "emerald-velvet" ? (isDark ? "#34d399" : "#059669") :
    isDark ? "#34d399" : "#047857";

  const numText = toArabicNumerals(number);
  const isTripleDigit = number >= 100;
  const isDoubleDigit = number >= 10 && number < 100;

  return (
    <span 
      className="inline-flex items-center justify-center align-middle mx-1 my-0.5 select-none shrink-0" 
      dir="rtl"
      title={`الآية ${numText}`}
    >
      <svg 
        className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 inline-block overflow-visible" 
        viewBox="0 0 36 36" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Islamic decorative floral rosette circle with theme color */}
        <g stroke={strokeColor} strokeWidth="1.15" strokeLinejoin="round" fill="none" opacity="0.95">
          <circle cx="18" cy="18" r="14" stroke={strokeColor} strokeWidth="1.1" />
          <circle cx="18" cy="18" r="12.2" stroke={strokeColor} strokeWidth="0.75" strokeDasharray="1.2 1.2" />
          <polygon 
            points="18,3.5 21.8,7.3 27,6 26.7,11.5 31.5,14 28.7,18.7 31.5,23.5 26.7,26 27,31.5 21.8,30.2 18,34 14.2,30.2 9,31.5 9.3,26 4.5,23.5 7.3,18.7 4.5,14 9.3,11.5 9,6 14.2,7.3" 
            stroke={strokeColor} 
            strokeWidth="0.9" 
            fill={`${strokeColor}15`} 
          />
          <circle cx="18" cy="18" r="9.2" stroke={strokeColor} strokeWidth="0.85" fill="none" />
        </g>
        {/* Small corner decorative dots */}
        <circle cx="18" cy="4.5" r="0.65" fill={strokeColor} />
        <circle cx="18" cy="31.5" r="0.65" fill={strokeColor} />
        <circle cx="4.5" cy="18" r="0.65" fill={strokeColor} />
        <circle cx="31.5" cy="18" r="0.65" fill={strokeColor} />
        {/* Centered Ayah Number */}
        <text 
          x="18" 
          y="18.5" 
          dominantBaseline="central" 
          textAnchor="middle" 
          fill={isDark ? "#f8fafc" : "#0f172a"}
          style={{
            fontFamily: "'Amiri', 'Traditional Arabic', 'Scheherazade New', serif",
            fontWeight: "bold",
            fontSize: isTripleDigit ? "10px" : isDoubleDigit ? "11.5px" : "13px",
          }}
        >
          {numText}
        </text>
      </svg>
    </span>
  );
};

interface LinguisticParsedItem {
  word: string;
  meaning: string;
  isNote?: boolean;
  isHeader?: boolean;
  isReference?: boolean;
  refLabel?: string;
  ayahText?: string;
  isAyahQuote?: boolean;
  isBalaghaTitle?: boolean;
}

type GharibParsedItem = LinguisticParsedItem;

const isLinguisticsOrIrabMode = (mode: string): boolean => {
  if (
    mode === "gharib" ||
    mode === "suraj_garib_quran" ||
    mode === "siraj_garib_quran" ||
    mode === "book_irab" ||
    mode === "book_jadwal_safi" ||
    mode === "book_sarf" ||
    mode === "book_balagha" ||
    mode === "eerab" ||
    mode === "irab" ||
    mode === "sarf" ||
    mode === "balagha" ||
    mode === "mutashabihat" ||
    mode === "book_mutashabihat_saghir"
  ) {
    return true;
  }
  const b = DEFAULT_BOOKS.find(book => book.id === mode || book.apiType === mode);
  return (
    b?.mainCategory === "linguistics" ||
    b?.mainCategory === "mutashabihat" ||
    b?.subCategory === "irab" ||
    b?.subCategory === "garib" ||
    b?.subCategory === "sarf" ||
    b?.subCategory === "balagha" ||
    b?.subCategory === "maani" ||
    b?.subCategory === "mutashabihat_kutub"
  );
};

const isGharibCardMode = isLinguisticsOrIrabMode;

const isTadabburMode = (mode: string): boolean => {
  if (
    mode === "book_tadabbur" ||
    mode === "tadabbur" ||
    mode === "hidaya" ||
    mode === "book_fawaid_tadabbur" ||
    mode.startsWith("book_tdabur") ||
    mode.startsWith("tdabur")
  ) {
    return true;
  }
  const b = DEFAULT_BOOKS.find(book => book.id === mode || book.apiType === mode);
  return b?.mainCategory === "tadabbur" || b?.subCategory === "fawaid" || false;
};

const checkIsBalaghaTitle = (wStr: string): boolean => {
  const cleanW = wStr.replace(/^[\s\(\[\{«"'\u0660-\u0669\d\.\-]+|[\s\)\]\}»"'\-]+$/g, "").trim();
  return (
    /^(?:سلامة\s+النظم|براعة\s+الربط|الإسناد\s+الخبري|أسلوب\s+|التوكيد\s+|الاستفهام\s+|الاستعارة\s+|الكناية\s+|التمثيل\s+|التصوير\s+|التدرج\s+|التقديم\s+|تقديم\s+|القصر\s+|الحصر\s+|الالتفات|الجناس|الطباق|المقابلة|الإيجاز|الإطناب|حسن\s+التعليل|رد\s+العجز|التضمين|المجاز|البيان|المعاني|البديع|السر\s+|دلالة\s+|التعبير\s+|حذف\s+|ذكر\s+|إيثار\s+|فائدة\s+|وقفة\s+|لطيفة\s+|تناسب\s+|الجمع\s+|موقع\s+|تكرار\s+|إفراد\s+)/.test(cleanW) ||
    cleanW.includes("النظم") ||
    cleanW.includes("البلاغي") ||
    cleanW.includes("البلاغية") ||
    cleanW.includes("البياني") ||
    cleanW.includes("البيانية") ||
    cleanW.includes("الربط") ||
    cleanW.includes("العنوان") ||
    cleanW.includes("اللمسة") ||
    cleanW.length >= 10
  );
};

const parseLinguisticItems = (text: string): LinguisticParsedItem[] => {
  if (!text) return [];

  // If there are no mutashabihat in the ayah, suffice strictly with: ( لا يوجد متشابه لفظي لهذه الاية )
  if (
    (text.includes("لا يوجد موضع متشابه") ||
     text.includes("لا يوجد متشابه لفظي") ||
     text.includes("لا يوجد تشابه لفظي") ||
     text.includes("لا يوجد متشابه")) &&
    !text.includes("الموضع المتشابه")
  ) {
    return [{ word: "", meaning: "( لا يوجد متشابه لفظي لهذه الاية )", isNote: true }];
  }

  // If there is no gharib vocabulary in the ayah, suffice strictly with: لم يُدوّن غريب مفردات خاص لهذه الآية الكريمة
  if (
    (text.includes("لم يُدوّن غريب") ||
     text.includes("لم يدون غريب") ||
     text.includes("لا توجد كلمات غريبة")) &&
    !text.includes("):")
  ) {
    return [{ word: "", meaning: "لم يُدوّن غريب مفردات خاص لهذه الآية الكريمة", isNote: true }];
  }

  // Ensure all markdown stars/asterisks are completely removed
  const cleanInput = text.replace(/\*/g, "");
  const lines = cleanInput.split("\n").map(l => l.trim()).filter(Boolean);
  const items: LinguisticParsedItem[] = [];

  for (const line of lines) {
    // 1. Skip redundant ayah quotes: الآية: { ... }
    if (/^الآية\s*:\s*\{.*?\}\s*$/i.test(line)) {
      continue;
    }

    // 2. Section Headers (e.g. #### 📍 الإعراب والجمل:, #### 📍 التحليل الصرفي:, etc.)
    if (
      /^(?:####?|###?|##?)\s*(?:📍|🔹|📌)?\s*([^:\n]+)[:：]?\s*$/.test(line) ||
      /^(?:التحليل الصرفي|الإعراب والجمل|البلاغة والبيان|الإعراب|الصرف|البلاغة|الموضع المتشابه)\s*[:：]?\s*$/.test(line) ||
      /^الموضع المتشابه\s*\(\d+\)\s*[:：]?/i.test(line)
    ) {
      const headerMatch = line
        .replace(/^(?:####?|###?|##?)\s*/, "")
        .replace(/^[📍🔹📌\s]+/, "")
        .replace(/[:：\s]+$/, "")
        .replace(/[*_]/g, "")
        .trim();
      if (headerMatch) {
        if (items.length > 0 && items[items.length - 1].isHeader && items[items.length - 1].meaning === headerMatch) {
          continue;
        }
        items.push({ word: "", meaning: headerMatch, isHeader: true });
        continue;
      }
    }

    // 3. Notes / notifications
    if (
      line.startsWith("لم يُدوّن") ||
      line.startsWith("لم يدون") ||
      line.includes("فالكلمات فيها جليّة") ||
      line.includes("فالكلمات فيها جلية") ||
      line.includes("لا توجد كلمات غريبة") ||
      line.includes("لا يوجد إعراب مسجل") ||
      line.startsWith("لم يرد") ||
      line.startsWith("لا يوجد موضع متشابه") ||
      line.startsWith("📚 المصدر") ||
      line.startsWith("المصدر:")
    ) {
      items.push({ word: "", meaning: line.replace(/[*_]/g, "").trim(), isNote: true });
      continue;
    }

    // Clean initial bullet stars/dashes or blockquote markers if any
    const cleanedLine = line.replace(/^[\s*•\-–—>]+\s*/, "").replace(/\*/g, "").trim();

    // Check if line is an Ayah quote line e.g. "قال الله تعالى: (الآية)" or "قوله تعالى: {الآية}" or "قوله: تعالى ..."
    const ayahQuoteMatch = cleanedLine.match(/^(?:قال\s+الله\s+تعالى|قوله\s*[:：]?\s*تعالى|الآية\s*الكريمة|الآية|النص\s*القرآني)\s*[:：]?\s*(.*)$/i);
    if (ayahQuoteMatch) {
      let verseText = ayahQuoteMatch[1].trim();
      verseText = verseText.replace(/^[:：\-–—\s]+/, "").trim();
      const wrapped = verseText.match(/^[\s\{«\(\["]*([^{}«»\(\)\[\]"]+)[\s\}»\)\]"]*$/);
      if (wrapped) {
        verseText = wrapped[1].trim();
      } else {
        verseText = verseText.replace(/^[\s\{«\(\["]+|[\s\}»\)\]"]+$/g, "").trim();
      }
      if (verseText) {
        items.push({
          word: "قال الله تعالى:",
          meaning: "",
          ayahText: verseText,
          isAyahQuote: true,
        });
        continue;
      }
    }

    // Check if line is a Surah/Ayah Reference with verse text (e.g. "سورة البقرة: 25: (آية)" or "البقرة 25: آية")
    const refMatch = cleanedLine.match(/^(\*{0,2}(?:سورة\s+[^\d\n:：]+|\d+)\s*[:：\s]*\d+\*{0,2})\s*[:：\-–—]\s*(.*)$/);
    if (refMatch) {
      const rawRef = refMatch[1].replace(/[*_]/g, "").trim();
      const rawAyah = refMatch[2].replace(/[*_]/g, "").trim();
      const wrappedMatch = rawAyah.match(/^[\(\{«]([^\)\}»]+)[\)\}»]\s*(.*)$/);
      let ayahContent = rawAyah;
      let extraMeaning = "";
      if (wrappedMatch) {
        ayahContent = wrappedMatch[1].trim();
        extraMeaning = wrappedMatch[2].trim();
      }
      items.push({
        word: "",
        meaning: extraMeaning,
        isReference: true,
        refLabel: rawRef,
        ayahText: ayahContent,
      });
      continue;
    }

    // 4. Matches with bold markdown: **word**: explanation
    const boldMatch = cleanedLine.match(/^\*\*([^*]+)\*\*\s*[:：\-–—]?\s*(.*)$/);
    if (boldMatch) {
      const w = boldMatch[1].replace(/^[\s\(\[\{«"'\u0660-\u0669\d\.\-]+|[\s\)\]\}»"'\-]+$/g, "").replace(/[*_]/g, "").trim();
      const m = boldMatch[2].replace(/^[\s:：\-–—\)\]\}»\(\[\{«"'\*\#]+/, "").replace(/^[:：\-–—\s]+/, "").replace(/[*_]/g, "").trim();
      if (w && m) {
        if (/^(?:سورة\s+[^\d\n:：]+|\d+)\s*[:：\s]*\d+/.test(w)) {
          items.push({
            word: "",
            meaning: "",
            isReference: true,
            refLabel: w,
            ayahText: m.replace(/^[\s\{«\(\[]+|[\s\}»\)\]]+$/g, ""),
          });
        } else {
          items.push({ word: w, meaning: m, isBalaghaTitle: checkIsBalaghaTitle(w) });
        }
        continue;
      }
    }

    // 5. Matches with braces: { word }: explanation
    const braceMatch = cleanedLine.match(/^\{([^{}]+)\}\s*[:：\-–—]?\s*(.*)$/);
    if (braceMatch) {
      const w = braceMatch[1].replace(/^[\s\(\[\{«"'\u0660-\u0669\d\.\-]+|[\s\)\]\}»"'\-]+$/g, "").replace(/[*_]/g, "").trim();
      const m = braceMatch[2].replace(/^[\s:：\-–—\)\]\}»\(\[\{«"'\*\#]+/, "").replace(/^[:：\-–—\s]+/, "").replace(/[*_]/g, "").trim();
      if (w && m) {
        items.push({ word: w, meaning: m, isBalaghaTitle: checkIsBalaghaTitle(w) });
        continue;
      }
    }

    // 6. Matches with Quranic brackets: ﴿ word ﴾: explanation
    const quranBraceMatch = cleanedLine.match(/^﴿([^﴿﴾]+)﴾\s*[:：\-–—]?\s*(.*)$/);
    if (quranBraceMatch) {
      const w = quranBraceMatch[1].replace(/^[\s\(\[\{«"'\u0660-\u0669\d\.\-]+|[\s\)\]\}»"'\-]+$/g, "").replace(/[*_]/g, "").trim();
      const m = quranBraceMatch[2].replace(/^[\s:：\-–—\)\]\}»\(\[\{«"'\*\#]+/, "").replace(/^[:：\-–—\s]+/, "").replace(/[*_]/g, "").trim();
      if (w && m) {
        items.push({ word: w, meaning: m, isBalaghaTitle: checkIsBalaghaTitle(w) });
        continue;
      }
    }

    // 7. Matches with parentheses: (word): explanation
    const parenMatch = cleanedLine.match(/^\(([^()]+)\)\s*[:：\-–—]?\s*(.*)$/);
    if (parenMatch) {
      const w = parenMatch[1].replace(/^[\s\(\[\{«"'\u0660-\u0669\d\.\-]+|[\s\)\]\}»"'\-]+$/g, "").replace(/[*_]/g, "").trim();
      const m = parenMatch[2].replace(/^[\s:：\-–—\)\]\}»\(\[\{«"'\*\#]+/, "").replace(/^[:：\-–—\s]+/, "").replace(/[*_]/g, "").trim();
      if (w && m) {
        items.push({ word: w, meaning: m, isBalaghaTitle: checkIsBalaghaTitle(w) });
        continue;
      }
    }

    // 8. Matches with colon: word: explanation (where word is <= 60 chars)
    const colonIdx = cleanedLine.indexOf(":") !== -1 ? cleanedLine.indexOf(":") : cleanedLine.indexOf("：");
    if (colonIdx > 0 && colonIdx < 60) {
      const rawW = cleanedLine
        .substring(0, colonIdx)
        .replace(/^[\s\-\*\•\d\.\u0660-\u0669]+/, "")
        .replace(/^[\s\(\[\{«"'\u0660-\u0669\d\.\-]+|[\s\)\]\}»"'\-]+$/g, "")
        .replace(/[{}[\\]«»*]/g, "")
        .trim();
      const m = cleanedLine
        .substring(colonIdx + 1)
        .replace(/^[\s:：\-–—\)\]\}»\(\[\{«"'\*\#]+/, "")
        .replace(/^[:：\-–—\s]+/, "")
        .replace(/[*_]/g, "")
        .trim();
      if (rawW && m) {
        // Guard: check if rawW is "قوله" and m starts with "تعالى", or "قوله تعالى", or "قال الله تعالى"
        if (/^(?:قوله|قال\s+الله|قوله\s+تعالى|قال\s+الله\s+تعالى)$/.test(rawW)) {
          let vText = m.replace(/^تعالى\s*[:：]?\s*/, "").replace(/^[\s\{«\(\["]+|[\s\}»\)\]"]+$/g, "").trim();
          if (vText) {
            items.push({
              word: "قال الله تعالى:",
              meaning: "",
              ayahText: vText,
              isAyahQuote: true,
            });
            continue;
          }
        }

        if (/^(?:سورة\s+[^\d\n:：]+|\d+)\s*[:：\s]*\d+/.test(rawW)) {
          items.push({
            word: "",
            meaning: "",
            isReference: true,
            refLabel: rawW,
            ayahText: m.replace(/^[\s\{«\(\[]+|[\s\}»\)\]]+$/g, ""),
          });
        } else {
          items.push({ 
            word: rawW, 
            meaning: m,
            isBalaghaTitle: checkIsBalaghaTitle(rawW)
          });
        }
        continue;
      }
    }

    items.push({ word: "", meaning: cleanedLine.replace(/[*_]/g, "").trim(), isNote: true });
  }

  return items;
};

const parseGharibItems = parseLinguisticItems;

const getBalaghaTitleColorClass = (t: string, dark: boolean): string => {
  if (t === "emerald-velvet") {
    return "text-[#f87171]"; // Vivid crimson red on dark emerald
  }
  if (t === "gold-velvet") {
    return "text-[#b91c1c]"; // Rich deep burgundy red on warm gold
  }
  if (t === "navy-velvet") {
    return "text-[#ef4444]"; // Vivid bright red on navy
  }
  if (dark) {
    return "text-[#f87171]"; // Vivid light red on dark mode
  }
  return "text-[#dc2626]"; // Vibrant red
};

const getLinguisticWordColorClass = (t: string, dark: boolean): string => {
  if (t === "emerald-velvet") {
    return "text-[#f87171]"; // Vivid crimson red on dark emerald
  }
  if (t === "navy-velvet") {
    return "text-[#ef4444]"; // Vivid bright red on navy
  }
  if (dark) {
    return "text-[#f87171]"; // Vivid light red on dark mode
  }
  if (t === "gold-velvet") {
    return "text-[#b91c1c]"; // Rich deep burgundy red on warm gold
  }
  return "text-[#dc2626]"; // Vibrant red
};

const getGharibWordColorClass = getLinguisticWordColorClass;

const renderFormattedMeaningText = (
  text: string,
  theme: string,
  isDark: boolean,
  colorClass?: string
) => {
  if (!text) return null;
  // 1. Remove all asterisks and collapse duplicate parentheses e.g. ((...)) or (...))
  const clean = text
    .replace(/\*/g, "")
    .replace(/\(\(+/g, "(")
    .replace(/\)\)+/g, ")")
    .trim();
  const redClass = colorClass || getLinguisticWordColorClass(theme, isDark);

  // 2. Split by parenthesized or braced expressions: (ayah/word) or {ayah/word} or «ayah/word» or "ayah/word"
  const tokenRegex = /(\([^\(\)]+\)|\{[^\{\}]+\}|﴿[^﴿﴾]+﴾|«[^«»]+»|"[^"\n]+")/g;
  const parts = clean.split(tokenRegex);

  return parts.map((part, pIdx) => {
    if (!part) return null;

    if (
      (part.startsWith("(") && part.endsWith(")")) ||
      (part.startsWith("{") && part.endsWith("}")) ||
      (part.startsWith("﴿") && part.endsWith("﴾")) ||
      (part.startsWith("«") && part.endsWith("»")) ||
      (part.startsWith('"') && part.endsWith('"'))
    ) {
      const inner = part
        .slice(1, -1)
        .replace(/\*/g, "")
        .replace(/^[\s\(\[\{«"'\u0660-\u0669\d\.\-]+|[\s\)\]\}»"'\-]+$/g, "")
        .trim();
      if (/[\u0621-\u064A]/.test(inner) && !/^(\d+|tdabur\d|ليدبروا|\d+\/\d+)$/.test(inner) && !inner.startsWith("لا يوجد") && !inner.startsWith("لم")) {
        return (
          <span 
            key={pIdx} 
            className={`font-bold inline-flex items-center gap-0.5 select-text ${redClass}`}
            style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}
          >
            <span className="font-bold select-none">(</span>
            <span>{inner}</span>
            <span className="font-bold select-none">)</span>
          </span>
        );
      }
    }

    // Strip any accidental lone closing parentheses immediately following a parenthesized word
    const sanitizedPart = part.replace(/^\)+/, "");
    if (!sanitizedPart) return null;

    return (
      <span key={pIdx} className="select-text">
        {sanitizedPart}
      </span>
    );
  });
};

const AyahWithTafsirCard = ({
  ayah,
  surahNumber,
  surahName,
  theme,
  isDark,
  activeFontClass,
  fontSizeClass,
  isActivePlaying,
  isSelected,
  isBookmarked,
  bookmarkCategory,
  toArabicNumerals,
  getAyahStyle,
  currentPage,
  ayahElementsRef,
  lastClickTimeRef,
  handleAyahPlayToggle,
  handleAyahSelect,
  longPressActiveRef,
  onStartLongPress,
  onCancelLongPress,
  onCheckLongPressMove,
  activeMode,
  onChangeSurah,
  globalAyahFontSize,
  onUpdateAyahFontSize,
  globalTafsirFontSize,
  onUpdateTafsirFontSize,
  onOpenShare,
  onOpenBookmarkMenu,
  onOpenNote,
  hasNote,
}: {
  ayah: Ayah;
  surahNumber: number;
  surahName: string;
  theme: string;
  isDark: boolean;
  activeFontClass: string;
  fontSizeClass: string;
  isActivePlaying: boolean;
  isSelected: boolean;
  isBookmarked: boolean;
  bookmarkCategory?: string;
  toArabicNumerals: (n: number) => string;
  getAyahStyle: any;
  currentPage: number;
  ayahElementsRef: any;
  lastClickTimeRef: any;
  handleAyahPlayToggle: (ayah: Ayah) => void;
  handleAyahSelect: (ayah: Ayah) => void;
  longPressActiveRef: any;
  onStartLongPress: (e: any, ayah: Ayah) => void;
  onCancelLongPress: (e: any) => void;
  onCheckLongPressMove: (e: any) => void;
  activeMode: string;
  onChangeSurah?: (surahNumber: number, startAyah?: number, pageNumber?: number) => void;
  globalAyahFontSize?: number;
  onUpdateAyahFontSize?: (newSize: number) => void;
  globalTafsirFontSize?: number;
  onUpdateTafsirFontSize?: (newSize: number) => void;
  onOpenShare?: (ayah: Ayah) => void;
  onOpenBookmarkMenu?: (e: React.MouseEvent, ayah: Ayah) => void;
  onOpenNote?: (ayah: Ayah) => void;
  hasNote?: boolean;
}) => {
  const currentAyahFontSize = globalAyahFontSize !== undefined && globalAyahFontSize >= 14 ? globalAyahFontSize : 14;
  const currentTafsirFontSize = globalTafsirFontSize !== undefined ? globalTafsirFontSize : 10;
  const [dataCache, setDataCache] = useState<Record<string, string>>(() => {
    if (surahNumber === 1 && FATIHA_TAFSIR[ayah.numberInSurah]) {
      return { tafsir: FATIHA_TAFSIR[ayah.numberInSurah], translation: ayah.translationEn };
    }
    return { translation: ayah.translationEn };
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedTafsir, setCopiedTafsir] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState<boolean>(false);
  const [internalHasNote, setInternalHasNote] = useState<boolean>(() => {
    return Boolean(hasNote || localStorage.getItem(`tebyan_user_ayah_notes_${surahNumber}_${ayah.numberInSurah}`));
  });

  useEffect(() => {
    const handleNoteUpdated = (e: any) => {
      if (e.detail?.surahNumber === surahNumber && e.detail?.ayahNumber === ayah.numberInSurah) {
        setInternalHasNote(Boolean(e.detail.content));
        setDataCache(prev => ({
          ...prev,
          notes: e.detail.content || "لم تدون تقييداً أو خاطرة لهذه الآية بعد. يمكنك تدوين وحفظ فوائدك وتدبراتك الشخصية هنا."
        }));
      }
    };
    window.addEventListener("tebyan_ayah_note_saved", handleNoteUpdated);
    return () => window.removeEventListener("tebyan_ayah_note_saved", handleNoteUpdated);
  }, [surahNumber, ayah.numberInSurah]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" } // Load early before scrolling into view
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasBeenVisible) return;
    if (dataCache[activeMode]) return; // already loaded

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeMode === "notes") {
          const savedNote = localStorage.getItem(`tebyan_user_ayah_notes_${surahNumber}_${ayah.numberInSurah}`) || "";
          if (isMounted) {
            setDataCache(prev => ({
              ...prev,
              [activeMode]: savedNote || "لم تدون تقييداً أو خاطرة لهذه الآية بعد. يمكنك تدوين وحفظ فوائدك وتدبراتك الشخصية هنا."
            }));
            setLoading(false);
          }
          return;
        }

        let directOfflineResult: string | null = null;
        if (activeMode === "tafsir_muyassar") {
          directOfflineResult = getOfflineMuyassarTafsir(surahNumber, ayah.numberInSurah) || generateOfflineMuyassar(surahNumber, ayah.numberInSurah, surahName, ayah.text);
        } else if (activeMode === "tafsir_sadi") {
          directOfflineResult = getOfflineSaadiTafsir(surahNumber, ayah.numberInSurah) || generateOfflineSaadi(surahNumber, ayah.numberInSurah, surahName, ayah.text);
        } else if (activeMode === "tafsir_mukhtasar") {
          directOfflineResult = getOfflineMukhtasarTafsir(surahNumber, ayah.numberInSurah) || getOfflineMukhtasarTafsirFallback(surahNumber, ayah.numberInSurah, surahName, ayah.text);
        } else if (activeMode === "tafsir_aysar") {
          directOfflineResult = getOfflineAysarTafsir(surahNumber, ayah.numberInSurah);
        } else if (activeMode === "gharib" || activeMode === "suraj_garib_quran") {
          directOfflineResult = getOfflineGharib(surahNumber, ayah.numberInSurah, surahName, ayah.text);
        } else if (
          activeMode === "book_irab" ||
          activeMode === "book_sarf" ||
          activeMode === "book_balagha" ||
          activeMode === "eerab" ||
          activeMode === "sarf" ||
          activeMode === "balagha" ||
          activeMode === "book_jadwal_safi"
        ) {
          directOfflineResult = getOfflineSarf(surahNumber, ayah.numberInSurah, surahName, ayah.text, activeMode, true);
        } else if (
          activeMode === "muharrar_asbab" ||
          activeMode === "asbab_nuzool" ||
          activeMode === "asbab_nuzul_wahidi" ||
          activeMode === "asbab"
        ) {
          directOfflineResult = getOfflineAsbab(surahNumber, ayah.numberInSurah, surahName, ayah.text);
        } else if (
          activeMode === "book_tadabbur" ||
          activeMode === "tadabbur"
        ) {
          directOfflineResult = getOfflineTdabr(surahNumber, ayah.numberInSurah, surahName, ayah.text, activeMode, true);
        } else if (
          activeMode === "user_notes_books" ||
          activeMode === "user_notes_ayah" ||
          activeMode === "notes" ||
          activeMode === "taqeeda"
        ) {
          const savedNote = localStorage.getItem(`tebyan_ayah_note_${surahNumber}_${ayah.numberInSurah}`) || "";
          directOfflineResult = savedNote || "لم تدون تقييداً أو فائدة لهذه الآية بعد. اضغط هنا لكتابة وحفظ تقييداتك الشخصية.";
        } else if (
          activeMode === "mutashabihat" ||
          activeMode === "book_mutashabihat_saghir" ||
          activeMode === "book_taqeeda_saghir" ||
          activeMode === "book_durrat_tanzil" ||
          activeMode === "book_malak_tawil"
        ) {
          directOfflineResult = getOfflineMutashabihat(surahNumber, ayah.numberInSurah, surahName, ayah.text, activeMode);
        } else if (
          activeMode === "translation" ||
          activeMode === "translation_mukhtasar_en" ||
          activeMode === "translation_hilali_khan" ||
          activeMode === "translation_sahih_intl" ||
          activeMode === "translation_clear_quran" ||
          activeMode === "english" ||
          activeMode.startsWith("english_") ||
          activeMode.startsWith("french_") ||
          activeMode.startsWith("spanish_") ||
          activeMode.startsWith("german_") ||
          activeMode.startsWith("urdu_") ||
          activeMode.startsWith("turkish_") ||
          activeMode.startsWith("indonesian_") ||
          activeMode.startsWith("russian_") ||
          activeMode.startsWith("translation_")
        ) {
          try {
            const transResult = await getAyahTranslationText(surahNumber, ayah.numberInSurah, activeMode);
            if (transResult && transResult.text) {
              let formatted = transResult.text;
              if (transResult.footnotes && transResult.footnotes.trim()) {
                formatted += `\n\n📌 **Footnotes / الحواشي:**\n${transResult.footnotes.trim()}`;
              }
              directOfflineResult = formatted;
            }
          } catch (e) {
            console.warn("Translation API error in card:", e);
          }
          if (!directOfflineResult) {
            directOfflineResult = getOfflineEnglishTranslation(surahNumber, ayah.numberInSurah);
          }
        } else {
          directOfflineResult = await getOfflineLibraryContent(surahNumber, ayah.numberInSurah, activeMode, surahName, ayah.text);
        }

        if (directOfflineResult && !isCorruptAyahOnlyText(directOfflineResult, ayah.text) && isMounted) {
          setDataCache(prev => ({
            ...prev,
            [activeMode]: directOfflineResult!
          }));
          setLoading(false);
          return;
        }

        // 1. Check local IndexedDB offline storage first
        const cacheKey = `${surahNumber}:${ayah.numberInSurah}:${activeMode}`;
        const dbCached = (await getFromLibraryCache(cacheKey));
        if (dbCached && !isCorruptAyahOnlyText(dbCached, ayah.text) && isMounted) {
          let resolvedCached = dbCached;
          if (
            (activeMode.includes("mutashabihat") || activeMode === "book_mutashabihat_saghir") &&
            (resolvedCached.includes("لا يوجد موضع متشابه") || resolvedCached.includes("لا يوجد متشابه")) &&
            !resolvedCached.includes("الموضع المتشابه")
          ) {
            resolvedCached = "( لا يوجد متشابه لفظي لهذه الاية )";
            saveToLibraryCache(cacheKey, resolvedCached).catch(() => {});
          }
          if (
            (activeMode === "gharib" || activeMode === "suraj_garib_quran") &&
            (resolvedCached.includes("لم يُدوّن غريب") || resolvedCached.includes("لم يدون غريب") || resolvedCached.includes("فالكلمات فيها")) &&
            !resolvedCached.includes("):")
          ) {
            resolvedCached = "لم يُدوّن غريب مفردات خاص لهذه الآية الكريمة";
            saveToLibraryCache(cacheKey, resolvedCached).catch(() => {});
          }
          setDataCache(prev => ({
            ...prev,
            [activeMode]: resolvedCached
          }));
          setLoading(false);
          return;
        } else if (dbCached && isCorruptAyahOnlyText(dbCached, ayah.text)) {
          deleteFromLibraryCache(cacheKey).catch(() => {});
        }

        // 2. Fallback to API
        const currentBook = DEFAULT_BOOKS.find(b => b.id === activeMode || b.apiType === activeMode);
        const response = await fetch("/api/tafsir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surahName,
            surahNumber,
            ayahNumber: ayah.numberInSurah,
            ayahText: ayah.text,
            type: activeMode,
            bookTitle: currentBook?.title,
            bookAuthor: currentBook?.author,
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (response.ok) {
          const data = await response.json();
          if (isMounted && data && data.result) {
            setDataCache(prev => ({
              ...prev,
              [activeMode]: data.result
            }));
            saveToLibraryCache(cacheKey, data.result).catch(() => {});
          }
        }
      } catch (err) {
        console.warn(`Fetch ${activeMode} error, using offline fallback:`, err);
        if (isMounted) {
          const fallbackText = await getOfflineLibraryContent(surahNumber, ayah.numberInSurah, activeMode, surahName, ayah.text);
          if (fallbackText) {
            setDataCache(prev => ({ ...prev, [activeMode]: fallbackText }));
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [hasBeenVisible, activeMode, ayah.numberInSurah, surahNumber, surahName, ayah.text]);

  // Clean verse text if Bismillah is pre-anchored
  let displayedText = ayah.text;
  if (surahNumber !== 1 && ayah.numberInSurah === 1) {
    const bismillahTemplate = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
    if (displayedText.startsWith(bismillahTemplate)) {
      displayedText = displayedText.replace(bismillahTemplate, "").trim();
    }
  }

  // Theme-specific font color & card styles
  let fontColorClass = "text-emerald-950";
  let tafsirCardBgClass = "bg-[#F5F1EB] border-[#E8DFD5] text-slate-850 shadow-xs";

  if (theme === "gold-velvet") {
    fontColorClass = "text-[#012c1e]";
    tafsirCardBgClass = "bg-[#FFFDF5] border-2 border-[#c5a85c]/35 text-[#011c14] shadow-xs";
  } else if (theme === "navy-velvet") {
    fontColorClass = "text-slate-900";
    tafsirCardBgClass = "bg-white border-2 border-[#3F63C6]/25 text-slate-900 shadow-xs";
  } else if (theme === "emerald-velvet") {
    fontColorClass = "text-[#FAF8F5]";
    tafsirCardBgClass = "bg-[#012519] border-2 border-[#c5a85c]/35 text-[#FAF8F5] shadow-md";
  } else if (isDark) {
    fontColorClass = "text-slate-100";
    tafsirCardBgClass = "bg-slate-900 border-2 border-slate-800 text-slate-100 shadow-md";
  } else {
    fontColorClass = "text-emerald-950";
    tafsirCardBgClass = "bg-white border-2 border-emerald-200/80 text-slate-900 shadow-xs";
  }

  const handleClick = (e: React.MouseEvent) => {
    if (longPressActiveRef.current) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    handleAyahSelect(ayah);
  };

  const isUrdu = activeMode === "translation_urdu" || activeMode === "urdu" || activeMode.startsWith("urdu_") || activeMode.startsWith("persian_");
  const isTranslationMode = activeMode.includes("translation") || 
                            activeMode.includes("english") || 
                            activeMode.startsWith("english_") || 
                            activeMode.startsWith("french_") || 
                            activeMode.startsWith("spanish_") || 
                            activeMode.startsWith("german_") || 
                            activeMode.startsWith("urdu_") || 
                            activeMode.startsWith("turkish_") || 
                            activeMode.startsWith("indonesian_") || 
                            activeMode.startsWith("russian_") || 
                            activeMode === "english" || 
                            activeMode === "french" || 
                            activeMode === "urdu" || 
                            activeMode === "indonesian";
  const isEnglish = isTranslationMode && !isUrdu;
  const contentDir = isTranslationMode && !isUrdu ? "ltr" : "rtl";
  const contentTextAlign = isTranslationMode && !isUrdu ? "left" : "right";
  const contentFont = isTranslationMode && !isUrdu ? "font-sans font-normal" : "font-medium";
  const contentTextSize = isTranslationMode && !isUrdu ? "text-base sm:text-lg md:text-xl" : "text-base sm:text-lg md:text-xl";

  const rawText = dataCache[activeMode] || (
    activeMode === "notes"
      ? (localStorage.getItem(`tebyan_user_ayah_notes_${surahNumber}_${ayah.numberInSurah}`) || "لم تدون تقييداً أو خاطرة لهذه الآية بعد. يمكنك تدوين وحفظ فوائدك وتدبراتك الشخصية هنا.")
      : isLinguisticsOrIrabMode(activeMode) 
      ? "لم يرد لهذه الآية الكريمة بيان لغوي أو إعرابي." 
      : isTranslationMode
      ? (ayah.translationEn || getOfflineEnglishTranslation(surahNumber, ayah.numberInSurah) || "جاري جلب الترجمة من الخادم...")
      : "جاري تحميل محتوى الكتاب..."
  );

  const cleanTafsirCardText = (text: string, mode: string): string => {
    if (!text) return "";
    if (isTranslationMode) {
      return text.trim();
    }

    // If mutashabihat has no matches, suffice strictly with the single requested phrase
    if (
      (text.includes("لا يوجد موضع متشابه") ||
       text.includes("لا يوجد متشابه لفظي") ||
       text.includes("لا يوجد تشابه لفظي") ||
       text.includes("لا يوجد متشابه")) &&
      !text.includes("الموضع المتشابه")
    ) {
      return "( لا يوجد متشابه لفظي لهذه الاية )";
    }

    // If gharib has no entries, suffice strictly with the requested phrase
    if (
      (text.includes("لم يُدوّن غريب") ||
       text.includes("لم يدون غريب") ||
       text.includes("لا توجد كلمات غريبة")) &&
      !text.includes("):")
    ) {
      return "لم يُدوّن غريب مفردات خاص لهذه الآية الكريمة";
    }

    let cleaned = text;

    // 1. Remove Markdown headers that contain book titles (e.g. ### 📖 التفسير الميسر... or # ... or ## ...)
    if (!isLinguisticsOrIrabMode(mode)) {
      cleaned = cleaned.replace(/^#{1,6}\s*(?:📖|📚)?\s*.*$/gm, "");
    } else {
      cleaned = cleaned.replace(/^#{1,6}\s*(?:📖|📚)\s*.*$/gm, "");
    }

    // 2. Remove lines with book title icons or labels (e.g. 📖 **...**, **كتاب:...**)
    cleaned = cleaned.replace(/^(?:📖|📚)\s*\*\*.*?\*\*\s*.*$/gm, "");
    cleaned = cleaned.replace(/^(?:اسم الكتاب|الكتاب|اسم السفر|تفسير)\s*[:：].*$/gim, "");

    // 3. Remove compiler / author / editor lines (e.g. *إعداد:...*, تأليف:..., المؤلف:..., إشراف:...)
    cleaned = cleaned.replace(/^(?:\*|_)?(?:إعداد|المعد|المعدون|تأليف|المؤلف|اسم المؤلف|إشراف|المشرف|تحقيق|المحقق|جمع وترتيب|فضيلة الشيخ|فضيلة الإمام|الشيخ|الإمام)\s*[:：].*$/gim, "");
    cleaned = cleaned.replace(/^\*(?:إعداد|تأليف|المؤلف|إشراف|تحقيق|تنبيه توثيقي)[^*]*\*\s*$/gim, "");
    cleaned = cleaned.replace(/^(?:\*|_)?تنبيه توثيقي\s*[:：].*$/gim, "");

    // 4. Remove noble ayah quotes & verse mentions (only for regular tafsir books, NOT for Linguistics & Irab or Tadabbur)
    if (!isLinguisticsOrIrabMode(mode) && !isTadabburMode(mode)) {
      cleaned = cleaned.replace(/^>\s*(?:\*\*)?(?:الآية(?:\s*الكريمة)?|الآيات)\s*(?:\*\*)?\s*[:：].*$/gim, "");
      cleaned = cleaned.replace(/^(?:\*\*)?(?:الآية(?:\s*الكريمة)?|الآيات)\s*(?:\*\*)?\s*[:：].*$/gim, "");
      cleaned = cleaned.replace(/^>\s*\{.*?\}\s*$/gm, "");
      cleaned = cleaned.replace(/^>\s*".*?"\s*$/gm, "");
      cleaned = cleaned.replace(/^(?:قَوْلُهُ(?:\s*تَعَالَى)?|وَقَوْلُهُ(?:\s*تَعَالَى)?)\s*[:：]?\s*(?:\{[^}]+\}|"[^"]+")\s*[:：]?\s*(?:أي|يَعْنِي)?\s*[:：]?\s*/gim, "");
      cleaned = cleaned.replace(/^\{[^{}\n]{3,}\}\s*(?:أي|يعني|:\s*)?\s*/gim, "");
      cleaned = cleaned.replace(/^\*Sourate\s+\d+.*$/gim, "");
      cleaned = cleaned.replace(/^\*Surah\s+\d+.*$/gim, "");
      cleaned = cleaned.replace(/^\*سورۃ\s+.*$/gim, "");
      cleaned = cleaned.replace(/^\*সূরা\s+.*$/gim, "");
      cleaned = cleaned.replace(/^\[Sens en français\]\s*[:：]?\s*/gim, "");
    }

    // 5. Remove artificial structural section subheadings (skip for Tadabbur)
    if (!isTadabburMode(mode)) {
      cleaned = cleaned.replace(/^(?:\*\*)?(?:بيان المعنى الإجمالي(?:\s*الميسر)?|البيان والمعنى الإجمالي|تفسير الآية الكريمة وبيان وجه النظم|معالم التنزيل وهدايات الآية الكريمة|المعنى الإجمالي ومقتضى الآية الكريمة|التحليل اللفظي والمعنى العام|البيان الشرعي والفقهي للآية الكريمة|بيان المعاني الإيمانية والمقاصدية|هداية الآيات ومقاصدها|وجوه التفسير والبيان العصري الميسر|المسائل الفقهية والأحكام المستنبطة من الآية|المسائل الفقهية والأصولية المقررة|القول في تأويل قوله تعالى في هذه الآية الكريمة|فوائد ومستنبطات الشيخ [^:\n]+|المعنى الإجمالي|شرح الكلمات وغريب الألفاظ|من هدايات الآيات والدروس المستفادة)\s*[:：]?(?:\*\*)?\s*$/gim, "");
    }

    // 6. Remove known book title lines (skip for Tadabbur so multi-book titles remain)
    if (!isTadabburMode(mode)) {
      DEFAULT_BOOKS.forEach(b => {
        if (b.title) {
          const escaped = b.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          cleaned = cleaned.replace(new RegExp(`^(?:###?\\s*|\\*\\*|📖\\s*)?${escaped}(?:\\s*\\([^)]*\\))?\\*?\\*?\\s*$`, "gim"), "");
        }
      });

      // 7. Remove source / references lines and horizontal divider rules
      cleaned = cleaned.replace(/^---+$/gm, "");
      cleaned = cleaned.replace(/^(?:\*\*)?التدبر(?:\*\*)?\s*[:：]?\s*$/gim, "");
    }
    cleaned = cleaned.replace(/^.*تم استخراج.*(?:وقفة|وقفات)\s*تدبرية.*$/gim, "");
    if (!isTadabburMode(mode)) {
      cleaned = cleaned.replace(/المجموعة الأولى/g, "ليدبروا ١");
      cleaned = cleaned.replace(/المجموعة الثانية/g, "ليدبروا ٢");
      cleaned = cleaned.replace(/المجموعة الثالثة/g, "ليدبروا ٣");
      cleaned = cleaned.replace(/المجموعة الرابعة/g, "ليدبروا ٤");
      cleaned = cleaned.replace(/المجموعة الخامسة/g, "ليدبروا ٥");
    }
    cleaned = cleaned.replace(/`/g, "");
    if (!isTadabburMode(mode)) {
      cleaned = cleaned.replace(/^(?:\*|_)?(?:\*\*)?(?:📚\s*)?(?:المصدر(?:\s*المعتمد)?|ماخذ|مرجع|المرجع|مصدر التفسير|مصدر الترجمة|Source|Sumber|উৎস)\s*[:：].*$/gim, "");
      cleaned = cleaned.replace(/^\*(?:Reference|English Translation|English translation)\s*[:：].*$/gim, "");
      cleaned = cleaned.replace(/^\*مستفاد من كتب.*\*$/gim, "");
      cleaned = cleaned.replace(/^\*تيسير معاني القرآن الكريم.*\*$/gim, "");
    }

    // 8. Remove blue square / decorative icons
    cleaned = cleaned.replace(/[🔹🔷🟦]/g, "");

    // 9. Normalize spacing and formatting
    if (isLinguisticsOrIrabMode(mode)) {
      const items = parseLinguisticItems(cleaned);
      if (items.length > 0) {
        return items
          .map(item => {
            if (item.isHeader) return `\n[ ${item.meaning} ]\n`;
            if (item.isNote) return item.meaning;
            if (item.isAyahQuote && item.ayahText) {
              const cleanAyah = item.ayahText.replace(/^[\s\(\[\{«"']+|[\s\)\]\}»"']+$/g, "").trim();
              return `قال الله تعالى: (${cleanAyah})`;
            }
            if (item.isReference && item.refLabel) {
              const cleanAyah = (item.ayahText || "").replace(/^[\s\(\[\{«"']+|[\s\)\]\}»"']+$/g, "").trim();
              return `${item.refLabel}: ( ${cleanAyah} ) ${item.meaning || ""}`.trim();
            }
            const cleanW = item.word.replace(/^[\s\(\[\{«"']+|[\s\)\]\}»"']+$/g, "").trim();
            if (item.isBalaghaTitle || mode === "balagha" || mode === "book_balagha") {
              return `${cleanW}: ${item.meaning}`;
            }
            return `( ${cleanW} ): ${item.meaning}`;
          })
          .join("\n")
          .replace(/\*/g, "")
          .trim();
      }
      return cleaned.replace(/\*/g, "").split("\n").map(l => l.trim()).filter(Boolean).join("\n");
    } else {
      cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
    }

    // Remove all markdown stars / asterisks and duplicate parentheses
    cleaned = cleaned
      .replace(/\*/g, "")
      .replace(/\(\(+/g, "(")
      .replace(/\)\)+/g, ")");

    return cleaned.trim();
  };

  const currentBook = DEFAULT_BOOKS.find(b => b.id === activeMode || b.apiType === activeMode);
  const serviceTitle = currentBook ? currentBook.title : (
    activeMode === "notes" ? "تقييداتي وملاحظاتي" :
    isLinguisticsOrIrabMode(activeMode) ? "اللغويات والإعراب" :
    isTranslationMode ? "الترجمات المعتمدة" :
    "التفسير والبيان"
  );

  const handleCopyTafsir = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = cleanTafsirCardText(rawText, activeMode);
    if (!textToCopy) return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedTafsir(true);
        setTimeout(() => setCopiedTafsir(false), 2000);
      }).catch(() => {
        try {
          const textarea = document.createElement("textarea");
          textarea.value = textToCopy;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          setCopiedTafsir(true);
          setTimeout(() => setCopiedTafsir(false), 2000);
        } catch {}
      });
    } else {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopiedTafsir(true);
        setTimeout(() => setCopiedTafsir(false), 2000);
      } catch {}
    }
  };

  return (
    <div 
      ref={containerRef}
      id={`ayah-block-${ayah.numberInSurah}`}
      className="w-full mb-6 select-none mx-auto flex flex-col gap-3.5"
    >
      {/* Ayah Window Card (Library Window Style) */}
      <div 
        id={`ayah-word-span-${ayah.numberInSurah}`}
        style={getAyahStyle(ayah.page || currentPage)}
        ref={(el) => { ayahElementsRef.current[ayah.numberInSurah] = el as HTMLDivElement; }}
        onClick={handleClick}
        onDoubleClick={(e) => {
          if (longPressActiveRef.current) {
            e.stopPropagation();
            return;
          }
          e.stopPropagation();
          handleAyahPlayToggle(ayah);
        }}
        onMouseDown={(e) => onStartLongPress(e, ayah)}
        onMouseUp={(e) => onCancelLongPress(e)}
        onMouseMove={(e) => onCheckLongPressMove(e)}
        onTouchStart={(e) => onStartLongPress(e, ayah)}
        onTouchEnd={(e) => onCancelLongPress(e)}
        onTouchMove={(e) => onCheckLongPressMove(e)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onStartLongPress(e, ayah);
        }}
        className={`w-full cursor-pointer transition-all duration-300 rounded-2xl border-2 overflow-hidden shadow-xs relative ${
          isActivePlaying 
            ? "ring-2 ring-emerald-500/80" 
            : isSelected 
            ? "ring-2 ring-amber-400/80" 
            : ""
        } ${
          theme === "emerald-velvet"
            ? "bg-[#012519] border-[#c5a85c]/35 text-[#FAF8F5]"
            : theme === "gold-velvet"
              ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14]"
              : theme === "navy-velvet"
                ? "bg-white border-[#3F63C6]/25 text-slate-900"
                : isDark
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-emerald-200/80 text-slate-900"
        }`}
        dir="rtl"
      >
        {/* Top Accent Color Line */}
        <div className={`absolute top-0 right-0 left-0 h-[4px] z-10 ${
          theme === "gold-velvet" ? "bg-[#c5a85c]" :
          theme === "emerald-velvet" ? "bg-[#c5a85c]" :
          theme === "navy-velvet" ? "bg-[#3F63C6]" :
          isDark ? "bg-emerald-500" :
          "bg-emerald-600"
        }`} />

        {/* Header Bar */}
        <div className={`px-4 py-2.5 flex items-center justify-between border-b text-xs sm:text-sm font-bold select-none gap-2 ${
          theme === "emerald-velvet"
            ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]"
            : theme === "gold-velvet"
              ? "bg-[#FAF5E6] border-[#c5a85c]/35 text-[#011c14]"
              : theme === "navy-velvet"
                ? "bg-[#EFF6FF] border-[#3F63C6]/25 text-slate-900"
                : isDark
                  ? "bg-slate-950/90 border-slate-800 text-slate-200"
                  : "bg-emerald-50/80 border-emerald-200/80 text-emerald-950"
        }`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <BookOpen size={16} className={theme === "navy-velvet" ? "text-[#3F63C6]" : theme === "gold-velvet" || theme === "emerald-velvet" ? "text-[#c5a85c]" : isDark ? "text-emerald-400" : "text-emerald-600"} />
            <span className="truncate font-bold">الآية الكريمة</span>
          </div>

          {/* Ayah Actions Buttons */}
          <div className="flex items-center gap-1.5 shrink-0" dir="rtl" onClick={(e) => e.stopPropagation()}>
            {/* أيقونة زيادة حجم خط الآية (التحكم في جميع الآيات) */}
            <button
              type="button"
              id={`btn-increase-ayah-font-${ayah.numberInSurah}`}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateAyahFontSize?.(Math.min(50, currentAyahFontSize + 2));
              }}
              disabled={currentAyahFontSize >= 50}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shadow-2xs disabled:opacity-30 disabled:pointer-events-none ${
                theme === "navy-velvet" ? "bg-white text-[#3F63C6] border-[#3F63C6]/30 hover:bg-blue-50" :
                theme === "gold-velvet" ? "bg-[#FAF5E6] text-[#8c6b23] border-[#c5a85c]/40 hover:bg-[#f5eedc]" :
                theme === "emerald-velvet" ? "bg-[#011a12] text-[#c5a85c] border-[#c5a85c]/40 hover:bg-[#012519]" :
                isDark ? "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750" : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
              }`}
              title="زيادة حجم خط الآيات (لجميع الآيات)"
              aria-label="زيادة حجم خط الآيات"
            >
              <ZoomIn size={14} />
            </button>

            {/* أيقونة نقص حجم خط الآية (التحكم في جميع الآيات) */}
            <button
              type="button"
              id={`btn-decrease-ayah-font-${ayah.numberInSurah}`}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateAyahFontSize?.(Math.max(14, currentAyahFontSize - 2));
              }}
              disabled={currentAyahFontSize <= 14}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shadow-2xs disabled:opacity-30 disabled:pointer-events-none ${
                theme === "navy-velvet" ? "bg-white text-[#3F63C6] border-[#3F63C6]/30 hover:bg-blue-50" :
                theme === "gold-velvet" ? "bg-[#FAF5E6] text-[#8c6b23] border-[#c5a85c]/40 hover:bg-[#f5eedc]" :
                theme === "emerald-velvet" ? "bg-[#011a12] text-[#c5a85c] border-[#c5a85c]/40 hover:bg-[#012519]" :
                isDark ? "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750" : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
              }`}
              title="نقص حجم خط الآيات (لجميع الآيات)"
              aria-label="نقص حجم خط الآيات"
            >
              <ZoomOut size={14} />
            </button>

            {/* أيقونة مشاركة الآية بدون عبارات */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenShare?.(ayah);
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shadow-2xs ${
                theme === "navy-velvet" ? "bg-white text-[#3F63C6] border-[#3F63C6]/30 hover:bg-blue-50" :
                theme === "gold-velvet" ? "bg-[#FAF5E6] text-[#8c6b23] border-[#c5a85c]/40 hover:bg-[#f5eedc]" :
                theme === "emerald-velvet" ? "bg-[#011a12] text-[#c5a85c] border-[#c5a85c]/40 hover:bg-[#012519]" :
                isDark ? "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750" : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
              }`}
              title="مشاركة الآية"
            >
              <Share2 size={14} />
            </button>

            {/* أيقونة وضع علامة مع فتح قائمة العلامات بدون عبارات */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenBookmarkMenu?.(e, ayah);
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shadow-2xs relative ${
                isBookmarked
                  ? theme === "navy-velvet"
                    ? "bg-[#3F63C6]/15 text-[#3F63C6] border-[#3F63C6]/60 font-bold"
                    : theme === "gold-velvet" || theme === "emerald-velvet"
                      ? "bg-[#c5a85c]/15 text-[#c5a85c] border-[#c5a85c]/60 font-bold"
                      : isDark
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : theme === "navy-velvet" ? "bg-white text-[#3F63C6] border-[#3F63C6]/30 hover:bg-blue-50" :
                    theme === "gold-velvet" ? "bg-[#FAF5E6] text-[#8c6b23] border-[#c5a85c]/40 hover:bg-[#f5eedc]" :
                    theme === "emerald-velvet" ? "bg-[#011a12] text-[#c5a85c] border-[#c5a85c]/40 hover:bg-[#012519]" :
                    isDark ? "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750" : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
              }`}
              title={isBookmarked ? "تعديل أو إزالة العلامة" : "وضع علامة (فاصلة)"}
            >
              <BookmarkIcon size={14} className={isBookmarked ? "fill-current" : ""} />
              {isBookmarked && (
                <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
                  bookmarkCategory === "reading" ? "bg-red-500" :
                  bookmarkCategory === "memorization" ? "bg-sky-400" :
                  bookmarkCategory === "revision" ? "bg-emerald-400" :
                  bookmarkCategory === "contemplation" ? "bg-purple-500" :
                  "bg-amber-500"
                }`} />
              )}
            </button>

            {/* أيقونة إضافة ملاحظة بدون عبارات */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenNote?.(ayah);
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shadow-2xs relative ${
                internalHasNote
                  ? theme === "navy-velvet"
                    ? "bg-[#3F63C6]/15 text-[#3F63C6] border-[#3F63C6]/50"
                    : theme === "gold-velvet" || theme === "emerald-velvet"
                      ? "bg-[#c5a85c]/15 text-[#c5a85c] border-[#c5a85c]/50"
                      : isDark
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : theme === "navy-velvet" ? "bg-white text-[#3F63C6] border-[#3F63C6]/30 hover:bg-blue-50" :
                    theme === "gold-velvet" ? "bg-[#FAF5E6] text-[#8c6b23] border-[#c5a85c]/40 hover:bg-[#f5eedc]" :
                    theme === "emerald-velvet" ? "bg-[#011a12] text-[#c5a85c] border-[#c5a85c]/40 hover:bg-[#012519]" :
                    isDark ? "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750" : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
              }`}
              title={internalHasNote ? "عرض وتعديل الملاحظة" : "إضافة ملاحظة على الآية"}
            >
              <FileText size={14} />
              {internalHasNote && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 border border-white dark:border-slate-900" />
              )}
            </button>
          </div>
        </div>

        {/* Verse Display Box */}
        <div className="p-4 sm:p-5">
          <div 
            className={`p-4 sm:p-5 rounded-2xl border-2 text-center transition-all duration-300 ${
              theme === "gold-velvet" ? "bg-[#FAF5E6]/90 border-[#c5a85c]/35 text-[#011c14]" :
              theme === "emerald-velvet" ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]" :
              theme === "navy-velvet" ? "bg-[#F8FAFC] border-[#3F63C6]/20 text-slate-900" :
              isDark ? "bg-slate-950/80 border-slate-800/90 text-slate-100" : "bg-[#f7fff7] border-emerald-200/80 text-slate-900"
            }`}
            style={{
              backgroundColor: theme === "emerald-velvet" ? undefined : theme === "gold-velvet" ? undefined : theme === "navy-velvet" ? undefined : isDark ? undefined : "#f7fff7"
            }}
          >
            <p 
              className={`font-serif font-medium leading-loose text-center selection:bg-emerald-200 selection:text-slate-900 w-full ${fontColorClass} ${activeFontClass}`}
              style={{ fontFamily: "'UthmanicHafs', 'Amiri', serif", fontSize: `${currentAyahFontSize}px` }}
            >
              <Qcf4VerseText
                surah={surahNumber}
                ayah={ayah.numberInSurah}
                page={ayah.page || currentPage}
                fallbackText={displayedText}
                fontSize={`${currentAyahFontSize}px`}
                theme={theme}
                isDark={isDark}
              />
            </p>
          </div>
        </div>
      </div>

      {/* Tafsir / Content Window Card (Library Window Style - Matching Ayah Card Styling) */}
      <div 
        id={`tafsir-card-${ayah.numberInSurah}`}
        onClick={handleClick}
        className={`w-full rounded-2xl border-2 overflow-hidden shadow-xs transition-all duration-300 relative cursor-pointer ${
          theme === "emerald-velvet"
            ? "bg-[#012519] border-[#c5a85c]/35 text-[#FAF8F5]"
            : theme === "gold-velvet"
              ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14]"
              : theme === "navy-velvet"
                ? "bg-white border-[#3F63C6]/25 text-slate-900"
                : isDark
                  ? "bg-slate-900 border-slate-800 text-slate-100"
                  : "bg-white border-emerald-200/80 text-slate-900"
        }`}
        dir="rtl"
      >
        {/* Top Accent Color Line */}
        <div className={`absolute top-0 right-0 left-0 h-[4px] z-10 ${
          theme === "gold-velvet" ? "bg-[#c5a85c]" :
          theme === "emerald-velvet" ? "bg-[#c5a85c]" :
          theme === "navy-velvet" ? "bg-[#3F63C6]" :
          isDark ? "bg-emerald-500" :
          "bg-emerald-600"
        }`} />

        {/* Header Bar */}
        <div className={`px-4 py-2.5 flex items-center justify-between border-b text-xs sm:text-sm font-bold select-none gap-2 ${
          theme === "emerald-velvet"
            ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]"
            : theme === "gold-velvet"
              ? "bg-[#FAF5E6] border-[#c5a85c]/35 text-[#011c14]"
              : theme === "navy-velvet"
                ? "bg-[#EFF6FF] border-[#3F63C6]/25 text-slate-900"
                : isDark
                  ? "bg-slate-950/90 border-slate-800 text-slate-200"
                  : "bg-emerald-50/80 border-emerald-200/80 text-emerald-950"
        }`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <Sparkles size={16} className={theme === "navy-velvet" ? "text-[#3F63C6]" : theme === "gold-velvet" || theme === "emerald-velvet" ? "text-[#c5a85c]" : isDark ? "text-emerald-400" : "text-emerald-600"} />
            <span className="truncate font-bold">{serviceTitle}</span>
          </div>

          {/* Tafsir Actions Bar: Copy Button and Font Size Zoom */}
          <div className="flex items-center gap-1.5 shrink-0" dir="ltr" onClick={(e) => e.stopPropagation()}>
            {/* Copy Tafsir Button (Icon Only) */}
            <button
              id={`copy-tafsir-btn-${ayah.numberInSurah}`}
              type="button"
              onClick={handleCopyTafsir}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shadow-2xs ${
                copiedTafsir
                  ? "bg-emerald-500/25 border-emerald-400 text-emerald-300"
                  : theme === "navy-velvet"
                    ? "bg-white text-[#3F63C6] border-[#3F63C6]/30 hover:bg-blue-50"
                    : theme === "gold-velvet"
                      ? "bg-[#FAF5E6] text-[#8c6b23] border-[#c5a85c]/40 hover:bg-[#f5eedc]"
                      : theme === "emerald-velvet"
                        ? "bg-[#011a12] text-[#c5a85c] border-[#c5a85c]/40 hover:bg-[#012519]"
                        : isDark
                          ? "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750"
                          : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
              }`}
              title={copiedTafsir ? "تم النسخ" : "نسخ التفسير"}
              aria-label="نسخ التفسير"
            >
              {copiedTafsir ? (
                <Check size={14} className="text-emerald-400 stroke-[2.5px]" />
              ) : (
                <Copy size={14} />
              )}
            </button>

            {/* Tafsir Font Size Zoom Buttons */}
            {onUpdateTafsirFontSize && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTafsirFontSize(Math.max(10, currentTafsirFontSize - 1));
                  }}
                  disabled={currentTafsirFontSize <= 10}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shadow-2xs disabled:opacity-30 disabled:pointer-events-none ${
                    theme === "navy-velvet" ? "bg-white text-[#3F63C6] border-[#3F63C6]/30 hover:bg-blue-50" :
                    theme === "gold-velvet" ? "bg-[#FAF5E6] text-[#8c6b23] border-[#c5a85c]/40 hover:bg-[#f5eedc]" :
                    theme === "emerald-velvet" ? "bg-[#011a12] text-[#c5a85c] border-[#c5a85c]/40 hover:bg-[#012519]" :
                    isDark ? "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750" : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
                  }`}
                  title="تصغير خط التفسير"
                >
                  <ZoomOut size={14} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTafsirFontSize(Math.min(36, currentTafsirFontSize + 1));
                  }}
                  disabled={currentTafsirFontSize >= 36}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shadow-2xs disabled:opacity-30 disabled:pointer-events-none ${
                    theme === "navy-velvet" ? "bg-white text-[#3F63C6] border-[#3F63C6]/30 hover:bg-blue-50" :
                    theme === "gold-velvet" ? "bg-[#FAF5E6] text-[#8c6b23] border-[#c5a85c]/40 hover:bg-[#f5eedc]" :
                    theme === "emerald-velvet" ? "bg-[#011a12] text-[#c5a85c] border-[#c5a85c]/40 hover:bg-[#012519]" :
                    isDark ? "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750" : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
                  }`}
                  title="تكبير خط التفسير"
                >
                  <ZoomIn size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tafsir Content Display Box */}
        <div 
          className={`p-4 sm:p-5 ${isEnglish ? "" : "font-amiri font-amiri-naskh"}`}
          style={{ fontFamily: isEnglish ? 'system-ui, -apple-system, sans-serif' : "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}
        >
          <div 
            className={`p-1 sm:p-2 bg-transparent border-0 shadow-none transition-all duration-300 ${isEnglish ? "" : "font-amiri font-amiri-naskh"}`}
            style={{ fontFamily: isEnglish ? 'system-ui, -apple-system, sans-serif' : "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}
          >
            {loading && !dataCache[activeMode] ? (
              <div className="flex flex-col gap-2 animate-pulse py-2" dir="rtl">
                <div className="h-4 bg-current opacity-20 rounded-full w-3/4 mr-auto"></div>
                <div className="h-4 bg-current opacity-20 rounded-full w-5/6 mr-auto"></div>
              </div>
            ) : isLinguisticsOrIrabMode(activeMode) ? (
              <div className="flex flex-col gap-3 py-1 font-amiri font-amiri-naskh" dir="rtl" style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>
                {parseLinguisticItems(rawText).map((item, idx) => {
                  const isBalaghaCard = 
                    (activeMode as string) === "balagha" || 
                    (activeMode as string) === "book_balagha" ||
                    (activeMode as string) === "book_lubab" ||
                    DEFAULT_BOOKS.find(b => b.id === activeMode)?.subCategory === "balagha";
                  if (item.isHeader) {
                    return (
                      <div 
                        key={idx}
                        className={`pt-3 pb-1 text-sm font-bold flex items-center gap-2 select-text font-amiri font-amiri-naskh ${
                          theme === "emerald-velvet"
                            ? "text-[#FAF8F5]/85"
                            : theme === "gold-velvet"
                              ? "text-[#011c14]/85"
                              : isDark
                                ? "text-slate-200"
                                : "text-slate-700"
                        }`}
                        style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}
                      >
                        <span className={`w-2 h-2 rounded-full ${isBalaghaCard ? getBalaghaTitleColorClass(theme, isDark) : getLinguisticWordColorClass(theme, isDark)} bg-current`}></span>
                        <span style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>{item.meaning}</span>
                        <div className="h-px bg-current opacity-15 flex-1 mr-2"></div>
                      </div>
                    );
                  }

                  const isBalaghaItem = isBalaghaCard || item.isBalaghaTitle || checkIsBalaghaTitle(item.word);
                  const itemColorClass = isBalaghaItem 
                    ? getBalaghaTitleColorClass(theme, isDark) 
                    : getLinguisticWordColorClass(theme, isDark);

                  return (
                    <div 
                      key={idx}
                      className={`leading-[2.2] ${contentFont} font-amiri font-amiri-naskh pb-3 border-b border-current/10 last:border-b-0 last:pb-0 ${
                        theme === "emerald-velvet"
                          ? "text-[#FAF8F5]"
                          : theme === "gold-velvet"
                            ? "text-[#011c14]"
                            : isDark
                              ? "text-slate-100"
                              : "text-slate-800"
                      }`}
                      style={{ 
                        textAlign: contentTextAlign,
                        fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif",
                        fontSize: `${currentTafsirFontSize}px`
                      }}
                    >
                      {item.isAyahQuote && item.ayahText ? (
                        <div className="flex flex-wrap items-baseline gap-2 font-amiri font-amiri-naskh" style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>
                          {/* عبارة: قال الله تعالى باللون الأسود وبدون أقواس */}
                          <span 
                            className="font-bold select-text font-amiri font-amiri-naskh"
                            style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}
                          >
                            قال الله تعالى:
                          </span>
                          {/* والآية الكريمة باللون الأحمر بين أقواس */}
                          <span 
                            className={`font-bold inline-flex items-center gap-0.5 shrink-0 select-text font-amiri font-amiri-naskh ${getLinguisticWordColorClass(theme, isDark)}`}
                            style={{ 
                              fontSize: `${Math.max(10, currentTafsirFontSize)}px`,
                              fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif"
                            }}
                          >
                            <span className="font-bold select-none">(</span>
                            <span style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>
                              {item.ayahText.replace(/\*/g, "").replace(/^[\s\(\[\{«"'\u0660-\u0669\d\.\-]+|[\s\)\]\}»"'\-]+$/g, "").trim()}
                            </span>
                            <span className="font-bold select-none">)</span>
                          </span>
                        </div>
                      ) : item.isNote ? (
                        <div 
                          className={`opacity-85 leading-relaxed font-amiri font-amiri-naskh ${
                            item.meaning.includes("لا يوجد متشابه لفظي") ||
                            item.meaning.includes("لم يُدوّن غريب") ||
                            item.meaning.includes("لم يدون غريب")
                              ? "text-center py-2.5 text-base sm:text-lg font-medium opacity-90" 
                              : ""
                          }`} 
                          style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}
                        >
                          {renderFormattedMeaningText(item.meaning, theme, isDark)}
                        </div>
                      ) : item.isReference && item.refLabel ? (
                        <div className="flex flex-wrap items-baseline gap-2 font-amiri font-amiri-naskh" style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>
                          <span className="font-bold opacity-80 select-text font-amiri font-amiri-naskh">
                            {item.refLabel.replace(/\*/g, "")}:
                          </span>
                          {item.ayahText && (
                            <span 
                              className={`font-bold inline-flex items-center gap-0.5 shrink-0 select-text font-amiri font-amiri-naskh ${getLinguisticWordColorClass(theme, isDark)}`}
                              style={{ 
                                fontSize: `${Math.max(10, currentTafsirFontSize)}px`,
                                fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif"
                              }}
                            >
                              <span className="font-bold select-none">(</span>
                              <span style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>
                                {item.ayahText.replace(/\*/g, "").replace(/^[\s\(\[\{«"'\u0660-\u0669\d\.\-]+|[\s\)\]\}»"'\-]+$/g, "").trim()}
                              </span>
                              <span className="font-bold select-none">)</span>
                            </span>
                          )}
                          {item.meaning && (
                            <span className="opacity-95 flex-1 min-w-[200px] font-amiri font-amiri-naskh" style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>
                              {renderFormattedMeaningText(item.meaning, theme, isDark)}
                            </span>
                          )}
                        </div>
                      ) : isBalaghaItem ? (
                        <div className="flex flex-col gap-1.5 w-full font-amiri font-amiri-naskh" style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>
                          {/* العنوان باللون الأخضر في سطر مستقل */}
                          <div 
                            className={`font-bold select-text font-amiri font-amiri-naskh leading-relaxed ${itemColorClass}`}
                            style={{ 
                              fontSize: `${Math.max(10, currentTafsirFontSize)}px`,
                              fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif"
                            }}
                          >
                            <span style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>
                              {item.word.replace(/\*/g, "").replace(/^[\s\(\[\{«"'\u0660-\u0669\d\.\-]+|[\s\)\]\}»"'\-]+$/g, "").trim()}
                            </span>
                          </div>
                          {/* المعنى أو الشرح في سطر مستقل تحته */}
                          <div 
                            className="opacity-95 leading-[2.2] w-full font-amiri font-amiri-naskh" 
                            style={{ 
                              fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif",
                              fontSize: `${currentTafsirFontSize}px`
                            }}
                          >
                            {renderFormattedMeaningText(item.meaning, theme, isDark)}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-baseline gap-2 font-amiri font-amiri-naskh" style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>
                          <span 
                            className={`font-bold inline-flex items-center gap-0.5 shrink-0 select-text font-amiri font-amiri-naskh ${itemColorClass}`}
                            style={{ 
                              fontSize: `${Math.max(10, currentTafsirFontSize)}px`,
                              fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif"
                            }}
                          >
                            <span className="font-bold select-none">(</span>
                            <span style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>
                              {item.word.replace(/\*/g, "").replace(/^[\s\(\[\{«"'\u0660-\u0669\d\.\-]+|[\s\)\]\}»"'\-]+$/g, "").trim()}
                            </span>
                            <span className="font-bold select-none">)</span>
                          </span>
                          <span className="font-bold opacity-40 select-none mx-0.5">:</span>
                          <span className="opacity-95 flex-1 min-w-[200px] font-amiri font-amiri-naskh" style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>
                            {renderFormattedMeaningText(item.meaning, theme, isDark)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : isTadabburMode(activeMode) ? (
              (() => {
                const sections = parseTadabburSections(cleanTafsirCardText(rawText, activeMode));

                return (
                  <div className="flex flex-col gap-4 py-1 font-amiri font-amiri-naskh" dir="rtl" style={{ fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif" }}>
                    {sections.map((sec, sIdx) => {
                      return (
                        <div 
                          key={sIdx}
                          id={`tadabbur-card-${sIdx + 1}`}
                          className={`p-3.5 sm:p-4 rounded-xl border shadow-xs transition-all ${
                            theme === "emerald-velvet"
                              ? "bg-[#012519]/80 border-[#c5a85c]/25 text-[#FAF8F5]"
                              : theme === "gold-velvet"
                                ? "bg-[#FAF8F5] border-[#c5a85c]/30 text-[#011c14]"
                                : isDark
                                  ? "bg-slate-900/60 border-slate-800 text-slate-100"
                                  : "bg-slate-50/90 border-slate-200 text-slate-800"
                          }`}
                        >
                          {/* Card Number if multiple reflections */}
                          {sections.length > 1 && (
                            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-current/10 text-xs font-bold opacity-75">
                              <BookOpen size={12} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>وقفة تدبرية #{sIdx + 1}</span>
                            </div>
                          )}

                      {/* Formatted Table: العنوان -> التدبر -> القائل -> المصدر */}
                      <div className="overflow-hidden rounded-lg border border-current/15 bg-transparent">
                        <table className="w-full text-right border-collapse table-fixed bg-transparent">
                          <tbody className="bg-transparent">
                            {/* Row 1: العنوان */}
                            <tr className="border-b border-current/10 bg-transparent">
                              <th className="w-20 sm:w-24 p-2.5 sm:p-3 font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 bg-transparent border-l border-current/10 align-middle shrink-0">
                                العنوان
                              </th>
                              <td 
                                className="p-2.5 sm:p-3 font-bold text-emerald-800 dark:text-emerald-300 bg-transparent"
                                style={{
                                  fontSize: `${Math.max(11, currentTafsirFontSize + 1)}px`,
                                  fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif"
                                }}
                              >
                                {sec.title}
                              </td>
                            </tr>

                            {/* Row 2: التدبر */}
                            <tr className="border-b border-current/10 bg-transparent">
                              <th className="w-20 sm:w-24 p-2.5 sm:p-3 font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 bg-transparent border-l border-current/10 align-top shrink-0">
                                التدبر
                              </th>
                              <td 
                                className={`p-2.5 sm:p-3 leading-[2.2] whitespace-pre-line bg-transparent selection:bg-emerald-200 selection:text-slate-900 ${
                                  theme === "emerald-velvet"
                                    ? "text-[#FAF8F5]/95"
                                    : theme === "gold-velvet"
                                      ? "text-[#011c14]/95"
                                      : isDark
                                        ? "text-slate-100"
                                        : "text-slate-800"
                                }`}
                                style={{ 
                                  fontSize: `${currentTafsirFontSize}px`,
                                  fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif"
                                }}
                              >
                                {renderFormattedMeaningText(sec.content, theme, isDark)}
                              </td>
                            </tr>

                            {/* Row 3: القائل */}
                            <tr className="border-b border-current/10 bg-transparent">
                              <th className="w-20 sm:w-24 p-2.5 sm:p-3 font-bold text-xs sm:text-sm text-indigo-700 dark:text-indigo-400 bg-transparent border-l border-current/10 align-middle shrink-0">
                                القائل
                              </th>
                              <td 
                                className="p-2.5 sm:p-3 font-semibold text-indigo-900 dark:text-indigo-200 bg-transparent"
                                style={{
                                  fontSize: `${currentTafsirFontSize}px`,
                                  fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif"
                                }}
                              >
                                {sec.author}
                              </td>
                            </tr>

                            {/* Row 4: المصدر */}
                            <tr className="bg-transparent">
                              <th className="w-20 sm:w-24 p-2.5 sm:p-3 font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-transparent border-l border-current/10 align-middle shrink-0">
                                المصدر
                              </th>
                              <td 
                                className="p-2.5 sm:p-3 opacity-90 text-slate-700 dark:text-slate-300 bg-transparent"
                                style={{
                                  fontSize: `${currentTafsirFontSize}px`,
                                  fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif"
                                }}
                              >
                                {sec.bookName}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        ) : (
              <div 
                className={`leading-[2.2] ${contentFont} ${isEnglish ? "" : "font-amiri font-amiri-naskh"} whitespace-pre-line selection:bg-emerald-200 selection:text-slate-900 ${
                  theme === "emerald-velvet"
                    ? "text-[#FAF8F5]"
                    : theme === "gold-velvet"
                      ? "text-[#011c14]"
                      : isDark
                        ? "text-slate-100"
                        : "text-slate-800"
                }`} 
                dir={contentDir}
                style={{ 
                  textAlign: contentTextAlign,
                  fontFamily: isEnglish ? 'system-ui, -apple-system, sans-serif' : "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif",
                  fontSize: `${currentTafsirFontSize}px`
                }}
              >
                {renderFormattedMeaningText(cleanTafsirCardText(rawText, activeMode), theme, isDark)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

type TafsirMode = "tafsir_muyassar" | "tafsir_mukhtasar" | "tafsir_aysar" | "tafsir_tabari" | "tafsir_kathir" | "tafsir_qurtubi" | "tafsir_sadi" | "tafsir_baghawi" | "tafsir_suyuti" | "tafsir_ibn_atiyyah" | "tafsir_waseet" | "tafsir_waseet_tantawi" | "english" | "eerab" | "suraj_garib_quran" | "tafsir_ibnkathir" | "asbab_nuzool" | "balagha" | "sarf" | "hidaya" | "mutashabihat";

export interface ContinuousIconServiceItem {
  id: string;
  mainCategory: MainCategory;
  label: string;
  icon: any;
  desc: string;
}

const CONTINUOUS_SERVICES_LIST: ContinuousIconServiceItem[] = [
  { id: "tafsir_mukhtasar", mainCategory: "tafsir", label: "المختصر", icon: BookOpen, desc: "المختصر في التفسير - مركز تفسير للدراسات القرآنية" },
  { id: "tafsir_sadi", mainCategory: "tafsir", label: "السعدي", icon: BookOpenCheck, desc: "تيسير الكريم الرحمن في تفسير كلام المنان للشيخ السعدي" },
  { id: "translation_hilali_khan", mainCategory: "translations", label: "ترجمة", icon: Languages, desc: "ترجمة معاني القرآن الكريم لد. تقي الدين الهلالي ود. محسن خان" },
  { id: "suraj_garib_quran", mainCategory: "linguistics", label: "غريب الآية", icon: FileText, desc: "بيان وتوضيح غريب مفردات الآية الكريمة" },
  { id: "book_irab", mainCategory: "linguistics", label: "إعراب", icon: Type, desc: "إعراب الآية الكريمة وبيان وجه الإعراب" },
  { id: "book_sarf", mainCategory: "linguistics", label: "صرف", icon: Layers, desc: "التحليل الصرفي لمفردات الآية الكريمة" },
  { id: "book_balagha", mainCategory: "linguistics", label: "بلاغة", icon: Sparkles, desc: "البلاغة واللمسات البيانية في الآية" },
  { id: "muharrar_asbab", mainCategory: "sciences", label: "أسباب النزول", icon: History, desc: "أسباب النزول المعتمدة للآيات" },
  { id: "book_tadabbur", mainCategory: "tadabbur", label: "تدبر", icon: Heart, desc: "الوقفات واللطائف والفوائد التدبرية" },
  { id: "notes", mainCategory: "notes", label: "التقييدات", icon: Feather, desc: "التقييدات والخواطر والملاحظات الشخصية" },
];

export default function ReadingScreen({
  surahNumber,
  initialAyahNumber,
  initialPageNumber,
  onBack,
  bookmarks,
  onToggleBookmark,
  settings,
  onChangeSettings,
  isDark,
  theme = "light",
  onChangeTheme,
  onToggleDarkMode,
  showBars = true,
  onToggleBars,
  scrollCapsuleToggleTrigger,
  mushafClickTrigger,
  activeTab = "home",
  isIndexOpen = false,
  onCloseIndex,
  onOpenIndex,
  onChangeSurah,
  onPageChange,
  onRecitationStateChange,
  onShowBarsChange,
  onActiveTabChange,
  onSyncPlaybackStates,
  onOpenShareAyah,
}: ReadingScreenProps) {
  const effectivePageMode = settings.pageMode || "continuous";
  const currentSurahMeta = surahsList.find((s) => s.number === surahNumber);
  const tafsirDragControls = useDragControls();
  const reciterDragControls = useDragControls();
  const tafsirMoyassarDragControls = useDragControls();
  const shareDragControls = useDragControls();
  const ayahNoteDragControls = useDragControls();
  const [isAyahNoteFullScreen, setIsAyahNoteFullScreen] = useState(false);
  
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [continuousActiveService, setContinuousActiveService] = useState<MainCategory>("tafsir");
  const [continuousActiveMode, setContinuousActiveMode] = useState<string>("tafsir_mukhtasar");
  const [userCustomTranslationBooks, setUserCustomTranslationBooks] = useState<LibraryBookItem[]>([]);
  const [isTranslationsCatalogOpen, setIsTranslationsCatalogOpen] = useState(false);

  // Audio state
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingPageAyahNumber, setPlayingPageAyahNumber] = useState<number | null>(null);
  const [isPageAyahPlaying, setIsPageAyahPlaying] = useState<boolean>(false);
  const [recitationError, setRecitationError] = useState<string | null>(null);
  const [showReciterPanel, setShowReciterPanel] = useState(false);
  const isRecitationActive = isPlaying || playingIndex !== null || isPageAyahPlaying || playingPageAyahNumber !== null;

  // Recitation custom range & repeat options
  const [recitationMode, setRecitationMode] = useState<"continuous" | "range">("continuous");
  const [startAyahNum, setStartAyahNum] = useState<number>(1);
  const [endAyahNum, setEndAyahNum] = useState<number>(7);
  const [ayahRepeatMax, setAyahRepeatMax] = useState<number>(1); // 1 = play once
  const [rangeRepeatMax, setRangeRepeatMax] = useState<number>(1); // 1 = play once

  // Internal counters to track current repeat iterations
  const [currentAyahPlayCount, setCurrentAyahPlayCount] = useState<number>(1);
  const [currentRangePlayCount, setCurrentRangePlayCount] = useState<number>(1);

  // Share Ayah as image or text state
  const [shareAyahData, setShareAyahData] = useState<ShareAyahData | null>(null);

  // Unified Services Drawer state ("index" | "files" | "search" | "settings" | null)
  const [serviceDrawerTab, setServiceDrawerTab] = useState<"index" | "files" | "search" | "settings" | null>(null);
  const [indexSubTab, setIndexSubTab] = useState<"surahs" | "quarters" | "go">("surahs");

  const handleOpenIndexDrawer = (tab: "surahs" | "quarters" | "go" = "surahs") => {
    setIndexSubTab(tab);
    setServiceDrawerTab("index");
  };

  const showMyFilesDrawer = serviceDrawerTab === "files";
  const setShowMyFilesDrawer = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === "function" ? val(serviceDrawerTab === "files") : val;
    setServiceDrawerTab(next ? "files" : null);
  };

  const [showSettingsDrawerState, setShowSettingsDrawerState] = useState<boolean>(false);
  const showSettingsDrawer = serviceDrawerTab === "settings" || showSettingsDrawerState;
  const setShowSettingsDrawer = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === "function" ? val(serviceDrawerTab === "settings") : val;
    setShowSettingsDrawerState(next);
    setServiceDrawerTab(next ? "settings" : null);
  };

  const [showWordSearchModalState, setShowWordSearchModalState] = useState<boolean>(false);
  const showWordSearchModal = serviceDrawerTab === "search" || showWordSearchModalState;
  const setShowWordSearchModal = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === "function" ? val(serviceDrawerTab === "search") : val;
    setShowWordSearchModalState(next);
    setServiceDrawerTab(next ? "search" : null);
  };
  const [myFilesActiveTab, setMyFilesActiveTab] = useState<"bookmarks" | "notes" | "reports">("bookmarks");
  const [bookmarkCategory, setBookmarkCategory] = useState<"reading" | "revision" | "memorization" | "contemplation" | "all">("reading");
  const [showAddBookmarkForm, setShowAddBookmarkForm] = useState<boolean>(false);
  const [bookmarkFormSurah, setBookmarkFormSurah] = useState<number>(surahNumber);
  const [bookmarkFormAyah, setBookmarkFormAyah] = useState<number>(1);
  const [bookmarkFormCategory, setBookmarkFormCategory] = useState<"reading" | "revision" | "memorization" | "contemplation">("reading");
  const [surahSelectDropdownOpen, setSurahSelectDropdownOpen] = useState<boolean>(false);
  const [surahSelectSearchQuery, setSurahSelectSearchQuery] = useState<string>("");
  const [isContinuousSurahModalOpen, setIsContinuousSurahModalOpen] = useState<boolean>(false);
  const [showLibraryScrollTop, setShowLibraryScrollTop] = useState<boolean>(false);

  // Highlights / التظليل state (persistent)
  const [highlights, setHighlights] = useState<{ id: string; surahNumber: number; surahName: string; ayahNumber: number; color: "yellow" | "green" | "pink" | "blue"; text?: string; timestamp: string }[]>(() => {
    try {
      const saved = localStorage.getItem("quran_highlights_tebyan");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [highlightCategoryFilter, setHighlightCategoryFilter] = useState<"all" | "yellow" | "green" | "pink" | "blue">("all");

  const [bookmarkMenu, setBookmarkMenu] = useState<{
    surahNumber: number;
    surahName: string;
    ayahNumber?: number;
    top: number;
    left: number;
    align: "left" | "right" | "center";
  } | null>(null);

  // Floating Ayah Context Menu state (on long-press without text phrases)
  const [floatingAyahMenu, setFloatingAyahMenu] = useState<{
    ayah: Ayah;
    surahNumber: number;
    surahName: string;
    x: number;
    y: number;
    showBookmarksList?: boolean;
  } | null>(null);
  const [floatingCopied, setFloatingCopied] = useState<boolean>(false);
  
  // Notes / كناشات state (persistent)
  const [notes, setNotes] = useState<{ id: string; surahNumber: number; surahName: string; ayahNumber?: number; content: string; timestamp: string }[]>(() => {
    try {
      const saved = localStorage.getItem("quran_annotations_tebyan");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Note form state inside drawer
  const [noteFormSurah, setNoteFormSurah] = useState<number>(surahNumber);
  const [noteFormAyah, setNoteFormAyah] = useState<number>(1);
  const [noteFormContent, setNoteFormContent] = useState<string>("");
  const [showAddNoteForm, setShowAddNoteForm] = useState<boolean>(false);

  // Ayah Note Modal state (for clicking the note icon on an individual ayah card)
  const [ayahNoteModal, setAyahNoteModal] = useState<{
    ayah: Ayah;
    surahNumber: number;
    surahName: string;
  } | null>(null);
  const [ayahNoteText, setAyahNoteText] = useState<string>("");

  // Statistics state (persistent)
  const [statsTimeSpent, setStatsTimeSpent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("quran_stats_time_spent");
      return saved ? parseInt(saved, 10) : 3873; // start with a nice realistic base: 1 hour 4 minutes 33 seconds
    } catch {
      return 3873;
    }
  });

  const [statsSearchedCount, setStatsSearchedCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("quran_stats_searched_count");
      return saved ? parseInt(saved, 10) : 65; // base from video
    } catch {
      return 65;
    }
  });

  const [statsPagesRead, setStatsPagesRead] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("quran_stats_pages_read");
      return saved ? parseInt(saved, 10) : 91773; // base from video
    } catch {
      return 91773;
    }
  });

  const [statsSharesCount, setStatsSharesCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("quran_stats_shares_count");
      return saved ? parseInt(saved, 10) : 12;
    } catch {
      return 12;
    }
  });

  const [statsStreak, setStatsStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("quran_stats_streak");
      return saved ? parseInt(saved, 10) : 2;
    } catch {
      return 2;
    }
  });

  // Reports reset counters control states
  const [resetConfirmType, setResetConfirmType] = useState<"all" | "time" | "pages" | "streak" | "shares" | null>(null);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const handleResetCounter = (type: "all" | "time" | "pages" | "streak" | "shares") => {
    if (type === "all" || type === "time") {
      setStatsTimeSpent(0);
      localStorage.setItem("quran_stats_time_spent", "0");
    }
    if (type === "all" || type === "pages") {
      setStatsPagesRead(0);
      localStorage.setItem("quran_stats_pages_read", "0");
    }
    if (type === "all" || type === "streak") {
      setStatsStreak(0);
      localStorage.setItem("quran_stats_streak", "0");
    }
    if (type === "all" || type === "shares") {
      setStatsSharesCount(0);
      localStorage.setItem("quran_stats_shares_count", "0");
    }
    if (type === "all") {
      setStatsSearchedCount(0);
      localStorage.setItem("quran_stats_searched_count", "0");
    }
    setResetConfirmType(null);
    setResetFeedback(
      type === "all" ? "تم تصفير كافة العدادات بنجاح" :
      type === "time" ? "تم تصفير عداد وقت المطالعة" :
      type === "pages" ? "تم تصفير عداد الصفحات المقروءة" :
      type === "streak" ? "تم تصفير عداد المداومة" :
      "تم تصفير عداد الآيات المشاركة"
    );
    setTimeout(() => setResetFeedback(null), 3000);
  };

  // Increment time spent every second when active
  useEffect(() => {
    const timer = setInterval(() => {
      setStatsTimeSpent((prev) => {
        const next = prev + 1;
        localStorage.setItem("quran_stats_time_spent", String(next));
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Track streak
  useEffect(() => {
    try {
      const today = new Date().toDateString();
      const lastActiveDate = localStorage.getItem("quran_last_active_date");
      if (lastActiveDate !== today) {
        localStorage.setItem("quran_last_active_date", today);
        if (lastActiveDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastActiveDate === yesterday.toDateString()) {
            // Consecutive day! Increment streak!
            setStatsStreak((prev) => {
              const next = prev + 1;
              localStorage.setItem("quran_stats_streak", String(next));
              return next;
            });
          } else {
            // Streak broken, set to 1
            setStatsStreak(1);
            localStorage.setItem("quran_stats_streak", "1");
          }
        } else {
          localStorage.setItem("quran_stats_streak", "2");
        }
      }
    } catch {}
  }, []);

  // Sync current surah for Note selection form
  useEffect(() => {
    setNoteFormSurah(surahNumber);
  }, [surahNumber]);

  // Sync range bounds when ayahs list loads
  useEffect(() => {
    if (ayahs.length > 0) {
      setEndAyahNum(ayahs.length);
      setStartAyahNum(1);
    }
  }, [ayahs]);

  useEffect(() => {
    onRecitationStateChange?.(isRecitationActive);
  }, [isRecitationActive, onRecitationStateChange]);

  useEffect(() => {
    if (activeTab === "recitation") {
      setShowReciterPanel(true);
    } else {
      setShowReciterPanel(false);
    }
  }, [activeTab]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingPlayAyahNumberRef = useRef<number | null>(null);
  const isContinuousTransitioningRef = useRef<boolean>(false);

  // Active highlighted Ayah for option tray and Tafsir
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);

  // Global Ayah font size (persisted for continuous reading mode and ayah cards) - defaults to minimum pixel (14px)
  const [globalCardAyahFontSize, setGlobalCardAyahFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("quran_ayah_font_size");
      if (!saved || saved === "26") return 14;
      const parsed = Number(saved);
      return parsed >= 14 ? parsed : 14;
    } catch {
      return 14;
    }
  });

  // Global Tafsir font size (persisted for continuous cards and tafsir modals) - defaults to minimum pixel (10px)
  const [globalCardTafsirFontSize, setGlobalCardTafsirFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("quran_tafsir_font_size");
      if (!saved || saved === "13") return 10;
      const parsed = Number(saved);
      return parsed >= 10 ? parsed : 10;
    } catch {
      return 10;
    }
  });

  const [selectedAyahFontSize, setSelectedAyahFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("quran_ayah_font_size");
      if (!saved || saved === "26") return 14;
      const parsed = Number(saved);
      return parsed >= 14 ? parsed : 14;
    } catch {
      return 14;
    }
  });

  const handleUpdateGlobalAyahFontSize = (newSize: number) => {
    setGlobalCardAyahFontSize(newSize);
    setSelectedAyahFontSize(newSize);
    try {
      localStorage.setItem("quran_ayah_font_size", String(newSize));
    } catch {}
  };

  const handleUpdateGlobalTafsirFontSize = (newSize: number) => {
    setGlobalCardTafsirFontSize(newSize);
    setTafsirFontSize(newSize);
    try {
      localStorage.setItem("quran_tafsir_font_size", String(newSize));
    } catch {}
  };

  const handleIncreaseSelectedAyahFontSize = () => {
    setSelectedAyahFontSize(prev => {
      const next = Math.min(44, prev + 2);
      setGlobalCardAyahFontSize(next);
      try {
        localStorage.setItem("quran_ayah_font_size", String(next));
      } catch {}
      return next;
    });
  };

  const handleDecreaseSelectedAyahFontSize = () => {
    setSelectedAyahFontSize(prev => {
      const next = Math.max(8, prev - 2);
      setGlobalCardAyahFontSize(next);
      try {
        localStorage.setItem("quran_ayah_font_size", String(next));
      } catch {}
      return next;
    });
  };

  const handleToggleSelectedAyahFontSize = () => {
    setSelectedAyahFontSize(prev => {
      const next = prev >= 38 ? 20 : prev + 4;
      setGlobalCardAyahFontSize(next);
      try {
        localStorage.setItem("quran_ayah_font_size", String(next));
      } catch {}
      return next;
    });
  };

  const [tafsirFontSize, setTafsirFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("quran_tafsir_font_size");
      if (!saved || saved === "13") return 10;
      const parsed = Number(saved);
      return parsed >= 10 ? parsed : 10;
    } catch {
      return 10;
    }
  });

  const [tafsirLineHeight, setTafsirLineHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("quran_tafsir_line_height");
      return saved ? Number(saved) : 1.85;
    } catch {
      return 1.85;
    }
  });

  const handleIncreaseTafsirFontSize = () => {
    setTafsirFontSize(prev => {
      const next = Math.min(36, prev + 2);
      setGlobalCardTafsirFontSize(next);
      try {
        localStorage.setItem("quran_tafsir_font_size", String(next));
      } catch {}
      return next;
    });
    setTafsirLineHeight(prev => {
      const next = Math.min(2.8, Number((prev + 0.08).toFixed(2)));
      try {
        localStorage.setItem("quran_tafsir_line_height", String(next));
      } catch {}
      return next;
    });
  };

  const handleDecreaseTafsirFontSize = () => {
    setTafsirFontSize(prev => {
      const next = Math.max(10, prev - 2);
      setGlobalCardTafsirFontSize(next);
      try {
        localStorage.setItem("quran_tafsir_font_size", String(next));
      } catch {}
      return next;
    });
    setTafsirLineHeight(prev => {
      const next = Math.max(1.5, Number((prev - 0.08).toFixed(2)));
      try {
        localStorage.setItem("quran_tafsir_line_height", String(next));
      } catch {}
      return next;
    });
  };
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<{ time: number; ayahNumber: number | null }>({ time: 0, ayahNumber: null });
  const hasAppliedInitialPageRef = useRef<boolean>(false);

  // Swipe and Drag gesture state for page navigation
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const lastTouchPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const hasSwipedRef = useRef<boolean>(false);
  const swipeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragDistanceRef = useRef<number>(0);

  // Swipe gesture refs for verse card navigation (Swipe right -> Next, Swipe left -> Prev)
  const ayahSwipeStartXRef = useRef<number | null>(null);
  const ayahSwipeStartYRef = useRef<number | null>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    swipeStartXRef.current = clientX;
    swipeStartYRef.current = clientY;
    lastTouchPosRef.current = { x: clientX, y: clientY };
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    lastTouchPosRef.current = { x: clientX, y: clientY };
    if (swipeStartXRef.current !== null && swipeStartYRef.current !== null) {
      const dx = clientX - swipeStartXRef.current;
      const dy = clientY - swipeStartYRef.current;
      const dist = Math.sqrt(dx * dx + dy * dy);
      dragDistanceRef.current = Math.max(dragDistanceRef.current, dist);
      if (dist > 8) {
        hasSwipedRef.current = true;
      }
    }
  };

  const handleDragEnd = (clientX?: number, clientY?: number) => {
    if (!isDraggingRef.current || swipeStartXRef.current === null || swipeStartYRef.current === null) return;
    
    const endX = clientX !== undefined ? clientX : (lastTouchPosRef.current ? lastTouchPosRef.current.x : swipeStartXRef.current);
    const endY = clientY !== undefined ? clientY : (lastTouchPosRef.current ? lastTouchPosRef.current.y : swipeStartYRef.current);

    const diffX = endX - swipeStartXRef.current;
    const diffY = endY - swipeStartYRef.current;
    const totalDist = Math.sqrt(diffX * diffX + diffY * diffY);
    dragDistanceRef.current = Math.max(dragDistanceRef.current, totalDist);
    
    isDraggingRef.current = false;
    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
    lastTouchPosRef.current = null;

    if (totalDist > 8 || hasSwipedRef.current) {
      hasSwipedRef.current = true;
      if (swipeTimeoutRef.current) clearTimeout(swipeTimeoutRef.current);
      swipeTimeoutRef.current = setTimeout(() => {
        hasSwipedRef.current = false;
        dragDistanceRef.current = 0;
      }, 700);
    }
    
    const isAutoScroll = settings.autoScrollActive || false;

    // When Auto-Scroll is active:
    // Continuous scrolling is active - allow smooth upward/downward swiping without discrete page barriers
    if (isAutoScroll) {
      return;
    }

    // Page navigation gesture follows settings.scrollDirection (horizontal vs vertical)
    const isVertical = settings.scrollDirection === "vertical";

    if (isVertical) {
      // Vertical swipe navigation
      if (Math.abs(diffY) >= 20 && Math.abs(diffY) > Math.abs(diffX)) {
        if (diffY < 0) {
          // Swipe UP (finger moves up) -> NEXT page
          const nextPage = Math.min(604, currentPage + 1);
          setCurrentPage(nextPage);
        } else {
          // Swipe DOWN (finger moves down) -> PREVIOUS page
          const prevPage = Math.max(1, currentPage - 1);
          setCurrentPage(prevPage);
        }
      }
    } else {
      // Instant, clean horizontal swipe navigation
      if (Math.abs(diffX) >= 20 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          // Swiping right (finger moves right: diffX > 0) -> NEXT page (التالي)
          const nextPage = Math.min(604, currentPage + 1);
          setCurrentPage(nextPage);
        } else {
          // Swiping left (finger moves left: diffX < 0) -> PREVIOUS page (السابق)
          const prevPage = Math.max(1, currentPage - 1);
          setCurrentPage(prevPage);
        }
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      handleDragEnd(touch.clientX, touch.clientY);
    } else {
      handleDragEnd();
    }
  };

  const handleTouchCancel = () => {
    handleDragEnd();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    handleDragEnd(e.clientX, e.clientY);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    handleDragEnd(e.clientX, e.clientY);
  };

  const handleAyahSelect = (ayah: Ayah) => {
    const targetSurahNum = (ayah as any).surah?.number || surahNumber;
    setSelectedAyah(ayah);
    if (targetSurahNum !== surahNumber && onChangeSurah) {
      onChangeSurah(targetSurahNum);
    }
  };

  const handleAyahPlayToggle = (ayah: Ayah) => {
    const targetSurahNum = (ayah as any).surah?.number || surahNumber;
    
    // Ensure services sheet is closed when starting/toggling recitation
    setSelectedAyah(null);
    
    // Keep focus on the page and only show the compact bottom player bar
    setShowReciterPanel(false);

    if (targetSurahNum === surahNumber) {
      const idx = ayahs.findIndex(a => a.numberInSurah === ayah.numberInSurah);
      if (idx !== -1) {
        if (playingIndex === idx && isPlaying) {
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
        } else {
          playAyah(idx);
        }
      }
    } else {
      pendingPlayAyahNumberRef.current = ayah.numberInSurah;
      if (onChangeSurah) {
        onChangeSurah(targetSurahNum);
      }
    }
  };

  const [tafsirMode, setTafsirMode] = useState<TafsirMode>("tafsir_mukhtasar");
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirResponse, setTafsirResponse] = useState<string>("");
  const [tafsirError, setTafsirError] = useState<string | null>(null);

  // States & Positioning logic for the native video-like toolbar and bottom sheet
  const [toolbarCoords, setToolbarCoords] = useState<{ top: number; left: number; isFixed: boolean } | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState<boolean>(false);
  const [isDrawerFullScreen, setIsDrawerFullScreen] = useState<boolean>(true);

  const toggleBarsUnified = useCallback((explicitState?: boolean, e?: React.SyntheticEvent | Event) => {
    if (e && 'stopPropagation' in e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setShowReciterPanel(false);
    if (showBottomSheet) {
      setShowBottomSheet(false);
    }
    setSelectedAyah(null);

    if (explicitState !== undefined) {
      onShowBarsChange?.(explicitState);
    } else if (onToggleBars) {
      onToggleBars();
    } else if (onShowBarsChange) {
      onShowBarsChange(true);
    }
  }, [showBars, showBottomSheet, onToggleBars, onShowBarsChange]);

  const handleAyahClick = (ayah: Ayah, e?: React.SyntheticEvent) => {
    if (e && 'stopPropagation' in e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }

    const now = Date.now();
    const targetAyahNum = ayah.numberInSurah;
    const isSameAyah = lastClickTimeRef.current.ayahNumber === targetAyahNum;
    const timeDiff = now - lastClickTimeRef.current.time;

    // Fast double-click or double-tap detection on any device
    if (isSameAyah && timeDiff < 400 && timeDiff > 40) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      lastClickTimeRef.current = { time: 0, ayahNumber: null };
      handleAyahDoubleClick(ayah);
      return;
    }

    lastClickTimeRef.current = { time: now, ayahNumber: targetAyahNum };

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    // Single tap on any part of the page or ayah toggles top and bottom header bars
    clickTimeoutRef.current = setTimeout(() => {
      toggleBarsUnified(undefined, e);
      clickTimeoutRef.current = null;
    }, 280);
  };

  const handleAyahDoubleClick = (ayah: Ayah) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    lastClickTimeRef.current = { time: 0, ayahNumber: null };
    setSelectedAyah(null);
    setShowReciterPanel(false);

    // Open/show header & bottom navigation and ensure recitation player bar is visible
    onShowBarsChange?.(true);
    resetAudioCapsuleTimer();
    setAudioCapsuleVisible(true);
    onRecitationStateChange?.(true);

    const targetSurahNum = (ayah as any).surah?.number || surahNumber;
    if (targetSurahNum === surahNumber) {
      const idx = ayahs.findIndex(a => a.numberInSurah === ayah.numberInSurah);
      if (idx !== -1) {
        setPlayingIndex(idx);
        playAyah(idx);
      }
    } else {
      pendingPlayAyahNumberRef.current = ayah.numberInSurah;
      if (onChangeSurah) {
        onChangeSurah(targetSurahNum, ayah.numberInSurah, (ayah as any).page || currentPage);
      }
    }
  };

  const handleOpenShareAyah = (ayah: Ayah) => {
    const data: ShareAyahData = {
      mode: "single",
      ayah: {
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        text: ayah.text,
        page: ayah.page || currentPage,
        juz: ayah.juz
      },
      surahName: currentSurahMeta?.name || `سورة ${surahNumber}`,
      surahNumber
    };
    if (onOpenShareAyah) {
      onOpenShareAyah(data);
    } else {
      setShareAyahData(data);
    }
  };

  const handleOpenAyahBookmarkMenu = (e: React.MouseEvent, ayah: Ayah) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setBookmarkMenu({
      surahNumber,
      surahName: currentSurahMeta?.name || `سورة ${surahNumber}`,
      ayahNumber: ayah.numberInSurah,
      top: rect.bottom,
      left: rect.left + rect.width / 2,
      align: "center"
    });
  };

  const handleOpenAyahNoteModal = (ayah: Ayah) => {
    const localNote = localStorage.getItem(`tebyan_user_ayah_notes_${surahNumber}_${ayah.numberInSurah}`) || "";
    const noteObj = notes.find(n => n.surahNumber === surahNumber && n.ayahNumber === ayah.numberInSurah);
    setAyahNoteText(localNote || noteObj?.content || "");
    setAyahNoteModal({
      ayah,
      surahNumber,
      surahName: currentSurahMeta?.name || `سورة ${surahNumber}`
    });
  };

  const handleSaveAyahNote = () => {
    if (!ayahNoteModal) return;
    const aSurah = ayahNoteModal.surahNumber;
    const aAyahNum = ayahNoteModal.ayah.numberInSurah;
    const aSurahName = ayahNoteModal.surahName;
    const trimmed = ayahNoteText.trim();

    if (trimmed) {
      localStorage.setItem(`tebyan_user_ayah_notes_${aSurah}_${aAyahNum}`, trimmed);
      
      const existingIdx = notes.findIndex(n => n.surahNumber === aSurah && n.ayahNumber === aAyahNum);
      let updatedNotes;
      if (existingIdx !== -1) {
        updatedNotes = notes.map((n, idx) => 
          idx === existingIdx 
            ? { ...n, content: trimmed, timestamp: new Date().toLocaleDateString("ar-EG", { day: "numeric", month: "long" }) }
            : n
        );
      } else {
        const newNote = {
          id: `note-${Date.now()}`,
          surahNumber: aSurah,
          surahName: aSurahName,
          ayahNumber: aAyahNum,
          content: trimmed,
          timestamp: new Date().toLocaleDateString("ar-EG", { day: "numeric", month: "long" })
        };
        updatedNotes = [newNote, ...notes];
      }
      setNotes(updatedNotes);
      localStorage.setItem("quran_annotations_tebyan", JSON.stringify(updatedNotes));
    } else {
      localStorage.removeItem(`tebyan_user_ayah_notes_${aSurah}_${aAyahNum}`);
      const updatedNotes = notes.filter(n => !(n.surahNumber === aSurah && n.ayahNumber === aAyahNum));
      setNotes(updatedNotes);
      localStorage.setItem("quran_annotations_tebyan", JSON.stringify(updatedNotes));
    }

    window.dispatchEvent(new CustomEvent("tebyan_ayah_note_saved", {
      detail: { surahNumber: aSurah, ayahNumber: aAyahNum, content: trimmed }
    }));

    setAyahNoteModal(null);
  };

  const handleDeleteAyahNote = () => {
    if (!ayahNoteModal) return;
    const aSurah = ayahNoteModal.surahNumber;
    const aAyahNum = ayahNoteModal.ayah.numberInSurah;
    localStorage.removeItem(`tebyan_user_ayah_notes_${aSurah}_${aAyahNum}`);
    const updatedNotes = notes.filter(n => !(n.surahNumber === aSurah && n.ayahNumber === aAyahNum));
    setNotes(updatedNotes);
    localStorage.setItem("quran_annotations_tebyan", JSON.stringify(updatedNotes));
    
    window.dispatchEvent(new CustomEvent("tebyan_ayah_note_saved", {
      detail: { surahNumber: aSurah, ayahNumber: aAyahNum, content: "" }
    }));

    setAyahNoteModal(null);
  };

  const recalculateToolbarPosition = () => {
    if (!selectedAyah) {
      setToolbarCoords(null);
      return;
    }
    const sNum = (selectedAyah as any).surah?.number || surahNumber;
    const aNum = selectedAyah.numberInSurah;
    const absNum = selectedAyah.number;
    
    // Search elements for the current selected verse across continuous layout, card layout, page-by-page layout, and SVG layouts
    const el = document.getElementById(`ayah-word-span-${absNum}`) || 
               document.getElementById(`ayah-word-span-${aNum}`) || 
               document.getElementById(`ayah-block-${aNum}`) ||
               document.getElementById(`ayah-block-${absNum}`) ||
               document.querySelector(`.ayahPolygon[surah="${sNum}"][ayah="${aNum}"]`);
               
    if (el) {
      const rect = el.getBoundingClientRect();
      const nextTop = Math.max(80, rect.top - 56); // 56px above and capped to avoid clipping under the header
      const nextLeft = rect.left + rect.width / 2;
      setToolbarCoords(prev => {
        if (prev && Math.abs(prev.top - nextTop) < 1 && Math.abs(prev.left - nextLeft) < 1) {
          return prev;
        }
        return { top: nextTop, left: nextLeft, isFixed: true };
      });
    } else {
      const nextTop = window.innerHeight - 180;
      const nextLeft = window.innerWidth / 2;
      setToolbarCoords(prev => {
        if (prev && Math.abs(prev.top - nextTop) < 1 && Math.abs(prev.left - nextLeft) < 1) {
          return prev;
        }
        return { top: nextTop, left: nextLeft, isFixed: true };
      });
    }
  };

  useEffect(() => {
    if (selectedAyah) {
      recalculateToolbarPosition();
      
      const handleUpdate = () => {
        recalculateToolbarPosition();
      };
      
      window.addEventListener("scroll", handleUpdate, { passive: true });
      window.addEventListener("resize", handleUpdate, { passive: true });
      
      const scrollContainers = document.querySelectorAll(".overflow-y-auto, [style*='overflow-y: auto'], #mushaf-continuous-canvas");
      scrollContainers.forEach(container => {
        container.addEventListener("scroll", handleUpdate, { passive: true });
      });
      
      const rAF = requestAnimationFrame(handleUpdate);
      const timer = setTimeout(handleUpdate, 100);
      
      return () => {
        cancelAnimationFrame(rAF);
        clearTimeout(timer);
        window.removeEventListener("scroll", handleUpdate);
        window.removeEventListener("resize", handleUpdate);
        scrollContainers.forEach(container => {
          container.removeEventListener("scroll", handleUpdate);
        });
      };
    }
  }, [selectedAyah, surahNumber]);

  // Tafsir long-press modal state
  const [tafsirModalAyah, setTafsirModalAyah] = useState<Ayah | null>(null);
  const [tafsirModalBook, setTafsirModalBook] = useState<"tafsir_mukhtasar" | "tafsir_muyassar" | "tafsir_sadi">("tafsir_mukhtasar");
  const [tafsirModalText, setTafsirModalText] = useState<string>("");
  const [tafsirModalLoading, setTafsirModalLoading] = useState<boolean>(false);
  const [tafsirModalError, setTafsirModalError] = useState<string | null>(null);
  const [tafsirModalFontSize, setTafsirModalFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("altibyan_tafsir_modal_font_size");
      return saved ? Math.max(14, Math.min(38, parseInt(saved, 10))) : 20;
    } catch {
      return 20;
    }
  });

  const handleZoomInTafsir = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTafsirModalFontSize((prev) => {
      const next = Math.min(prev + 2, 38);
      try { localStorage.setItem("altibyan_tafsir_modal_font_size", next.toString()); } catch {}
      return next;
    });
  };

  const handleZoomOutTafsir = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTafsirModalFontSize((prev) => {
      const next = Math.max(prev - 2, 14);
      try { localStorage.setItem("altibyan_tafsir_modal_font_size", next.toString()); } catch {}
      return next;
    });
  };

  const handleResetTafsirFontSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTafsirModalFontSize(20);
    try { localStorage.setItem("altibyan_tafsir_modal_font_size", "20"); } catch {}
  };

  const fetchTafsirForModal = async (
    ayah: Ayah,
    bookOverride?: "tafsir_mukhtasar" | "tafsir_muyassar" | "tafsir_sadi"
  ) => {
    setTafsirModalLoading(true);
    setTafsirModalError(null);
    setTafsirModalText("");

    const targetBook = bookOverride || tafsirModalBook;
    const sNum = (ayah as any).surah?.number || surahNumber;
    const aNum = ayah.numberInSurah;
    const sName = (ayah as any).surah?.name || currentSurahMeta?.name;

    // Ensure authentic ayah text is displayed in the modal if it was placeholder
    let realAyahText = ayah.text;
    if (!realAyahText || realAyahText.startsWith("آية رقم")) {
      const pageMatch = pageAyahs.find((a) => a.numberInSurah === aNum);
      if (pageMatch?.text) {
        realAyahText = pageMatch.text;
        setTafsirModalAyah((prev) => prev ? { ...prev, text: realAyahText } : null);
      }
    }

    // 1. Instant authentic local offline resolution (100% offline & instant 0ms)
    let offlineResult: string | null = null;
    if (targetBook === "tafsir_mukhtasar") {
      offlineResult = getOfflineMukhtasarTafsir(sNum, aNum) || getOfflineMukhtasarTafsirFallback(sNum, aNum, sName, realAyahText);
    } else if (targetBook === "tafsir_muyassar") {
      offlineResult = getOfflineMuyassarTafsir(sNum, aNum) || generateOfflineMuyassar(sNum, aNum, sName, realAyahText);
    } else if (targetBook === "tafsir_sadi") {
      offlineResult = getOfflineSaadiTafsir(sNum, aNum) || generateOfflineSaadi(sNum, aNum, sName, realAyahText);
    }

    if (offlineResult) {
      setTafsirModalText(offlineResult);
      setTafsirModalLoading(false);
      const cacheKey = `${sNum}:${aNum}:${targetBook}`;
      saveToLibraryCache(cacheKey, offlineResult).catch(() => {});
      return;
    }

    // 2. Direct check in IndexedDB offline cache
    const cacheKey = `${sNum}:${aNum}:${targetBook}`;
    try {
      const dbCached = await getFromLibraryCache(cacheKey);
      if (dbCached) {
        setTafsirModalText(dbCached);
        setTafsirModalLoading(false);
        return;
      }
    } catch (_) {}

    // 3. Fallback to universal offline content engine
    const offlineUniversal = await getOfflineLibraryContent(sNum, aNum, targetBook, sName, realAyahText);
    if (offlineUniversal) {
      setTafsirModalText(offlineUniversal);
      setTafsirModalLoading(false);
      return;
    }

    setTafsirModalText(getOfflineMukhtasarTafsir(sNum, aNum) || getOfflineMuyassarTafsir(sNum, aNum) || "");
    setTafsirModalLoading(false);
  };

  useEffect(() => {
    if (tafsirModalAyah) {
      fetchTafsirForModal(tafsirModalAyah);
    }
  }, [tafsirModalAyah]);

  const longPressTimeoutRef = useRef<any>(null);
  const longPressActiveRef = useRef<boolean>(false);
  const touchStartPosRef = useRef<{ x: number, y: number } | null>(null);

  const handleOpenFloatingAyahMenu = (ayah: Ayah, clientX?: number, clientY?: number) => {
    const sNum = (ayah as any).surah?.number || surahNumber;
    const sName = (ayah as any).surah?.name || currentSurahMeta?.name || `سورة ${sNum}`;
    
    let x = clientX ?? window.innerWidth / 2;
    let y = clientY ?? window.innerHeight / 2;

    if (clientX === undefined || clientY === undefined) {
      const el = document.getElementById(`ayah-word-span-${ayah.numberInSurah}`) ||
                 document.getElementById(`ayah-block-${ayah.numberInSurah}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top;
      }
    }

    setFloatingAyahMenu({
      ayah,
      surahNumber: sNum,
      surahName: sName,
      x,
      y,
      showBookmarksList: false,
    });
  };

  const handleFloatingCopyAyah = () => {
    if (!floatingAyahMenu) return;
    const { ayah, surahName, surahNumber: sNum } = floatingAyahMenu;
    let cleanText = ayah.text || "";
    if (sNum !== 1 && ayah.numberInSurah === 1) {
      const bismillahTemplate = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
      if (cleanText.startsWith(bismillahTemplate)) {
        cleanText = cleanText.replace(bismillahTemplate, "").trim();
      }
    }
    const fullText = `﴿ ${cleanText} ﴾ [سورة ${surahName} : ${ayah.numberInSurah}]`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullText).then(() => {
        setFloatingCopied(true);
        setTimeout(() => {
          setFloatingCopied(false);
          setFloatingAyahMenu(null);
        }, 900);
      }).catch(() => {
        setFloatingCopied(true);
        setTimeout(() => {
          setFloatingCopied(false);
          setFloatingAyahMenu(null);
        }, 900);
      });
    } else {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = fullText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setFloatingCopied(true);
        setTimeout(() => {
          setFloatingCopied(false);
          setFloatingAyahMenu(null);
        }, 900);
      } catch {}
    }
  };

  const startLongPressTimer = (e: React.MouseEvent | React.TouchEvent, ayah: Ayah) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    longPressActiveRef.current = false;

    let clientX = 0;
    let clientY = 0;
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else {
      const target = e.target as HTMLElement;
      if (target) {
        const rect = target.getBoundingClientRect();
        clientX = rect.left + rect.width / 2;
        clientY = rect.top;
      }
    }

    touchStartPosRef.current = { x: clientX, y: clientY };

    // If contextmenu (right-click), immediately open floating menu
    if (e.type === "contextmenu") {
      e.preventDefault();
      e.stopPropagation();
      longPressActiveRef.current = true;
      handleOpenFloatingAyahMenu(ayah, clientX, clientY);
      return;
    }

    longPressTimeoutRef.current = setTimeout(() => {
      longPressActiveRef.current = true;
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {}
      }
      handleOpenFloatingAyahMenu(ayah, clientX, clientY);
    }, 450);
  };

  const cancelLongPressTimer = (e?: React.MouseEvent | React.TouchEvent) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    if (longPressActiveRef.current) {
      if (e) {
        e.preventDefault?.();
        e.stopPropagation?.();
      }
      setTimeout(() => {
        longPressActiveRef.current = false;
      }, 150);
      return true;
    }
    longPressActiveRef.current = false;
    return false;
  };

  const checkLongPressMove = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!longPressTimeoutRef.current || !touchStartPosRef.current) return;
    let currentX = 0;
    let currentY = 0;
    if (e && "touches" in e && e.touches.length > 0) {
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
    } else if (e && "clientX" in e) {
      currentX = (e as React.MouseEvent).clientX;
      currentY = (e as React.MouseEvent).clientY;
    }
    const dx = Math.abs(currentX - touchStartPosRef.current.x);
    const dy = Math.abs(currentY - touchStartPosRef.current.y);
    if (dx > 12 || dy > 12) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
      longPressActiveRef.current = false;
    }
  };

  const extractAyahFromSvgTarget = (target: SVGElement): Ayah | null => {
    if (!target || !target.classList.contains("ayahPolygon")) return null;
    const surahStr = target.getAttribute("surah");
    const ayahStr = target.getAttribute("ayah");
    if (!surahStr || !ayahStr) return null;

    const surahNum = parseInt(surahStr, 10);
    const ayahNum = parseInt(ayahStr, 10);
    
    const match = pageAyahs.find(
      (a) => a.surah.number === surahNum && a.numberInSurah === ayahNum
    );
    return match || ({
      number: parseInt(target.getAttribute("id")?.replace("verse-", "") || "1", 10),
      numberInSurah: ayahNum,
      text: `آية رقم ${ayahNum} في سورة ${surahNum}`,
      translationEn: "Select to read translation...",
      page: currentPage,
      surah: {
        number: surahNum,
        name: surahsList.find((s) => s.number === surahNum)?.name || "السورة",
      }
    } as any);
  };

  const handleSvgMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as SVGElement;
    const ayah = extractAyahFromSvgTarget(target);
    if (ayah) {
      startLongPressTimer(e, ayah);
    }
    handleMouseDown(e);
  };

  const handleSvgContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as SVGElement;
    const ayah = extractAyahFromSvgTarget(target);
    if (ayah) {
      e.preventDefault();
      e.stopPropagation();
      startLongPressTimer(e, ayah);
    }
  };

  const handleSvgMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const consumed = cancelLongPressTimer(e);
    if (!consumed) {
      handleMouseUp(e);
    }
  };

  const handleSvgTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as SVGElement;
    const ayah = extractAyahFromSvgTarget(target);
    if (ayah) {
      startLongPressTimer(e, ayah);
    }
    handleTouchStart(e);
  };

  const handleSvgTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const consumed = cancelLongPressTimer(e);
    if (!consumed) {
      handleTouchEnd(e);
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    checkLongPressMove(e);
    handleMouseMove(e);
  };

  const handleSvgTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    checkLongPressMove(e);
    handleTouchMove(e);
  };

  // General state feedback
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const handleSelectVerseFromSearch = async (
    sNumber: number,
    sName: string,
    aNumber: number,
    pageNumber: number,
    ayahText: string
  ) => {
    setShowWordSearchModal(false);

    let targetPage = pageNumber;
    if (!targetPage || targetPage <= 0) {
      const pMeta = quranSvgPageMetadata.find(pm => pm.surahNumber === sNumber);
      targetPage = pMeta ? pMeta.page : 1;
    }

    // Set local page state immediately
    setCurrentPage(targetPage);

    // Always inform parent App of new surah, startAyah AND targetPage
    if (onChangeSurah) {
      onChangeSurah(sNumber, aNumber, targetPage);
    }

    const newAyah: Ayah = {
      number: 0,
      numberInSurah: aNumber,
      text: ayahText,
      translationEn: "",
    };
    setSelectedAyah(newAyah);

    // Save to localStorage
    try {
      localStorage.setItem("quran_last_opened_surah", String(sNumber));
      localStorage.setItem("quran_last_opened_page", String(targetPage));
      if (aNumber) {
        localStorage.setItem("quran_last_opened_ayah", String(aNumber));
      }
    } catch {}

    // Fetch exact page number for the ayah from AlQuran Cloud to refine landing page
    if (sNumber && aNumber && aNumber >= 1) {
      try {
        const res = await fetchAlquranCloud(`v1/ayah/${sNumber}:${aNumber}`);
        if (res && res.data && res.data.page) {
          const exactPage = res.data.page;
          setCurrentPage(exactPage);
          if (onChangeSurah) {
            onChangeSurah(sNumber, aNumber, exactPage);
          }
          try {
            localStorage.setItem("quran_last_opened_page", String(exactPage));
          } catch {}
        }
      } catch (err) {
        console.warn("Could not fetch exact page for ayah:", err);
      }
    }
  };

  // Medina Mushaf page mode states
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (initialPageNumber) return initialPageNumber;
    try {
      const saved = localStorage.getItem("quran_last_opened_page");
      if (saved) return Number(saved);
    } catch {}
    return getSurahStartPage(surahNumber || 1);
  });
  const [sliderPage, setSliderPage] = useState<number>(1);
  const [prevPage, setPrevPage] = useState<number>(1);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const prevReportedPageSyncRef = useRef<{ page: number; surah: number; ayah?: number } | null>(null);

  useEffect(() => {
    setSliderPage(currentPage);
    if (currentPage) {
      try {
        localStorage.setItem("quran_last_opened_page", String(currentPage));
        const pageRange = getAyahsForPage(currentPage);
        if (pageRange) {
          localStorage.setItem("quran_last_opened_surah", String(pageRange.surahNumber));
          localStorage.setItem("quran_last_opened_ayah", String(pageRange.startAyah));
          const prev = prevReportedPageSyncRef.current;
          if (!prev || prev.page !== currentPage || prev.surah !== pageRange.surahNumber || prev.ayah !== selectedAyah?.numberInSurah) {
            prevReportedPageSyncRef.current = { page: currentPage, surah: pageRange.surahNumber, ayah: selectedAyah?.numberInSurah };
            onPageChange?.(currentPage, pageRange.surahNumber, pageRange.startAyah, selectedAyah?.numberInSurah);
          }
        } else {
          const pageMeta = quranSvgPageMetadata.find(p => p.page === currentPage);
          if (pageMeta) {
            localStorage.setItem("quran_last_opened_surah", String(pageMeta.surahNumber));
          }
        }
      } catch (e) {
        console.warn("Could not save last opened page:", e);
      }
    }
  }, [currentPage]);

  // Sync selected ayah changes with parent and localStorage
  useEffect(() => {
    if (selectedAyah) {
      const sNum = (selectedAyah as any).surah?.number || surahNumber;
      const aNum = selectedAyah.numberInSurah;
      try {
        localStorage.setItem("quran_last_opened_surah", String(sNum));
        localStorage.setItem("quran_last_opened_ayah", String(aNum));
      } catch {}
      const pageInfo = getAyahsForPage(currentPage);
      const prev = prevReportedPageSyncRef.current;
      if (!prev || prev.page !== currentPage || prev.surah !== sNum || prev.ayah !== aNum) {
        prevReportedPageSyncRef.current = { page: currentPage, surah: sNum, ayah: aNum };
        onPageChange?.(currentPage, sNum, pageInfo ? pageInfo.startAyah : aNum, aNum);
      }
    }
  }, [selectedAyah]);

  useEffect(() => {
    if (currentPage > prevPage) {
      setDirection("next");
    } else if (currentPage < prevPage) {
      setDirection("prev");
    }
    setPrevPage(currentPage);
  }, [currentPage, prevPage]);

  // Track search opens
  useEffect(() => {
    if (showWordSearchModal) {
      setStatsSearchedCount(prev => {
        const next = prev + 1;
        localStorage.setItem("quran_stats_searched_count", String(next));
        return next;
      });
    }
  }, [showWordSearchModal]);

  // Track page reading dynamically
  const prevPageRef = useRef<number | null>(null);
  useEffect(() => {
    if (currentPage && prevPageRef.current !== null && currentPage !== prevPageRef.current) {
      setStatsPagesRead((prev) => {
        const next = prev + 1;
        localStorage.setItem("quran_stats_pages_read", String(next));
        return next;
      });
    }
    prevPageRef.current = currentPage || null;
  }, [currentPage]);

  // Track isIndexOpen transitions & surah changes to handle explicit selection from index
  // Ensure currentPage is updated when surahNumber, initialPageNumber, or initialAyahNumber changes externally
  const prevPropSurahRef = useRef<number>(surahNumber);
  const prevPropPageRef = useRef<number | undefined>(initialPageNumber);
  const prevPropAyahRef = useRef<number | undefined>(initialAyahNumber);

  useEffect(() => {
    const surahChanged = prevPropSurahRef.current !== surahNumber;
    const pageChanged = initialPageNumber !== undefined && prevPropPageRef.current !== initialPageNumber;
    const ayahChanged = initialAyahNumber !== undefined && prevPropAyahRef.current !== initialAyahNumber;

    prevPropSurahRef.current = surahNumber;
    prevPropPageRef.current = initialPageNumber;
    prevPropAyahRef.current = initialAyahNumber;

    if (surahChanged || pageChanged || ayahChanged || !hasAppliedInitialPageRef.current) {
      let targetPage = initialPageNumber;
      if (!targetPage && surahNumber) {
        if (initialAyahNumber) {
          const q = quartersList.find(q => q.surahNumber === surahNumber && q.ayahNumber === initialAyahNumber);
          if (q && q.page) {
            targetPage = q.page;
          } else {
            targetPage = getSurahStartPage(surahNumber);
          }
        } else {
          targetPage = getSurahStartPage(surahNumber);
        }
      }

      if (targetPage) {
        if (targetPage !== currentPage) {
          setCurrentPage(targetPage);
          setPageAyahs([]);
        }
        if (settings.autoScrollActive) {
          setAutoScrollStartPage(targetPage);
          try {
            localStorage.removeItem("quran_scroll_position");
          } catch {}
          requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: "instant" });
            const el = document.querySelector(`[data-mushaf-page="${targetPage}"]`);
            if (el) {
              el.scrollIntoView({ behavior: "instant", block: "start" });
            }
          });
        } else {
          window.scrollTo({ top: 0, behavior: "instant" });
        }
      }
      hasAppliedInitialPageRef.current = true;
    }
  }, [surahNumber, initialPageNumber, initialAyahNumber]);

  const [isPortrait, setIsPortrait] = useState<boolean>(
    typeof window !== "undefined" ? window.innerHeight > window.innerWidth : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Medina Mushaf SVG page mode states
  const [svgContent, setSvgContent] = useState<string>("");
  const [svgLoading, setSvgLoading] = useState<boolean>(false);
  const [svgError, setSvgError] = useState<string | null>(null);
  const [pagesSvg, setPagesSvg] = useState<Record<number, string>>({});
  const [isDownloadingSvgPage, setIsDownloadingSvgPage] = useState<boolean>(false);

  const handleDownloadCurrentPageSvg = async () => {
    if (isDownloadingSvgPage) return;
    setIsDownloadingSvgPage(true);
    try {
      let svgText = pagesSvg[currentPage];
      if (!svgText) {
        svgText = await fetchQuranSvg(currentPage, settings.mushafProvider || "quran-svg");
      }
      
      const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${settings.mushafProvider || "quran-svg"}_page_${currentPage}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading SVG page:", err);
      const isEn = settings.language === "en";
      alert(isEn ? "Sorry, failed to download current page as SVG." : "عذراً، فشل تحميل الصفحة الحالية بصيغة SVG للجهاز.");
    } finally {
      setIsDownloadingSvgPage(false);
    }
  };

  const [autoScrollStartPage, setAutoScrollStartPage] = useState<number | null>(null);
  const [scrollTargetPage, setScrollTargetPage] = useState<number | null>(null);

  useEffect(() => {
    ensureQbsmlLoaded();
  }, [currentPage, settings.pageMode]);

  useEffect(() => {
    setPagesSvg({});
    setSvgContent("");
  }, [settings.mushafProvider]);

  useEffect(() => {
    if (scrollTargetPage !== null) {
      if (autoScrollStartPage !== null) {
        if (scrollTargetPage < autoScrollStartPage || scrollTargetPage >= autoScrollStartPage + 25) {
          setAutoScrollStartPage(scrollTargetPage);
        }
      }
      const timer = setTimeout(() => {
        const el = document.querySelector(`[data-mushaf-page="${scrollTargetPage}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setScrollTargetPage(null);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [scrollTargetPage, autoScrollStartPage]);

  useEffect(() => {
    const isContinuous = settings.autoScrollActive;
    if ((settings.pageMode === "mushaf-svg" || !settings.pageMode) && isContinuous) {
      if (autoScrollStartPage === null || currentPage < autoScrollStartPage || currentPage >= autoScrollStartPage + 25) {
        setAutoScrollStartPage(currentPage);
      }
    } else if (settings.pageMode === "mushaf-svg" && !settings.autoScrollActive) {
      setAutoScrollStartPage(null);
    }
  }, [settings.pageMode, currentPage, autoScrollStartPage, settings.autoScrollActive]);

  // Continuously prefetch needed pages when in continuous landscape or auto-scroll mode
  useEffect(() => {
    if (autoScrollStartPage === null) return;
    const maxP = Math.min(604, autoScrollStartPage + 20);
    const needed: number[] = [];
    for (let p = autoScrollStartPage; p <= maxP; p++) {
      if (!pagesSvg[p]) {
        needed.push(p);
      }
    }
    if (needed.length === 0) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchQueue = async () => {
      for (const p of needed) {
        if (!isMounted || controller.signal.aborted) break;
        try {
          const text = await fetchQuranSvg(p, settings.mushafProvider || "quran-svg", controller.signal);
          if (isMounted && text) {
            setPagesSvg(prev => ({ ...prev, [p]: text }));
          }
        } catch (e: any) {
          if (e?.name === "AbortError") break;
        }
      }
    };
    fetchQueue();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [autoScrollStartPage, settings.mushafProvider]);

  useEffect(() => {
    if (settings.pageMode !== "mushaf-svg" || autoScrollStartPage === null) return;

    const handleScrollDetectPage = () => {
      const pageElements = document.querySelectorAll("[data-mushaf-page]");
      let activePage = currentPage;
      let minDiff = Infinity;

      pageElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const diff = Math.abs(rect.top);
        if (diff < minDiff) {
          minDiff = diff;
          const pNum = Number(el.getAttribute("data-mushaf-page"));
          if (pNum) {
            activePage = pNum;
          }
        }
      });

      if (activePage !== currentPage) {
        setCurrentPage(activePage);
      }
    };

    window.addEventListener("scroll", handleScrollDetectPage, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScrollDetectPage);
    };
  }, [settings.pageMode, autoScrollStartPage, currentPage]);

  // Track scroll position in Library continuous mode to show floating scroll-to-top button
  useEffect(() => {
    if (effectivePageMode !== "continuous") {
      setShowLibraryScrollTop(false);
      return;
    }

    const checkScrollTop = () => {
      const winScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const canvasEl = document.getElementById("mushaf-continuous-canvas");
      const canvasScroll = canvasEl ? canvasEl.scrollTop : 0;
      const currentScroll = Math.max(winScroll, canvasScroll);
      setShowLibraryScrollTop(currentScroll > 120);
    };

    checkScrollTop();

    window.addEventListener("scroll", checkScrollTop, { passive: true });
    const canvasEl = document.getElementById("mushaf-continuous-canvas");
    if (canvasEl) {
      canvasEl.addEventListener("scroll", checkScrollTop, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", checkScrollTop);
      if (canvasEl) {
        canvasEl.removeEventListener("scroll", checkScrollTop);
      }
    };
  }, [effectivePageMode, surahNumber]);

  const handleLibraryScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });
    const canvasEl = document.getElementById("mushaf-continuous-canvas");
    if (canvasEl) {
      canvasEl.scrollTo({ top: 0, behavior: "smooth" });
    }
    const appViewport = document.getElementById("app-viewport");
    if (appViewport) {
      appViewport.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Synchronize autoScrollStartPage and viewport when autoScrollActive turns ON
  const prevAutoScrollActiveRef = useRef<boolean>(!!settings.autoScrollActive);
  useEffect(() => {
    const wasActive = prevAutoScrollActiveRef.current;
    const isActive = !!settings.autoScrollActive;
    prevAutoScrollActiveRef.current = isActive;

    if (!wasActive && isActive) {
      // User activated auto-scroll: start strictly from the current page
      setAutoScrollStartPage(currentPage);
      try {
        localStorage.removeItem("quran_scroll_position");
      } catch {}
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        const el = document.querySelector(`[data-mushaf-page="${currentPage}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "instant", block: "start" });
        }
      });
    } else if (wasActive && !isActive) {
      // User stopped auto-scroll
      if (isPortrait) {
        setAutoScrollStartPage(null);
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [settings.autoScrollActive, currentPage, isPortrait]);

  // Synchronize autoScrollStartPage when index drawer closes (user selected surah/page)
  const prevIndexOpenRef = useRef<boolean>(isIndexOpen);
  useEffect(() => {
    const wasOpen = prevIndexOpenRef.current;
    prevIndexOpenRef.current = isIndexOpen;
    if (wasOpen && !isIndexOpen) {
      if (settings.autoScrollActive) {
        setAutoScrollStartPage(currentPage);
        try {
          localStorage.removeItem("quran_scroll_position");
        } catch {}
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "instant" });
          const el = document.querySelector(`[data-mushaf-page="${currentPage}"]`);
          if (el) {
            el.scrollIntoView({ behavior: "instant", block: "start" });
          }
        });
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  }, [isIndexOpen, currentPage, settings.autoScrollActive]);

  const handleToggleAutoScroll = useCallback((forceState?: boolean) => {
    const nextActive = forceState !== undefined ? forceState : !settings.autoScrollActive;
    if (nextActive) {
      setAutoScrollStartPage(currentPage);
      try {
        localStorage.removeItem("quran_scroll_position");
      } catch {}
      onChangeSettings({ autoScrollActive: true });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        const el = document.querySelector(`[data-mushaf-page="${currentPage}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "instant", block: "start" });
        }
      });
    } else {
      onChangeSettings({ autoScrollActive: false });
      if (isPortrait) {
        setAutoScrollStartPage(null);
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [settings.autoScrollActive, currentPage, isPortrait, onChangeSettings]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSliderChange = (val: number) => {
    setSliderPage(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setCurrentPage(val);
    }, 120); // Fast but efficient debounce
  };

  const handleSliderRelease = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setCurrentPage(sliderPage);
    if (settings.autoScrollActive) {
      setAutoScrollStartPage(sliderPage);
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        const el = document.querySelector(`[data-mushaf-page="${sliderPage}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "instant", block: "start" });
        }
      });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  useEffect(() => {
    if (settings.pageMode !== "mushaf-svg") return;

    const pageToLoad = autoScrollStartPage !== null
      ? autoScrollStartPage
      : currentPage;

    let isMounted = true;
    const controller = new AbortController();

    // Check if pageToLoad is already cached in pagesSvg
    if (pagesSvg[pageToLoad]) {
      setSvgContent(pagesSvg[pageToLoad]);
      setSvgLoading(false);
      setSvgError(null);
    } else {
      setSvgLoading(true);
      setSvgError(null);
    }

    const loadAndPrefetch = async () => {
      try {
        // Step 1: Ensure current/target page is loaded first
        if (!pagesSvg[pageToLoad]) {
          const text = await fetchQuranSvg(
            pageToLoad,
            settings.mushafProvider || "quran-svg",
            controller.signal
          );
          if (isMounted) {
            setPagesSvg(prev => ({ ...prev, [pageToLoad]: text }));
            setSvgContent(text);
            setSvgLoading(false);
            setSvgError(null);
          }
        } else {
          if (isMounted) {
            setSvgLoading(false);
            setSvgError(null);
          }
        }

        // Step 2: Prefetch nearby pages sequentially in background without blocking UI
        const nearbyPages = [pageToLoad + 1, pageToLoad + 2, pageToLoad + 3, pageToLoad - 1]
          .filter(p => p >= 1 && p <= 604);

        for (const p of nearbyPages) {
          if (!isMounted || controller.signal.aborted) break;
          if (pagesSvg[p]) continue;
          try {
            const preText = await fetchQuranSvg(
              p,
              settings.mushafProvider || "quran-svg",
              controller.signal
            );
            if (isMounted && !controller.signal.aborted) {
              setPagesSvg(prev => ({ ...prev, [p]: preText }));
            }
          } catch (err: any) {
            if (err?.name === "AbortError") break;
            // Ignore background prefetch errors
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(`Error loading page ${pageToLoad}:`, err);
        if (isMounted) {
          setSvgError(err.message || `فشل تحميل الصفحة ${pageToLoad}`);
          setSvgLoading(false);
        }
      }
    };

    loadAndPrefetch();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [currentPage, settings.pageMode, settings.mushafProvider, autoScrollStartPage]);

  const handleSvgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowReciterPanel(false);

    if (longPressActiveRef.current) {
      e.preventDefault();
      return;
    }
    if (hasSwipedRef.current || dragDistanceRef.current > 8) {
      e.preventDefault();
      return;
    }
    const target = e.target as SVGElement;
    const targetAyahObj = extractAyahFromSvgTarget(target);
    if (targetAyahObj) {
      handleAyahClick(targetAyahObj, e);
    } else {
      toggleBarsUnified(undefined, e);
    }
  };

  const handleSvgDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (longPressActiveRef.current) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    const target = e.target as SVGElement;
    const targetAyahObj = extractAyahFromSvgTarget(target);
    if (targetAyahObj) {
      handleAyahDoubleClick(targetAyahObj);
    }
  };

  const [pageAyahs, setPageAyahs] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  
  // Audio capsule auto-hide state and effects
  const [audioCapsuleVisible, setAudioCapsuleVisible] = useState<boolean>(true);
  const audioHideTimerRef = useRef<any>(null);

  const resetAudioCapsuleTimer = () => {
    setAudioCapsuleVisible(true);
    if (audioHideTimerRef.current) {
      clearTimeout(audioHideTimerRef.current);
    }
    audioHideTimerRef.current = setTimeout(() => {
      setAudioCapsuleVisible(false);
    }, 5000);
  };

  const clearAudioCapsuleTimer = () => {
    setAudioCapsuleVisible(true);
    if (audioHideTimerRef.current) {
      clearTimeout(audioHideTimerRef.current);
      audioHideTimerRef.current = null;
    }
  };

  // Scroll capsule visibility state - keep visible while autoScrollActive is true
  const [scrollCapsuleVisible, setScrollCapsuleVisible] = useState<boolean>(true);

  useEffect(() => {
    if (settings.autoScrollActive) {
      setScrollCapsuleVisible(true);
    } else {
      setScrollCapsuleVisible(false);
    }
  }, [settings.autoScrollActive]);

  useEffect(() => {
    if (scrollCapsuleToggleTrigger && scrollCapsuleToggleTrigger > 0) {
      if (settings.autoScrollActive) {
        setScrollCapsuleVisible(true);
      }
    }
  }, [scrollCapsuleToggleTrigger, settings.autoScrollActive]);

  // Also reset timer whenever playing state or index changes
  useEffect(() => {
    if (isPlaying || playingIndex !== null) {
      resetAudioCapsuleTimer();
    }
  }, [isPlaying, playingIndex]);

  // Synchronize playingIndex with selectedAyah when user selects a verse DURING active recitation
  useEffect(() => {
    if (selectedAyah && isPlaying) {
      const idx = ayahs.findIndex(a => a.numberInSurah === selectedAyah.numberInSurah);
      if (idx !== -1) {
        setPlayingIndex(idx);
        playAyah(idx);
      }
    }
  }, [selectedAyah, ayahs, isPlaying]);

  // Prevent multiple panels from overlaying (AI Tafsir, Settings Drawer, My Files, and other modals)
  // Mutual exclusion: when any popup/bottom sheet/modal is opened, close all others

  // When serviceDrawerTab is opened (Files, Search, Settings, Index)
  useEffect(() => {
    if (serviceDrawerTab) {
      if (showReciterPanel) setShowReciterPanel(false);
      if (tafsirModalAyah) setTafsirModalAyah(null);
      if (showSettingsDrawerState) setShowSettingsDrawerState(false);
      if (showWordSearchModalState) setShowWordSearchModalState(false);
    }
  }, [serviceDrawerTab]);

  // When selectedAyah is opened
  useEffect(() => {
    if (selectedAyah || showBottomSheet) {
      if (showSettingsDrawerState) setShowSettingsDrawerState(false);
      if (showWordSearchModalState) setShowWordSearchModalState(false);
      if (showReciterPanel) setShowReciterPanel(false);
      if (tafsirModalAyah) setTafsirModalAyah(null);
    }
  }, [selectedAyah, showBottomSheet]);

  // When standalone settings drawer state is opened
  useEffect(() => {
    if (showSettingsDrawerState) {
      if (showReciterPanel) setShowReciterPanel(false);
      if (showWordSearchModalState) setShowWordSearchModalState(false);
      if (tafsirModalAyah) setTafsirModalAyah(null);
    }
  }, [showSettingsDrawerState]);

  // When reciter panel is opened
  useEffect(() => {
    if (showReciterPanel) {
      if (showSettingsDrawerState) setShowSettingsDrawerState(false);
      if (showWordSearchModalState) setShowWordSearchModalState(false);
      if (tafsirModalAyah) setTafsirModalAyah(null);
    }
  }, [showReciterPanel]);

  // When standalone word search modal is opened
  useEffect(() => {
    if (showWordSearchModalState) {
      if (showSettingsDrawerState) setShowSettingsDrawerState(false);
      if (showReciterPanel) setShowReciterPanel(false);
      if (tafsirModalAyah) setTafsirModalAyah(null);
    }
  }, [showWordSearchModalState]);

  // When tafsir modal is opened
  useEffect(() => {
    if (tafsirModalAyah) {
      if (showSettingsDrawerState) setShowSettingsDrawerState(false);
      if (showReciterPanel) setShowReciterPanel(false);
      if (showWordSearchModalState) setShowWordSearchModalState(false);
    }
  }, [tafsirModalAyah]);

  // When share ayah modal is opened
  useEffect(() => {
    if (shareAyahData) {
      if (showSettingsDrawerState) setShowSettingsDrawerState(false);
      if (showReciterPanel) setShowReciterPanel(false);
      if (showWordSearchModalState) setShowWordSearchModalState(false);
      if (tafsirModalAyah) setTafsirModalAyah(null);
    }
  }, [shareAyahData]);

  // Close upper toolbar services drawer, verse service sheet, bottom drawer, modals, and overlays when Mushaf icon is clicked or activeTab is home
  useEffect(() => {
    if (mushafClickTrigger !== undefined) {
      setServiceDrawerTab(null);
      setShowBottomSheet(false);
      if (effectivePageMode !== "continuous" || !initialAyahNumber) {
        setSelectedAyah(null);
      }
      setShowSettingsDrawerState(false);
      setShowWordSearchModalState(false);
      setTafsirModalAyah(null);
      setShareAyahData(null);
      setShowReciterPanel(false);
      setBookmarkMenu(null);
      setShowAddNoteForm(false);
      setShowAddBookmarkForm(false);
    }
  }, [mushafClickTrigger]);

  useEffect(() => {
    if (serviceDrawerTab !== null) {
      onShowBarsChange?.(true);
    }
  }, [serviceDrawerTab, onShowBarsChange]);

  useEffect(() => {
    if (activeTab === "home") {
      setServiceDrawerTab(null);
      setShowBottomSheet(false);
      if (effectivePageMode !== "continuous" || !initialAyahNumber) {
        setSelectedAyah(null);
      }
      setShowSettingsDrawerState(false);
      setShowWordSearchModalState(false);
      setTafsirModalAyah(null);
      setShareAyahData(null);
      setShowReciterPanel(false);
      setBookmarkMenu(null);
      setShowAddNoteForm(false);
      setShowAddBookmarkForm(false);
    }
  }, [activeTab, effectivePageMode, initialAyahNumber]);

  // Close open overlays/drawers when index is opened externally
  useEffect(() => {
    if (isIndexOpen) {
      if (showSettingsDrawerState) setShowSettingsDrawerState(false);
      if (selectedAyah) setSelectedAyah(null);
      if (showReciterPanel) setShowReciterPanel(false);
      if (showWordSearchModalState) setShowWordSearchModalState(false);
      if (tafsirModalAyah) setTafsirModalAyah(null);
      if (shareAyahData) setShareAyahData(null);
    }
  }, [isIndexOpen]);


  const activeFontClass = 
    settings.quranFont === "amiri" ? "font-amiri" :
    settings.quranFont === "naskh" ? "font-naskh" :
    settings.quranFont === "scheherazade" ? "font-scheherazade" :
    settings.quranFont === "traditional" ? "font-traditional" : "font-uthmanic";

  // Dynamic font face stylesheet and styles helper for KFC v4 page fonts
  const displayedPages = useMemo(() => {
    const pages = new Set<number>();
    if (effectivePageMode === "page-by-page" || effectivePageMode === "mushaf-svg" || effectivePageMode === "qcf4" || settings.mushafProvider === "qcf4") {
      pages.add(currentPage);
    } else {
      ayahs.forEach(ayah => {
        if (ayah.page) pages.add(ayah.page);
      });
      // Fallback
      if (pages.size === 0) pages.add(currentPage);
    }
    return Array.from(pages);
  }, [effectivePageMode, currentPage, ayahs, settings.mushafProvider]);

  const displayedSurahMeta = useMemo(() => {
    if (effectivePageMode === "page-by-page" || effectivePageMode === "mushaf-svg" || effectivePageMode === "qcf4" || settings.mushafProvider === "qcf4") {
      const pageMeta = quranSvgPageMetadata.find((p) => p.page === currentPage);
      if (pageMeta) {
        return surahsList.find((s) => s.number === pageMeta.surahNumber) || currentSurahMeta;
      }
      if (pageAyahs.length > 0 && !pageLoading) {
        const firstAyah = pageAyahs[0];
        if (firstAyah && (firstAyah.page === currentPage || !firstAyah.page)) {
          const pageSurahNum = firstAyah.surah?.number;
          if (pageSurahNum && pageSurahNum !== surahNumber) {
            return surahsList.find((s) => s.number === pageSurahNum) || currentSurahMeta;
          }
        }
      }
    }
    return currentSurahMeta;
  }, [effectivePageMode, pageAyahs, pageLoading, currentPage, surahNumber, currentSurahMeta, settings.mushafProvider]);



  const activeSelector = useMemo(() => {
    if (effectivePageMode !== "mushaf-svg") return "";

    const items: { sNum: number; aNum: number }[] = [];

    if (selectedAyah) {
      const sNum = (selectedAyah as any).surah?.number || surahNumber;
      const aNum = selectedAyah.numberInSurah;
      if (sNum && aNum) {
        items.push({ sNum, aNum });
      }
    }

    if (playingIndex !== null && ayahs[playingIndex]) {
      const pAyah = ayahs[playingIndex];
      const sNum = (pAyah as any).surah?.number || surahNumber;
      const aNum = pAyah.numberInSurah;
      if (sNum && aNum && !items.some(i => i.sNum === sNum && i.aNum === aNum)) {
        items.push({ sNum, aNum });
      }
    }

    if (items.length === 0) return "";

    const opacity = theme === "navy-velvet" ? "0.18" : (theme === "gold-velvet" || theme === "emerald-velvet" ? "0.16" : "0.14");
    const fillColor = theme === "navy-velvet" ? "#3F63C6" : (theme === "gold-velvet" || theme === "emerald-velvet" ? "#c5a85c" : "#10b981");

    const selectors = items.flatMap(({ sNum, aNum }) => [
      `#mushaf-svg-wrapper .ayahPolygon[surah="${sNum}"][ayah="${aNum}"]`,
      `#mushaf-svg-wrapper .ayahPolygon[surah="${sNum}"][ayah="${aNum}"]:hover`,
      `.mushaf-page-list-item .ayahPolygon[surah="${sNum}"][ayah="${aNum}"]`,
      `.mushaf-page-list-item .ayahPolygon[surah="${sNum}"][ayah="${aNum}"]:hover`
    ]).join(",\n");

    return `
      ${selectors} {
        fill: ${fillColor} !important;
        fill-opacity: ${opacity} !important;
        stroke: none !important;
        stroke-width: 0px !important;
        transition: none !important;
        animation: none !important;
      }
    `;
  }, [selectedAyah, playingIndex, ayahs, effectivePageMode, surahNumber, theme]);

  const dynamicFontStyles = useMemo(() => {
    if (settings.quranFont === "amiri") return "";
    
    return displayedPages.map(page => {
      const pageStr = String(page).padStart(2, '0');
      return `
        @font-face {
          font-family: 'QCF4_Hafs_${pageStr}_W';
          src: url('https://fonts.quran.ws/assets/fonts/qpc-hafs-v4/QCF4_Hafs_${pageStr}_W.ttf') format('truetype');
          font-display: swap;
        }
      `;
    }).join("\n");
  }, [displayedPages, settings.quranFont]);

  const getAyahStyle = (pageNumber: number) => {
    if (settings.quranFont === "amiri") {
      return {
        fontFamily: "'Amiri', 'Noto Naskh Arabic', serif",
        unicodeBidi: "embed",
        overflowWrap: "anywhere",
        wordBreak: "break-word"
      } as React.CSSProperties;
    }
    if (settings.quranFont === "qcf4" || settings.mushafProvider === "qcf4") {
      const pageStr = String(pageNumber || currentPage || 1).padStart(2, '0');
      return {
        fontFamily: `'QCF4_Hafs_${pageStr}_W', 'QCF4_Hafs_${pageStr}', 'UthmanicHafs', 'Amiri', serif`,
        unicodeBidi: "embed",
        overflowWrap: "anywhere",
        wordBreak: "break-word"
      } as React.CSSProperties;
    }
    return {
      fontFamily: "'UthmanicHafs', 'Amiri', 'Noto Naskh Arabic', serif",
      unicodeBidi: "embed",
      overflowWrap: "anywhere",
      wordBreak: "break-word"
    } as React.CSSProperties;
  };

  const pagePickerScrollRef = useRef<HTMLDivElement>(null);
  const isPagePickerScrollingRef = useRef<any>(null);

  // Synchronize scrolling of the page picker wheel when currentPage changes
  useEffect(() => {
    if (pagePickerScrollRef.current) {
      const targetTop = (currentPage - 1) * 54;
      if (Math.abs(pagePickerScrollRef.current.scrollTop - targetTop) > 2) {
        pagePickerScrollRef.current.scrollTo({
          top: targetTop,
          behavior: "smooth"
        });
      }
    }
  }, [currentPage, effectivePageMode]);

  // Handle manual scroll / drag on the page picker inside the reader
  const handlePagePickerScroll = () => {
    if (!pagePickerScrollRef.current) return;
    
    if (isPagePickerScrollingRef.current) {
      clearTimeout(isPagePickerScrollingRef.current);
    }

    isPagePickerScrollingRef.current = setTimeout(() => {
      if (pagePickerScrollRef.current) {
        const scrollTop = pagePickerScrollRef.current.scrollTop;
        const page = Math.round(scrollTop / 54) + 1;
        const boundedPage = Math.max(1, Math.min(604, page));
        if (boundedPage !== currentPage) {
          setCurrentPage(boundedPage);
        }
      }
    }, 150);
  };

  // Synchronize currentPage on initial load or ayahs arrival IF not applied yet
  useEffect(() => {
    if (ayahs.length > 0 && !hasAppliedInitialPageRef.current) {
      hasAppliedInitialPageRef.current = true;
      if (initialPageNumber) {
        setCurrentPage(initialPageNumber);
      } else if (initialAyahNumber) {
        const matchingAyah = ayahs.find(a => a.numberInSurah === initialAyahNumber);
        if (matchingAyah && matchingAyah.page) {
          setCurrentPage(matchingAyah.page);
        } else if (ayahs[0].page) {
          setCurrentPage(ayahs[0].page);
        }
      } else {
        const savedPage = localStorage.getItem("quran_last_opened_page");
        if (savedPage) {
          const p = Number(savedPage);
          const pageExistsInSurah = ayahs.some(a => a.page === p);
          if (pageExistsInSurah) {
            setCurrentPage(p);
            return;
          }
        }
        if (ayahs[0].page) {
          setCurrentPage(ayahs[0].page);
        }
      }
    }
  }, [ayahs, initialAyahNumber, initialPageNumber]);

  // Fetch page details when currentPage changes and pageMode is "page-by-page", "mushaf-svg", or "qcf4"
  useEffect(() => {
    if (effectivePageMode !== "page-by-page" && effectivePageMode !== "mushaf-svg" && effectivePageMode !== "qcf4" && settings.mushafProvider !== "qcf4") return;
    
    let isMounted = true;
    const fetchPageData = async () => {
      setPageLoading(true);
      setPageAyahs([]);
      try {
        const data = await fetchAlquranCloud(`v1/page/${currentPage}/quran-simple`);
        
        let trAyahs: any[] = [];
        try {
          const trData = await fetchAlquranCloud(`v1/page/${currentPage}/en.pickthall`);
          if (trData?.data?.ayahs) {
            trAyahs = trData.data.ayahs;
          }
        } catch {
          // optional translation
        }
        
        if (isMounted && data?.data?.ayahs) {
          const mapped = data.data.ayahs.map((a: any, idx: number) => ({
            number: a.number,
            numberInSurah: a.numberInSurah,
            text: a.text,
            translationEn: trAyahs[idx]?.text || "Translation loaded failed.",
            surah: a.surah,
            page: currentPage,
          }));
          setPageAyahs(mapped);
        }
      } catch (e) {
        console.warn("Notice: could not load optional page data:", e);
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };
    fetchPageData();
    return () => { isMounted = false; };
  }, [currentPage, effectivePageMode]);

  const playPageAyah = (a: any) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (playingPageAyahNumber === a.number && isPageAyahPlaying) {
      setIsPageAyahPlaying(false);
      setPlayingPageAyahNumber(null);
      return;
    }
    
    setPlayingPageAyahNumber(a.number);
    setIsPageAyahPlaying(true);
    
    const surahStr = String(a.surah.number).padStart(3, "0");
    const ayahStr = String(a.numberInSurah).padStart(3, "0");
    const url = `/api/everyayah/${settings.reciterId}/${surahStr}${ayahStr}.mp3`;
    
    const audio = new Audio(url);
    audioRef.current = audio;
    
    audio.onended = () => {
      setIsPageAyahPlaying(false);
      setPlayingPageAyahNumber(null);
    };
    
    audio.onerror = () => {
      setIsPageAyahPlaying(false);
      setPlayingPageAyahNumber(null);
    };
    
    audio.play().catch(err => {
      console.warn("Audio playback issue (could be restricted in iframes/sandboxes or due to autoplay block):", err);
      setIsPageAyahPlaying(false);
      setPlayingPageAyahNumber(null);
      setRecitationError("تنبيه: التشغيل التلقائي مقيد بالمتصفح. يرجى التفاعل بالنقر على الشاشة أولاً.");
    });
  };

  // Element refs so we can scroll to initial ayah or active playing index
  const ayahElementsRef = useRef<Record<number, HTMLDivElement | null>>({});

  // 1. Load Quran text using offline популярSurahs or dyn API
  useEffect(() => {
    let isMounted = true;
    const loadSurahAndAyahs = async () => {
      setLoading(true);
      setFetchError(null);
      setRecitationError(null);

      // Only stop recitation if NOT transitioning continuously between surahs
      if (!isContinuousTransitioningRef.current) {
        setPlayingIndex(null);
        setIsPlaying(false);
        setSelectedAyah(null);

        quranAudioEngine.stop();
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }

      // Check offline popular surahs dataset first
      if (popularSurahs[surahNumber]) {
        const pageMeta = quranSvgPageMetadata.find(p => p.surahNumber === surahNumber);
        const startPage = pageMeta ? pageMeta.page : 1;
        const mappedAyahs = popularSurahs[surahNumber].map(ayah => ({
          ...ayah,
          page: ayah.page || startPage
        }));
        setAyahs(mappedAyahs);
        setLoading(false);
        return;
      }

      // 2. Check IndexedDB cached surahs
      try {
        const dbCached = await getCachedSurahAyahs(surahNumber);
        if (dbCached && dbCached.length > 0) {
          if (isMounted) {
            setAyahs(dbCached);
            setLoading(false);
          }
          return;
        }
      } catch (_) {}

      // 3. If online, fetch from API
      const isOnline = typeof navigator === "undefined" || navigator.onLine;
      if (isOnline) {
        try {
          const arData = await fetchAlquranCloud(`v1/surah/${surahNumber}`);
          const arAyahs = arData?.data?.ayahs || [];

          let enAyahs: any[] = [];
          try {
            const enData = await fetchAlquranCloud(`v1/surah/${surahNumber}/en.pickthall`);
            if (enData?.data?.ayahs) {
              enAyahs = enData.data.ayahs;
            }
          } catch {
            // optional translation
          }

          const mergedAyahs: Ayah[] = arAyahs.map((ayah: any, index: number) => {
            return {
              number: ayah.number,
              numberInSurah: ayah.numberInSurah,
              text: ayah.text,
              translationEn: enAyahs[index]?.text || getOfflineEnglishTranslation(surahNumber, ayah.numberInSurah) || "",
              page: ayah.page,
            };
          });

          if (mergedAyahs.length > 0) {
            saveCachedSurahAyahs(surahNumber, mergedAyahs).catch(() => {});
          }

          if (isMounted) {
            setAyahs(mergedAyahs);
            setLoading(false);
            return;
          }
        } catch (e: any) {
          console.warn("Surah fetch API offline/failed, falling back to local dataset:", e);
        }
      }

      // 4. Guaranteed offline fallback dataset reconstruction
      const sMeta = surahsList.find((s) => s.number === surahNumber);
      const totalAyahs = sMeta?.numberOfAyahs || 7;
      const startPage = getSurahStartPage(surahNumber) || 1;

      const offlineAyahs: Ayah[] = [];
      for (let i = 1; i <= totalAyahs; i++) {
        const enTrans = getOfflineEnglishTranslation(surahNumber, i);
        offlineAyahs.push({
          number: i,
          numberInSurah: i,
          text: `سورة ${sMeta?.name || ""} - الآية ${toArabicNumerals(i)}`,
          translationEn: enTrans || "",
          page: startPage,
        });
      }

      if (isMounted) {
        setAyahs(offlineAyahs);
        setLoading(false);
        setFetchError(null);
      }
    };

    loadSurahAndAyahs();
    return () => {
      isMounted = false;
    };
  }, [surahNumber]);

  // Scroll to starting ayah if provided, especially when opening continuous (Library) mode
  useEffect(() => {
    if (loading || ayahs.length === 0) return;

    let targetAyahNum = initialAyahNumber;
    if (!targetAyahNum || targetAyahNum < 1) {
      if (effectivePageMode === "continuous") {
        const pageInfo = getAyahsForPage(currentPage);
        if (pageInfo && pageInfo.surahNumber === surahNumber) {
          targetAyahNum = pageInfo.startAyah;
        } else {
          targetAyahNum = 1;
        }
      } else {
        return;
      }
    }

    let isCancelled = false;

    const performScroll = () => {
      if (isCancelled) return false;
      const el = ayahElementsRef.current[targetAyahNum] ||
                 document.getElementById(`ayah-block-${targetAyahNum}`) ||
                 document.getElementById(`ayah-word-span-${targetAyahNum}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const parentAyah = ayahs.find(a => a.numberInSurah === targetAyahNum);
        if (parentAyah) {
          setSelectedAyah(prev => (prev && prev.numberInSurah === parentAyah.numberInSurah ? prev : parentAyah));
        }
        return true;
      }
      return false;
    };

    // Immediate attempt + progressive retries as continuous DOM cards mount
    if (!performScroll()) {
      const t1 = setTimeout(() => {
        if (!performScroll()) {
          const t2 = setTimeout(() => {
            if (!performScroll()) {
              const t3 = setTimeout(performScroll, 500);
              return () => clearTimeout(t3);
            }
          }, 200);
          return () => clearTimeout(t2);
        }
      }, 60);
      return () => {
        isCancelled = true;
        clearTimeout(t1);
      };
    }

    return () => {
      isCancelled = true;
    };
  }, [loading, initialAyahNumber, effectivePageMode, surahNumber, mushafClickTrigger, ayahs]);

  // Play pending ayah once surah is loaded
  useEffect(() => {
    if (!loading && ayahs.length > 0 && pendingPlayAyahNumberRef.current !== null) {
      const targetAyahNum = pendingPlayAyahNumberRef.current;
      pendingPlayAyahNumberRef.current = null;
      isContinuousTransitioningRef.current = false;
      
      const idx = ayahs.findIndex(a => a.numberInSurah === targetAyahNum);
      if (idx !== -1) {
        setSelectedAyah(null);
        playAyah(idx);
      }
    }
  }, [loading, ayahs]);

  // Auto Scroll Engine for reading pages smoothly
  useEffect(() => {
    const isScrollEnabled = settings.autoScrollActive || false;
    const scrollSpeed = settings.autoScrollSpeed || 3;

    if (!isScrollEnabled || loading) return;

    let lastTime = performance.now();
    let accumulatedScroll = 0;
    let animationId: number;

    const scrollStep = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Speed 1: ~0.005px/ms (5px/sec)
      // Speed 3: ~0.015px/ms (15px/sec)
      // Speed 10: ~0.06px/ms (60px/sec)
      const pixelsPerMs = 0.005 * scrollSpeed;
      accumulatedScroll += pixelsPerMs * delta;

      if (accumulatedScroll >= 1) {
        const scrollAmount = Math.floor(accumulatedScroll);
        window.scrollBy(0, scrollAmount);
        accumulatedScroll -= scrollAmount;
      }

      animationId = requestAnimationFrame(scrollStep);
    };

    animationId = requestAnimationFrame(scrollStep);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [settings.autoScrollActive, settings.autoScrollSpeed, loading]);

  // Track latest settings in ref to eliminate stale closure bugs during reciter switches
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const currentReciter = reciters.find(r => r.id === settings.reciterId) || reciters[0];

  const reciterDropdownOptions = useMemo(() => {
    return reciters.map((r) => ({
      value: r.id,
      label: r.nameAr,
    }));
  }, []);

  const startAyahOptions = useMemo(() => {
    return ayahs.map((a) => ({
      value: a.numberInSurah,
      label: `الآية ${toArabicNumerals(a.numberInSurah)}`,
    }));
  }, [ayahs]);

  const endAyahOptions = useMemo(() => {
    return ayahs.map((a) => ({
      value: a.numberInSurah,
      label: `الآية ${toArabicNumerals(a.numberInSurah)}`,
      disabled: a.numberInSurah < startAyahNum,
    }));
  }, [ayahs, startAyahNum]);

  // Load and play individual or consecutive ayah
  const getAudioSource = (surahNum: number, ayahInSurahNum: number, reciterIdOverride?: string) => {
    const activeReciterId = reciterIdOverride || settingsRef.current?.reciterId || settings.reciterId;
    const surahStr = String(surahNum).padStart(3, "0");
    const ayahStr = String(ayahInSurahNum).padStart(3, "0");
    return `/api/everyayah/${activeReciterId}/${surahStr}${ayahStr}.mp3`;
  };

  // Helper to determine the upcoming ayah playback step
  const getNextPlaybackStep = (
    currentIndex: number,
    currentAyahPlay: number,
    currentRangePlay: number,
    activeReciterId: string
  ): {
    nextIndex: number | null;
    nextAyahPlay: number;
    nextRangePlay: number;
    nextSurahNum: number;
    nextAyahNum: number;
    isSurahSwitch?: boolean;
    url: string;
  } | null => {
    const totalAyahsCount = ayahs.length || currentSurahMeta?.numberOfAyahs || 7;
    const currentAyah = ayahs[currentIndex];
    const currentAyahNum = currentAyah ? currentAyah.numberInSurah : (currentIndex + 1);
    const currentSurahNum = currentAyah ? ((currentAyah as any).surah?.number || surahNumber) : surahNumber;

    // 1. Repeat current single ayah
    if (currentAyahPlay < ayahRepeatMax) {
      return {
        nextIndex: currentIndex,
        nextAyahPlay: currentAyahPlay + 1,
        nextRangePlay: currentRangePlay,
        nextSurahNum: currentSurahNum,
        nextAyahNum: currentAyahNum,
        url: getAudioSource(currentSurahNum, currentAyahNum, activeReciterId),
      };
    }

    // 2. Range mode
    if (recitationMode === "range") {
      const startIndex = Math.max(0, startAyahNum - 1);
      const endIndex = Math.min(totalAyahsCount - 1, endAyahNum - 1);
      if (currentIndex < endIndex) {
        const nextIdx = currentIndex + 1;
        const nextA = ayahs[nextIdx];
        const nextANum = nextA ? nextA.numberInSurah : (nextIdx + 1);
        const nextSNum = nextA ? ((nextA as any).surah?.number || surahNumber) : surahNumber;
        return {
          nextIndex: nextIdx,
          nextAyahPlay: 1,
          nextRangePlay: currentRangePlay,
          nextSurahNum: nextSNum,
          nextAyahNum: nextANum,
          url: getAudioSource(nextSNum, nextANum, activeReciterId),
        };
      } else if (currentRangePlay < rangeRepeatMax) {
        const nextA = ayahs[startIndex];
        const nextANum = nextA ? nextA.numberInSurah : (startIndex + 1);
        const nextSNum = nextA ? ((nextA as any).surah?.number || surahNumber) : surahNumber;
        return {
          nextIndex: startIndex,
          nextAyahPlay: 1,
          nextRangePlay: currentRangePlay + 1,
          nextSurahNum: nextSNum,
          nextAyahNum: nextANum,
          url: getAudioSource(nextSNum, nextANum, activeReciterId),
        };
      }
      return null;
    }

    // 3. Continuous mode
    if (settingsRef.current?.autoAdvance ?? settings.autoAdvance) {
      if (currentIndex + 1 < totalAyahsCount) {
        const nextIdx = currentIndex + 1;
        const nextA = ayahs[nextIdx];
        const nextANum = nextA ? nextA.numberInSurah : (nextIdx + 1);
        const nextSNum = nextA ? ((nextA as any).surah?.number || surahNumber) : surahNumber;
        return {
          nextIndex: nextIdx,
          nextAyahPlay: 1,
          nextRangePlay: 1,
          nextSurahNum: nextSNum,
          nextAyahNum: nextANum,
          url: getAudioSource(nextSNum, nextANum, activeReciterId),
        };
      } else if (surahNumber < 114) {
        return {
          nextIndex: null,
          nextAyahPlay: 1,
          nextRangePlay: 1,
          nextSurahNum: surahNumber + 1,
          nextAyahNum: 1,
          isSurahSwitch: true,
          url: getAudioSource(surahNumber + 1, 1, activeReciterId),
        };
      }
    }

    return null;
  };

  // Refs to track current playback states for engine callbacks
  const currentPlaybackMetaRef = useRef<{
    index: number;
    ayahPlay: number;
    rangePlay: number;
    reciterId: string;
  }>({ index: 0, ayahPlay: 1, rangePlay: 1, reciterId: settings.reciterId });

  // Connect callbacks to quranAudioEngine for zero-gap playback and smooth auto-advance
  useEffect(() => {
    quranAudioEngine.setCallbacks({
      onAyahStart: (idx, ayahNum) => {
        setPlayingIndex(idx);
        setIsPlaying(true);
        currentPlaybackMetaRef.current.index = idx;

        // Smoothly scroll active ayah into center view
        setTimeout(() => {
          const el = ayahElementsRef.current[ayahNum];
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 120);
      },
      onNextAyahNeeded: (currentIdx) => {
        const meta = currentPlaybackMetaRef.current;
        const nextStep = getNextPlaybackStep(
          currentIdx,
          meta.ayahPlay,
          meta.rangePlay,
          meta.reciterId
        );

        if (nextStep) {
          if (!nextStep.isSurahSwitch && nextStep.nextIndex !== null) {
            // Next ayah is within this same surah or range
            meta.ayahPlay = nextStep.nextAyahPlay;
            meta.rangePlay = nextStep.nextRangePlay;
            setCurrentAyahPlayCount(nextStep.nextAyahPlay);
            setCurrentRangePlayCount(nextStep.nextRangePlay);

            const totalAyahsCount = ayahs.length || currentSurahMeta?.numberOfAyahs || 7;
            const isNextLastAyah = (nextStep.nextIndex === totalAyahsCount - 1);

            quranAudioEngine.scheduleNext({
              url: nextStep.url,
              index: nextStep.nextIndex,
              ayahNum: nextStep.nextAyahNum,
              surahNum: nextStep.nextSurahNum,
            }, isNextLastAyah);

            // Also preload the verse after next in background
            const stepAfter = getNextPlaybackStep(
              nextStep.nextIndex,
              nextStep.nextAyahPlay,
              nextStep.nextRangePlay,
              meta.reciterId
            );
            if (stepAfter && stepAfter.nextIndex !== null) {
              const isAfterLast = (stepAfter.nextIndex === totalAyahsCount - 1);
              quranAudioEngine.preloadAyah(stepAfter.url, isAfterLast);
            } else if (stepAfter && stepAfter.url) {
              quranAudioEngine.preloadAyah(stepAfter.url, false);
            }
          } else if (nextStep.isSurahSwitch) {
            // It is the last ayah of the surah!
            // CRITICAL: DO NOT switch surah while the last ayah is still reciting!
            // Instead, pre-warm the next surah's first ayah in background cache.
            if (nextStep.url) {
              quranAudioEngine.preloadAyah(nextStep.url, false);
            }
          }
        }
      },
      onPlaybackComplete: () => {
        // This fires ONLY when the current ayah has finished 100% and there is no next ayah queued.
        // E.g., when the LAST ayah of the surah finishes completely!
        const meta = currentPlaybackMetaRef.current;
        const nextStep = getNextPlaybackStep(
          meta.index,
          meta.ayahPlay,
          meta.rangePlay,
          meta.reciterId
        );

        if (nextStep && nextStep.isSurahSwitch && onChangeSurah) {
          // Last ayah of surah has completely finished! Now switch cleanly to next surah:
          isContinuousTransitioningRef.current = true;
          pendingPlayAyahNumberRef.current = 1;
          onChangeSurah(nextStep.nextSurahNum, 1);
        } else {
          setIsPlaying(false);
          setPlayingIndex(null);
          setSelectedAyah(null);
        }
      },
      onStateChange: (playing) => {
        setIsPlaying(playing);
      },
      onError: (err) => {
        console.warn("Recitation engine error:", err);
      },
    });

    return () => {
      // Do not prematurely stop recitation on component re-renders
    };
  }, [ayahs, startAyahNum, endAyahNum, ayahRepeatMax, rangeRepeatMax, recitationMode, surahNumber, onChangeSurah]);

  const playAyah = (
    indexInArray: number, 
    currentAyahPlay: number = 1, 
    currentRangePlay: number = 1, 
    reciterIdOverride?: string
  ) => {
    const activeReciterId = reciterIdOverride || settingsRef.current?.reciterId || settings.reciterId;
    const totalAyahsCount = ayahs.length || currentSurahMeta?.numberOfAyahs || 7;
    if (indexInArray < 0 || indexInArray >= totalAyahsCount) {
      setIsPlaying(false);
      setPlayingIndex(null);
      quranAudioEngine.stop();
      return;
    }

    // Clamp bounds if using range mode
    if (recitationMode === "range") {
      const startIdx = Math.max(0, startAyahNum - 1);
      const endIdx = Math.min(totalAyahsCount - 1, endAyahNum - 1);
      if (indexInArray < startIdx || indexInArray > endIdx) {
        setIsPlaying(false);
        setPlayingIndex(null);
        quranAudioEngine.stop();
        return;
      }
    }

    setCurrentAyahPlayCount(currentAyahPlay);
    setCurrentRangePlayCount(currentRangePlay);
    currentPlaybackMetaRef.current = {
      index: indexInArray,
      ayahPlay: currentAyahPlay,
      rangePlay: currentRangePlay,
      reciterId: activeReciterId,
    };

    const targetAyah = ayahs[indexInArray];
    const targetAyahNum = targetAyah ? targetAyah.numberInSurah : (indexInArray + 1);
    const targetSurahNum = targetAyah ? ((targetAyah as any).surah?.number || surahNumber) : surahNumber;
    
    setPlayingIndex(indexInArray);
    setIsPlaying(true);

    const url = getAudioSource(targetSurahNum, targetAyahNum, activeReciterId);

    // Stop fallback audio if any
    if (audioRef.current) {
      try {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current.pause();
      } catch (_) {}
      audioRef.current = null;
    }

    const nextStep = getNextPlaybackStep(indexInArray, currentAyahPlay, currentRangePlay, activeReciterId);
    const nextInfo = (nextStep && nextStep.nextIndex !== null) ? {
      url: nextStep.url,
      index: nextStep.nextIndex,
      ayahNum: nextStep.nextAyahNum,
      surahNum: nextStep.nextSurahNum,
    } : null;

    const isLastAyahOfSurah = (indexInArray === totalAyahsCount - 1);

    // Use Web Audio API engine for zero-gap and continuous wasl playback
    if (quranAudioEngine.isSupported()) {
      quranAudioEngine.playAyah(url, indexInArray, targetAyahNum, targetSurahNum, nextInfo, isLastAyahOfSurah);

      // Preload next+1 in background
      if (nextStep && nextStep.nextIndex !== null) {
        const stepAfter = getNextPlaybackStep(nextStep.nextIndex, nextStep.nextAyahPlay, nextStep.nextRangePlay, activeReciterId);
        if (stepAfter) {
          const isAfterLast = (stepAfter.nextIndex === totalAyahsCount - 1);
          quranAudioEngine.preloadAyah(stepAfter.url, isAfterLast);
        }
      } else if (nextStep && nextStep.url) {
        // Preload next surah's first ayah
        quranAudioEngine.preloadAyah(nextStep.url, false);
      }
    } else {
      // Fallback for environments where Web Audio is disabled
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        if (nextStep && nextStep.nextIndex !== null) {
          playAyah(nextStep.nextIndex, nextStep.nextAyahPlay, nextStep.nextRangePlay, activeReciterId);
        } else {
          setIsPlaying(false);
          setPlayingIndex(null);
        }
      };
      audio.play().catch(e => console.warn(e));
    }

    // Scroll to the active ayah
    setTimeout(() => {
      const el = ayahElementsRef.current[targetAyahNum];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  };

  const handleTogglePlay = (reciterIdOverride?: string | React.MouseEvent) => {
    const reciterStr = typeof reciterIdOverride === "string" ? reciterIdOverride : undefined;
    const activeReciterId = reciterStr || settingsRef.current?.reciterId || settings.reciterId;
    if (isPlaying) {
      quranAudioEngine.pause();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      setShowReciterPanel(false);

      if (quranAudioEngine.getIsPaused() && currentPlaybackMetaRef.current.reciterId === activeReciterId) {
        const meta = currentPlaybackMetaRef.current;
        const nextStep = getNextPlaybackStep(meta.index, meta.ayahPlay, meta.rangePlay, activeReciterId);
        const nextInfo = (nextStep && nextStep.nextIndex !== null) ? {
          url: nextStep.url,
          index: nextStep.nextIndex,
          ayahNum: nextStep.nextAyahNum,
          surahNum: nextStep.nextSurahNum,
        } : null;

        quranAudioEngine.resume(nextInfo);
        setIsPlaying(true);
        return;
      }

      // Start of playback or resume
      let resumeIndex = playingIndex !== null ? playingIndex : 0;
      const totalAyahsCount = ayahs.length || currentSurahMeta?.numberOfAyahs || 7;

      if (recitationMode === "range") {
        const startIdx = Math.max(0, startAyahNum - 1);
        const endIdx = Math.min(totalAyahsCount - 1, endAyahNum - 1);
        if (playingIndex !== null && playingIndex >= startIdx && playingIndex <= endIdx) {
          resumeIndex = playingIndex;
        } else {
          resumeIndex = startIdx;
        }
      } else {
        if (selectedAyah) {
          const foundIdx = ayahs.findIndex(a => a.numberInSurah === selectedAyah.numberInSurah);
          if (foundIdx !== -1) {
            resumeIndex = foundIdx;
          } else if (selectedAyah.numberInSurah) {
            resumeIndex = selectedAyah.numberInSurah - 1;
          }
        } else if (initialAyahNumber && initialAyahNumber <= totalAyahsCount) {
          resumeIndex = Math.max(0, initialAyahNumber - 1);
        }
      }
      
      playAyah(resumeIndex, currentAyahPlayCount, currentRangePlayCount, activeReciterId);
    }
  };

  const handlePrevAyah = () => {
    const currentIndex = playingIndex !== null ? playingIndex : 0;
    quranAudioEngine.stop();
    if (recitationMode === "range") {
      const minIdx = Math.max(0, startAyahNum - 1);
      if (currentIndex > minIdx) {
        playAyah(currentIndex - 1, 1, currentRangePlayCount);
      }
    } else {
      if (currentIndex > 0) {
        playAyah(currentIndex - 1, 1, 1);
      } else if (surahNumber > 1 && onChangeSurah) {
        const prevMeta = surahsList.find(s => s.number === surahNumber - 1);
        if (prevMeta) {
          isContinuousTransitioningRef.current = true;
          pendingPlayAyahNumberRef.current = prevMeta.numberOfAyahs;
          onChangeSurah(surahNumber - 1, prevMeta.numberOfAyahs);
        }
      }
    }
  };

  const handleNextAyah = () => {
    const currentIndex = playingIndex !== null ? playingIndex : 0;
    const totalAyahsCount = ayahs.length || currentSurahMeta?.numberOfAyahs || 7;
    quranAudioEngine.stop();
    if (recitationMode === "range") {
      const maxIdx = Math.min(totalAyahsCount - 1, endAyahNum - 1);
      if (currentIndex < maxIdx) {
        playAyah(currentIndex + 1, 1, currentRangePlayCount);
      }
    } else {
      if (currentIndex < totalAyahsCount - 1) {
        playAyah(currentIndex + 1, 1, 1);
      } else if (surahNumber < 114 && onChangeSurah) {
        isContinuousTransitioningRef.current = true;
        pendingPlayAyahNumberRef.current = 1;
        onChangeSurah(surahNumber + 1, 1);
      }
    }
  };

  const handleStopRecitation = () => {
    quranAudioEngine.stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSelectedAyah(null);
    setIsPlaying(false);
    setPlayingIndex(null);
    setIsPageAyahPlaying(false);
    setPlayingPageAyahNumber(null);
    setCurrentAyahPlayCount(1);
    setCurrentRangePlayCount(1);
    setShowReciterPanel(false);
  };

  const prevReciterRef = useRef(settings.reciterId);
  useEffect(() => {
    if (prevReciterRef.current !== settings.reciterId) {
      const newReciter = settings.reciterId;
      prevReciterRef.current = newReciter;
      quranAudioEngine.stop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (isPlaying && playingIndex !== null) {
        playAyah(playingIndex, currentAyahPlayCount, currentRangePlayCount, newReciter);
      }
    }
  }, [settings.reciterId, isPlaying, playingIndex, currentAyahPlayCount, currentRangePlayCount]);

  useEffect(() => {
    if (settings.autoScrollActive) {
      handleStopRecitation();
    }
  }, [settings.autoScrollActive]);

  const syncStateRef = useRef<any>({});
  useEffect(() => {
    if (!onSyncPlaybackStates) return;
    const prev = syncStateRef.current;
    if (
      prev &&
      prev.isPlaying === isPlaying &&
      prev.playingIndex === playingIndex &&
      prev.recitationMode === recitationMode &&
      prev.startAyahNum === startAyahNum &&
      prev.endAyahNum === endAyahNum &&
      prev.ayahRepeatMax === ayahRepeatMax &&
      prev.rangeRepeatMax === rangeRepeatMax &&
      prev.currentAyahPlayCount === currentAyahPlayCount &&
      prev.currentRangePlayCount === currentRangePlayCount &&
      prev.currentSurahNumber === surahNumber &&
      prev.reciterId === settings.reciterId
    ) {
      return;
    }
    const nextState = {
      isPlaying,
      playingIndex,
      recitationMode,
      startAyahNum,
      endAyahNum,
      ayahRepeatMax,
      rangeRepeatMax,
      currentAyahPlayCount,
      currentRangePlayCount,
      handleTogglePlay,
      handleNextAyah,
      handlePrevAyah,
      handleStopRecitation,
      setRecitationMode,
      setStartAyahNum,
      setEndAyahNum,
      setAyahRepeatMax,
      setRangeRepeatMax,
      currentSurahNumber: surahNumber,
      reciterId: settings.reciterId,
    };
    syncStateRef.current = nextState;
    onSyncPlaybackStates(nextState);
  }, [
    isPlaying,
    playingIndex,
    recitationMode,
    startAyahNum,
    endAyahNum,
    ayahRepeatMax,
    rangeRepeatMax,
    currentAyahPlayCount,
    currentRangePlayCount,
    surahNumber,
    settings.reciterId,
    onSyncPlaybackStates
  ]);

  // Perform clean AI Tafsir fetching from Express backend
  const fetchAITafsir = async (ayah: Ayah, mode: TafsirMode) => {
    setTafsirLoading(true);
    setTafsirError(null);
    setTafsirResponse("");

    const sNum = (ayah as any).surah?.number || surahNumber;
    const aNum = ayah.numberInSurah;
    const sName = (ayah as any).surah?.name || currentSurahMeta?.name;
    const cacheKey = `${sNum}:${aNum}:${mode}`;

    // Handle Mutashabihat directly from local offline book "دليل المتشابهات اللفظية في القرآن الكريم"
    if (
      mode === "mutashabihat" ||
      (mode as string) === "book_mutashabihat_saghir"
    ) {
      const localMut = getOfflineMutashabihat(sNum, aNum, sName, ayah.text, mode as string);
      if (localMut) {
        setTafsirResponse(localMut);
        setTafsirLoading(false);
        return;
      }
    }

    // Handle Tadabbur directly from local offline multi-book engine
    if (isTadabburMode(mode as string)) {
      const localTdabr = getOfflineTdabr(sNum, aNum, sName, ayah.text, mode as string, true);
      if (localTdabr) {
        setTafsirResponse(localTdabr);
        setTafsirLoading(false);
        return;
      }
    }

    // Handle English Translation & Quran Content API translations
    if (
      mode === "english" ||
      (mode as string) === "translation" ||
      (mode as string) === "en" ||
      (mode as string).startsWith("english_") ||
      (mode as string).startsWith("translation_") ||
      (mode as string).startsWith("french_") ||
      (mode as string).startsWith("spanish_") ||
      (mode as string).startsWith("german_") ||
      (mode as string).startsWith("urdu_") ||
      (mode as string).startsWith("turkish_") ||
      (mode as string).startsWith("indonesian_") ||
      (mode as string).startsWith("russian_")
    ) {
      try {
        const trans = await getAyahTranslationText(sNum, aNum, mode as string);
        if (trans && trans.text) {
          let combined = trans.text;
          if (trans.footnotes && trans.footnotes.trim()) {
            combined += `\n\n📌 **Footnotes / الحواشي:**\n${trans.footnotes.trim()}`;
          }
          setTafsirResponse(combined);
          setTafsirLoading(false);
          saveToLibraryCache(cacheKey, combined).catch(() => {});
          return;
        }
      } catch (err) {
        console.warn("Translation API error in fetchAITafsir:", err);
      }
      const localEnglish = getOfflineEnglishTranslation(sNum, aNum);
      if (localEnglish) {
        setTafsirResponse(localEnglish);
        setTafsirLoading(false);
        return;
      }
    }

    // Handle Tafsir Muyassar directly from local offline dataset (100% offline)
    if (mode === "tafsir_muyassar") {
      const localTafsir = getOfflineMuyassarTafsir(sNum, aNum) || generateOfflineMuyassar(sNum, aNum, sName, ayah.text) || getOfflineMukhtasarTafsir(sNum, aNum) || getOfflineAysarTafsir(sNum, aNum) || getOfflineMukhtasarTafsirFallback(sNum, aNum, sName, ayah.text);
      if (localTafsir) {
        setTafsirResponse(localTafsir);
        setTafsirLoading(false);
        saveToLibraryCache(cacheKey, localTafsir).catch(() => {});
        return;
      }
    }

    // Handle Tafsir Saadi directly from local offline dataset (100% offline)
    if (mode === "tafsir_sadi") {
      const localTafsir = getOfflineSaadiTafsir(sNum, aNum) || generateOfflineSaadi(sNum, aNum, sName, ayah.text);
      if (localTafsir && !isCorruptAyahOnlyText(localTafsir, ayah.text)) {
        setTafsirResponse(localTafsir);
        setTafsirLoading(false);
        saveToLibraryCache(cacheKey, localTafsir).catch(() => {});
        return;
      }
    }

    // Handle Sarf/Eerab/Balagha directly from local offline book (الجدول في إعراب القرآن وصرفه)
    if (
      mode === "sarf" || 
      (mode as string) === "eerab" || 
      (mode as string) === "irab" || 
      (mode as string) === "balagha" || 
      (mode as string) === "book_sarf" || 
      (mode as string) === "book_balagha" || 
      (mode as string) === "book_irab" || 
      (mode as string) === "book_jadwal_safi"
    ) {
      const localSarf = getOfflineSarf(sNum, aNum, sName, ayah.text, mode as string, false);
      if (localSarf) {
        setTafsirResponse(localSarf);
        setTafsirLoading(false);
        return;
      }
    }

    // Handle Gharib directly from local offline book "al_siraj_gharib.txt"
    if (mode === "suraj_garib_quran" || (mode as string) === "gharib" || (mode as string) === "siraj_garib_quran") {
      const localGharib = getOfflineGharib(sNum, aNum, sName, ayah.text);
      if (localGharib) {
        setTafsirResponse(localGharib);
        setTafsirLoading(false);
        return;
      }
    }

    // Handle Mukhtasar directly from local offline dataset
    if (mode === "tafsir_mukhtasar" || (mode as string) === "tafsir-mukhtasar") {
      const localMukhtasar = getOfflineMukhtasarTafsir(sNum, aNum) || getOfflineMukhtasarTafsirFallback(sNum, aNum, sName, ayah.text);
      if (localMukhtasar) {
        setTafsirResponse(localMukhtasar);
        setTafsirLoading(false);
        return;
      }
    }

    // Handle Aysar Al-Tafasir directly from local offline dataset
    if (mode === "tafsir_aysar" || (mode as string) === "tafsir-aysar") {
      const localAysar = getOfflineAysarTafsir(sNum, aNum);
      if (localAysar) {
        setTafsirResponse(localAysar);
        setTafsirLoading(false);
        return;
      }
    }

    // Handle Asbab directly from local offline book "al_muharar_asbab.txt" (المحرر في أسباب النزول)
    if (mode === "asbab_nuzool" || (mode as string) === "asbab" || (mode as string) === "muharrar_asbab" || (mode as string) === "asbab_nuzul_wahidi") {
      const localAsbab = getOfflineAsbab(sNum, aNum, sName, ayah.text);
      if (localAsbab) {
        setTafsirResponse(localAsbab);
        setTafsirLoading(false);
        return;
      }
    }

    // Handle Ahkam directly from local offline book "أحكام القرآن للجصاص" وابن العربي
    if ((mode as string) === "ahkam_quran_jassas" || (mode as string) === "ahkam" || (mode as string) === "ahkam_jassas") {
      const localAhkam = getOfflineAhkamJassas(sNum, aNum, sName, ayah.text);
      if (localAhkam) {
        setTafsirResponse(localAhkam);
        setTafsirLoading(false);
        saveToLibraryCache(cacheKey, localAhkam).catch(() => {});
        return;
      }
    }
    if ((mode as string) === "ahkam_quran_arabi" || (mode as string) === "ahkam_arabi") {
      const localAhkam = getOfflineAhkamJassas(sNum, aNum, sName, ayah.text);
      if (localAhkam) {
        const arabiAhkam = localAhkam.replace("للإمام أبي بكر الرازي الجصاص", "للإمام القاضي ابن العربي المالكي");
        setTafsirResponse(arabiAhkam);
        setTafsirLoading(false);
        saveToLibraryCache(cacheKey, arabiAhkam).catch(() => {});
        return;
      }
    }

    // 1. Direct check in IndexedDB offline storage
    try {
      const dbCached = (await getFromLibraryCache(cacheKey)) || (await getFromLibraryCache(`${sNum}:${aNum}:tafsir_${mode}`));
      if (dbCached && !isCorruptAyahOnlyText(dbCached, ayah.text)) {
        setTafsirResponse(dbCached);
        setTafsirLoading(false);
        return;
      } else if (dbCached && isCorruptAyahOnlyText(dbCached, ayah.text)) {
        deleteFromLibraryCache(cacheKey).catch(() => {});
        deleteFromLibraryCache(`${sNum}:${aNum}:tafsir_${mode}`).catch(() => {});
      }
    } catch (_) {}

    // 2. Direct offline engine fallback if offline
    const isDeviceOffline = typeof navigator !== "undefined" && !navigator.onLine;
    if (isDeviceOffline) {
      let offlineResult: string | null = null;
      if (mode === "tafsir_muyassar") {
        offlineResult = generateOfflineMuyassar(sNum, aNum, sName, ayah.text);
      } else if (mode === "tafsir_sadi") {
        offlineResult = generateOfflineSaadi(sNum, aNum, sName, ayah.text);
      } else if (mode === "tafsir_kathir" || (mode as string) === "tafsir_ibnkathir") {
        offlineResult = generateOfflineIbnKathir(sNum, aNum, sName, ayah.text);
      } else if (mode === "tafsir_tabari") {
        offlineResult = generateOfflineTabari(sNum, aNum, sName, ayah.text);
      } else if (mode === "tafsir_qurtubi") {
        offlineResult = generateOfflineQurtubi(sNum, aNum, sName, ayah.text);
      } else if (mode === "tafsir_waseet" || (mode as string) === "tafsir_waseet_tantawi") {
        offlineResult = generateOfflineWaseet(sNum, aNum, sName, ayah.text);
      } else if (mode === "tafsir_mukhtasar" || (mode as string) === "tafsir-mukhtasar") {
        offlineResult = getOfflineMukhtasarTafsir(sNum, aNum) || getOfflineMukhtasarTafsirFallback(sNum, aNum, sName, ayah.text);
      } else if (mode === "tafsir_aysar" || (mode as string) === "tafsir-aysar") {
        offlineResult = getOfflineAysarTafsir(sNum, aNum) || getOfflineAysarTafsirFallback(sNum, aNum, sName, ayah.text);
      } else if (
        mode === "mutashabihat" ||
        (mode as string) === "book_mutashabihat_saghir"
      ) {
        offlineResult = getOfflineMutashabihat(sNum, aNum, sName, ayah.text, mode as string);
      } else if (mode === "sarf" || (mode as string) === "eerab" || (mode as string) === "balagha") {
        offlineResult = getOfflineSarf(sNum, aNum, sName, ayah.text, mode, false);
      } else if (mode === "asbab_nuzool" || (mode as string) === "asbab") {
        offlineResult = getOfflineAsbab(sNum, aNum, sName, ayah.text);
      } else if (mode === "suraj_garib_quran" || (mode as string) === "gharib" || (mode as string) === "siraj_garib_quran") {
        offlineResult = getOfflineGharib(sNum, aNum, sName, ayah.text);
      } else if (isTadabburMode(mode as string)) {
        offlineResult = getOfflineTdabr(sNum, aNum, sName, ayah.text, mode as string, true);
      } else if (mode === "english" || (mode as string).startsWith("translation")) {
        offlineResult = getOfflineEnglishTranslation(sNum, aNum) || generateOfflineTranslation(sNum, aNum, mode as string);
      }

      if (!offlineResult) {
        offlineResult = getOfflineLibraryContentSync(sNum, aNum, mode as string, sName, ayah.text) ||
                        (await getOfflineLibraryContent(sNum, aNum, mode as string, sName, ayah.text));
      }

      if (offlineResult) {
        setTafsirResponse(offlineResult);
        setTafsirError(null);
        setTafsirLoading(false);
        saveToLibraryCache(cacheKey, offlineResult).catch(() => {});
        return;
      }
    }

    try {
      const currentBook = DEFAULT_BOOKS.find(b => b.id === mode || b.apiType === mode);
      const apiUrl = typeof window !== "undefined" && window.location?.origin && window.location.origin !== "null"
        ? `${window.location.origin}/api/tafsir`
        : "/api/tafsir";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surahName: (ayah as any).surah?.name || currentSurahMeta?.name,
          surahNumber: sNum,
          ayahNumber: aNum,
          ayahText: ayah.text,
          type: mode,
          bookTitle: currentBook?.title,
          bookAuthor: currentBook?.author,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        let errMsg = "خطأ من خادم التفسير الفوري.";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (e) {
          try {
            const rawText = await response.text();
            if (rawText && rawText.length < 200) errMsg = rawText;
          } catch (e2) {}
        }
        throw new Error(errMsg);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("فشل في تحليل الاستجابة من خادم التفسير.");
      }
      if (data && data.result && !isCorruptAyahOnlyText(data.result, ayah.text)) {
        setTafsirResponse(data.result);
        saveToLibraryCache(cacheKey, data.result).catch(() => {});
        return;
      }
      throw new Error("لم تتضمّن الاستجابة نص التفسير.");
    } catch (err: any) {
      console.warn("AI Tafsir endpoint failed, attempting client-side fallback:", err);

      // Dedicated handling for Tafsir Al-Tabari (Quran.com ID: 15)
      if (mode === "tafsir_tabari") {
        try {
          const qTabariRes = await fetch(`https://api.quran.com/api/v4/tafsirs/15/by_ayah/${sNum}:${aNum}`, {
            signal: AbortSignal.timeout(4000),
          });
          if (qTabariRes.ok) {
            const qData = await qTabariRes.json();
            const raw = qData?.tafsir?.text || qData?.tafsirs?.[0]?.text;
            if (raw) {
              const clean = raw.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
              if (clean.length > 20 && !isCorruptAyahOnlyText(clean, ayah.text)) {
                setTafsirResponse(clean);
                setTafsirError(null);
                saveToLibraryCache(cacheKey, clean).catch(() => {});
                return;
              }
            }
          }
        } catch (e) {}

        const tabariOffline = generateOfflineTabari(sNum, aNum, sName, ayah.text) || (await getOfflineLibraryContent(sNum, aNum, "tafsir_tabari", sName, ayah.text));
        if (tabariOffline) {
          setTafsirResponse(tabariOffline);
          setTafsirError(null);
          saveToLibraryCache(cacheKey, tabariOffline).catch(() => {});
          return;
        }
      }

      // Dedicated handling for Tafsir Al-Baghawi (Quran.com ID: 94)
      if (mode === "tafsir_baghawi") {
        try {
          const qBaghawiRes = await fetch(`https://api.quran.com/api/v4/tafsirs/94/by_ayah/${sNum}:${aNum}`, {
            signal: AbortSignal.timeout(4000),
          });
          if (qBaghawiRes.ok) {
            const qData = await qBaghawiRes.json();
            const raw = qData?.tafsir?.text || qData?.tafsirs?.[0]?.text;
            if (raw) {
              const clean = raw.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
              if (clean.length > 20 && !isCorruptAyahOnlyText(clean, ayah.text)) {
                setTafsirResponse(clean);
                setTafsirError(null);
                saveToLibraryCache(cacheKey, clean).catch(() => {});
                return;
              }
            }
          }
        } catch (e) {}

        const baghawiOffline = generateOfflineBaghawi(sNum, aNum, sName, ayah.text) || (await getOfflineLibraryContent(sNum, aNum, "tafsir_baghawi", sName, ayah.text));
        if (baghawiOffline) {
          setTafsirResponse(baghawiOffline);
          setTafsirError(null);
          saveToLibraryCache(cacheKey, baghawiOffline).catch(() => {});
          return;
        }
      }

      // Dedicated handling for Tafsir Al-Suyuti (Quran-Tafseer ID: 2 / ar.jalalayn)
      if (mode === "tafsir_suyuti") {
        try {
          const qSuyutiRes = await fetch(`http://api.quran-tafseer.com/tafseer/2/${sNum}/${aNum}`, {
            signal: AbortSignal.timeout(4000),
          });
          if (qSuyutiRes.ok) {
            const qData = await qSuyutiRes.json();
            if (qData?.text) {
              const clean = qData.text.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
              if (clean && !isCorruptAyahOnlyText(clean, ayah.text)) {
                setTafsirResponse(clean);
                setTafsirError(null);
                saveToLibraryCache(cacheKey, clean).catch(() => {});
                return;
              }
            }
          }
        } catch (e) {}
      }

      if (mode === "tafsir_waseet" || mode === "tafsir_waseet_tantawi") {
        try {
          const qtsRes = await fetch(`https://api.quran.com/api/v4/tafsirs/93/by_ayah/${sNum}:${aNum}`, {
            signal: AbortSignal.timeout(4000),
          });
          if (qtsRes.ok) {
            const qtsData = await qtsRes.json();
            const raw = qtsData?.tafsir?.text || qtsData?.tafsirs?.[0]?.text;
            if (raw) {
              const clean = raw.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
              if (clean) {
                setTafsirResponse(clean);
                setTafsirError(null);
                saveToLibraryCache(cacheKey, clean).catch(() => {});
                return;
              }
            }
          }
        } catch (e) {}
      }

      // Client-side fallback to authentic AlQuran Cloud editions (excluding ayah-only editions)
      const staticEditionMap: Record<string, string> = {
        tafsir_muyassar: "ar.muyassar",
        tafsir_sadi: "ar.saadi",
        tafsir_kathir: "ar.ibnkathir",
        tafsir_ibnkathir: "ar.ibnkathir",
        tafsir_qurtubi: "ar.qurtubi",
        tafsir_suyuti: "ar.jalalayn",
        tafsir_waseet: "ar.waseet",
        tafsir_waseet_tantawi: "ar.waseet",
      };

      if (staticEditionMap[mode]) {
        const ed = staticEditionMap[mode];
        try {
          const fallbackRes = await fetch(`https://api.alquran.cloud/v1/ayah/${sNum}:${aNum}/${ed}`, {
            signal: AbortSignal.timeout(4000),
          });
          if (fallbackRes.ok) {
            const fbData = await fallbackRes.json();
            if (fbData?.data?.text) {
              const text = fbData.data.text.trim();
              const pureAyah = ayah.text.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED\s]/g, "");
              const pureText = text.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED\s]/g, "");
              // Guard: Only accept if it is actual tafsir, not just repeating the verse
              if (text.length > 10 && pureText !== pureAyah) {
                setTafsirResponse(text);
                setTafsirError(null);
                saveToLibraryCache(cacheKey, text).catch(() => {});
                return;
              }
            }
          }
        } catch (fbErr) {
          // Fallback fetch failed
        }
      }

      if (mode === "tafsir_sadi") {
        const fallbackSaadi = generateOfflineSaadi(sNum, aNum, sName, ayah.text) || (await getOfflineLibraryContent(sNum, aNum, "tafsir_sadi", sName, ayah.text));
        if (fallbackSaadi) {
          setTafsirResponse(fallbackSaadi);
          setTafsirError(null);
          saveToLibraryCache(cacheKey, fallbackSaadi).catch(() => {});
          return;
        }
      }

      if (mode === "tafsir_kathir" || (mode as string) === "tafsir_ibnkathir") {
        const fallbackIbnKathir = generateOfflineIbnKathir(sNum, aNum, sName, ayah.text) || (await getOfflineLibraryContent(sNum, aNum, "tafsir_kathir", sName, ayah.text));
        if (fallbackIbnKathir) {
          setTafsirResponse(fallbackIbnKathir);
          setTafsirError(null);
          saveToLibraryCache(cacheKey, fallbackIbnKathir).catch(() => {});
          return;
        }
      }

      if (mode === "tafsir_qurtubi") {
        const fallbackQurtubi = generateOfflineQurtubi(sNum, aNum, sName, ayah.text) || (await getOfflineLibraryContent(sNum, aNum, "tafsir_qurtubi", sName, ayah.text));
        if (fallbackQurtubi) {
          setTafsirResponse(fallbackQurtubi);
          setTafsirError(null);
          saveToLibraryCache(cacheKey, fallbackQurtubi).catch(() => {});
          return;
        }
      }

      if (mode === "tafsir_waseet" || (mode as string) === "tafsir_waseet_tantawi") {
        const fallbackWaseet = generateOfflineWaseet(sNum, aNum, sName, ayah.text) || (await getOfflineLibraryContent(sNum, aNum, "tafsir_waseet", sName, ayah.text));
        if (fallbackWaseet) {
          setTafsirResponse(fallbackWaseet);
          setTafsirError(null);
          saveToLibraryCache(cacheKey, fallbackWaseet).catch(() => {});
          return;
        }
      }

      if (mode === "tafsir_aysar" || (mode as string) === "tafsir-aysar") {
        const fallbackAysar = getOfflineAysarTafsir(sNum, aNum) || getOfflineAysarTafsirFallback(sNum, aNum, sName, ayah.text);
        if (fallbackAysar) {
          setTafsirResponse(fallbackAysar);
          setTafsirError(null);
          return;
        }
      }

      if (mode === "tafsir_mukhtasar" || (mode as string) === "tafsir-mukhtasar") {
        const fallbackMukhtasar = getOfflineMukhtasarTafsir(sNum, aNum) || getOfflineMukhtasarTafsirFallback(sNum, aNum, sName, ayah.text);
        if (fallbackMukhtasar) {
          setTafsirResponse(fallbackMukhtasar);
          setTafsirError(null);
          return;
        }
      }

      if (
        mode === "mutashabihat" ||
        (mode as string) === "book_mutashabihat_saghir"
      ) {
        const fallbackLocal = getOfflineMutashabihat(sNum, aNum, sName, ayah.text, mode as string);
        if (fallbackLocal) {
          setTafsirResponse(fallbackLocal);
          setTafsirError(null);
          return;
        }
      }

      if (mode === "sarf" || (mode as string) === "eerab" || (mode as string) === "balagha") {
        const fallbackSarf = getOfflineSarf(sNum, aNum, sName, ayah.text, mode, false);
        if (fallbackSarf) {
          setTafsirResponse(fallbackSarf);
          setTafsirError(null);
          return;
        }
      }

      if (mode === "asbab_nuzool" || (mode as string) === "asbab") {
        const fallbackAsbab = getOfflineAsbab(sNum, aNum, sName, ayah.text);
        if (fallbackAsbab) {
          setTafsirResponse(fallbackAsbab);
          setTafsirError(null);
          return;
        }
      }

      if (mode === "suraj_garib_quran" || (mode as string) === "gharib" || (mode as string) === "siraj_garib_quran") {
        const fallbackGharib = getOfflineGharib(sNum, aNum, sName, ayah.text);
        if (fallbackGharib) {
          setTafsirResponse(fallbackGharib);
          setTafsirError(null);
          return;
        }
      }

      if (isTadabburMode(mode as string)) {
        const fallbackTdabr = getOfflineTdabr(sNum, aNum, sName, ayah.text, mode as string, true);
        if (fallbackTdabr) {
          setTafsirResponse(fallbackTdabr);
          setTafsirError(null);
          return;
        }
      }

      // Universal offline library engine fallback for any mode or book (100% guaranteed offline)
      const offlineUniversal = (mode === "tafsir_muyassar" ? generateOfflineMuyassar(sNum, aNum, sName, ayah.text) : null) ||
                               (mode === "english" || (mode as string).startsWith("translation") ? (getOfflineEnglishTranslation(sNum, aNum) || generateOfflineTranslation(sNum, aNum, mode as string)) : null) ||
                               getOfflineLibraryContentSync(sNum, aNum, mode as string, sName, ayah.text) ||
                               (await getOfflineLibraryContent(sNum, aNum, mode as string, sName, ayah.text));
      if (offlineUniversal) {
        setTafsirResponse(offlineUniversal);
        setTafsirError(null);
        saveToLibraryCache(cacheKey, offlineUniversal).catch(() => {});
        return;
      }

      const rawMsg = String(err?.message || err || "");
      const isNetworkErr = rawMsg.toLowerCase().includes("failed to fetch") || rawMsg.toLowerCase().includes("load failed") || rawMsg.toLowerCase().includes("networkerror");
      const userFriendlyMsg = isNetworkErr 
        ? "عذراً، تعذّر الاتصال بخادم التفسير الفوري حالياً. يرجى التثبت من شبكة الإتصال أو اختيار أحد التفاسير المعتمدة." 
        : (err.message || "عذراً، تعذّر تحميل نص التفسير المعتمد حالياً. يرجى إعادة المحاولة أو اختيار تفسير آخر.");
      
      setTafsirError(userFriendlyMsg);
    } finally {
      setTafsirLoading(false);
    }
  };

  // Whenever user switches mode while an ayah is active, load his requested Tafsir type
  useEffect(() => {
    if (selectedAyah) {
      fetchAITafsir(selectedAyah, tafsirMode);
    }
  }, [selectedAyah, tafsirMode]);

  // Clean and graceful destructors
  useEffect(() => {
    return () => {
      quranAudioEngine.stop();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleCopyAyah = (ayah: Ayah, idx: number) => {
    const textToCopy = `${ayah.text} [سورة ${currentSurahMeta?.name || surahNumber} : ${ayah.numberInSurah}]`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const hasSpecificBookmarkJson = (ayahNum?: number) => {
    return bookmarks.some(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNum);
  };

  const getAyahBookmarkColorClass = (ayahNum?: number, defaultClass = "") => {
    const b = bookmarks.find(bm => bm.surahNumber === surahNumber && bm.ayahNumber === ayahNum);
    if (!b) return defaultClass;
    switch (b.category) {
      case "reading":
        return "text-red-500 fill-red-500/10 border-red-500/30";
      case "memorization":
        return "text-sky-400 fill-sky-400/10 border-sky-400/30";
      case "revision":
        return "text-emerald-400 fill-emerald-400/10 border-emerald-400/30";
      case "contemplation":
        return "text-purple-500 fill-purple-500/10 border-purple-500/30";
      default:
        return "text-red-500 fill-red-500/10 border-red-500/30";
    }
  };

  // Define sizing lookups for easy accessibility scaling
  const fontSizes = {
    sm: "text-2xl md:text-3xl",
    md: "text-3xl md:text-4xl",
    lg: "text-4xl md:text-5xl",
    xl: "text-5xl md:text-6xl",
    "2xl": "text-6xl md:text-7xl",
    "3xl": "text-7xl md:text-8xl"
  };

  const activeAyah = ayahs.length > 0
    ? (playingIndex !== null
        ? ayahs[playingIndex]
        : selectedAyah)
    : null;
  const isActiveAyahBookmarked = activeAyah ? hasSpecificBookmarkJson(activeAyah.numberInSurah) : false;

  const lastSyncedAyahNumberRef = useRef<number | null>(null);

  // Automatically synchronize Medina Mushaf Page when the active Ayah or playing Ayah changes
  useEffect(() => {
    if (activeAyah && activeAyah.page) {
      if (activeAyah.number !== lastSyncedAyahNumberRef.current) {
        lastSyncedAyahNumberRef.current = activeAyah.number;
        if (activeAyah.page !== currentPage) {
          setCurrentPage(activeAyah.page);
        }
      }
    }
  }, [activeAyah, currentPage]);

  // Close Tafsir overlay when page changes manually to a page different from selectedAyah
  useEffect(() => {
    if (selectedAyah) {
      if (selectedAyah.page && selectedAyah.page !== currentPage) {
        setSelectedAyah(null);
      }
    }
  }, [currentPage]);

  // Dynamic bottom padding class to minimize the gap between the Qur'an content and the bottom menu/player bars
  const isPlayerActive = isRecitationActive || (settings.autoScrollActive && scrollCapsuleVisible);
  
  const paddingBottomClass = showBars
    ? isPlayerActive
      ? "pb-12 sm:pb-16"
      : "pb-2 sm:pb-4"
    : isPlayerActive
      ? "pb-8 sm:pb-10"
      : "pb-1 sm:pb-2";

  const paddingTopClass = (effectivePageMode === "mushaf-svg" || effectivePageMode === "qcf4" || settings.mushafProvider === "qcf4") ? "pt-2 sm:pt-3" : "pt-2 sm:pt-4";

  return (
    <div 
      id="reading-screen-root" 
      onClick={(e) => {
        if (hasSwipedRef.current || dragDistanceRef.current > 8) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const target = e.target as HTMLElement;
        if (target && (target.closest("button") || target.closest("input") || target.closest("select") || target.closest("textarea") || target.closest(".custom-dropdown-root") || target.closest("#reading-header") || target.closest("#floating-audio-mace") || target.closest("#floating-recitation-bar") || target.closest("#floating-bottom-menu") || target.closest("[data-no-toggle='true']"))) {
          return;
        }
        toggleBarsUnified(undefined, e);
      }}
      className={`w-full mx-auto transition-all duration-300 ${
        (effectivePageMode === "mushaf-svg" || effectivePageMode === "qcf4" || settings.mushafProvider === "qcf4" || effectivePageMode === "continuous")
          ? "max-w-none px-0 sm:px-2 md:px-4"
          : "max-w-4xl px-1.5 sm:px-4"
      } ${paddingTopClass} ${paddingBottomClass}`}
    >
      {/* Global Landscape Orientations Styles for All Reading Views */}
      <style>{`
        @media (orientation: landscape) {
          #reading-screen-root {
            max-width: none !important;
            padding-left: 0px !important;
            padding-right: 0px !important;
            padding-top: 4px !important;
            padding-bottom: ${
              showBars 
                ? isPlayerActive ? "120px" : "64px" 
                : isPlayerActive ? "64px" : "4px"
            } !important;
          }

          /* Written Page-by-Page View landscape styling */
          #mushaf-page-by-page-container {
            width: 95vw !important;
            max-width: 1200px !important;
            margin: 0 auto !important;
            gap: 8px !important;
          }
          #mushaf-page-by-page-canvas {
            position: relative !important;
            width: 95vw !important;
            height: calc(100vh - ${showBars ? "170px" : "70px"}) !important;
            max-width: 1200px !important;
            max-height: 800px !important;
            overflow-y: auto !important;
            padding: 20px 24px !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, ${isDark ? "0.55" : "0.3"}) !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            background-color: ${
              theme === "gold-velvet" ? "#fcf8f2" :
              theme === "navy-velvet" ? "#FFFFFF" :
              isDark ? "#0f172a" : "#FFFFFF"
            } !important;
            border: 1px solid ${
              theme === "gold-velvet" ? "rgba(197, 168, 92, 0.4)" :
              theme === "navy-velvet" ? "#e2e8f0" :
              isDark ? "#1e293b" : "rgba(16, 185, 129, 0.15)"
            } !important;
          }

          /* Written Continuous View landscape styling */
          #mushaf-continuous-canvas {
            position: relative !important;
            width: 100% !important;
            min-height: calc(100vh - ${showBars ? "170px" : "70px"}) !important;
            max-width: none !important;
            max-height: none !important;
            overflow-y: auto !important;
            padding: 16px 20px !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, ${isDark ? "0.55" : "0.3"}) !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            background-color: ${
              theme === "gold-velvet" ? "#fcf8f2" :
              theme === "navy-velvet" ? "#FFFFFF" :
              isDark ? "#0f172a" : "#ffffff"
            } !important;
            border: 1px solid ${
              theme === "gold-velvet" ? "rgba(197, 168, 92, 0.4)" :
              theme === "navy-velvet" ? "#e2e8f0" :
              isDark ? "#1e293b" : "rgba(16, 185, 129, 0.15)"
            } !important;
          }

          /* Traditional Verses Card List View landscape styling */
          #verses-flex-container {
            position: relative !important;
            width: 95vw !important;
            height: calc(100vh - ${showBars ? "170px" : "70px"}) !important;
            max-width: 1200px !important;
            max-height: 800px !important;
            overflow-y: auto !important;
            padding: 16px 20px !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            border-radius: 12px !important;
            background-color: ${isDark ? "transparent" : "rgba(255, 255, 255, 0.1)"} !important;
          }

          /* Elegant custom scrollbars matching active theme colors in landscape orientation */
          #mushaf-page-by-page-canvas::-webkit-scrollbar,
          #mushaf-continuous-canvas::-webkit-scrollbar,
          #verses-flex-container::-webkit-scrollbar {
            width: 6px;
          }
          #mushaf-page-by-page-canvas::-webkit-scrollbar-track,
          #mushaf-continuous-canvas::-webkit-scrollbar-track,
          #verses-flex-container::-webkit-scrollbar-track {
            background: transparent;
          }
          #mushaf-page-by-page-canvas::-webkit-scrollbar-thumb,
          #mushaf-continuous-canvas::-webkit-scrollbar-thumb,
          #verses-flex-container::-webkit-scrollbar-thumb {
            background: ${theme === "gold-velvet" ? "rgba(197, 168, 92, 0.25)" : theme === "navy-velvet" ? "rgba(63, 99, 198, 0.25)" : "rgba(16, 185, 129, 0.25)"} !important;
            border-radius: 10px;
          }
          #mushaf-page-by-page-canvas::-webkit-scrollbar-thumb:hover,
          #mushaf-continuous-canvas::-webkit-scrollbar-thumb:hover,
          #verses-flex-container::-webkit-scrollbar-thumb:hover {
            background: ${theme === "gold-velvet" ? "rgba(197, 168, 92, 0.45)" : theme === "navy-velvet" ? "rgba(63, 99, 198, 0.45)" : "rgba(16, 185, 129, 0.45)"} !important;
          }
        }
      `}</style>

      {/* Top Header Controls with back button and global bookmark */}
      <div 
        id="reading-header" 
        data-top-header="true"
        onClick={(e) => e.stopPropagation()}
        className={`fixed top-0 left-0 right-0 w-full h-14 z-[350] shadow-md select-none transition-all duration-300 transform ${
          showBars || serviceDrawerTab !== null ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        } ${
          theme === "emerald-velvet"
            ? "bg-[#011a12] border-b border-[#c5a85c]/30 text-[#FAF8F5]"
            : theme === "gold-velvet"
              ? "bg-[#FAF8F5] border-b border-[#c5a85c]/30 text-[#011c14]"
              : theme === "navy-velvet"
                ? "bg-[#1b3168] border-b border-[#3F63C6]/30 text-white"
                : isDark
                  ? "bg-slate-900 border-b border-slate-800 text-slate-100"
                  : "bg-gradient-to-l from-emerald-900 to-emerald-800 text-white"
        }`}
      >
        <div className="w-full max-w-4xl mx-auto px-5 h-full flex items-center justify-between flex-row relative">
          {/* Right side: Back button matching main header branding */}
          <div className="flex items-center gap-2">
            {/* الفهرس Back Button */}
            <button
              id="btn-back-to-index"
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                setSelectedAyah(null);
                if (serviceDrawerTab === "index") {
                  setServiceDrawerTab(null);
                } else {
                  handleOpenIndexDrawer("surahs");
                }
              }}
              className={`p-2 py-1 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                serviceDrawerTab === "index"
                  ? theme === "emerald-velvet"
                    ? "bg-[#c5a85c] text-[#011c14] shadow-xs font-black"
                    : theme === "navy-velvet"
                      ? "bg-[#3F63C6] text-white shadow-sm font-black"
                      : theme === "gold-velvet"
                        ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black"
                        : isDark
                          ? "bg-emerald-600 text-white shadow-sm font-black"
                          : "bg-emerald-700 text-white shadow-sm font-black"
                  : theme === "emerald-velvet"
                    ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/25 text-[#c5a85c]"
                    : theme === "navy-velvet"
                      ? "bg-[#3F63C6]/15 hover:bg-[#3F63C6]/30 text-white"
                      : theme === "gold-velvet"
                        ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/25 text-[#c5a85c]"
                        : isDark
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                          : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title={serviceDrawerTab === "index" ? "العودة إلى المصحف" : "فهرس القرآن الكريم"}
            >
              <BookOpen size={16} className={theme === "navy-velvet" ? "text-white" : theme === "gold-velvet" || theme === "emerald-velvet" ? (serviceDrawerTab === "index" ? "text-[#011c14]" : "text-[#c5a85c]") : "text-inherit"} />
              <span>الفهرس</span>
            </button>
          </div>

          {/* Center space */}
          <div className="flex-1" />

          {/* Left side: Controls (My Files, Search, Settings) */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* My Files / ملفاتي button */}
            <div>
              <button
                id="my-files-trigger-btn"
                onClick={() => setServiceDrawerTab(serviceDrawerTab === "files" ? null : "files")}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  serviceDrawerTab === "files"
                    ? theme === "emerald-velvet"
                      ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black"
                      : theme === "navy-velvet"
                        ? "bg-[#3F63C6] text-white shadow-sm font-black"
                        : theme === "gold-velvet"
                          ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black"
                          : isDark
                            ? "bg-emerald-600 text-white shadow-sm font-black"
                            : "bg-emerald-700 text-white shadow-sm font-black"
                    : theme === "emerald-velvet"
                      ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/25 text-[#c5a85c]"
                      : theme === "navy-velvet"
                        ? "bg-[#3F63C6]/15 hover:bg-[#3F63C6]/30 text-white"
                        : theme === "gold-velvet"
                          ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/25 text-[#c5a85c]"
                          : isDark
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                            : "bg-white/10 hover:bg-white/20 text-white"
                }`}
                title="ملفاتي (الفواصل والملاحظات والتقارير)"
              >
                <FolderHeart size={18} className={theme === "navy-velvet" ? "text-white" : theme === "gold-velvet" || theme === "emerald-velvet" ? (serviceDrawerTab === "files" ? "text-[#011c14]" : "text-[#c5a85c]") : "text-inherit"} />
              </button>
            </div>

            {/* Search Quran words icon button */}
            <div>
              <button
                id="quick-ayah-bookmark"
                onClick={() => setServiceDrawerTab(serviceDrawerTab === "search" ? null : "search")}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  serviceDrawerTab === "search"
                    ? theme === "emerald-velvet"
                      ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black"
                      : theme === "navy-velvet"
                        ? "bg-[#3F63C6] text-white shadow-sm font-black"
                        : theme === "gold-velvet"
                          ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black"
                          : isDark
                            ? "bg-emerald-600 text-white shadow-sm font-black"
                            : "bg-emerald-700 text-white shadow-sm font-black"
                    : theme === "emerald-velvet"
                      ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/25 text-[#c5a85c]"
                      : theme === "navy-velvet"
                        ? "bg-[#3F63C6]/15 hover:bg-[#3F63C6]/30 text-white"
                        : theme === "gold-velvet"
                          ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/25 text-[#c5a85c]"
                          : isDark
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                            : "bg-white/10 hover:bg-white/20 text-white"
                }`}
                title="البحث عن الكلمات في كلمات المصحف"
              >
                <Search size={18} className={theme === "navy-velvet" ? "text-white" : theme === "gold-velvet" || theme === "emerald-velvet" ? (serviceDrawerTab === "search" ? "text-[#011c14]" : "text-[#c5a85c]") : "text-inherit"} />
              </button>
            </div>

            {/* Settings Trigger */}
            <button
              id="reading-settings-trigger"
              onClick={() => {
                setServiceDrawerTab(serviceDrawerTab === "settings" ? null : "settings");
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                serviceDrawerTab === "settings"
                  ? theme === "emerald-velvet"
                    ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black"
                    : theme === "navy-velvet"
                      ? "bg-[#3F63C6] text-white shadow-sm font-black"
                      : theme === "gold-velvet"
                        ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black"
                        : isDark
                          ? "bg-emerald-600 text-white shadow-sm font-black"
                          : "bg-emerald-700 text-white shadow-sm font-black"
                  : theme === "emerald-velvet"
                    ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/25 text-[#c5a85c]"
                    : theme === "navy-velvet"
                      ? "bg-[#3F63C6]/15 hover:bg-[#3F63C6]/30 text-white"
                      : theme === "gold-velvet"
                        ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/25 text-[#c5a85c]"
                        : isDark
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                          : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title="إعدادات القراءة والمصحف"
            >
              <Settings size={18} className={theme === "navy-velvet" ? "text-white" : theme === "gold-velvet" || theme === "emerald-velvet" ? (serviceDrawerTab === "settings" ? "text-[#011c14]" : "text-[#c5a85c]") : "text-inherit"} />
            </button>
          </div>
        </div>
      </div>

      {/* Unified Services Drawer (Index, My Files, Search, Settings) */}
      {createPortal(
        <AnimatePresence>
          {serviceDrawerTab !== null && (
            <motion.div 
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0 }}
              className={`fixed inset-0 z-[300] flex items-center justify-center p-0 sm:p-4 cursor-default bg-black/60 ${
                serviceDrawerTab === "index" ? "pt-14" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setServiceDrawerTab(null);
              }}
            >
              <motion.div
                id="unified-service-drawer"
                dir="rtl"
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full overflow-hidden shadow-2xl flex flex-col ${
                  isDrawerFullScreen
                    ? `fixed inset-0 ${serviceDrawerTab === "index" ? "top-14 h-[calc(100%-3.5rem)]" : "h-full"} max-w-full rounded-none border-0 z-[310] pb-16 sm:pb-20`
                    : `max-w-5xl h-[84vh] md:h-[85vh] rounded-[24px] border mb-12 sm:mb-14 ${serviceDrawerTab === "index" ? "mt-14" : ""}`
                } ${
                theme === "emerald-velvet"
                  ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]"
                  : theme === "navy-velvet"
                    ? "bg-white border-[#3F63C6]/30 text-slate-900"
                    : theme === "gold-velvet"
                      ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-slate-900"
                      : isDark
                        ? "bg-slate-950 border-slate-800 text-slate-100"
                        : "bg-white border-slate-200/80 text-slate-900"
              }`}
            >
              {/* Top Drag Handle Bar & Navigation Tabs */}
              <div className={`px-3 sm:px-4 py-2.5 sm:py-3 border-b flex flex-col gap-2.5 shrink-0 ${
                theme === "emerald-velvet"
                  ? "border-[#c5a85c]/25 bg-[#012519]"
                  : theme === "navy-velvet"
                    ? "border-[#3F63C6]/25 bg-slate-50 text-slate-900"
                    : theme === "gold-velvet"
                      ? "border-[#c5a85c]/20 bg-[#FAF5E6]"
                      : isDark
                        ? "border-slate-800 bg-slate-900"
                        : "border-slate-200 bg-white"
              }`}>
                {/* Upper Level: Main Services Navigation Tabs + Close Button (hidden when opening index page) */}
                {serviceDrawerTab !== "index" && (
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className={`grid grid-cols-4 p-1 rounded-2xl h-11 sm:h-12 items-center flex-1 w-full ${
                      theme === "emerald-velvet"
                        ? "bg-[#011a12] border border-[#c5a85c]/30 text-[#FAF8F5]"
                        : theme === "navy-velvet"
                          ? "bg-[#3F63C6]/10 border border-[#3F63C6]/20 text-slate-800 dark:text-white"
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c]/10 border border-[#c5a85c]/25 text-slate-800 dark:text-amber-100"
                            : isDark
                              ? "bg-slate-900 border border-slate-800 text-slate-100"
                              : "bg-slate-100/70 border border-slate-200/80 text-slate-800"
                    }`}>
                      <button
                        onClick={() => {
                          setServiceDrawerTab("index");
                        }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold h-9 sm:h-10 transition-all cursor-pointer w-full ${
                          theme === "emerald-velvet" ? "text-[#c5a85c]/70 hover:text-[#FAF8F5]" : theme === "navy-velvet" ? "text-[#3F63C6]/80 dark:text-slate-300 hover:text-[#2563EB]" : theme === "gold-velvet" ? "text-[#8c6b23] dark:text-amber-300/80 hover:text-[#011c14]" : isDark ? "text-slate-400 hover:text-slate-100" : "text-emerald-800/70 hover:text-emerald-950"
                        }`}
                      >
                        <BookOpen size={15} />
                        <span>الفهرس</span>
                      </button>

                      <button
                        onClick={() => setServiceDrawerTab("files")}
                        className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold h-9 sm:h-10 transition-all cursor-pointer w-full ${
                          serviceDrawerTab === "files"
                            ? (theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-xs font-black" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-sm font-black" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black" : isDark ? "bg-emerald-600 text-white shadow-sm font-black" : "bg-emerald-700 text-white shadow-sm font-black")
                            : (theme === "emerald-velvet" ? "text-[#c5a85c]/70 hover:text-[#FAF8F5]" : theme === "navy-velvet" ? "text-[#3F63C6]/80 dark:text-slate-300 hover:text-[#2563EB]" : theme === "gold-velvet" ? "text-[#8c6b23] dark:text-amber-300/80 hover:text-[#011c14]" : isDark ? "text-slate-400 hover:text-slate-100" : "text-emerald-800/70 hover:text-emerald-950")
                        }`}
                      >
                        <FolderHeart size={15} />
                        <span>ملفاتي</span>
                      </button>

                      <button
                        onClick={() => setServiceDrawerTab("search")}
                        className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold h-9 sm:h-10 transition-all cursor-pointer w-full ${
                          serviceDrawerTab === "search"
                            ? (theme === "emerald-velvet" ? "bg-[#34d399] text-[#011c14] shadow-xs font-black" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-sm font-black" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black" : isDark ? "bg-emerald-600 text-white shadow-sm font-black" : "bg-emerald-700 text-white shadow-sm font-black")
                            : (theme === "emerald-velvet" ? "text-[#34d399]/80 hover:text-[#FAF8F5]" : theme === "navy-velvet" ? "text-[#3F63C6]/80 dark:text-slate-300 hover:text-[#2563EB]" : theme === "gold-velvet" ? "text-[#8c6b23] dark:text-amber-300/80 hover:text-[#011c14]" : isDark ? "text-slate-400 hover:text-slate-100" : "text-emerald-800/70 hover:text-emerald-950")
                        }`}
                      >
                        <Search size={15} />
                        <span>البحث</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onActiveTabChange) {
                            setServiceDrawerTab(null);
                            onActiveTabChange("settings");
                          } else {
                            setServiceDrawerTab("settings");
                          }
                        }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold h-9 sm:h-10 transition-all cursor-pointer w-full ${
                          serviceDrawerTab === "settings" || activeTab === "settings"
                            ? (theme === "emerald-velvet" ? "bg-[#34d399] text-[#011c14] shadow-xs font-black" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-sm font-black" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black" : isDark ? "bg-emerald-600 text-white shadow-sm font-black" : "bg-emerald-700 text-white shadow-sm font-black")
                            : (theme === "emerald-velvet" ? "text-[#34d399]/80 hover:text-[#FAF8F5]" : theme === "navy-velvet" ? "text-[#3F63C6]/80 dark:text-slate-300 hover:text-[#2563EB]" : theme === "gold-velvet" ? "text-[#8c6b23] dark:text-amber-300/80 hover:text-[#011c14]" : isDark ? "text-slate-400 hover:text-slate-100" : "text-emerald-800/70 hover:text-emerald-950")
                        }`}
                      >
                        <Settings size={15} />
                        <span>الإعدادات</span>
                      </button>
                    </div>

                    {/* Right Action Buttons: Close */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setServiceDrawerTab(null)}
                        className="p-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 rounded-xl transition cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center"
                        title="إغلاق"
                      >
                        <X size={16} className="text-red-500 dark:text-red-400 font-bold" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-Header for Index: [السور] [الأرباع] [اذهب] */}
                {serviceDrawerTab === "index" && (
                  <div className={`grid grid-cols-3 p-1 rounded-xl h-10 items-center w-full shadow-inner ${
                    theme === "emerald-velvet"
                      ? "bg-[#01160e] border border-[#c5a85c]/25 text-[#FAF8F5]"
                      : theme === "navy-velvet"
                        ? "bg-[#EFF6FF] border border-[#3F63C6]/20 text-slate-800"
                        : theme === "gold-velvet"
                          ? "bg-[#FAF5E6] border border-[#c5a85c]/25 text-slate-800"
                          : isDark
                            ? "bg-slate-950 border border-slate-800 text-slate-100"
                            : "bg-slate-200/60 border border-slate-300/70 text-slate-800"
                  }`}>
                    <button
                      onClick={() => setIndexSubTab("surahs")}
                      className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs sm:text-sm font-bold h-8 transition-all cursor-pointer w-full ${
                        indexSubTab === "surahs"
                          ? (theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-xs font-black" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-sm font-black" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black" : isDark ? "bg-emerald-600 text-white shadow-sm font-black" : "bg-emerald-700 text-white shadow-sm font-black")
                          : (theme === "emerald-velvet" ? "text-[#c5a85c]/70 hover:text-[#FAF8F5]" : theme === "navy-velvet" ? "text-[#3F63C6]/80 hover:text-[#2563EB]" : theme === "gold-velvet" ? "text-[#8c6b23] hover:text-[#011c14]" : isDark ? "text-slate-400 hover:text-slate-100" : "text-emerald-800/70 hover:text-emerald-950")
                      }`}
                    >
                      <span>السور</span>
                    </button>

                    <button
                      onClick={() => setIndexSubTab("quarters")}
                      className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs sm:text-sm font-bold h-8 transition-all cursor-pointer w-full ${
                        indexSubTab === "quarters"
                          ? (theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-xs font-black" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-sm font-black" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black" : isDark ? "bg-emerald-600 text-white shadow-sm font-black" : "bg-emerald-700 text-white shadow-sm font-black")
                          : (theme === "emerald-velvet" ? "text-[#c5a85c]/70 hover:text-[#FAF8F5]" : theme === "navy-velvet" ? "text-[#3F63C6]/80 hover:text-[#2563EB]" : theme === "gold-velvet" ? "text-[#8c6b23] hover:text-[#011c14]" : isDark ? "text-slate-400 hover:text-slate-100" : "text-emerald-800/70 hover:text-emerald-950")
                      }`}
                    >
                      <span>الأرباع</span>
                    </button>

                    <button
                      onClick={() => setIndexSubTab("go")}
                      className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs sm:text-sm font-bold h-8 transition-all cursor-pointer w-full ${
                        indexSubTab === "go"
                          ? (theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-xs font-black" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-sm font-black" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black" : isDark ? "bg-emerald-600 text-white shadow-sm font-black" : "bg-emerald-700 text-white shadow-sm font-black")
                          : (theme === "emerald-velvet" ? "text-[#c5a85c]/70 hover:text-[#FAF8F5]" : theme === "navy-velvet" ? "text-[#3F63C6]/80 hover:text-[#2563EB]" : theme === "gold-velvet" ? "text-[#8c6b23] hover:text-[#011c14]" : isDark ? "text-slate-400 hover:text-slate-100" : "text-emerald-800/70 hover:text-emerald-950")
                      }`}
                    >
                      <span>اذهب</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Drawer Content Area according to active tab */}
              <div className={`flex-1 overflow-y-auto custom-scrollbar ${
                theme === "emerald-velvet"
                  ? "bg-[#011a12]"
                  : theme === "navy-velvet"
                    ? "bg-white"
                    : theme === "gold-velvet"
                      ? "bg-[#FFFDF5]"
                      : isDark
                        ? "bg-slate-950"
                        : "bg-white"
              }`}>
                {serviceDrawerTab === "index" && (
                  <div className={`p-2 sm:p-4 h-full ${
                    theme === "emerald-velvet"
                      ? "bg-[#011a12]"
                      : theme === "navy-velvet"
                        ? "bg-white"
                        : theme === "gold-velvet"
                          ? "bg-[#FFFDF5]"
                          : isDark
                            ? "bg-slate-950"
                            : "bg-white"
                  }`}>
                    <IndexScreen
                      onSelectSurah={(surahNum, startAyah, pageNum) => {
                        let targetPage = pageNum;
                        if (!targetPage && surahNum) {
                          if (startAyah) {
                            const q = quartersList.find(q => q.surahNumber === surahNum && q.ayahNumber === startAyah);
                            if (q && q.page) targetPage = q.page;
                            else targetPage = getSurahStartPage(surahNum);
                          } else {
                            targetPage = getSurahStartPage(surahNum);
                          }
                        }
                        if (!targetPage) targetPage = 1;

                        setCurrentPage(targetPage);
                        setPageAyahs([]);

                        if (startAyah) {
                          const parentAyah = ayahs.find(a => a.numberInSurah === startAyah);
                          if (parentAyah) setSelectedAyah(parentAyah);
                          else setSelectedAyah({ number: 0, numberInSurah: startAyah, text: "", translationEn: "" });
                        } else {
                          setSelectedAyah(null);
                        }

                        if (onChangeSurah) {
                          onChangeSurah(surahNum, startAyah, targetPage);
                        }
                        setServiceDrawerTab(null);
                      }}
                      bookmarks={bookmarks}
                      isDark={isDark}
                      theme={theme || "light"}
                      language={settings.language || "ar"}
                      initialTab={indexSubTab}
                      onTabChange={(tab) => setIndexSubTab(tab)}
                      hideInternalHeader={true}
                    />
                  </div>
                )}
                {serviceDrawerTab === "search" && (
                  <QuranWordSearchModal
                    isOpen={true}
                    onClose={() => setServiceDrawerTab(null)}
                    onSelectVerse={(surahNum, surahName, ayahNum, pageNum, ayahText) => {
                      handleSelectVerseFromSearch(surahNum, surahName, ayahNum, pageNum, ayahText);
                      setServiceDrawerTab(null);
                    }}
                    isDark={isDark}
                    theme={theme || "light"}
                    inDrawer={true}
                  />
                )}

                {serviceDrawerTab === "settings" && (
                  <div className="p-4 sm:p-6 space-y-4">
                    <SettingsScreen
                      settings={settings}
                      onChangeSettings={onChangeSettings}
                      isDark={isDark}
                      onToggleDarkMode={onToggleDarkMode}
                      theme={theme}
                      onChangeTheme={onChangeTheme}
                      inDrawer={true}
                    />
                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800">
                      <button
                        onClick={() => setServiceDrawerTab(null)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md text-center text-white ${
                          theme === "navy-velvet"
                            ? "bg-[#3F63C6] hover:bg-[#3F63C6]/90"
                            : theme === "gold-velvet" || theme === "emerald-velvet"
                              ? "bg-[#c5a85c] text-[#011c14] hover:bg-[#c5a85c]/95"
                              : isDark
                                ? "bg-emerald-600 hover:bg-emerald-500"
                                : "bg-emerald-800 hover:bg-emerald-900"
                        }`}
                      >
                        حفظ وتطبيق الخيارات
                      </button>
                    </div>
                  </div>
                )}

                {serviceDrawerTab === "files" && (() => {
                  const themePrimaryBg = theme === "navy-velvet"
                    ? "bg-[#3F63C6] hover:bg-[#3452a8] text-white"
                    : theme === "gold-velvet" || theme === "emerald-velvet"
                      ? "bg-[#c5a85c] hover:bg-[#b3954a] text-[#011c14]"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600";

                  const themePrimaryText = theme === "navy-velvet"
                    ? "text-[#3F63C6]"
                    : theme === "gold-velvet"
                      ? "text-[#8c6b23]"
                      : theme === "emerald-velvet"
                        ? "text-[#c5a85c]"
                        : "text-emerald-600 dark:text-emerald-400";

                  const themePrimaryBorderHover = theme === "navy-velvet"
                    ? "hover:border-[#3F63C6]"
                    : theme === "gold-velvet" || theme === "emerald-velvet"
                      ? "hover:border-[#c5a85c]"
                      : "hover:border-emerald-600";

                  const themeCardBg = theme === "navy-velvet"
                    ? "bg-[#F8FAFC] border-2 border-[#3F63C6]/25 text-slate-900"
                    : theme === "gold-velvet"
                      ? "bg-[#FFFDF5] border-2 border-[#c5a85c]/35 text-[#011c14]"
                      : theme === "emerald-velvet"
                        ? "bg-[#012519] border-2 border-[#c5a85c]/35 text-[#FAF8F5]"
                        : isDark
                          ? "bg-slate-900 border-2 border-slate-800 text-slate-100"
                          : "bg-white border-2 border-emerald-200/80 text-slate-900";

                  const themeReportCardBg = theme === "navy-velvet"
                    ? "bg-[#EFF6FF] border-2 border-[#3F63C6]/25 text-slate-900"
                    : theme === "gold-velvet"
                      ? "bg-[#FAF5E6] border-2 border-[#c5a85c]/35 text-[#011c14]"
                      : theme === "emerald-velvet"
                        ? "bg-[#012519] border-2 border-[#c5a85c]/35 text-[#FAF8F5]"
                        : isDark
                          ? "bg-slate-900 border-2 border-slate-800 text-slate-100"
                          : "bg-white border-2 border-slate-200/80 text-slate-900";

                  const themePrimaryFormBorderBg = theme === "navy-velvet"
                    ? "border-2 border-[#3F63C6]/25 bg-[#F8FAFC]"
                    : theme === "gold-velvet"
                      ? "border-2 border-[#c5a85c]/35 bg-[#FAF5E6]"
                      : theme === "emerald-velvet"
                        ? "border-2 border-[#c5a85c]/35 bg-[#012519]"
                        : "border-2 border-emerald-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-slate-900";

                  return (
                  <div className="p-4 sm:p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
                    {/* My Files Sub Tabs Header */}
                    <div id="my-files-sub-tabs" className={`grid grid-cols-3 p-1 mb-4 rounded-2xl h-12 items-center shrink-0 w-full ${
                      theme === "emerald-velvet"
                        ? "bg-[#011a12] border border-[#c5a85c]/30 text-[#FAF8F5]"
                        : theme === "navy-velvet"
                          ? "bg-[#3F63C6]/10 border border-[#3F63C6]/20 text-slate-800 dark:text-white"
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c]/10 border border-[#c5a85c]/25 text-slate-800 dark:text-amber-100"
                            : isDark
                              ? "bg-slate-900 border border-slate-800 text-slate-100"
                              : "bg-emerald-100/70 border border-emerald-200/80 text-slate-800"
                    }`}>
                      {[
                        { id: "bookmarks", label: "فواصل", icon: BookmarkIcon },
                        { id: "notes", label: "ملاحظاتي", icon: FileText },
                        { id: "reports", label: "تقارير", icon: Activity },
                      ].map(t => {
                        const IconComp = t.icon;
                        const active = myFilesActiveTab === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setMyFilesActiveTab(t.id as any)}
                            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-bold h-10 transition-all cursor-pointer w-full ${
                              active
                                ? (theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-xs font-black" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-sm font-black" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black" : isDark ? "bg-emerald-600 text-white shadow-sm font-black" : "bg-emerald-700 text-white shadow-sm font-black")
                                : (theme === "emerald-velvet" ? "text-[#c5a85c]/70 hover:text-[#FAF8F5]" : theme === "navy-velvet" ? "text-[#3F63C6]/80 dark:text-slate-300 hover:text-[#2563EB]" : theme === "gold-velvet" ? "text-[#8c6b23] dark:text-amber-300/80 hover:text-[#011c14]" : isDark ? "text-slate-400 hover:text-slate-100" : "text-emerald-800/70 hover:text-emerald-950")
                            }`}
                          >
                            <IconComp size={15} />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Sub Tab 1: Bookmarks / فواصل */}
                    {myFilesActiveTab === "bookmarks" && (
                      <div className="space-y-4">
                        {/* Top Action Bar */}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => setShowAddBookmarkForm(prev => !prev)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all ${themePrimaryBg}`}
                          >
                            <Plus size={15} />
                            <span>إضافة فاصلة يدوياً</span>
                          </button>

                          {bookmarkCategory !== "all" && (
                            <button
                              onClick={() => setBookmarkCategory("all")}
                              className={`px-2.5 py-1.5 rounded-lg text-xxs font-bold transition cursor-pointer ${
                                theme === "emerald-velvet"
                                  ? "bg-[#012519] text-[#FAF8F5] border border-[#c5a85c]/30 hover:bg-[#012c1e]"
                                  : theme === "gold-velvet"
                                    ? "bg-[#FAF5E6] text-[#011c14] border border-[#c5a85c]/30 hover:bg-[#f5eedc]"
                                    : theme === "navy-velvet"
                                      ? "bg-[#EFF6FF] text-[#3F63C6] border border-[#3F63C6]/25 hover:bg-[#DBEAFE]"
                                      : isDark
                                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                        : "bg-emerald-100/80 text-emerald-900 hover:bg-emerald-200"
                              }`}
                            >
                              عرض الكل
                            </button>
                          )}
                        </div>

                        {/* Category Filter Pills */}
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                          {[
                            { id: "reading", label: "قراءة", activeClass: "bg-red-500 text-white border-red-500 shadow-sm" },
                            { id: "memorization", label: "حفظ", activeClass: "bg-sky-500 text-white border-sky-500 shadow-sm" },
                            { id: "revision", label: "مراجعة", activeClass: "bg-emerald-500 text-white border-emerald-500 shadow-sm" },
                            { id: "contemplation", label: "تدبر", activeClass: "bg-purple-600 text-white border-purple-600 shadow-sm" },
                          ].map(cat => {
                            const isCatActive = bookmarkCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                onClick={() => setBookmarkCategory(cat.id as any)}
                                className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold border-2 transition-all text-center cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                                  isCatActive
                                    ? cat.activeClass
                                    : theme === "emerald-velvet"
                                      ? "border-[#c5a85c]/30 bg-[#011a12] text-[#FAF8F5]/80 hover:border-[#c5a85c]"
                                      : theme === "gold-velvet"
                                        ? "border-[#c5a85c]/30 bg-[#FAF5E6] text-[#011c14] hover:border-[#c5a85c]"
                                        : theme === "navy-velvet"
                                          ? "border-[#3F63C6]/25 bg-[#F8FAFC] text-slate-800 hover:border-[#3F63C6]"
                                          : isDark
                                            ? "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700"
                                            : "border-emerald-200/80 bg-white text-slate-800 hover:border-emerald-600"
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  cat.id === "reading" ? "bg-red-500" :
                                  cat.id === "memorization" ? "bg-sky-500" :
                                  cat.id === "revision" ? "bg-emerald-500" : "bg-purple-500"
                                }`} />
                                <span>{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Manual Add Bookmark Form */}
                        {showAddBookmarkForm && (
                          <div className={`p-4 rounded-2xl space-y-3 relative ${themePrimaryFormBorderBg}`}>
                            <h4 className={`text-xs font-black flex items-center gap-1.5 ${themePrimaryText}`}>
                              <Plus size={14} />
                              إضافة فاصلة جديدة
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Surah Picker with Dropdown Popup */}
                              <div className="relative">
                                <label className={`block text-[10px] font-bold mb-1 ${theme === "emerald-velvet" ? "text-[#FAF8F5]/70" : theme === "gold-velvet" ? "text-[#8c6b23]" : "text-slate-600 dark:text-slate-400"}`}>السورة</label>
                                <button
                                  type="button"
                                  onClick={() => setSurahSelectDropdownOpen(prev => !prev)}
                                  className={`w-full px-3 py-2 rounded-xl text-xs border-2 font-bold flex items-center justify-between text-right cursor-pointer shadow-2xs ${
                                    theme === "emerald-velvet"
                                      ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]"
                                      : theme === "gold-velvet"
                                        ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14]"
                                        : theme === "navy-velvet"
                                          ? "bg-white border-[#3F63C6]/25 text-slate-900"
                                          : isDark
                                            ? "bg-slate-950 border-slate-800 text-slate-100"
                                            : "bg-white border-emerald-200 text-slate-900"
                                  }`}
                                >
                                  <span>{surahsList.find(s => s.number === bookmarkFormSurah)?.name || `سورة ${bookmarkFormSurah}`}</span>
                                  <ChevronRight size={14} className="rotate-90 text-slate-400" />
                                </button>

                                {/* Surah Selection Popup Menu */}
                                {surahSelectDropdownOpen && (
                                  <div className={`absolute top-full right-0 left-0 mt-1 z-50 p-2 rounded-2xl border-2 shadow-2xl space-y-2 max-h-60 overflow-y-auto custom-scrollbar ${
                                    theme === "emerald-velvet"
                                      ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]"
                                      : theme === "gold-velvet"
                                        ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14]"
                                        : theme === "navy-velvet"
                                          ? "bg-white border-[#3F63C6]/25 text-slate-900"
                                          : isDark
                                            ? "bg-slate-900 border-slate-800 text-slate-100"
                                            : "bg-white border-emerald-200 text-slate-900"
                                  }`}>
                                    <input
                                      type="text"
                                      placeholder="ابحث عن سورة..."
                                      value={surahSelectSearchQuery}
                                      onChange={(e) => setSurahSelectSearchQuery(e.target.value)}
                                      className={`w-full p-2 text-xs rounded-xl border-2 focus:outline-none ${
                                        theme === "emerald-velvet"
                                          ? "bg-[#012519] border-[#c5a85c]/35 text-[#FAF8F5]"
                                          : theme === "gold-velvet"
                                            ? "bg-[#FAF5E6] border-[#c5a85c]/35 text-[#011c14]"
                                            : theme === "navy-velvet"
                                              ? "bg-[#F8FAFC] border-[#3F63C6]/25 text-slate-900"
                                              : isDark
                                                ? "bg-slate-950 border-slate-800 text-slate-100"
                                                : "bg-slate-50 border-emerald-200 text-slate-900"
                                      }`}
                                    />
                                    <div className="space-y-1">
                                      {surahsList
                                        .filter(s => s.name.includes(surahSelectSearchQuery) || String(s.number).includes(surahSelectSearchQuery))
                                        .map(s => (
                                          <button
                                            key={s.number}
                                            type="button"
                                            onClick={() => {
                                              setBookmarkFormSurah(s.number);
                                              setBookmarkFormAyah(1);
                                              setSurahSelectDropdownOpen(false);
                                              setSurahSelectSearchQuery("");
                                            }}
                                            className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold text-right transition cursor-pointer flex items-center justify-between ${
                                              bookmarkFormSurah === s.number
                                                ? themePrimaryBg
                                                : theme === "emerald-velvet"
                                                  ? "hover:bg-[#012519] text-[#FAF8F5]"
                                                  : theme === "gold-velvet"
                                                    ? "hover:bg-[#FAF5E6] text-[#011c14]"
                                                    : theme === "navy-velvet"
                                                      ? "hover:bg-[#EFF6FF] text-slate-900"
                                                      : isDark
                                                        ? "hover:bg-slate-800 text-slate-200"
                                                        : "hover:bg-emerald-50 text-slate-800"
                                            }`}
                                          >
                                            <span>{s.name}</span>
                                            <span className="text-[10px] opacity-70">﴿{toArabicNumerals(s.number)}﴾</span>
                                          </button>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Ayah Number Input */}
                              <div>
                                <label className={`block text-[10px] font-bold mb-1 ${theme === "emerald-velvet" ? "text-[#FAF8F5]/70" : theme === "gold-velvet" ? "text-[#8c6b23]" : "text-slate-600 dark:text-slate-400"}`}>رقم الآية</label>
                                <input
                                  type="number"
                                  min="1"
                                  max={surahsList.find(s => s.number === bookmarkFormSurah)?.numberOfAyahs || 286}
                                  value={bookmarkFormAyah}
                                  onChange={(e) => setBookmarkFormAyah(Math.max(1, parseInt(e.target.value) || 1))}
                                  className={`w-full px-3 py-2 text-xs rounded-xl border-2 font-bold focus:outline-none text-center shadow-2xs ${
                                    theme === "emerald-velvet"
                                      ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]"
                                      : theme === "gold-velvet"
                                        ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14]"
                                        : theme === "navy-velvet"
                                          ? "bg-white border-[#3F63C6]/25 text-slate-900"
                                          : isDark
                                            ? "bg-slate-950 border-slate-800 text-slate-100"
                                            : "bg-white border-emerald-200 text-slate-900"
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Category Selector inside Form */}
                            <div>
                              <label className={`block text-[10px] font-bold mb-1 ${theme === "emerald-velvet" ? "text-[#FAF8F5]/70" : theme === "gold-velvet" ? "text-[#8c6b23]" : "text-slate-600 dark:text-slate-400"}`}>نوع الفاصلة</label>
                              <div className="grid grid-cols-4 gap-1.5">
                                {[
                                  { id: "reading", label: "قراءة" },
                                  { id: "memorization", label: "حفظ" },
                                  { id: "revision", label: "مراجعة" },
                                  { id: "contemplation", label: "تدبر" },
                                ].map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setBookmarkFormCategory(c.id as any)}
                                    className={`py-1.5 rounded-lg text-xxs font-bold cursor-pointer transition border ${
                                      bookmarkFormCategory === c.id
                                        ? `${themePrimaryBg} font-black border-transparent`
                                        : theme === "emerald-velvet"
                                          ? "bg-[#011a12] text-[#FAF8F5] border-[#c5a85c]/30"
                                          : theme === "gold-velvet"
                                            ? "bg-[#FFFDF5] text-[#011c14] border-[#c5a85c]/30"
                                            : theme === "navy-velvet"
                                              ? "bg-white text-slate-900 border-[#3F63C6]/25"
                                              : isDark
                                                ? "bg-slate-800 text-slate-300 border-slate-700"
                                                : "bg-white text-slate-700 border-emerald-200"
                                    }`}
                                  >
                                    {c.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                const surahMeta = surahsList.find(s => s.number === bookmarkFormSurah);
                                onToggleBookmark(bookmarkFormSurah, surahMeta?.name || "", bookmarkFormAyah, bookmarkFormCategory);
                                setShowAddBookmarkForm(false);
                              }}
                              className={`w-full py-2.5 rounded-xl text-xs font-black cursor-pointer shadow-xs transition ${themePrimaryBg}`}
                            >
                              إضافة فاصلة
                            </button>
                          </div>
                        )}

                        {/* Bookmarks List */}
                        <div className="space-y-2 mt-3">
                          {bookmarks.filter(b => bookmarkCategory === "all" || (b.category || "reading") === bookmarkCategory).length === 0 ? (
                            <div className="text-center py-12 opacity-60">
                              <BookmarkIcon size={36} className="mx-auto mb-2 text-slate-400" />
                              <p className="text-xs font-bold">لا توجد فواصل في هذا القسم حالياً</p>
                            </div>
                          ) : (
                            bookmarks
                              .filter(b => bookmarkCategory === "all" || (b.category || "reading") === bookmarkCategory)
                              .map(b => {
                                const catLabel = 
                                  b.category === "reading" ? "قراءة" :
                                  b.category === "memorization" ? "حفظ" :
                                  b.category === "revision" ? "مراجعة" : "تدبر";
                                const catColor = 
                                  b.category === "reading" ? "bg-red-500" :
                                  b.category === "memorization" ? "bg-sky-500" :
                                  b.category === "revision" ? "bg-emerald-500" : "bg-purple-600";

                                return (
                                  <div
                                    key={b.id}
                                    onClick={() => {
                                      onChangeSurah?.(b.surahNumber, b.ayahNumber);
                                      setServiceDrawerTab(null);
                                    }}
                                    className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.005] ${themeCardBg} ${themePrimaryBorderHover}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-xl ${catColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                                        <BookmarkIcon size={16} className="fill-white" />
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-bold">
                                          فاصلة {catLabel} ({b.surahName} : {b.ayahNumber || 1})
                                        </h4>
                                        <p className={`text-[10px] mt-0.5 ${theme === "emerald-velvet" ? "text-[#FAF8F5]/60" : theme === "gold-velvet" ? "text-[#8c6b23]/80" : "text-slate-400"}`}>
                                          {b.timestamp || ""}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleBookmark(b.surahNumber, b.surahName, b.ayahNumber, b.category);
                                      }}
                                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                                      title="حذف الفاصلة"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sub Tab 2: Notes / ملاحظاتي */}
                    {myFilesActiveTab === "notes" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => setShowAddNoteForm(prev => !prev)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition ${themePrimaryBg}`}
                          >
                            <Plus size={15} />
                            <span>إضافة ملاحظة يدوياً</span>
                          </button>

                          {notes.length > 0 && (
                            <button
                              onClick={() => {
                                const content = notes
                                  .map(n => `سورة ${n.surahName} - الآية ${n.ayahNumber || 1}\nالتاريخ: ${n.timestamp}\nالملاحظة: ${n.content}\n-------------------`)
                                  .join("\n\n");
                                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `ملاحظاتي_القرآنية_${new Date().toISOString().slice(0,10)}.txt`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              }}
                              className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                theme === "emerald-velvet"
                                  ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5] hover:bg-[#012519]"
                                  : theme === "gold-velvet"
                                    ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14] hover:bg-[#FAF5E6]"
                                    : theme === "navy-velvet"
                                      ? "bg-white border-[#3F63C6]/25 text-slate-900 hover:bg-[#EFF6FF]"
                                      : isDark
                                        ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                                        : "bg-white border-emerald-200 text-slate-800 hover:bg-emerald-50"
                              }`}
                            >
                              <Download size={14} />
                              <span>حفظ كافة ملاحظاتي</span>
                            </button>
                          )}
                        </div>

                        {showAddNoteForm && (
                          <div className={`p-4 rounded-2xl space-y-3 ${themePrimaryFormBorderBg}`}>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={`block text-[10px] font-bold mb-1 ${theme === "emerald-velvet" ? "text-[#FAF8F5]/70" : theme === "gold-velvet" ? "text-[#8c6b23]" : "text-slate-600 dark:text-slate-400"}`}>السورة</label>
                                <select
                                  value={noteFormSurah}
                                  onChange={(e) => setNoteFormSurah(parseInt(e.target.value))}
                                  className={`w-full px-3 py-2 rounded-xl text-xs border-2 font-bold focus:outline-none ${
                                    theme === "emerald-velvet"
                                      ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]"
                                      : theme === "gold-velvet"
                                        ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14]"
                                        : theme === "navy-velvet"
                                          ? "bg-white border-[#3F63C6]/25 text-slate-900"
                                          : isDark
                                            ? "bg-slate-950 border-slate-800 text-slate-100"
                                            : "bg-white border-emerald-200 text-slate-900"
                                  }`}
                                >
                                  {surahsList.map(s => (
                                    <option key={s.number} value={s.number} className={theme === "emerald-velvet" ? "bg-[#011a12] text-[#FAF8F5]" : ""}>{s.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className={`block text-[10px] font-bold mb-1 ${theme === "emerald-velvet" ? "text-[#FAF8F5]/70" : theme === "gold-velvet" ? "text-[#8c6b23]" : "text-slate-600 dark:text-slate-400"}`}>الآية</label>
                                <input
                                  type="number"
                                  min="1"
                                  max={surahsList.find(s => s.number === noteFormSurah)?.numberOfAyahs || 286}
                                  value={noteFormAyah}
                                  onChange={(e) => setNoteFormAyah(Math.max(1, parseInt(e.target.value) || 1))}
                                  className={`w-full px-3 py-2 text-xs rounded-xl border-2 font-bold focus:outline-none text-center ${
                                    theme === "emerald-velvet"
                                      ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]"
                                      : theme === "gold-velvet"
                                        ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14]"
                                        : theme === "navy-velvet"
                                          ? "bg-white border-[#3F63C6]/25 text-slate-900"
                                          : isDark
                                            ? "bg-slate-950 border-slate-800 text-slate-100"
                                            : "bg-white border-emerald-200 text-slate-900"
                                  }`}
                                />
                              </div>
                            </div>

                            <div>
                              <label className={`block text-[10px] font-bold mb-1 ${theme === "emerald-velvet" ? "text-[#FAF8F5]/70" : theme === "gold-velvet" ? "text-[#8c6b23]" : "text-slate-600 dark:text-slate-400"}`}>الملاحظة</label>
                              <textarea
                                placeholder="اكتب هنا الفائدة أو الكناشة التدبرية..."
                                value={noteFormContent}
                                onChange={(e) => setNoteFormContent(e.target.value)}
                                rows={3}
                                className={`w-full p-3 rounded-xl text-xs border-2 focus:outline-none ${
                                  theme === "emerald-velvet"
                                    ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5] placeholder-[#c5a85c]/50"
                                    : theme === "gold-velvet"
                                      ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14] placeholder-[#8c6b23]/50"
                                      : theme === "navy-velvet"
                                        ? "bg-white border-[#3F63C6]/25 text-slate-900 placeholder-[#3F63C6]/50"
                                        : isDark
                                          ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500"
                                          : "bg-white border-emerald-200 text-slate-900 placeholder-slate-400"
                                }`}
                              />
                            </div>

                            <button
                              onClick={() => {
                                if (!noteFormContent.trim()) return;
                                const surahMeta = surahsList.find(s => s.number === noteFormSurah);
                                const newNote = {
                                  id: `note-${Date.now()}`,
                                  surahNumber: noteFormSurah,
                                  surahName: surahMeta?.name || `سورة ${noteFormSurah}`,
                                  ayahNumber: noteFormAyah,
                                  content: noteFormContent,
                                  timestamp: new Date().toLocaleDateString("ar-EG", { day: "numeric", month: "long" })
                                };
                                const updated = [newNote, ...notes];
                                setNotes(updated);
                                localStorage.setItem("quran_annotations_tebyan", JSON.stringify(updated));
                                setNoteFormContent("");
                                setShowAddNoteForm(false);
                              }}
                              className={`w-full py-2.5 rounded-xl text-xs font-black cursor-pointer shadow-xs transition ${themePrimaryBg}`}
                            >
                              حفظ الملاحظة
                            </button>
                          </div>
                        )}

                        {/* Notes List */}
                        <div className="space-y-2">
                          {notes.length === 0 ? (
                            <div className="text-center py-12 opacity-60">
                              <FileText size={36} className="mx-auto mb-2 text-slate-400" />
                              <p className="text-xs font-bold">لم تقم بتدوين أي ملاحظات بعد</p>
                            </div>
                          ) : (
                            notes.map(n => (
                              <div
                                key={n.id}
                                onClick={() => {
                                  onChangeSurah?.(n.surahNumber, n.ayahNumber);
                                  setServiceDrawerTab(null);
                                }}
                                className={`p-3.5 rounded-2xl space-y-1.5 cursor-pointer transition-all hover:scale-[1.005] ${themeCardBg} ${themePrimaryBorderHover}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-bold flex items-center gap-1.5 ${themePrimaryText}`}>
                                    <FileText size={14} />
                                    {n.surahName} {n.ayahNumber ? `• الآية ${toArabicNumerals(n.ayahNumber)}` : ""}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] ${theme === "emerald-velvet" ? "text-[#FAF8F5]/60" : theme === "gold-velvet" ? "text-[#8c6b23]/80" : "text-slate-400"}`}>{n.timestamp}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const updated = notes.filter(item => item.id !== n.id);
                                        setNotes(updated);
                                        localStorage.setItem("quran_annotations_tebyan", JSON.stringify(updated));
                                      }}
                                      className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                                      title="حذف الملاحظة"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                                <p className={`text-xs leading-relaxed font-medium whitespace-pre-wrap ${theme === "emerald-velvet" ? "text-[#FAF8F5]/90" : theme === "gold-velvet" ? "text-[#011c14]/90" : "text-slate-700 dark:text-slate-300"}`}>{n.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sub Tab 3: Reports / تقارير */}
                    {myFilesActiveTab === "reports" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {/* Card 1: Total Reading Time */}
                          <div className={`p-4 rounded-2xl transition-all shadow-2xs ${themeReportCardBg}`}>
                            <p className={`text-[11px] font-bold mb-1.5 ${
                              theme === "emerald-velvet"
                                ? "text-[#c5a85c]"
                                : theme === "gold-velvet"
                                  ? "text-[#8c6b23]"
                                  : theme === "navy-velvet"
                                    ? "text-[#3F63C6]"
                                    : isDark
                                      ? "text-emerald-400"
                                      : "text-emerald-800"
                            }`}>المدة الكلية للمطالعة</p>
                            <h4 className="text-base font-black font-mono">
                              {(() => {
                                const h = Math.floor(statsTimeSpent / 3600).toString().padStart(2, "0");
                                const m = Math.floor((statsTimeSpent % 3600) / 60).toString().padStart(2, "0");
                                return `${h}س : ${m}د`;
                              })()}
                            </h4>
                          </div>

                          {/* Card 2: Continuous Streak */}
                          <div className={`p-4 rounded-2xl transition-all shadow-2xs ${themeReportCardBg}`}>
                            <p className={`text-[11px] font-bold mb-1.5 ${
                              theme === "emerald-velvet"
                                ? "text-[#c5a85c]"
                                : theme === "gold-velvet"
                                  ? "text-[#8c6b23]"
                                  : theme === "navy-velvet"
                                    ? "text-[#3F63C6]"
                                    : isDark
                                      ? "text-emerald-400"
                                      : "text-emerald-800"
                            }`}>المداومة المستمرة</p>
                            <h4 className={`text-base font-black ${
                              theme === "emerald-velvet" ? "text-[#e2f0db]" : theme === "gold-velvet" ? "text-amber-700 font-black" : "text-amber-600 dark:text-amber-400"
                            }`}>{statsStreak} يوم</h4>
                          </div>

                          {/* Card 3: Notes Count */}
                          <div className={`p-4 rounded-2xl transition-all shadow-2xs ${themeReportCardBg}`}>
                            <p className={`text-[11px] font-bold mb-1.5 ${
                              theme === "emerald-velvet"
                                ? "text-[#c5a85c]"
                                : theme === "gold-velvet"
                                  ? "text-[#8c6b23]"
                                  : theme === "navy-velvet"
                                    ? "text-[#3F63C6]"
                                    : isDark
                                      ? "text-emerald-400"
                                      : "text-emerald-800"
                            }`}>الكناشات المدوّنة</p>
                            <h4 className={`text-base font-black ${themePrimaryText}`}>{notes.length} ملاحظة</h4>
                          </div>

                          {/* Card 4: Bookmarks Count */}
                          <div className={`p-4 rounded-2xl transition-all shadow-2xs ${themeReportCardBg}`}>
                            <p className={`text-[11px] font-bold mb-1.5 ${
                              theme === "emerald-velvet"
                                ? "text-[#c5a85c]"
                                : theme === "gold-velvet"
                                  ? "text-[#8c6b23]"
                                  : theme === "navy-velvet"
                                    ? "text-[#3F63C6]"
                                    : isDark
                                      ? "text-emerald-400"
                                      : "text-emerald-800"
                            }`}>فواصل الحفظ والتلاوة</p>
                            <h4 className={`text-base font-black ${themePrimaryText}`}>{bookmarks.length} فاصلة</h4>
                          </div>

                          {/* Card 5: Shared Verses Count */}
                          <div className={`p-4 rounded-2xl transition-all shadow-2xs ${themeReportCardBg}`}>
                            <p className={`text-[11px] font-bold mb-1.5 ${
                              theme === "emerald-velvet"
                                ? "text-[#c5a85c]"
                                : theme === "gold-velvet"
                                  ? "text-[#8c6b23]"
                                  : theme === "navy-velvet"
                                    ? "text-[#3F63C6]"
                                    : isDark
                                      ? "text-emerald-400"
                                      : "text-emerald-800"
                            }`}>الآيات المشاركة</p>
                            <h4 className={`text-base font-black ${
                              theme === "emerald-velvet" ? "text-purple-300" : theme === "gold-velvet" ? "text-purple-800" : theme === "navy-velvet" ? "text-purple-700" : "text-purple-600 dark:text-purple-400"
                            }`}>{statsSharesCount} آية</h4>
                          </div>

                          {/* Card 6: Pages Read Count */}
                          <div className={`p-4 rounded-2xl transition-all shadow-2xs ${themeReportCardBg}`}>
                            <p className={`text-[11px] font-bold mb-1.5 ${
                              theme === "emerald-velvet"
                                ? "text-[#c5a85c]"
                                : theme === "gold-velvet"
                                  ? "text-[#8c6b23]"
                                  : theme === "navy-velvet"
                                    ? "text-[#3F63C6]"
                                    : isDark
                                      ? "text-emerald-400"
                                      : "text-emerald-800"
                            }`}>الصفحات المقروءة</p>
                            <h4 className={`text-base font-black ${
                              theme === "emerald-velvet" ? "text-sky-300" : theme === "gold-velvet" ? "text-sky-800" : theme === "navy-velvet" ? "text-sky-700" : "text-sky-600 dark:text-sky-400"
                            }`}>{statsPagesRead} صفحة</h4>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Dead Drawer Start */}
      {false && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[150] flex items-end justify-center cursor-default bg-black/45 backdrop-blur-[1px]"
            onClick={(e) => {
              e.stopPropagation();
              setShowMyFilesDrawer(false);
            }}
          >
            <motion.div
              id="my-files-overlay-drawer"
              dir="rtl"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-5xl h-[80vh] overflow-hidden rounded-t-[24px] rounded-b-none border-t border-x-0 border-b-0 shadow-2xl flex flex-col transition-colors duration-300 bg-white ${
                theme === "emerald-velvet"
                  ? "border-[#c5a85c]/35 text-slate-800"
                  : theme === "navy-velvet"
                    ? "border-[#3F63C6]/40 text-slate-800"
                    : theme === "gold-velvet"
                      ? "border-[#c5a85c]/35 text-slate-900"
                      : isDark
                        ? "border-slate-200 text-slate-800"
                        : "border-emerald-100 text-slate-800"
              }`}
            >
              {/* Drag Handle Accent */}
              <div className="w-12 h-1 bg-slate-300/40 rounded-full mx-auto my-2.5 shrink-0" />
              
              {/* Header Title with Center Alignment and Close Button */}
              <div className={`flex items-center justify-between px-5 py-3 border-b ${
                theme === "gold-velvet" ? "border-[#c5a85c]/25" : theme === "emerald-velvet" ? "border-[#34d399]/25" : theme === "navy-velvet" ? "border-[#3F63C6]/25" : isDark ? "border-slate-900" : "border-slate-200/60"
              }`}>
                <h3 className={`text-sm font-black flex items-center gap-1.5 ${
                  theme === "navy-velvet"
                    ? "text-[#3F63C6]"
                    : theme === "gold-velvet"
                      ? "text-[#c5a85c]"
                      : theme === "emerald-velvet"
                        ? "text-[#34d399]"
                        : isDark
                          ? "text-emerald-400"
                          : "text-emerald-850"
                }`}>
                  <FolderHeart size={16} />
                  ملفاتي
                </h3>
                <button 
                  onClick={() => setShowMyFilesDrawer(false)}
                  className="p-1.5 rounded-full transition-all cursor-pointer bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400"
                  title="إغلاق"
                >
                  <X size={16} className="text-red-500 dark:text-red-400 stroke-[2.5px]" />
                </button>
              </div>

              {/* Tab Selector Segment */}
              <div className={`flex items-center justify-around border-b px-3 shrink-0 ${
                theme === "gold-velvet" ? "border-[#c5a85c]/15" : theme === "emerald-velvet" ? "border-[#34d399]/15" : theme === "navy-velvet" ? "border-[#3F63C6]/20" : isDark ? "border-slate-900" : "border-slate-100"
              }`}>
                {[
                  { id: "bookmarks", label: "فواصل" },
                  { id: "notes", label: "ملاحظات" },
                  { id: "reports", label: "تقارير" }
                ].map((tb) => {
                  const isActive = myFilesActiveTab === tb.id;
                  return (
                    <button
                      key={tb.id}
                      onClick={() => setMyFilesActiveTab(tb.id as any)}
                      className={`py-3 px-6 text-xs font-black relative transition-all duration-300 cursor-pointer ${
                        isActive 
                          ? (theme === "navy-velvet" ? "text-[#3F63C6]" : theme === "gold-velvet" ? "text-[#c5a85c]" : theme === "emerald-velvet" ? "text-[#34d399]" : "text-emerald-600 dark:text-emerald-400")
                          : "text-slate-400 hover:text-slate-500"
                      }`}
                    >
                      <span>{tb.label}</span>
                      {isActive && (
                        <motion.div 
                          layoutId="myFilesTabLine"
                          className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                            theme === "navy-velvet" ? "bg-[#3F63C6]" : theme === "gold-velvet" ? "bg-[#c5a85c]" : theme === "emerald-velvet" ? "bg-[#34d399]" : "bg-emerald-500"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {/* 1. BOOKMARKS TAB ("فواصل") */}
                {myFilesActiveTab === "bookmarks" && (
                  <div className="space-y-4">
                    {/* Category pills */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 mb-3">
                      {[
                        { id: "reading", label: "قراءة", activeClass: "bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/25" },
                        { id: "memorization", label: "حفظ", activeClass: "bg-sky-400 text-slate-950 border-sky-400 shadow-sm shadow-sky-400/25" },
                        { id: "revision", label: "مراجعة", activeClass: "bg-emerald-400 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-400/25" },
                        { id: "contemplation", label: "تدبّر", activeClass: "bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/25" }
                      ].map((cat) => {
                        const isActive = bookmarkCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setBookmarkCategory(cat.id as any)}
                            className={`px-3.5 py-1.5 rounded-full text-xxs font-black transition-all duration-200 cursor-pointer border ${
                              isActive 
                                ? cat.activeClass
                                : "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/60"
                            }`}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Add Bookmark inline form */}
                    <div className="p-3 rounded-2xl border bg-white border-slate-200/80 shadow-xs text-slate-800">
                      <h4 className="text-xxs font-black mb-2 flex items-center gap-1 text-slate-800">
                        <Plus size={12} className="text-emerald-600" />
                        إضافة فاصلة يدوياً
                      </h4>
                      <div className="flex items-end gap-2">
                        <div className="w-1/2 min-w-0">
                          <label className="block text-[9px] font-bold text-slate-600 mb-1">السورة</label>
                          <select
                            value={noteFormSurah}
                            onChange={(e) => setNoteFormSurah(parseInt(e.target.value))}
                            className="w-full h-8 px-2 text-xxs rounded-lg border focus:outline-none bg-white border-slate-200 text-slate-800 focus:border-emerald-600"
                          >
                            {surahsList.map(s => (
                              <option key={s.number} value={s.number}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-16 sm:w-20 shrink-0">
                          <label className="block text-[9px] font-bold text-slate-600 mb-1">الآية</label>
                          <input
                            type="number"
                            min="1"
                            max={surahsList.find(s => s.number === noteFormSurah)?.numberOfAyahs || 286}
                            value={noteFormAyah}
                            onChange={(e) => setNoteFormAyah(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full h-8 px-2 border rounded-lg text-xxs text-center focus:outline-none bg-white border-slate-200 text-slate-800 focus:border-emerald-600"
                          />
                        </div>
                        <div className="shrink-0">
                          <button
                            onClick={() => {
                              const surahMeta = surahsList.find(s => s.number === noteFormSurah);
                              onToggleBookmark(noteFormSurah, surahMeta?.name || "", noteFormAyah, bookmarkCategory === "all" ? "reading" : bookmarkCategory);
                            }}
                            className="h-8 px-3.5 rounded-lg text-xxs font-black text-center text-white cursor-pointer flex items-center justify-center shrink-0 transition-all bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                          >
                            حفظ الفاصلة
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bookmark Items List */}
                    <div className="space-y-2 mt-3">
                      {bookmarks.filter(b => (b.category || "reading") === bookmarkCategory).length === 0 ? (
                        <div className="text-right py-10 opacity-70">
                          <BookmarkIcon size={28} className="mr-1 ml-auto mb-2 text-slate-300" />
                          <p className="text-sm sm:text-base font-bold">لا توجد فواصل في هذا القسم حالياً</p>
                          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">يمكنك إضافة فواصل عبر لوحة التحكم أعلاه أو من قائمة الآيات.</p>
                        </div>
                      ) : (
                        bookmarks
                          .filter(b => (b.category || "reading") === bookmarkCategory)
                          .map((b) => {
                            const labelAr = 
                              bookmarkCategory === "reading" ? "فاصلة التلاوة" :
                              bookmarkCategory === "revision" ? "فاصلة المراجعة" :
                              bookmarkCategory === "memorization" ? "فاصلة الحفظ" :
                              "فاصلة التدبر";
                            return (
                              <motion.div
                                key={b.id}
                                layout
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                                  theme === "emerald-velvet"
                                    ? "bg-[#011a12] border-[#c5a85c]/25 text-[#FAF8F5]"
                                    : theme === "gold-velvet"
                                      ? "bg-white border-[#c5a85c]/25 text-[#011c14]"
                                      : theme === "navy-velvet"
                                        ? "bg-[#13224a] border-[#3F63C6]/30 text-[#FAF8F5]"
                                        : isDark
                                          ? "bg-slate-900 border-slate-800 text-white"
                                          : "bg-white border-slate-100 text-slate-800 shadow-sm"
                                }`}
                              >
                                {/* Right Side: Content with Bookmark Ribbon and Reference Link */}
                                <button
                                  onClick={() => {
                                    if (onChangeSurah) {
                                      onChangeSurah(b.surahNumber, b.ayahNumber);
                                    }
                                    setShowMyFilesDrawer(false);
                                  }}
                                  className="flex items-center gap-2.5 text-right flex-1 justify-start group cursor-pointer"
                                >
                                  <BookmarkIcon size={19} className={
                                    (b.category || "reading") === "reading" ? "text-red-500 fill-red-500/20 shadow-xs" :
                                    (b.category || "reading") === "memorization" ? "text-sky-400 fill-sky-400/20 shadow-xs" :
                                    (b.category || "reading") === "revision" ? "text-emerald-400 fill-emerald-400/20 shadow-xs" :
                                    (b.category || "reading") === "contemplation" ? "text-purple-500 fill-purple-500/20 shadow-xs" :
                                    "text-red-500 fill-red-500/20 shadow-xs"
                                  } />
                                  <span className="text-sm font-black group-hover:underline text-right">
                                    {labelAr} ({b.surahName} : {b.ayahNumber || 1})
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-slate-400 font-medium mr-auto">{b.timestamp}</span>
                                </button>

                                {/* Left Side: Delete Action (Rounded Square with Borders) */}
                                <button
                                  onClick={() => onToggleBookmark(b.surahNumber, b.surahName, b.ayahNumber)}
                                  className="p-1.5 rounded-xl border border-rose-500/25 hover:border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
                                  title="حذف الفاصلة"
                                >
                                  <X size={15} />
                                </button>
                              </motion.div>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}

                {/* 2. NOTES TAB ("ملاحظات") */}
                {myFilesActiveTab === "notes" && (
                  <div className="space-y-4">
                    {/* Add note toggle/form */}
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-xs font-black">كناشاتي وملاحظاتي</h4>
                      <button
                        onClick={() => setShowAddNoteForm(!showAddNoteForm)}
                        className={`px-3 py-1 rounded-xl text-xxs font-bold cursor-pointer transition-all ${
                          showAddNoteForm 
                            ? "bg-slate-500 text-white"
                            : (theme === "navy-velvet" ? "bg-[#3F63C6] text-white" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14]" : theme === "emerald-velvet" ? "bg-[#34d399] text-[#011c14]" : "bg-emerald-600 text-white")
                        }`}
                      >
                        {showAddNoteForm ? "إلغاء" : "إضافة كناشة جديدة"}
                      </button>
                    </div>

                    {showAddNoteForm && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className={`p-3 rounded-2xl border space-y-3 overflow-hidden ${
                          theme === "emerald-velvet"
                            ? "bg-[#011a12]/60 border-[#34d399]/25"
                            : theme === "gold-velvet"
                              ? "bg-white border-[#c5a85c]/20"
                              : theme === "navy-velvet"
                                ? "bg-slate-50 border-[#3F63C6]/20"
                                : isDark
                                  ? "bg-slate-900/40 border-slate-800"
                                  : "bg-white border-slate-200/80 shadow-xs"
                        }`}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1">السورة</label>
                            <select
                              value={noteFormSurah}
                              onChange={(e) => setNoteFormSurah(parseInt(e.target.value))}
                              className={`w-full p-1.5 text-xxs rounded-lg border focus:outline-none ${
                                theme === "emerald-velvet"
                                  ? "bg-[#011a12] border-[#34d399]/35 text-[#FAF8F5] focus:border-[#34d399]"
                                  : theme === "gold-velvet"
                                    ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-black focus:border-[#c5a85c]"
                                    : theme === "navy-velvet"
                                      ? "bg-slate-50 border-slate-200 text-slate-800 focus:border-[#3F63C6]"
                                      : isDark
                                        ? "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                                        : "bg-white border-slate-200 text-slate-800 focus:border-emerald-600"
                              }`}
                            >
                              {surahsList.map(s => (
                                <option key={s.number} value={s.number}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1">الآية</label>
                            <input
                              type="number"
                              min="1"
                              max={surahsList.find(s => s.number === noteFormSurah)?.numberOfAyahs || 286}
                              value={noteFormAyah}
                              onChange={(e) => setNoteFormAyah(Math.max(1, parseInt(e.target.value) || 1))}
                              className={`w-full p-1 border rounded-lg text-xxs text-center focus:outline-none ${
                                theme === "emerald-velvet"
                                  ? "bg-[#011a12] border-[#34d399]/35 text-[#FAF8F5] focus:border-[#34d399]"
                                  : theme === "gold-velvet"
                                    ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-black focus:border-[#c5a85c]"
                                    : theme === "navy-velvet"
                                      ? "bg-slate-50 border-slate-200 text-slate-800 focus:border-[#3F63C6]"
                                      : isDark
                                        ? "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                                        : "bg-white border-slate-200 text-slate-800 focus:border-emerald-600"
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-1">محتوى الملاحظة أو الكناشة</label>
                          <textarea
                            placeholder="اكتب هنا تدبرك أو فائدة علمية حول الآية الكريمة..."
                            value={noteFormContent}
                            onChange={(e) => setNoteFormContent(e.target.value)}
                            rows={3}
                            className={`w-full p-2.5 rounded-xl text-xs border text-right focus:outline-none custom-scrollbar ${
                              theme === "emerald-velvet"
                                ? "bg-[#011a12] border-[#34d399]/35 text-[#FAF8F5] focus:border-[#34d399]"
                                : theme === "gold-velvet"
                                  ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-black focus:border-[#c5a85c]"
                                  : theme === "navy-velvet"
                                    ? "bg-slate-50 border-slate-200 text-slate-800 focus:border-[#3F63C6]"
                                    : isDark
                                      ? "bg-slate-900 border-slate-800 text-white focus:border-slate-700"
                                      : "bg-white border-slate-200 text-slate-800 focus:border-emerald-600"
                            }`}
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (!noteFormContent.trim()) return;
                            const surahMeta = surahsList.find(s => s.number === noteFormSurah);
                            const newNote = {
                              id: `note-${Date.now()}`,
                              surahNumber: noteFormSurah,
                              surahName: surahMeta?.name || `سورة ${noteFormSurah}`,
                              ayahNumber: noteFormAyah,
                              content: noteFormContent,
                              timestamp: new Date().toLocaleDateString("ar-EG", { day: "numeric", month: "long" })
                            };
                            const updated = [newNote, ...notes];
                            setNotes(updated);
                            localStorage.setItem("quran_annotations_tebyan", JSON.stringify(updated));
                            setNoteFormContent("");
                            setShowAddNoteForm(false);
                          }}
                          className={`w-full py-2 rounded-xl text-xs font-black text-center text-white cursor-pointer ${
                            theme === "navy-velvet" ? "bg-[#3F63C6] hover:bg-[#3F63C6]/90" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] hover:bg-[#c5a85c]/95" : theme === "emerald-velvet" ? "bg-[#34d399] text-[#011c14] hover:bg-[#34d399]/95" : "bg-emerald-600 hover:bg-emerald-500"
                          }`}
                        >
                          حفظ الكناشة
                        </button>
                      </motion.div>
                    )}

                    {/* Notes List */}
                    <div className="space-y-3 mt-2">
                      {notes.length === 0 ? (
                        <div className="text-right py-12 opacity-70">
                          <FileText size={32} className="mr-1 ml-auto mb-2 text-slate-300" />
                          <h4 className="text-xs font-black">قائمة الكناشات</h4>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            هنا تظهر قائمة الكناشات التي قمت بكتابتها على الآيات
                          </p>
                        </div>
                      ) : (
                        notes.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              theme === "emerald-velvet"
                                ? "bg-[#011a12] border-[#c5a85c]/25 text-[#FAF8F5]"
                                : theme === "gold-velvet"
                                  ? "bg-white border-[#c5a85c]/25 text-[#011c14]"
                                  : theme === "navy-velvet"
                                    ? "bg-[#13224a] border-[#3F63C6]/30 text-[#FAF8F5]"
                                    : isDark
                                      ? "bg-slate-900 border-slate-800 text-white"
                                      : "bg-white border-slate-150 text-slate-800 shadow-sm"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              {/* Right Side: Content and Reference Link */}
                              <button
                                onClick={() => {
                                  if (onChangeSurah) {
                                    onChangeSurah(n.surahNumber, n.ayahNumber);
                                  }
                                  setShowMyFilesDrawer(false);
                                }}
                                className="text-right flex-1 pl-3 group cursor-pointer"
                              >
                                <h5 className="text-[11px] font-black group-hover:underline text-emerald-600 dark:text-emerald-400">
                                  {n.surahName} : آية {n.ayahNumber || 1}
                                </h5>
                                <span className="text-[9px] text-slate-400">{n.timestamp}</span>
                              </button>

                              {/* Left Side: Delete Action */}
                              <button
                                onClick={() => {
                                  const updated = notes.filter(item => item.id !== n.id);
                                  setNotes(updated);
                                  localStorage.setItem("quran_annotations_tebyan", JSON.stringify(updated));
                                }}
                                className="p-1 rounded-full hover:bg-rose-500/10 text-rose-500 transition cursor-pointer"
                                title="حذف الكناشة"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <p className="text-xs mt-2 text-right leading-relaxed font-sans whitespace-pre-wrap font-medium opacity-90">
                              {n.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. REPORTS TAB ("تقارير") */}
                {myFilesActiveTab === "reports" && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-right mb-1">تقارير النشاط والمدارسة</h4>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Card 1: المدة المستخدمة */}
                      <div className={`p-3.5 rounded-2xl border text-right flex flex-col justify-between transition-all ${
                        theme === "emerald-velvet" ? "bg-[#0e6e52] border-[#34d399]/45 text-[#FAF8F5] shadow-xs" : theme === "gold-velvet" ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14] shadow-xs" : theme === "navy-velvet" ? "bg-[#2c4b92] border-[#3F63C6]/50 text-[#FAF8F5] shadow-xs" : isDark ? "bg-slate-700/80 border-slate-600 text-slate-100 shadow-xs" : "bg-sky-50 border-sky-200/80 text-slate-800 shadow-xs"
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-bold ${theme === "gold-velvet" ? "text-amber-900/70" : theme === "emerald-velvet" || theme === "navy-velvet" ? "text-slate-300" : "text-slate-400"}`}>ساعة</span>
                          <div className={`p-1.5 rounded-lg ${
                            theme === "navy-velvet" ? "bg-[#3F63C6]/20 text-[#7a9dff]" : "bg-amber-500/15 text-amber-500"
                          }`}>
                            <Clock size={15} />
                          </div>
                        </div>
                        <div>
                          <p className={`text-[10px] leading-none mb-1 font-medium ${theme === "gold-velvet" ? "text-amber-950/80" : theme === "emerald-velvet" || theme === "navy-velvet" ? "text-slate-200" : "text-slate-500"}`}>المدة الكلية للمطالعة</p>
                          <h5 className="text-xs font-black font-mono leading-none tracking-tight">
                            {(() => {
                              const totalSeconds = statsTimeSpent;
                              const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
                              const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
                              const s = (totalSeconds % 60).toString().padStart(2, "0");
                              return `${h}:${m}:${s}`;
                            })()}
                          </h5>
                        </div>
                      </div>

                      {/* Card 2: أطول مداومة */}
                      <div className={`p-3.5 rounded-2xl border text-right flex flex-col justify-between transition-all ${
                        theme === "emerald-velvet" ? "bg-[#0e6e52] border-[#34d399]/45 text-[#FAF8F5] shadow-xs" : theme === "gold-velvet" ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14] shadow-xs" : theme === "navy-velvet" ? "bg-[#2c4b92] border-[#3F63C6]/50 text-[#FAF8F5] shadow-xs" : isDark ? "bg-slate-700/80 border-slate-600 text-slate-100 shadow-xs" : "bg-sky-50 border-sky-200/80 text-slate-800 shadow-xs"
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-bold ${theme === "gold-velvet" ? "text-amber-900/70" : theme === "emerald-velvet" || theme === "navy-velvet" ? "text-slate-300" : "text-slate-400"}`}>يوم</span>
                          <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-500">
                            <Zap size={15} />
                          </div>
                        </div>
                        <div>
                          <p className={`text-[10px] leading-none mb-1 font-medium ${theme === "gold-velvet" ? "text-amber-950/80" : theme === "emerald-velvet" || theme === "navy-velvet" ? "text-slate-200" : "text-slate-500"}`}>أطول مداومة مستمرة</p>
                          <h5 className="text-xs font-black leading-none">
                            {statsStreak} يوم
                          </h5>
                        </div>
                      </div>

                      {/* Card 3: عدد الكناشات */}
                      <div className={`p-3.5 rounded-2xl border text-right flex flex-col justify-between transition-all ${
                        theme === "emerald-velvet" ? "bg-[#0e6e52] border-[#34d399]/45 text-[#FAF8F5] shadow-xs" : theme === "gold-velvet" ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14] shadow-xs" : theme === "navy-velvet" ? "bg-[#2c4b92] border-[#3F63C6]/50 text-[#FAF8F5] shadow-xs" : isDark ? "bg-slate-700/80 border-slate-600 text-slate-100 shadow-xs" : "bg-sky-50 border-sky-200/80 text-slate-800 shadow-xs"
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-bold ${theme === "gold-velvet" ? "text-amber-900/70" : theme === "emerald-velvet" || theme === "navy-velvet" ? "text-slate-300" : "text-slate-400"}`}>ملاحظة</span>
                          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-500">
                            <FileText size={15} />
                          </div>
                        </div>
                        <div>
                          <p className={`text-[10px] leading-none mb-1 font-medium ${theme === "gold-velvet" ? "text-amber-950/80" : theme === "emerald-velvet" || theme === "navy-velvet" ? "text-slate-200" : "text-slate-500"}`}>الكناشات التي دونتها</p>
                          <h5 className="text-xs font-black leading-none">
                            {notes.length} ملاحظة
                          </h5>
                        </div>
                      </div>

                      {/* Card 4: عدد الآيات التي بحثت عنها */}
                      <div className={`p-3.5 rounded-2xl border text-right flex flex-col justify-between transition-all ${
                        theme === "emerald-velvet" ? "bg-[#0e6e52] border-[#34d399]/45 text-[#FAF8F5] shadow-xs" : theme === "gold-velvet" ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14] shadow-xs" : theme === "navy-velvet" ? "bg-[#2c4b92] border-[#3F63C6]/50 text-[#FAF8F5] shadow-xs" : isDark ? "bg-slate-700/80 border-slate-600 text-slate-100 shadow-xs" : "bg-sky-50 border-sky-200/80 text-slate-800 shadow-xs"
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-bold ${theme === "gold-velvet" ? "text-amber-900/70" : theme === "emerald-velvet" || theme === "navy-velvet" ? "text-slate-300" : "text-slate-400"}`}>آية</span>
                          <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-500">
                            <Search size={15} />
                          </div>
                        </div>
                        <div>
                          <p className={`text-[10px] leading-none mb-1 font-medium ${theme === "gold-velvet" ? "text-amber-950/80" : theme === "emerald-velvet" || theme === "navy-velvet" ? "text-slate-200" : "text-slate-500"}`}>الآيات التي بحثت عنها</p>
                          <h5 className="text-xs font-black leading-none">
                            {statsSearchedCount} آية
                          </h5>
                        </div>
                      </div>

                      {/* Card 5: الصفحات التي قرأتها */}
                      <div className={`p-3.5 rounded-2xl border text-right flex flex-col justify-between transition-all ${
                        theme === "emerald-velvet" ? "bg-[#0e6e52] border-[#34d399]/45 text-[#FAF8F5] shadow-xs" : theme === "gold-velvet" ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14] shadow-xs" : theme === "navy-velvet" ? "bg-[#2c4b92] border-[#3F63C6]/50 text-[#FAF8F5] shadow-xs" : isDark ? "bg-slate-700/80 border-slate-600 text-slate-100 shadow-xs" : "bg-sky-50 border-sky-200/80 text-slate-800 shadow-xs"
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-bold ${theme === "gold-velvet" ? "text-amber-900/70" : theme === "emerald-velvet" || theme === "navy-velvet" ? "text-slate-300" : "text-slate-400"}`}>صفحة</span>
                          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500">
                            <BookOpen size={15} />
                          </div>
                        </div>
                        <div>
                          <p className={`text-[10px] leading-none mb-1 font-medium ${theme === "gold-velvet" ? "text-amber-950/80" : theme === "emerald-velvet" || theme === "navy-velvet" ? "text-slate-200" : "text-slate-500"}`}>الصفحات التي قرأتها</p>
                          <h5 className="text-xs font-black leading-none truncate">
                            {statsPagesRead} صفحة
                          </h5>
                        </div>
                      </div>

                      {/* Card 6: الآيات التي شاركتها */}
                      <div className={`p-3.5 rounded-2xl border text-right flex flex-col justify-between transition-all ${
                        theme === "emerald-velvet" ? "bg-[#0e6e52] border-[#34d399]/45 text-[#FAF8F5] shadow-xs" : theme === "gold-velvet" ? "bg-[#FFFDF5] border-[#c5a85c]/35 text-[#011c14] shadow-xs" : theme === "navy-velvet" ? "bg-[#2c4b92] border-[#3F63C6]/50 text-[#FAF8F5] shadow-xs" : isDark ? "bg-slate-700/80 border-slate-600 text-slate-100 shadow-xs" : "bg-sky-50 border-sky-200/80 text-slate-800 shadow-xs"
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-bold ${theme === "gold-velvet" ? "text-amber-900/70" : theme === "emerald-velvet" || theme === "navy-velvet" ? "text-slate-300" : "text-slate-400"}`}>مشاركة</span>
                          <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-500">
                            <Share2 size={15} />
                          </div>
                        </div>
                        <div>
                          <p className={`text-[10px] leading-none mb-1 font-medium ${theme === "gold-velvet" ? "text-amber-950/80" : theme === "emerald-velvet" || theme === "navy-velvet" ? "text-slate-200" : "text-slate-500"}`}>المشاركات التي شاركتها</p>
                          <h5 className="text-xs font-black leading-none truncate">
                            {statsSharesCount} مشاركة
                          </h5>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

      {/* Main Reading Canvas */}
      <div 
        id="reading-canvas" 
        className={`w-full transition-all duration-300 ${
          effectivePageMode === "mushaf-svg" || effectivePageMode === "qcf4" || settings.mushafProvider === "qcf4"
            ? "px-0 py-1 sm:py-2 mt-4 sm:mt-5 pb-8 sm:pb-10"
            : effectivePageMode === "continuous"
            ? "px-0 sm:px-2 md:px-4 py-2 sm:py-4 space-y-4"
            : "px-1.5 sm:px-4 py-4 sm:py-8 space-y-6"
        }`}
      >
        {loading ? (
          <div className="text-center py-24 space-y-3">
            <div className={`inline-block animate-spin rounded-full h-8 w-8 border-4 ${
              theme === "navy-velvet" ? "border-[#3F63C6]" :
              theme === "gold-velvet" ? "border-[#c5a85c]" :
              theme === "emerald-velvet" ? "border-[#34d399]" :
              isDark ? "border-emerald-500" : "border-emerald-600"
            } border-t-transparent`}></div>
            <p className={`text-sm font-semibold ${
              theme === "emerald-velvet" ? "text-[#34d399]" :
              theme === "gold-velvet" ? "text-[#c5a85c]" :
              theme === "navy-velvet" ? "text-[#3F63C6]" :
              isDark ? "text-emerald-400" : "text-emerald-800"
            }`}>جاري تحميل آيات السورة المباركة...</p>
          </div>
        ) : fetchError ? (
          <div className="text-center py-16 bg-red-50 rounded-2xl border border-red-100 p-6">
            <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
            <p className="text-sm font-bold text-red-800 mb-2">{fetchError}</p>
            <button
              onClick={() => {
                // Trigger reload by resetting state
                setLoading(true);
                setFetchError(null);
                onChangeSettings({}); // force re-render
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition"
            >
              إعادة التحميل
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {dynamicFontStyles && <style>{dynamicFontStyles}</style>}
            
            {effectivePageMode === "mushaf-svg" || effectivePageMode === "qcf4" || settings.mushafProvider === "qcf4" ? (
              /* Beautiful vector SVG Medina Mushaf page mode */
              <div id="mushaf-svg-view-container" className="flex flex-col items-center gap-2 select-none w-full" dir="rtl">
                <div className="w-full flex flex-col items-center px-0">
                  {/* Aligned Page Container to keep header, page canvas and footer perfectly synchronized in width */}
                  <div 
                    id="mushaf-aligned-page-container"
                    className="w-full flex flex-col items-center gap-2 sm:gap-2.5 flex-1 mt-3 sm:mt-4"
                    style={{ 
                      maxWidth: "100%",
                      width: "100%"
                    }}
                  >
                      {/* 1. Beautiful Traditional Medina Mushaf Header Frame */}
                      {(() => {
                        const pageMeta = getHizbAndJuzMetadata(currentPage);
                        const juzText = `الجزء ${getJuzOrdinalName(pageMeta.juzNum)}`;
                        
                        const hizbText = `${toArabicNumerals(pageMeta.hizbNum)}`;

                        const quarterDisplayName = (() => {
                          const part = pageMeta.quarterPart;
                          if (!part || part === "بداية الحزب") return "الحِزْبُ";
                          if (part === "ربع الحزب") return "رُبْعُ الحِزْبِ";
                          if (part === "نصف الحزب") return "نِصْفُ الحِزْبِ";
                          if (part === "ثلاثة أرباع" || part === "ثلاثة أرباع الحزب") return "ثَلَاثَةُ أَرْبَاعِ الحِزْبِ";
                          return part;
                        })();

                        const surahTextFormatted = pageMeta.surahName;

                        const bgCol = theme === "emerald-velvet" ? "#FAFDFB" : theme === "gold-velvet" ? "#FFFEFA" : theme === "navy-velvet" ? "#FAFCFF" : isDark ? "#061510" : "#FFFFFF";
                        const borderCol = theme === "emerald-velvet" ? "#34d399" : theme === "gold-velvet" ? "#c5a85c" : theme === "navy-velvet" ? "#1b3168" : isDark ? "#10b981" : "#065f46";
                        const textCol = (theme === "emerald-velvet" || theme === "gold-velvet") ? "#000000" : theme === "navy-velvet" ? "#1b3168" : isDark ? "#ecfdf5" : "#044f31";

                        const getGlyphFilter = () => {
                          if (theme === "emerald-velvet" || theme === "gold-velvet") {
                            return "brightness(0) saturate(100%)";
                          }
                          if (theme === "navy-velvet") {
                            return "brightness(0) saturate(100%) invert(16%) sepia(74%) saturate(1530%) hue-rotate(211deg) brightness(94%) contrast(91%)";
                          }
                          if (isDark) {
                            return "brightness(0) saturate(100%) invert(98%) sepia(6%) saturate(601%) hue-rotate(107deg) brightness(101%) contrast(98%)";
                          }
                          return "brightness(0) saturate(100%) invert(18%) sepia(99%) saturate(496%) hue-rotate(113deg) brightness(93%) contrast(97%)";
                        };

                        return (
                          <div 
                            id="mushaf-svg-header-frame"
                            dir="rtl"
                            style={{ marginTop: '-4px', height: '35.25px' }}
                            className={`w-full border rounded-2xl p-1 sm:p-1.5 flex justify-between items-center text-xs sm:text-sm select-none transition-all duration-300 shadow-xs ${
                              theme === "gold-velvet"
                                ? "border-[#c5a85c] bg-[#FFFEFA]/90 text-[#c5a85c]"
                                : theme === "emerald-velvet"
                                  ? "border-[#34d399] bg-[#FAFDFB]/90 text-[#10b981]"
                                  : theme === "navy-velvet"
                                    ? "border-[#1b3168] bg-[#FAFCFF] text-[#1b3168]"
                                    : isDark
                                      ? "border-emerald-500/60 bg-[#061510] text-emerald-100"
                                      : "border-emerald-800/60 bg-white text-emerald-900"
                            }`}
                          >
                            {/* Single Unified Field containing Juz, Hizb, and Surah information */}
                            <div 
                              className={`w-full flex items-center justify-between px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl transition-all duration-300 shadow-xs ${
                                theme === "gold-velvet"
                                  ? "bg-[#FFFEFA]"
                                  : theme === "emerald-velvet"
                                    ? "bg-[#FAFDFB]"
                                    : theme === "navy-velvet"
                                      ? "bg-[#FAFCFF]"
                                      : isDark
                                        ? "bg-[#081f18]"
                                        : "bg-white"
                              }`}
                              style={{
                                color: textCol,
                                height: '28.75px',
                              }}
                            >
                              {/* Right Side: Juz and Hizb information */}
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenIndexDrawer("quarters");
                                }}
                                title="فتح فهرس الأجزاء والأحزاب"
                                className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all h-full"
                              >
                                <span className="text-2xl sm:text-4xl md:text-5xl font-normal leading-none text-center flex items-center justify-center select-none h-full" style={{ fontFamily: "QCF4_QBSML, 'Amiri', serif", fontSize: "20px", marginLeft: "0px", marginTop: "-5px" }}>
                                  {getJuzHeaderGlyph(pageMeta.juzNum, `الجزء ${toArabicNumerals(pageMeta.juzNum)}`)}
                                </span>
                                <span className={`font-light opacity-40 text-base sm:text-xl md:text-2xl ${isDark ? "text-slate-400" : "text-slate-500"}`}>|</span>
                                <span className="quarter-name-text text-xs sm:text-sm font-normal leading-none text-center flex items-center justify-center tracking-normal select-none h-full" style={{ fontFamily: "QCF4_QBSML, 'Amiri', 'Traditional Arabic', serif", fontSize: "10px", marginTop: "-1px" }}>
                                  {quarterDisplayName}
                                </span>
                                <span className="hizb-number-text font-normal text-sm sm:text-base leading-none text-center flex items-center justify-center select-none h-full" style={{ fontFamily: "'UthmanTaha', 'UthmanTahaNaskh', serif", fontSize: "14px" }}>
                                  {hizbText}
                                </span>
                              </div>

                              <span className={`font-light opacity-30 text-base sm:text-xl md:text-2xl ${isDark ? "text-slate-400" : "text-slate-500"}`}>|</span>

                              {/* Left Side: Surah name */}
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenIndexDrawer("surahs");
                                }}
                                title="فتح فهرس السور"
                                className="flex items-center cursor-pointer hover:opacity-80 active:scale-95 transition-all h-full"
                              >
                                <span 
                                  className="text-2xl sm:text-4xl md:text-5xl font-normal leading-none text-center flex items-center justify-center select-none h-full" 
                                  style={{ fontFamily: "QCF4_QBSML, 'Amiri', 'Traditional Arabic', serif", fontSize: "12px", marginTop: "-2px" }}
                                >
                                  {getSurahHeaderGlyph(pageMeta.surahNumber, pageMeta.surahName?.startsWith("سُورَةُ") || pageMeta.surahName?.startsWith("سورة") ? pageMeta.surahName : `سُورَةُ ${pageMeta.surahName}`) || (pageMeta.surahName?.startsWith("سُورَةُ") || pageMeta.surahName?.startsWith("سورة") ? pageMeta.surahName : `سُورَةُ ${pageMeta.surahName}`)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Highlight active/hovered polygon style */}
                      <style>{`
                        #reading-screen-root,
                        #mushaf-svg-view-container,
                        #mushaf-svg-wrapper,
                        #mushaf-svg-inner-container,
                        #mushaf-aligned-page-container {
                          touch-action: ${settings.autoScrollActive ? "pan-y" : "none"} !important;
                          overscroll-behavior: none !important;
                          user-select: none !important;
                          -webkit-user-select: none !important;
                        }

                        #mushaf-svg-inner-container {
                          overflow: hidden !important;
                        }

                        #mushaf-svg-wrapper:not(.mushaf-opening-page), .mushaf-page-list-item:not(.mushaf-opening-page) {
                          aspect-ratio: ${settings.stretchMushaf || settings.autoScrollActive ? "1 / 1.82" : "1 / 1.70"} !important;
                          border: none !important;
                          border-radius: 0px !important;
                          box-shadow: none !important;
                          padding: 0px !important;
                          overflow: hidden !important;
                        }

                        #mushaf-svg-wrapper.mushaf-opening-page, .mushaf-page-list-item.mushaf-opening-page {
                          aspect-ratio: 1 / 1.05 !important;
                          max-width: 100% !important;
                          width: 100% !important;
                          margin-left: auto !important;
                          margin-right: auto !important;
                          border: none !important;
                          border-radius: 0px !important;
                          box-shadow: none !important;
                          padding: 0px !important;
                        }

                        #mushaf-svg-footer-frame {
                          margin-top: 18px !important;
                        }

                        /* 1. All text and general page paths default to black, excluding all surah frame elements */
                        #mushaf-svg-wrapper svg path:not(.ayahPolygon):not(.surah_header_frame *):not([class*="surah_frame"]):not([id*="surah_frame"]):not([class*="surah_title"]):not([id*="surah_title"]),
                        .mushaf-page-list-item svg path:not(.ayahPolygon):not(.surah_header_frame *):not([class*="surah_frame"]):not([id*="surah_frame"]):not([class*="surah_title"]):not([id*="surah_title"]) {
                          fill: #000000 !important;
                        }

                        /* 2. Ayah marker rosette ornament circle gets theme color */
                        #mushaf-svg-wrapper svg .ayah_rosette_path,
                        #mushaf-svg-wrapper svg .ayah_rosette_group path,
                        #mushaf-svg-wrapper svg .ayah_rosette_group circle,
                        #mushaf-svg-wrapper svg .ayah_rosette_group polygon,
                        #mushaf-svg-wrapper svg g[class*="rosette"] path,
                        #mushaf-svg-wrapper svg g[id*="rosette"] path,
                        #mushaf-svg-wrapper svg g[class*="ayah_marker"] path:not([class*="digit"]),
                        #mushaf-svg-wrapper svg g[id*="ayah_marker"] path:not([class*="digit"]),
                        #mushaf-svg-wrapper svg #ayah_markers path:not([class*="digit"]):not(.ayah_digit_path),
                        .mushaf-page-list-item svg .ayah_rosette_path,
                        .mushaf-page-list-item svg .ayah_rosette_group path,
                        .mushaf-page-list-item svg .ayah_rosette_group circle,
                        .mushaf-page-list-item svg .ayah_rosette_group polygon,
                        .mushaf-page-list-item svg g[class*="rosette"] path,
                        .mushaf-page-list-item svg g[id*="rosette"] path,
                        .mushaf-page-list-item svg g[class*="ayah_marker"] path:not([class*="digit"]),
                        .mushaf-page-list-item svg g[id*="ayah_marker"] path:not([class*="digit"]),
                        .mushaf-page-list-item svg #ayah_markers path:not([class*="digit"]):not(.ayah_digit_path) {
                          fill: ${
                            theme === "navy-velvet"
                              ? "#1b3168"
                              : theme === "gold-velvet"
                                ? "#c5a85c"
                                : theme === "emerald-velvet"
                                  ? (isDark ? "#34d399" : "#059669")
                                  : isDark
                                    ? "#10b981"
                                    : "#044f31"
                          } !important;
                          stroke: none !important;
                          filter: none !important;
                        }

                        /* 3. Digits and numbers inside ayah markers stay pure black */
                        #mushaf-svg-wrapper svg path.ayah_digit_path,
                        #mushaf-svg-wrapper svg .ayah_digit_group path,
                        #mushaf-svg-wrapper svg #ayah_markers path.ayah_digit_path,
                        #mushaf-svg-wrapper svg #ayah_markers .ayah_number_digits path,
                        #mushaf-svg-wrapper svg #ayah_markers [ayah\:x] path,
                        #mushaf-svg-wrapper svg #ayah_markers [ayah\:y] path,
                        #mushaf-svg-wrapper svg #ayah_markers g[ayah\:x] path,
                        #mushaf-svg-wrapper svg #ayah_markers g[ayah\:y] path,
                        #mushaf-svg-wrapper svg .ayah_markers path.ayah_digit_path,
                        #mushaf-svg-wrapper svg .ayah_markers .ayah_number_digits path,
                        #mushaf-svg-wrapper svg .ayah_markers [ayah\:x] path,
                        #mushaf-svg-wrapper svg .ayah_markers [ayah\:y] path,
                        #mushaf-svg-wrapper svg .ayah_markers g[ayah\:x] path,
                        #mushaf-svg-wrapper svg .ayah_markers g[ayah\:y] path,
                        #mushaf-svg-wrapper svg path.ayah_digit_path,
                        #mushaf-svg-wrapper svg .ayah_number_digits path,
                        #mushaf-svg-wrapper svg [ayah\:x] path,
                        #mushaf-svg-wrapper svg [ayah\:y] path,
                        #mushaf-svg-wrapper svg g[ayah\:x] path,
                        #mushaf-svg-wrapper svg g[ayah\:y] path,
                        .mushaf-page-list-item svg path.ayah_digit_path,
                        .mushaf-page-list-item svg .ayah_digit_group path,
                        .mushaf-page-list-item svg #ayah_markers path.ayah_digit_path,
                        .mushaf-page-list-item svg #ayah_markers .ayah_number_digits path,
                        .mushaf-page-list-item svg #ayah_markers [ayah\:x] path,
                        .mushaf-page-list-item svg #ayah_markers [ayah\:y] path,
                        .mushaf-page-list-item svg .ayah_markers path.ayah_digit_path,
                        .mushaf-page-list-item svg .ayah_markers .ayah_number_digits path,
                        .mushaf-page-list-item svg .ayah_markers [ayah\:x] path,
                        .mushaf-page-list-item svg .ayah_markers [ayah\:y] path,
                        .mushaf-page-list-item svg path.ayah_digit_path,
                        .mushaf-page-list-item svg .ayah_number_digits path,
                        .mushaf-page-list-item svg [ayah\:x] path,
                        .mushaf-page-list-item svg [ayah\:y] path,
                        .mushaf-page-list-item svg g[ayah\:x] path,
                        .mushaf-page-list-item svg g[ayah\:y] path {
                          fill: #000000 !important;
                        }

                        /* Hide/remove only outer page background rects inside page SVGs, NEVER surah frames */
                        #mushaf-aligned-page-container svg rect:not(.surah_header_frame rect):not([class*="surah"]):not([id*="surah"]),
                        #mushaf-svg-wrapper svg rect:not(.surah_header_frame rect):not([class*="surah"]):not([id*="surah"]),
                        .mushaf-page-list-item svg rect:not(.surah_header_frame rect):not([class*="surah"]):not([id*="surah"]),
                        #mushaf-svg-wrapper svg g[id*="page_frame"],
                        #mushaf-svg-wrapper svg g[id*="page_border"],
                        #mushaf-svg-wrapper svg g[class*="page_frame"],
                        #mushaf-svg-wrapper svg g[class*="page_border"],
                        #mushaf-svg-wrapper svg path[id*="page_frame"],
                        #mushaf-svg-wrapper svg path[id*="page_border"],
                        .mushaf-page-list-item svg g[id*="page_frame"],
                        .mushaf-page-list-item svg g[id*="page_border"] {
                          display: none !important;
                          fill: transparent !important;
                          stroke: none !important;
                          opacity: 0 !important;
                          visibility: hidden !important;
                        }

                        #mushaf-svg-wrapper:not(.mushaf-opening-page) svg, .mushaf-page-list-item:not(.mushaf-opening-page) svg {
                          width: 100% !important;
                          height: 100% !important;
                          overflow: visible !important;
                          object-fit: fill !important;
                          user-select: none;
                          filter: ${isDark && theme !== "navy-velvet" && theme !== "gold-velvet" && theme !== "emerald-velvet" ? "invert(0.93) hue-rotate(180deg) brightness(1.2) contrast(1.05)" : "none"} !important;
                        }

                        #mushaf-svg-wrapper.mushaf-opening-page svg, .mushaf-page-list-item.mushaf-opening-page svg {
                          width: 100% !important;
                          height: 100% !important;
                          overflow: visible !important;
                          object-fit: contain !important;
                          user-select: none;
                          filter: ${isDark && theme !== "navy-velvet" && theme !== "gold-velvet" && theme !== "emerald-velvet" ? "invert(0.93) hue-rotate(180deg) brightness(1.2) contrast(1.05)" : "none"} !important;
                        }

                        /* Ensure Surah header frame vector paths are clearly styled and visible in foreground */
                        #mushaf-svg-wrapper svg .surah_header_frame,
                        #mushaf-svg-wrapper svg .surah_header_frame_layer,
                        #mushaf-svg-wrapper svg [id*="surah_header_frame"],
                        #mushaf-svg-wrapper svg [class*="surah_header_frame"],
                        #mushaf-svg-wrapper svg [class*="surah_frame"],
                        #mushaf-svg-wrapper svg [id*="surah_frame"],
                        #mushaf-svg-wrapper svg [id*="surah_title"],
                        #mushaf-svg-wrapper svg [class*="surah_title"],
                        #mushaf-svg-wrapper svg [id*="surah_header"],
                        #mushaf-svg-wrapper svg [class*="surah_header"],
                        .mushaf-page-list-item svg .surah_header_frame,
                        .mushaf-page-list-item svg .surah_header_frame_layer,
                        .mushaf-page-list-item svg [id*="surah_header_frame"],
                        .mushaf-page-list-item svg [class*="surah_header_frame"],
                        .mushaf-page-list-item svg [class*="surah_frame"],
                        .mushaf-page-list-item svg [id*="surah_frame"],
                        .mushaf-page-list-item svg [id*="surah_title"],
                        .mushaf-page-list-item svg [class*="surah_title"],
                        .mushaf-page-list-item svg [id*="surah_header"],
                        .mushaf-page-list-item svg [class*="surah_header"] {
                          display: inline !important;
                          visibility: visible !important;
                          opacity: 1 !important;
                          overflow: visible !important;
                        }

                        .surah_header_frame,
                        .surah_header_frame_svg,
                        #mushaf-svg-wrapper svg .surah_header_frame,
                        #mushaf-svg-wrapper svg .surah_header_frame_layer,
                        #mushaf-svg-wrapper svg [id*="surah_header_frame"],
                        #mushaf-svg-wrapper svg [class*="surah_header_frame"],
                        #mushaf-svg-wrapper svg [class*="surah_frame"],
                        #mushaf-svg-wrapper svg [id*="surah_frame"],
                        .mushaf-page-list-item svg .surah_header_frame,
                        .mushaf-page-list-item svg .surah_header_frame_layer,
                        .mushaf-page-list-item svg [id*="surah_header_frame"],
                        .mushaf-page-list-item svg [class*="surah_header_frame"],
                        .mushaf-page-list-item svg [class*="surah_frame"],
                        .mushaf-page-list-item svg [id*="surah_frame"] {
                          display: inline !important;
                          visibility: visible !important;
                          opacity: 1 !important;
                          overflow: visible !important;
                          color: ${
                            theme === "navy-velvet"
                              ? (isDark ? "#60a5fa" : "#1b3168")
                              : theme === "gold-velvet"
                                ? (isDark ? "#fcd34d" : "#967228")
                                : theme === "emerald-velvet"
                                  ? (isDark ? "#34d399" : "#044f31")
                                  : isDark
                                    ? "#34d399"
                                    : "#044f31"
                          } !important;
                          --surah-frame-stroke: ${
                            theme === "navy-velvet"
                              ? (isDark ? "#60a5fa" : "#1b3168")
                              : theme === "gold-velvet"
                                ? (isDark ? "#fcd34d" : "#967228")
                                : theme === "emerald-velvet"
                                  ? (isDark ? "#34d399" : "#044f31")
                                  : isDark
                                    ? "#34d399"
                                    : "#044f31"
                          };
                          --surah-inner-stroke: ${
                            theme === "navy-velvet"
                              ? (isDark ? "#60a5fa" : "#1b3168")
                              : theme === "gold-velvet"
                                ? (isDark ? "#fcd34d" : "#967228")
                                : theme === "emerald-velvet"
                                  ? (isDark ? "#34d399" : "#044f31")
                                  : isDark
                                    ? "#34d399"
                                    : "#044f31"
                          };
                          --surah-inner-fill: ${
                            theme === "navy-velvet"
                              ? (isDark ? "rgba(96, 165, 250, 0.1)" : "rgba(27, 49, 104, 0.05)")
                              : theme === "gold-velvet"
                                ? (isDark ? "rgba(252, 211, 77, 0.1)" : "rgba(150, 114, 40, 0.05)")
                                : theme === "emerald-velvet"
                                  ? (isDark ? "rgba(52, 211, 153, 0.1)" : "rgba(4, 79, 49, 0.05)")
                                  : isDark
                                    ? "rgba(52, 211, 153, 0.1)"
                                    : "rgba(4, 79, 49, 0.04)"
                          };
                          --surah-accent-solid: ${
                            theme === "navy-velvet"
                              ? (isDark ? "#60a5fa" : "#3b82f6")
                              : theme === "gold-velvet"
                                ? (isDark ? "#fcd34d" : "#c5a85c")
                                : theme === "emerald-velvet"
                                  ? (isDark ? "#34d399" : "#10b981")
                                  : isDark
                                    ? "#34d399"
                                    : "#10b981"
                          };
                          --surah-accent-deep: ${
                            theme === "navy-velvet"
                              ? (isDark ? "#2563eb" : "#1b3168")
                              : theme === "gold-velvet"
                                ? (isDark ? "#f59e0b" : "#715112")
                                : theme === "emerald-velvet"
                                  ? (isDark ? "#059669" : "#044f31")
                                  : isDark
                                    ? "#059669"
                                    : "#044f31"
                          };
                          --surah-highlight: ${
                            theme === "navy-velvet"
                              ? (isDark ? "#bfdbfe" : "#ffffff")
                              : theme === "gold-velvet"
                                ? (isDark ? "#fef08a" : "#ffffff")
                                : theme === "emerald-velvet"
                                  ? (isDark ? "#a7f3d0" : "#ffffff")
                                  : isDark
                                    ? "#a7f3d0"
                                    : "#ffffff"
                          };
                          --surah-grad-high: ${
                            theme === "navy-velvet"
                              ? (isDark ? "#bfdbfe" : "#dbeafe")
                              : theme === "gold-velvet"
                                ? (isDark ? "#fef08a" : "#fef9c3")
                                : theme === "emerald-velvet"
                                  ? (isDark ? "#a7f3d0" : "#d1fae5")
                                  : isDark
                                    ? "#a7f3d0"
                                    : "#e6f4ea"
                          };
                          --surah-grad-mid: ${
                            theme === "navy-velvet"
                              ? (isDark ? "#60a5fa" : "#3b82f6")
                              : theme === "gold-velvet"
                                ? (isDark ? "#fcd34d" : "#c5a85c")
                                : theme === "emerald-velvet"
                                  ? (isDark ? "#34d399" : "#10b981")
                                  : isDark
                                    ? "#34d399"
                                    : "#10b981"
                          };
                          --surah-grad-deep: ${
                            theme === "navy-velvet"
                              ? (isDark ? "#1e3a8a" : "#1b3168")
                              : theme === "gold-velvet"
                                ? (isDark ? "#92400e" : "#715112")
                                : theme === "emerald-velvet"
                                  ? (isDark ? "#064e3b" : "#044f31")
                                  : isDark
                                    ? "#064e3b"
                                    : "#044f31"
                          };
                        }

                        .surah_header_frame .surah_frame_outer_border,
                        #mushaf-svg-wrapper svg .surah_header_frame .surah_frame_outer_border,
                        .mushaf-page-list-item svg .surah_header_frame .surah_frame_outer_border {
                          fill: none !important;
                          stroke: currentColor !important;
                        }

                        .surah_header_frame .surah_frame_cartouche_bg,
                        #mushaf-svg-wrapper svg .surah_header_frame .surah_frame_cartouche_bg,
                        .mushaf-page-list-item svg .surah_header_frame .surah_frame_cartouche_bg {
                          fill: none !important;
                          stroke: none !important;
                        }

                        .surah_header_frame .surah_frame_inner_contour,
                        #mushaf-svg-wrapper svg .surah_header_frame .surah_frame_inner_contour,
                        .mushaf-page-list-item svg .surah_header_frame .surah_frame_inner_contour {
                          fill: var(--surah-inner-fill, rgba(0,0,0,0.04)) !important;
                          stroke: currentColor !important;
                        }

                        /* Prevent Surah header background/border paths from turning into solid black blocks */
                        #mushaf-svg-wrapper svg [id*="surah"] path[class*="bg"],
                        #mushaf-svg-wrapper svg [id*="surah"] path[id*="bg"],
                        #mushaf-svg-wrapper svg [id*="frame"] path[class*="bg"],
                        #mushaf-svg-wrapper svg [id*="frame"] path[id*="bg"],
                        #mushaf-svg-wrapper svg [class*="frame"] path[class*="bg"],
                        .mushaf-page-list-item svg [id*="surah"] path[class*="bg"],
                        .mushaf-page-list-item svg [id*="surah"] path[id*="bg"],
                        .mushaf-page-list-item svg [id*="frame"] path[class*="bg"],
                        .mushaf-page-list-item svg [id*="frame"] path[id*="bg"] {
                          fill: none !important;
                        }

                        #mushaf-svg-wrapper svg [id*="surah"] path[class*="border"],
                        #mushaf-svg-wrapper svg [id*="surah"] path[id*="border"],
                        #mushaf-svg-wrapper svg [id*="frame"] path[class*="border"],
                        #mushaf-svg-wrapper svg [id*="frame"] path[id*="border"],
                        .mushaf-page-list-item svg [id*="surah"] path[class*="border"],
                        .mushaf-page-list-item svg [id*="surah"] path[id*="border"],
                        .mushaf-page-list-item svg [id*="frame"] path[class*="border"],
                        .mushaf-page-list-item svg [id*="frame"] path[id*="border"] {
                          stroke: ${
                            theme === "navy-velvet"
                              ? (isDark ? "#60a5fa" : "#2563eb")
                              : theme === "gold-velvet"
                                ? (isDark ? "#fcd34d" : "#967228")
                                : theme === "emerald-velvet"
                                  ? (isDark ? "#34d399" : "#044f31")
                                  : isDark
                                    ? "#34d399"
                                    : "#044f31"
                          } !important;
                          stroke-width: 1.5px !important;
                        }

                        #mushaf-svg-wrapper svg text:not(.ayahPolygon):not(.surah_header_frame text):not([class*="surah_title"]):not([id*="surah_title"]):not([class*="surah_header"]):not([id*="surah_header"]),
                        .mushaf-page-list-item svg text:not(.ayahPolygon):not(.surah_header_frame text):not([class*="surah_title"]):not([id*="surah_title"]):not([class*="surah_header"]):not([id*="surah_header"]) {
                          fill: #000000 !important;
                        }

                        #mushaf-svg-wrapper svg .surah_header_frame text,
                        #mushaf-svg-wrapper svg .surah_header_text,
                        #mushaf-svg-wrapper svg [id*="surah_title"],
                        #mushaf-svg-wrapper svg [class*="surah_title"],
                        #mushaf-svg-wrapper svg [id*="surah_header"] text,
                        #mushaf-svg-wrapper svg [class*="surah_header"] text,
                        .mushaf-page-list-item svg .surah_header_frame text,
                        .mushaf-page-list-item svg .surah_header_text,
                        .mushaf-page-list-item svg [id*="surah_title"],
                        .mushaf-page-list-item svg [class*="surah_title"],
                        .mushaf-page-list-item svg [id*="surah_header"] text,
                        .mushaf-page-list-item svg [class*="surah_header"] text {
                          display: none !important;
                          visibility: hidden !important;
                          opacity: 0 !important;
                        }

                        #mushaf-svg-wrapper .ayahPolygon, .mushaf-page-list-item .ayahPolygon {
                          fill: transparent !important;
                          fill-opacity: 0 !important;
                          cursor: pointer !important;
                          transition: none !important;
                          animation: none !important;
                        }
                        #mushaf-svg-wrapper .ayahPolygon:hover, .mushaf-page-list-item .ayahPolygon:hover {
                          fill: ${theme === "navy-velvet" ? "#3F63C6" : theme === "emerald-velvet" ? "#34d399" : theme === "gold-velvet" ? "#c5a85c" : "#10b981"} !important;
                          fill-opacity: ${theme === "navy-velvet" || theme === "gold-velvet" || theme === "emerald-velvet" ? "0.09" : "0.07"} !important;
                          transition: none !important;
                          animation: none !important;
                        }
                        #mushaf-svg-wrapper svg text, #mushaf-svg-wrapper svg path:not(.ayahPolygon),
                        .mushaf-page-list-item svg text, .mushaf-page-list-item svg path:not(.ayahPolygon) {
                          pointer-events: none !important;
                        }
                        ${activeSelector}

                        @media (orientation: landscape) {
                          #reading-screen-root {
                            padding-top: ${showBars ? "56px" : "4px"} !important;
                            padding-bottom: ${showBars ? "64px" : "4px"} !important;
                          }
                          #mushaf-aligned-page-container {
                            max-width: 100% !important;
                            width: 100% !important;
                            gap: 6px !important;
                            margin-top: 12px !important;
                          }
                          #mushaf-svg-view-container {
                            padding: 0 !important;
                            gap: 6px !important;
                          }
                          #mushaf-svg-header-frame {
                            margin-top: -4px !important;
                            height: 35.25px !important;
                            padding: 2px 12px !important;
                            margin-bottom: 12px !important;
                            font-size: 10px !important;
                            width: 100% !important;
                            max-width: 100% !important;
                          }
                          #mushaf-svg-header-frame > div {
                            height: 28.75px !important;
                            display: flex !important;
                            align-items: center !important;
                          }
                          #mushaf-svg-header-frame > div:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1) {
                            font-size: 20px !important;
                          }
                          #mushaf-svg-header-frame .quarter-name-text {
                            font-family: QCF4_QBSML, 'Amiri', 'Traditional Arabic', serif !important;
                            font-size: 10px !important;
                            font-weight: normal !important;
                          }
                          #mushaf-svg-header-frame .hizb-number-text {
                            font-family: 'UthmanTaha', 'UthmanTahaNaskh', serif !important;
                            font-size: 13.5px !important;
                            font-weight: normal !important;
                          }
                          #mushaf-svg-header-frame > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1) {
                            font-size: 12px !important;
                            margin-top: -2px !important;
                          }
                          #mushaf-svg-wrapper:not(.mushaf-opening-page), .mushaf-page-list-item:not(.mushaf-opening-page) {
                            position: relative !important;
                            width: 100% !important;
                            max-width: 100% !important;
                            height: auto !important;
                            max-height: none !important;
                            background-color: ${
                              theme === "emerald-velvet"
                                ? "#FAFDFB"
                                : theme === "gold-velvet"
                                  ? "#FFFEFA"
                                  : theme === "navy-velvet"
                                    ? "#FAFCFF"
                                    : isDark
                                      ? "#061510" /* Beautiful deep forest green dark background */
                                      : "#FFFFFF"
                            } !important;
                            border: none !important;
                            border-radius: 0px !important;
                            box-shadow: none !important;
                            display: flex !important;
                            justify-content: center !important;
                            align-items: center !important;
                            padding: 0px !important;
                            box-sizing: border-box !important;
                            aspect-ratio: ${settings.stretchMushaf || settings.autoScrollActive ? "1 / 1.82" : "1 / 1.70"} !important;
                          }
                          #mushaf-svg-wrapper.mushaf-opening-page, .mushaf-page-list-item.mushaf-opening-page {
                            aspect-ratio: 1 / 1.05 !important;
                            max-width: 100% !important;
                            width: 100% !important;
                          }
                          #mushaf-svg-inner-container, .mushaf-page-list-inner {
                            width: 100% !important;
                            height: 100% !important;
                            padding: 0 !important;
                            display: flex !important;
                            justify-content: center !important;
                            align-items: center !important;
                          }
                          #mushaf-svg-wrapper:not(.mushaf-opening-page) svg, .mushaf-page-list-item:not(.mushaf-opening-page) svg,
                          #mushaf-svg-inner-container:not(.mushaf-opening-page) svg, .mushaf-page-list-inner:not(.mushaf-opening-page) svg {
                            width: 100% !important;
                            height: 100% !important;
                            object-fit: fill !important;
                          }
                          #mushaf-svg-wrapper.mushaf-opening-page svg, .mushaf-page-list-item.mushaf-opening-page svg {
                            width: 100% !important;
                            height: 100% !important;
                            object-fit: contain !important;
                          }
                          #mushaf-svg-footer-frame {
                            margin-top: 18px !important;
                            margin-left: 0px !important;
                            padding-top: 0px !important;
                            padding-bottom: 0px !important;
                            padding-left: 9px !important;
                            font-size: 13.75px !important;
                            height: 35px !important;
                            width: 100% !important;
                            max-width: 100% !important;
                            box-sizing: border-box !important;
                            display: grid !important;
                            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                            align-items: center !important;
                          }
                          #mushaf-svg-footer-frame > div:nth-of-type(1) {
                            height: 100% !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: flex-start !important;
                            margin: 0 !important;
                          }
                          #mushaf-svg-footer-frame > div:nth-of-type(1) > button:nth-of-type(1) {
                            width: 29.25px !important;
                            height: 24px !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            display: inline-flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            overflow: hidden !important;
                            box-sizing: border-box !important;
                          }
                          #mushaf-svg-footer-frame > div:nth-of-type(1) > button:nth-of-type(1) > span {
                            display: none !important;
                          }
                          #mushaf-svg-footer-frame > div:nth-of-type(1) > button:nth-of-type(1) > div:nth-of-type(1) {
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            width: 100% !important;
                            height: 100% !important;
                            overflow: hidden !important;
                          }
                          #mushaf-svg-footer-frame > div:nth-of-type(1) > button:nth-of-type(1) > div:nth-of-type(1) > svg:nth-of-type(1) {
                            height: 19.7444px !important;
                            width: 18.7444px !important;
                            max-height: 20px !important;
                            max-width: 20px !important;
                            flex-shrink: 0 !important;
                          }
                          #mushaf-svg-footer-frame > div:nth-of-type(2) {
                            height: 100% !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            margin: 0 !important;
                          }
                          #mushaf-svg-footer-frame > div:nth-of-type(2) > span:nth-of-type(1) {
                            font-family: 'UthmanTaha', 'UthmanTahaNaskh', serif !important;
                            font-size: 16px !important;
                            font-weight: normal !important;
                            line-height: 1 !important;
                            border: none !important;
                            background: transparent !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            width: auto !important;
                            min-width: 8.134px !important;
                            height: 22.6634px !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                          }
                          #mushaf-svg-footer-frame > div:nth-of-type(3) {
                            height: 100% !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: flex-end !important;
                            margin: 0 !important;
                          }
                          #mushaf-svg-footer-frame > div:nth-of-type(3) > div:nth-of-type(1) {
                            font-size: 9.75px !important;
                            padding: 1px !important;
                            height: 25px !important;
                            width: 36px !important;
                            margin: 0 !important;
                            display: inline-flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                          }
                          #mushaf-svg-footer-frame > div:nth-of-type(3) > div:nth-of-type(1) > svg:nth-of-type(1) {
                            height: 23.5058px !important;
                            width: auto !important;
                          }
                          #mushaf-svg-slider-container {
                            margin-top: 2px !important;
                            margin-bottom: 2px !important;
                            max-width: 95vw !important;
                            width: 95vw !important;
                          }
                          #mushaf-svg-page-medallion-container {
                            margin-top: 4px !important;
                            margin-bottom: 2px !important;
                          }
                        }
                      `}</style>

                      {/* 2. SVG Canvas wrapper / Image Canvas wrapper */}
                      {settings.autoScrollActive && autoScrollStartPage !== null ? (
                        /* Vertical continuous list of pages */
                        <div 
                          className="w-full flex flex-col gap-6 sm:gap-8"
                          onTouchStart={handleSvgTouchStart}
                          onTouchEnd={handleSvgTouchEnd}
                          onTouchCancel={handleTouchCancel}
                          onTouchMove={handleSvgTouchMove}
                          onMouseDown={handleSvgMouseDown}
                          onMouseUp={handleSvgMouseUp}
                          onMouseMove={handleSvgMouseMove}
                          onMouseLeave={handleMouseLeave}
                          style={{ touchAction: "pan-y" }}
                        >
                          {Array.from({ length: Math.min(30, 605 - autoScrollStartPage) }, (_, idx) => {
                            const pageNum = autoScrollStartPage + idx;
                            const content = pagesSvg[pageNum];
                            
                            return (
                              <div 
                                key={pageNum}
                                data-mushaf-page={pageNum}
                                className="w-full flex flex-col items-center gap-2"
                              >
                                {/* Page Indicator Label */}
                                <div className={`text-[10px] font-bold px-3 py-1 rounded-full border select-none ${
                                  theme === "gold-velvet"
                                    ? "bg-[#c5a85c]/10 text-amber-900 border-[#c5a85c]/20"
                                    : theme === "navy-velvet"
                                      ? "bg-slate-50 text-slate-500 border-slate-200"
                                      : isDark
                                        ? "bg-slate-900/60 text-slate-400 border-slate-800"
                                        : "bg-amber-50/50 text-amber-900 border-amber-100/50"
                                }`}>
                                  الصفحة {toArabicNumerals(pageNum)}
                                </div>

                                 {/* Surah Header Frame for Opening Pages (Surah Al-Fatihah & Surah Al-Baqarah) */}
                                {(pageNum === 1 || pageNum === 2) && (
                                  <div className="w-full px-1 sm:px-2 pt-0.5 pb-1">
                                    <SurahHeaderFrame
                                      surahNumber={pageNum === 1 ? 1 : 2}
                                      surahName={pageNum === 1 ? "سُورَةُ الفَاتِحَةِ" : "سُورَةُ البَقَرَةِ"}
                                      theme={theme}
                                      isDark={isDark}
                                      onOpenIndex={handleOpenIndexDrawer}
                                    />
                                  </div>
                                )}

                                <div 
                                  onClick={handleSvgClick}
                                  onDoubleClick={handleSvgDoubleClick}
                                  onTouchStart={handleSvgTouchStart}
                                  onTouchEnd={handleSvgTouchEnd}
                                  onTouchMove={handleSvgTouchMove}
                                  onMouseDown={handleSvgMouseDown}
                                  onMouseUp={handleSvgMouseUp}
                                  onMouseMove={handleSvgMouseMove}
                                  className={`mushaf-page-list-item relative w-full ${
                                    pageNum === 1 || pageNum === 2
                                      ? "mushaf-opening-page aspect-square sm:aspect-[1/1.05]"
                                      : (settings.stretchMushaf || settings.autoScrollActive ? "aspect-[1/1.82]" : "aspect-[1/1.70]")
                                  } ${settings.autoScrollActive ? "rounded-none" : "rounded-2xl sm:rounded-3xl"} overflow-hidden flex items-center justify-center cursor-pointer select-none ${
                                    theme === "gold-velvet"
                                      ? "bg-[#FFFEFA] border border-[#c5a85c]/40 text-black shadow-[0_12px_40px_rgba(197,168,92,0.15)]"
                                      : theme === "emerald-velvet"
                                        ? "bg-[#FAFDFB] border border-[#34d399]/40 text-black shadow-[0_12px_40px_rgba(52,211,153,0.15)]"
                                        : theme === "navy-velvet"
                                          ? "bg-[#FAFCFF] border-2 border-[#3F63C6]/30 text-slate-900 shadow-[0_12px_40px_rgba(63,99,198,0.12)]"
                                          : isDark
                                            ? "bg-[#061510] border-2 border-emerald-500/25 text-emerald-100 shadow-[0_12px_40px_rgba(16,185,129,0.04)]"
                                            : "bg-white border-2 border-emerald-800/22 text-slate-900 shadow-[0_12px_40px_rgba(15,76,58,0.06)]"
                                  }`}
                                >
                                  {content ? (
                                    <div 
                                      className="mushaf-page-list-inner w-full h-full p-0 sm:p-0.5 flex items-center justify-center"
                                      dangerouslySetInnerHTML={{ 
                                        __html: (pageNum !== 1 && pageNum !== 2) 
                                          ? content.replace(/<svg\s([^>]*)>/i, (match, p1) => p1.includes('preserveAspectRatio') ? `<svg ${p1.replace(/preserveAspectRatio="[^"]*"/i, 'preserveAspectRatio="none"')}>` : `<svg ${p1} preserveAspectRatio="none">`) 
                                          : content 
                                      }} 
                                    />
                                  ) : (
                                    <div className="text-center py-24 space-y-3 w-full">
                                      <div className={`inline-block animate-spin rounded-full h-8 w-8 border-4 ${
                                        theme === "navy-velvet" ? "border-[#3F63C6]" :
                                        theme === "gold-velvet" ? "border-[#c5a85c]" :
                                        theme === "emerald-velvet" ? "border-[#34d399]" :
                                        isDark ? "border-emerald-500" : "border-emerald-600"
                                      } border-t-transparent`}></div>
                                      <p className={`text-xs font-semibold ${
                                        theme === "emerald-velvet" ? "text-[#34d399]" :
                                        theme === "gold-velvet" ? "text-[#c5a85c]" :
                                        theme === "navy-velvet" ? "text-[#3F63C6]" :
                                        isDark ? "text-emerald-400" : "text-emerald-800"
                                      }`}>جاري تحميل الصفحة {toArabicNumerals(pageNum)}...</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Single Page Mode with Swipe */
                        <div className="w-full flex flex-col items-center">
                          {/* Surah Header Frame for Opening Pages (Surah Al-Fatihah & Surah Al-Baqarah) */}
                          {(currentPage === 1 || currentPage === 2) && (
                            <div className="w-full px-1 sm:px-2 pt-0.5 pb-1">
                              <SurahHeaderFrame
                                surahNumber={currentPage === 1 ? 1 : 2}
                                surahName={currentPage === 1 ? "سُورَةُ الفَاتِحَةِ" : "سُورَةُ البَقَرَةِ"}
                                theme={theme}
                                isDark={isDark}
                                onOpenIndex={handleOpenIndexDrawer}
                              />
                            </div>
                          )}
                          <div 
                            id="mushaf-svg-wrapper"
                            onTouchStart={handleSvgTouchStart}
                            onTouchEnd={handleSvgTouchEnd}
                            onTouchCancel={handleTouchCancel}
                            onTouchMove={handleSvgTouchMove}
                            onMouseDown={handleSvgMouseDown}
                            onMouseUp={handleSvgMouseUp}
                            onMouseMove={handleSvgMouseMove}
                            onMouseLeave={handleMouseLeave}
                            onClick={handleSvgClick}
                            onDoubleClick={handleSvgDoubleClick}
                            style={{ 
                              touchAction: settings.autoScrollActive ? "pan-y" : "none"
                            }}
                            className={`relative w-full ${
                              currentPage === 1 || currentPage === 2
                                ? "mushaf-opening-page aspect-square sm:aspect-[1/1.05]"
                                : (settings.stretchMushaf || settings.autoScrollActive ? "aspect-[1/1.82]" : "aspect-[1/1.70]")
                            } ${settings.autoScrollActive ? "rounded-none" : "rounded-2xl sm:rounded-3xl"} overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
                              theme === "gold-velvet"
                                ? "bg-[#FFFEFA] border border-[#c5a85c]/40 text-black shadow-[0_12px_40px_rgba(197,168,92,0.15)]"
                                : theme === "emerald-velvet"
                                  ? "bg-[#FAFDFB] border border-[#34d399]/40 text-black shadow-[0_12px_40px_rgba(52,211,153,0.15)]"
                                  : theme === "navy-velvet"
                                    ? "bg-[#FAFCFF] border-2 border-[#1b3168]/30 text-slate-900 shadow-[0_12px_40px_rgba(27,49,104,0.12)]"
                                    : isDark
                                      ? "bg-[#061510] border-2 border-emerald-500/25 text-emerald-100 shadow-[0_12px_40px_rgba(16,185,129,0.04)]"
                                      : "bg-white border-2 border-emerald-800/22 text-slate-900 shadow-[0_12px_40px_rgba(15,76,58,0.06)]"
                            }`}
                          >
                            <div 
                              id="mushaf-svg-inner-container"
                              className="w-full h-full p-0 flex items-center justify-center overflow-hidden relative"
                            >
                              {settings.pageMode === "qcf4" || settings.mushafProvider === "qcf4" || settings.quranFont === "qcf4" ? (
                                <Qcf4PageRenderer
                                  pageNumber={currentPage}
                                  activeAyahKey={
                                    selectedAyah 
                                      ? `${(selectedAyah as any).surah?.number || surahNumber}:${selectedAyah.numberInSurah}` 
                                      : (playingIndex !== null && ayahs[playingIndex] ? `${(ayahs[playingIndex] as any).surah?.number || surahNumber}:${ayahs[playingIndex].numberInSurah}` : undefined)
                                  }
                                  onAyahClick={(aObj) => {
                                    const matchingAyah = (pageAyahs.length > 0 ? pageAyahs : ayahs).find(
                                      a => (a.surah?.number || surahNumber) === aObj.surah && a.numberInSurah === aObj.ayah
                                    ) || ayahs.find(a => a.numberInSurah === aObj.ayah);
                                    if (matchingAyah) {
                                      if (matchingAyah.surah?.number && matchingAyah.surah.number !== surahNumber && onChangeSurah) {
                                        onChangeSurah(matchingAyah.surah.number, matchingAyah.numberInSurah, currentPage);
                                      }
                                      handleAyahClick(matchingAyah);
                                    } else {
                                      if (onToggleBars) {
                                        onToggleBars();
                                      } else if (onShowBarsChange) {
                                        onShowBarsChange(true);
                                      }
                                    }
                                  }}
                                  onAyahDoubleClick={(aObj) => {
                                    const matchingAyah = (pageAyahs.length > 0 ? pageAyahs : ayahs).find(
                                      a => (a.surah?.number || surahNumber) === aObj.surah && a.numberInSurah === aObj.ayah
                                    ) || ayahs.find(a => a.numberInSurah === aObj.ayah);
                                    if (matchingAyah) {
                                      if (matchingAyah.surah?.number && matchingAyah.surah.number !== surahNumber && onChangeSurah) {
                                        onChangeSurah(matchingAyah.surah.number, matchingAyah.numberInSurah, currentPage);
                                      }
                                      handleAyahDoubleClick(matchingAyah);
                                    }
                                  }}
                                  isDark={isDark}
                                  theme={theme}
                                  hideFrame={true}
                                />
                              ) : svgError ? (
                                <div className="text-center py-10 flex flex-col items-center justify-center gap-4 px-4">
                                  <p className="text-red-500 font-semibold text-xs sm:text-sm">{svgError}</p>
                                  <button
                                    onClick={() => {
                                      setSvgError(null);
                                      setSvgLoading(true);
                                      setPagesSvg(prev => {
                                        const copy = { ...prev };
                                        delete copy[currentPage];
                                        return copy;
                                      });
                                    }}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition shadow-md active:scale-95 cursor-pointer"
                                  >
                                    إعادة المحاولة
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  className="w-full h-full flex items-center justify-center"
                                  dangerouslySetInnerHTML={{ 
                                    __html: (() => {
                                      const pageSvg = pagesSvg[currentPage] || svgContent;
                                      return (currentPage !== 1 && currentPage !== 2 && pageSvg) 
                                        ? pageSvg.replace(/<svg\s([^>]*)>/i, (match, p1) => p1.includes('preserveAspectRatio') ? `<svg ${p1.replace(/preserveAspectRatio="[^"]*"/i, 'preserveAspectRatio="none"')}>` : `<svg ${p1} preserveAspectRatio="none">`) 
                                        : (pageSvg || "");
                                    })()
                                  }} 
                                />
                              )}

                              {svgLoading && !pagesSvg[currentPage] && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-[1px] z-20 pointer-events-none">
                                  <div className={`animate-spin rounded-full h-8 w-8 border-3 ${
                                    theme === "navy-velvet" ? "border-[#3F63C6]" :
                                    theme === "gold-velvet" ? "border-[#c5a85c]" :
                                    theme === "emerald-velvet" ? "border-[#34d399]" :
                                    isDark ? "border-emerald-500" : "border-emerald-600"
                                  } border-t-transparent`}></div>
                                  <p className="text-xs font-semibold mt-2 opacity-80">جاري تحميل الصفحة {toArabicNumerals(currentPage)}...</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. Beautiful Bordered Row for Page Number & Location indicator under the page */}
                      {(() => {
                        const isRightPage = currentPage % 2 !== 0;
                        return (
                          <div 
                            id="mushaf-svg-footer-frame"
                            style={{
                              height: "35px",
                              width: "100%",
                              maxWidth: "100%",
                              marginTop: "18px",
                              marginLeft: "0px",
                              boxSizing: "border-box",
                            }}
                            className={`w-full rounded-xl px-4 py-0 grid grid-cols-3 items-center text-xs sm:text-sm font-bold select-none border-2 shadow-xs ${
                              theme === "gold-velvet"
                                ? "border-[#c5a85c]/40 bg-[#FFFEFA] text-black"
                                : theme === "emerald-velvet"
                                  ? "border-[#34d399]/40 bg-[#FAFDFB] text-[#011c14]"
                                  : theme === "navy-velvet"
                                      ? "border-[#1b3168]/30 bg-[#FAFCFF] text-[#1b3168]"
                                      : isDark
                                        ? "border-emerald-500/25 bg-[#061510] text-emerald-100"
                                        : "border-emerald-800/20 bg-white text-emerald-900"
                            }`}
                          >
                              {/* Column 1 (Right in RTL): Auto-Scroll Toggle */}
                            <div className="flex items-center justify-start select-none h-full">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleAutoScroll();
                                }}
                                style={{
                                  width: "29.25px",
                                  height: "24px",
                                }}
                                className={`flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-300 shadow-xs border-2 cursor-pointer ${
                                  settings.autoScrollActive
                                    ? theme === "navy-velvet"
                                      ? "bg-[#1b3168] border-[#1b3168] text-white"
                                      : theme === "gold-velvet" || theme === "emerald-velvet"
                                        ? "bg-[#c5a85c] border-[#c5a85c] text-[#011a12]"
                                        : "bg-emerald-600 border-emerald-600 text-white"
                                    : theme === "navy-velvet"
                                      ? "bg-[#1b3168]/10 border-[#1b3168]/50 text-[#1b3168] hover:bg-[#1b3168]/20"
                                      : theme === "gold-velvet"
                                        ? "bg-[#FFFEFA] border-[#c5a85c]/60 text-[#c5a85c] hover:bg-[#c5a85c]/10"
                                        : theme === "emerald-velvet"
                                          ? "bg-[#FAFDFB] border-[#34d399]/60 text-[#10b981] hover:bg-[#FAFDFB]"
                                          : isDark
                                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                                            : "bg-emerald-50 border-emerald-800/40 text-emerald-850 hover:bg-emerald-100/50"
                                }`}
                                title={settings.autoScrollActive ? "إيقاف التمرير التلقائي" : "تشغيل التمرير التلقائي"}
                              >
                                <div className="flex items-center justify-center w-full h-full">
                                  <ChevronsUp 
                                    size={19} 
                                    className={`${settings.autoScrollActive ? "animate-bounce stroke-[2.8px]" : "stroke-[2.2px]"} w-[18.74px] h-[19.74px]`}
                                  />
                                </div>
                              </button>
                            </div>

                              {/* Column 2 (Middle): Centered Page Number */}
                            <div className="flex justify-center items-center">
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenIndex?.("go");
                                }}
                                title="فتح فهرس الصفحات والتنقل"
                                className="font-normal text-center cursor-pointer hover:opacity-75 active:scale-95 flex items-center justify-center select-none"
                                style={{
                                  fontFamily: "'UthmanTaha', 'UthmanTahaNaskh', serif",
                                  color: theme === "emerald-velvet" || theme === "gold-velvet" ? "#011c14" : theme === "navy-velvet" ? "#1b3168" : isDark ? "#34d399" : "#044f31",
                                  fontSize: "16px",
                                  height: "22.66px",
                                }}
                              >
                                {toArabicNumerals(currentPage)}
                              </span>
                            </div>

                            {/* Column 3 (Left in RTL): Page position indicator and icon */}
                            <div className="flex items-center gap-2 justify-end select-none h-full">
                              <span className="text-sm sm:text-base md:text-lg font-bold opacity-85 hidden xs:inline">
                                {isRightPage ? "صَفْحَة يَمِين" : "صَفْحَة يَسَار"}
                              </span>
                              {/* Page position icon on the left of the text */}
                              <div 
                                className="flex items-center justify-center p-0.5 rounded-md"
                                style={{
                                  color: theme === "emerald-velvet" ? "#34d399" : theme === "gold-velvet" ? "#c5a85c" : theme === "navy-velvet" ? "#3b82f6" : isDark ? "#10b981" : "#065f46",
                                  height: "25px",
                                  width: "36px",
                                }}
                                title={isRightPage ? "الصفحة الحالية على اليمين" : "الصفحة الحالية على اليسار"}
                              >
                                <svg
                                  viewBox="0 0 34 26"
                                  style={{ height: "23.5px" }}
                                  className={`h-[23.5px] w-auto ${isRightPage ? "-scale-x-100" : "scale-x-100"}`}
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.1"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  {/* Central separating spine line */}
                                  <line x1="16.5" y1="4" x2="16.5" y2="22" strokeWidth="2.1" />

                                  {/* Left Flat Page Frame (widened) */}
                                  <path d="M 16.5 4.5 L 3.5 4.5 C 2.7 4.5 2 5.2 2 6 L 2 20 C 2 20.8 2.7 21.5 3.5 21.5 L 16.5 21.5" />
                                  
                                  {/* 4 Horizontal text lines on the flat page (widened) */}
                                  <line x1="4.5" y1="8" x2="13.5" y2="8" strokeWidth="1.9" />
                                  <line x1="4.5" y1="11.5" x2="13.5" y2="11.5" strokeWidth="1.9" />
                                  <line x1="4.5" y1="15" x2="13.5" y2="15" strokeWidth="1.9" />
                                  <line x1="4.5" y1="18.5" x2="13.5" y2="18.5" strokeWidth="1.9" />

                                  {/* Turning Page 1 (Front curved open page) */}
                                  <path d="M 16.5 4.5 C 20 1.8 24.5 2.2 27.5 4.5 C 27.5 9.5 27.5 15 27.5 19 C 24.5 17 20 16.5 16.5 21.5" />

                                  {/* Turning Page 2 (Back page leaf / cover depth) */}
                                  <path d="M 27.5 5.5 C 29.5 6 32 7.5 32 10 L 32 20.5 C 29 19 24.5 19 16.5 21.5" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
              </div>
            ) : effectivePageMode === "page-by-page" ? (
              /* Beautiful Written Page-by-Page View with Swipe/Drag support */
              <div id="mushaf-page-by-page-container" className="flex flex-col items-center gap-4 w-full" dir="rtl">
                {pageLoading ? (
                  <div className="text-center py-24 space-y-3 w-full">
                    <div className={`inline-block animate-spin rounded-full h-8 w-8 border-4 ${
                      theme === "navy-velvet" ? "border-[#3F63C6]" :
                      theme === "gold-velvet" ? "border-[#c5a85c]" :
                      theme === "emerald-velvet" ? "border-[#34d399]" :
                      isDark ? "border-emerald-500" : "border-emerald-600"
                    } border-t-transparent`}></div>
                    <p className={`text-sm font-semibold ${
                      theme === "emerald-velvet" ? "text-[#34d399]" :
                      theme === "gold-velvet" ? "text-[#c5a85c]" :
                      theme === "navy-velvet" ? "text-[#3F63C6]" :
                      isDark ? "text-emerald-400" : "text-emerald-800"
                    }`}>جاري تحميل الصفحة {toArabicNumerals(currentPage)}...</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={currentPage}
                      id="mushaf-page-by-page-canvas"
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchCancel}
                      onTouchMove={handleSvgTouchMove}
                      onMouseDown={handleMouseDown}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasSwipedRef.current) {
                          hasSwipedRef.current = false;
                          return;
                        }
                        toggleBarsUnified(undefined, e);
                      }}
                      style={{ touchAction: settings.autoScrollActive ? "pan-y" : "none" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeInOut" }}
                      className={`relative w-full max-w-3xl rounded-3xl p-6 sm:p-8 md:p-10 text-right select-none transition-all duration-300 border cursor-grab active:cursor-grabbing ${
                        theme === "gold-velvet"
                          ? "bg-white border-[#c5a85c]/40 text-[#012c1e] shadow-[0_12px_45px_rgba(3,46,34,0.08)]"
                          : theme === "navy-velvet"
                          ? "bg-[#FFFFFF] border-slate-200 text-slate-900 shadow-sm"
                          : isDark 
                            ? "bg-slate-900 border-slate-850 shadow-none text-slate-100" 
                            : "bg-white border-slate-200/80 shadow-[0_12px_40px_rgba(15,76,58,0.04)] text-slate-900"
                      }`}
                    >
                    {/* Left Side (Next Page) Button Overlay */}
                    <button
                      id="btn-next-page-by-page"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPage(prev => Math.min(604, prev + 1));
                      }}
                      title="الصفحة التالية (السحب لليمين)"
                      className="absolute top-0 bottom-0 left-0 w-10 sm:w-12 z-20 cursor-pointer bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 transition-all duration-300 rounded-l-3xl flex items-center justify-start pl-2 text-slate-400/40 hover:text-slate-600 dark:hover:text-slate-200 pointer-events-auto"
                    >
                      <ChevronLeft size={28} />
                    </button>

                    {/* Right Side (Previous Page) Button Overlay */}
                    <button
                      id="btn-prev-page-by-page"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPage(prev => Math.max(1, prev - 1));
                      }}
                      title="الصفحة السابقة (السحب لليسار)"
                      className="absolute top-0 bottom-0 right-0 w-10 sm:w-12 z-20 cursor-pointer bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 transition-all duration-300 rounded-r-3xl flex items-center justify-end pr-2 text-slate-400/40 hover:text-slate-600 dark:hover:text-slate-200 pointer-events-auto"
                    >
                      <ChevronRight size={28} />
                    </button>

                    {/* Header showing current page and surah info with decorative frame */}
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-dashed border-emerald-800/15 dark:border-emerald-500/20 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span 
                        onClick={(e) => { e.stopPropagation(); handleOpenIndexDrawer("go"); }}
                        title="فتح فهرس الصفحات والتنقل"
                        className="cursor-pointer hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-900/10 dark:border-slate-700/60 bg-amber-50/50 dark:bg-slate-800/40 shadow-2xs"
                      >
                        <BookOpen size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <span>صَفْحَة {toArabicNumerals(currentPage)}</span>
                      </span>

                      {pageAyahs.length > 0 && (
                        <div 
                          onClick={(e) => { e.stopPropagation(); handleOpenIndexDrawer("surahs"); }}
                          title="فتح فهرس السور"
                          className="cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-2 border-emerald-700/20 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 shadow-2xs group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-extrabold tracking-wide">
                            سُورَةُ {pageAyahs[0]?.surah?.name?.replace("سُورَةُ ", "")?.replace("سورة ", "") || ""}
                          </span>
                          <ChevronDown size={13} className="text-emerald-600 dark:text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 select-none">
                      {(() => {
                        const elements: React.ReactNode[] = [];
                        let currentSpanAccumulator: React.ReactNode[] = [];

                        const flushAccumulator = (keyPrefix: string) => {
                          if (currentSpanAccumulator.length > 0) {
                            elements.push(
                              <div
                                key={`text-block-${keyPrefix}`}
                                className={`text-justify ${activeFontClass} leading-[2.6] ${
                                  theme === "gold-velvet" ? "text-[#012c1e]" :
                                  theme === "navy-velvet" ? "text-slate-900" :
                                  isDark ? "text-slate-100" : "text-slate-900"
                                }`}
                              >
                                {[...currentSpanAccumulator]}
                              </div>
                            );
                            currentSpanAccumulator = [];
                          }
                        };

                        let lastSurahNumber: number | null = null;
                        pageAyahs.forEach((ayah, idx) => {
                          const isSelected = selectedAyah?.number === ayah.number;
                          const isBookmarked = hasSpecificBookmarkJson(ayah.numberInSurah);
                          const isPlayingNow = playingPageAyahNumber === ayah.number && isPageAyahPlaying;

                          let displayedText = ayah.text;
                          const sNum = ayah.surah?.number || surahNumber;
                          const isFirstVerse = ayah.numberInSurah === 1;
                          const isSurahChange = lastSurahNumber !== null && sNum !== lastSurahNumber;
                          const shouldRenderHeader = isFirstVerse || isSurahChange;
                          lastSurahNumber = sNum;

                          if (sNum !== 1 && shouldRenderHeader) {
                            const bismillahTemplate = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
                            if (displayedText.startsWith(bismillahTemplate)) {
                              displayedText = displayedText.replace(bismillahTemplate, "").trim();
                            }
                          }

                          if (shouldRenderHeader) {
                            flushAccumulator(`pre-${idx}`);
                            const resolvedSurahName = ayah.surah?.name || surahsList.find((s) => s.number === sNum)?.name || "";
                            elements.push(
                              <SurahHeaderBanner
                                key={`surah-banner-${sNum}-${idx}`}
                                surahName={resolvedSurahName}
                                theme={theme}
                                isDark={isDark}
                                surahNumber={sNum}
                              />
                            );
                            if (sNum !== 9 && sNum !== 1) {
                              elements.push(
                                <BismillahBanner
                                  key={`bismillah-banner-${sNum}-${idx}`}
                                  theme={theme}
                                  surahNumber={sNum}
                                />
                              );
                            }
                          }

                          currentSpanAccumulator.push(
                            <span
                              id={`ayah-word-span-${ayah.number}`}
                              key={ayah.number}
                              style={getAyahStyle(currentPage)}
                              onClick={(e) => {
                                if (longPressActiveRef.current) {
                                  e.stopPropagation();
                                  return;
                                }
                                e.stopPropagation();
                                const standardAyah: Ayah = {
                                  number: ayah.number,
                                  numberInSurah: ayah.numberInSurah,
                                  text: ayah.text,
                                  translationEn: ayah.translationEn,
                                  page: currentPage,
                                };
                                handleAyahClick(standardAyah);
                              }}
                              onDoubleClick={(e) => {
                                if (longPressActiveRef.current) {
                                  e.stopPropagation();
                                  return;
                                }
                                e.stopPropagation();
                                const standardAyah: Ayah = {
                                  number: ayah.number,
                                  numberInSurah: ayah.numberInSurah,
                                  text: ayah.text,
                                  translationEn: ayah.translationEn,
                                  page: currentPage,
                                };
                                handleAyahDoubleClick(standardAyah);
                              }}
                              onMouseDown={(e) => {
                                const standardAyah: Ayah = {
                                  number: ayah.number,
                                  numberInSurah: ayah.numberInSurah,
                                  text: ayah.text,
                                  translationEn: ayah.translationEn,
                                  page: currentPage,
                                };
                                startLongPressTimer(e, standardAyah);
                              }}
                              onMouseUp={(e) => cancelLongPressTimer(e)}
                              onMouseMove={(e) => checkLongPressMove(e)}
                              onTouchStart={(e) => {
                                const standardAyah: Ayah = {
                                  number: ayah.number,
                                  numberInSurah: ayah.numberInSurah,
                                  text: ayah.text,
                                  translationEn: ayah.translationEn,
                                  page: currentPage,
                                };
                                startLongPressTimer(e, standardAyah);
                              }}
                              onTouchEnd={(e) => cancelLongPressTimer(e)}
                              onTouchMove={(e) => checkLongPressMove(e)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const standardAyah: Ayah = {
                                  number: ayah.number,
                                  numberInSurah: ayah.numberInSurah,
                                  text: ayah.text,
                                  translationEn: ayah.translationEn,
                                  page: currentPage,
                                };
                                startLongPressTimer(e, standardAyah);
                              }}
                              className={`inline transition-all duration-205 cursor-pointer rounded-lg px-2 py-1 ${
                                isPlayingNow
                                  ? (theme === "navy-velvet" ? "bg-[#3F63C6]/20 text-[#3F63C6] ring-1 ring-[#3F63C6]/40 shadow-xs font-semibold" : theme === "gold-velvet" ? "bg-emerald-200/35 text-[#012c1e] ring-1 ring-emerald-400/45 shadow-xs font-semibold" : isDark ? "bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-800/40 shadow-md font-medium" : "bg-emerald-100/40 text-emerald-950 ring-1 ring-emerald-300/40 shadow-xs font-medium")
                                  : isSelected
                                  ? (theme === "navy-velvet" ? "bg-[#3F63C6]/15 text-slate-800 ring-1 ring-[#3F63C6]/30 shadow-xs" : theme === "gold-velvet" ? "bg-amber-200/30 text-[#012c1e] ring-1 ring-amber-400/30 shadow-xs" : isDark ? "bg-amber-955/40 text-amber-300 ring-1 ring-amber-900/40 shadow-md" : "bg-amber-100/60 text-amber-950 ring-1 ring-amber-300/30 shadow-xs")
                                  : (theme === "navy-velvet" ? "hover:bg-[#3F63C6]/5" : theme === "gold-velvet" ? "hover:bg-emerald-150/30" : isDark ? "hover:bg-slate-800/40" : "hover:bg-amber-100/30")
                              } ${fontSizes[settings.fontSize]}`}
                            >
                              {displayedText}
                              <AyahEndMarkerSvg
                                number={ayah.numberInSurah}
                                toArabicNumerals={toArabicNumerals}
                                theme={theme || "light"}
                                isDark={isDark}
                              />
                            </span>
                          );
                        });

                        flushAccumulator("final");
                        return elements;
                      })()}
                    </div>

                    {/* Footer note indicating swiping to turn page */}
                    <div className="mt-8 pt-4 border-t border-dashed border-emerald-800/5 dark:border-emerald-500/5 flex justify-center text-[10px] text-slate-400 font-semibold gap-1 items-center">
                      <span>اسحب لليمين أو اليسار للتنقل بين الصفحات</span>
                      <span>•</span>
                      <span 
                        onClick={(e) => { e.stopPropagation(); onOpenIndex?.("go"); }}
                        title="فتح فهرس الصفحات والتنقل"
                        className="cursor-pointer hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        صَفْحَة {toArabicNumerals(currentPage)} مِنْ ٦٠٤
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
                )}
              </div>
            ) : effectivePageMode === "continuous" ? (
              /* Continuous Ayah-by-Ayah with Tafsir View layout */
              <div
                id="mushaf-continuous-canvas"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
                onTouchMove={handleSvgTouchMove}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBarsUnified(undefined, e);
                }}
                className={`w-full rounded-none p-3 sm:p-5 md:p-8 text-right select-none transition-all duration-300 border ${
                  isDark
                    ? "bg-slate-950 border-slate-800 text-slate-100 shadow-none"
                    : theme === "gold-velvet"
                    ? "bg-white border-[#c5a85c]/35 text-[#012c1e] shadow-[0_4px_30px_rgba(3,46,34,0.06)]"
                    : theme === "navy-velvet"
                    ? "bg-white border-slate-200 text-slate-900 shadow-sm"
                    : theme === "emerald-velvet"
                    ? "bg-white border-[#c5a85c]/30 text-[#011a12] shadow-none"
                    : "bg-white border-slate-200/80 shadow-[0_4px_30px_rgba(15,76,58,0.04)] text-slate-900"
                }`}
                style={{
                  backgroundColor: isDark ? "#020617" : "#ffffff",
                  borderColor: isDark ? undefined : theme === "gold-velvet" ? "#c5a85c40" : theme === "emerald-velvet" ? "#c5a85c30" : undefined
                }}
                dir="rtl"
              >
                {/* Placeholder spacer to preserve layout rhythm */}
                <div className="w-full mb-3 h-10 sm:h-11 pointer-events-none select-none" />

                {/* Top Floating Box with Surah & Ayah Selectors (عائم وظاهر في وضع القراءة فقط، ومخفي في صفحة علاماتي والفهرس والأدراج) */}
                {activeTab === "home" && !isIndexOpen && serviceDrawerTab === null && (
                <div 
                  id="floating-surah-ayah-picker"
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed ${showBars ? "top-16" : "top-3 sm:top-4"} left-3 sm:left-6 z-[360] inline-flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl backdrop-blur-md shadow-xl border transition-all duration-300 select-none ${
                    theme === "navy-velvet"
                      ? "bg-white/95 border-[#3F63C6]/35 shadow-[#3F63C6]/20 text-slate-900"
                      : theme === "gold-velvet"
                        ? "bg-[#FFFDF5]/95 border-[#c5a85c]/50 shadow-[#c5a85c]/25 text-[#011c14]"
                        : theme === "emerald-velvet"
                          ? "bg-[#012519]/95 border-[#34d399]/50 shadow-black/50 text-[#FAF8F5]"
                          : isDark
                            ? "bg-slate-900/95 border-slate-700 shadow-black/60 text-slate-100"
                            : "bg-white/95 border-emerald-300 shadow-emerald-950/15 text-slate-900"
                  }`}
                  style={{ direction: "rtl" }}
                >
                  {/* Element 1: Surah Dropdown / Modal Trigger */}
                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsContinuousSurahModalOpen(!isContinuousSurahModalOpen);
                      }}
                      className={`cursor-pointer px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border transition-all duration-200 outline-none shadow-2xs flex items-center gap-1.5 ${
                        theme === "navy-velvet"
                          ? "bg-white text-[#3F63C6] border-[#3F63C6]/30 hover:bg-[#3F63C6]/10"
                          : theme === "gold-velvet"
                            ? "bg-white text-[#8c6d1f] border-[#c5a85c]/40 hover:bg-amber-50"
                            : theme === "emerald-velvet"
                              ? "bg-[#012519] text-[#34d399] border-[#34d399]/40 hover:bg-[#013524]"
                              : isDark
                                ? "bg-slate-800 text-emerald-300 border-slate-700 hover:bg-slate-750"
                                : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
                      }`}
                      title="اختر السورة"
                    >
                      <span className="text-lg sm:text-2xl font-normal leading-none select-none" style={{ fontFamily: "QCF4_QBSML, 'Amiri', serif" }}>
                        {getSurahHeaderGlyph(surahNumber, surahsList.find(s => s.number === surahNumber)?.name) || surahsList.find(s => s.number === surahNumber)?.name}
                      </span>
                      <ChevronDown size={14} className="opacity-70" />
                    </button>

                    <SurahSelectModal
                      isOpen={isContinuousSurahModalOpen}
                      onClose={() => setIsContinuousSurahModalOpen(false)}
                      selectedSurahNumber={surahNumber}
                      onSelectSurah={(sNum) => {
                        if (onChangeSurah) {
                          onChangeSurah(sNum, 1);
                        }
                      }}
                      isDark={isDark}
                      theme={theme || "light"}
                    />
                  </div>

                  {/* Element 2: Ayah Dropdown */}
                  <div className="relative flex items-center shrink-0">
                    <select
                      value={selectedAyah?.numberInSurah || initialAyahNumber || 1}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        const aNum = parseInt(e.target.value, 10);
                        if (onChangeSurah) {
                          onChangeSurah(surahNumber, aNum);
                        }
                        setTimeout(() => {
                          const elem = document.getElementById(`ayah-block-${aNum}`) || document.getElementById(`ayah-word-span-${aNum}`);
                          if (elem) {
                            elem.scrollIntoView({ behavior: "smooth", block: "center" });
                          }
                        }, 150);
                      }}
                      className={`appearance-none cursor-pointer pl-6 pr-2.5 sm:pl-7 sm:pr-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-200 outline-none shadow-2xs ${
                        theme === "navy-velvet"
                          ? "bg-white text-[#3F63C6] border-[#3F63C6]/30 hover:bg-[#3F63C6]/10"
                          : theme === "gold-velvet"
                            ? "bg-white text-[#8c6d1f] border-[#c5a85c]/40 hover:bg-amber-50"
                            : theme === "emerald-velvet"
                              ? "bg-[#012519] text-[#34d399] border-[#34d399]/40 hover:bg-[#013524]"
                              : isDark
                                ? "bg-slate-800 text-emerald-300 border-slate-700 hover:bg-slate-750"
                                : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
                      }`}
                      title="اختر الآية"
                    >
                      {Array.from({ length: currentSurahMeta?.numberOfAyahs || 286 }).map((_, i) => (
                        <option key={i + 1} value={i + 1} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-slate-100">
                          آية {toArabicNumerals(i + 1)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute left-2 sm:left-2.5 pointer-events-none opacity-60" />
                  </div>
                </div>
                )}

                {/* شريط الأيقونات الموحد المباشر (بدون تفريعات): المختصر في التفسير ، السعدي ، ترجمة ، غريب الآية ، إعراب ، صرف ، بلاغة ، أسباب النزول ، تدبر ، التقييدات */}
                <div 
                  id="library-services-horizontal-bar"
                  dir="rtl"
                  style={{ direction: "rtl" }}
                  className={`w-full mx-auto mb-6 flex items-center justify-start gap-1 sm:gap-1.5 p-1.5 rounded-2xl border shadow-2xs overflow-x-auto scrollbar-none flex-nowrap whitespace-nowrap select-none ${
                    theme === "navy-velvet"
                      ? "bg-[#F0F5FE] border-[#3F63C6]/25 text-slate-900"
                      : theme === "gold-velvet"
                        ? "bg-[#FBF8EF] border-[#c5a85c]/30 text-[#011c14]"
                        : theme === "emerald-velvet"
                          ? "bg-[#EBF7F0] border-emerald-300/40 text-[#011c14]"
                          : isDark
                            ? "bg-slate-900/90 border-slate-800 text-slate-100"
                            : "bg-slate-100/90 border-slate-200 text-slate-900"
                  }`}
                >
                  {CONTINUOUS_SERVICES_LIST.map((service) => {
                    const isActive = continuousActiveMode === service.id;
                    const ServiceIcon = service.icon;
                    return (
                      <button
                        key={service.id}
                        id={`service-tab-${service.id}`}
                        type="button"
                        onClick={() => {
                          setContinuousActiveMode(service.id);
                          setContinuousActiveService(service.mainCategory);
                        }}
                        title={service.desc}
                        className={`flex-1 min-w-max py-2 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 select-none ${
                          isActive
                            ? theme === "navy-velvet"
                              ? "bg-[#3F63C6] text-white shadow-xs scale-[1.01]"
                              : theme === "gold-velvet"
                                ? "bg-[#c5a85c] text-[#011c14] shadow-xs scale-[1.01]"
                                : theme === "emerald-velvet"
                                  ? "bg-[#34d399] text-[#011a12] shadow-xs scale-[1.01]"
                                  : isDark
                                    ? "bg-emerald-500 text-slate-950 shadow-xs scale-[1.01]"
                                    : "bg-emerald-600 text-white shadow-xs scale-[1.01]"
                            : isDark
                              ? "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                              : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
                        }`}
                      >
                        <ServiceIcon size={16} className="shrink-0" />
                        <span className="truncate">{service.label}</span>
                      </button>
                    );
                  })}
                </div>

                {surahNumber !== 9 && surahNumber !== 1 && (
                  <BismillahBanner theme={theme} surahNumber={surahNumber} isDark={isDark} />
                )}

                <div className="flex flex-col gap-6 w-full mt-6 select-none">
                  {ayahs.map((ayah, idx) => {
                    const isActivePlaying = playingIndex === idx;
                    const isSelected = selectedAyah?.numberInSurah === ayah.numberInSurah;
                    const isBookmarked = hasSpecificBookmarkJson(ayah.numberInSurah);
                    const ayahBookmark = bookmarks.find(b => b.surahNumber === surahNumber && b.ayahNumber === ayah.numberInSurah);

                    return (
                      <AyahWithTafsirCard
                        key={ayah.number}
                        ayah={ayah}
                        surahNumber={surahNumber}
                        surahName={currentSurahMeta?.name || ""}
                        theme={theme}
                        isDark={isDark}
                        activeFontClass={activeFontClass}
                        fontSizeClass={fontSizes[settings.fontSize]}
                        isActivePlaying={isActivePlaying}
                        isSelected={isSelected}
                        isBookmarked={isBookmarked}
                        bookmarkCategory={ayahBookmark?.category}
                        toArabicNumerals={toArabicNumerals}
                        getAyahStyle={getAyahStyle}
                        currentPage={currentPage}
                        ayahElementsRef={ayahElementsRef}
                        lastClickTimeRef={lastClickTimeRef}
                        handleAyahPlayToggle={handleAyahDoubleClick}
                        handleAyahSelect={handleAyahClick}
                        longPressActiveRef={longPressActiveRef}
                        onStartLongPress={startLongPressTimer}
                        onCancelLongPress={cancelLongPressTimer}
                        onCheckLongPressMove={checkLongPressMove}
                        activeMode={continuousActiveMode}
                        onChangeSurah={onChangeSurah}
                        globalAyahFontSize={globalCardAyahFontSize}
                        onUpdateAyahFontSize={handleUpdateGlobalAyahFontSize}
                        globalTafsirFontSize={globalCardTafsirFontSize}
                        onUpdateTafsirFontSize={handleUpdateGlobalTafsirFontSize}
                        onOpenShare={handleOpenShareAyah}
                        onOpenBookmarkMenu={handleOpenAyahBookmarkMenu}
                        onOpenNote={handleOpenAyahNoteModal}
                      />
                    );
                  })}
                </div>

                {/* Bottom Page Medallion Footer (matching input_file_0.png) */}
                <div className="w-full mx-auto mt-8 flex items-center justify-center select-none" dir="rtl">
                  <div className={`px-5 py-2 rounded-2xl border-2 flex items-center gap-2 font-bold text-sm shadow-xs ${
                    theme === "gold-velvet"
                      ? "bg-[#FAF5E6] border-[#c5a85c]/60 text-amber-950"
                      : theme === "navy-velvet"
                      ? "bg-[#F0F7FF] border-[#3F63C6]/60 text-[#0F172A]"
                      : theme === "emerald-velvet"
                      ? "bg-[#012217] border-[#34d399]/60 text-[#FAF8F5]"
                      : isDark
                      ? "bg-slate-900 border-slate-700 text-slate-200"
                      : "bg-[#F5F9F6] border-emerald-300 text-emerald-950"
                  }`}>
                    <BookOpen size={16} />
                    <span className="font-serif text-base">{toArabicNumerals(currentPage)}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Centered Floating Panels for AI Tafsir */}
      {/* Floating Bubble Toolbar removed per user request */}

      {/* Floating Scroll-to-Top Button - خاص بصفحة المكتبة فقط ومخفي في الفهرس وصفحات المصحف وعلاماتي والأدراج */}
      {effectivePageMode === "continuous" && !isIndexOpen && serviceDrawerTab === null && activeTab === "home" && (
        <motion.button
          id="library-scroll-to-top-button"
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            e.stopPropagation();
            handleLibraryScrollToTop();
          }}
          title="الرجوع لأعلى الصفحة"
          aria-label="الرجوع لأعلى الصفحة"
          className={`fixed left-4 sm:left-6 ${
            showBars ? "bottom-36 sm:bottom-40" : "bottom-24 sm:bottom-28"
          } z-[350] p-3 sm:p-3.5 rounded-full shadow-2xl border cursor-pointer flex items-center justify-center transition-all duration-200 select-none group bg-red-600 text-white border-red-400 hover:bg-red-700 active:bg-red-800 shadow-red-900/40 hover:shadow-red-900/60`}
        >
          <ArrowUp size={22} className="stroke-[2.5px] text-white group-hover:-translate-y-1 transition-transform duration-200" />
        </motion.button>
      )}

      {/* Floating Bottom Console Recitation Player / Auto-Scroll Bar */}
      {true && (
      <div 
        id="floating-recitation-bar" 
        onClick={(e) => e.stopPropagation()}
        className={`fixed left-0 right-0 bottom-0 w-full z-[250] pointer-events-none transition-all duration-300 transform ${
          isRecitationActive || (settings.autoScrollActive && scrollCapsuleVisible)
            ? "translate-y-0 opacity-100 animate-fade-in" 
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop for the bottom sheet when open */}
        <AnimatePresence>
          {false && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowReciterPanel(false);
                if (activeTab === "recitation") {
                  onActiveTabChange?.("home");
                }
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-[3px] z-[201] pointer-events-auto cursor-pointer"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {false && (
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              drag="y"
              dragControls={reciterDragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.8 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) {
                  setShowReciterPanel(false);
                  if (activeTab === "recitation") {
                    onActiveTabChange?.("home");
                  }
                }
              }}
              className={`fixed ${
                isDrawerFullScreen
                  ? "inset-0 h-full rounded-none border-0 shadow-2xl z-[205]"
                  : "bottom-0 left-0 right-0 h-[70vh] rounded-t-[32px] border-t shadow-[0_-10px_40px_rgba(0,0,0,0.45)] z-[205]"
              } pointer-events-auto text-right font-sans overflow-hidden flex flex-col ${
                theme === "navy-velvet"
                  ? "bg-white border-slate-200 text-slate-800"
                  : theme === "gold-velvet"
                    ? "bg-[#FAF8F5] border-[#c5a85c]/35 text-slate-800"
                    : theme === "emerald-velvet"
                      ? "bg-[#011a12] border-[#10b981]/35 text-[#FAF8F5]"
                      : isDark
                        ? "bg-slate-950 border-slate-900 text-slate-100"
                        : "bg-emerald-50 border-emerald-100 text-slate-800"
              }`}
            >
              {/* Premium Drag Indicator Handle */}
              <div 
                onPointerDown={(e) => reciterDragControls.start(e)}
                className="pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing"
              >
                <div className={`w-12 h-1 rounded-full mx-auto ${
                  theme === "navy-velvet" || theme === "gold-velvet" || !isDark
                    ? "bg-slate-400/40"
                    : "bg-white/20"
                }`} />
              </div>

              {/* Header inside Panel */}
              <div 
                onPointerDown={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.closest("button") && !target.closest("select") && !target.closest("input")) {
                    reciterDragControls.start(e);
                  }
                }}
                className={`flex items-center justify-between px-6 pb-3 border-b flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing ${
                  theme === "navy-velvet"
                    ? "border-slate-100"
                    : theme === "gold-velvet"
                      ? "border-[#c5a85c]/20"
                      : theme === "emerald-velvet"
                        ? "border-[#10b981]/20"
                        : isDark
                          ? "border-slate-900"
                          : "border-slate-200/60"
                }`}
              >
                <span className={`text-sm font-bold flex items-center gap-1.5 ${
                  theme === "navy-velvet"
                    ? "text-[#3F63C6]"
                    : theme === "gold-velvet"
                      ? "text-[#011c14]"
                      : theme === "emerald-velvet"
                        ? "text-[#34d399]"
                        : isDark
                          ? "text-emerald-400"
                          : "text-emerald-800"
                }`}>
                  <Volume2 size={16} className={
                    theme === "navy-velvet"
                      ? "text-[#3F63C6]"
                      : theme === "gold-velvet"
                        ? "text-[#c5a85c]"
                        : theme === "emerald-velvet"
                          ? "text-[#34d399]"
                          : "text-emerald-400"
                  } />
                  خيارات وتكرار تلاوة القرآن الكريم
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsDrawerFullScreen(prev => !prev)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      theme === "navy-velvet" || theme === "gold-velvet" || !isDark
                        ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                    title={isDrawerFullScreen ? "عرض في أسفل الصفحة" : "عرض بكامل الصفحة"}
                  >
                    {isDrawerFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <button 
                    onClick={() => {
                      setShowReciterPanel(false);
                      if (activeTab === "recitation") {
                        onActiveTabChange?.("home");
                      }
                    }}
                    className="p-1.5 rounded-lg transition-colors cursor-pointer bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400"
                    title="إغلاق"
                  >
                    <X size={16} className="text-red-500 dark:text-red-400 stroke-[2.5px]" />
                  </button>
                </div>
              </div>

              {/* Scrollable Contents with bottom padding to clear the floating audio bar */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-4 pb-28">
                {/* Playback Status & Large Control Button in Reciter Panel */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  theme === "gold-velvet"
                    ? "bg-[#FAF8F5] border-[#c5a85c]/25 text-[#011c14]"
                    : theme === "emerald-velvet"
                      ? "bg-[#011c14] border-[#10b981]/25 text-[#FAF8F5]"
                      : theme === "navy-velvet"
                        ? "bg-slate-50 border-slate-200 text-slate-800"
                        : isDark
                          ? "bg-slate-900 border-slate-800 text-slate-100"
                          : "bg-white border-emerald-100 text-emerald-950"
                }`}>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                      isPlaying
                        ? theme === "navy-velvet"
                          ? "bg-[#3F63C6]/10 text-[#3F63C6] animate-pulse"
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c]/15 text-[#c5a85c] animate-pulse"
                            : theme === "emerald-velvet"
                              ? "bg-[#10b981]/15 text-[#34d399] animate-pulse"
                              : "bg-emerald-500/10 text-emerald-400 animate-pulse"
                        : theme === "navy-velvet" || theme === "gold-velvet" || !isDark
                          ? "bg-slate-100 text-slate-400"
                          : "bg-slate-800 text-slate-400"
                    }`}>
                      <Volume2 size={20} />
                    </div>
                    <div className="text-right">
                      <h4 className="text-[10px] font-bold text-slate-400">الحالة الحالية:</h4>
                      <p className={`text-xs mt-0.5 font-bold ${
                        isPlaying 
                          ? theme === "navy-velvet"
                            ? "text-[#3F63C6]"
                            : theme === "gold-velvet"
                              ? "text-[#c5a85c]"
                              : theme === "emerald-velvet"
                                ? "text-[#34d399]"
                                : "text-emerald-500"
                          : "text-slate-400"
                      }`}>
                        {isPlaying ? `جاري التلاوة بصوت القارئ ${reciters.find(r => r.id === settings.reciterId)?.nameAr || "المختار"}` : "التلاوة متوقفة حالياً"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Previous Button */}
                    <button
                      onClick={handlePrevAyah}
                      disabled={playingIndex === null || playingIndex === 0}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center cursor-pointer transition-all border disabled:opacity-35 disabled:cursor-not-allowed ${
                        theme === "navy-velvet"
                          ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-[#3F63C6]"
                          : theme === "gold-velvet"
                            ? "bg-[#FAF8F5] border-[#c5a85c]/25 hover:bg-[#c5a85c]/10 text-[#011c14]"
                            : theme === "emerald-velvet"
                              ? "bg-[#011a12] border-[#10b981]/25 hover:bg-[#10b981]/10 text-[#34d399]"
                              : isDark
                                ? "bg-slate-850 border-slate-700 hover:bg-slate-800 text-white"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-emerald-700"
                      }`}
                      title="الآية السابقة"
                    >
                      <SkipForward size={15} />
                    </button>

                    {/* Main Play/Pause Button */}
                    <button
                      onClick={handleTogglePlay}
                      className={`px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-md text-white ${
                        theme === "navy-velvet"
                          ? "bg-[#3F63C6] hover:bg-[#3F63C6]/90"
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c] text-[#011c14] hover:bg-[#c5a85c]/95"
                            : theme === "emerald-velvet"
                              ? "bg-[#34d399] text-[#011c14] hover:bg-[#34d399]/90"
                              : "bg-emerald-600 hover:bg-emerald-500"
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause size={14} />
                          <span>إيقاف مؤقت</span>
                        </>
                      ) : (
                        <>
                          <Play size={14} className="translate-x-[-1px]" />
                          <span>بدء التلاوة</span>
                        </>
                      )}
                    </button>

                    {/* Next Button */}
                    <button
                      onClick={handleNextAyah}
                      disabled={playingIndex === null || playingIndex === ayahs.length - 1}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center cursor-pointer transition-all border disabled:opacity-35 disabled:cursor-not-allowed ${
                        theme === "navy-velvet"
                          ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-[#3F63C6]"
                          : theme === "gold-velvet"
                            ? "bg-[#FAF8F5] border-[#c5a85c]/25 hover:bg-[#c5a85c]/10 text-[#011c14]"
                            : theme === "emerald-velvet"
                              ? "bg-[#011a12] border-[#10b981]/25 hover:bg-[#10b981]/10 text-[#34d399]"
                              : isDark
                                ? "bg-slate-850 border-slate-700 hover:bg-slate-800 text-white"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-emerald-700"
                      }`}
                      title="الآية التالية"
                    >
                      <SkipBack size={15} />
                    </button>
                  </div>
                </div>

                {/* 1. Reciter Selector */}
                <CustomDropdown
                  label="اختر القارئ:"
                  value={settings.reciterId}
                  onChange={(val) => onChangeSettings({ reciterId: String(val) })}
                  options={reciterDropdownOptions}
                  isDark={isDark}
                  theme={theme}
                  searchable={true}
                />

                {/* 2. Recitation Mode Segmented Tab Control with Icons */}
                <div>
                  <label className="block text-[10px] font-bold mb-1.5 flex items-center gap-1 text-slate-400">
                    <Compass size={12} className={
                      theme === "navy-velvet"
                        ? "text-[#3F63C6]"
                        : theme === "gold-velvet"
                          ? "text-[#c5a85c]"
                          : theme === "emerald-velvet"
                            ? "text-[#34d399]"
                          : "text-emerald-400"
                    } />
                    <span>نطاق التلاوة:</span>
                  </label>
                  <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl border ${
                    theme === "navy-velvet"
                      ? "bg-slate-100 border-slate-200"
                      : theme === "gold-velvet"
                        ? "bg-[#FAF8F5] border-[#c5a85c]/20"
                        : theme === "emerald-velvet"
                          ? "bg-[#011a12] border-[#34d399]/20"
                          : isDark
                            ? "bg-slate-900 border-slate-850"
                            : "bg-slate-100 border-slate-200"
                  }`}>
                    <button
                      type="button"
                      onClick={() => setRecitationMode("continuous")}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        recitationMode === "continuous"
                          ? theme === "navy-velvet"
                            ? "bg-[#3F63C6] text-white shadow-md"
                            : theme === "gold-velvet"
                              ? "bg-[#c5a85c] text-[#011c14] shadow-md"
                              : theme === "emerald-velvet"
                                ? "bg-[#34d399] text-[#011c14] shadow-md"
                                : "bg-emerald-600 text-white shadow-md"
                          : theme === "navy-velvet" || theme === "gold-velvet" || !isDark
                            ? "text-slate-500 hover:text-slate-800"
                            : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Repeat size={13} />
                      <span>تلاوة مستمرة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecitationMode("range")}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        recitationMode === "range"
                          ? theme === "navy-velvet"
                            ? "bg-[#3F63C6] text-white shadow-md"
                            : theme === "gold-velvet"
                              ? "bg-[#c5a85c] text-[#011c14] shadow-md"
                              : theme === "emerald-velvet"
                                ? "bg-[#34d399] text-[#011c14] shadow-md"
                                : "bg-emerald-600 text-white shadow-md"
                          : theme === "navy-velvet" || theme === "gold-velvet" || !isDark
                            ? "text-slate-500 hover:text-slate-800"
                            : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <BookmarkIcon size={13} />
                      <span>نطاق محدد</span>
                    </button>
                  </div>
                </div>

                {/* 3. From Ayah / To Ayah selects if in range mode */}
                {recitationMode === "range" && (
                  <div className={`grid grid-cols-2 gap-3 p-2.5 rounded-xl border animate-fade-in ${
                    theme === "navy-velvet"
                      ? "bg-slate-50 border-slate-200"
                      : theme === "gold-velvet"
                        ? "bg-[#FAF8F5]/80 border-[#c5a85c]/20"
                        : theme === "emerald-velvet"
                          ? "bg-[#011c14]/80 border-[#34d399]/20"
                          : isDark
                            ? "bg-slate-900 border-slate-850"
                            : "bg-slate-50 border-slate-200"
                  }`}>
                    <CustomDropdown
                      label="من آية:"
                      value={startAyahNum}
                      onChange={(val) => {
                        const num = Number(val);
                        setStartAyahNum(num);
                        if (num > endAyahNum) {
                          setEndAyahNum(num);
                        }
                      }}
                      options={startAyahOptions}
                      isDark={isDark}
                      theme={theme}
                    />

                    <CustomDropdown
                      label="إلى آية:"
                      value={endAyahNum}
                      onChange={(val) => {
                        const num = Number(val);
                        setEndAyahNum(num);
                        if (num < startAyahNum) {
                          setStartAyahNum(num);
                        }
                      }}
                      options={endAyahOptions}
                      isDark={isDark}
                      theme={theme}
                    />
                  </div>
                )}

                {/* 4. Repetition settings block - DESIGNED AS ROUNDED EXPLICIT ICON CHIPS/BUTTONS */}
                <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-white/5">
                  <div>
                    <label className="block text-[10px] font-bold mb-1.5 flex items-center gap-1 text-slate-400">
                      <Repeat size={12} className="text-amber-500" />
                      <span>تكرار الآية:</span>
                    </label>
                    <div className="flex items-center gap-1 flex-wrap">
                      {[1, 2, 3, 5, 10].map((num) => {
                        const isSelected = ayahRepeatMax === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setAyahRepeatMax(num)}
                            className={`w-7 h-7 flex items-center justify-center text-[10px] font-extrabold rounded-full transition-all cursor-pointer border ${
                              isSelected
                                ? theme === "navy-velvet"
                                  ? "bg-[#3F63C6] border-[#3F63C6] text-white shadow-md"
                                  : theme === "gold-velvet"
                                    ? "bg-[#c5a85c] border-[#c5a85c] text-[#011c14] shadow-md"
                                    : theme === "emerald-velvet"
                                      ? "bg-[#34d399] border-[#34d399] text-[#011c14] shadow-md"
                                      : "bg-emerald-600 border-emerald-600 text-white shadow-md"
                                : theme === "navy-velvet"
                                  ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                                  : theme === "emerald-velvet"
                                    ? "bg-[#10b981]/10 border-[#10b981]/20 text-[#FAF8F5] hover:bg-[#10b981]/20"
                                    : theme === "gold-velvet"
                                      ? "bg-[#c5a85c]/5 border-[#c5a85c]/15 text-[#011c14] hover:bg-[#c5a85c]/15"
                                      : isDark
                                        ? "bg-slate-900/45 border-slate-800 text-slate-300 hover:bg-slate-850"
                                        : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {toArabicNumerals(num)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold mb-1.5 flex items-center gap-1 text-slate-400">
                      <InfinityIcon size={12} className="text-blue-400" />
                      <span>تكرار المقطع:</span>
                    </label>
                    <div className="flex items-center gap-1 flex-wrap">
                      {[1, 2, 3, 5, 1000].map((num) => {
                        const isSelected = rangeRepeatMax === num;
                        const isDisabled = recitationMode !== "range";
                        return (
                          <button
                            key={num}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setRangeRepeatMax(num)}
                            className={`w-7 h-7 flex items-center justify-center text-[10px] font-extrabold rounded-full transition-all cursor-pointer border disabled:opacity-25 disabled:pointer-events-none ${
                              isSelected && !isDisabled
                                ? theme === "navy-velvet"
                                  ? "bg-[#3F63C6] border-[#3F63C6] text-white shadow-md"
                                  : theme === "gold-velvet"
                                    ? "bg-[#c5a85c] border-[#c5a85c] text-[#011c14] shadow-md"
                                    : theme === "emerald-velvet"
                                      ? "bg-[#34d399] border-[#34d399] text-[#011c14] shadow-md"
                                      : "bg-emerald-600 border-emerald-600 text-white shadow-md"
                                : theme === "navy-velvet"
                                  ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                                  : theme === "emerald-velvet"
                                    ? "bg-[#10b981]/10 border-[#10b981]/20 text-[#FAF8F5] hover:bg-[#10b981]/20"
                                    : theme === "gold-velvet"
                                      ? "bg-[#c5a85c]/5 border-[#c5a85c]/15 text-[#011c14] hover:bg-[#c5a85c]/15"
                                      : isDark
                                        ? "bg-slate-900/45 border-slate-800 text-slate-300 hover:bg-slate-850"
                                        : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {num === 1000 ? <InfinityIcon size={11} className="stroke-[3px]" /> : toArabicNumerals(num)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Optional settings */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <label className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer select-none ${
                    theme === "navy-velvet"
                      ? "bg-slate-50 border-slate-200 text-slate-700"
                      : theme === "emerald-velvet"
                        ? "bg-[#011a12] border-[#10b981]/20 text-[#FAF8F5]"
                        : theme === "gold-velvet"
                          ? "bg-[#FAF8F5] border-[#c5a85c]/20 text-[#011c14]"
                          : isDark
                            ? "bg-slate-900 border-slate-850 text-slate-300"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.autoAdvance || false}
                      onChange={(e) => onChangeSettings({ autoAdvance: e.target.checked })}
                    />
                    <span className="text-[10px] font-bold">تتالي التلاوة تلقائياً</span>
                    <div className={`w-6 h-3.5 flex items-center rounded-full p-0.5 transition-colors ${
                      settings.autoAdvance 
                        ? theme === "navy-velvet" 
                          ? "bg-[#3F63C6]" 
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c]"
                            : theme === "emerald-velvet"
                              ? "bg-[#10b981]"
                              : "bg-emerald-500" 
                        : "bg-slate-600"
                    }`}>
                      <div className={`w-2.5 h-2.5 rounded-full bg-white transform transition-transform ${settings.autoAdvance ? "translate-x-2.5" : "translate-x-0"}`} />
                    </div>
                  </label>

                  <label className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer select-none ${
                    theme === "navy-velvet"
                      ? "bg-slate-50 border-slate-200 text-slate-700"
                      : theme === "emerald-velvet"
                        ? "bg-[#011a12] border-[#10b981]/20 text-[#FAF8F5]"
                        : theme === "gold-velvet"
                          ? "bg-[#FAF8F5] border-[#c5a85c]/20 text-[#011c14]"
                          : isDark
                            ? "bg-slate-900 border-slate-850 text-slate-300"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.colorTajweed || false}
                      onChange={(e) => onChangeSettings({ colorTajweed: e.target.checked })}
                    />
                    <span className="text-[10px] font-bold">أحكام التجويد الملونة</span>
                    <div className={`w-6 h-3.5 flex items-center rounded-full p-0.5 transition-colors ${
                      settings.colorTajweed 
                        ? theme === "navy-velvet" 
                          ? "bg-[#3F63C6]" 
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c]"
                            : theme === "emerald-velvet"
                              ? "bg-[#10b981]"
                              : "bg-emerald-500" 
                        : "bg-slate-600"
                    }`}>
                      <div className={`w-2.5 h-2.5 rounded-full bg-white transform transition-transform ${settings.colorTajweed ? "translate-x-2.5" : "translate-x-0"}`} />
                    </div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {recitationError && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className={`mx-4 mb-2 p-3 rounded-xl border flex items-center justify-between text-right text-xs font-bold pointer-events-auto shadow-lg z-[210] relative ${
                theme === "navy-velvet"
                  ? "bg-white border-slate-200 text-slate-800"
                  : theme === "emerald-velvet"
                    ? "bg-[#011a12] border-[#34d399]/35 text-[#FAF8F5]"
                    : theme === "gold-velvet"
                      ? "bg-[#FAF8F5] border-[#c5a85c]/35 text-amber-950"
                      : isDark
                        ? "bg-slate-950/95 border-slate-800 text-white"
                        : "bg-[#F4FDF8]/95 border-emerald-200 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{recitationError}</span>
              </div>
              <button
                onClick={() => setRecitationError(null)}
                className="text-red-500 dark:text-red-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X size={14} className="text-red-500 dark:text-red-400 stroke-[2.5px]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeTab === "home" && isRecitationActive && (
            <motion.div
              id="audio-capsule"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={`shadow-[0_-4px_20px_rgba(0,0,0,0.12)] backdrop-blur-md rounded-t-2xl rounded-b-none p-3.5 px-4 sm:px-8 flex items-center justify-between pointer-events-auto w-full border-t border-x-0 border-b-0 h-16 z-[210] relative ${
                theme === "navy-velvet"
                  ? "bg-[#F4F7FE]/98 border-[#3F63C6]/25 text-slate-850"
                  : theme === "gold-velvet"
                    ? "bg-[#FAF8F5]/98 border-[#c5a85c]/35 text-[#011c14]"
                    : theme === "emerald-velvet"
                      ? "bg-[#F4FDF8]/98 border-emerald-200/50 text-[#012519]"
                      : "bg-white/98 border-emerald-100/70 text-slate-850"
              }`}
            >
              {/* Active Status */}
              <div className="flex items-center gap-3 pr-1 text-right">
                <span className={`block h-2.5 w-2.5 rounded-full shrink-0 ${
                  isPlaying ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}></span>
                <div className="flex flex-col justify-center">
                  <p className={`text-sm sm:text-base font-bold font-amiri leading-none ${
                    theme === "navy-velvet"
                      ? "text-[#3F63C6]"
                      : theme === "gold-velvet"
                        ? "text-[#011c14]"
                        : theme === "emerald-velvet"
                          ? "text-emerald-950"
                          : "text-emerald-950"
                  }`}>
                    {isPlaying 
                      ? `ترتيل ${currentReciter.nameAr}`
                      : "التلاوة متوقفة"}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2" dir="ltr">
                {/* 1. Stop button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStopRecitation();
                  }}
                  className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                    theme === "navy-velvet"
                      ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500"
                      : theme === "gold-velvet" || theme === "emerald-velvet"
                        ? "bg-red-700 hover:bg-red-800 text-white border-red-600"
                        : "bg-red-600 hover:bg-red-700 text-white border-red-500"
                  }`}
                  title="إيقاف نهائي"
                >
                  <X size={18} className="stroke-[3px]" />
                </button>

                {/* 3. Play/Pause Button */}
                <button
                  id="audio-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePlay();
                  }}
                  className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    theme === "navy-velvet"
                      ? "bg-[#3F63C6] hover:bg-[#3F63C6]/80 text-white"
                      : theme === "gold-velvet" || theme === "emerald-velvet"
                        ? "bg-[#c5a85c] text-[#011c14] hover:bg-[#c5a85c]/95"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                  title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                >
                  {isPlaying ? <Pause size={18} className="stroke-[3.5px]" /> : <Play size={18} className="stroke-[3.5px] translate-x-[-1.1px]" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Auto-Scroll Control Capsule */}
        <AnimatePresence>
          {activeTab === "home" && settings.autoScrollActive && !isRecitationActive && (
            <motion.div
              id="scroll-capsule"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={`shadow-[0_-4px_20px_rgba(0,0,0,0.12)] backdrop-blur-md rounded-t-2xl rounded-b-none p-3.5 px-4 sm:px-8 flex items-center justify-between pointer-events-auto w-full border-t border-x-0 border-b-0 h-16 z-[210] relative ${
                theme === "navy-velvet"
                  ? "bg-[#F4F7FE]/98 border-[#3F63C6]/25 text-slate-850"
                  : theme === "gold-velvet"
                    ? "bg-[#FAF8F5]/98 border-[#c5a85c]/35 text-[#011c14]"
                    : theme === "emerald-velvet"
                      ? "bg-[#F4FDF8]/98 border-emerald-200/50 text-[#012519]"
                      : "bg-white/98 border-emerald-100/70 text-slate-850"
              }`}
            >
              {/* Active Status & Speed Indicator */}
              <div className="flex items-center gap-3 pr-1 text-right select-none">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  theme === "navy-velvet" ? "bg-[#3F63C6]/15 text-[#3F63C6]" :
                  theme === "gold-velvet" ? "bg-[#c5a85c]/20 text-[#011c14]" :
                  theme === "emerald-velvet" ? "bg-[#c5a85c]/20 text-[#c5a85c]" :
                  "bg-emerald-100 text-emerald-700"
                }`}>
                  <ChevronsUp size={18} className="animate-bounce stroke-[2.5px]" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className={`text-sm sm:text-base font-bold font-sans leading-none ${
                    theme === "navy-velvet"
                      ? "text-[#3F63C6]"
                      : theme === "gold-velvet"
                        ? "text-[#011c14]"
                        : theme === "emerald-velvet"
                          ? "text-emerald-950"
                          : "text-emerald-950"
                  }`}>
                    نشط
                  </p>
                </div>
              </div>

              {/* Speed controls & Stop button */}
              <div className="flex items-center gap-1.5 sm:gap-2" dir="ltr">
                {/* 1. Stop Auto-scroll button (X) */}
                <button
                  id="scroll-stop-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleAutoScroll(false);
                  }}
                  className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                    theme === "navy-velvet"
                      ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500"
                      : theme === "gold-velvet" || theme === "emerald-velvet"
                        ? "bg-red-700 hover:bg-red-800 text-white border-red-600"
                        : "bg-red-600 hover:bg-red-700 text-white border-red-500"
                  }`}
                  title="إيقاف التمرير التلقائي"
                >
                  <X size={18} className="stroke-[3px]" />
                </button>

                {/* 2. Speed Decrease Button (-) */}
                <button
                  id="scroll-speed-down-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentSpeed = settings.autoScrollSpeed || 3;
                    const nextSpeed = Math.max(1, currentSpeed - 1);
                    onChangeSettings({ autoScrollSpeed: nextSpeed });
                  }}
                  disabled={(settings.autoScrollSpeed || 3) <= 1}
                  className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed ${
                    theme === "navy-velvet"
                      ? "bg-white text-[#3F63C6] border-slate-200 hover:bg-slate-50"
                      : theme === "gold-velvet" || theme === "emerald-velvet"
                        ? "bg-white text-[#011c14] border-[#c5a85c]/30 hover:bg-[#FAF2DF]/40"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                  title="تقليل السرعة"
                >
                  <Minus size={18} className="stroke-[3px]" />
                </button>

                {/* 3. Speed Increase Button (+) */}
                <button
                  id="scroll-speed-up-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentSpeed = settings.autoScrollSpeed || 3;
                    const nextSpeed = Math.min(10, currentSpeed + 1);
                    onChangeSettings({ autoScrollSpeed: nextSpeed });
                  }}
                  disabled={(settings.autoScrollSpeed || 3) >= 10}
                  className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed ${
                    theme === "navy-velvet"
                      ? "bg-[#3F63C6] hover:bg-[#3F63C6]/80 text-white border-[#3F63C6]"
                      : theme === "gold-velvet" || theme === "emerald-velvet"
                        ? "bg-[#c5a85c] text-[#011c14] hover:bg-[#c5a85c]/95 border-[#c5a85c]"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600"
                  }`}
                  title="زيادة السرعة"
                >
                  <Plus size={18} className="stroke-[3px]" />
                </button>

                {/* 4. Speed Number Icon / Badge on the right of (+) */}
                <div
                  id="scroll-speed-badge"
                  className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg select-none border transition-all shadow-sm ${
                    theme === "navy-velvet"
                      ? "bg-[#3F63C6]/15 text-[#3F63C6] border-[#3F63C6]/30"
                      : theme === "gold-velvet" || theme === "emerald-velvet"
                        ? "bg-[#c5a85c]/20 text-[#011c14] border-[#c5a85c]/35"
                        : "bg-emerald-100/90 text-emerald-800 border-emerald-300"
                  }`}
                  title={`سرعة التمرير الحالية: ${toArabicNumerals(settings.autoScrollSpeed || 3)}`}
                >
                  <span className="font-bold font-sans leading-none">
                    {toArabicNumerals(settings.autoScrollSpeed || 3)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}

        {/* Al-Tafseer Al-Moyassar Popup Modal */}
        <AnimatePresence>
          {tafsirModalAyah && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 pointer-events-none">
              {/* Backdrop without black background */}
              <div
                onClick={() => setTafsirModalAyah(null)}
                className="fixed inset-0 bg-transparent pointer-events-auto cursor-pointer"
              />

              {/* Modal Dialog Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 210 }}
                drag="y"
                dragControls={tafsirMoyassarDragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.5, bottom: 0.5 }}
                onDragEnd={(e, info) => {
                  if (Math.abs(info.offset.y) > 120) {
                    setTafsirModalAyah(null);
                  }
                }}
                className={`relative pointer-events-auto w-full max-w-3xl md:w-[80%] mx-auto rounded-3xl shadow-2xl border flex flex-col overflow-hidden max-h-[80vh] text-right font-sans ${
                  theme === "emerald-velvet"
                    ? "bg-[#011a12] border-[#c5a85c]/30 text-[#FAF8F5]"
                    : theme === "gold-velvet"
                      ? "bg-[#faf8f5] border-[#c5a85c]/30 text-[#011c14]"
                      : theme === "navy-velvet"
                        ? "bg-white border-[#3F63C6]/20 text-slate-900"
                        : isDark
                          ? "bg-slate-900 border-slate-800 text-slate-100"
                          : "bg-white border-emerald-100 text-slate-800"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Visual Drag Handle for Modal */}
                <div 
                  onPointerDown={(e) => tafsirMoyassarDragControls.start(e)}
                  className="w-full pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing shrink-0"
                >
                  <div className={`w-12 h-1 rounded-full ${
                    isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-300 hover:bg-slate-400"
                  }`} />
                </div>

                {/* Header (Merged single line with Title, Surah & Ayah, Zoom In/Out controls, Close button) */}
                <div 
                  onPointerDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest("button") && !target.closest("select") && !target.closest("input")) {
                      tafsirMoyassarDragControls.start(e);
                    }
                  }}
                  className={`flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b cursor-grab active:cursor-grabbing gap-3 sm:gap-4 ${
                    theme === "emerald-velvet"
                      ? "border-[#c5a85c]/15 bg-[#012519]"
                      : theme === "gold-velvet"
                        ? "border-[#c5a85c]/15 bg-[#fbf9f6]"
                        : theme === "navy-velvet"
                          ? "border-slate-100 bg-slate-50"
                          : isDark
                            ? "border-slate-800/80 bg-slate-950/40"
                            : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-row-reverse flex-wrap">
                    {/* Segmented Book Switcher: المختصر، الميسر، السعدي */}
                    <div className={`flex items-center p-0.5 sm:p-1 rounded-xl border shadow-2xs gap-1 ${
                      theme === "emerald-velvet"
                        ? "bg-[#011a12] border-[#c5a85c]/30 text-[#FAF8F5]"
                        : theme === "gold-velvet"
                        ? "bg-[#FFFDF5] border-[#c5a85c]/30 text-[#011c14]"
                        : theme === "navy-velvet"
                        ? "bg-white border-[#3F63C6]/25 text-slate-900"
                        : isDark
                        ? "bg-slate-900 border-slate-700 text-slate-100"
                        : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}>
                      <button
                        type="button"
                        onClick={() => {
                          setTafsirModalBook("tafsir_mukhtasar");
                          fetchTafsirForModal(tafsirModalAyah, "tafsir_mukhtasar");
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          tafsirModalBook === "tafsir_mukhtasar"
                            ? (theme === "emerald-velvet" ? "bg-[#34d399] text-[#011a12] shadow-xs" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-xs" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-xs" : isDark ? "bg-emerald-500 text-slate-950 shadow-xs" : "bg-emerald-600 text-white shadow-xs")
                            : "opacity-75 hover:opacity-100"
                        }`}
                      >
                        <BookOpen size={13} className="shrink-0" />
                        <span>المختصر</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTafsirModalBook("tafsir_muyassar");
                          fetchTafsirForModal(tafsirModalAyah, "tafsir_muyassar");
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          tafsirModalBook === "tafsir_muyassar"
                            ? (theme === "emerald-velvet" ? "bg-[#34d399] text-[#011a12] shadow-xs" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-xs" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-xs" : isDark ? "bg-emerald-500 text-slate-950 shadow-xs" : "bg-emerald-600 text-white shadow-xs")
                            : "opacity-75 hover:opacity-100"
                        }`}
                      >
                        <BookOpenText size={13} className="shrink-0" />
                        <span>الميسر</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTafsirModalBook("tafsir_sadi");
                          fetchTafsirForModal(tafsirModalAyah, "tafsir_sadi");
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          tafsirModalBook === "tafsir_sadi"
                            ? (theme === "emerald-velvet" ? "bg-[#34d399] text-[#011a12] shadow-xs" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-xs" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white shadow-xs" : isDark ? "bg-emerald-500 text-slate-950 shadow-xs" : "bg-emerald-600 text-white shadow-xs")
                            : "opacity-75 hover:opacity-100"
                        }`}
                      >
                        <BookOpenCheck size={13} className="shrink-0" />
                        <span>السعدي</span>
                      </button>
                    </div>

                    <span className="opacity-30 select-none">•</span>
                    <span className={`text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center ${
                      theme === "emerald-velvet"
                        ? "text-[#c5a85c] border-[#c5a85c]/25 bg-[#011a12]"
                        : theme === "gold-velvet"
                          ? "text-[#c5a85c] border-[#c5a85c]/25 bg-[#FFFDF5]"
                          : theme === "navy-velvet"
                            ? "text-[#3F63C6] border-[#3F63C6]/20 bg-white"
                            : isDark
                              ? "text-slate-200 border-slate-700 bg-slate-900"
                              : "text-emerald-700 dark:text-emerald-300 border-emerald-500/20 bg-emerald-50"
                    }`}>
                      {(tafsirModalAyah as any).surah?.name || currentSurahMeta?.name} • الآية {toArabicNumerals(tafsirModalAyah.numberInSurah)}
                    </span>
                  </div>

                  {/* Left Controls: Zoom In / Zoom Out and Close with comfortable spacing */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5">
                    {/* Zoom In & Zoom Out Buttons Container */}
                    <div className={`flex items-center gap-1.5 sm:gap-2 rounded-xl p-1 sm:p-1.5 border shadow-2xs ${
                      theme === "emerald-velvet"
                        ? "bg-[#01160e] border-[#c5a85c]/25 text-[#FAF8F5]"
                        : theme === "gold-velvet"
                          ? "bg-[#FAF5E6] border-[#c5a85c]/25 text-slate-800"
                          : theme === "navy-velvet"
                            ? "bg-white border-[#3F63C6]/20 text-slate-800"
                            : isDark
                              ? "bg-slate-800 border-slate-700 text-slate-100"
                              : "bg-white border-slate-200 text-slate-700"
                    }`}>
                      {/* أيقونة تكبير خط التفسير */}
                      <button
                        type="button"
                        onClick={handleZoomInTafsir}
                        disabled={tafsirModalFontSize >= 38}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed ${
                          theme === "emerald-velvet"
                            ? "hover:bg-[#c5a85c]/20 text-[#c5a85c]"
                            : theme === "gold-velvet"
                              ? "hover:bg-[#c5a85c]/20 text-[#8c6b23]"
                              : theme === "navy-velvet"
                                ? "hover:bg-[#3F63C6]/20 text-[#3F63C6]"
                                : isDark
                                  ? "hover:bg-slate-700 text-emerald-400"
                                  : "hover:bg-emerald-50 text-emerald-700"
                        }`}
                        title="تكبير خط التفسير (+)"
                        aria-label="تكبير خط التفسير"
                      >
                        <ZoomIn size={17} className="stroke-[2.5px]" />
                      </button>

                      {/* مؤشر الحجم الحالي وزر إعادة التعيين */}
                      <button
                        type="button"
                        onClick={handleResetTafsirFontSize}
                        title="حجم الخط (اضغط لإعادة التعيين)"
                        className={`px-2 sm:px-2.5 py-0.5 text-xs font-bold select-none cursor-pointer rounded-md transition-colors tabular-nums ${
                          theme === "emerald-velvet"
                            ? "hover:bg-[#c5a85c]/15 text-[#c5a85c]"
                            : theme === "gold-velvet"
                              ? "hover:bg-[#c5a85c]/15 text-[#8c6b23]"
                              : theme === "navy-velvet"
                                ? "hover:bg-[#3F63C6]/15 text-[#3F63C6]"
                                : isDark
                                  ? "hover:bg-slate-700 text-slate-300"
                                  : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {toArabicNumerals(tafsirModalFontSize)}
                      </button>

                      {/* أيقونة تصغير خط التفسير */}
                      <button
                        type="button"
                        onClick={handleZoomOutTafsir}
                        disabled={tafsirModalFontSize <= 14}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed ${
                          theme === "emerald-velvet"
                            ? "hover:bg-[#c5a85c]/20 text-[#c5a85c]"
                            : theme === "gold-velvet"
                              ? "hover:bg-[#c5a85c]/20 text-[#8c6b23]"
                              : theme === "navy-velvet"
                                ? "hover:bg-[#3F63C6]/20 text-[#3F63C6]"
                                : isDark
                                  ? "hover:bg-slate-700 text-emerald-400"
                                  : "hover:bg-emerald-50 text-emerald-700"
                        }`}
                        title="تصغير خط التفسير (-)"
                        aria-label="تصغير خط التفسير"
                      >
                        <ZoomOut size={17} className="stroke-[2.5px]" />
                      </button>
                    </div>

                    <button
                      onClick={() => setTafsirModalAyah(null)}
                      className="p-2 sm:p-2.5 rounded-full transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 cursor-pointer shrink-0"
                      title="إغلاق"
                      aria-label="إغلاق"
                    >
                      <X size={18} className="text-red-500 dark:text-red-400 stroke-[2.5px]" />
                    </button>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 dir-rtl pb-6" style={{ direction: "rtl" }}>
                  {/* Tafsir content area */}
                  <div className="space-y-3">
                    {tafsirModalLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <div className={`animate-spin rounded-full h-8 w-8 border-4 ${
                          theme === "gold-velvet" ? "border-[#c5a85c]" :
                          theme === "emerald-velvet" ? "border-[#34d399]" :
                          theme === "navy-velvet" ? "border-[#3F63C6]" :
                          "border-emerald-600"
                        } border-t-transparent`} />
                        <p className={`text-sm font-medium ${
                          theme === "emerald-velvet" ? "text-[#34d399]" :
                          theme === "gold-velvet" ? "text-[#c5a85c]" :
                          theme === "navy-velvet" ? "text-[#3F63C6]" :
                          "text-slate-500"
                        }`}>جاري جلب المختصر في التفسير...</p>
                      </div>
                    ) : tafsirModalError ? (
                      <div className="text-center py-10 space-y-3">
                        <p className="text-rose-500 font-semibold text-sm">{tafsirModalError}</p>
                        <button
                          onClick={() => fetchTafsirForModal(tafsirModalAyah)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                            theme === "emerald-velvet"
                              ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]"
                              : theme === "gold-velvet"
                                ? "bg-[#FAF8F5] border-[#c5a85c] text-amber-900"
                                : theme === "navy-velvet"
                                  ? "bg-[#3F63C6] border-[#3F63C6] text-white"
                                  : "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          إعادة المحاولة
                        </button>
                      </div>
                    ) : (
                      <div className={`prose prose-sm max-w-none text-right ${
                        isDark ? "text-slate-200" : "text-slate-800"
                      }`}>
                        <p 
                          className="font-amiri font-amiri-naskh leading-[2.3] text-justify font-normal select-text transition-all duration-150"
                          style={{ 
                            fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif",
                            fontSize: `${tafsirModalFontSize}px`
                          }}
                        >
                          {tafsirModalText}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Share Ayah Modal */}
        {shareAyahData !== null && (
          <ShareAyahModal
            shareData={shareAyahData}
            onClose={() => setShareAyahData(null)}
            theme={theme}
            isDark={isDark}
          />
        )}

        {bookmarkMenu && (
          <div
            className="fixed inset-0 z-[250]"
            onClick={() => setBookmarkMenu(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.1 }}
              dir="rtl"
              style={{
                position: "fixed",
                top: `${Math.min(bookmarkMenu.top + 8, window.innerHeight - 260)}px`,
                left: `${Math.max(16, Math.min(bookmarkMenu.left, window.innerWidth - 208))}px`,
                transform: bookmarkMenu.align === "right" ? "translateX(-100%)" : bookmarkMenu.align === "center" ? "translateX(-50%)" : "none",
              }}
              onClick={(e) => e.stopPropagation()}
              className={`w-52 rounded-2xl p-3 shadow-xl border backdrop-blur-md select-none ${
                theme === "emerald-velvet"
                  ? "bg-[#011c14]/98 border-[#c5a85c]/40 text-[#FAF8F5]"
                  : theme === "gold-velvet"
                    ? "bg-[#FFFDF5]/98 border-[#c5a85c]/40 text-black shadow-amber-950/5"
                    : theme === "navy-velvet"
                      ? "bg-white/98 border-slate-200 text-slate-900 shadow-slate-200"
                      : isDark
                        ? "bg-slate-900/98 border-slate-800 text-slate-100 shadow-black/40"
                        : "bg-white/98 border-emerald-100 text-slate-800 shadow-emerald-100/30"
              }`}
            >
              <div className="text-[10px] font-black px-1 pb-2 mb-2 border-b border-slate-200/20 dark:border-slate-800/20 text-slate-400 text-right">
                نوع العلامة (الفاصلة)
              </div>
              
              <div className="space-y-2">
                <div className={`overflow-hidden border rounded-xl ${
                  theme === "emerald-velvet"
                    ? "border-[#c5a85c]/30"
                    : theme === "gold-velvet"
                      ? "border-[#c5a85c]/30"
                      : theme === "navy-velvet"
                        ? "border-slate-200"
                        : isDark
                          ? "border-slate-800"
                          : "border-slate-200"
                }`}>
                  <table className="w-full border-collapse text-right text-xxs font-bold">
                    <thead>
                      <tr className={`border-b text-slate-400 dark:text-slate-500 ${
                        theme === "emerald-velvet"
                          ? "bg-[#012519]/60 border-[#c5a85c]/25"
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c]/10 border-[#c5a85c]/25"
                            : theme === "navy-velvet"
                              ? "bg-slate-50 border-slate-200"
                              : isDark
                                ? "bg-slate-800/40 border-slate-800"
                                : "bg-slate-50 border-slate-200"
                      }`}>
                        <th className="py-2 px-2.5 text-right font-black">التصنيف</th>
                        <th className="py-2 px-2.5 text-center font-black w-10">اللون</th>
                        <th className="py-2 px-2.5 text-center font-black w-10">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      theme === "emerald-velvet" || theme === "gold-velvet"
                        ? "divide-[#c5a85c]/20"
                        : theme === "navy-velvet"
                          ? "divide-slate-150"
                          : isDark
                            ? "divide-slate-800"
                            : "divide-slate-100"
                    }`}>
                      {[
                        { id: "reading", label: "التلاوة", dot: "bg-red-500 shadow-red-500/35" },
                        { id: "memorization", label: "الحفظ", dot: "bg-sky-400 shadow-sky-400/35" },
                        { id: "revision", label: "المراجعة", dot: "bg-emerald-400 shadow-emerald-400/35" },
                        { id: "contemplation", label: "التدبر", dot: "bg-purple-500 shadow-purple-500/35" }
                      ].map((cat) => {
                        const isCurrent = bookmarks.some(b => b.surahNumber === bookmarkMenu.surahNumber && b.ayahNumber === bookmarkMenu.ayahNumber && b.category === cat.id);
                        return (
                          <tr
                            key={cat.id}
                            onClick={() => {
                              if (isCurrent) {
                                onToggleBookmark(bookmarkMenu.surahNumber, bookmarkMenu.surahName, bookmarkMenu.ayahNumber);
                              } else {
                                onToggleBookmark(bookmarkMenu.surahNumber, bookmarkMenu.surahName, bookmarkMenu.ayahNumber, cat.id as any);
                              }
                              setBookmarkMenu(null);
                            }}
                            className={`cursor-pointer transition-colors ${
                              theme === "emerald-velvet"
                                ? "hover:bg-[#012d1e] text-[#FAF8F5]"
                                : theme === "gold-velvet"
                                  ? "hover:bg-[#c5a85c]/15 text-black"
                                  : theme === "navy-velvet"
                                    ? "hover:bg-slate-50 text-slate-900"
                                    : isDark
                                      ? "hover:bg-slate-800 text-white"
                                      : "hover:bg-slate-50 text-slate-900"
                            } ${isCurrent ? "bg-black/5 dark:bg-white/5 font-black" : ""}`}
                          >
                            <td className="py-2 px-2.5 text-right font-bold">
                              {cat.label}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span className={`w-2.5 h-2.5 rounded-full inline-block shadow-sm ${cat.dot}`} />
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <div className="flex justify-center items-center">
                                {isCurrent ? (
                                  <Check size={12} className="text-emerald-500 stroke-[3px]" />
                                ) : (
                                  <span className={`w-3 h-3 rounded-full border inline-block opacity-20 ${
                                    isDark ? "border-white" : "border-black"
                                  }`} />
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {bookmarks.some(b => b.surahNumber === bookmarkMenu.surahNumber && b.ayahNumber === bookmarkMenu.ayahNumber) && (
                  <button
                    onClick={() => {
                      onToggleBookmark(bookmarkMenu.surahNumber, bookmarkMenu.surahName, bookmarkMenu.ayahNumber);
                      setBookmarkMenu(null);
                    }}
                    className="w-full px-2 py-1.5 mt-1 rounded-xl text-xxs font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer flex items-center justify-between transition-all border border-rose-500/20"
                  >
                    <span>حذف العلامة</span>
                    <Trash2 size={12} className="stroke-[2.5px]" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Floating Ayah Long-Press Context Menu (قائمة عائمة عند الضغط مطولاً على الآية مكبرة بنسبة 100% مع أسماء العلامات) */}
        <AnimatePresence>
          {floatingAyahMenu && (
            <div
              className="fixed inset-0 z-[450] select-none pointer-events-auto"
              onClick={() => setFloatingAyahMenu(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                setFloatingAyahMenu(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
                style={{
                  position: "fixed",
                  left: `${Math.max(10, Math.min(floatingAyahMenu.x - 185, window.innerWidth - 395))}px`,
                  top: `${floatingAyahMenu.y > 170 ? Math.max(16, floatingAyahMenu.y - 110) : Math.min(window.innerHeight - 170, floatingAyahMenu.y + 25)}px`,
                }}
                className={`rounded-3xl p-2.5 sm:p-3.5 shadow-2xl border backdrop-blur-xl flex flex-col gap-2.5 sm:gap-3 z-[460] select-none ${
                  theme === "emerald-velvet"
                    ? "bg-[#012519]/95 border-[#c5a85c]/45 text-[#FAF8F5] shadow-black/70"
                    : theme === "gold-velvet"
                      ? "bg-[#FFFDF5]/95 border-[#c5a85c]/50 text-[#011c14] shadow-amber-950/25"
                      : theme === "navy-velvet"
                        ? "bg-white/95 border-[#3F63C6]/35 text-slate-900 shadow-[#3F63C6]/25"
                        : isDark
                          ? "bg-slate-900/95 border-slate-700 text-slate-100 shadow-black/70"
                          : "bg-white/95 border-emerald-200 shadow-emerald-950/20 text-slate-900"
                }`}
              >
                {/* Main Action Icons Row: التفسير ، النسخ ، المشاركة ، العلامات ، الملاحظات */}
                <div className="flex items-center gap-2.5 sm:gap-4 px-1 justify-center">
                  {/* 1. Tafsir Al-Muyassar icon */}
                  <button
                    type="button"
                    onClick={() => {
                      const ayahWithSurah = {
                        ...floatingAyahMenu.ayah,
                        surah: (floatingAyahMenu.ayah as any).surah || {
                          number: floatingAyahMenu.surahNumber,
                          name: floatingAyahMenu.surahName,
                        },
                      };
                      setTafsirModalAyah(ayahWithSurah as Ayah);
                      setFloatingAyahMenu(null);
                    }}
                    title="تفسير الآية (المختصر • الميسر • السعدي)"
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl transition-all cursor-pointer flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-90"
                  >
                    <BookOpen size={28} className="sm:w-[34px] sm:h-[34px]" />
                  </button>

                  {/* 2. Copy icon */}
                  <button
                    type="button"
                    onClick={handleFloatingCopyAyah}
                    title="نسخ الآية"
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl transition-all cursor-pointer flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 ${
                      floatingCopied ? "bg-emerald-500/20 text-emerald-500" : ""
                    }`}
                  >
                    {floatingCopied ? (
                      <Check size={28} className="sm:w-[34px] sm:h-[34px] text-emerald-500 stroke-[3px]" />
                    ) : (
                      <Copy size={28} className="sm:w-[34px] sm:h-[34px]" />
                    )}
                  </button>

                  {/* 3. Share icon */}
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenShareAyah(floatingAyahMenu.ayah);
                      setFloatingAyahMenu(null);
                    }}
                    title="مشاركة الآية"
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl transition-all cursor-pointer flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-90"
                  >
                    <Share2 size={28} className="sm:w-[34px] sm:h-[34px]" />
                  </button>

                  {/* 4. Bookmark / Tag icon (reveals markers list on click) */}
                  <button
                    type="button"
                    onClick={() => {
                      setFloatingAyahMenu(prev => prev ? { ...prev, showBookmarksList: !prev.showBookmarksList } : null);
                    }}
                    title="وضع علامة"
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl transition-all cursor-pointer flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 ${
                      floatingAyahMenu.showBookmarksList
                        ? (theme === "emerald-velvet" || theme === "gold-velvet" ? "bg-[#c5a85c]/25 text-[#c5a85c]" : "bg-emerald-500/20 text-emerald-500")
                        : bookmarks.some(b => b.surahNumber === floatingAyahMenu.surahNumber && b.ayahNumber === floatingAyahMenu.ayah.numberInSurah)
                          ? "text-amber-500"
                          : ""
                    }`}
                  >
                    <BookmarkIcon
                      size={28}
                      className={`sm:w-[34px] sm:h-[34px] ${bookmarks.some(b => b.surahNumber === floatingAyahMenu.surahNumber && b.ayahNumber === floatingAyahMenu.ayah.numberInSurah) ? "fill-current text-amber-500" : ""}`}
                    />
                  </button>

                  {/* 5. Note & Tadabbur icon */}
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenAyahNoteModal(floatingAyahMenu.ayah);
                      setFloatingAyahMenu(null);
                    }}
                    title="كتابة ملاحظة وتدبر"
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl transition-all cursor-pointer flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 active:scale-90"
                  >
                    <FileText size={28} className="sm:w-[34px] sm:h-[34px]" />
                  </button>
                </div>

                {/* Sub-row: Bookmarks / Markers List مع إظهار أسماء أنواع العلامات */}
                {floatingAyahMenu.showBookmarksList && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 mt-1 border-t border-current/15 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-1"
                  >
                    {[
                      { id: "reading", name: "تلاوة", dot: "bg-red-500", ring: "ring-red-400", title: "علامة التلاوة" },
                      { id: "memorization", name: "حفظ", dot: "bg-sky-400", ring: "ring-sky-300", title: "علامة الحفظ" },
                      { id: "revision", name: "مراجعة", dot: "bg-emerald-400", ring: "ring-emerald-300", title: "علامة المراجعة" },
                      { id: "contemplation", name: "تدبر", dot: "bg-purple-500", ring: "ring-purple-400", title: "علامة التدبر" }
                    ].map((cat) => {
                      const isCurrent = bookmarks.some(
                        b => b.surahNumber === floatingAyahMenu.surahNumber &&
                             b.ayahNumber === floatingAyahMenu.ayah.numberInSurah &&
                             b.category === cat.id
                      );
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            if (isCurrent) {
                              onToggleBookmark(floatingAyahMenu.surahNumber, floatingAyahMenu.surahName, floatingAyahMenu.ayah.numberInSurah);
                            } else {
                              onToggleBookmark(floatingAyahMenu.surahNumber, floatingAyahMenu.surahName, floatingAyahMenu.ayah.numberInSurah, cat.id as any);
                            }
                            setFloatingAyahMenu(null);
                          }}
                          title={cat.title}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                            isCurrent 
                              ? `ring-2 ring-offset-1 ${cat.ring} border-current/35 bg-black/5 dark:bg-white/10 font-black` 
                              : "border-current/15 hover:border-current/30 hover:bg-black/5 dark:hover:bg-white/5 font-bold"
                          }`}
                        >
                          <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-md ${cat.dot} flex items-center justify-center shrink-0`}>
                            {isCurrent && <Check size={12} className="text-white stroke-[3px]" />}
                          </span>
                          <span className="text-xs sm:text-sm">{cat.name}</span>
                        </button>
                      );
                    })}

                    {bookmarks.some(b => b.surahNumber === floatingAyahMenu.surahNumber && b.ayahNumber === floatingAyahMenu.ayah.numberInSurah) && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleBookmark(floatingAyahMenu.surahNumber, floatingAyahMenu.surahName, floatingAyahMenu.ayah.numberInSurah);
                          setFloatingAyahMenu(null);
                        }}
                        title="حذف العلامة"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 transition-all cursor-pointer active:scale-95"
                      >
                        <Trash2 size={16} />
                        <span>حذف</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Ayah Note Drawer (ملاحظة على الآية) */}
        <AnimatePresence>
          {ayahNoteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[260] flex items-end justify-center cursor-default bg-transparent pointer-events-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setAyahNoteModal(null);
                }
              }}
            >
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 280 }}
                drag="y"
                dragControls={ayahNoteDragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={(e, info) => {
                  if (info.offset.y > 100) {
                    setAyahNoteModal(null);
                  }
                }}
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
                className={`w-full overflow-hidden shadow-2xl flex flex-col border ${
                  isAyahNoteFullScreen
                    ? "fixed inset-0 h-full max-w-full rounded-none border-0 z-[270] pb-6"
                    : "max-w-4xl h-[84vh] md:h-[85vh] rounded-t-[28px] sm:rounded-t-[32px] border-b-0"
                } ${
                  theme === "emerald-velvet"
                    ? "bg-[#011c14] border-[#c5a85c]/40 text-[#FAF8F5]"
                    : theme === "gold-velvet"
                      ? "bg-[#FFFDF5] border-[#c5a85c]/40 text-[#011c14]"
                      : theme === "navy-velvet"
                        ? "bg-white border-slate-200 text-slate-900"
                        : isDark
                          ? "bg-slate-900 border-slate-800 text-slate-100"
                          : "bg-white border-emerald-100 text-slate-800"
                }`}
              >
                {/* Drag Handle Bar */}
                {!isAyahNoteFullScreen && (
                  <div
                    onPointerDown={(e) => ayahNoteDragControls.start(e)}
                    className="pt-3 pb-1.5 flex justify-center cursor-grab active:cursor-grabbing shrink-0 select-none"
                  >
                    <div className={`w-12 h-1.5 rounded-full transition-colors ${
                      theme === "navy-velvet" || theme === "gold-velvet" || !isDark
                        ? "bg-slate-400/40"
                        : "bg-white/20"
                    }`} />
                  </div>
                )}

                {/* Header */}
                <div className={`px-5 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${
                  theme === "emerald-velvet"
                    ? "bg-[#012519] border-[#c5a85c]/25 text-[#FAF8F5]"
                    : theme === "gold-velvet"
                      ? "bg-[#FAF5E6] border-[#c5a85c]/25 text-[#011c14]"
                      : theme === "navy-velvet"
                        ? "bg-slate-50 border-slate-200 text-slate-900"
                        : isDark
                          ? "bg-slate-950 border-slate-800 text-slate-100"
                          : "bg-emerald-50/70 border-emerald-100 text-emerald-950"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      theme === "emerald-velvet" || theme === "gold-velvet"
                        ? "bg-[#c5a85c]/20 text-[#c5a85c]"
                        : theme === "navy-velvet"
                          ? "bg-[#3F63C6]/15 text-[#3F63C6]"
                          : isDark
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-emerald-100 text-emerald-700"
                    }`}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base">ملاحظة وتدبّر على الآية</h3>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          theme === "emerald-velvet" || theme === "gold-velvet"
                            ? "bg-[#c5a85c]/20 text-[#c5a85c]"
                            : theme === "navy-velvet"
                              ? "bg-[#3F63C6]/15 text-[#3F63C6]"
                              : isDark
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {ayahNoteModal.surahName} • آية {toArabicNumerals(ayahNoteModal.ayah.numberInSurah)}
                        </span>
                      </div>
                      <p className="text-xs opacity-70 mt-0.5">
                        دوّن خواطرك الإيمانية وفوائدك التفسيرية واللغوية
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsAyahNoteFullScreen(!isAyahNoteFullScreen)}
                      className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer opacity-75 hover:opacity-100"
                      title={isAyahNoteFullScreen ? "تصغير" : "ملء الشاشة"}
                    >
                      {isAyahNoteFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAyahNoteModal(null)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 transition-colors cursor-pointer"
                      title="إغلاق"
                    >
                      <X size={18} className="text-red-500 dark:text-red-400 stroke-[2.5px]" />
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 custom-scrollbar">
                  {/* Ayah Snippet preview */}
                  {(() => {
                    let cleanNoteAyahText = ayahNoteModal.ayah.text || "";
                    if (ayahNoteModal.surahNumber !== 1 && ayahNoteModal.ayah.numberInSurah === 1) {
                      const bismillahTemplate = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
                      if (cleanNoteAyahText.startsWith(bismillahTemplate)) {
                        cleanNoteAyahText = cleanNoteAyahText.replace(bismillahTemplate, "").trim();
                      }
                    }

                    return (
                      <div 
                        className={`p-4 sm:p-5 rounded-2xl border text-center leading-loose shadow-xs break-normal select-text ${
                          theme === "emerald-velvet"
                            ? "bg-[#01140e] border-[#c5a85c]/20 text-[#FAF8F5]"
                            : theme === "gold-velvet"
                              ? "bg-[#FAF5E6] border-[#c5a85c]/25 text-[#011c14]"
                              : theme === "navy-velvet"
                                ? "bg-slate-50 border-slate-200 text-slate-800"
                                : isDark
                                  ? "bg-slate-950/70 border-slate-800 text-slate-200"
                                  : "bg-emerald-50/60 border-emerald-100 text-emerald-950"
                        }`} 
                        dir="rtl"
                        style={{ 
                          fontFamily: "'Amiri', 'Amiri Naskh', 'Traditional Arabic', serif",
                          wordBreak: "keep-all",
                          overflowWrap: "normal"
                        }}
                      >
                        <Qcf4VerseText
                          surah={ayahNoteModal.surahNumber}
                          ayah={ayahNoteModal.ayah.numberInSurah}
                          page={ayahNoteModal.ayah.page}
                          fallbackText={cleanNoteAyahText}
                          fontSize="20px"
                          theme={theme}
                          isDark={isDark}
                        />
                      </div>
                    );
                  })()}

                  {/* Textarea Area */}
                  <div className="flex-1 flex flex-col gap-2 min-h-0">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold opacity-80">نص الملاحظة أو الفائدة التدبرية:</label>
                      <span className="text-[11px] opacity-60">
                        {ayahNoteText.trim().length} حرف
                      </span>
                    </div>
                    <textarea
                      value={ayahNoteText}
                      onChange={(e) => setAyahNoteText(e.target.value)}
                      placeholder="دوّن خاطرتك، تدبرك، أو فوائدك الإيمانية واللغوية حول هذه الآية المباركة..."
                      className={`w-full flex-1 min-h-[180px] sm:min-h-[220px] p-4 rounded-2xl text-sm sm:text-base leading-relaxed border focus:outline-none transition-all custom-scrollbar resize-none ${
                        theme === "emerald-velvet"
                          ? "bg-[#01140e] border-[#c5a85c]/30 text-[#FAF8F5] focus:border-[#c5a85c]"
                          : theme === "gold-velvet"
                            ? "bg-white border-[#c5a85c]/30 text-black focus:border-[#c5a85c]"
                            : theme === "navy-velvet"
                              ? "bg-white border-slate-200 text-slate-900 focus:border-[#3F63C6]"
                              : isDark
                                ? "bg-slate-950 border-slate-800 text-white focus:border-emerald-500"
                                : "bg-white border-slate-200 text-slate-900 focus:border-emerald-600"
                      }`}
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className={`px-5 py-3 border-t shrink-0 flex items-center justify-between gap-3 ${
                  theme === "emerald-velvet"
                    ? "bg-[#012519]/60 border-[#c5a85c]/20"
                    : theme === "gold-velvet"
                      ? "bg-[#FAF5E6]/60 border-[#c5a85c]/20"
                      : theme === "navy-velvet"
                        ? "bg-slate-50/70 border-slate-200"
                        : isDark
                          ? "bg-slate-950/60 border-slate-800"
                          : "bg-slate-50/70 border-emerald-100"
                }`}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveAyahNote}
                      className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
                        theme === "emerald-velvet"
                          ? "bg-[#c5a85c] text-[#011c14] hover:bg-[#d6ba6d]"
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c] text-[#011c14] hover:bg-[#d6ba6d]"
                            : theme === "navy-velvet"
                              ? "bg-[#3F63C6] text-white hover:bg-[#3252a8]"
                              : isDark
                                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      <Check size={16} />
                      <span>حفظ الملاحظة</span>
                    </button>

                    {localStorage.getItem(`tebyan_user_ayah_notes_${ayahNoteModal.surahNumber}_${ayahNoteModal.ayah.numberInSurah}`) && (
                      <button
                        type="button"
                        onClick={handleDeleteAyahNote}
                        className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 size={14} />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setAyahNoteModal(null)}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Quran Translations Catalog Modal (API Integration) */}
        <TranslationsCatalogModal
          isOpen={isTranslationsCatalogOpen}
          onClose={() => setIsTranslationsCatalogOpen(false)}
          activeMode={continuousActiveMode}
          onSelectTranslation={(book) => {
            setUserCustomTranslationBooks(prev => {
              if (!prev.some(b => b.id === book.id)) {
                return [...prev, book];
              }
              return prev;
            });
            setContinuousActiveMode(book.id);
          }}
          theme={theme}
          isDark={isDark}
        />
    </div>
  );
}
