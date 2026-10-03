import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Bookmark, QuranSettings } from "./types";
import IndexScreen from "./components/IndexScreen";
import ReadingScreen from "./components/ReadingScreen";
import { BookOpen, Heart, Settings, Sparkles, Compass, Moon, Sun, Calendar, Library, BookOpenCheck, Bookmark as BookmarkIcon, List, Zap, Play, Pause, ChevronsUp, Headphones, Download, HardDrive, X, Share2 } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { translations } from "./data/translations";
import { startAutoQuranDownload, getCachedPagesCount } from "./utils/quranPageCache";
import { startAppBackgroundDownloads } from "./utils/backgroundDownloadManager";
import { initOfflineFonts } from "./utils/fontOfflineCache";
import { fetchQuranSvg } from "./utils/quranApi";
import { quranSvgPageMetadata, getSurahStartPage } from "./data/quranSvgPageMetadata";
import { getAyahsForPage } from "./data/quranPageAyahsMap";
import { quartersList } from "./data/quartersData";
import { surahsList } from "./data/surahList";
import RecitationScreen from "./components/RecitationScreen";
import SettingsScreen from "./components/SettingsScreen";
import KhatmahScreen from "./components/KhatmahScreen";
import FavoritesScreen from "./components/FavoritesScreen";
import StorageManagerScreen from "./components/StorageManagerScreen";
import { ShareAyahModal, ShareAyahData } from "./components/ShareAyahModal";
import { AppLogo } from "./components/AppLogo";
import { initCapacitorNativeHandlers } from "./utils/capacitorInit";
import { applyAppIconToDocument } from "./utils/appIcon";
import { quranAudioEngine } from "./utils/quranAudioEngine";

// Standard Quran settings initialization
const LOCAL_SETTINGS_KEY = "quran_settings_tebyan";
const LOCAL_BOOKMARKS_KEY = "quran_bookmarks_tebyan";

const defaultSettings: QuranSettings = {
  fontSize: "sm",
  showTranslation: true,
  reciterId: "Minshawy_Murattal_128kbps",
  colorTajweed: true,
  pageMode: "mushaf-svg",
  autoAdvance: true,
  autoScrollSpeed: 3,
  autoScrollActive: false,
  quranFont: "uthmanic",
  mushafProvider: "quran-svg",
  language: "ar",
  stretchMushaf: false,
  hideMushafFrame: true,
  scrollDirection: "horizontal",
  appIcon: "alt"
};

const toArabicNumerals = (num: number): string => {
  return String(num).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
};

