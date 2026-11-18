import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Share2,
  Download,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  AlignJustify,
  AlignCenter,
  AlignRight,
  ArrowLeftRight,
  Search,
  Sparkles,
  BookOpen,
  SlidersHorizontal,
  Palette,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { surahsList } from "../data/surahList";
import { getSurahStartPage } from "../data/quranSvgPageMetadata";
import { getAyahsForPage } from "../data/quranPageAyahsMap";
import { SURAH_HEADER_POSITIONS } from "../utils/surahHeaderMap";
import { fetchAlquranCloud } from "../utils/quranApi";
import {
  Qcf4Word,
  Qcf4Line,
  fetchQcf4Page,
  fetchQcf4VerseWords,
  loadQcf4Font,
  ensureQbsmlLoaded,
} from "../utils/qcf4Utils";
import {
  isNativeCapacitor,
  isShareCancelledError,
  shareImageOnCapacitor,
  saveImageOnCapacitor,
  copyTextWithFallback,
} from "../utils/nativeShare";
import {
  ShareCardAspectRatio,
  ShareCardFontId,
  ShareCardBgType,
  ShareCardFrameStyle,
  ShareCardAlign,
  ShareCardScope,
  ShareCardVerseItem,
  ShareCardRenderConfig,
  renderShareCardToCanvas,
  exportCanvasToPng,
  toArabicDigits,
} from "../utils/shareCardCanvasRenderer";
import type { ShareAyahData } from "./ShareAyahModal";

interface ShareAyahPageProps {
  initialData?: ShareAyahData | null;
  theme?: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet" | string;
  isDark?: boolean;
  onClose?: () => void;
}

interface StudioPreferences {
  aspectRatio: ShareCardAspectRatio;
  customWidth: number;
  customHeight: number;
  fontId: ShareCardFontId;
  fontSizeScale: number;
  lineHeightScale: number;
  textAlign: ShareCardAlign;
  bgType: ShareCardBgType;
  bgGradientType: "linear" | "radial";
  bgAngle: number;
  bgColor1: string;
  bgColor2: string;
  solidColor: string;
  borderRadius: number;
  textColor: string;
  ayahNumberColor: string;
  frameColor: string;
  frameBgColor: string;
  ornamentOpacity: number;
  textPlateOpacity: number;
  frameStyle: ShareCardFrameStyle;
  showSurahHeader: boolean;
  showIstiadhah: boolean;
  showBismillah: boolean;
  showAyahNumbers: boolean;
  showFooter: boolean;
  showMetadataInFooter: boolean;
}

const STORAGE_PREFS_KEY = "quran_share_studio_prefs_v4";
const STORAGE_LAST_SELECTION_KEY = "quran_share_default_ayah_v3";
const SURAH_TEXT_CACHE_PREFIX = "tebyan_surah_uthmani_v1_";

interface StylePreset {
  id: string;
  name: string;
  bgType: ShareCardBgType;
  bgGradientType: "linear" | "radial";
  bgAngle: number;
  bgColor1: string;
  bgColor2: string;
  solidColor: string;
  textColor: string;
  ayahNumberColor: string;
  frameColor: string;
  frameBgColor: string;
  textPlateOpacity: number;
  ornamentOpacity: number;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: "emerald-royal",
    name: "الزمرد الملكي",
    bgType: "gradient",
    bgGradientType: "radial",
    bgAngle: 145,
    bgColor1: "#044e3b",
    bgColor2: "#011811",
    solidColor: "#011c14",
    textColor: "#FAF8F5",
    ayahNumberColor: "#d9b96c",
    frameColor: "#c5a85c",
    frameBgColor: "#022c20",
    textPlateOpacity: 0.25,
    ornamentOpacity: 0.55,
  },
  {
    id: "parchment-gold",
    name: "رق المصحف",
    bgType: "gradient",
    bgGradientType: "linear",
    bgAngle: 160,
    bgColor1: "#FFFDF7",
    bgColor2: "#F2E9D5",
    solidColor: "#FAF6EB",
    textColor: "#141414",
    ayahNumberColor: "#9a7322",
    frameColor: "#b8903c",
    frameBgColor: "#FFFDF7",
    textPlateOpacity: 0,
    ornamentOpacity: 0.65,
  },
  {
    id: "midnight-navy",
    name: "ليلي كحلي",
    bgType: "gradient",
    bgGradientType: "linear",
    bgAngle: 140,
    bgColor1: "#0f2042",
    bgColor2: "#060c1b",
    solidColor: "#0b1630",
    textColor: "#F8FAFC",
    ayahNumberColor: "#93c5fd",
    frameColor: "#60a5fa",
    frameBgColor: "#0c1b3a",
    textPlateOpacity: 0.22,
    ornamentOpacity: 0.5,
  },
  {
    id: "ivory-sage",
    name: "عاجي هادئ",
    bgType: "solid",
    bgGradientType: "linear",
    bgAngle: 180,
    bgColor1: "#F4F7F4",
    bgColor2: "#E7EFEA",
    solidColor: "#F5F8F5",
    textColor: "#0f291e",
    ayahNumberColor: "#047857",
    frameColor: "#10b981",
    frameBgColor: "#FFFFFF",
    textPlateOpacity: 0,
    ornamentOpacity: 0.45,
  },
  {
    id: "obsidian-gold",
    name: "أسود فاخر",
    bgType: "gradient",
    bgGradientType: "radial",
    bgAngle: 135,
    bgColor1: "#1f1d18",
    bgColor2: "#0b0a08",
    solidColor: "#12110e",
    textColor: "#FBF8F1",
    ayahNumberColor: "#e2be69",
    frameColor: "#c9a34e",
    frameBgColor: "#191712",
    textPlateOpacity: 0.2,
    ornamentOpacity: 0.6,
  },
  {
    id: "pearl-clean",
    name: "أبيض نقي",
    bgType: "solid",
    bgGradientType: "linear",
    bgAngle: 180,
    bgColor1: "#FFFFFF",
    bgColor2: "#F8FAFC",
    solidColor: "#FFFFFF",
    textColor: "#0F172A",
    ayahNumberColor: "#475569",
    frameColor: "#475569",
    frameBgColor: "#F8FAFC",
    textPlateOpacity: 0,
    ornamentOpacity: 0.4,
  },
];

const ASPECT_OPTIONS: { id: ShareCardAspectRatio; label: string; hint: string }[] = [
  { id: "auto", label: "تلقائي", hint: "متمدد" },
  { id: "3:4", label: "طولي", hint: "3:4" },
  { id: "4:3", label: "عرضي", hint: "4:3" },
  { id: "1:1", label: "مربع", hint: "1:1" },
  { id: "custom", label: "مقاس مخصص", hint: "حر" },
];

const FONT_OPTIONS: { id: ShareCardFontId; label: string }[] = [
  { id: "mushaf", label: "مصحف QCF4" },
  { id: "uthmani", label: "حفص العثماني" },
  { id: "amiri", label: "الأميري" },
];

const DEFAULT_PREFS: StudioPreferences = {
  aspectRatio: "3:4",
  customWidth: 1080,
  customHeight: 1350,
  fontId: "mushaf",
  fontSizeScale: 1.0,
  lineHeightScale: 1.75,
  textAlign: "center",
  bgType: "gradient",
  bgGradientType: "radial",
  bgAngle: 145,
  bgColor1: "#044e3b",
  bgColor2: "#011811",
  solidColor: "#FAF6EB",
  borderRadius: 28,
  textColor: "#FAF8F5",
  ayahNumberColor: "#d9b96c",
  frameColor: "#c5a85c",
  frameBgColor: "#022c20",
  ornamentOpacity: 0.55,
  textPlateOpacity: 0.25,
  frameStyle: "authentic",
  showSurahHeader: true,
  showIstiadhah: false,
  showBismillah: true,
  showAyahNumbers: true,
  showFooter: true,
  showMetadataInFooter: true,
};

