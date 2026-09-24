import React, { useState, useMemo, useEffect } from "react";
import { QuranSettings } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Headphones, 
  Search, 
  Check, 
  Volume2, 
  Settings2, 
  Sparkles, 
  BookOpen,
  Download,
  SkipForward,
  SkipBack,
  Play,
  Pause,
  Repeat,
  Infinity as InfinityIcon,
  ChevronDown,
  Compass,
  Bookmark as BookmarkIcon,
  X,
  VolumeX,
  Mic,
  Users,
  Award,
  BookMarked,
  Radio,
  Music,
  WifiOff,
  Trash2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { surahsList } from "../data/surahList";
import { CustomDropdown } from "./CustomDropdown";
import { ensureQbsmlLoaded } from "../utils/qcf4Utils";
import { Qcf4VerseText } from "./Qcf4VerseText";
import { recitersList, Reciter } from "../data/recitersData";
import { 
  downloadSingleAyah, 
  downloadSurahOffline, 
  getSurahOfflineStatus, 
  removeSurahOfflineAudio, 
  isAyahAudioCached 
} from "../utils/audioOfflineCache";
export { recitersList };

interface RecitationScreenProps {
  settings: QuranSettings;
  onChangeSettings: (newSettings: Partial<QuranSettings>) => void;
  isDark: boolean;
  theme?: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet";
  playback?: {
    isPlaying: boolean;
    playingIndex: number | null;
    recitationMode: "continuous" | "range";
    startAyahNum: number;
    endAyahNum: number;
    ayahRepeatMax: number;
    rangeRepeatMax: number;
    currentAyahPlayCount: number;
    currentRangePlayCount: number;
    handleTogglePlay: (reciterIdOverride?: string) => void;
    handleNextAyah: () => void;
    handlePrevAyah: () => void;
    handleStopRecitation: () => void;
    setRecitationMode: (mode: "continuous" | "range") => void;
    setStartAyahNum: (num: number) => void;
    setEndAyahNum: (num: number) => void;
    setAyahRepeatMax: (num: number) => void;
    setRangeRepeatMax: (num: number) => void;
    currentSurahNumber: number;
  };
  activeSurahNumber: number;
  onChangeSurahNumber: (num: number) => void;
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

type ReciterCategory = "all" | "haramain" | "masters" | "mujawwad" | "teacher" | "other_riwayat";

export default function RecitationScreen({
  settings,
  onChangeSettings,
  isDark,
  theme = "light",
  playback,
  activeSurahNumber,
  onChangeSurahNumber
}: RecitationScreenProps) {
  const [activeSubTab, setActiveSubTab] = useState<"controls" | "reciters" | "downloads">("controls");
  const [reciterSearch, setReciterSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<ReciterCategory>("all");

  // Download section states
  const [downloadType, setDownloadType] = useState<"ayah" | "surah" | "quran">("surah");
  const [downloadSurahNum, setDownloadSurahNum] = useState<number>(1);
  const [downloadAyahNum, setDownloadAyahNum] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<string>("0 MB/s");
  const [downloadEta, setDownloadEta] = useState<string>("");
  const [downloadStage, setDownloadStage] = useState<string>("");
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string>("");

  // Offline status tracking
  const [surahOfflineInfo, setSurahOfflineInfo] = useState<{ cachedCount: number; isComplete: boolean; percent: number }>({
    cachedCount: 0,
    isComplete: false,
    percent: 0,
  });
  const [isAyahDownloaded, setIsAyahDownloaded] = useState<boolean>(false);
  const downloadAbortRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    ensureQbsmlLoaded();
  }, []);

  // Sync and refresh offline audio cache status
  const refreshOfflineStatus = async () => {
    try {
      const sInfo = surahsList.find((s) => s.number === downloadSurahNum) || surahsList[0];
      const status = await getSurahOfflineStatus(
        settings.reciterId,
        downloadSurahNum,
        sInfo.numberOfAyahs
      );
      setSurahOfflineInfo(status);

      const ayahCached = await isAyahAudioCached(
        settings.reciterId,
        downloadSurahNum,
        downloadAyahNum
      );
      setIsAyahDownloaded(ayahCached);
    } catch (_) {}
  };

  useEffect(() => {
    refreshOfflineStatus();
  }, [settings.reciterId, downloadSurahNum, downloadAyahNum]);

  const currentReciter = useMemo(() => {
    return recitersList.find((r) => r.id === settings.reciterId) || recitersList[0];
  }, [settings.reciterId]);

  const selectedSurahInfo = useMemo(() => {
    return surahsList.find((s) => s.number === (activeSurahNumber || playback?.currentSurahNumber || 1)) || surahsList[0];
  }, [activeSurahNumber, playback?.currentSurahNumber]);

  const downloadSurahInfo = useMemo(() => {
    return surahsList.find((s) => s.number === downloadSurahNum) || surahsList[0];
  }, [downloadSurahNum]);

  const surahOptions = useMemo(() => {
    return surahsList.map((s) => ({
      value: s.number,
      label: `سورة ${s.name}`,
      surahNumber: s.number,
      name: s.name,
      arabicType: s.arabicType,
      numberOfAyahs: s.numberOfAyahs,
      juzStart: s.juzStart,
      englishName: s.englishName,
    }));
  }, []);

  const reciterOptions = useMemo(() => {
    return recitersList.map((r) => ({
      value: r.id,
      label: r.nameAr,
      sublabel: `${r.bitrate ? `${r.bitrate} • ` : ""}${r.quality || "جودة عالية HQ"}${r.riwayah ? ` (${r.riwayah})` : ""}`,
    }));
  }, []);

  const startAyahOptions = useMemo(() => {
    return Array.from({ length: selectedSurahInfo.numberOfAyahs }).map((_, i) => ({
      value: i + 1,
      label: `الآية ${toArabicNumerals(i + 1)}`,
    }));
  }, [selectedSurahInfo.numberOfAyahs]);

  const endAyahOptions = useMemo(() => {
    return Array.from({ length: selectedSurahInfo.numberOfAyahs }).map((_, i) => ({
      value: i + 1,
      label: `الآية ${toArabicNumerals(i + 1)}`,
      disabled: i + 1 < (playback?.startAyahNum || 1),
    }));
  }, [selectedSurahInfo.numberOfAyahs, playback?.startAyahNum]);

  const downloadSurahOptions = useMemo(() => {
    return surahsList.map((s) => ({
      value: s.number,
      label: `سورة ${s.name}`,
      surahNumber: s.number,
      name: s.name,
      arabicType: s.arabicType,
      numberOfAyahs: s.numberOfAyahs,
      juzStart: s.juzStart,
      englishName: s.englishName,
    }));
  }, []);

  const downloadAyahOptions = useMemo(() => {
    return Array.from({ length: downloadSurahInfo.numberOfAyahs }).map((_, i) => ({
      value: i + 1,
      label: `الآية ${toArabicNumerals(i + 1)}`,
    }));
  }, [downloadSurahInfo.numberOfAyahs]);