export default function App() {
  const appSheetDragControls = useDragControls();
  const [activeTab, setActiveTab] = useState<"home" | "recitation" | "settings" | "khatmah" | "favorites" | "storage">("home");
  
  // Quran reader active navigation
  const [indexTab, setIndexTab] = useState<"surahs" | "quarters" | "go">("surahs");
  const [activeSurahNumber, setActiveSurahNumber] = useState<number | null>(() => {
    try {
      const savedSurah = localStorage.getItem("quran_last_opened_surah");
      const savedPage = localStorage.getItem("quran_last_opened_page");
      if (savedSurah) return Number(savedSurah);
      if (savedPage) {
        const pageMeta = quranSvgPageMetadata.find(p => p.page === Number(savedPage));
        if (pageMeta) return pageMeta.surahNumber;
      }
      return 1;
    } catch {
      return 1;
    }
  });
  const [initialAyahNumber, setInitialAyahNumber] = useState<number | undefined>(() => {
    try {
      const saved = localStorage.getItem("quran_last_opened_ayah");
      return saved && saved !== "undefined" ? Number(saved) : undefined;
    } catch {
      return undefined;
    }
  });

  const [initialPageNumber, setInitialPageNumber] = useState<number | undefined>(() => {
    try {
      const saved = localStorage.getItem("quran_last_opened_page");
      return saved ? Number(saved) : undefined;
    } catch {
      return undefined;
    }
  });

  const [lastOpenedSurah, setLastOpenedSurah] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("quran_last_opened_surah");
      return saved ? Number(saved) : 1;
    } catch {
      return 1;
    }
  });
  const [lastOpenedAyah, setLastOpenedAyah] = useState<number | undefined>(() => {
    try {
      const saved = localStorage.getItem("quran_last_opened_ayah");
      return saved && saved !== "undefined" ? Number(saved) : undefined;
    } catch {
      return undefined;
    }
  });

  // Share Ayah Modal State
  const [shareAyahData, setShareAyahData] = useState<ShareAyahData | null>(null);

  const handleOpenShareAyah = (customData?: Partial<ShareAyahData>) => {
    // 1. Immediately reset activeTab to "home" so that no full screen sheet (z-[490]) obscures the share modal!
    if (activeTab !== "home") {
      setActiveTab("home");
    }

    // 2. Ensure bottom/top bars timer is refreshed
    triggerShowBars(5000);

    // 3. If index screen is currently open, restore the last opened surah
    if (activeSurahNumber === null) {
      setActiveSurahNumber(lastOpenedSurah || 1);
    }

    // 4. If specific ayah/surah data was passed (e.g. from ReadingScreen):
    if (customData && customData.ayah) {
      const sNum = customData.surahNumber || activeSurahNumber || lastOpenedSurah || 1;
      const sObj = surahsList.find((s) => s.number === sNum) || surahsList[0];
      setShareAyahData({
        mode: customData.mode || "single",
        surahNumber: sNum,
        surahName: customData.surahName || sObj.name,
        ayah: customData.ayah,
        ayahTo: customData.ayahTo,
        pageNumber: customData.pageNumber || customData.ayah.page || initialPageNumber || 1,
        isNavDefaultOpen: false,
      });
      return;
    }

    // 5. When opened directly from the bottom navigation bar:
    let targetSurahNum = activeSurahNumber || lastOpenedSurah || 1;
    let targetAyahNum = initialAyahNumber || lastOpenedAyah || 1;
    let targetMode: "single" | "range" | "page" = "single";
    let targetRangeTo = targetAyahNum;
    let targetPageNum = initialPageNumber || 1;

    try {
      const savedAyahRaw = localStorage.getItem("quran_share_default_ayah_v3");
      const savedStyleRaw = localStorage.getItem("quran_share_user_custom_default_v3");
      if (savedAyahRaw) {
        const parsed = JSON.parse(savedAyahRaw);
        if (parsed.surahNumber) targetSurahNum = Number(parsed.surahNumber);
        if (parsed.ayahNumber) targetAyahNum = Number(parsed.ayahNumber);
        if (parsed.mode) targetMode = parsed.mode;
        if (parsed.rangeTo) targetRangeTo = Number(parsed.rangeTo);
        if (parsed.pageNumber) targetPageNum = Number(parsed.pageNumber);
      } else if (savedStyleRaw) {
        const parsed = JSON.parse(savedStyleRaw);
        if (parsed.defaultSurahNumber) targetSurahNum = Number(parsed.defaultSurahNumber);
        if (parsed.defaultAyahNumber) targetAyahNum = Number(parsed.defaultAyahNumber);
        if (parsed.shareMode) targetMode = parsed.shareMode;
        if (parsed.rangeTo) targetRangeTo = Number(parsed.rangeTo);
        if (parsed.selectedPageNumber) targetPageNum = Number(parsed.selectedPageNumber);
      }
    } catch {
      targetSurahNum = activeSurahNumber || lastOpenedSurah || 1;
      targetAyahNum = initialAyahNumber || lastOpenedAyah || 1;
    }

    const currentSurah = surahsList.find((s) => s.number === targetSurahNum) || surahsList.find((s) => s.number === 1) || surahsList[0];

    setShareAyahData({
      mode: targetMode,
      surahNumber: currentSurah.number,
      surahName: currentSurah.name,
      ayah: {
        numberInSurah: targetAyahNum,
        text: "",
        page: targetPageNum,
      },
      ayahTo: targetRangeTo,
      pageNumber: targetPageNum,
      isNavDefaultOpen: true,
    });
  };

  // Auto-track last opened surah & ayah
  useEffect(() => {
    if (activeSurahNumber !== null) {
      setLastOpenedSurah(activeSurahNumber);
      localStorage.setItem("quran_last_opened_surah", String(activeSurahNumber));
      if (initialAyahNumber !== undefined) {
        setLastOpenedAyah(initialAyahNumber);
        localStorage.setItem("quran_last_opened_ayah", String(initialAyahNumber));
      } else {
        setLastOpenedAyah(undefined);
        localStorage.removeItem("quran_last_opened_ayah");
      }
    }
  }, [activeSurahNumber, initialAyahNumber]);

  // Top header and bottom menu visibility state
  const [showBars, setShowBars] = useState<boolean>(true);
  const autoHideBarsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger showing bars for 5 seconds then auto-hide when neither is clicked
  const triggerShowBars = useCallback((duration = 5000) => {
    setShowBars(true);
    if (autoHideBarsTimerRef.current) {
      clearTimeout(autoHideBarsTimerRef.current);
    }
    autoHideBarsTimerRef.current = setTimeout(() => {
      // Don't auto-hide if user is actively interacting with an open drawer, bottom sheet or modal
      const hasActiveModal = !!document.querySelector(
        "#service-drawer-container, #ayah-bottom-sheet, .share-modal-container, [role='dialog']"
      );
      if (!hasActiveModal) {
        setShowBars(false);
      }
    }, duration);
  }, []);

  // When switching active tabs, show bars for 5 seconds
  useEffect(() => {
    triggerShowBars(5000);
  }, [activeTab, triggerShowBars]);

  // Global click/tap listener across all pages
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // In all cases (clicking on the page to show, or clicking on the headers/drawers while using them):
      // Keep headers visible and refresh the 5-second auto-hide timer!
      triggerShowBars(5000);
    };

    window.addEventListener("click", handleGlobalClick, { capture: true, passive: true });

    // Initial load: show for 5 seconds then auto-hide
    triggerShowBars(5000);

    return () => {
      window.removeEventListener("click", handleGlobalClick, { capture: true });
      if (autoHideBarsTimerRef.current) {
        clearTimeout(autoHideBarsTimerRef.current);
      }
    };
  }, [triggerShowBars]);

  const [scrollCapsuleToggleTrigger, setScrollCapsuleToggleTrigger] = useState<number>(0);
  const [mushafClickTrigger, setMushafClickTrigger] = useState<number>(0);
  const [isRecitationActive, setIsRecitationActive] = useState<boolean>(false);

  // AudioContext unlock on first user interaction to ensure recitation plays immediately
  useEffect(() => {
    const handleFirstInteraction = () => {
      quranAudioEngine.unlockAudioContext();
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
    window.addEventListener("click", handleFirstInteraction, { passive: true });
    window.addEventListener("touchstart", handleFirstInteraction, { passive: true });
    window.addEventListener("keydown", handleFirstInteraction, { passive: true });
    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, []);

  // Synchronized persistent resources
  const [theme, setTheme] = useState<"light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet">(() => {
    try {
      const saved = localStorage.getItem("quran_theme");
      if (saved && ["light", "dark", "gold-velvet", "navy-velvet", "emerald-velvet"].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return "gold-velvet"; // Default to gold-velvet day mode
  });
  const isDark = theme === "dark";
  const [preferredLightTheme, setPreferredLightTheme] = useState<"light" | "gold-velvet" | "navy-velvet" | "emerald-velvet">("gold-velvet");
  const [settings, setSettings] = useState<QuranSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed && typeof parsed === "object") {
          return { ...defaultSettings, ...parsed, pageMode: parsed.pageMode || "mushaf-svg" };
        }
      }
    } catch {}
    return defaultSettings;
  });
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [playbackSync, setPlaybackSync] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<any | null>(null);

  const loadKhatmahPlan = () => {
    try {
      const saved = localStorage.getItem("quran_khatmah_tebyan_plan");
      if (saved) {
        setActivePlan(JSON.parse(saved));
      } else {
        setActivePlan(null);
      }
    } catch {
      setActivePlan(null);
    }
  };

  useEffect(() => {
    initOfflineFonts().catch(console.warn);
    
    // Handle back button / back gesture safely without exiting the app
    const handleBackNavigation = () => {
      if (shareAyahData !== null) {
        setShareAyahData(null);
        return true;
      }
      if (activeTab !== "home") {
        setActiveTab("home");
        return true;
      }
      return true; // Keep user inside the app on back gesture
    };

    initCapacitorNativeHandlers(handleBackNavigation);
    loadKhatmahPlan();
    const handleUpdate = () => {
      loadKhatmahPlan();
    };
    window.addEventListener("khatmah_updated", handleUpdate);
    return () => {
      window.removeEventListener("khatmah_updated", handleUpdate);
    };
  }, [shareAyahData, activeTab]);

  // Prevent browser & PWA exiting when swiping right and left from screen edges
  useEffect(() => {
    // 1. Maintain a history entry to trap back navigation gestures
    try {
      window.history.pushState({ app: "tebyan_quran" }, "");
    } catch {}

    const handlePopState = () => {
      try {
        window.history.pushState({ app: "tebyan_quran" }, "");
      } catch {}

      if (shareAyahData !== null) {
        setShareAyahData(null);
        return;
      }
      if (activeTab !== "home") {
        setActiveTab("home");
        return;
      }
    };
    window.addEventListener("popstate", handlePopState);

    // 2. Intercept horizontal edge swipe gestures (within 28px of left/right screen boundary)
    let touchStartX = 0;
    let touchStartY = 0;
    let isEdgeSwipe = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        const edgeThreshold = 28;
        isEdgeSwipe = touchStartX <= edgeThreshold || touchStartX >= (window.innerWidth - edgeThreshold);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isEdgeSwipe && e.touches && e.touches.length === 1) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = Math.abs(currentX - touchStartX);
        const deltaY = Math.abs(currentY - touchStartY);

        // Cancel horizontal swipe from edge before browser can trigger history navigation/exit
        if (deltaX > 4 && deltaX > deltaY) {
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      }
    };

    const onTouchEnd = () => {
      isEdgeSwipe = false;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [shareAyahData, activeTab]);

  // Offline pages count & background downloader state
  const [offlinePagesCount, setOfflinePagesCount] = useState<number>(0);
  const [isAutoDownloadingPages, setIsAutoDownloadingPages] = useState<boolean>(false);

  // Background download on app mount: Quran pages, library books, and verse services silently
  useEffect(() => {
    const cleanupDownloads = startAppBackgroundDownloads((downloaded, total, isComplete) => {
      setOfflinePagesCount(downloaded);
      setIsAutoDownloadingPages(!isComplete);
    });

    return () => {
      cleanupDownloads();
    };
  }, []);

  useEffect(() => {
    const provider = settings.mushafProvider || "quran-svg";
    getCachedPagesCount(provider)
      .then((count) => setOfflinePagesCount(count))
      .catch(() => {});
  }, [settings.mushafProvider]);

  // Apply active app icon to browser tab favicon & apple touch icon
  useEffect(() => {
    applyAppIconToDocument(settings.appIcon || "alt", settings.customAltIconUrl);
  }, [settings.appIcon, settings.customAltIconUrl]);

  // Local storage binding with defensive parsing
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed && typeof parsed === "object") {
            if (!parsed.pageMode) parsed.pageMode = "mushaf-svg";
            if (!parsed.mushafProvider) parsed.mushafProvider = "quran-svg";
            if (!parsed.language) parsed.language = "ar";
            if (parsed.hideMushafFrame === undefined) parsed.hideMushafFrame = true;
            setSettings({ ...defaultSettings, ...parsed });
          }
        } catch {
          setSettings(defaultSettings);
        }
      }

      const savedBookmarks = localStorage.getItem(LOCAL_BOOKMARKS_KEY);
      if (savedBookmarks) {
        try {
          const parsedB = JSON.parse(savedBookmarks);
          if (Array.isArray(parsedB)) {
            setBookmarks(parsedB);
          } else {
            setBookmarks([]);
          }
        } catch {
          setBookmarks([]);
        }
      }

      const savedPreferred = localStorage.getItem("quran_preferred_light_theme");
      const cleanPreferred = savedPreferred === "emerald-velvet" ? "gold-velvet" : savedPreferred;
      if (cleanPreferred && ["light", "gold-velvet", "navy-velvet"].includes(cleanPreferred)) {
        setPreferredLightTheme(cleanPreferred as any);
      } else {
        setPreferredLightTheme("gold-velvet");
      }

      // Set to saved theme or default to "gold-velvet" day mode
      const savedTheme = localStorage.getItem("quran_theme");
      const cleanTheme = savedTheme === "emerald-velvet" ? "dark" : savedTheme;
      if (cleanTheme && ["light", "dark", "gold-velvet", "navy-velvet"].includes(cleanTheme)) {
        setTheme(cleanTheme as any);
      } else {
        setTheme("gold-velvet");
        localStorage.setItem("quran_theme", "gold-velvet");
        localStorage.setItem("quran_dark_mode_tebyan", "false");
      }

      const savedLastSurah = localStorage.getItem("quran_last_opened_surah");
      if (savedLastSurah) {
        setLastOpenedSurah(Number(savedLastSurah));
      }

      const savedLastAyah = localStorage.getItem("quran_last_opened_ayah");
      if (savedLastAyah && savedLastAyah !== "undefined") {
        setLastOpenedAyah(Number(savedLastAyah));
      }
    } catch (e) {
      console.warn("Could not load local resources:", e);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "home" && activeSurahNumber === null) {
      setActiveSurahNumber(lastOpenedSurah || 1);
    }
  }, [activeTab, activeSurahNumber, lastOpenedSurah]);

  const handleToggleDarkMode = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? preferredLightTheme : "dark";
      localStorage.setItem("quran_theme", next);
      localStorage.setItem("quran_dark_mode_tebyan", String(next === "dark"));
      return next;
    });
  };

  const handleChangeTheme = (newTheme: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet") => {
    setTheme(newTheme);
    localStorage.setItem("quran_theme", newTheme);
    localStorage.setItem("quran_dark_mode_tebyan", String(newTheme === "dark"));
    if (newTheme !== "dark") {
      setPreferredLightTheme(newTheme);
      localStorage.setItem("quran_preferred_light_theme", newTheme);
    }
  };

  const handleUpdateSettings = useCallback((newSettings: Partial<QuranSettings>) => {
    if (newSettings.autoScrollActive === true) {
      setShowBars(false);
    } else if (newSettings.autoScrollActive === false) {
      setShowBars(true);
    }
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleToggleBookmark = useCallback((surahNumber: number, surahName: string, ayahNumber?: number, category?: "reading" | "revision" | "memorization" | "contemplation") => {
    setBookmarks((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      // Look for match
      const matchingIndex = list.findIndex(
        (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
      );

      let updated: Bookmark[] = [];
      if (matchingIndex !== -1 && !category) {
        // Remove it
        updated = list.filter((_, i) => i !== matchingIndex);
      } else if (matchingIndex !== -1 && category) {
        // Just update category of existing bookmark
        updated = list.map((b, i) => i === matchingIndex ? { ...b, category } : b);
      } else {
        // Add new bookmark
        const options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
        const timeStr = new Date().toLocaleTimeString("ar-EG", options);
        const newBookmark: Bookmark = {
          id: `${surahNumber}-${ayahNumber || "start"}-${Date.now()}`,
          surahNumber,
          surahName,
          ayahNumber,
          timestamp: timeStr,
          category: category || "reading"
         };
        updated = [newBookmark, ...list];
      }

      localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSelectSurahIndex = useCallback((surahNum: number, startAyah?: number, pageNumber?: number) => {
    let targetPage = pageNumber;
    if (!targetPage && surahNum) {
      if (startAyah) {
        const q = quartersList.find(q => q.surahNumber === surahNum && q.ayahNumber === startAyah);
        if (q && q.page) {
          targetPage = q.page;
        } else {
          targetPage = getSurahStartPage(surahNum);
        }
      } else {
        targetPage = getSurahStartPage(surahNum);
      }
    }

    setInitialAyahNumber(startAyah);
    setInitialPageNumber(targetPage);
    setActiveSurahNumber(surahNum);
    setLastOpenedSurah(surahNum);

    if (targetPage) {
      try {
        localStorage.setItem("quran_last_opened_page", String(targetPage));
        localStorage.removeItem("quran_scroll_position");
      } catch {}
    }
    try {
      localStorage.setItem("quran_last_opened_surah", String(surahNum));
      localStorage.removeItem("quran_scroll_position");
      if (startAyah !== undefined) {
        localStorage.setItem("quran_last_opened_ayah", String(startAyah));
      } else {
        localStorage.removeItem("quran_last_opened_ayah");
      }
    } catch {}

    // Ensure we are showing the home/reader tab
    setActiveTab("home");
  }, []);

  const handleChangeSurah = useCallback((surahNum: number, startAyah?: number, pageNum?: number) => {
    let targetPage = pageNum;
    if (!targetPage && surahNum) {
      if (startAyah) {
        const q = quartersList.find(q => q.surahNumber === surahNum && q.ayahNumber === startAyah);
        if (q && q.page) {
          targetPage = q.page;
        } else {
          targetPage = getSurahStartPage(surahNum);
        }
      } else {
        targetPage = getSurahStartPage(surahNum);
      }
    }

    setActiveSurahNumber(surahNum);
    setLastOpenedSurah(surahNum);
    setInitialAyahNumber(startAyah);
    if (targetPage) {
      setInitialPageNumber(targetPage);
      try {
        localStorage.setItem("quran_last_opened_page", String(targetPage));
        localStorage.removeItem("quran_scroll_position");
      } catch {}
    }
    if (surahNum) {
      try {
        localStorage.setItem("quran_last_opened_surah", String(surahNum));
        localStorage.removeItem("quran_scroll_position");
      } catch {}
    }
  }, []);

  const handleBackToCatalog = useCallback(() => {
    setActiveTab("home");
    setActiveSurahNumber(null);
    setInitialAyahNumber(undefined);
  }, []);

  // Synchronize current page, surah, and verse from ReadingScreen
  const handlePageChange = useCallback((page: number, surah: number, startAyah: number, selectedAyahNumber?: number) => {
    setLastOpenedSurah((prev) => (prev === surah ? prev : surah));
    const targetAyah = selectedAyahNumber || startAyah;
    setLastOpenedAyah((prev) => (prev === targetAyah ? prev : targetAyah));
    try {
      localStorage.setItem("quran_last_opened_page", String(page));
      localStorage.setItem("quran_last_opened_surah", String(surah));
      if (targetAyah) {
        localStorage.setItem("quran_last_opened_ayah", String(targetAyah));
      }
    } catch {}
  }, []);

  // Open the Library (Tafsir & Study) on the exact verses open on the Mushaf page
  const handleOpenLibrary = useCallback(() => {
    if (shareAyahData !== null) setShareAyahData(null);

    // 1. Determine currently active page in Mushaf
    let curPage = initialPageNumber;
    try {
      const saved = localStorage.getItem("quran_last_opened_page");
      if (saved) curPage = Number(saved);
    } catch {}
    if (!curPage || isNaN(curPage)) curPage = 1;

    // 2. Lookup verses on that page
    const pageRange = getAyahsForPage(curPage);

    let targetSurah = lastOpenedSurah || (pageRange ? pageRange.surahNumber : 1);
    let targetAyah = lastOpenedAyah || (pageRange ? pageRange.startAyah : 1);

    try {
      const savedAyah = localStorage.getItem("quran_last_opened_ayah");
      const savedSurah = localStorage.getItem("quran_last_opened_surah");
      if (savedSurah) targetSurah = Number(savedSurah);
      if (savedAyah) targetAyah = Number(savedAyah);
    } catch {}

    // Verify targetAyah belongs to the open page
    if (pageRange) {
      const belongs = pageRange.surahs.some(
        s => s.surah === targetSurah && targetAyah >= s.start && targetAyah <= s.end
      );
      if (!belongs) {
        targetSurah = pageRange.surahNumber;
        targetAyah = pageRange.startAyah;
      }
    }

    if (!targetSurah) targetSurah = 1;
    if (!targetAyah) targetAyah = 1;

    setSettings((prev) => {
      const next = { ...prev, pageMode: "continuous" as const };
      try {
        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    setActiveTab("home");
    setActiveSurahNumber(targetSurah);
    setInitialAyahNumber(targetAyah);
    setInitialPageNumber(curPage);
    setLastOpenedSurah(targetSurah);
    setLastOpenedAyah(targetAyah);
    setMushafClickTrigger((prev) => prev + 1);
  }, [initialPageNumber, lastOpenedSurah, lastOpenedAyah, shareAyahData]);

  // Return to the standard Mushaf page
  const handleOpenMushaf = useCallback(() => {
    if (shareAyahData !== null) setShareAyahData(null);

    let curPage = initialPageNumber;
    try {
      const saved = localStorage.getItem("quran_last_opened_page");
      if (saved) curPage = Number(saved);
    } catch {}
    if (!curPage || isNaN(curPage)) curPage = 1;

    setSettings((prev) => {
      const next = { ...prev, pageMode: "mushaf-svg" as const };
      try {
        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    setActiveTab("home");
    setActiveSurahNumber(lastOpenedSurah || 1);
    setInitialAyahNumber(lastOpenedAyah);
    setInitialPageNumber(curPage);
    setMushafClickTrigger((prev) => prev + 1);
  }, [initialPageNumber, lastOpenedSurah, lastOpenedAyah, shareAyahData]);

  // Toggle bars visibility on single click, ignoring clicks on interactive components or actual verses/actions
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Ignore if target is inside a button, select, input, textarea, links, or specific interactive components
    if (target.closest('button, select, input, textarea, a, [role="button"], [class*="option-tray"], .ignore-bar-toggle, .cursor-pointer')) {
      return;
    }
    
    // Ignore if target is part of specific non-mushaf widgets like the rosary buttons
    if (target.closest('.sebha-circle, .tasbih-btn')) {
      return;
    }

    if (settings.autoScrollActive && activeSurahNumber !== null && activeTab === "home") {
      setShowBars(prev => !prev);
      setScrollCapsuleToggleTrigger(prev => prev + 1);
    } else {
      setShowBars(prev => !prev);
    }
  };

  const t = translations[settings.language || "ar"];
  const isRtl = (settings.language || "ar") === "ar";

  return (
    <div 
      id="app-wrapper-frame" 
      onClick={handlePageClick}
      dir={isRtl ? "rtl" : "ltr"}
      className={`min-h-screen flex flex-col justify-between font-sans transition-all duration-300 ${
        theme === "gold-velvet" || theme === "emerald-velvet"
          ? "bg-[#FAF8F5] text-black" 
          : theme === "navy-velvet" 
            ? "bg-[#FFFFFF] text-slate-900" 
            : isDark 
              ? "bg-[#0b1219] text-slate-100" 
              : "bg-white text-slate-800"
      }`}
    >
      
      {/* Dynamic top banner branding (Only shown when not reading full-screen) */}
      {(activeSurahNumber === null || activeTab === "settings") && (
        <header 
          id="global-nav-header" 
          data-top-header="true"
          className={`fixed top-0 left-0 right-0 w-full h-14 z-[200] shadow-md select-none transition-all duration-300 transform ${
            showBars ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
          } ${
            theme === "emerald-velvet"
              ? "bg-[#012519] border-b border-[#34d399]/30 text-[#FAF8F5]"
              : theme === "gold-velvet"
                ? "bg-[#FAF8F5] border-b border-[#c5a85c]/30 text-[#011c14]"
                : theme === "navy-velvet"
                  ? "bg-[#1b3168] border-b border-[#3F63C6]/30 text-white"
                  : isDark
                    ? "bg-[#061e16] border-b border-emerald-500/30 text-white"
                    : "bg-gradient-to-l from-emerald-900 to-emerald-800 text-white"
          }`}
        >
          <div className="w-full max-w-4xl mx-auto px-5 h-full flex items-center justify-between flex-row relative">
            {/* Right side: Index button */}
            <div className="flex items-center gap-2">
              <button
                id="header-index-btn"
                onClick={() => {
                  setActiveTab("home");
                  setIndexTab("surahs");
                  setActiveSurahNumber(null);
                }}
                className={`p-2 py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-sm font-bold ${
                  activeTab === "home" && activeSurahNumber === null
                    ? (theme === "emerald-velvet"
                        ? "bg-[#34d399] text-[#011c14] border border-[#34d399]"
                        : theme === "navy-velvet" 
                          ? "bg-[#3F63C6] text-white border border-white/20" 
                          : theme === "gold-velvet" 
                            ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black border border-[#c5a85c]" 
                            : isDark
                              ? "bg-emerald-500 text-[#011a12] font-black border border-emerald-400"
                              : "bg-white/20 text-white")
                    : (theme === "emerald-velvet"
                        ? "bg-[#011a12]/50 hover:bg-[#011a12] text-[#FAF8F5] border border-[#10b981]/25"
                        : theme === "navy-velvet"
                          ? "bg-[#3F63C6]/15 hover:bg-[#3F63C6]/30 text-white hover:text-white/90 border border-[#3F63C6]/20"
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/20 text-[#8c6b23] hover:text-[#011c14] border border-[#c5a85c]/25"
                            : isDark
                              ? "bg-[#022c22]/60 hover:bg-[#022c22] text-emerald-300 border border-emerald-500/30"
                              : "bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-100 hover:text-white")
                }`}
                title={t.index}
              >
                <List size={20} className={activeTab === "home" && activeSurahNumber === null ? (theme === "gold-velvet" ? "text-[#011c14]" : theme === "emerald-velvet" ? "text-[#011c14]" : theme === "navy-velvet" ? "text-white" : isDark ? "text-[#011a12]" : "text-white") : (theme === "navy-velvet" ? "text-white" : theme === "gold-velvet" ? "text-[#8c6b23]" : isDark ? "text-emerald-300" : theme === "emerald-velvet" ? "text-[#34d399]" : "")} />
                <span>{t.index}</span>
              </button>
            </div>

            {/* Center space */}
            <div className="flex-1" />

            {/* Left side: Library, Download, Theme toggle and Settings */}
            <div className="flex items-center gap-2" dir={isRtl ? "rtl" : "ltr"}>
              <button
                id="header-library-btn"
                onClick={handleOpenLibrary}
                className={`p-2 py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-sm font-bold ${
                  activeTab === "home" && settings.pageMode === "continuous"
                    ? (theme === "emerald-velvet" ? "bg-[#34d399] text-[#011c14] border border-[#34d399]" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white border border-white/20" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black border border-[#c5a85c]" : isDark ? "bg-emerald-500 text-[#011a12] font-black border border-emerald-400" : "bg-white/20 text-white")
                    : (theme === "emerald-velvet"
                        ? "bg-[#011a12]/50 hover:bg-[#011a12] text-[#FAF8F5] border border-[#10b981]/25"
                        : theme === "navy-velvet"
                          ? "bg-[#3F63C6]/15 hover:bg-[#3F63C6]/30 text-white hover:text-white/90 border border-[#3F63C6]/20"
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/20 text-[#8c6b23] hover:text-[#011c14] border border-[#c5a85c]/25"
                            : isDark
                              ? "bg-[#022c22]/60 hover:bg-[#022c22] text-emerald-300 border border-emerald-500/30"
                              : "bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-200 hover:text-white")
                }`}
                title={t.library}
              >
                <BookOpenCheck size={20} className={activeTab === "home" && settings.pageMode === "continuous" ? (theme === "gold-velvet" ? "text-[#011c14]" : theme === "emerald-velvet" ? "text-[#011c14]" : theme === "navy-velvet" ? "text-white" : isDark ? "text-[#011a12]" : "text-white") : (theme === "navy-velvet" ? "text-white" : theme === "gold-velvet" ? "text-[#8c6b23]" : isDark ? "text-emerald-300" : theme === "emerald-velvet" ? "text-[#34d399]" : "")} />
                <span>{t.library}</span>
              </button>

              <button
                id="toggle-dark-mode-header-btn"
                onClick={handleToggleDarkMode}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  theme === "emerald-velvet"
                    ? "bg-[#011a12]/50 hover:bg-[#011a12] text-[#34d399] border border-[#10b981]/25"
                    : theme === "navy-velvet"
                      ? "bg-[#3F63C6]/15 hover:bg-[#3F63C6]/30 text-white hover:text-white/90 border border-[#3F63C6]/20"
                      : theme === "gold-velvet"
                        ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/20 text-[#8c6b23] hover:text-[#011c14] border border-[#c5a85c]/25"
                        : isDark
                          ? "bg-[#022c22]/60 hover:bg-[#022c22] text-emerald-300 border border-emerald-500/30"
                          : "bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-200 hover:text-white"
                }`}
                title={isDark ? (isRtl ? "تفعيل الوضع المضيء" : "Enable Light Mode") : (isRtl ? "تفعيل الوضع الليلي" : "Enable Dark Mode")}
              >
                {isDark ? <Sun size={20} className="text-emerald-300" /> : <Moon size={20} className={theme === "gold-velvet" ? "text-[#8c6b23]" : ""} />}
              </button>

              {/* Download / Storage Page Icon - Right of Settings */}
              <button
                id="header-storage-btn"
                onClick={() => {
                  if (activeTab === "storage") {
                    setActiveTab("home");
                  } else {
                    setActiveTab("storage");
                  }
                }}
                className={`p-2 py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-sm font-bold ${
                  activeTab === "storage"
                    ? (theme === "emerald-velvet" ? "bg-[#34d399] text-[#011c14] border border-[#34d399]" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white border border-white/20" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black border border-[#c5a85c]" : isDark ? "bg-emerald-500 text-[#011a12] font-black border border-emerald-400" : "bg-emerald-500 text-slate-950 font-bold")
                    : (theme === "emerald-velvet"
                        ? "bg-[#011a12]/50 hover:bg-[#011a12] text-[#FAF8F5] border border-[#10b981]/25"
                        : theme === "navy-velvet"
                          ? "bg-[#3F63C6]/15 hover:bg-[#3F63C6]/30 text-white hover:text-white/90 border border-[#3F63C6]/20"
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/20 text-[#8c6b23] hover:text-[#011c14] border border-[#c5a85c]/25"
                            : isDark
                              ? "bg-[#022c22]/60 hover:bg-[#022c22] text-emerald-300 border border-emerald-500/30"
                              : "bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-200 hover:text-white")
                }`}
                title="إدارة التحميلات والتخزين"
              >
                <Download size={20} className={activeTab === "storage" ? (theme === "emerald-velvet" ? "text-[#011c14]" : theme === "gold-velvet" ? "text-[#011c14]" : isDark ? "text-[#011a12]" : "text-slate-950") : (theme === "navy-velvet" ? "text-white" : theme === "gold-velvet" ? "text-[#8c6b23]" : isDark ? "text-emerald-300" : theme === "emerald-velvet" ? "text-[#34d399]" : "text-emerald-300")} />
                <span className="hidden sm:inline">التحميلات</span>
              </button>

              <button
                id="header-settings-btn"
                onClick={() => {
                  if (activeTab === "settings") {
                    setActiveTab("home");
                    if (activeSurahNumber === null) {
                      setActiveSurahNumber(lastOpenedSurah || 1);
                    }
                  } else {
                    setActiveTab("settings");
                    if (activeSurahNumber === null) {
                      setActiveSurahNumber(lastOpenedSurah || 1);
                    }
                  }
                }}
                className={`p-2 py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-sm font-bold ${
                  activeTab === "settings"
                    ? (theme === "emerald-velvet" ? "bg-[#34d399] text-[#011c14] border border-[#34d399]" : theme === "navy-velvet" ? "bg-[#3F63C6] text-white border border-white/20" : theme === "gold-velvet" ? "bg-[#c5a85c] text-[#011c14] shadow-sm font-black border border-[#c5a85c]" : isDark ? "bg-emerald-500 text-[#011a12] font-black border border-emerald-400" : "bg-emerald-500 text-slate-950 font-bold")
                    : (theme === "emerald-velvet"
                        ? "bg-[#011a12]/50 hover:bg-[#011a12] text-[#FAF8F5] border border-[#10b981]/25"
                        : theme === "navy-velvet"
                          ? "bg-[#3F63C6]/15 hover:bg-[#3F63C6]/30 text-white hover:text-white/90 border border-[#3F63C6]/20"
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c]/10 hover:bg-[#c5a85c]/20 text-[#8c6b23] hover:text-[#011c14] border border-[#c5a85c]/25"
                            : isDark
                              ? "bg-[#022c22]/60 hover:bg-[#022c22] text-emerald-300 border border-emerald-500/30"
                              : "bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-200 hover:text-white")
                }`}
                title={t.settings}
              >
                <Settings size={20} className={activeTab === "settings" ? (theme === "emerald-velvet" ? "text-[#011c14]" : theme === "gold-velvet" ? "text-[#011c14]" : isDark ? "text-[#011a12]" : "text-slate-950") : (theme === "navy-velvet" ? "text-white" : theme === "gold-velvet" ? "text-[#8c6b23]" : isDark ? "text-emerald-300" : theme === "emerald-velvet" ? "text-[#34d399]" : "text-emerald-300")} />
                <span>{t.settings}</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Container Core Body */}
      <main 
        id="app-viewport" 
        className={`flex-1 w-full mx-auto transition-all duration-300 ${
          activeTab === "home"
            ? "max-w-none px-0"
            : "max-w-4xl px-2 sm:px-4"
        } ${
          showBars ? "pb-12 md:pb-14" : "pb-2"
        } ${
          activeSurahNumber === null 
            ? (showBars ? "pt-[64px] md:pt-[72px]" : "pt-6") 
            : (activeTab !== "home" ? "pt-6 md:pt-8" : "")
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            id="tab-view-home"
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
              <ReadingScreen
                surahNumber={activeSurahNumber !== null ? activeSurahNumber : (lastOpenedSurah || 1)}
                initialAyahNumber={activeSurahNumber !== null ? initialAyahNumber : lastOpenedAyah}
                initialPageNumber={initialPageNumber}
                onBack={handleBackToCatalog}
                bookmarks={bookmarks}
                onToggleBookmark={handleToggleBookmark}
                settings={settings}
                onChangeSettings={handleUpdateSettings}
                isDark={isDark}
                theme={theme}
                onChangeTheme={handleChangeTheme}
                onToggleDarkMode={handleToggleDarkMode}
                showBars={showBars}
                onToggleBars={() => triggerShowBars(5000)}
                scrollCapsuleToggleTrigger={scrollCapsuleToggleTrigger}
                mushafClickTrigger={mushafClickTrigger}
                activeTab={activeTab}
                isIndexOpen={activeSurahNumber === null}
                onCloseIndex={() => setActiveSurahNumber(lastOpenedSurah || 1)}
                onOpenIndex={(tab = "surahs") => {
                  setIndexTab(tab);
                  setActiveSurahNumber(null);
                }}
                onChangeSurah={handleChangeSurah}
                onPageChange={handlePageChange}
                onRecitationStateChange={setIsRecitationActive}
                onShowBarsChange={(show) => {
                  if (show) triggerShowBars(5000);
                  else setShowBars(false);
                }}
                onActiveTabChange={setActiveTab}
                onSyncPlaybackStates={setPlaybackSync}
                onOpenShareAyah={handleOpenShareAyah}
              />

              <AnimatePresence>
                {activeSurahNumber === null && (
                  <motion.div 
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0 }}
                    className="fixed inset-0 z-[140] flex items-end justify-center cursor-default bg-black/45 backdrop-blur-[1px]"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        handleSelectSurahIndex(lastOpenedSurah || 1);
                      }
                    }}
                  >
                    <IndexScreen
                      onSelectSurah={handleSelectSurahIndex}
                      bookmarks={bookmarks}
                      isDark={isDark}
                      theme={theme}
                      language={settings.language || "ar"}
                      initialTab={indexTab}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Full Screen Popups for Khatmah, Bookmarks, Recitation, Storage, and Settings */}
              {createPortal(
                <AnimatePresence>
                  {(activeTab === "khatmah" || activeTab === "favorites" || activeTab === "recitation" || activeTab === "settings" || activeTab === "storage") && (
                    <React.Fragment key="app-sheet-fragment">
                      {/* Backdrop */}
                      <motion.div
                        key="app-sheet-backdrop"
                        initial={false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[480] cursor-pointer"
                        onClick={() => setActiveTab("home")}
                      />

                      {/* 100% Full Screen Sheet Wrapper */}
                      <motion.div
                        key="app-sheet-wrapper"
                        initial={false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`fixed inset-0 h-full w-full shadow-2xl flex flex-col z-[490] overflow-hidden ${
                          theme === "emerald-velvet"
                            ? "bg-[#011a12] text-[#FAF8F5]"
                            : theme === "gold-velvet"
                            ? "bg-[#FAF8F5] text-slate-800"
                            : theme === "navy-velvet"
                            ? "bg-white text-slate-800"
                            : isDark 
                            ? "bg-[#09121a] text-slate-100" 
                            : "bg-white text-slate-800"
                        }`}
                      >
                        {/* Top Header Bar inside Full Screen Overlay */}
                        <div 
                          id="sheet-top-header"
                          data-top-header="true"
                          className={`app-sheet-top-header px-4 py-3 border-b flex items-center justify-between gap-2 shrink-0 transition-all duration-300 transform ${
                            showBars ? "translate-y-0 opacity-100 max-h-16" : "-translate-y-full opacity-0 max-h-0 py-0 overflow-hidden pointer-events-none border-transparent"
                          } ${
                          theme === "emerald-velvet"
                            ? "bg-[#012519] border-[#10b981]/30 text-[#FAF8F5]"
                            : theme === "navy-velvet"
                            ? "bg-slate-900 border-slate-800 text-white"
                            : theme === "gold-velvet"
                            ? "bg-[#FAF8F5] border-[#c5a85c]/30 text-[#011c14]"
                            : isDark
                            ? "bg-[#061e16] border-b border-emerald-500/30 text-white"
                            : "bg-emerald-900 border-emerald-800 text-white"
                        }`}>
                          {/* Title & Icon */}
                          <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                            {activeTab === "recitation" && <Headphones size={20} className={theme === "emerald-velvet" ? "text-[#34d399] shrink-0" : theme === "gold-velvet" ? "text-[#c5a85c] shrink-0" : isDark ? "text-emerald-300 shrink-0" : "text-emerald-400 shrink-0"} />}
                            {activeTab === "khatmah" && <Calendar size={20} className={theme === "emerald-velvet" ? "text-[#34d399] shrink-0" : theme === "gold-velvet" ? "text-[#c5a85c] shrink-0" : isDark ? "text-emerald-300 shrink-0" : "text-amber-400 shrink-0"} />}
                            {activeTab === "favorites" && <BookmarkIcon size={20} className={theme === "emerald-velvet" ? "text-[#34d399] shrink-0" : theme === "gold-velvet" ? "text-[#c5a85c] shrink-0" : isDark ? "text-emerald-300 shrink-0" : "text-emerald-400 shrink-0"} />}
                            {activeTab === "storage" && <Download size={20} className={theme === "emerald-velvet" ? "text-[#34d399] shrink-0" : theme === "gold-velvet" ? "text-[#c5a85c] shrink-0" : isDark ? "text-emerald-300 shrink-0" : "text-[#34d399] shrink-0"} />}
                            {activeTab === "settings" && <Settings size={20} className={theme === "emerald-velvet" ? "text-[#34d399] shrink-0" : theme === "gold-velvet" ? "text-[#c5a85c] shrink-0" : isDark ? "text-emerald-300 shrink-0" : "text-emerald-400 shrink-0"} />}
                            <span className="truncate">
                              {activeTab === "recitation" && "التلاوة"}
                              {activeTab === "khatmah" && "الختمة"}
                              {activeTab === "favorites" && "علاماتي"}
                              {activeTab === "storage" && "التحميلات"}
                              {activeTab === "settings" && "الإعدادات"}
                            </span>
                          </div>

                          {/* Navigation Pills inside Full Screen View */}
                          <div className={`hidden sm:flex items-center gap-1 p-1 rounded-xl text-xs ${
                            theme === "emerald-velvet"
                              ? "bg-[#011a12] border border-[#10b981]/30 text-[#FAF8F5]"
                              : isDark
                              ? "bg-[#022c22]/70 border border-emerald-500/30 text-emerald-100"
                              : "bg-black/10 dark:bg-white/10"
                          }`}>
                            <button
                              onClick={() => setActiveTab("recitation")}
                              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                activeTab === "recitation"
                                  ? (theme === "emerald-velvet" ? "bg-[#10b981] text-[#011c14] font-bold" : "bg-emerald-600 text-white font-bold")
                                  : "opacity-70 hover:opacity-100"
                              }`}
                            >
                              التلاوة
                            </button>
                            <button
                              onClick={() => setActiveTab("khatmah")}
                              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                activeTab === "khatmah"
                                  ? (theme === "emerald-velvet" ? "bg-[#10b981] text-[#011c14] font-bold" : "bg-emerald-600 text-white font-bold")
                                  : "opacity-70 hover:opacity-100"
                              }`}
                            >
                              الختمة
                            </button>
                            <button
                              onClick={() => setActiveTab("favorites")}
                              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                activeTab === "favorites"
                                  ? (theme === "emerald-velvet" ? "bg-[#10b981] text-[#011c14] font-bold" : "bg-emerald-600 text-white font-bold")
                                  : "opacity-70 hover:opacity-100"
                              }`}
                            >
                              علاماتي
                            </button>
                            <button
                              onClick={() => setActiveTab("storage")}
                              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                activeTab === "storage"
                                  ? (theme === "emerald-velvet" ? "bg-[#10b981] text-[#011c14] font-bold" : "bg-emerald-600 text-white font-bold")
                                  : "opacity-70 hover:opacity-100"
                              }`}
                            >
                              التحميلات
                            </button>
                            <button
                              onClick={() => setActiveTab("settings")}
                              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                activeTab === "settings"
                                  ? (theme === "emerald-velvet" ? "bg-[#10b981] text-[#011c14] font-bold" : "bg-emerald-600 text-white font-bold")
                                  : "opacity-70 hover:opacity-100"
                              }`}
                            >
                              الإعدادات
                            </button>
                          </div>

                          {/* Close Button */}
                          <button
                            onClick={() => setActiveTab("home")}
                            className="p-1.5 rounded-xl transition cursor-pointer bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-500 dark:text-red-400 flex items-center justify-center hover:scale-105 active:scale-95"
                            title="إغلاق و العودة للمصحف"
                          >
                            <X size={20} className="text-red-500 dark:text-red-400 stroke-[2.5px]" />
                          </button>
                        </div>

                        {/* Full Screen Content Body - Stretches responsively to full width on large displays and landscape */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 md:p-8 pb-28 w-full max-w-none">
                          {activeTab === "storage" && (
                            <StorageManagerScreen
                              isDark={isDark}
                              theme={theme}
                              onClose={() => setActiveTab("home")}
                            />
                          )}
                          {activeTab === "settings" && (
                            <SettingsScreen
                              settings={settings}
                              onChangeSettings={handleUpdateSettings}
                              isDark={isDark}
                              onToggleDarkMode={handleToggleDarkMode}
                              theme={theme}
                              onChangeTheme={handleChangeTheme}
                              inDrawer={true}
                            />
                          )}
                          {activeTab === "khatmah" && (
                            <KhatmahScreen
                              isDark={isDark}
                              theme={theme}
                              onSelectSurah={(surahNum) => {
                                handleSelectSurahIndex(surahNum);
                                setActiveTab("home");
                              }}
                            />
                          )}
                          {activeTab === "recitation" && (
                            <RecitationScreen
                              settings={settings}
                              onChangeSettings={handleUpdateSettings}
                              isDark={isDark}
                              theme={theme}
                              playback={playbackSync}
                              activeSurahNumber={activeSurahNumber || 1}
                              onChangeSurahNumber={(num) => handleChangeSurah(num, 1)}
                            />
                          )}
                          {activeTab === "favorites" && (
                            <FavoritesScreen
                              bookmarks={bookmarks}
                              onSelectSurah={(surahNum, startAyah) => {
                                handleSelectSurahIndex(surahNum, startAyah);
                                setActiveTab("home");
                              }}
                              onClearAll={() => {
                                setBookmarks([]);
                                localStorage.setItem("quran_bookmarks_tebyan", JSON.stringify([]));
                              }}
                              onRemoveBookmark={(surahNum, ayahNum) => {
                                handleToggleBookmark(surahNum, "", ayahNum);
                              }}
                              isDark={isDark}
                              theme={theme}
                            />
                          )}
                        </div>
                      </motion.div>
                    </React.Fragment>
                  )}
                </AnimatePresence>,
                document.body
              )}
            </motion.div>
        </AnimatePresence>
      </main>



      {/* Floating Bottom Navigation Tab Bar */}
      <nav 
        id="floating-bottom-menu" 
        data-bottom-bar="true"
        className={`fixed bottom-0 left-0 right-0 w-full z-[500] border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] rounded-t-2xl transition-all duration-300 transform ${
          (showBars || shareAyahData !== null) ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"
        } ${
          theme === "emerald-velvet"
            ? "bg-[#012519] border-t border-[#10b981]/35 text-[#FAF8F5]"
            : theme === "gold-velvet"
              ? "bg-[#FAF8F5] border-t border-[#c5a85c]/35 text-black animate-fade-in"
              : theme === "navy-velvet"
                ? "bg-white/95 border-slate-200 text-slate-800"
                : isDark
                  ? "bg-[#061e16]/98 border-t border-emerald-500/30 text-white"
                  : "bg-white/95 border-slate-200 text-slate-800"
        }`}
      >
        <div className="w-full max-w-4xl mx-auto flex items-center justify-around text-center select-none text-[10px] md:text-[11px] font-bold px-4 py-1.5">
          {/* 1. home (Catalog/Reading) */}
          <button
            id="nav-tab-home"
            onClick={handleOpenMushaf}
            className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 transition-colors cursor-pointer ${
              activeTab === "home" && settings.pageMode !== "continuous" && activeSurahNumber !== null && shareAyahData === null
                ? (theme === "emerald-velvet" ? "text-[#34d399] font-black" : theme === "navy-velvet" ? "text-[#3F63C6] font-black" : theme === "gold-velvet" ? "text-[#c5a85c] font-black" : isDark ? "text-emerald-300 font-black" : "text-emerald-500 font-bold")
                : (theme === "emerald-velvet" ? "text-[#FAF8F5]/60 hover:text-[#FAF8F5]" : isDark ? "text-slate-400 hover:text-emerald-300" : "text-slate-400 hover:text-slate-600")
            }`}
          >
            <BookOpen size={18} className={activeTab === "home" && settings.pageMode !== "continuous" && activeSurahNumber !== null && shareAyahData === null ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
            <span>{t.mushaf}</span>
          </button>

          {/* 3. Recitation Tab */}
          <button
            id="nav-tab-recitation"
            onClick={() => {
              if (shareAyahData !== null) setShareAyahData(null);
              if (activeTab === "recitation") {
                setActiveTab("home");
              } else {
                setActiveTab("recitation");
              }
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 transition-colors cursor-pointer relative ${
              activeTab === "recitation" && shareAyahData === null
                ? (theme === "emerald-velvet" ? "text-[#34d399] font-black" : theme === "navy-velvet" ? "text-[#3F63C6] font-black" : theme === "gold-velvet" ? "text-[#c5a85c] font-black" : isDark ? "text-emerald-300 font-black" : "text-emerald-500 font-bold")
                : (theme === "emerald-velvet" ? "text-[#FAF8F5]/60 hover:text-[#FAF8F5]" : isDark ? "text-slate-400 hover:text-emerald-300" : "text-slate-400 hover:text-slate-600")
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Headphones 
                size={18} 
                className={activeTab === "recitation" && shareAyahData === null ? "stroke-[2.5px]" : "stroke-[1.8px]"} 
              />
              {playbackSync?.isPlaying && (
                <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <span>{t.recitation}</span>
          </button>

          {/* 4. Khatmah Organizer */}
          <button
            id="nav-tab-khatmah"
            onClick={() => {
              if (shareAyahData !== null) setShareAyahData(null);
              if (activeTab === "khatmah") {
                setActiveTab("home");
              } else {
                setActiveTab("khatmah");
              }
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 transition-colors cursor-pointer ${
              activeTab === "khatmah" && shareAyahData === null
                ? (theme === "emerald-velvet" ? "text-[#34d399] font-black" : theme === "navy-velvet" ? "text-[#3F63C6] font-black" : theme === "gold-velvet" ? "text-[#c5a85c] font-black" : isDark ? "text-emerald-300 font-black" : "text-emerald-500 font-bold")
                : (theme === "emerald-velvet" ? "text-[#FAF8F5]/60 hover:text-[#FAF8F5]" : isDark ? "text-slate-400 hover:text-emerald-300" : "text-slate-400 hover:text-slate-600")
            }`}
          >
            <Calendar size={18} className={activeTab === "khatmah" && shareAyahData === null ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
            <span>{t.khatmah}</span>
          </button>

          {/* 5. Favorites / Bookmarks */}
          <button
            id="nav-tab-favorites"
            onClick={() => {
              if (shareAyahData !== null) setShareAyahData(null);
              if (activeTab === "favorites") {
                setActiveTab("home");
              } else {
                setActiveTab("favorites");
              }
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 transition-colors cursor-pointer relative ${
              activeTab === "favorites" && shareAyahData === null
                ? (theme === "emerald-velvet" ? "text-[#34d399] font-black" : theme === "navy-velvet" ? "text-[#3F63C6] font-black" : theme === "gold-velvet" ? "text-[#c5a85c] font-black" : isDark ? "text-emerald-300 font-black" : "text-emerald-500 font-bold")
                : (theme === "emerald-velvet" ? "text-[#FAF8F5]/60 hover:text-[#FAF8F5]" : isDark ? "text-slate-400 hover:text-emerald-300" : "text-slate-400 hover:text-slate-600")
            }`}
          >
            <BookmarkIcon 
              size={18} 
              className={`${
                activeTab === "favorites" && shareAyahData === null
                  ? (theme === "emerald-velvet" ? "stroke-[2.5px] text-[#34d399]" : theme === "navy-velvet" ? "stroke-[2.5px] text-[#3F63C6]" : theme === "gold-velvet" ? "stroke-[2.5px] text-[#c5a85c]" : isDark ? "stroke-[2.5px] text-emerald-300" : "stroke-[2.5px] fill-emerald-500/20 text-emerald-500")
                  : "stroke-[1.8px]"
              } ${bookmarks.length > 0 ? (theme === "emerald-velvet" ? "text-[#34d399] fill-[#34d399]/20" : theme === "navy-velvet" ? "text-[#3F63C6] fill-[#3F63C6]/20" : theme === "gold-velvet" ? "text-[#c5a85c] fill-[#c5a85c]/20" : isDark ? "text-emerald-300 fill-emerald-500/20" : "text-emerald-500 fill-emerald-500") : ""}`} 
            />
            <span>{t.bookmarks}</span>
            {bookmarks.length > 0 && (
              <span className={`absolute top-0.5 right-1 md:right-2 flex h-3 w-3 rounded-full text-[7px] items-center justify-center font-bold shadow-xs ${
                theme === "emerald-velvet" ? "bg-[#10b981] text-[#011c14]" : isDark ? "bg-emerald-500 text-[#011a12]" : "bg-emerald-500 text-white"
              }`}>
                {bookmarks.length}
              </span>
            )}
          </button>

          {/* 5.5. Share Ayah Tab (على يمين أيقونة المكتبة في الواجهة العربية RTL) */}
          <button
            id="nav-tab-share-ayah"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenShareAyah();
            }}
            title={t.shareAyah}
            className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 transition-colors cursor-pointer ${
              shareAyahData !== null
                ? (theme === "emerald-velvet" ? "text-[#34d399] font-black" : theme === "navy-velvet" ? "text-[#3F63C6] font-black" : theme === "gold-velvet" ? "text-[#c5a85c] font-black" : isDark ? "text-emerald-300 font-black" : "text-emerald-500 font-bold")
                : (theme === "emerald-velvet" ? "text-[#FAF8F5]/60 hover:text-[#FAF8F5]" : isDark ? "text-slate-400 hover:text-emerald-300" : "text-slate-400 hover:text-slate-600")
            }`}
          >
            <Share2 size={18} className={shareAyahData !== null ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
            <span>{t.shareAyah}</span>
          </button>

          {/* 6. Verse by Verse (Continuous Mushaf) */}
          <button
            id="nav-tab-tafsir"
            onClick={handleOpenLibrary}
            className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 transition-colors cursor-pointer ${
              activeTab === "home" && settings.pageMode === "continuous" && shareAyahData === null
                ? (theme === "emerald-velvet" ? "text-[#34d399] font-black" : theme === "navy-velvet" ? "text-[#3F63C6] font-black" : theme === "gold-velvet" ? "text-[#c5a85c] font-black" : isDark ? "text-emerald-300 font-black" : "text-emerald-500 font-bold")
                : (theme === "emerald-velvet" ? "text-[#FAF8F5]/60 hover:text-[#FAF8F5]" : isDark ? "text-slate-400 hover:text-emerald-300" : "text-slate-400 hover:text-slate-600")
            }`}
          >
            <Library size={18} className={activeTab === "home" && settings.pageMode === "continuous" && shareAyahData === null ? "stroke-[2.5px]" : "stroke-[1.8px]"} />
            <span>{t.tafsirs}</span>
          </button>
        </div>
      </nav>

      {/* Share Ayah Studio Modal */}
      {shareAyahData !== null && (
        <ShareAyahModal
          shareData={shareAyahData}
          onClose={() => setShareAyahData(null)}
          theme={theme}
          isDark={isDark}
        />
      )}

    </div>
  );
}