function loadSavedPrefs(theme?: string): StudioPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_PREFS_KEY);
    if (raw) {
      const merged = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
      if (
        merged.bgType === "solid" &&
        merged.solidColor === "#FFFFFF" &&
        merged.frameColor === "#CBD5E1" &&
        (merged.ayahNumberColor === "#059669" || merged.ayahNumberColor === "#CBD5E1")
      ) {
        merged.frameColor = "#475569";
        merged.ayahNumberColor = "#475569";
      }
      return merged;
    }
  } catch {
    // ignore
  }
  if (theme === "gold-velvet" || theme === "light") {
    const p = STYLE_PRESETS[1];
    return {
      ...DEFAULT_PREFS,
      bgType: p.bgType,
      bgGradientType: p.bgGradientType,
      bgAngle: p.bgAngle,
      bgColor1: p.bgColor1,
      bgColor2: p.bgColor2,
      solidColor: p.solidColor,
      textColor: p.textColor,
      ayahNumberColor: p.ayahNumberColor,
      frameColor: p.frameColor,
      frameBgColor: p.frameBgColor,
      textPlateOpacity: p.textPlateOpacity,
      ornamentOpacity: p.ornamentOpacity,
    };
  }
  return DEFAULT_PREFS;
}

export const ShareAyahPage: React.FC<ShareAyahPageProps> = ({
  initialData,
  theme = "emerald-velvet",
  isDark = false,
  onClose,
}) => {
  // Navigation / Selection state
  const [scope, setScope] = useState<ShareCardScope>(() => initialData?.mode || "single");
  const [surahNumber, setSurahNumber] = useState<number>(() => initialData?.surahNumber || 1);
  const [ayahFrom, setAyahFrom] = useState<number>(() => initialData?.ayah?.numberInSurah || 1);
  const [ayahTo, setAyahTo] = useState<number>(() => initialData?.ayahTo || initialData?.ayah?.numberInSurah || 1);
  const [pageNumber, setPageNumber] = useState<number>(() => {
    if (initialData?.pageNumber) return initialData.pageNumber;
    if (initialData?.ayah?.page) return initialData.ayah.page;
    return getSurahStartPage(initialData?.surahNumber || 1) || 1;
  });

  // Sync if caller passes fresh ayah data while page mounts/updates
  useEffect(() => {
    if (!initialData) return;
    if (initialData.mode) setScope(initialData.mode);
    if (initialData.surahNumber) setSurahNumber(initialData.surahNumber);
    if (initialData.ayah?.numberInSurah) {
      setAyahFrom(initialData.ayah.numberInSurah);
      setAyahTo(initialData.ayahTo || initialData.ayah.numberInSurah);
    }
    if (initialData.pageNumber || initialData.ayah?.page) {
      setPageNumber(initialData.pageNumber || initialData.ayah?.page || 1);
    }
  }, [
    initialData?.surahNumber,
    initialData?.ayah?.numberInSurah,
    initialData?.ayahTo,
    initialData?.pageNumber,
    initialData?.mode,
  ]);

  const currentSurah = useMemo(
    () => surahsList.find((s) => s.number === surahNumber) || surahsList[0],
    [surahNumber]
  );

  useEffect(() => {
    ensureQbsmlLoaded().catch(() => {});
  }, []);

  // Studio preferences & active control sub-tab
  const [prefs, setPrefs] = useState<StudioPreferences>(() => loadSavedPrefs(theme));
  const [controlTab, setControlTab] = useState<"content" | "layout" | "style">("layout");
  const [showSurahPicker, setShowSurahPicker] = useState(false);
  const [surahSearch, setSurahSearch] = useState("");
  const [ayahPickerTarget, setAyahPickerTarget] = useState<"from" | "to" | null>(null);
  const [ayahSearch, setAyahSearch] = useState("");
  const ayahFromDropdownRef = useRef<HTMLDivElement>(null);
  const ayahToDropdownRef = useRef<HTMLDivElement>(null);
  const ayahDragRef = useRef<{ active: boolean; startY: number; startScrollTop: number; moved: boolean }>({
    active: false,
    startY: 0,
    startScrollTop: 0,
    moved: false,
  });
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [pageDropdownSearch, setPageDropdownSearch] = useState("");
  const pageDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ayahPickerTarget) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const inFrom = ayahFromDropdownRef.current?.contains(target);
      const inTo = ayahToDropdownRef.current?.contains(target);
      if (!inFrom && !inTo) {
        setAyahPickerTarget(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    requestAnimationFrame(() => {
      const val = ayahPickerTarget === "to" ? ayahTo : ayahFrom;
      const activeEl = document.getElementById(`share-ayah-${ayahPickerTarget}-opt-${val}`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "center" });
      }
    });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [ayahPickerTarget, ayahFrom, ayahTo]);

  useEffect(() => {
    if (!showPageDropdown) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (pageDropdownRef.current && !pageDropdownRef.current.contains(e.target as Node)) {
        setShowPageDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    requestAnimationFrame(() => {
      const activeItem = document.getElementById(`share-page-opt-${pageNumber}`);
      if (activeItem) {
        activeItem.scrollIntoView({ block: "center" });
      }
    });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showPageDropdown, pageNumber]);

  const pageDropdownOptions = useMemo(
    () =>
      Array.from({ length: 604 }, (_, idx) => {
        const p = idx + 1;
        const headerPositions = SURAH_HEADER_POSITIONS[p];
        if (headerPositions && headerPositions.length > 1) {
          const names = headerPositions
            .map((hp) => surahsList.find((s) => s.number === hp.surah)?.name)
            .filter(Boolean) as string[];
          if (names.length > 0) {
            return {
              page: p,
              surahName: names.join(" · "),
            };
          }
        }
        const meta = getAyahsForPage(p);
        return {
          page: p,
          surahName: meta?.surahNameAr || "",
        };
      }),
    []
  );

  // Persist preferences smoothly
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore quota errors
    }
  }, [prefs]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_LAST_SELECTION_KEY,
        JSON.stringify({
          surahNumber,
          ayahNumber: ayahFrom,
          mode: scope,
          rangeTo: ayahTo,
          pageNumber,
        })
      );
    } catch {
      // ignore
    }
  }, [surahNumber, ayahFrom, scope, ayahTo, pageNumber]);

  const updatePrefs = useCallback(<K extends keyof StudioPreferences>(key: K, val: StudioPreferences[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: val }));
  }, []);

  // Loaded Verse Data & QCF4 tokens
  const [verses, setVerses] = useState<ShareCardVerseItem[]>([]);
  const [qcfPageLines, setQcfPageLines] = useState<Qcf4Line[] | undefined>(undefined);
  const [qcfPageFont, setQcfPageFont] = useState<string | undefined>(undefined);
  const [loadingVerses, setLoadingVerses] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch Surah Uthmani text (cached)
  const fetchSurahAyahsCached = useCallback(async (sNum: number): Promise<{ numberInSurah: number; text: string; page: number }[]> => {
    const cacheKey = `${SURAH_TEXT_CACHE_PREFIX}${sNum}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }

    const res = await fetchAlquranCloud(`v1/surah/${sNum}/quran-uthmani`);
    const rawAyahs = res?.data?.ayahs || [];
    const mapped = rawAyahs.map((a: any) => ({
      numberInSurah: Number(a.numberInSurah),
      text: String(a.text || ""),
      page: Number(a.page || 1),
    }));
    try {
      localStorage.setItem(cacheKey, JSON.stringify(mapped));
    } catch {
      // ignore
    }
    return mapped;
  }, []);

  // Load current selection's Arabic verses + QCF4 words
  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    const loadSelection = async () => {
      setLoadingVerses(true);
      setFetchError(null);

      try {
        if (scope === "page") {
          const safePage = Math.max(1, Math.min(604, pageNumber));
          const pageMeta = getAyahsForPage(safePage);
          const sNum = pageMeta?.surahNumber || surahNumber;
          const sName = pageMeta?.surahNameAr || currentSurah.name;

          const [qcfRes, alqPageRes] = await Promise.allSettled([
            fetchQcf4Page(safePage, ac.signal),
            fetchAlquranCloud(`v1/page/${safePage}/quran-uthmani`),
          ]);

          if (cancelled) return;

          let loadedQcfLines: Qcf4Line[] | undefined;
          let loadedQcfFont: string | undefined;
          const wordsByVerseKey = new Map<string, Qcf4Word[]>();

          if (qcfRes.status === "fulfilled" && qcfRes.value) {
            loadedQcfLines = qcfRes.value.lines;
            loadedQcfFont = qcfRes.value.font;
            const fontsToLoad = new Set<string>();
            if (loadedQcfFont) fontsToLoad.add(loadedQcfFont);
            qcfRes.value.lines.forEach((line) => {
              line.words.forEach((w) => {
                if (w.font) fontsToLoad.add(w.font);
                if (w.verse_key) {
                  const arr = wordsByVerseKey.get(w.verse_key) || [];
                  arr.push(w);
                  wordsByVerseKey.set(w.verse_key, arr);
                }
              });
            });
            await Promise.all(Array.from(fontsToLoad).map((f) => loadQcf4Font(f).catch(() => null)));
          }

          if (cancelled) return;

          let items: ShareCardVerseItem[] = [];
          if (alqPageRes.status === "fulfilled" && Array.isArray(alqPageRes.value?.data?.ayahs)) {
            items = alqPageRes.value.data.ayahs.map((a: any) => {
              const sn = Number(a.surah?.number || sNum);
              const an = Number(a.numberInSurah || 1);
              return {
                surahNumber: sn,
                surahName: String(a.surah?.name || sName),
                numberInSurah: an,
                text: String(a.text || ""),
                page: safePage,
                qcfWords: wordsByVerseKey.get(`${sn}:${an}`),
              };
            });
          } else if (loadedQcfLines) {
            // Build verse placeholders from QCF4 keys so QCF4 can still render cleanly
            const seenKeys = new Set<string>();
            loadedQcfLines.forEach((line) => {
              line.words.forEach((w) => {
                if (w.verse_key && !seenKeys.has(w.verse_key)) {
                  seenKeys.add(w.verse_key);
                  const [snStr, anStr] = w.verse_key.split(":");
                  const sn = Number(snStr) || sNum;
                  const an = Number(anStr) || 1;
                  items.push({
                    surahNumber: sn,
                    surahName: surahsList.find((s) => s.number === sn)?.name || sName,
                    numberInSurah: an,
                    text: w.text || "",
                    page: safePage,
                    qcfWords: wordsByVerseKey.get(w.verse_key),
                  });
                }
              });
            });
          }

          if (items.length === 0) {
            throw new Error("تعذر تحميل آيات الصفحة");
          }

          setQcfPageLines(loadedQcfLines);
          setQcfPageFont(loadedQcfFont);
          setVerses(items);
        } else {
          // single or range
          setQcfPageLines(undefined);
          setQcfPageFont(undefined);

          const maxAyahs = currentSurah.numberOfAyahs;
          const start = Math.max(1, Math.min(maxAyahs, ayahFrom));
          const end = scope === "single" ? start : Math.max(start, Math.min(maxAyahs, ayahTo, start + 19));

          // Seed immediately if caller provided initial ayah text
          if (
            scope === "single" &&
            initialData?.surahNumber === surahNumber &&
            initialData?.ayah?.numberInSurah === start &&
            initialData.ayah.text
          ) {
            setVerses([
              {
                surahNumber,
                surahName: currentSurah.name,
                numberInSurah: start,
                text: initialData.ayah.text,
                page: initialData.ayah.page,
              },
            ]);
          }

          const surahAyahs = await fetchSurahAyahsCached(surahNumber);
          if (cancelled) return;

          const selected = surahAyahs.filter((a) => a.numberInSurah >= start && a.numberInSurah <= end);
          const qcfResults = await Promise.allSettled(
            selected.map((a) => fetchQcf4VerseWords(surahNumber, a.numberInSurah, a.page, ac.signal))
          );

          if (cancelled) return;

          const items: ShareCardVerseItem[] = selected.map((a, idx) => {
            const qRes = qcfResults[idx];
            return {
              surahNumber,
              surahName: currentSurah.name,
              numberInSurah: a.numberInSurah,
              text: a.text,
              page: a.page,
              qcfWords: qRes?.status === "fulfilled" ? qRes.value.words : undefined,
            };
          });

          setVerses(items);
        }
      } catch (err: any) {
        if (err?.name === "AbortError" || cancelled) return;
        setFetchError(err?.message || "تعذر تحميل الآية المحددة، يرجى المحاولة مرة أخرى.");
      } finally {
        if (!cancelled) {
          setLoadingVerses(false);
        }
      }
    };

    loadSelection();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [
    scope,
    surahNumber,
    ayahFrom,
    ayahTo,
    pageNumber,
    currentSurah,
    fetchSurahAyahsCached,
    initialData?.surahNumber,
    initialData?.ayah?.numberInSurah,
    initialData?.ayah?.text,
    initialData?.ayah?.page,
  ]);

  // Canvas & Single-Source-of-Truth Rendering
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasDims, setCanvasDims] = useState<{ width: number; height: number; usedQcf4: boolean }>({
    width: 1080,
    height: 1440,
    usedQcf4: false,
  });
  const [isRenderingCanvas, setIsRenderingCanvas] = useState(false);

  const pageSurahSummary = useMemo(() => {
    if (scope !== "page") {
      return {
        primarySurahNumber: currentSurah.number,
        primarySurahName: currentSurah.name,
        displayLabel: `سورة ${currentSurah.name}`,
      };
    }

    const pageVersesMatch = verses.length > 0 && verses.every((v) => v.page === pageNumber);
    if (pageVersesMatch) {
      const seen = new Set<number>();
      const uniqueList: { number: number; name: string }[] = [];
      for (const v of verses) {
        if (!seen.has(v.surahNumber)) {
          seen.add(v.surahNumber);
          const sObj = surahsList.find((s) => s.number === v.surahNumber);
          const cleanName = (sObj?.name || v.surahName || "")
            .replace(/^سُورَةُ\s+/, "")
            .replace(/^سورة\s+/, "")
            .trim();
          uniqueList.push({ number: v.surahNumber, name: cleanName });
        }
      }
      if (uniqueList.length > 0) {
        return {
          primarySurahNumber: uniqueList[0].number,
          primarySurahName: uniqueList[0].name,
          displayLabel:
            uniqueList.length > 1
              ? uniqueList.map((u) => u.name).join(" · ")
              : `سورة ${uniqueList[0].name}`,
        };
      }
    }

    const meta = getAyahsForPage(pageNumber);
    const headerPositions = SURAH_HEADER_POSITIONS[pageNumber];
    if (headerPositions && headerPositions.length > 1) {
      const names = headerPositions
        .map((hp) => surahsList.find((s) => s.number === hp.surah)?.name)
        .filter(Boolean) as string[];
      if (names.length > 0) {
        return {
          primarySurahNumber: headerPositions[0].surah,
          primarySurahName: names[0],
          displayLabel: names.join(" · "),
        };
      }
    }

    const fallbackNum = meta?.surahNumber || currentSurah.number;
    const fallbackName =
      meta?.surahNameAr || surahsList.find((s) => s.number === fallbackNum)?.name || currentSurah.name;
    return {
      primarySurahNumber: fallbackNum,
      primarySurahName: fallbackName,
      displayLabel: `سورة ${fallbackName}`,
    };
  }, [scope, currentSurah, verses, pageNumber]);

  const renderConfig = useMemo<ShareCardRenderConfig>(
    () => ({
      scope,
      surahNumber: scope === "page" ? pageSurahSummary.primarySurahNumber : surahNumber,
      surahName: scope === "page" ? pageSurahSummary.primarySurahName : currentSurah.name,
      pageNumber,
      ayahFrom,
      ayahTo: scope === "single" ? ayahFrom : ayahTo,
      verses,
      qcfPageLines,
      qcfPageFont,
      aspectRatio: prefs.aspectRatio,
      customWidth: prefs.customWidth,
      customHeight: prefs.customHeight,
      fontId: prefs.fontId,
      fontSizeScale: prefs.fontSizeScale,
      lineHeightScale: prefs.lineHeightScale,
      textAlign: prefs.textAlign,
      bgType: prefs.bgType,
      bgGradientType: prefs.bgGradientType,
      bgAngle: prefs.bgAngle,
      bgColor1: prefs.bgColor1,
      bgColor2: prefs.bgColor2,
      solidColor: prefs.solidColor,
      borderRadius: prefs.borderRadius,
      textColor: prefs.textColor,
      ayahNumberColor: prefs.ayahNumberColor,
      frameColor: prefs.frameColor,
      frameBgColor: prefs.frameBgColor,
      ornamentOpacity: prefs.ornamentOpacity,
      textPlateOpacity: prefs.textPlateOpacity,
      frameStyle: prefs.frameStyle,
      showSurahHeader: prefs.showSurahHeader,
      showIstiadhah: prefs.showIstiadhah,
      showBismillah: prefs.showBismillah,
      showAyahNumbers: prefs.showAyahNumbers,
      showFooter: prefs.showFooter,
      showMetadataInFooter: prefs.showMetadataInFooter,
    }),
    [
      scope,
      surahNumber,
      currentSurah.name,
      pageSurahSummary.primarySurahNumber,
      pageSurahSummary.primarySurahName,
      pageNumber,
      ayahFrom,
      ayahTo,
      verses,
      qcfPageLines,
      qcfPageFont,
      prefs,
    ]
  );

  // Trigger deterministic Canvas redraw whenever renderConfig updates
  const renderGenerationRef = useRef(0);
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || verses.length === 0) return;
    if (scope === "page" && verses[0]?.page !== pageNumber) return;

    const gen = ++renderGenerationRef.current;
    setIsRenderingCanvas(true);

    renderShareCardToCanvas(canvas, renderConfig)
      .then((res) => {
        if (renderGenerationRef.current !== gen) return;
        setCanvasDims({ width: res.width, height: res.height, usedQcf4: res.usedQcf4 });
      })
      .catch((err) => {
        console.warn("Canvas card render warning:", err);
      })
      .finally(() => {
        if (renderGenerationRef.current === gen) {
          setIsRenderingCanvas(false);
        }
      });
  }, [renderConfig, verses, scope, pageNumber]);

  // Sharing / Downloading / Copying Actions
  const [actionBusy, setActionBusy] = useState<"share" | "download" | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [mobilePreviewDataUrl, setMobilePreviewDataUrl] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((curr) => (curr === msg ? null : curr)), 3200);
  }, []);

  const buildShareCaption = useCallback(() => {
    const verseText = verses.map((v) => `${v.text} ﴿${toArabicDigits(v.numberInSurah)}﴾`).join(" ");
    const prefix = prefs.showIstiadhah ? "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ\n" : "";
    const ref =
      scope === "page"
        ? `صفحة ${toArabicDigits(pageNumber)} - ${pageSurahSummary.displayLabel}`
        : scope === "range" && ayahTo > ayahFrom
          ? `سورة ${currentSurah.name} (${toArabicDigits(ayahFrom)}-${toArabicDigits(ayahTo)})`
          : `سورة ${currentSurah.name} - آية ${toArabicDigits(ayahFrom)}`;
    return `${prefix}${verseText}\n\n[${ref} — مصحف التبيان]`;
  }, [verses, prefs.showIstiadhah, scope, pageNumber, pageSurahSummary.displayLabel, currentSurah.name, ayahFrom, ayahTo]);

  const prepareExactCardExport = useCallback(async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) throw new Error("لوحة المعاينة غير جاهزة بعد");
    // Re-run only if canvas hasn't painted yet, otherwise export directly from the SAME visible canvas!
    if (canvas.width === 0 || canvas.height === 0) {
      await renderShareCardToCanvas(canvas, renderConfig);
    }
    return exportCanvasToPng(canvas);
  }, [renderConfig]);

  const handleShareCard = async () => {
    if (actionBusy || verses.length === 0) return;
    setActionBusy("share");
    try {
      const { blob, dataUrl, base64 } = await prepareExactCardExport();
      const fileName =
        scope === "page" ? `mushaf_page_${pageNumber}.png` : `ayah_${surahNumber}_${ayahFrom}.png`;
      const shareTitle =
        scope === "page"
          ? `صفحة ${toArabicDigits(pageNumber)} - ${pageSurahSummary.displayLabel}`
          : `سورة ${currentSurah.name}`;
      const caption = buildShareCaption();

      if (isNativeCapacitor()) {
        const res = await shareImageOnCapacitor({
          base64Data: base64,
          fileName,
          title: shareTitle,
          text: caption,
          dialogTitle: "مشاركة بطاقة الآية",
        });
        if (res.status === "shared") {
          showToast("تمت مشاركة البطاقة بنجاح");
          return;
        }
        if (res.status === "cancelled") {
          return;
        }
      }

      const file = new File([blob], fileName, { type: "image/png" });
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: shareTitle,
              text: caption,
            });
            showToast("تمت مشاركة البطاقة بنجاح");
            return;
          }
        } catch (webErr) {
          if (isShareCancelledError(webErr)) return;
        }
      }

      // Clipboard image fallback
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          showToast("تم نسخ صورة البطاقة إلى الحافظة");
          return;
        } catch {
          // continue to modal viewer
        }
      }

      // Open high-res preview sheet for direct long-press / save on restrictive browsers
      setMobilePreviewDataUrl(dataUrl);
    } catch (err: any) {
      showToast(err?.message || "تعذر تجهيز البطاقة للمشاركة");
    } finally {
      setActionBusy(null);
    }
  };

  const handleDownloadCard = async () => {
    if (actionBusy || verses.length === 0) return;
    setActionBusy("download");
    try {
      const { blob, dataUrl, base64 } = await prepareExactCardExport();
      const fileName =
        scope === "page"
          ? `mushaf_altibyan_p${pageNumber}.png`
          : `mushaf_altibyan_${surahNumber}_${ayahFrom}.png`;

      if (isNativeCapacitor()) {
        const res = await saveImageOnCapacitor({ base64Data: base64, fileName });
        if (res.saved) {
          showToast(res.location ? `تم الحفظ في ${res.location}` : "تم فتح قائمة الحفظ والمشاركة");
          return;
        }
        if (res.cancelled) return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      showToast("تم تنزيل صورة البطاقة بدقة عالية");
      void dataUrl;
    } catch (err: any) {
      showToast(err?.message || "تعذر حفظ الصورة");
    } finally {
      setActionBusy(null);
    }
  };

  const handleCopyVerseText = async () => {
    if (verses.length === 0) return;
    const ok = await copyTextWithFallback(buildShareCaption());
    if (ok) {
      setCopiedText(true);
      showToast("تم نسخ نص الآية مع المصدر");
      setTimeout(() => setCopiedText(false), 2000);
    } else {
      showToast("تعذر النسخ التلقائي");
    }
  };

  const handleApplyPreset = (preset: StylePreset) => {
    setPrefs((prev) => ({
      ...prev,
      bgType: preset.bgType,
      bgGradientType: preset.bgGradientType,
      bgAngle: preset.bgAngle,
      bgColor1: preset.bgColor1,
      bgColor2: preset.bgColor2,
      solidColor: preset.solidColor,
      textColor: preset.textColor,
      ayahNumberColor: preset.ayahNumberColor,
      frameColor: preset.frameColor,
      frameBgColor: preset.frameBgColor,
      textPlateOpacity: preset.textPlateOpacity,
      ornamentOpacity: preset.ornamentOpacity,
    }));
  };

  const handleResetPrefs = () => {
    setPrefs(loadSavedPrefs(theme));
    showToast("تمت استعادة الإعدادات الافتراضية");
  };

  // Surface styling tokens aligned with active app theme
  const surfaceBg =
    theme === "emerald-velvet"
      ? "bg-[#011c14] text-[#FAF8F5]"
      : theme === "gold-velvet"
        ? "bg-[#FAF8F5] text-slate-900"
        : theme === "navy-velvet"
          ? "bg-slate-50 text-slate-900"
          : isDark
            ? "bg-[#09121a] text-slate-100"
            : "bg-slate-50 text-slate-900";

  const panelBg =
    theme === "emerald-velvet"
      ? "bg-[#022a1e]/90 border-[#10b981]/25 text-[#FAF8F5]"
      : theme === "gold-velvet"
        ? "bg-white border-[#c5a85c]/30 text-slate-900"
        : theme === "navy-velvet"
          ? "bg-white border-slate-200 text-slate-900"
          : isDark
            ? "bg-[#0e1924] border-emerald-500/20 text-slate-100"
            : "bg-white border-slate-200 text-slate-900";

  const accentBtn =
    theme === "emerald-velvet"
      ? "bg-[#10b981] text-[#011c14] hover:bg-[#34d399]"
      : theme === "gold-velvet"
        ? "bg-[#b08d38] text-white hover:bg-[#9b7a2c]"
        : theme === "navy-velvet"
          ? "bg-[#3F63C6] text-white hover:bg-[#3352ad]"
          : "bg-emerald-600 text-white hover:bg-emerald-700";

  const mutedChip =
    theme === "emerald-velvet"
      ? "bg-[#012017] border-[#10b981]/20 text-[#FAF8F5]/85 hover:border-[#10b981]/50"
      : theme === "gold-velvet"
        ? "bg-[#FAF6EC] border-[#c5a85c]/30 text-slate-800 hover:border-[#c5a85c]"
        : isDark
          ? "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-emerald-500/50"
          : "bg-slate-100 border-slate-200 text-slate-700 hover:border-emerald-500/50";

  const filteredSurahs = useMemo(() => {
    const q = surahSearch.trim();
    if (!q) return surahsList;
    return surahsList.filter(
      (s) => s.name.includes(q) || String(s.number).includes(q)
    );
  }, [surahSearch]);

  const stepVerse = (dir: -1 | 1) => {
    if (scope === "page") {
      setPageNumber((p) => Math.max(1, Math.min(604, p + dir)));
      return;
    }
    const maxAyahs = currentSurah.numberOfAyahs;
    const nextFrom = ayahFrom + dir;
    if (nextFrom < 1) {
      if (surahNumber > 1) {
        const prevS = surahsList.find((s) => s.number === surahNumber - 1);
        setSurahNumber(surahNumber - 1);
        const endNum = prevS?.numberOfAyahs || 1;
        setAyahFrom(endNum);
        setAyahTo(endNum);
      }
    } else if (nextFrom > maxAyahs) {
      if (surahNumber < 114) {
        setSurahNumber(surahNumber + 1);
        setAyahFrom(1);
        setAyahTo(1);
      }
    } else {
      const span = Math.max(0, ayahTo - ayahFrom);
      setAyahFrom(nextFrom);
      setAyahTo(Math.min(maxAyahs, nextFrom + span));
    }
  };

  return (
    <div
      id="share-ayah-page-root"
      dir="rtl"
      className={`w-full max-w-6xl mx-auto flex flex-col gap-4 select-none ${surfaceBg}`}
    >
      {/* Inline Notification Bar */}
      {toastMsg && (
        <div
          role="status"
          className={`rounded-xl px-4 py-2.5 text-xs font-bold border flex items-center justify-between gap-2 ${accentBtn} border-transparent shadow-sm`}
        >
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="opacity-80 hover:opacity-100 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main Responsive Split Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_410px] gap-5 items-start">
        {/* Column 1: Live Single-Source Canvas Preview Stage + Direct Share Actions */}
        <section className={`rounded-2xl border p-4 sm:p-5 flex flex-col gap-4 shadow-sm ${panelBg}`}>
          {/* Top Reference Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={17} className="shrink-0 opacity-80" />
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold truncate">
                  {scope === "page"
                    ? `صفحة ${toArabicDigits(pageNumber)} — ${pageSurahSummary.displayLabel}`
                    : scope === "range" && ayahTo > ayahFrom
                      ? `سورة ${currentSurah.name} · الآيات ${toArabicDigits(ayahFrom)} – ${toArabicDigits(ayahTo)}`
                      : `سورة ${currentSurah.name} · آية ${toArabicDigits(ayahFrom)}`}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-75">
              <span>{toArabicDigits(canvasDims.width)} × {toArabicDigits(canvasDims.height)}</span>
              <span>·</span>
              <span>{prefs.aspectRatio === "auto" ? "تلقائي" : prefs.aspectRatio}</span>
            </div>
          </div>

          {/* Live Canvas Frame (100% Exact Output Preview) */}
          <div
            className="relative w-full rounded-xl border border-black/10 dark:border-white/10 p-3 sm:p-5 flex items-center justify-center min-h-[280px] sm:min-h-[380px] max-h-[58vh] overflow-hidden"
            style={{
              backgroundImage:
                prefs.bgType === "transparent"
                  ? "repeating-conic-gradient(rgba(128,128,128,0.14) 0% 25%, transparent 0% 50%)"
                  : undefined,
              backgroundSize: prefs.bgType === "transparent" ? "20px 20px" : undefined,
              backgroundColor:
                prefs.bgType === "transparent"
                  ? "transparent"
                  : theme === "emerald-velvet" || isDark
                    ? "rgba(0,0,0,0.28)"
                    : "rgba(15,23,42,0.04)",
            }}
          >
            {fetchError && verses.length === 0 ? (
              <div className="text-center p-6 text-xs font-semibold text-red-500">
                {fetchError}
              </div>
            ) : (
              <canvas
                id="share-ayah-truth-canvas"
                ref={previewCanvasRef}
                className="max-w-full max-h-[50vh] w-auto h-auto object-contain rounded-xl shadow-[0_14px_40px_rgba(0,0,0,0.28)] transition-opacity duration-150"
                style={{
                  opacity: isRenderingCanvas && verses.length === 0 ? 0.5 : 1,
                }}
              />
            )}

            {(loadingVerses || isRenderingCanvas) && (
              <div className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-lg bg-black/55 text-white text-[10px] font-bold backdrop-blur-xs">
                جاري التجهيز...
              </div>
            )}
          </div>

          {/* Primary Action Bar */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              id="share-page-btn-send"
              type="button"
              onClick={handleShareCard}
              disabled={actionBusy !== null || verses.length === 0}
              className={`min-h-[46px] rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 ${accentBtn}`}
            >
              <Share2 size={17} />
              <span>{actionBusy === "share" ? "جاري التجهيز..." : "مشاركة البطاقة"}</span>
            </button>

            <button
              id="share-page-btn-download"
              type="button"
              onClick={handleDownloadCard}
              disabled={actionBusy !== null || verses.length === 0}
              className={`min-h-[46px] rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 ${mutedChip}`}
            >
              <Download size={17} />
              <span>{actionBusy === "download" ? "جاري الحفظ..." : "حفظ PNG"}</span>
            </button>

            <button
              id="share-page-btn-copy-text"
              type="button"
              onClick={handleCopyVerseText}
              disabled={verses.length === 0}
              className={`min-h-[46px] rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 ${mutedChip}`}
            >
              {copiedText ? <Check size={17} /> : <Copy size={17} />}
              <span>{copiedText ? "تم النسخ" : "نسخ النص"}</span>
            </button>
          </div>
        </section>

        {/* Column 2: Studio Configuration Panel */}
        <aside className={`rounded-2xl border p-4 sm:p-5 flex flex-col gap-4 shadow-sm ${panelBg}`}>
          {/* Clean Segmented Studio Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl border border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setControlTab("content")}
              className={`min-h-[42px] rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                controlTab === "content" ? accentBtn : "opacity-75 hover:opacity-100"
              }`}
            >
              <BookOpen size={15} />
              <span>الآيات</span>
            </button>

            <button
              type="button"
              onClick={() => setControlTab("layout")}
              className={`min-h-[42px] rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                controlTab === "layout" ? accentBtn : "opacity-75 hover:opacity-100"
              }`}
            >
              <SlidersHorizontal size={15} />
              <span>المقاس والخط</span>
            </button>

            <button
              type="button"
              onClick={() => setControlTab("style")}
              className={`min-h-[42px] rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                controlTab === "style" ? accentBtn : "opacity-75 hover:opacity-100"
              }`}
            >
              <Palette size={15} />
              <span>التصميم</span>
            </button>
          </div>

          {/* Tab 1: Content Selection */}
          {controlTab === "content" && (
            <div className="flex flex-col gap-4">
              {/* Scope Selector */}
              <div>
                <label className="block text-[11px] font-bold opacity-75 mb-1.5">نطاق المشاركة</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "single", label: "آية واحدة" },
                      { id: "range", label: "نطاق آيات" },
                      { id: "page", label: "صفحة كاملة" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (scope === "page" && item.id !== "page") {
                          const targetSurah = pageSurahSummary.primarySurahNumber;
                          const firstOnPage = verses.find((v) => v.surahNumber === targetSurah)?.numberInSurah || 1;
                          setSurahNumber(targetSurah);
                          setAyahFrom(firstOnPage);
                          setAyahTo(firstOnPage);
                        } else if (scope !== "page" && item.id === "page") {
                          const activePage = verses[0]?.page || getSurahStartPage(surahNumber);
                          if (activePage >= 1 && activePage <= 604) {
                            setPageNumber(activePage);
                          }
                        }
                        setScope(item.id);
                      }}
                      className={`min-h-[44px] rounded-xl border text-xs font-bold transition cursor-pointer ${
                        scope === item.id ? `${accentBtn} border-transparent` : mutedChip
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {scope === "page" ? (
                <div>
                  <label className="block text-[11px] font-bold opacity-75 mb-1.5">رقم الصفحة (١ – ٦٠٤)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => stepVerse(-1)}
                      className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center cursor-pointer shrink-0 ${mutedChip}`}
                      title="الصفحة السابقة"
                    >
                      <ChevronRight size={18} />
                    </button>

                    <div ref={pageDropdownRef} className="relative flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setPageDropdownSearch("");
                          setShowPageDropdown((prev) => !prev);
                        }}
                        className={`w-full min-h-[44px] rounded-xl border px-3 flex items-center justify-between gap-2 font-bold text-sm cursor-pointer ${mutedChip}`}
                      >
                        <span className="truncate">
                          صفحة {toArabicDigits(pageNumber)} — {pageSurahSummary.displayLabel}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`shrink-0 transition-transform ${showPageDropdown ? "rotate-180" : ""}`}
                        />
                      </button>

                      {showPageDropdown && (
                        <div
                          className={`absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border shadow-2xl max-h-64 flex flex-col overflow-hidden ${panelBg}`}
                        >
                          <div className="p-2 border-b border-black/10 dark:border-white/10 flex items-center gap-2 sticky top-0 bg-inherit z-10">
                            <Search size={14} className="opacity-65 shrink-0" />
                            <input
                              type="text"
                              value={pageDropdownSearch}
                              onChange={(e) => setPageDropdownSearch(e.target.value)}
                              placeholder="ابحث برقم الصفحة أو السورة..."
                              className="w-full bg-transparent text-xs font-bold outline-none"
                              autoFocus
                            />
                          </div>

                          <div className="overflow-y-auto custom-scrollbar flex-1 p-1.5 space-y-1">
                            {(() => {
                              const q = pageDropdownSearch.trim();
                              const filtered = q
                                ? pageDropdownOptions.filter(
                                    (opt) =>
                                      String(opt.page).includes(q) ||
                                      toArabicDigits(opt.page).includes(q) ||
                                      opt.surahName.includes(q)
                                  )
                                : pageDropdownOptions;

                              if (filtered.length === 0) {
                                return (
                                  <div className="py-5 text-center text-xs font-bold opacity-65">
                                    لا توجد صفحة مطابقة
                                  </div>
                                );
                              }

                              return filtered.map((opt) => (
                                <button
                                  id={`share-page-opt-${opt.page}`}
                                  key={opt.page}
                                  type="button"
                                  onClick={() => {
                                    setPageNumber(opt.page);
                                    setShowPageDropdown(false);
                                    setPageDropdownSearch("");
                                  }}
                                  className={`w-full px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition ${
                                    opt.page === pageNumber ? accentBtn : "hover:bg-black/5 dark:hover:bg-white/10"
                                  }`}
                                >
                                  <span>صفحة {toArabicDigits(opt.page)}</span>
                                  {opt.surahName && (
                                    <span className="text-[11px] opacity-80 truncate">{opt.surahName}</span>
                                  )}
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => stepVerse(1)}
                      className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center cursor-pointer shrink-0 ${mutedChip}`}
                      title="الصفحة التالية"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Surah Selector Button */}
                  <div>
                    <label className="block text-[11px] font-bold opacity-75 mb-1.5">السورة الكريمة</label>
                    <button
                      type="button"
                      onClick={() => setShowSurahPicker(true)}
                      className={`w-full min-h-[46px] rounded-xl border px-3.5 flex items-center justify-between font-bold text-sm cursor-pointer ${mutedChip}`}
                    >
                      <span>{toArabicDigits(currentSurah.number)}. سورة {currentSurah.name}</span>
                      <span className="text-[11px] opacity-70">{toArabicDigits(currentSurah.numberOfAyahs)} آية</span>
                    </button>
                  </div>

                  {/* Ayah / Range Inputs */}
                  <div className={`grid ${scope === "range" ? "grid-cols-2 gap-2" : "grid-cols-1 gap-3"}`}>
                    <div>
                      <label className="block text-[11px] font-bold opacity-75 mb-1.5">
                        {scope === "range" ? "من الآية" : "رقم الآية"}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => stepVerse(-1)}
                          className={`min-w-[38px] min-h-[44px] rounded-xl border flex items-center justify-center cursor-pointer shrink-0 ${mutedChip}`}
                          title="الآية السابقة"
                        >
                          <ChevronRight size={17} />
                        </button>

                        <div ref={ayahFromDropdownRef} className="relative flex-1 min-w-0">
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              readOnly
                              min={1}
                              max={currentSurah.numberOfAyahs}
                              value={ayahFrom}
                              onClick={() => {
                                setAyahSearch("");
                                setAyahPickerTarget((prev) => (prev === "from" ? null : "from"));
                              }}
                              title="اضغط لاختيار رقم الآية"
                              className={`w-full min-w-0 min-h-[44px] rounded-xl border pl-7 pr-2 text-center font-bold text-sm outline-none cursor-pointer ${mutedChip}`}
                            />
                            <ChevronDown
                              size={15}
                              className={`pointer-events-none absolute left-2 opacity-70 transition-transform ${
                                ayahPickerTarget === "from" ? "rotate-180" : ""
                              }`}
                            />
                          </div>

                          {ayahPickerTarget === "from" && (
                            <div
                              className={`absolute top-full right-0 min-w-[165px] w-full max-w-[calc(100vw-2rem)] mt-1.5 z-50 rounded-xl border shadow-2xl max-h-64 flex flex-col overflow-hidden ${panelBg}`}
                            >
                              {currentSurah.numberOfAyahs > 15 && (
                                <div className="p-2 border-b border-black/10 dark:border-white/10 flex items-center gap-1.5 sticky top-0 bg-inherit z-10">
                                  <Search size={14} className="opacity-65 shrink-0" />
                                  <input
                                    type="number"
                                    min={1}
                                    max={currentSurah.numberOfAyahs}
                                    value={ayahSearch}
                                    onChange={(e) => setAyahSearch(e.target.value)}
                                    placeholder="رقم الآية..."
                                    className="w-full bg-transparent text-xs font-bold outline-none"
                                    autoFocus
                                  />
                                </div>
                              )}

                              <div
                                onPointerDown={(e) => {
                                  if (e.pointerType !== "mouse") return;
                                  ayahDragRef.current = {
                                    active: true,
                                    startY: e.clientY,
                                    startScrollTop: e.currentTarget.scrollTop,
                                    moved: false,
                                  };
                                }}
                                onPointerMove={(e) => {
                                  if (!ayahDragRef.current.active || e.pointerType !== "mouse") return;
                                  const dy = e.clientY - ayahDragRef.current.startY;
                                  if (Math.abs(dy) > 4) ayahDragRef.current.moved = true;
                                  e.currentTarget.scrollTop = ayahDragRef.current.startScrollTop - dy;
                                }}
                                onPointerUp={() => {
                                  ayahDragRef.current.active = false;
                                  setTimeout(() => {
                                    ayahDragRef.current.moved = false;
                                  }, 0);
                                }}
                                onPointerCancel={() => {
                                  ayahDragRef.current.active = false;
                                  ayahDragRef.current.moved = false;
                                }}
                                style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
                                className="flex-1 overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar p-1.5 flex flex-col gap-1 cursor-grab active:cursor-grabbing select-none"
                              >
                                {(() => {
                                  const q = ayahSearch.trim();
                                  const nums: number[] = [];
                                  for (let n = 1; n <= currentSurah.numberOfAyahs; n++) {
                                    if (!q || String(n).includes(q) || toArabicDigits(n).includes(q)) {
                                      nums.push(n);
                                    }
                                  }
                                  if (nums.length === 0) {
                                    return (
                                      <div className="py-4 text-center text-xs font-bold opacity-65">
                                        لا يوجد رقم مطابق
                                      </div>
                                    );
                                  }
                                  return nums.map((n) => (
                                    <button
                                      id={`share-ayah-from-opt-${n}`}
                                      key={n}
                                      type="button"
                                      onClick={() => {
                                        if (ayahDragRef.current.moved) return;
                                        setAyahFrom(n);
                                        if (scope === "single") {
                                          setAyahTo(n);
                                        } else if (ayahTo < n) {
                                          setAyahTo(n);
                                        } else if (ayahTo > n + 19) {
                                          setAyahTo(Math.min(currentSurah.numberOfAyahs, n + 19));
                                        }
                                        setAyahPickerTarget(null);
                                        setAyahSearch("");
                                      }}
                                      className={`w-full min-h-[38px] shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                                        n === ayahFrom ? accentBtn : "hover:bg-black/5 dark:hover:bg-white/10"
                                      }`}
                                    >
                                      <span>الآية {toArabicDigits(n)}</span>
                                      {n === ayahFrom && <Check size={14} />}
                                    </button>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => stepVerse(1)}
                          className={`min-w-[38px] min-h-[44px] rounded-xl border flex items-center justify-center cursor-pointer shrink-0 ${mutedChip}`}
                          title="الآية التالية"
                        >
                          <ChevronLeft size={17} />
                        </button>
                      </div>
                    </div>

                    {scope === "range" && (
                      <div>
                        <label className="block text-[11px] font-bold opacity-75 mb-1.5 truncate">
                          إلى الآية (بحد أقصى ٢٠)
                        </label>
                        <div ref={ayahToDropdownRef} className="relative">
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              readOnly
                              min={ayahFrom}
                              max={Math.min(currentSurah.numberOfAyahs, ayahFrom + 19)}
                              value={ayahTo}
                              onClick={() => {
                                setAyahSearch("");
                                setAyahPickerTarget((prev) => (prev === "to" ? null : "to"));
                              }}
                              title="اضغط لاختيار رقم الآية"
                              className={`w-full min-h-[44px] rounded-xl border pl-7 pr-2 text-center font-bold text-sm outline-none cursor-pointer ${mutedChip}`}
                            />
                            <ChevronDown
                              size={15}
                              className={`pointer-events-none absolute left-2 opacity-70 transition-transform ${
                                ayahPickerTarget === "to" ? "rotate-180" : ""
                              }`}
                            />
                          </div>

                          {ayahPickerTarget === "to" && (
                            <div
                              className={`absolute top-full left-0 min-w-[165px] w-full max-w-[calc(100vw-2rem)] mt-1.5 z-50 rounded-xl border shadow-2xl max-h-64 flex flex-col overflow-hidden ${panelBg}`}
                            >
                              <div
                                onPointerDown={(e) => {
                                  if (e.pointerType !== "mouse") return;
                                  ayahDragRef.current = {
                                    active: true,
                                    startY: e.clientY,
                                    startScrollTop: e.currentTarget.scrollTop,
                                    moved: false,
                                  };
                                }}
                                onPointerMove={(e) => {
                                  if (!ayahDragRef.current.active || e.pointerType !== "mouse") return;
                                  const dy = e.clientY - ayahDragRef.current.startY;
                                  if (Math.abs(dy) > 4) ayahDragRef.current.moved = true;
                                  e.currentTarget.scrollTop = ayahDragRef.current.startScrollTop - dy;
                                }}
                                onPointerUp={() => {
                                  ayahDragRef.current.active = false;
                                  setTimeout(() => {
                                    ayahDragRef.current.moved = false;
                                  }, 0);
                                }}
                                onPointerCancel={() => {
                                  ayahDragRef.current.active = false;
                                  ayahDragRef.current.moved = false;
                                }}
                                style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
                                className="flex-1 overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar p-1.5 flex flex-col gap-1 cursor-grab active:cursor-grabbing select-none"
                              >
                                {(() => {
                                  const maxTo = Math.min(currentSurah.numberOfAyahs, ayahFrom + 19);
                                  const nums: number[] = [];
                                  for (let n = ayahFrom; n <= maxTo; n++) {
                                    nums.push(n);
                                  }
                                  return nums.map((n) => (
                                    <button
                                      id={`share-ayah-to-opt-${n}`}
                                      key={n}
                                      type="button"
                                      onClick={() => {
                                        if (ayahDragRef.current.moved) return;
                                        setAyahTo(n);
                                        setAyahPickerTarget(null);
                                      }}
                                      className={`w-full min-h-[38px] shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                                        n === ayahTo ? accentBtn : "hover:bg-black/5 dark:hover:bg-white/10"
                                      }`}
                                    >
                                      <span>الآية {toArabicDigits(n)}</span>
                                      {n === ayahTo && <Check size={14} />}
                                    </button>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Aspect Ratio & Typography */}
          {controlTab === "layout" && (
            <div className="flex flex-col gap-4">
              {/* 8 Aspect Ratios Grid */}
              <div id="share-aspect-controls">
                <label className="block text-[11px] font-bold opacity-75 mb-1.5">مقاس البطاقة</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {ASPECT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updatePrefs("aspectRatio", opt.id)}
                      className={`min-h-[46px] rounded-xl border px-1.5 py-1 flex flex-col items-center justify-center text-center transition cursor-pointer ${
                        prefs.aspectRatio === opt.id ? `${accentBtn} border-transparent` : mutedChip
                      }`}
                    >
                      <span className="text-[11px] font-extrabold leading-tight">{opt.label}</span>
                      <span className="text-[9px] opacity-75">{opt.hint}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Dimensions Inputs */}
                {prefs.aspectRatio === "custom" && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1">
                      <span className="block text-[10px] font-bold opacity-70 mb-1">العرض (px)</span>
                      <input
                        type="number"
                        min={320}
                        max={2400}
                        step={20}
                        value={prefs.customWidth}
                        onChange={(e) => updatePrefs("customWidth", Math.max(320, Math.min(2400, Number(e.target.value) || 1080)))}
                        className={`w-full min-h-[40px] rounded-xl border px-2 text-center text-xs font-bold outline-none ${mutedChip}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPrefs((prev) => ({
                          ...prev,
                          customWidth: prev.customHeight,
                          customHeight: prev.customWidth,
                        }))
                      }
                      className={`mt-4 min-w-[40px] min-h-[40px] rounded-xl border flex items-center justify-center cursor-pointer ${mutedChip}`}
                      title="تبديل العرض والارتفاع"
                    >
                      <ArrowLeftRight size={15} />
                    </button>
                    <div className="flex-1">
                      <span className="block text-[10px] font-bold opacity-70 mb-1">الارتفاع (px)</span>
                      <input
                        type="number"
                        min={320}
                        max={2400}
                        step={20}
                        value={prefs.customHeight}
                        onChange={(e) => updatePrefs("customHeight", Math.max(320, Math.min(2400, Number(e.target.value) || 1350)))}
                        className={`w-full min-h-[40px] rounded-xl border px-2 text-center text-xs font-bold outline-none ${mutedChip}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Font Selection */}
              <div>
                <label className="block text-[11px] font-bold opacity-75 mb-1.5">خط الآيات</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updatePrefs("fontId", f.id)}
                      className={`min-h-[42px] rounded-xl border px-2 text-[11px] font-bold transition cursor-pointer ${
                        prefs.fontId === f.id ? `${accentBtn} border-transparent` : mutedChip
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alignment */}
              <div>
                <label className="block text-[11px] font-bold opacity-75 mb-1.5">محاذاة النص</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: "center", label: "توسيط", Icon: AlignCenter },
                      { id: "justify", label: "ضبط كامل", Icon: AlignJustify },
                      { id: "right", label: "يمين", Icon: AlignRight },
                    ] as const
                  ).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updatePrefs("textAlign", id)}
                      className={`min-h-[42px] rounded-xl border flex items-center justify-center gap-1.5 text-[11px] font-bold cursor-pointer ${
                        prefs.textAlign === id ? `${accentBtn} border-transparent` : mutedChip
                      }`}
                    >
                      <Icon size={14} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Scale & Line Height Sliders */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] font-bold opacity-75 mb-1">
                    <span>حجم الخط</span>
                    <span>{Math.round(prefs.fontSizeScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.7}
                    max={1.45}
                    step={0.05}
                    value={prefs.fontSizeScale}
                    onChange={(e) => updatePrefs("fontSizeScale", Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold opacity-75 mb-1">
                    <span>تباعد السطور</span>
                    <span>{prefs.lineHeightScale.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={1.4}
                    max={2.4}
                    step={0.05}
                    value={prefs.lineHeightScale}
                    onChange={(e) => updatePrefs("lineHeightScale", Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Colors, Presets & Card Elements */}
          {controlTab === "style" && (
            <div className="flex flex-col gap-4">
              {/* Ready Theme Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold opacity-75">قوالب جاهزة</label>
                  <button
                    type="button"
                    onClick={handleResetPrefs}
                    className="flex items-center gap-1 text-[11px] font-bold opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>إعادة ضبط</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`min-h-[42px] rounded-xl border px-2 flex items-center gap-2 text-[11px] font-bold cursor-pointer ${mutedChip}`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-black/15"
                        style={{
                          background:
                            preset.bgType === "gradient"
                              ? `linear-gradient(135deg, ${preset.bgColor1}, ${preset.bgColor2})`
                              : preset.solidColor,
                        }}
                      />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Type */}
              <div>
                <label className="block text-[11px] font-bold opacity-75 mb-1.5">الخلفية</label>
                <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                  {(
                    [
                      { id: "gradient", label: "متدرج" },
                      { id: "solid", label: "لون موحد" },
                      { id: "transparent", label: "شفاف PNG" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updatePrefs("bgType", item.id)}
                      className={`min-h-[40px] rounded-xl border text-[11px] font-bold cursor-pointer ${
                        prefs.bgType === item.id ? `${accentBtn} border-transparent` : mutedChip
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-4 gap-2">
                  {prefs.bgType !== "transparent" && (
                    <label className="flex flex-col items-center gap-1 text-[10px] font-bold opacity-80 cursor-pointer">
                      <input
                        type="color"
                        value={prefs.bgType === "solid" ? prefs.solidColor : prefs.bgColor1}
                        onChange={(e) =>
                          updatePrefs(prefs.bgType === "solid" ? "solidColor" : "bgColor1", e.target.value)
                        }
                        className="w-10 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                      />
                      <span>{prefs.bgType === "solid" ? "الخلفية" : "لون ١"}</span>
                    </label>
                  )}

                  {prefs.bgType === "gradient" && (
                    <label className="flex flex-col items-center gap-1 text-[10px] font-bold opacity-80 cursor-pointer">
                      <input
                        type="color"
                        value={prefs.bgColor2}
                        onChange={(e) => updatePrefs("bgColor2", e.target.value)}
                        className="w-10 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                      />
                      <span>لون ٢</span>
                    </label>
                  )}

                  <label className="flex flex-col items-center gap-1 text-[10px] font-bold opacity-80 cursor-pointer">
                    <input
                      type="color"
                      value={prefs.textColor}
                      onChange={(e) => updatePrefs("textColor", e.target.value)}
                      className="w-10 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                    />
                    <span>النص</span>
                  </label>

                  <label className="flex flex-col items-center gap-1 text-[10px] font-bold opacity-80 cursor-pointer">
                    <input
                      type="color"
                      value={prefs.frameColor}
                      onChange={(e) => updatePrefs("frameColor", e.target.value)}
                      className="w-10 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                    />
                    <span>الإطار</span>
                  </label>
                </div>
              </div>

              {/* Surah Header Frame Style */}
              <div>
                <label className="block text-[11px] font-bold opacity-75 mb-1.5">إطار اسم السورة</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: "authentic", label: "مصحفي" },
                      { id: "classic", label: "كلاسيك" },
                      { id: "minimal", label: "بسيط" },
                      { id: "none", label: "بدون" },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        if (st.id === "none") {
                          updatePrefs("showSurahHeader", false);
                          updatePrefs("frameStyle", "none");
                        } else {
                          updatePrefs("showSurahHeader", true);
                          updatePrefs("frameStyle", st.id);
                        }
                      }}
                      className={`min-h-[40px] rounded-xl border text-[11px] font-bold cursor-pointer ${
                        (st.id === "none" ? !prefs.showSurahHeader : prefs.showSurahHeader && prefs.frameStyle === st.id)
                          ? `${accentBtn} border-transparent`
                          : mutedChip
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility Toggles */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. إظهار البسملة (right cell in RTL) */}
                <button
                  type="button"
                  onClick={() => updatePrefs("showBismillah", !prefs.showBismillah)}
                  className={`min-h-[42px] rounded-xl border px-3 flex items-center justify-between text-[11px] font-bold cursor-pointer ${
                    prefs.showBismillah ? `${accentBtn} border-transparent` : mutedChip
                  }`}
                >
                  <span>إظهار البسملة</span>
                  <span>{prefs.showBismillah ? "مفعل" : "مخفي"}</span>
                </button>

                {/* 2. زر الاستعاذة */}
                <button
                  id="share-toggle-istiadhah"
                  type="button"
                  onClick={() => updatePrefs("showIstiadhah", !prefs.showIstiadhah)}
                  title="إظهار أو إخفاء الاستعاذة (أعوذ بالله من الشيطان الرجيم)"
                  className={`min-h-[42px] rounded-xl border px-3 flex items-center justify-between gap-1.5 text-[11px] font-bold cursor-pointer ${
                    prefs.showIstiadhah ? `${accentBtn} border-transparent` : mutedChip
                  }`}
                >
                  <span className="truncate">الاستعاذة</span>
                  <span className="shrink-0">{prefs.showIstiadhah ? "مفعل" : "مخفي"}</span>
                </button>

                {(
                  [
                    { key: "showAyahNumbers", label: "أرقام الآيات" },
                    { key: "showFooter", label: "شعار التطبيق" },
                  ] as const
                ).map((item) => {
                  const active = prefs[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updatePrefs(item.key, !active)}
                      className={`min-h-[42px] rounded-xl border px-3 flex items-center justify-between text-[11px] font-bold cursor-pointer ${
                        active ? `${accentBtn} border-transparent` : mutedChip
                      }`}
                    >
                      <span>{item.label}</span>
                      <span>{active ? "مفعل" : "مخفي"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Close Shortcut when opened from Drawer */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`mt-1 min-h-[42px] rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${mutedChip}`}
            >
              <X size={15} />
              <span>العودة إلى المصحف</span>
            </button>
          )}
        </aside>
      </div>

      {/* Built-in Clean Surah Picker Dialog */}
      {showSurahPicker && (
        <div
          className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowSurahPicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md max-h-[75vh] rounded-2xl border p-4 flex flex-col gap-3 shadow-2xl ${panelBg}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold">اختيار السورة</h3>
              <button
                type="button"
                onClick={() => setShowSurahPicker(false)}
                className="p-1.5 rounded-lg opacity-75 hover:opacity-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`flex items-center gap-2 px-3 rounded-xl border min-h-[42px] ${mutedChip}`}>
              <Search size={16} className="opacity-65" />
              <input
                type="text"
                placeholder="ابحث باسم السورة أو رقمها..."
                value={surahSearch}
                onChange={(e) => setSurahSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-xs font-bold"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-1.5 pr-1">
              {filteredSurahs.map((s) => (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => {
                    setSurahNumber(s.number);
                    setAyahFrom(1);
                    setAyahTo(1);
                    setPageNumber(getSurahStartPage(s.number) || 1);
                    setShowSurahPicker(false);
                  }}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 flex items-center justify-between text-xs font-bold cursor-pointer ${
                    s.number === surahNumber ? `${accentBtn} border-transparent` : mutedChip
                  }`}
                >
                  <span>{toArabicDigits(s.number)}. {s.name}</span>
                  <span className="text-[10px] opacity-75">{toArabicDigits(s.numberOfAyahs)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fallback Image Viewer when Browser Blocks Direct Share */}
      {mobilePreviewDataUrl && (
        <div
          id="share-page-mobile-sheet"
          className="fixed inset-0 z-[750] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setMobilePreviewDataUrl(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border p-4 flex flex-col gap-3 shadow-2xl ${panelBg}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-sm">
                <ImageIcon size={17} />
                <span>البطاقة جاهزة للحفظ</span>
              </div>
              <button
                type="button"
                onClick={() => setMobilePreviewDataUrl(null)}
                className="p-1.5 rounded-lg opacity-75 hover:opacity-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs opacity-80">
              اضغط مطولاً على الصورة لحفظها في ألبوم الصور، أو استخدم زر التنزيل أدناه.
            </p>
            <img
              src={mobilePreviewDataUrl}
              alt="بطاقة الآية"
              className="w-full max-h-[55vh] object-contain rounded-xl border border-black/10"
            />
            <a
              href={mobilePreviewDataUrl}
              download={
                scope === "page"
                  ? `mushaf_altibyan_p${pageNumber}.png`
                  : `mushaf_altibyan_${surahNumber}_${ayahFrom}.png`
              }
              className={`min-h-[44px] rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 ${accentBtn}`}
            >
              <Download size={16} />
              <span>تنزيل الصورة الآن</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareAyahPage;