  // Categorize reciters
  const categorizedReciters = useMemo(() => {
    return recitersList.filter((r) => {
      // Category match
      let matchCategory = true;

      if (selectedCategory === "haramain") {
        matchCategory = !!r.categories?.includes("haramain");
      } else if (selectedCategory === "masters") {
        matchCategory = !!r.categories?.includes("masters");
      } else if (selectedCategory === "mujawwad") {
        matchCategory = !!r.categories?.includes("mujawwad");
      } else if (selectedCategory === "teacher") {
        matchCategory = !!r.categories?.includes("teacher");
      } else if (selectedCategory === "other_riwayat") {
        matchCategory = !!r.categories?.includes("other_riwayat") || (!!r.riwayah && !r.riwayah.includes("حفص"));
      }

      if (!matchCategory) return false;

      // Search query match
      if (!reciterSearch.trim()) return true;
      const q = reciterSearch.toLowerCase().trim();
      return (
        r.nameAr.toLowerCase().includes(q) ||
        r.nameEn.toLowerCase().includes(q) ||
        (r.riwayah && r.riwayah.toLowerCase().includes(q)) ||
        r.description.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, reciterSearch]);

  // Reset chosen ayah bounds when surah changes for downloads
  useEffect(() => {
    setDownloadAyahNum(1);
  }, [downloadSurahNum]);

  // Select reciter and optionally toggle/trigger playback immediately
  const handleSelectReciter = (reciter: Reciter, autoPlay: boolean = false) => {
    onChangeSettings({ reciterId: reciter.id });
    if (autoPlay) {
      if (playback?.isPlaying) {
        playback.handleStopRecitation?.();
      }
      setTimeout(() => {
        playback?.handleTogglePlay?.(reciter.id);
      }, 20);
    }
  };

  // Real offline download execution with CacheStorage & IndexedDB
  const handleStartDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadSuccess(false);
    setDownloadError("");
    setDownloadSpeed("0 MB/s");
    setDownloadEta("جاري الاتصال...");

    const controller = new AbortController();
    downloadAbortRef.current = controller;

    try {
      if (downloadType === "ayah") {
        setDownloadStage(`جاري تحميل الآية ${downloadAyahNum} من سورة ${downloadSurahInfo.name}...`);
        const startTime = Date.now();
        const res = await downloadSingleAyah(
          settings.reciterId,
          downloadSurahNum,
          downloadAyahNum,
          controller.signal
        );

        if (res.success) {
          setDownloadProgress(100);
          setDownloadSuccess(true);
          setDownloadStage(`تم حفظ الآية ${downloadAyahNum} من سورة ${downloadSurahInfo.name} أوفلاين بنجاح!`);
          const elapsedSec = Math.max(0.2, (Date.now() - startTime) / 1000);
          const mb = (res.bytes || 120000) / (1024 * 1024);
          const speed = (mb / elapsedSec).toFixed(1);
          setDownloadSpeed(`${speed} MB/s`);
          setDownloadEta("جاهزة الآن للاستماع بدون اتصال بالإنترنت");
          await refreshOfflineStatus();
        } else {
          setDownloadError(res.error || "تعذر إكمال تحميل الآية");
        }
      } else if (downloadType === "surah") {
        setDownloadStage(`جاري فحص وتنزيل آيات سورة ${downloadSurahInfo.name} (${downloadSurahInfo.numberOfAyahs} آية)...`);
        
        const res = await downloadSurahOffline(
          settings.reciterId,
          downloadSurahNum,
          downloadSurahInfo.numberOfAyahs,
          controller.signal,
          (info) => {
            setDownloadProgress(info.percent);
            setDownloadStage(`جاري تحميل الآية ${info.currentAyah} من ${info.totalAyahs} بصوت ${currentReciter.nameAr}...`);
            setDownloadSpeed(`${info.speedMBps} MB/s`);
            setDownloadEta(`تم حفظ ${info.completedAyahs} من ${info.totalAyahs} آية (${(info.bytesDownloaded / (1024 * 1024)).toFixed(1)} ميغابايت)`);
          }
        );

        if (res.success) {
          setDownloadProgress(100);
          setDownloadSuccess(true);
          setDownloadStage(`اكتمل حفظ سورة ${downloadSurahInfo.name} كاملة أوفلاين بنجاح!`);
          setDownloadEta("السورة متوفرة الآن بالكامل للاستماع بدون اتصال بالإنترنت");
          await refreshOfflineStatus();
        } else {
          setDownloadError(res.error || "تعذر إكمال تحميل السورة");
        }
      } else if (downloadType === "quran") {
        setDownloadStage("جاري بدء تحميل سور المصحف الشريف تباعاً...");
        let totalCompletedSurahs = 0;
        const totalSurahs = 114;

        for (let sNum = 1; sNum <= totalSurahs; sNum++) {
          if (controller.signal.aborted) break;
          const sInfo = surahsList.find((s) => s.number === sNum);
          if (!sInfo) continue;

          setDownloadStage(`جاري تحميل سورة ${sInfo.name} (${sNum} من 114)...`);
          const res = await downloadSurahOffline(
            settings.reciterId,
            sNum,
            sInfo.numberOfAyahs,
            controller.signal,
            (info) => {
              const overallPercent = Math.min(100, Math.round(((totalCompletedSurahs + (info.percent / 100)) / totalSurahs) * 100));
              setDownloadProgress(overallPercent);
              setDownloadEta(`سورة ${sInfo.name}: آية ${info.currentAyah}/${info.totalAyahs}`);
              setDownloadSpeed(`${info.speedMBps} MB/s`);
            }
          );

          if (!res.success && controller.signal.aborted) {
            break;
          }
          totalCompletedSurahs++;
        }

        if (!controller.signal.aborted) {
          setDownloadProgress(100);
          setDownloadSuccess(true);
          setDownloadStage("تم اكتمال تحميل وحفظ تلاوة المصحف كاملاً بنجاح!");
          setDownloadEta("جميع التلاوات المحملة جاهزة للاستماع أوفلاين بدون إنترنت");
          await refreshOfflineStatus();
        } else {
          setDownloadError("تم إيقاف تنزيل المصحف بناءً على طلبك");
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setDownloadError(err?.message || "حدث خطأ غير متوقع أثناء التحميل");
      }
    } finally {
      setIsDownloading(false);
      downloadAbortRef.current = null;
    }
  };

  const handleCancelDownload = () => {
    if (downloadAbortRef.current) {
      downloadAbortRef.current.abort();
      downloadAbortRef.current = null;
    }
    setIsDownloading(false);
    setDownloadStage("تم إلغاء التنزيل");
    setDownloadEta("");
  };

  const handleDeleteOfflineSurah = async () => {
    if (window.confirm(`هل أنت متأكد من حذف تلاوة سورة ${downloadSurahInfo.name} بصوت ${currentReciter.nameAr} من الذاكرة المحلية؟`)) {
      await removeSurahOfflineAudio(settings.reciterId, downloadSurahNum, downloadSurahInfo.numberOfAyahs);
      await refreshOfflineStatus();
    }
  };

  return (
    <div id="recitation-screen-root" className="w-full max-w-full px-3 sm:px-6 py-4 space-y-4 text-right font-sans" dir="rtl">
      
      {/* Title Header & Subtab Switcher */}
      <div id="recitation-header" className={`flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3 ${
        theme === "emerald-velvet"
          ? "border-[#c5a85c]/30"
          : isDark ? "border-emerald-500/25" : "border-slate-100"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            theme === "emerald-velvet"
              ? "bg-[#c5a85c]/15 text-[#c5a85c]"
              : theme === "navy-velvet"
                ? "bg-[#3F63C6]/10 text-[#3F63C6]"
                : theme === "gold-velvet"
                  ? "bg-[#c5a85c]/15 text-[#c5a85c]"
                  : isDark
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-emerald-500/10 text-emerald-500"
          }`}>
            <Headphones size={22} className={
              theme === "navy-velvet"
                ? "text-[#3F63C6]"
                : theme === "gold-velvet" || theme === "emerald-velvet"
                  ? "text-[#c5a85c]"
                  : isDark
                    ? "text-emerald-400"
                    : "text-emerald-500"
            } />
          </div>
        </div>

        {/* Subtabs Switcher */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border self-start sm:self-auto ${
          theme === "emerald-velvet"
            ? "bg-[#012519] border-[#c5a85c]/30"
            : theme === "navy-velvet"
              ? "bg-slate-100 border-slate-200"
              : theme === "gold-velvet"
                ? "bg-[#FAF8F5] border-[#c5a85c]/30"
                : isDark ? "bg-[#091512] border-emerald-500/25" : "bg-slate-100 border-slate-200"
        }`}>
          <button
            type="button"
            id="tab-recitation-controls"
            onClick={() => setActiveSubTab("controls")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "controls"
                ? theme === "navy-velvet"
                  ? "bg-[#3F63C6] text-white shadow-sm"
                  : theme === "gold-velvet" || theme === "emerald-velvet"
                    ? "bg-[#c5a85c] text-[#011a12] shadow-sm"
                    : isDark
                      ? "bg-emerald-500 text-[#011a12] shadow-sm font-black"
                      : "bg-emerald-600 text-white shadow-sm"
                : isDark ? "text-emerald-300/70 hover:text-slate-100" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Repeat size={13} />
            <span>التحكم</span>
          </button>

          <button
            type="button"
            id="tab-recitation-reciters-list"
            onClick={() => setActiveSubTab("reciters")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "reciters"
                ? theme === "navy-velvet"
                  ? "bg-[#3F63C6] text-white shadow-sm"
                  : theme === "gold-velvet" || theme === "emerald-velvet"
                    ? "bg-[#c5a85c] text-[#011a12] shadow-sm"
                    : isDark
                      ? "bg-emerald-500 text-[#011a12] shadow-sm font-black"
                      : "bg-emerald-600 text-white shadow-sm"
                : isDark ? "text-emerald-300/70 hover:text-slate-100" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users size={13} />
            <span>القراء</span>
          </button>

          <button
            type="button"
            id="tab-recitation-downloads"
            onClick={() => setActiveSubTab("downloads")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "downloads"
                ? theme === "navy-velvet"
                  ? "bg-[#3F63C6] text-white shadow-sm"
                  : theme === "gold-velvet" || theme === "emerald-velvet"
                    ? "bg-[#c5a85c] text-[#011a12] shadow-sm"
                    : isDark
                      ? "bg-emerald-500 text-[#011a12] shadow-sm font-black"
                      : "bg-emerald-600 text-white shadow-sm"
                : isDark ? "text-emerald-300/70 hover:text-slate-100" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Download size={13} />
            <span>تحميل</span>
          </button>
        </div>
      </div>

      {/* 1. Main Controls SubTab */}
      {activeSubTab === "controls" && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Synced Audio Console Status */}
          <div className={`p-4 rounded-2xl border transition-all ${
            theme === "emerald-velvet"
              ? "bg-[#011a12] border-[#c5a85c]/30 text-[#FAF8F5]"
              : theme === "navy-velvet"
                ? "bg-slate-50 border-slate-200 text-slate-800"
                : theme === "gold-velvet"
                  ? "bg-[#FAF8F5] border-[#c5a85c]/35 text-slate-850"
                  : isDark 
                    ? "bg-[#091512] border-emerald-500/30 text-slate-100" 
                    : "bg-emerald-50/30 border-emerald-100/70 text-emerald-950"
          }`}>
            <div className="flex flex-row justify-between items-center gap-2 w-full">
              <div className="flex items-center gap-2 sm:gap-3 text-right overflow-hidden">
                <button
                  type="button"
                  id="recitation-play-avatar-btn"
                  onClick={() => playback?.handleTogglePlay?.()}
                  className={`relative h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-white shrink-0 shadow cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                    theme === "navy-velvet" ? "bg-[#3F63C6]" : (theme === "gold-velvet" || theme === "emerald-velvet") ? "bg-[#c5a85c] text-[#011a12]" : isDark ? "bg-emerald-500 text-[#011a12]" : "bg-emerald-600"
                  }`}
                  title={playback?.isPlaying ? "إيقاف مؤقت للتلاوة" : "بدء التلاوة"}
                >
                  {playback?.isPlaying ? (
                    <Pause size={20} className={theme === "gold-velvet" || theme === "emerald-velvet" || isDark ? "text-[#011a12]" : "text-white"} />
                  ) : (
                    <Volume2 size={20} className={isDark ? "text-[#011a12]" : "text-white/90"} />
                  )}
                  {playback?.isPlaying && (
                    <span className="absolute -bottom-1 -left-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black truncate">
                      <span className={theme === "emerald-velvet" ? "text-[#FAF8F5]/80" : isDark ? "text-slate-300" : "text-slate-600"}>القارئ: </span>
                      <span className={`font-black ${
                        theme === "emerald-velvet"
                          ? "text-[#e6ca7d]"
                          : theme === "gold-velvet"
                            ? "text-[#b48c36]"
                            : theme === "navy-velvet"
                              ? "text-[#3F63C6]"
                              : isDark
                                ? "text-emerald-300"
                                : "text-emerald-700 dark:text-emerald-400"
                      }`}>
                        {currentReciter.nameAr}
                      </span>
                    </h3>
                  </div>
                  <p className={`text-[10px] sm:text-[11px] ${
                    theme === "emerald-velvet"
                      ? "text-[#c5a85c]/70"
                      : isDark
                        ? "text-emerald-400/80"
                        : "text-slate-500"
                  } mt-0.5 truncate`}>
                    سورة {selectedSurahInfo.name} 
                    {typeof playback?.playingIndex === "number" ? (
                      <> | الآية <span className="font-amiri font-bold">{toArabicNumerals(playback.playingIndex + 1)}</span></>
                    ) : ""}
                  </p>
                </div>
              </div>

              {/* Direct Player Controls */}
              <div id="recitation-player-controls-left" className="flex items-center gap-1.5 sm:gap-2 justify-end shrink-0">
                <button
                  type="button"
                  id="recitation-start-play-btn"
                  onClick={() => playback?.handleTogglePlay?.()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black cursor-pointer transition-all shadow-md active:scale-95 hover:shadow-lg ${
                    theme === "emerald-velvet"
                      ? "bg-[#c5a85c] text-[#011a12] hover:bg-[#c5a85c]/90 ring-2 ring-[#c5a85c]/30"
                      : theme === "navy-velvet"
                        ? "bg-[#3F63C6] text-white hover:bg-[#3F63C6]/90 ring-2 ring-[#3F63C6]/30"
                        : theme === "gold-velvet"
                          ? "bg-[#c5a85c] text-[#011c14] hover:bg-[#c5a85c]/90 ring-2 ring-[#c5a85c]/30"
                          : isDark
                            ? "bg-emerald-500 text-[#011a12] hover:bg-emerald-400 ring-2 ring-emerald-400/30"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-500/30"
                  }`}
                  title={playback?.isPlaying ? "إيقاف التلاوة" : "بدء تلاوة السورة"}
                  aria-label={playback?.isPlaying ? "إيقاف التلاوة" : "بدء تلاوة السورة"}
                >
                  {playback?.isPlaying ? (
                    <Pause size={18} className="shrink-0" />
                  ) : (
                    <Play size={18} fill="currentColor" className="shrink-0 ml-0.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Repetition Indicators */}
            {playback?.isPlaying && (
              <div className="mt-3 pt-3 border-t border-dashed border-slate-200/50 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 justify-center">
                <span className="flex items-center gap-1">
                  <Repeat size={11} className="text-emerald-400 animate-spin-slow" />
                  تكرار الآية الحالية: <strong className={theme === "gold-velvet" || theme === "emerald-velvet" ? "text-[#c5a85c]" : isDark ? "text-emerald-300" : "text-emerald-600"}><span className="font-amiri text-xs font-bold">{toArabicNumerals(playback?.currentAyahPlayCount || 1)}</span> / <span className="font-amiri text-xs font-bold">{toArabicNumerals(playback?.ayahRepeatMax || 1)}</span></strong>
                </span>
                {playback?.recitationMode === "range" && (
                  <span className="flex items-center gap-1">
                    <InfinityIcon size={11} className="text-blue-500" />
                    تكرار المقطع بالكامل: <strong className={theme === "gold-velvet" || theme === "emerald-velvet" ? "text-[#c5a85c]" : isDark ? "text-emerald-300" : "text-emerald-600"}><span className="font-amiri text-xs font-bold">{toArabicNumerals(playback?.currentRangePlayCount || 1)}</span> / {(playback?.rangeRepeatMax || 1) >= 1000 ? "∞" : <span className="font-amiri text-xs font-bold">{toArabicNumerals(playback?.rangeRepeatMax || 1)}</span>}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick Settings Section */}
          <div className={`p-4 rounded-2xl border space-y-4 ${
            theme === "emerald-velvet"
              ? "bg-[#011a12] border-[#c5a85c]/25 text-[#FAF8F5]"
              : theme === "navy-velvet"
                ? "bg-white border-slate-200 text-slate-800"
                : theme === "gold-velvet"
                  ? "bg-white border-[#c5a85c]/25 text-slate-900"
                  : isDark ? "bg-[#091512] border-emerald-500/25 text-slate-100" : "bg-slate-50 border-slate-100"
          }`}>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Surah Select */}
              <CustomDropdown
                label="السورة:"
                value={activeSurahNumber || playback?.currentSurahNumber || 1}
                onChange={(val) => {
                  const num = Number(val);
                  onChangeSurahNumber(num);
                  if (playback?.setStartAyahNum) {
                    playback.setStartAyahNum(1);
                  }
                  const sMeta = surahsList.find((s) => s.number === num);
                  if (playback?.setEndAyahNum && sMeta) {
                    playback.setEndAyahNum(sMeta.numberOfAyahs);
                  }
                }}
                options={surahOptions}
                isDark={isDark}
                theme={theme}
                searchable={true}
                isSurahList={true}
              />

              {/* 2. Reciter Select with Quick Catalog Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    القارئ:
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab("reciters")}
                    className={`text-[10px] font-bold flex items-center gap-1 hover:underline cursor-pointer ${
                      theme === "emerald-velvet" || theme === "gold-velvet"
                        ? "text-[#c5a85c]"
                        : theme === "navy-velvet" ? "text-[#3F63C6]" : "text-emerald-600"
                    }`}
                  >
                    <span>استعراض جميع القراء</span>
                    <span>←</span>
                  </button>
                </div>
                <CustomDropdown
                  value={settings.reciterId}
                  onChange={(val) => onChangeSettings({ reciterId: String(val) })}
                  options={reciterOptions}
                  isDark={isDark}
                  theme={theme}
                  searchable={true}
                />
              </div>
            </div>

            {/* Recitation Mode Segmented Controls */}
            <div className="space-y-1.5">
              <label className={`block text-[10px] font-bold flex items-center gap-1.5 ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                <Compass size={13} className={theme === "gold-velvet" || theme === "emerald-velvet" ? "text-[#c5a85c]" : isDark ? "text-emerald-400" : "text-emerald-500"} />
                <span>وضع الاستماع:</span>
              </label>
              <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl border ${
                theme === "emerald-velvet"
                  ? "bg-[#012519] border-[#c5a85c]/20"
                  : isDark 
                    ? "bg-[#091512] border-emerald-500/25" 
                    : theme === "gold-velvet"
                      ? "bg-[#FAF8F5] border-[#c5a85c]/20"
                      : "bg-slate-100 border-slate-200"
              }`}>
                <button
                  type="button"
                  onClick={() => playback?.setRecitationMode("continuous")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    playback?.recitationMode === "continuous"
                      ? theme === "navy-velvet"
                        ? "bg-[#3F63C6] text-white shadow-md"
                        : theme === "gold-velvet" || theme === "emerald-velvet"
                          ? "bg-[#c5a85c] text-[#011c14] shadow-md font-black"
                          : isDark
                            ? "bg-emerald-500 text-[#011c14] shadow-md font-black"
                            : "bg-emerald-600 text-white shadow-md"
                      : isDark ? "text-emerald-300/70 hover:text-slate-100" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Repeat size={13} />
                  <span>تلاوة</span>
                </button>
                <button
                  type="button"
                  onClick={() => playback?.setRecitationMode("range")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    playback?.recitationMode === "range"
                      ? theme === "navy-velvet"
                        ? "bg-[#3F63C6] text-white shadow-md"
                        : theme === "gold-velvet" || theme === "emerald-velvet"
                          ? "bg-[#c5a85c] text-[#011c14] shadow-md font-black"
                          : isDark
                            ? "bg-emerald-500 text-[#011c14] shadow-md font-black"
                            : "bg-emerald-600 text-white shadow-md"
                      : isDark ? "text-emerald-300/70 hover:text-slate-100" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <BookmarkIcon size={13} />
                  <span>تحفيظ</span>
                </button>
              </div>
            </div>

            {/* From Ayah / To Ayah Selects */}
            {playback?.recitationMode === "range" && (
              <div className={`grid grid-cols-2 gap-4 p-3 rounded-2xl border ${
                theme === "emerald-velvet"
                  ? "bg-[#012519] border-[#c5a85c]/20 text-[#FAF8F5]"
                  : isDark
                    ? "bg-[#091512] border-emerald-500/20 text-slate-100"
                    : "bg-slate-50/50 border-slate-200/50"
              } animate-fade-in`}>
                <CustomDropdown
                  label="من آية:"
                  value={playback?.startAyahNum || 1}
                  onChange={(val) => {
                    const num = Number(val);
                    playback?.setStartAyahNum(num);
                    if (playback && num > playback.endAyahNum) {
                      playback.setEndAyahNum(num);
                    }
                  }}
                  options={startAyahOptions}
                  isDark={isDark}
                  theme={theme}
                />

                <CustomDropdown
                  label="إلى آية:"
                  value={playback?.endAyahNum || 1}
                  onChange={(val) => {
                    const num = Number(val);
                    playback?.setEndAyahNum(num);
                    if (playback && num < playback.startAyahNum) {
                      playback.setStartAyahNum(num);
                    }
                  }}
                  options={endAyahOptions}
                  isDark={isDark}
                  theme={theme}
                />
              </div>
            )}

            {/* Repetitions Control block */}
            {playback?.recitationMode === "range" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/50 dark:border-emerald-500/20 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold flex items-center gap-1.5 text-slate-500 dark:text-emerald-400">
                    <Repeat size={12} className="text-emerald-400 animate-spin-slow" />
                    <span>تكرار الآية الواحدة (عدد المرات):</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 5, 10].map((num) => {
                      const isSelected = playback?.ayahRepeatMax === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => playback?.setAyahRepeatMax(num)}
                          className={`flex-1 h-8 flex items-center justify-center text-[11px] font-black rounded-xl transition-all cursor-pointer border ${
                            isSelected
                              ? theme === "navy-velvet"
                                ? "bg-[#3F63C6] border-[#3F63C6] text-white shadow-sm"
                                : theme === "gold-velvet" || theme === "emerald-velvet"
                                  ? "bg-[#c5a85c] border-[#c5a85c] text-[#011a12] shadow-sm font-black"
                                  : isDark
                                    ? "bg-emerald-500 border-emerald-500 text-[#011a12] shadow-sm font-black"
                                    : "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                              : theme === "navy-velvet"
                                ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                : theme === "gold-velvet"
                                  ? "bg-[#FAF8F5] border-[#c5a85c]/25 text-slate-800 hover:bg-[#c5a85c]/10"
                                  : theme === "emerald-velvet"
                                    ? "bg-[#012519] border-[#c5a85c]/25 text-[#FAF8F5]/80 hover:bg-[#011a12]"
                                    : isDark
                                      ? "bg-[#091512] border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15"
                                      : "bg-emerald-50/50 border-emerald-100/60 text-emerald-950 hover:bg-emerald-100/30"
                          }`}
                        >
                          <span className="font-amiri text-sm font-bold leading-none">{toArabicNumerals(num)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold flex items-center gap-1.5 text-slate-500 dark:text-emerald-400">
                    <InfinityIcon size={12} className="text-blue-400" />
                    <span>تكرار المقطع بأكمله:</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 5, 1000].map((num) => {
                      const isSelected = playback?.rangeRepeatMax === num;
                      const isDisabled = playback?.recitationMode !== "range";
                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => playback?.setRangeRepeatMax(num)}
                          className={`flex-1 h-8 flex items-center justify-center text-[11px] font-black rounded-xl transition-all cursor-pointer border disabled:opacity-25 disabled:pointer-events-none ${
                            isSelected && !isDisabled
                              ? theme === "navy-velvet"
                                ? "bg-[#3F63C6] border-[#3F63C6] text-white shadow-sm"
                                : theme === "gold-velvet" || theme === "emerald-velvet"
                                  ? "bg-[#c5a85c] border-[#c5a85c] text-[#011a12] shadow-sm font-black"
                                  : isDark
                                    ? "bg-emerald-500 border-emerald-500 text-[#011a12] shadow-sm font-black"
                                    : "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                              : theme === "navy-velvet"
                                ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                : theme === "gold-velvet"
                                  ? "bg-[#FAF8F5] border-[#c5a85c]/25 text-slate-800 hover:bg-[#c5a85c]/10"
                                  : theme === "emerald-velvet"
                                    ? "bg-[#012519] border-[#c5a85c]/25 text-[#FAF8F5]/80 hover:bg-[#011a12]"
                                    : isDark
                                      ? "bg-[#091512] border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15"
                                      : "bg-emerald-50/50 border-emerald-100/60 text-emerald-950 hover:bg-emerald-100/30"
                          }`}
                        >
                          {num === 1000 ? <InfinityIcon size={12} className="stroke-[3px]" /> : <span className="font-amiri text-sm font-bold leading-none">{toArabicNumerals(num)}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Spiritual Quote block */}
          <div className={`p-3.5 rounded-xl border border-dashed text-center text-xs flex items-center justify-center ${
            theme === "emerald-velvet"
              ? "border-[#c5a85c]/30 bg-[#011a12] text-[#FAF8F5]/90"
              : isDark
                ? "border-emerald-500/30 bg-[#091512] text-slate-100"
                : "border-emerald-500/20 bg-emerald-500/[0.02]"
          }`}>
            <div className="flex items-center justify-center text-center">
              <Qcf4VerseText
                surah={7}
                ayah={204}
                page={176}
                fallbackText="﴿ وَإِذَا قُرِئَ الْقُرْآنُ فَاسْتَمِعُوا لَهُ وَأَنصِتُوا لَعَلَّكُمْ تُرْحَمُونَ ﴾"
                fontSize="15px"
                className="font-normal text-center justify-center leading-loose"
                theme={theme}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Reciters List / Catalog SubTab */}
      {activeSubTab === "reciters" && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Reciter Search & Filters Header */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            theme === "emerald-velvet"
              ? "bg-[#011a12] border-[#c5a85c]/30 text-[#FAF8F5]"
              : theme === "navy-velvet"
                ? "bg-white border-slate-200 text-slate-800"
                : theme === "gold-velvet"
                  ? "bg-white border-[#c5a85c]/30 text-slate-900"
                  : isDark ? "bg-[#091512] border-emerald-500/30 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs sm:text-sm font-black flex items-center gap-2">
                  <Mic size={16} className={theme === "emerald-velvet" || theme === "gold-velvet" ? "text-[#c5a85c]" : isDark ? "text-emerald-400" : "text-emerald-500"} />
                  <span>دليل القرّاء والمصاحف المرتلة</span>
                </h3>
              </div>

              {/* Search Bar */}
              <div className={`relative w-full sm:w-64 rounded-xl border flex items-center px-3 py-1.5 ${
                theme === "emerald-velvet"
                  ? "bg-[#012519] border-[#c5a85c]/40 text-[#FAF8F5]"
                  : isDark ? "bg-[#060f0d] border-emerald-500/40 text-slate-100" : "bg-white border-slate-300 text-slate-900"
              }`}>
                <Search size={14} className={isDark ? "text-emerald-400/70 shrink-0 ml-2" : "text-[#c5a85c]/70 shrink-0 ml-2"} />
                <input
                  type="text"
                  value={reciterSearch}
                  onChange={(e) => setReciterSearch(e.target.value)}
                  placeholder="ابحث عن اسم القارئ أو الرواية..."
                  className={`w-full bg-transparent text-xs font-bold outline-none text-right ${isDark ? "placeholder-emerald-400/40 text-slate-100" : "placeholder-[#c5a85c]/50 text-slate-900"}`}
                />
                {reciterSearch && (
                  <button type="button" onClick={() => setReciterSearch("")} className="text-red-500 dark:text-red-400 hover:text-red-600 p-0.5" title="مسح">
                    <X size={13} className="text-red-500 dark:text-red-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-1">
              {[
                { id: "all", label: "جميع القرّاء" },
                { id: "haramain", label: "أئمة الحرمين" },
                { id: "masters", label: "كبار القرّاء" },
                { id: "mujawwad", label: "المصحف المجود" },
                { id: "teacher", label: "المصحف المعلم" },
                { id: "other_riwayat", label: "روايات أخرى (ورش)" },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const count = cat.id === "all"
                  ? recitersList.length
                  : cat.id === "other_riwayat"
                    ? recitersList.filter(r => r.categories?.includes("other_riwayat") || (r.riwayah && !r.riwayah.includes("حفص"))).length
                    : recitersList.filter(r => r.categories?.includes(cat.id as any)).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as ReciterCategory)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? theme === "navy-velvet"
                          ? "bg-[#3F63C6] border-[#3F63C6] text-white shadow-sm"
                          : theme === "gold-velvet" || theme === "emerald-velvet"
                            ? "bg-[#c5a85c] border-[#c5a85c] text-[#011a12] shadow-sm font-black"
                            : isDark
                              ? "bg-emerald-500 border-emerald-500 text-[#011a12] shadow-sm font-black"
                              : "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                        : theme === "emerald-velvet"
                          ? "bg-[#012519] border-[#c5a85c]/25 text-[#FAF8F5]/80 hover:bg-[#c5a85c]/10"
                          : isDark
                            ? "bg-[#091512] border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-amiri font-bold ${
                      isSelected
                        ? "bg-black/20 text-white"
                        : isDark
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-slate-100 text-slate-500"
                    }`}>
                      {toArabicNumerals(count)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reciters Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {categorizedReciters.length === 0 ? (
              <div className={`col-span-full p-8 text-center rounded-2xl border ${
                theme === "emerald-velvet"
                  ? "bg-[#011a12] border-[#c5a85c]/20 text-[#FAF8F5]/70"
                  : isDark
                    ? "bg-[#091512] border-emerald-500/25 text-slate-300"
                    : "bg-slate-50 border-slate-200 text-slate-500"
              }`}>
                <p className="text-xs font-bold">لا يوجد قرّاء يطابقون خيارات البحث المحددة</p>
                <button
                  type="button"
                  onClick={() => { setReciterSearch(""); setSelectedCategory("all"); }}
                  className={`mt-2 text-xs font-bold underline cursor-pointer ${isDark ? "text-emerald-400" : "text-[#c5a85c]"}`}
                >
                  إعادة ضبط البحث وعرض جميع القراء
                </button>
              </div>
            ) : (
              categorizedReciters.map((r) => {
                const isCurrent = settings.reciterId === r.id;
                const isPlayingThisReciter = isCurrent && playback?.isPlaying;

                return (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between gap-3 ${
                      isCurrent
                        ? theme === "emerald-velvet"
                          ? "bg-[#012519] border-[#c5a85c] ring-2 ring-[#c5a85c]/30 shadow-md text-[#FAF8F5]"
                          : theme === "navy-velvet"
                            ? "bg-[#3F63C6]/10 border-[#3F63C6] ring-2 ring-[#3F63C6]/20 shadow-md text-slate-900"
                            : theme === "gold-velvet"
                              ? "bg-[#c5a85c]/10 border-[#c5a85c] ring-2 ring-[#c5a85c]/30 shadow-md text-[#011c14]"
                              : isDark
                                ? "bg-[#0d221d] border-emerald-500 ring-2 ring-emerald-500/30 shadow-md text-slate-100"
                                : "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md text-slate-900"
                        : theme === "emerald-velvet"
                          ? "bg-[#011a12] border-[#c5a85c]/20 hover:border-[#c5a85c]/50 text-[#FAF8F5]"
                          : theme === "navy-velvet"
                            ? "bg-white border-slate-200 hover:border-[#3F63C6]/40 text-slate-800"
                            : theme === "gold-velvet"
                              ? "bg-white border-[#c5a85c]/20 hover:border-[#c5a85c]/50 text-slate-900"
                              : isDark 
                                ? "bg-[#091512] border-emerald-500/20 hover:border-emerald-500/50 text-slate-100" 
                                : "bg-white border-slate-200 hover:border-emerald-300 text-slate-800 shadow-xs"
                    }`}
                  >
                    {/* Top row: Avatar & Info */}
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        isCurrent
                          ? (theme === "emerald-velvet" || theme === "gold-velvet")
                            ? "bg-[#c5a85c] text-[#011a12]"
                            : isDark
                              ? "bg-emerald-500 text-[#011a12]"
                              : theme === "navy-velvet" ? "bg-[#3F63C6] text-white" : "bg-emerald-600 text-white"
                          : theme === "emerald-velvet"
                            ? "bg-[#012519] text-[#c5a85c] border border-[#c5a85c]/30"
                            : isDark ? "bg-[#060f0d] text-emerald-400 border border-emerald-500/30" : "bg-slate-100 text-slate-700"
                      }`}>
                        {isPlayingThisReciter ? (
                          <div className="flex items-end gap-0.5 h-4">
                            <span className="w-1 bg-current animate-pulse h-3 rounded-full" />
                            <span className="w-1 bg-current animate-bounce h-4 rounded-full" />
                            <span className="w-1 bg-current animate-pulse h-2 rounded-full" />
                          </div>
                        ) : (
                          <Mic size={18} />
                        )}
                      </div>

                      {/* Reciter Details */}
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className={`text-xs sm:text-sm font-black truncate transition-colors ${
                              theme === "emerald-velvet"
                                ? "text-[#FAF8F5]"
                                : isDark
                                  ? "text-slate-100"
                                  : "text-black"
                            }`}>
                              {r.nameAr}
                            </h4>
                            {isCurrent && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0 ${
                                theme === "emerald-velvet" || theme === "gold-velvet"
                                  ? "bg-[#c5a85c] text-[#011a12]"
                                  : isDark
                                    ? "bg-emerald-500 text-[#011a12]"
                                    : theme === "navy-velvet" ? "bg-[#3F63C6] text-white" : "bg-emerald-600 text-white"
                              }`}>
                                <Check size={10} className="stroke-[3]" />
                                <span>المختار</span>
                              </span>
                            )}
                          </div>

                          {/* Merged Riwayah & Bitrate Badge on the left */}
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${
                            theme === "emerald-velvet"
                              ? "bg-[#0e0c08] text-[#c5a85c] border-[#c5a85c]/30"
                              : isDark
                                ? "bg-[#060f0d] text-emerald-300 border-emerald-500/30"
                                : "bg-black/5 border-black/10 text-slate-600"
                          }`}>
                            <span>{r.riwayah || "حفص عن عاصم"}</span>
                            <span className="opacity-40">•</span>
                            <span className="font-sans font-semibold">{r.bitrate || "128 kbps"}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/40 dark:border-emerald-500/20">
                      {/* Select button */}
                      <button
                        type="button"
                        onClick={() => handleSelectReciter(r, false)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                          isCurrent
                            ? theme === "emerald-velvet"
                              ? "bg-[#c5a85c]/20 border-[#c5a85c]/60 text-[#f5d77f]"
                              : isDark
                                ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-black"
                                : "bg-emerald-500/10 border-emerald-500/40 text-emerald-700"
                            : theme === "emerald-velvet"
                              ? "bg-[#012519] border-[#c5a85c]/30 text-[#FAF8F5]/90 hover:bg-[#c5a85c]/10"
                              : isDark
                                ? "bg-[#060f0d] border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/15"
                                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {isCurrent ? <Check size={13} /> : <BookOpen size={13} />}
                        <span>{isCurrent ? "تم الاختيار" : "تعيين"}</span>
                      </button>

                      {/* Direct Listen / Play button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlayingThisReciter) {
                            playback?.handleTogglePlay();
                          } else {
                            handleSelectReciter(r, true);
                          }
                        }}
                        className={`py-1.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
                          isPlayingThisReciter
                            ? "bg-amber-600 text-white hover:bg-amber-700"
                            : theme === "emerald-velvet"
                              ? "bg-[#c5a85c] text-[#011a12] hover:bg-[#c5a85c]/90"
                              : theme === "navy-velvet"
                                ? "bg-[#3F63C6] text-white hover:bg-[#3F63C6]/90"
                                : theme === "gold-velvet"
                                  ? "bg-[#c5a85c] text-[#011c14] hover:bg-[#d4b96f] font-black"
                                  : isDark
                                    ? "bg-emerald-500 text-[#011c14] hover:bg-emerald-400 font-black"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                        title={isPlayingThisReciter ? "إيقاف التلاوة" : "بدء الاستماع"}
                        aria-label={isPlayingThisReciter ? "إيقاف التلاوة" : "بدء الاستماع"}
                      >
                        {isPlayingThisReciter ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} fill="currentColor" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. Downloads SubTab */}
      {activeSubTab === "downloads" && (
        <div className="space-y-4 animate-fade-in">
          <div className={`p-4 rounded-2xl border space-y-4 ${
            theme === "emerald-velvet"
              ? "bg-[#011a12] border-[#c5a85c]/25 text-[#FAF8F5]"
              : theme === "navy-velvet"
                ? "bg-white border-slate-200 text-slate-800"
                : theme === "gold-velvet"
                  ? "bg-white border-[#c5a85c]/25 text-[#011c14]"
                  : isDark ? "bg-[#091512] border-emerald-500/25 text-slate-100" : "bg-slate-50 border-slate-100 text-slate-855"
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-black flex items-center gap-2">
                <Download size={15} className={isDark ? "text-emerald-400" : ""} />
                تحميل
              </h3>
            </div>

            {/* Quick Reciter Selection Window directly inside download page */}
            <div className={`p-3.5 rounded-xl border ${
              theme === "emerald-velvet"
                ? "bg-[#012519]/80 border-[#c5a85c]/30"
                : theme === "navy-velvet"
                  ? "bg-slate-50 border-slate-200"
                  : theme === "gold-velvet"
                    ? "bg-[#FAF8F5] border-[#c5a85c]/30"
                    : isDark
                      ? "bg-[#060f0d] border-emerald-500/30"
                      : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className={`text-xs font-black flex items-center gap-1.5 ${
                  theme === "emerald-velvet" || theme === "gold-velvet"
                    ? "text-[#f5d77f]"
                    : isDark
                      ? "text-emerald-300"
                      : theme === "navy-velvet"
                        ? "text-[#3F63C6]"
                        : "text-emerald-700"
                }`}>
                  <Mic size={14} />
                  <span>تحديد القارئ للتحميل:</span>
                </label>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    theme === "emerald-velvet"
                      ? "bg-[#c5a85c]/15 text-[#f5d77f] border-[#c5a85c]/30"
                      : isDark
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : theme === "gold-velvet"
                          ? "bg-[#b48c36]/15 text-[#b48c36] border-[#b48c36]/30"
                          : theme === "navy-velvet"
                            ? "bg-[#3F63C6]/10 text-[#3F63C6] border-[#3F63C6]/20"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  }`}>
                    {currentReciter.riwayah || "حفص عن عاصم"} • {currentReciter.quality || "HQ"}
                  </span>
                </div>
              </div>

              <CustomDropdown
                value={settings.reciterId}
                onChange={(val) => onChangeSettings({ reciterId: String(val) })}
                options={reciterOptions}
                isDark={isDark}
                theme={theme}
                searchable={true}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer select-none transition-all ${
                downloadType === "ayah" 
                  ? theme === "emerald-velvet"
                    ? "bg-[#c5a85c]/15 border-[#c5a85c]/60 text-[#f5d77f]"
                    : isDark
                      ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                      : "bg-emerald-500/10 border-emerald-500/50 text-emerald-700" 
                  : theme === "emerald-velvet"
                    ? "bg-[#012519] border-[#c5a85c]/15 text-[#FAF8F5]/80"
                    : isDark
                      ? "bg-[#060f0d] border-emerald-500/25 text-slate-300 hover:border-emerald-500/40"
                      : "bg-white border-slate-200 text-slate-600"
              }`} onClick={() => setDownloadType("ayah")}>
                <span className="text-xs font-black">تحميل آية</span>
              </label>

              <label className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer select-none transition-all ${
                downloadType === "surah" 
                  ? theme === "emerald-velvet"
                    ? "bg-[#c5a85c]/15 border-[#c5a85c]/60 text-[#f5d77f]"
                    : isDark
                      ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                      : "bg-emerald-500/10 border-emerald-500/50 text-emerald-700" 
                  : theme === "emerald-velvet"
                    ? "bg-[#012519] border-[#c5a85c]/15 text-[#FAF8F5]/80"
                    : isDark
                      ? "bg-[#060f0d] border-emerald-500/25 text-slate-300 hover:border-emerald-500/40"
                      : "bg-white border-slate-200 text-slate-600"
              }`} onClick={() => setDownloadType("surah")}>
                <span className="text-xs font-black">تحميل سورة</span>
              </label>

              <label className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer select-none transition-all ${
                downloadType === "quran" 
                  ? theme === "emerald-velvet"
                    ? "bg-[#c5a85c]/15 border-[#c5a85c]/60 text-[#f5d77f]"
                    : isDark
                      ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                      : "bg-emerald-500/10 border-emerald-500/50 text-emerald-700" 
                  : theme === "emerald-velvet"
                    ? "bg-[#012519] border-[#c5a85c]/15 text-[#FAF8F5]/80"
                    : isDark
                      ? "bg-[#060f0d] border-emerald-500/25 text-slate-300 hover:border-emerald-500/40"
                      : "bg-white border-slate-200 text-slate-600"
              }`} onClick={() => setDownloadType("quran")}>
                <span className="text-xs font-black">تحميل المصحف</span>
              </label>
            </div>

            {/* Scope select tools based on choice */}
            {downloadType !== "quran" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/50 dark:border-emerald-500/20">
                <CustomDropdown
                  label="اختر السورة للتحميل:"
                  value={downloadSurahNum}
                  onChange={(val) => setDownloadSurahNum(Number(val))}
                  options={downloadSurahOptions}
                  isDark={isDark}
                  theme={theme}
                  searchable={true}
                  isSurahList={true}
                />

                {downloadType === "ayah" && (
                  <CustomDropdown
                    label="اختر الآية الكريمة:"
                    value={downloadAyahNum}
                    onChange={(val) => setDownloadAyahNum(Number(val))}
                    options={downloadAyahOptions}
                    isDark={isDark}
                    theme={theme}
                  />
                )}
              </div>
            )}

            {/* Offline Status indicator banner */}
            {downloadType === "surah" && surahOfflineInfo.isComplete && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-black">سورة {downloadSurahInfo.name} محفوظة بالكامل أوفلاين</p>
                    <p className="text-[11px] opacity-80">جميع آياتها ({downloadSurahInfo.numberOfAyahs} آية) جاهزة للاستماع بدون إنترنت بصوت {currentReciter.nameAr}.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeSurahNumber?.(downloadSurahNum);
                      playback?.handleTogglePlay?.(settings.reciterId);
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>استماع أوفلاين</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteOfflineSurah}
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition-all"
                    title="حذف من الذاكرة المحلية"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )}

            {downloadType === "surah" && !surahOfflineInfo.isComplete && surahOfflineInfo.cachedCount > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-amber-800 dark:text-amber-300 text-xs">
                <span>محفوظة جزئياً: {surahOfflineInfo.cachedCount} من {downloadSurahInfo.numberOfAyahs} آية ({surahOfflineInfo.percent}%)</span>
                <span className="text-[11px] opacity-75">اضغط زر التحميل أدناه لاكتمال حفظ السورة</span>
              </div>
            )}

            {downloadType === "ayah" && isAyahDownloaded && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold">الآية رقم {downloadAyahNum} من سورة {downloadSurahInfo.name} محفوظة أوفلاين</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onChangeSurahNumber?.(downloadSurahNum);
                    playback?.setStartAyahNum?.(downloadAyahNum);
                    playback?.setEndAyahNum?.(downloadAyahNum);
                    playback?.setRecitationMode?.("range");
                    playback?.handleTogglePlay?.(settings.reciterId);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow cursor-pointer transition-all active:scale-95"
                >
                  <Play size={12} fill="currentColor" />
                  <span>استماع للآية</span>
                </button>
              </div>
            )}

            {/* Downloader Action Trigger Button */}
            <div className="pt-2 flex items-center justify-between gap-3">
              {isDownloading && (
                <button
                  type="button"
                  onClick={handleCancelDownload}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 cursor-pointer transition-all"
                >
                  إلغاء التنزيل
                </button>
              )}

              <div className="flex-1 flex justify-end">
                <button
                  onClick={handleStartDownload}
                  disabled={isDownloading}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow disabled:opacity-50 transition-all ${
                    theme === "emerald-velvet"
                      ? "bg-[#c5a85c] text-[#011a12] hover:bg-[#d4b96f] font-black"
                      : isDark
                        ? "bg-emerald-500 text-[#011a12] hover:bg-emerald-400 font-black"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                >
                  {isDownloading ? (
                    <>
                      <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                      <span>جاري التحميل... {downloadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>
                        {downloadType === "surah" && surahOfflineInfo.isComplete
                          ? "إعادة تنزيل وتحديث التلاوة"
                          : "بدء التنزيل والحفظ للاستماع أوفلاين"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Download Dashboard / Feedback */}
          <AnimatePresence>
            {(isDownloading || downloadSuccess || downloadError) && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className={`p-4 rounded-2xl border text-right space-y-3 ${
                  downloadError
                    ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                    : downloadSuccess 
                      ? theme === "emerald-velvet"
                        ? "bg-[#c5a85c]/10 border-[#c5a85c]/30 text-[#FAF8F5]"
                        : isDark
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-900" 
                      : theme === "emerald-velvet"
                        ? "bg-[#011a12] border-[#c5a85c]/25 text-[#FAF8F5]/80"
                        : isDark
                          ? "bg-[#091512] border-emerald-500/25 text-slate-200"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black flex items-center gap-1.5">
                    {downloadError ? (
                      <>
                        <AlertCircle size={14} className="text-red-500" />
                        <span>تعذر إكمال التحميل</span>
                      </>
                    ) : downloadSuccess ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span>اكتمل التحميل والحفظ بنجاح!</span>
                      </>
                    ) : (
                      <span>جاري حفظ ملفات التلاوة في الذاكرة المحلية...</span>
                    )}
                  </h4>
                  <span className="text-[10px] opacity-75">{downloadSpeed}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${
                      downloadError
                        ? "bg-red-500"
                        : theme === "emerald-velvet"
                          ? "bg-[#c5a85c]"
                          : "bg-emerald-500"
                    } h-full transition-all duration-150`}
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] opacity-80">
                  <span>{downloadError || downloadStage}</span>
                  <span>{downloadEta}</span>
                </div>

                {downloadSuccess && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onChangeSurahNumber?.(downloadSurahNum);
                        playback?.handleTogglePlay?.(settings.reciterId);
                      }}
                      className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>بدء الاستماع للتلاوة المحفوظة أوفلاين</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
