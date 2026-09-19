import React, { useState, useEffect, useMemo } from "react";
import { QuranSettings } from "../types";
import { 
  Settings, 
  Volume2, 
  Languages, 
  ShieldCheck, 
  Heart, 
  Zap, 
  Play, 
  Pause, 
  HelpCircle, 
  Sliders,
  Download,
  Trash2,
  CheckCircle2,
  HardDrive,
  FileText,
  BookOpen,
  Library,
  RefreshCw,
  FolderHeart,
  Sun,
  Moon,
  Palette,
  Sparkles,
  Check,
  ArrowLeftRight,
  ArrowUpDown,
  Move,
  Star,
  Share2,
  MessageSquarePlus,
  Smartphone,
  Type
} from "lucide-react";
import { translations } from "../data/translations";
import { surahsList } from "../data/surahList";
import { recitersList } from "./RecitationScreen";
import { CustomDropdown } from "./CustomDropdown";

interface SettingsScreenProps {
  settings: QuranSettings;
  onChangeSettings: (newSettings: Partial<QuranSettings>) => void;
  isDark: boolean;
  onToggleDarkMode?: () => void;
  theme?: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet";
  onChangeTheme?: (newTheme: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet") => void;
  inDrawer?: boolean;
}

const toArabicNumerals = (num: number): string => {
  return String(num).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
};

const getSpeedDescription = (speed: number, lang: "ar" | "en", t: any) => {
  if (speed <= 2) return t.speedDescriptionVerySlow;
  if (speed <= 4) return t.speedDescriptionNormal;
  if (speed <= 6) return t.speedDescriptionFast;
  if (speed <= 8) return t.speedDescriptionVeryFast;
  return t.speedDescriptionUltraFast;
};

export default function SettingsScreen({ 
  settings, 
  onChangeSettings, 
  isDark, 
  onToggleDarkMode,
  theme = "light", 
  onChangeTheme,
  inDrawer = false
}: SettingsScreenProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const lang = settings.language || "ar";
  const t = translations[lang];
  const isRtl = lang === "ar";

  // Saved downloaded IDs
  const [downloadedIds, setDownloadedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("quran_downloads_tebyan");
      return saved ? JSON.parse(saved) : []; // No automatic pre-downloads on first launch
    } catch {
      return [];
    }
  });

  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [downloadSpeed, setDownloadSpeed] = useState<Record<string, string>>({});
  const [activeDownloadCategory, setActiveDownloadCategory] = useState<"mushaf" | "audio" | "tafsir" | "sciences">("mushaf");

  const [deviceDownloadingId, setDeviceDownloadingId] = useState<string | null>(null);

  const [deviceDownloadProgress, setDeviceDownloadProgress] = useState<number>(0);
  const [deviceDownloadSpeed, setDeviceDownloadSpeed] = useState<string>("2.1 MB/s");

  const [deviceDownloadingSvgId, setDeviceDownloadingSvgId] = useState<string | null>(null);
  const [deviceDownloadSvgProgress, setDeviceDownloadSvgProgress] = useState<number>(0);
  const [deviceDownloadSvgSpeed, setDeviceDownloadSvgSpeed] = useState<string>("3.5 MB/s");

  // Custom audio downloader states
  const [selectedAudioReciter, setSelectedAudioReciter] = useState("Minshawy_Murattal_128kbps");
  const [audioDownloadType, setAudioDownloadType] = useState<"full" | "surah">("surah");
  const [selectedDownloadSurahNum, setSelectedDownloadSurahNum] = useState(1);
  const [isCustomAudioDownloading, setIsCustomAudioDownloading] = useState(false);
  const [customAudioProgress, setCustomAudioProgress] = useState(0);
  const [customAudioSpeed, setCustomAudioSpeed] = useState("");
  const [customAudioStage, setCustomAudioStage] = useState("");

  const reciterOptions = useMemo(() => {
    return recitersList.map((r) => ({
      value: r.id,
      label: isRtl ? r.nameAr : r.nameEn,
      sublabel: isRtl ? "تلاوة برواية حفص عن عاصم" : "Hafs Recitation",
      disabled: isCustomAudioDownloading
    }));
  }, [isRtl, isCustomAudioDownloading]);

  const surahOptions = useMemo(() => {
    return surahsList.map((surah) => {
      const sizeEst = Math.max(0.5, surah.numberOfAyahs * 0.18).toFixed(1);
      return {
        value: surah.number,
        label: `${surah.number}. ${isRtl ? surah.name : surah.englishName}`,
        sublabel: `${surah.numberOfAyahs} ${isRtl ? "آية" : "ayahs"} ~ ${sizeEst} MB`,
        disabled: isCustomAudioDownloading
      };
    });
  }, [isRtl, isCustomAudioDownloading]);

  const mushafProviderOptions = useMemo(() => {
    return [
      {
        value: "quran-svg",
        label: isRtl ? "رواية حفص - مصحف المدينة التفاعلي (رسم عثماني SVG)" : "Hafs Narration - Interactive Medina Mushaf (SVG)",
        sublabel: downloadedIds.includes("mushaf-core") ? (isRtl ? "محمل أوفلاين" : "Offline Loaded") : (isRtl ? "يتطلب اتصال بالشبكة" : "Requires network connection")
      },
      {
        value: "qcf4",
        label: isRtl ? "خط مصحف المدينة الإصدار الرابع (QCF4 - عثمان طه 1441هـ)" : "Medina Mushaf 4th Edition Font (QCF4 - Uthman Taha)",
        sublabel: isRtl ? "مستودع (MohamadHajjRabee/quran-qcf4) - عرض دقيق بالرموز والخط العثماني الإصدار الرابع" : "Repository (MohamadHajjRabee/quran-qcf4) - Precise vector font & line layout"
      }
    ];
  }, [isRtl, downloadedIds]);

  const handleStartCustomAudioDownload = () => {
    if (isCustomAudioDownloading) return;
    
    const downloadId = audioDownloadType === "full" 
      ? `audio-${selectedAudioReciter}-full`
      : `audio-${selectedAudioReciter}-surah-${selectedDownloadSurahNum}`;

    if (downloadedIds.includes(downloadId)) {
      alert(isRtl ? "هذه التلاوة محملة بالفعل أوفلاين." : "This recitation is already downloaded offline.");
      return;
    }

    setIsCustomAudioDownloading(true);
    setCustomAudioProgress(1);
    setCustomAudioStage(isRtl ? "الاتصال بخادم الصوتيات التلاوية..." : "Connecting to audio server...");

    let progress = 0;
    const stages = audioDownloadType === "full" 
      ? [
          isRtl ? "تهيئة السيرفر وفحص المساحة..." : "Initializing server & checking space...",
          isRtl ? "تجهيز تلاوة السور (1 - 30)..." : "Preparing surah audio (1 - 30)...",
          isRtl ? "تنزيل تلاوات السور (31 - 75)..." : "Downloading surah audio (31 - 75)...",
          isRtl ? "استكمال تحميل باقي السور (76 - 114)..." : "Completing download of remaining suras...",
          isRtl ? "تجميع الملف الصوتي وضغطه بصيغة MP3..." : "Assembling and compressing audio as MP3...",
          isRtl ? "تثبيت حزمة التلاوة أوفلاين بنجاح!" : "Installing recitation package offline successfully!"
        ]
      : [
          isRtl ? "الاتصال بخادم الصوتيات..." : "Connecting to audio server...",
          isRtl ? "تجهيز ملف التلاوة للسورة المختارة..." : "Preparing audio for selected Surah...",
          isRtl ? "جاري تحميل السورة بصوت القارئ..." : "Downloading Surah with reciter voice...",
          isRtl ? "كتابة بيانات الملف وحفظ التلاوة أوفلاين..." : "Writing file metadata and saving offline..."
        ];

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloadedIds(prev => {
          if (!prev.includes(downloadId)) {
            return [...prev, downloadId];
          }
          return prev;
        });
        setIsCustomAudioDownloading(false);
      }
      setCustomAudioProgress(progress);
      
      const speed = (Math.random() * 4 + 2).toFixed(1) + " MB/s";
      setCustomAudioSpeed(speed);

      const stageIdx = Math.min(
        Math.floor((progress / 100) * stages.length),
        stages.length - 1
      );
      setCustomAudioStage(stages[stageIdx]);
    }, 250);
  };

  // Save downloads list to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem("quran_downloads_tebyan", JSON.stringify(downloadedIds));
    } catch (e) {
      console.warn("Failed to save downloads:", e);
    }
  }, [downloadedIds]);

  // List of available packages (categorized by pages, recitations, tafsirs, and sciences)
  const downloadPackages = [
    { 
      id: "mushaf-core", 
      name: "صفحات المصحف الشريف عالية الدقة (صيغة SVG)", 
      nameEn: "High-Resolution Mushaf Pages (SVG)", 
      subName: "النسخة الأساسية والتفاعلية عالية الجودة لتصفح المصحف بدون إنترنت", 
      subNameEn: "Core interactive high-res pages for offline Quran browsing", 
      type: "mushaf", 
      sizeMb: 24.5 
    },
    { 
      id: "mushaf-warsh", 
      name: "صفحات مصحف رواية ورش عن نافع (صيغة SVG)", 
      nameEn: "Warsh Narration Mushaf Pages (SVG)", 
      subName: "مصحف ورش بالرسم العثماني المعتمد من مجمع الملك فهد لأهل المغرب وغرب أفريقيا", 
      subNameEn: "Warsh an Nafi' narration interactive pages in standard Uthmanic script", 
      type: "mushaf", 
      sizeMb: 28.4 
    },
    { 
      id: "mushaf-shamerly", 
      name: "صفحات مصحف الشمرلي للخط المصري القديم", 
      nameEn: "Classic Al-Shamerly Mushaf Pages (SVG)", 
      subName: "المصحف المصري القديم بخط الخطاط العريق عثمان طه عالي الدقة تفاعلي بالكامل", 
      subNameEn: "Highly requested Egyptian legacy handwriting style fully interactive", 
      type: "mushaf", 
      sizeMb: 42.0 
    },
    { 
      id: "mushaf-images", 
      name: "صفحات المصحف الشريف المصورة عالية الدقة (صيغة PNG)", 
      nameEn: "High-Resolution Mushaf Pages (PNG)", 
      subName: "النسخة التصويرية الكاملة للمصحف الشريف بدقة متناهية متوافقة مع الأجهزة الضعيفة", 
      subNameEn: "Full image-based Quran page rendering compatible with low-end devices", 
      type: "mushaf", 
      sizeMb: 55.6 
    },
    { 
      id: "mushaf-maknon", 
      name: "صفحات مصحف مكنون (رواية حفص)", 
      nameEn: "Maknon Quran Pages (Hafs Narration)", 
      subName: "مصورات صفحات مصحف حفص عن عاصم عالية الجودة من مستودع مكنون للقرآن الكريم (GitHub)", 
      subNameEn: "High-quality page renderings for Hafs narration from maknon/Quran repository", 
      type: "mushaf", 
      sizeMb: 85.0 
    },
    { 
      id: "tafsir-moyassar", 
      name: "التفسير الميسر (مرفق مع الآيات)", 
      nameEn: "Al-Moyassar Tafsir", 
      subName: "كتاب التفسير الميسر لجميع السور بأسلوب سهل وموجز", 
      subNameEn: "Easy to read interpretation package for all surahs", 
      type: "tafsir", 
      sizeMb: 8.2 
    },
    { 
      id: "tafsir-mukhtasar", 
      name: "المختصر في تفسير القرآن الكريم", 
      nameEn: "Al-Mukhtasar Tafsir", 
      subName: "تفسير مختصر وموثوق لآيات القرآن الكريم صادر عن مركز تفسير (مستودع تبيان Qur-an-Tabyan / tafsir-mcp)", 
      subNameEn: "Concise and reliable interpretation of the verses in easy language", 
      type: "tafsir", 
      sizeMb: 12.4 
    },
    { 
      id: "tafsir-sadi", 
      name: "تفسير السعدي (تيسير الكريم الرحمن)", 
      nameEn: "Tafsir Al-Sadi", 
      subName: "تفسير ميسر واضح ومعتنى فيه ببيان المعاني الإيمانية والأخلاقية بأسلوب لطيف", 
      subNameEn: "Easy to read classic interpretation with spiritual and moral focus", 
      type: "tafsir", 
      sizeMb: 15.6 
    },
    { 
      id: "tafsir-ibnkathir", 
      name: "تفسير الإمام ابن كثير الكامل", 
      nameEn: "Tafsir Ibn Kathir (Full)", 
      subName: "تفسير القرآن العظيم للإمام عماد الدين أبي الفداء إسماعيل بن كثير الدمشقي", 
      subNameEn: "The comprehensive classic interpretation package", 
      type: "tafsir", 
      sizeMb: 35.0 
    },
    { 
      id: "tafsir-tabari", 
      name: "تفسير الطبري (جامع البيان)", 
      nameEn: "Tafsir Al-Tabari", 
      subName: "موسوعة التفسير بالمأثور الكبرى للإمام محمد بن جرير الطبري", 
      subNameEn: "The grand masterwork of narration-based interpretation", 
      type: "tafsir", 
      sizeMb: 52.0 
    },
    { 
      id: "tafsir-qurtubi", 
      name: "تفسير القرطبي (الجامع لأحكام القرآن)", 
      nameEn: "Tafsir Al-Qurtubi", 
      subName: "تفسير فريد بركيزته على الأحكام الفقهية وتفاصيل لغة العرب ونحوها", 
      subNameEn: "The classic interpretation with a strong focus on legal rulings", 
      type: "tafsir", 
      sizeMb: 68.0 
    },
    { 
      id: "tafsir-baghawi", 
      name: "تفسير البغوي (معالم التنزيل)", 
      nameEn: "Tafsir Al-Baghawi", 
      subName: "تفسير معتدل ومتوازن يركز على روايات السلف الصالح والآثار الصحيحة", 
      subNameEn: "A balanced interpretation focusing on authentic narrations", 
      type: "tafsir", 
      sizeMb: 28.5 
    },
    { 
      id: "audio-alafasy-fatihah", 
      name: "سورة الفاتحة - الشيخ مشاري العفاسي", 
      nameEn: "Surah Al-Fatihah - Alafasy", 
      subName: "تلاوة مرتلة برواية حفص عن عاصم للشيخ مشاري راشد العفاسي", 
      subNameEn: "High-quality recitation for Surah Al-Fatihah", 
      type: "audio", 
      sizeMb: 1.2, 
      surahNumber: 1 
    },
    { 
      id: "audio-alafasy-kahf", 
      name: "سورة الكهف - الشيخ مشاري العفاسي", 
      nameEn: "Surah Al-Kahf - Alafasy", 
      subName: "تلاوة ندية مرتلة لسورة الكهف ليوم الجمعة المبارك", 
      subNameEn: "Friday recitation for Surah Al-Kahf", 
      type: "audio", 
      sizeMb: 18.4, 
      surahNumber: 18 
    },
    { 
      id: "audio-alafasy-yasin", 
      name: "سورة يس - الشيخ مشاري العفاسي", 
      nameEn: "Surah Yasin - Alafasy", 
      subName: "تلاوة خاشعة مرتلة لسورة يس بصوت الشيخ مشاري العفاسي", 
      subNameEn: "Contemplative recitation for Surah Yasin", 
      type: "audio", 
      sizeMb: 8.7, 
      surahNumber: 36 
    },
    { 
      id: "audio-alafasy-mulk", 
      name: "سورة الملك - الشيخ مشاري العفاسي", 
      nameEn: "Surah Al-Mulk - Alafasy", 
      subName: "تلاوة مرتلة لسورة الملك المنجية من عذاب القبر قبل النوم", 
      subNameEn: "Beautiful recitation of Surah Al-Mulk", 
      type: "audio", 
      sizeMb: 4.1, 
      surahNumber: 67 
    },
    { 
      id: "audio-shuraim-baqarah", 
      name: "سورة البقرة - الشيخ سعود الشريم", 
      nameEn: "Surah Al-Baqarah - Saud Al-Shuraim", 
      subName: "تلاوة كاملة لسورة البقرة برواية حفص من رحاب المسجد الحرام", 
      subNameEn: "Full Surah Al-Baqarah from Masjid Al-Haram", 
      type: "audio", 
      sizeMb: 48.0, 
      surahNumber: 2 
    },
    { 
      id: "audio-husary-full", 
      name: "المصحف المعلم الكامل - الشيخ محمود خليل الحصري", 
      nameEn: "Full Teacher Mushaf - Al-Husary", 
      subName: "أجزاء التلاوة المرتلة والتعليمية الدقيقة لشيخ عموم المقارئ المصرية", 
      subNameEn: "Precision educational recitation by the master", 
      type: "audio", 
      sizeMb: 110.5 
    },
    { 
      id: "sciences-asbab-nuzool", 
      name: "أسباب نزول الآيات للواحدي والنيسابوري", 
      nameEn: "Asbab Al-Nuzool (Reasons of Revelation)", 
      subName: "موسوعة كاملة لمعرفة أسباب نزول آيات الذكر الحكيم وتفاصيل تاريخ النزول أوفلاين", 
      subNameEn: "Complete offline encyclopedia of reasons behind verse revelations", 
      type: "sciences", 
      sizeMb: 14.8 
    },
    { 
      id: "sciences-vocab", 
      name: "معجم غريب القرآن ومفردات الكلمات اللغوية", 
      nameEn: "Quranic Vocabulary & Word Meanings", 
      subName: "معجم دقيق لتفسير المفردات الغامضة والكلمات الغريبة في القرآن الكريم أوفلاين", 
      subNameEn: "Precision dictionary for uncommon and difficult words in the Holy Quran", 
      type: "sciences", 
      sizeMb: 7.2 
    }
  ];

  const handleStartDownload = (id: string) => {
    if (downloadProgress[id] !== undefined || downloadedIds.includes(id)) return;

    setDownloadProgress(prev => ({ ...prev, [id]: 1 }));
    setDownloadSpeed(prev => ({ ...prev, [id]: "0.5 MB/s" }));

    // Simulate download progress steps
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        const current = prev[id] || 0;
        if (current >= 100) {
          clearInterval(interval);
          setDownloadedIds(d => [...d, id]);
          
          // Clean progress state after completion
          setTimeout(() => {
            setDownloadProgress(p => {
              const updated = { ...p };
              delete updated[id];
              return updated;
            });
            setDownloadSpeed(s => {
              const updated = { ...s };
              delete updated[id];
              return updated;
            });
          }, 500);
          return { ...prev, [id]: 100 };
        }
        
        // Random incremental step
        const step = Math.floor(Math.random() * 15) + 8;
        const next = Math.min(100, current + step);
        
        // Random speed updates
        const speed = (Math.random() * 4 + 1.5).toFixed(1) + " MB/s";
        setDownloadSpeed(s => ({ ...s, [id]: speed }));

        return { ...prev, [id]: next };
      });
    }, 250);
  };

  const handleDeleteDownload = (id: string) => {
    // Keep mushaf-core always active to avoid broken app
    if (id === "mushaf-core") {
      alert("النسخة الأساسية للمصحف ضرورية لتشغيل التطبيق ولا يمكن حذفها.");
      return;
    }
    setDownloadedIds(prev => prev.filter(item => item !== id));
  };

  const handleDownloadMushafToDevice = (id: string, name: string) => {
    if (deviceDownloadingId) return;

    // Define PDF mapping based on the package ID
    const pdfUrls: Record<string, string> = {
      "mushaf-core": "https://archive.org/download/mushaf-al-madinah-new/mushaf-al-madinah-new.pdf",
    };

    const targetUrl = pdfUrls[id] || pdfUrls["mushaf-core"];

    setDeviceDownloadingId(id);
    setDeviceDownloadProgress(0);
    setDeviceDownloadSpeed("2.8 MB/s");

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 12) + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        // Trigger actual download of the PDF file on the user's device!
        const link = document.createElement("a");
        link.href = targetUrl;
        link.download = `${id}.pdf`;
        link.target = "_blank";
        link.referrerPolicy = "no-referrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          setDeviceDownloadingId(null);
          setDeviceDownloadProgress(0);
        }, 800);
      }
      setDeviceDownloadProgress(currentProgress);
      setDeviceDownloadSpeed((Math.random() * 3 + 1.8).toFixed(1) + " MB/s");
    }, 150);
  };

  const handleDownloadMushafSvgPages = (id: string) => {
    if (deviceDownloadingSvgId) return;

    const svgZipUrls: Record<string, string> = {
      "mushaf-core": "https://github.com/susalm/quran-svg-main/archive/refs/heads/main.zip",
      "mushaf-tajweed": "https://github.com/susalm/quran-tajweed-svg/archive/refs/heads/main.zip",
    };

    const targetUrl = svgZipUrls[id] || svgZipUrls["mushaf-core"];

    setDeviceDownloadingSvgId(id);
    setDeviceDownloadSvgProgress(0);
    setDeviceDownloadSvgSpeed("3.5 MB/s");

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 10) + 4;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        // Trigger actual download of the SVG Zip file on the user's device!
        const link = document.createElement("a");
        link.href = targetUrl;
        link.download = `${id}-svg.zip`;
        link.target = "_blank";
        link.referrerPolicy = "no-referrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          setDeviceDownloadingSvgId(null);
          setDeviceDownloadSvgProgress(0);
        }, 800);
      }
      setDeviceDownloadSvgProgress(currentProgress);
      setDeviceDownloadSvgSpeed((Math.random() * 4 + 2.5).toFixed(1) + " MB/s");
    }, 150);
  };

  // Compute stats
  const totalDownloadedSize = (() => {
    const staticSize = downloadPackages
      .filter(p => downloadedIds.includes(p.id))
      .reduce((sum, p) => sum + p.sizeMb, 0);

    const customSize = downloadedIds
      .filter(id => id.startsWith("audio-") && !downloadPackages.some(p => p.id === id))
      .reduce((sum, id) => {
        const parts = id.split("-");
        const type = parts[2];
        if (type === "full") return sum + 480;
        const surahNum = Number(parts[3]) || 1;
        const surah = surahsList.find(s => s.number === surahNum);
        const sizeEst = Math.max(0.5, (surah?.numberOfAyahs || 15) * 0.18);
        return sum + sizeEst;
      }, 0);

    return staticSize + customSize;
  })();

  const availableSpace = Math.max(10, 500 - totalDownloadedSize);
  const spacePercentage = (totalDownloadedSize / 500) * 100;

  useEffect(() => {
    let isMounted = true;
    const defaultProject = [
      {
        id: "quran-mushaf",
        name: "المصحف الإلكتروني",
        description: "مصحف رقمي تفاعلي بمصادر التفسير والتدبر الأصيلة وتلاوة القرآن الكريم من أمهات الكتب المعتمدة.",
        version: "1.0.0",
        features: ["mushaf-svg", "audio-recitation", "tafsir-library", "ai-chat-companion", "khatmah-tracker"]
      }
    ];

    const apiUrl = typeof window !== "undefined" && window.location?.origin && window.location.origin !== "null"
      ? `${window.location.origin}/api/v1/projects`
      : "/api/v1/projects";

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data && data.projects) {
          setProjects(data.projects);
        } else if (isMounted) {
          setProjects(defaultProject);
        }
        if (isMounted) setLoadingProjects(false);
      })
      .catch((err) => {
        if (isMounted) {
          setProjects(defaultProject);
          setLoadingProjects(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);



  const reciters = [
    { id: "Alafasy_128kbps", nameAr: "القارئ مشاري العفاسي", nameEn: "Mishary Alafasy" },
    { id: "Ghamadi_64kbps", nameAr: "القارئ سعد الغامدي", nameEn: "Saad Al-Ghamdi" },
    { id: "Husary_Muallim_128kbps", nameAr: "محمود خليل الحصري (المعلم)", nameEn: "Mahmoud Al-Husary (Teacher)" },
    { id: "Husary_64kbps", nameAr: "محمود خليل الحصري (مرتل)", nameEn: "Mahmoud Al-Husary" }
  ];

  return (
    <div 
      dir={isRtl ? "rtl" : "ltr"}
      className={`w-full ${isRtl ? "text-right" : "text-left"} ${
        inDrawer ? "p-0 pb-6" : "min-h-screen p-4 sm:p-6 pb-24"
      } ${
        theme === "navy-velvet"
          ? "text-slate-900"
          : theme === "gold-velvet"
            ? "text-slate-800"
            : isDark
              ? "text-slate-100"
              : "text-slate-800"
      } ${
        theme === "emerald-velvet"
          ? "bg-[#012519]"
          : theme === "gold-velvet"
            ? "bg-[#FAF8F5]"
            : theme === "navy-velvet"
              ? "bg-white"
              : isDark
                ? "bg-slate-950"
                : "bg-slate-50"
      }`}
    >
      <div id="settings-boxes-wrapper" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        
        {/* Language Selector Card */}
        <div className={`p-5 rounded-3xl space-y-4 border ${
          theme === "emerald-velvet" ? "bg-[#011a12] border-[#c5a85c]/30 text-[#FAF8F5] shadow-none" :
          theme === "navy-velvet" ? "bg-white border-slate-200 text-slate-850 shadow-sm" :
          theme === "gold-velvet" ? "bg-white border-[#c5a85c]/30 text-slate-800 shadow-sm" :
          isDark ? "bg-slate-900 border-slate-850 shadow-none text-slate-100" : "bg-white border-slate-100 shadow-sm text-slate-800"
        }`}>
          <h3 className={`text-xs font-bold flex items-center gap-2.5 border-b pb-2 ${
            theme === "emerald-velvet" ? "text-[#c5a85c] border-[#c5a85c]/20" :
            theme === "navy-velvet" ? "text-[#3F63C6] border-slate-200" :
            theme === "gold-velvet" ? "text-[#011c14] border-[#c5a85c]/20" :
            isDark ? "text-emerald-400 border-slate-800" : "text-[#065f46] border-slate-50"
          }`}>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              theme === "emerald-velvet" ? "bg-[#c5a85c]/15 text-[#c5a85c]" :
              theme === "navy-velvet" ? "bg-[#3F63C6]/15 text-[#3F63C6]" :
              theme === "gold-velvet" ? "bg-[#c5a85c]/20 text-[#011c14]" :
              isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100/80 text-[#065f46]"
            }`}>
              <Languages size={15} />
            </div>
            <span>{t.appLanguageTitle}</span>
          </h3>

          <div className="grid grid-cols-2 gap-2.5 text-center text-[11px] font-bold">
            <button
              onClick={() => onChangeSettings({ language: "ar" })}
              className={`p-3.5 border rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                lang === "ar"
                  ? (theme === "navy-velvet" ? "bg-[#3F63C6]/15 text-[#3F63C6] border-[#3F63C6] shadow-inner" : theme === "gold-velvet" ? "bg-[#c5a85c]/25 text-[#011c14] border-[#c5a85c] shadow-inner" : theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011a12] border-[#c5a85c] shadow-inner font-extrabold" : "bg-emerald-50 text-emerald-950 border-emerald-500 shadow-inner")
                  : theme === "emerald-velvet"
                    ? "bg-[#011a12] text-[#FAF8F5]/60 border-[#c5a85c]/30 hover:bg-[#012519] hover:text-[#FAF8F5]"
                    : isDark 
                      ? "bg-slate-950/40 text-slate-300 border-slate-850 hover:bg-slate-850" 
                      : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
              }`}
            >
              <span>العربية</span>
            </button>

            <button
              onClick={() => onChangeSettings({ language: "en" })}
              className={`p-3.5 border rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                lang === "en"
                  ? (theme === "navy-velvet" ? "bg-[#3F63C6]/15 text-[#3F63C6] border-[#3F63C6] shadow-inner" : theme === "gold-velvet" ? "bg-[#c5a85c]/25 text-[#011c14] border-[#c5a85c] shadow-inner" : theme === "emerald-velvet" ? "bg-[#c5a85c] text-[#011a12] border-[#c5a85c] shadow-inner font-extrabold" : "bg-emerald-50 text-emerald-950 border-emerald-500 shadow-inner")
                  : theme === "emerald-velvet"
                    ? "bg-[#011a12] text-[#FAF8F5]/60 border-[#c5a85c]/30 hover:bg-[#012519] hover:text-[#FAF8F5]"
                    : isDark 
                      ? "bg-slate-950/40 text-slate-300 border-slate-850 hover:bg-slate-850" 
                      : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
              }`}
            >
              <span>English</span>
            </button>
          </div>
        </div>

        {/* Night Mode Toggle Card */}
        <div className={`p-4 rounded-3xl space-y-3 border transition-all duration-300 ${
          theme === "emerald-velvet" ? "bg-[#011a12] border-[#c5a85c]/30 text-[#FAF8F5] shadow-none" :
          theme === "navy-velvet" ? "bg-white border-slate-200 text-slate-850 shadow-sm" :
          theme === "gold-velvet" ? "bg-white border-[#c5a85c]/30 text-slate-800 shadow-sm" :
          isDark ? "bg-slate-900 border-slate-850 shadow-none text-slate-100" : "bg-white border-slate-100 shadow-sm text-slate-800"
        }`}>
          {/* Header with Switch */}
          <div className="flex items-center justify-between gap-4">
            <h3 className={`text-xs font-bold flex items-center gap-2.5 ${
              theme === "emerald-velvet" ? "text-[#c5a85c]" :
              theme === "navy-velvet" ? "text-[#3F63C6]" :
              theme === "gold-velvet" ? "text-[#011c14]" :
              isDark ? "text-emerald-400" : "text-[#065f46]"
            }`}>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                theme === "emerald-velvet" ? "bg-[#c5a85c]/15 text-[#c5a85c]" :
                theme === "navy-velvet" ? "bg-[#3F63C6]/15 text-[#3F63C6]" :
                theme === "gold-velvet" ? "bg-[#c5a85c]/20 text-[#011c14]" :
                isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100/80 text-[#065f46]"
              }`}>
                {isDark ? <Moon size={15} /> : <Sun size={15} />}
              </div>
              <div className="flex flex-col">
                <span>{isRtl ? "المظهر الليلي" : "Night Appearance"}</span>
                <span className="text-[10px] font-normal opacity-70">
                  {isDark ? (isRtl ? "الوضع الليلي مفعّل" : "Night mode enabled") : (isRtl ? "الوضع النهاري مفعّل" : "Day mode enabled")}
                </span>
              </div>
            </h3>

            {onToggleDarkMode && (
              <button
                id="settings-darkmode-toggle"
                onClick={onToggleDarkMode}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 focus:outline-none cursor-pointer flex items-center shrink-0 ${
                  isDark 
                    ? (theme === "emerald-velvet" ? "bg-[#c5a85c] justify-end" : theme === "navy-velvet" ? "bg-[#3F63C6] justify-end" : theme === "gold-velvet" ? "bg-[#011c14] justify-end" : "bg-emerald-500 justify-end") 
                    : "bg-slate-300 dark:bg-slate-700 justify-start"
                }`}
                title={isDark ? (isRtl ? "إيقاف الوضع الليلي" : "Disable Night Mode") : (isRtl ? "تفعيل الوضع الليلي" : "Enable Night Mode")}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            )}
          </div>
        </div>

        {/* Day Theme Selector */}
        {onChangeTheme && (
          <div className={`p-4 rounded-3xl space-y-3 border ${
            theme === "navy-velvet" ? "bg-white border-slate-200 text-slate-850 shadow-sm" :
            theme === "gold-velvet" ? "bg-white border-[#c5a85c]/30 text-slate-800 shadow-sm" :
            isDark ? "bg-slate-900 border-slate-850 shadow-none text-slate-100" : "bg-white border-slate-100 shadow-sm text-slate-800"
          }`}>
            <h3 className={`text-xs font-bold flex items-center gap-2 border-b pb-2 ${
              theme === "navy-velvet" ? "text-[#3F63C6] border-slate-200" :
              theme === "gold-velvet" ? "text-[#011c14] border-[#c5a85c]/20" :
              isDark ? "text-emerald-400 border-slate-800" : "text-[#065f46] border-slate-50"
            }`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                theme === "navy-velvet" ? "bg-[#3F63C6]/15 text-[#3F63C6]" :
                theme === "gold-velvet" ? "bg-[#c5a85c]/20 text-[#011c14]" :
                isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100/80 text-[#065f46]"
              }`}>
                <Palette size={14} />
              </div>
              <span>{isRtl ? "المظهر النهاري" : "Day Theme"}</span>
            </h3>

            <div className="flex items-center justify-center gap-3 pt-1">
              {/* Option 1: Classic Theme */}
              <button
                onClick={() => onChangeTheme?.("light")}
                title={isRtl ? "أخضر كلاسيكي" : "Classic Green"}
                className={`py-3 px-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center border-2 text-xs font-black ${
                  theme === "light"
                    ? "bg-emerald-500/15 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500/30 scale-105 shadow-sm"
                    : "bg-emerald-50/50 text-slate-600 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-50"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500 border border-emerald-600/50 shadow-xs inline-block" />
              </button>

              {/* Option 2: Gold Velvet Theme */}
              <button
                onClick={() => onChangeTheme?.("gold-velvet")}
                title={isRtl ? "ذهبي فاخر" : "Gold Velvet"}
                className={`py-3 px-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center border-2 text-xs font-black ${
                  theme === "gold-velvet"
                    ? "bg-[#c5a85c]/25 text-[#011c14] border-[#9d7d2d] ring-2 ring-[#9d7d2d]/30 scale-105 shadow-sm"
                    : "bg-[#c5a85c]/10 text-slate-700 border-[#9d7d2d]/25 hover:border-[#9d7d2d]/60 hover:bg-[#c5a85c]/20"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-[#c5a85c] border border-[#9d7d2d]/60 shadow-xs inline-block" />
              </button>

              {/* Option 3: Navy Velvet Theme */}
              <button
                onClick={() => onChangeTheme?.("navy-velvet")}
                title={isRtl ? "كحلي فاخر" : "Navy Velvet"}
                className={`py-3 px-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center border-2 text-xs font-black ${
                  theme === "navy-velvet"
                    ? "bg-[#1b3168] text-white border-[#3F63C6] ring-2 ring-[#3F63C6]/40 scale-105 shadow-sm"
                    : "bg-[#1b3168] text-white border-[#3F63C6]/30 hover:bg-[#1b3168]/90 hover:border-[#3F63C6]/60"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white border border-[#3F63C6] shadow-xs inline-block" />
              </button>
            </div>
          </div>
        )}


        {/* Page Navigation Mode (تقليب الصفحات - أزرار بأيقونات دون عبارات) */}
        <div className={`p-4 rounded-3xl space-y-3 border ${
          theme === "emerald-velvet" ? "bg-[#011a12] border-[#c5a85c]/30 text-[#FAF8F5] shadow-none" :
          theme === "navy-velvet" ? "bg-white border-slate-200 text-slate-850 shadow-sm" :
          theme === "gold-velvet" ? "bg-white border-[#c5a85c]/30 text-slate-800 shadow-sm" :
          isDark ? "bg-slate-900 border-slate-850 shadow-none text-slate-100" : "bg-white border-slate-100 shadow-sm text-slate-800"
        }`}>
          <h3 className={`text-xs font-bold flex items-center gap-2 border-b pb-2 ${
            theme === "emerald-velvet" ? "text-[#c5a85c] border-[#c5a85c]/20" :
            theme === "navy-velvet" ? "text-[#3F63C6] border-slate-200" :
            theme === "gold-velvet" ? "text-[#011c14] border-[#c5a85c]/20" :
            isDark ? "text-emerald-400 border-slate-800" : "text-[#065f46] border-slate-50"
          }`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              theme === "emerald-velvet" ? "bg-[#c5a85c]/15 text-[#c5a85c]" :
              theme === "navy-velvet" ? "bg-[#3F63C6]/15 text-[#3F63C6]" :
              theme === "gold-velvet" ? "bg-[#c5a85c]/20 text-[#011c14]" :
              isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100/80 text-[#065f46]"
            }`}>
              <Move size={14} />
            </div>
            <span>{isRtl ? "تقليب الصفحات" : "Page Navigation"}</span>
          </h3>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Option 1: Horizontal Navigation (Left & Right / يميناً ويساراً) - Icon only without phrase */}
            <button
              id="settings-portrait-nav-horizontal"
              onClick={() => onChangeSettings({ scrollDirection: "horizontal" })}
              title={isRtl ? "يميناً ويساراً" : "Left & Right"}
              aria-label={isRtl ? "يميناً ويساراً" : "Left & Right"}
              className={`py-3.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center border-2 ${
                (settings.scrollDirection || "horizontal") === "horizontal"
                  ? (theme === "navy-velvet"
                      ? "bg-[#3F63C6]/15 text-[#3F63C6] border-[#3F63C6] ring-2 ring-[#3F63C6]/30 shadow-sm"
                      : theme === "gold-velvet"
                        ? "bg-[#c5a85c]/25 text-[#011c14] border-[#9d7d2d] ring-2 ring-[#9d7d2d]/30 shadow-sm"
                        : theme === "emerald-velvet"
                          ? "bg-[#c5a85c] text-[#011a12] border-[#c5a85c] ring-2 ring-[#c5a85c]/40 shadow-sm font-bold"
                          : isDark
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm"
                            : "bg-emerald-500/15 text-emerald-800 border-emerald-600 ring-2 ring-emerald-500/30 shadow-sm")
                  : (theme === "emerald-velvet"
                      ? "bg-[#011a12] text-[#FAF8F5]/60 border-[#c5a85c]/30 hover:bg-[#012519] hover:text-[#FAF8F5]"
                      : theme === "navy-velvet"
                        ? "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                        : theme === "gold-velvet"
                          ? "bg-[#FAF2DF]/50 text-slate-600 border-[#c5a85c]/25 hover:border-[#c5a85c]/50 hover:bg-[#FAF2DF]"
                          : isDark
                            ? "bg-slate-800/50 text-slate-400 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-100")
              }`}
            >
              <ArrowLeftRight size={22} className="stroke-[2.5px]" />
            </button>

            {/* Option 2: Vertical Navigation (Up & Down / لأعلى وأسفل) - Icon only without phrase */}
            <button
              id="settings-portrait-nav-vertical"
              onClick={() => onChangeSettings({ scrollDirection: "vertical" })}
              title={isRtl ? "لأعلى وأسفل" : "Up & Down"}
              aria-label={isRtl ? "لأعلى وأسفل" : "Up & Down"}
              className={`py-3.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center border-2 ${
                settings.scrollDirection === "vertical"
                  ? (theme === "navy-velvet"
                      ? "bg-[#3F63C6]/15 text-[#3F63C6] border-[#3F63C6] ring-2 ring-[#3F63C6]/30 shadow-sm"
                      : theme === "gold-velvet"
                        ? "bg-[#c5a85c]/25 text-[#011c14] border-[#9d7d2d] ring-2 ring-[#9d7d2d]/30 shadow-sm"
                        : theme === "emerald-velvet"
                          ? "bg-[#c5a85c] text-[#011a12] border-[#c5a85c] ring-2 ring-[#c5a85c]/40 shadow-sm font-bold"
                          : isDark
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm"
                            : "bg-emerald-500/15 text-emerald-800 border-emerald-600 ring-2 ring-emerald-500/30 shadow-sm")
                  : (theme === "emerald-velvet"
                      ? "bg-[#011a12] text-[#FAF8F5]/60 border-[#c5a85c]/30 hover:bg-[#012519] hover:text-[#FAF8F5]"
                      : theme === "navy-velvet"
                        ? "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                        : theme === "gold-velvet"
                          ? "bg-[#FAF2DF]/50 text-slate-600 border-[#c5a85c]/25 hover:border-[#c5a85c]/50 hover:bg-[#FAF2DF]"
                          : isDark
                            ? "bg-slate-800/50 text-slate-400 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-100")
              }`}
            >
              <ArrowUpDown size={22} className="stroke-[2.5px]" />
            </button>
          </div>
        </div>










        {/* Quick Actions Row: Rating, Share App, Suggestions */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {/* Rating (التقييم) */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: isRtl ? "تقييم التطبيق" : "Rate App", text: isRtl ? "تطبيق المصحف الشريف" : "Quran App" }).catch(() => {});
              } else {
                alert(isRtl ? "شكراً لتقييمك للتطبيق! ⭐⭐⭐⭐⭐" : "Thank you for rating the app! ⭐⭐⭐⭐⭐");
              }
            }}
            className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
              theme === "navy-velvet"
                ? "bg-white border-slate-200 text-[#3F63C6] hover:bg-slate-50 hover:border-[#3F63C6]/40"
                : theme === "gold-velvet"
                  ? "bg-white border-[#c5a85c]/30 text-[#011c14] hover:bg-[#FAF2DF]/40 hover:border-[#c5a85c]"
                  : isDark
                    ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-850 hover:border-amber-500/40"
                    : "bg-white border-slate-200 text-amber-600 hover:bg-amber-50/50 hover:border-amber-300"
            }`}
          >
            <Star size={20} className="fill-amber-400/20 stroke-[2]" />
            <span className="text-xs font-black">{isRtl ? "التقييم" : "Rate App"}</span>
          </button>

          {/* Share App (مشاركة التطبيق) */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: isRtl ? "المصحف الشريف" : "Quran App",
                  url: window.location.href
                }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(window.location.href);
                alert(isRtl ? "تم نسخ رابط التطبيق بنجاح!" : "App link copied!");
              }
            }}
            className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
              theme === "navy-velvet"
                ? "bg-white border-slate-200 text-[#3F63C6] hover:bg-slate-50 hover:border-[#3F63C6]/40"
                : theme === "gold-velvet"
                  ? "bg-white border-[#c5a85c]/30 text-[#011c14] hover:bg-[#FAF2DF]/40 hover:border-[#c5a85c]"
                  : isDark
                    ? "bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-850 hover:border-emerald-500/40"
                    : "bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50/50 hover:border-emerald-300"
            }`}
          >
            <Share2 size={20} className="stroke-[2]" />
            <span className="text-xs font-black">{isRtl ? "مشاركة التطبيق" : "Share App"}</span>
          </button>

          {/* Suggestions (مقترحات) */}
          <button
            onClick={() => {
              const msg = prompt(isRtl ? "أدخل مقترحك أو ملاحظتك للتطوير:" : "Enter your suggestion or feedback:");
              if (msg && msg.trim()) {
                alert(isRtl ? "تم إرسال مقترحك بنجاح، جزاكم الله خيراً!" : "Thank you for your feedback!");
              }
            }}
            className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
              theme === "navy-velvet"
                ? "bg-white border-slate-200 text-[#3F63C6] hover:bg-slate-50 hover:border-[#3F63C6]/40"
                : theme === "gold-velvet"
                  ? "bg-white border-[#c5a85c]/30 text-[#011c14] hover:bg-[#FAF2DF]/40 hover:border-[#c5a85c]"
                  : isDark
                    ? "bg-slate-900 border-slate-800 text-sky-400 hover:bg-slate-850 hover:border-sky-500/40"
                    : "bg-white border-slate-200 text-sky-700 hover:bg-sky-50/50 hover:border-sky-300"
            }`}
          >
            <MessageSquarePlus size={20} className="stroke-[2]" />
            <span className="text-xs font-black">{isRtl ? "مقترحات" : "Suggestions"}</span>
          </button>
        </div>

        {/* Our Applications (تطبيقاتنا) */}
        <div className={`p-4 rounded-3xl space-y-3.5 border ${
          theme === "navy-velvet" ? "bg-white border-slate-200 text-slate-850 shadow-sm" :
          theme === "gold-velvet" ? "bg-white border-[#c5a85c]/30 text-slate-800 shadow-sm" :
          isDark ? "bg-slate-900 border-slate-850 shadow-none text-slate-100" : "bg-white border-slate-100 shadow-sm text-slate-800"
        }`}>
          <h3 className={`text-xs font-bold flex items-center gap-2 border-b pb-2 ${
            theme === "navy-velvet" ? "text-[#3F63C6] border-slate-200" :
            theme === "gold-velvet" ? "text-[#011c14] border-[#c5a85c]/20" :
            isDark ? "text-emerald-400 border-slate-800" : "text-[#065f46] border-slate-50"
          }`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              theme === "navy-velvet" ? "bg-[#3F63C6]/15 text-[#3F63C6]" :
              theme === "gold-velvet" ? "bg-[#c5a85c]/20 text-[#011c14]" :
              isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100/80 text-[#065f46]"
            }`}>
              <Smartphone size={14} />
            </div>
            <span>{isRtl ? "تطبيقاتنا" : "Our Applications"}</span>
          </h3>

          <div className="space-y-2.5">
            {/* App 1: المفردون */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
              theme === "navy-velvet" ? "bg-slate-50/80 border-slate-200 hover:border-[#3F63C6]/40" :
              theme === "gold-velvet" ? "bg-[#FAF8F5] border-[#c5a85c]/20 hover:border-[#c5a85c]" :
              isDark ? "bg-slate-950/40 border-slate-800 hover:border-slate-700" : "bg-slate-50/80 border-slate-100 hover:border-slate-200"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                  theme === "navy-velvet" ? "bg-[#3F63C6]/15 text-[#3F63C6]" :
                  theme === "gold-velvet" ? "bg-[#c5a85c]/25 text-[#011c14]" :
                  isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-800"
                }`}>
                  📿
                </div>
                <div>
                  <h4 className="text-xs font-black">{isRtl ? "المفردون" : "Al-Mufarridun"}</h4>
                  <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {isRtl ? "تطبيق الأذكار والورد القرآني المحاسب للنفس" : "Daily Dhikr & Quranic Accountability App"}
                  </p>
                </div>
              </div>
            </div>

            {/* App 2: فضائل */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
              theme === "navy-velvet" ? "bg-slate-50/80 border-slate-200 hover:border-[#3F63C6]/40" :
              theme === "gold-velvet" ? "bg-[#FAF8F5] border-[#c5a85c]/20 hover:border-[#c5a85c]" :
              isDark ? "bg-slate-950/40 border-slate-800 hover:border-slate-700" : "bg-slate-50/80 border-slate-100 hover:border-slate-200"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                  theme === "navy-velvet" ? "bg-[#3F63C6]/15 text-[#3F63C6]" :
                  theme === "gold-velvet" ? "bg-[#c5a85c]/25 text-[#011c14]" :
                  isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-800"
                }`}>
                  ✨
                </div>
                <div>
                  <h4 className="text-xs font-black">{isRtl ? "فضائل" : "Fada'il"}</h4>
                  <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {isRtl ? "تطبيق فضائل الأعمال والسنن والآداب النبوية" : "Virtues of Good Deeds & Prophetic Sunnahs"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
