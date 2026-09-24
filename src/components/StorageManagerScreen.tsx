import React, { useState, useEffect } from "react";
import { 
  HardDrive, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  Search, 
  Database, 
  BookOpen, 
  Headphones, 
  FileText, 
  Layers, 
  Sparkles, 
  Bookmark, 
  AlertTriangle, 
  RefreshCw,
  MinusCircle,
  FolderCheck,
  Check,
  X,
  PieChart,
  Minus,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCachedPagesCount, clearQuranPageCache, startAutoQuranDownload } from "../utils/quranPageCache";
import { fetchQuranSvg } from "../utils/quranApi";

export interface StorageItem {
  id: string;
  category: "quran_pages" | "recitations" | "tafsir" | "quran_sciences" | "tadabbur" | "mutashabihat" | "extra_media";
  categoryAr: string;
  title: string;
  subtext: string;
  authorOrSource?: string;
  sizeMB: number;
  isDownloaded: boolean;
  downloadProgress?: number; // 0-100
  isDownloading?: boolean;
}

interface StorageManagerScreenProps {
  isDark: boolean;
  theme?: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet";
  onClose?: () => void;
}

const STORAGE_KEY = "tebyan_storage_manager_items_v3";

// Initial catalog of all Quranic books and resources ordered exactly per user's mandate:
// 1. صفحات المصحف
// 2. التلاوات
// 3. كتب التفسير (المختصرة والمطولة)
// 4. كتب علوم القرآن (الإعراب والصرف والبلاغة)
// 5. كتب التدبر
// 6. كتب المتشابهات
// 7. كتب ومكتبات إضافية
const initialCatalog: StorageItem[] = [
  // 1. صفحات المصحف
  {
    id: "mushaf_svg_pages",
    category: "quran_pages",
    categoryAr: "صفحات المصحف الشريف",
    title: "صفحات المصحف الشريف العثماني (٦٠٤ صفحة)",
    subtext: "النسخة عالية الدقة المتجهة بالرسم العثماني المصحفي بالكامل",
    authorOrSource: "مجمع الملك فهد لطباعة المصحف الشريف",
    sizeMB: 45.0,
    isDownloaded: true
  },
  {
    id: "mushaf_fonts_pack",
    category: "quran_pages",
    categoryAr: "صفحات المصحف الشريف",
    title: "حزمة الخطوط العثمانية ومتجهات الآيات",
    subtext: "خطوط الرسم العثماني وعلامات ضبط المصحف والوقف والابتداء",
    authorOrSource: "مشروع الملك فهد للخطوط القرآنية",
    sizeMB: 12.5,
    isDownloaded: true
  },
  {
    id: "mushaf_tajweed_pack",
    category: "quran_pages",
    categoryAr: "صفحات المصحف الشريف",
    title: "مصحف التجويد الملون بالمتجهات",
    subtext: "صفحات المصحف الملونة بأحكام التجويد والترتيل",
    authorOrSource: "المكتبة القرآنية الرقمية",
    sizeMB: 18.0,
    isDownloaded: false
  },

  // 2. التلاوات والمقاطع الصوتية
  {
    id: "recitation_alafasy",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ مشاري بن راشد العفاسي",
    subtext: "المصحف المرتل بالكامل بجودة صوتية عالية 128kbps",
    authorOrSource: "القارئ مشاري العفاسي",
    sizeMB: 620.0,
    isDownloaded: false
  },
  {
    id: "recitation_ghamadi",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ سعد الغامدي",
    subtext: "المصحف المرتل بالكامل أوفلاين مع السكينة والوقار",
    authorOrSource: "القارئ سعد الغامدي",
    sizeMB: 480.0,
    isDownloaded: false
  },
  {
    id: "recitation_abdulbasit_mujawwad",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ عبد الباسط عبد الصمد (المجود الخالد)",
    subtext: "المصحف المجود بالكامل بدقة وجودة عالية 128kbps",
    authorOrSource: "القارئ عبد الباسط عبد الصمد",
    sizeMB: 780.0,
    isDownloaded: false
  },
  {
    id: "recitation_abdulbasit_murattal",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ عبد الباسط عبد الصمد (المرتل)",
    subtext: "المصحف المرتل الكامل بنقاء صوتي استثنائي 192kbps",
    authorOrSource: "القارئ عبد الباسط عبد الصمد",
    sizeMB: 650.0,
    isDownloaded: false
  },
  {
    id: "recitation_husary_muallim",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ محمود خليل الحصري (المعلم)",
    subtext: "تلاوة تعليمية متأنية بضبط مخارج الحروف وأحكام التجويد",
    authorOrSource: "شيخ المقارئ المصرية محمود خليل الحصري",
    sizeMB: 540.0,
    isDownloaded: true
  },
  {
    id: "recitation_husary_murattal",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ محمود خليل الحصري (المرتل)",
    subtext: "المصحف المرتل المتقن بالكامل لشيخ القراء",
    authorOrSource: "القارئ محمود خليل الحصري",
    sizeMB: 490.0,
    isDownloaded: false
  },
  {
    id: "recitation_minshawi_murattal",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ محمد صديق المنشاوي (المرتل)",
    subtext: "المصحف المرتل الخاشع الباكي بالكامل 128kbps",
    authorOrSource: "القارئ محمد صديق المنشاوي",
    sizeMB: 580.0,
    isDownloaded: false
  },
  {
    id: "recitation_minshawi_mujawwad",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ محمد صديق المنشاوي (المجود)",
    subtext: "التلاوة المجودة الخالدة بالكامل بجودة فائقة 192kbps",
    authorOrSource: "القارئ محمد صديق المنشاوي",
    sizeMB: 810.0,
    isDownloaded: false
  },
  {
    id: "recitation_sudais",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ عبد الرحمن السديس",
    subtext: "تلاوة الحرم المكي الشريف المرتلة بالكامل",
    authorOrSource: "إمام المسجد الحرام عبد الرحمن السديس",
    sizeMB: 530.0,
    isDownloaded: false
  },
  {
    id: "recitation_shuraym",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ سعود الشريم",
    subtext: "تلاوة الحرم المكي الشريف المرتلة الشجية",
    authorOrSource: "القارئ سعود الشريم",
    sizeMB: 520.0,
    isDownloaded: false
  },
  {
    id: "recitation_maher",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ ماهر المعيقلي",
    subtext: "تلاوة الحرم المكي الشريف العذبة الكاملة",
    authorOrSource: "إمام الحرم المكي ماهر المعيقلي",
    sizeMB: 510.0,
    isDownloaded: false
  },
  {
    id: "recitation_yasser_dosari",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ ياسر الدوسري",
    subtext: "المصحف المرتل الخاشع بمقامات جليلة 128kbps",
    authorOrSource: "إمام المسجد الحرام ياسر الدوسري",
    sizeMB: 610.0,
    isDownloaded: false
  },
  {
    id: "recitation_ajamy",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ أحمد بن علي العجمي",
    subtext: "المصحف المرتل المؤثر الكامل 128kbps",
    authorOrSource: "القارئ أحمد بن علي العجمي",
    sizeMB: 590.0,
    isDownloaded: false
  },
  {
    id: "recitation_shatri",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ أبي بكر الشاطري",
    subtext: "تلاوة حجازية خاشعة ومفعمة بالسكينة 128kbps",
    authorOrSource: "القارئ أبو بكر الشاطري",
    sizeMB: 570.0,
    isDownloaded: false
  },
  {
    id: "recitation_qatami",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ ناصر القطامي",
    subtext: "تلاوة خاشعة ناصعة ومؤثرة للمصحف الشريف",
    authorOrSource: "القارئ ناصر القطامي",
    sizeMB: 595.0,
    isDownloaded: false
  },
  {
    id: "recitation_rifai",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ هاني الرفاعي",
    subtext: "تلاوة باكية نديّة بجودة عالية 192kbps",
    authorOrSource: "القارئ هاني الرفاعي",
    sizeMB: 640.0,
    isDownloaded: false
  },
  {
    id: "recitation_ali_jaber",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ علي عبد الله جابر (رحمه الله)",
    subtext: "تسجيلات الحرم المكي الشريف الخالدة بالكامل",
    authorOrSource: "إمام الحرم المكي السابق علي جابر",
    sizeMB: 495.0,
    isDownloaded: false
  },
  {
    id: "recitation_jibreel",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ محمد جبريل",
    subtext: "المصحف المرتل الكامل برواية حفص عن عاصم",
    authorOrSource: "القارئ محمد جبريل",
    sizeMB: 580.0,
    isDownloaded: false
  },
  {
    id: "recitation_budair",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ صلاح البدير",
    subtext: "تلاوة المسجد النبوي الشريف المرتلة بالكامل",
    authorOrSource: "إمام المسجد النبوي صلاح البدير",
    sizeMB: 550.0,
    isDownloaded: false
  },
  {
    id: "recitation_basfar",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ عبد الله بصفر",
    subtext: "المصحف المرتل المتقن بدقة 192kbps",
    authorOrSource: "القارئ عبد الله بصفر",
    sizeMB: 630.0,
    isDownloaded: false
  },
  {
    id: "recitation_hudhaify",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ علي بن عبد الرحمن الحذيفي",
    subtext: "تلاوة المسجد النبوي الشريف المتقنة بالأحكام",
    authorOrSource: "إمام المسجد النبوي علي الحذيفي",
    sizeMB: 535.0,
    isDownloaded: false
  },
  {
    id: "recitation_mustafa_ismail_mujawwad",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ مصطفى إسماعيل (المجود الخالد)",
    subtext: "التلاوة المجودة الكاملة بأعلى جودة استوديو 192kbps",
    authorOrSource: "عملاق التلاوة مصطفى إسماعيل",
    sizeMB: 830.0,
    isDownloaded: false
  },
  {
    id: "recitation_bandar_baleela",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ بندر بليلة",
    subtext: "المصحف المرتل العذب لإمام المسجد الحرام 128kbps",
    authorOrSource: "إمام المسجد الحرام بندر بليلة",
    sizeMB: 520.0,
    isDownloaded: false
  },
  {
    id: "recitation_fares_abbad",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ فارس عباد",
    subtext: "تلاوة يمنية شجية وندية تأسر القلوب وتعين على التدبر",
    authorOrSource: "القارئ فارس عباد",
    sizeMB: 510.0,
    isDownloaded: false
  },
  {
    id: "recitation_khalefa_tunaiji",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ خليفة الطنيجي",
    subtext: "المصحف المرتل المتقن بدقة وأداء إماراتي وقور",
    authorOrSource: "القارئ خليفة الطنيجي",
    sizeMB: 490.0,
    isDownloaded: false
  },
  {
    id: "recitation_ayman_sowaid",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الدكتور أيمن رشدي سويد",
    subtext: "المصحف التعليمي المحقق لضبط مخارج الحروف ودقائق التجويد",
    authorOrSource: "العلامة الدكتور أيمن سويد",
    sizeMB: 460.0,
    isDownloaded: false
  },
  {
    id: "recitation_ibrahim_akhdar",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ إبراهيم الأخضر",
    subtext: "تلاوة شيخ قراء المدينة المنورة الرصينة والمتقنة",
    authorOrSource: "شيخ قراء المدينة إبراهيم الأخضر",
    sizeMB: 450.0,
    isDownloaded: false
  },
  {
    id: "recitation_banna_murattal",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ محمود علي البنا (المرتل)",
    subtext: "المصحف المرتل الخالد لرواد التلاوة المصرية الأصيلة",
    authorOrSource: "القارئ محمود علي البنا",
    sizeMB: 470.0,
    isDownloaded: false
  },
  {
    id: "recitation_yassin_jazairi_warsh",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ ياسين الجزائري (ورش عن نافع)",
    subtext: "المصحف المرتل برواية ورش عن نافع من طريق الأزرق",
    authorOrSource: "القارئ ياسين الجزائري",
    sizeMB: 530.0,
    isDownloaded: false
  },
  {
    id: "recitation_khayyat",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ عبد الله خياط",
    subtext: "تسجيلات الحرم المكي الهادئة والمباركة للمصحف المرتل",
    authorOrSource: "إمام المسجد الحرام عبد الله خياط",
    sizeMB: 500.0,
    isDownloaded: false
  },
  {
    id: "recitation_abdulrashid_sufi",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ عبد الرشيد صوفي (الدوري عن أبي عمرو)",
    subtext: "تلاوة متقنة محققة برواية الدوري عن أبي عمرو البصري",
    authorOrSource: "القارئ عبد الرشيد صوفي",
    sizeMB: 560.0,
    isDownloaded: false
  },
  {
    id: "recitation_abdulwadood_haneef",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ عبد الودود حنيف",
    subtext: "المصحف المرتل الشجي لإمام المسجد النبوي الشريف",
    authorOrSource: "القارئ عبد الودود حنيف",
    sizeMB: 510.0,
    isDownloaded: false
  },
  {
    id: "recitation_alazazy_children",
    category: "recitations",
    categoryAr: "التلاوات والمقاطع الصوتية",
    title: "تلاوة الشيخ الحسيني العزازي (المصحف المعلم)",
    subtext: "المصحف المعلم بترديد الأطفال لتعليم التلاوة وحفظ كتاب الله",
    authorOrSource: "القارئ الحسيني العزازي",
    sizeMB: 480.0,
    isDownloaded: false
  },

  // 3. كتب التفسير (المختصرة والمطولة)
  {
    id: "tafsir_muyassar",
    category: "tafsir",
    categoryAr: "كتب التفسير (المختصرة والمطولة)",
    title: "التفسير الميسر",
    subtext: "مجمع الملك فهد لطباعة المصحف الشريف",
    authorOrSource: "نخبة من العلماء - مجمع الملك فهد",
    sizeMB: 2.8,
    isDownloaded: true
  },
  {
    id: "tafsir_mukhtasar",
    category: "tafsir",
    categoryAr: "كتب التفسير (المختصرة والمطولة)",
    title: "المختصر في تفسير القرآن الكريم",
    subtext: "مركز تفسير للدراسات القرآنية (مستودع susalm/mushaf-altibyan- / tafsir-mcp-main)",
    authorOrSource: "مركز تفسير للدراسات القرآنية (susalm/mushaf-altibyan-)",
    sizeMB: 3.6,
    isDownloaded: true
  },
  {
    id: "tafsir_sadi",
    category: "tafsir",
    categoryAr: "كتب التفسير (المختصرة والمطولة)",
    title: "تفسير السعدي",
    subtext: "تيسير الكريم الرحمن في تفسير كلام المنان لابن سعدي (المتوفى ١٣٧٦ هـ)",
    authorOrSource: "الشيخ عبد الرحمن بن ناصر السعدي",
    sizeMB: 7.4,
    isDownloaded: true
  },
  {
    id: "tafsir_baghawi",
    category: "tafsir",
    categoryAr: "كتب التفسير (المختصرة والمطولة)",
    title: "تفسير البغوي",
    subtext: "معالم التنزيل للبغوي (المتوفى ٥١٦ هـ)",
    authorOrSource: "الإمام الحسين بن مسعود البغوي",
    sizeMB: 16.6,
    isDownloaded: true
  },
  {
    id: "tafsir_kathir",
    category: "tafsir",
    categoryAr: "كتب التفسير (المختصرة والمطولة)",
    title: "تفسير ابن كثير",
    subtext: "تفسير القرآن العظيم لابن كثير الدمشقي (المتوفى ٧٧٤ هـ)",
    authorOrSource: "الحافظ ابن كثير الدمشقي",
    sizeMB: 32.4,
    isDownloaded: true
  },
  {
    id: "tafsir_tabari",
    category: "tafsir",
    categoryAr: "كتب التفسير (المختصرة والمطولة)",
    title: "تفسير الطبري",
    subtext: "جامع البيان عن تأويل آي القرآن لابن جرير الطبري (المتوفى ٣١٠ هـ)",
    authorOrSource: "الإمام محمد بن جرير الطبري",
    sizeMB: 49.4,
    isDownloaded: true
  },
  {
    id: "tafsir_qurtubi",
    category: "tafsir",
    categoryAr: "كتب التفسير (المختصرة والمطولة)",
    title: "تفسير القرطبي (الجامع لأحكام القرآن)",
    subtext: "الجامع لأحكام القرآن واستنباط الأدلة لأبي عبد الله القرطبي",
    authorOrSource: "الإمام القرطبي (المتوفى ٦٧١ هـ)",
    sizeMB: 58.2,
    isDownloaded: true
  },
  {
    id: "asbab_nuzul",
    category: "tafsir",
    categoryAr: "كتب التفسير (المختصرة والمطولة)",
    title: "أسباب النزول والمحرر في أسباب النزول",
    subtext: "جمع وتحقيق أسباب نزول الآيات الكريمة من الصحاح والسنن",
    authorOrSource: "الإمام الواحدي والدراسات الحديثة",
    sizeMB: 5.8,
    isDownloaded: true
  },

  // 4. كتب علوم القرآن (الإعراب والصرف والبلاغة)
  {
    id: "book_irab",
    category: "quran_sciences",
    categoryAr: "كتب علوم القرآن (الإعراب والصرف والبلاغة)",
    title: "إعراب القرآن الكريم",
    subtext: "مركز تفسير للدراسات القرآنية",
    authorOrSource: "مركز تفسير للدراسات القرآنية",
    sizeMB: 28.3,
    isDownloaded: true
  },
  {
    id: "book_sarf",
    category: "quran_sciences",
    categoryAr: "كتب علوم القرآن (الإعراب والصرف والبلاغة)",
    title: "الصرف في القرآن الكريم",
    subtext: "مركز تفسير للدراسات القرآنية",
    authorOrSource: "مركز تفسير للدراسات القرآنية",
    sizeMB: 29.2,
    isDownloaded: true
  },
  {
    id: "book_balagha",
    category: "quran_sciences",
    categoryAr: "كتب علوم القرآن (الإعراب والصرف والبلاغة)",
    title: "أسرار البلاغة والتبيان في البيان القرآني",
    subtext: "اللمسات البلاغية والبيانية في الأسلوب القرآني المعجز",
    authorOrSource: "الإمام عبد القاهر الجرجاني والعلماء",
    sizeMB: 18.5,
    isDownloaded: true
  },
  {
    id: "book_majaz",
    category: "quran_sciences",
    categoryAr: "كتب علوم القرآن (الإعراب والصرف والبلاغة)",
    title: "مجاز القرآن ومعاني القرآن",
    subtext: "توجيه المعاني اللغوية والنحوية في التنزيل",
    authorOrSource: "أبو عبيدة والفراء والزجاج",
    sizeMB: 22.1,
    isDownloaded: true
  },

  // 5. كتب التدبر
  {
    id: "book_tadabbur",
    category: "tadabbur",
    categoryAr: "كتب التدبر والفوائد",
    title: "كتاب ليدبروا آياته",
    subtext: "المركز المباشر والفوائد التدبرية الميسرة",
    authorOrSource: "مركز تدبر للدراسات القرآنية",
    sizeMB: 14.2,
    isDownloaded: true
  },

  // 6. كتب المتشابهات والتوجيه
  {
    id: "book_mutashabihat_saghir",
    category: "mutashabihat",
    categoryAr: "كتب المتشابهات والتوجيه",
    title: "دليل المتشابهات اللفظية في القرآن الكريم",
    subtext: "تجميع وضبط الآيات المتشابهة والتفرقة بين السور والآيات للحفاظ",
    authorOrSource: "د. محمد بن عبد الله الصغير",
    sizeMB: 12.8,
    isDownloaded: true
  },

  // 7. المكتبات والوسائط الإضافية
  {
    id: "extra_mujam",
    category: "extra_media",
    categoryAr: "المكتبات والوسائط الإضافية",
    title: "معجم ألفاظ القرآن الكريم وغريب الكلمات",
    subtext: "بيان مفردات القرآن والألفاظ الغريبة بالتفصيل",
    authorOrSource: "مجمع اللغة العربية بالقاهرة",
    sizeMB: 6.2,
    isDownloaded: true
  },
  {
    id: "extra_fahariss",
    category: "extra_media",
    categoryAr: "المكتبات والوسائط الإضافية",
    title: "الفهارس الموضوعية والتكشاف القرآنية",
    subtext: "فهرسة شاملة للمواضيع والأحكام والعقائد والقصص في التنزيل",
    authorOrSource: "مركز التكشاف الرقمي",
    sizeMB: 4.1,
    isDownloaded: true
  }
];

export default function StorageManagerScreen({ isDark, theme = "light", onClose }: StorageManagerScreenProps) {
  const [items, setItems] = useState<StorageItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const existingIds = new Set(parsed.map((i: StorageItem) => i.id));
          const missing = initialCatalog.filter((i) => !existingIds.has(i.id));
          if (missing.length > 0) {
            return [...parsed, ...missing];
          }
          return parsed;
        }
      }
    } catch {}
    return initialCatalog;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("quran_pages");
  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null);
  const [confirmDeleteModalItem, setConfirmDeleteModalItem] = useState<StorageItem | null>(null);
  const [mushafPageCount, setMushafPageCount] = useState<number>(604);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save storage state:", e);
    }
  }, [items]);

  // Read actual cached pages count from IndexedDB
  useEffect(() => {
    getCachedPagesCount("quran-svg").then((count) => {
      setMushafPageCount(count);
    });
  }, []);

  // Calculate storage usage
  const downloadedItems = items.filter(i => i.isDownloaded);
  const totalDownloadedSizeMB = downloadedItems.reduce((acc, curr) => acc + curr.sizeMB, 0);
  const simulatedTotalDeviceCapacityGB = 32.0; // Simulated total device space reserved
  const usedSizeGB = (totalDownloadedSizeMB / 1024).toFixed(2);
  const freeSizeGB = (simulatedTotalDeviceCapacityGB - (totalDownloadedSizeMB / 1024)).toFixed(1);
  const usagePercentage = Math.min(100, Math.round((totalDownloadedSizeMB / 1024 / simulatedTotalDeviceCapacityGB) * 100));

  // Category definitions in strict user sequence
  const categoriesList = [
    { id: "all", label: "جميع الكتب والمصادر" },
    { id: "quran_pages", label: "١. صفحات المصحف" },
    { id: "recitations", label: "٢. التلاوات" },
    { id: "tafsir", label: "٣. كتب التفسير" },
    { id: "quran_sciences", label: "٤. علوم القرآن واللغة" },
    { id: "tadabbur", label: "٥. كتب التدبر" },
    { id: "mutashabihat", label: "٦. كتب المتشابهات" },
    { id: "extra_media", label: "٧. وسائط ومكتبات" },
  ];

  // Handle single item download with realistic progress bar simulation
  const handleDownloadItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    setDownloadingItemId(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, isDownloading: true, downloadProgress: 5 } : i));

    // If downloading Quran Pages, trigger actual background page cacher
    if (id === "mushaf_svg_pages") {
      startAutoQuranDownload("quran-svg", fetchQuranSvg, (downloaded, total) => {
        const pct = Math.round((downloaded / total) * 100);
        setMushafPageCount(downloaded);
        setItems(prev => prev.map(i => i.id === id ? { ...i, downloadProgress: pct } : i));
      });
    }

    let currentProgress = 5;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 20) + 12;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setItems(prev => prev.map(i => i.id === id ? { ...i, isDownloaded: true, isDownloading: false, downloadProgress: 100 } : i));
        setDownloadingItemId(null);
      } else {
        setItems(prev => prev.map(i => i.id === id ? { ...i, downloadProgress: currentProgress } : i));
      }
    }, 280);
  };

  // Handle single item deletion
  const handleDeleteItem = (id: string) => {
    if (id === "mushaf_svg_pages") {
      clearQuranPageCache();
      setMushafPageCount(0);
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, isDownloaded: false, isDownloading: false, downloadProgress: 0 } : i));
    setConfirmDeleteModalItem(null);
  };

  // Handle category download all / delete all
  const handleDownloadCategoryAll = (catId: string) => {
    setItems(prev => prev.map(i => {
      if (catId === "all" || i.category === catId) {
        return { ...i, isDownloaded: true, isDownloading: false, downloadProgress: 100 };
      }
      return i;
    }));
  };

  const handleDeleteCategoryAll = (catId: string) => {
    if (catId === "all" || catId === "quran_pages") {
      clearQuranPageCache();
      setMushafPageCount(0);
    }
    setItems(prev => prev.map(i => {
      if (catId === "all" || i.category === catId) {
        return { ...i, isDownloaded: false, isDownloading: false, downloadProgress: 0 };
      }
      return i;
    }));
  };

  // Filter items by search query and category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.includes(searchQuery) || item.subtext.includes(searchQuery) || (item.authorOrSource && item.authorOrSource.includes(searchQuery));
    const matchesCategory = searchQuery !== "" 
      ? true 
      : (activeCategoryFilter === "tadabbur_mutashabihat" || activeCategoryFilter === "tadabbur" || activeCategoryFilter === "mutashabihat")
        ? (item.category === "tadabbur" || item.category === "mutashabihat")
        : item.category === activeCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group filtered items by category order
  const categoryOrder: Array<StorageItem["category"]> = [
    "quran_pages",
    "recitations",
    "tafsir",
    "quran_sciences",
    "tadabbur",
    "mutashabihat",
    "extra_media"
  ];

  const categoryTitles: Record<StorageItem["category"], string> = {
    quran_pages: "أولاً: صفحات المصحف الشريف",
    recitations: "ثانياً: التلاوات والمقاطع الصوتية",
    tafsir: "ثالثاً: كتب التفسير (المختصرة والمطولة)",
    quran_sciences: "رابعاً: كتب علوم القرآن (الإعراب والصرف والبلاغة)",
    tadabbur: "خامساً: كتب التدبر والفوائد",
    mutashabihat: "سادساً: كتب المتشابهات والتوجيه",
    extra_media: "سابعاً: المكتبات والوسائط الإضافية"
  };

  const categoryIcons: Record<StorageItem["category"], React.ReactNode> = {
    quran_pages: <BookOpen className="text-emerald-500 shrink-0" size={20} />,
    recitations: <Headphones className="text-amber-500 shrink-0" size={20} />,
    tafsir: <FileText className="text-sky-500 shrink-0" size={20} />,
    quran_sciences: <Layers className="text-purple-500 shrink-0" size={20} />,
    tadabbur: <Sparkles className="text-amber-400 shrink-0" size={20} />,
    mutashabihat: <Bookmark className="text-rose-500 shrink-0" size={20} />,
    extra_media: <Database className="text-teal-500 shrink-0" size={20} />
  };

  // Formatting helpers
  const toArabicNumerals = (num: number | string): string => {
    return String(num).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
  };

  // Color classes according to application themes
  const isGold = theme === "gold-velvet";
  const isNavy = theme === "navy-velvet";
  const isEmerald = theme === "emerald-velvet";

  const cardContainerBg = isEmerald
    ? "bg-[#011c14] border-[#10b981]/25 text-[#FAF8F5]"
    : isGold
      ? "bg-[#FAF8F5] border-[#c5a85c]/30 text-[#011c14]"
      : isNavy
        ? "bg-white border-slate-200 text-slate-900"
        : isDark
          ? "bg-slate-900 border-slate-800 text-slate-100"
          : "bg-white border-slate-200/90 text-slate-900";

  const sectionHeaderBg = isEmerald
    ? "bg-[#012519] border-[#10b981]/30 text-[#34d399]"
    : isGold
      ? "bg-[#FAF5E6] border-[#c5a85c]/35 text-[#011c14]"
      : isNavy
        ? "bg-[#F0F7FF] border-[#3F63C6]/20 text-[#1b3168]"
        : isDark
          ? "bg-slate-850 border-slate-800 text-emerald-400"
          : "bg-emerald-50/80 border-emerald-100 text-emerald-900";

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-12" dir="rtl">
      
      {/* Top Banner: Info notice + Download All Button */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isGold ? "bg-[#FAF7EF] border-[#EAD2A8] text-[#1c1811]" :
        isEmerald ? "bg-[#012218] border-[#10b981]/30 text-[#FAF8F5]" :
        isNavy ? "bg-[#F0F5FF] border-[#3F63C6]/20 text-[#1c2e5c]" :
        isDark ? "bg-slate-900 border-slate-800 text-slate-100" :
        "bg-emerald-50/80 border-emerald-100 text-emerald-950"
      }`}>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold opacity-90">
          <span className={`text-base ${
            isEmerald ? "text-[#34d399]" :
            isNavy ? "text-[#3F63C6]" :
            isGold ? "text-[#c5a85c]" :
            "text-emerald-600 dark:text-emerald-400"
          }`}>ⓘ</span>
          <span>الكتب المحملة تعمل مباشرة بدون إنتَرنت</span>
        </div>

        <button
          onClick={() => handleDownloadCategoryAll("all")}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-xs ${
            isEmerald ? "bg-[#34d399] text-[#011c14] hover:bg-[#34d399]/90" :
            isNavy ? "bg-[#3F63C6] text-white hover:bg-[#3554aa]" :
            isGold ? "bg-[#c5a85c] hover:bg-[#b89a4e] text-[#1c1811]" :
            "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          <Download size={16} />
          <span>تحميل جميع الكتب أوفلاين</span>
        </button>
      </div>

      {/* Search Input Box */}
      <div className="relative w-full">
        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن اسم الكتاب أو المفسر..."
          className={`w-full pr-11 pl-10 py-3 rounded-2xl text-xs sm:text-sm font-semibold border outline-none transition shadow-2xs ${
            isEmerald ? "bg-[#011a12] border-[#10b981]/30 text-white placeholder-[#34d399]/50 focus:border-[#34d399]" :
            isNavy ? "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#3F63C6]" :
            isGold ? "bg-[#FAF8F5] border-[#EAD2A8] text-[#1c1811] placeholder-[#c5a85c]/60 focus:border-[#c5a85c]" :
            isDark ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500" :
            "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500"
          }`}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500 dark:text-red-400 hover:text-red-600 p-1 cursor-pointer"
            title="مسح"
          >
            <X size={16} className="text-red-500 dark:text-red-400" />
          </button>
        )}
      </div>

      {/* Category Pills (Tabs) */}
      <div className="w-full overflow-x-auto scrollbar-none flex items-center gap-2 py-1 shrink-0">
        {[
          { id: "quran_pages", label: "📖 صفحات المصحف" },
          { id: "recitations", label: "🎧 التلاوات الصوتية" },
          { id: "quran_sciences", label: "📄 علوم القرآن (الإعراب والصرف)" },
          { id: "tadabbur_mutashabihat", label: "✨ كتب التدبر والمتشابهات" },
        ].map(tab => {
          const isActive = activeCategoryFilter === tab.id || (tab.id === "tadabbur_mutashabihat" && (activeCategoryFilter === "tadabbur" || activeCategoryFilter === "mutashabihat"));
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "tadabbur_mutashabihat") {
                  setActiveCategoryFilter("tadabbur");
                } else {
                  setActiveCategoryFilter(tab.id);
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer border ${
                isActive
                  ? (isEmerald ? "bg-[#34d399] text-[#011c14] border-[#34d399]" : isNavy ? "bg-[#3F63C6] text-white border-[#3F63C6]" : isGold ? "bg-[#c5a85c] text-[#1c1811] border-[#c5a85c] shadow-xs" : "bg-emerald-600 text-white border-emerald-600 shadow-xs")
                  : (isEmerald ? "bg-[#011a12] border-[#10b981]/20 text-[#34d399]/80 hover:bg-[#10b981]/10" : isNavy ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" : isGold ? "bg-white border-[#EAD2A8]/70 text-[#1c1811]/80 hover:bg-[#FAF8F5]" : isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700" : "bg-white border-slate-200 text-slate-700 hover:bg-emerald-50/50")
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Section Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 pb-1 border-b border-black/5 dark:border-white/5">
        <h3 className={`font-extrabold text-base sm:text-lg flex items-center gap-2 ${
          isEmerald ? "text-white" :
          isGold ? "text-[#1c1811]" :
          isNavy ? "text-[#1b3168]" :
          isDark ? "text-slate-100" :
          "text-slate-900"
        }`}>
          <span>الكتب والمراجع المعتمدة</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-black/5 dark:bg-white/10 font-bold opacity-80">
            ({toArabicNumerals(filteredItems.length)})
          </span>
        </h3>

        <p className={`text-xs font-medium ${
          isEmerald ? "text-[#34d399]" :
          isGold ? "text-[#c5a85c]" :
          isNavy ? "text-[#3F63C6]" :
          "text-emerald-600 dark:text-emerald-400"
        }`}>
          انقر على الزر الأحمر (-) للحذف أو (+) للتحميل
        </p>
      </div>

      {/* Books List Matching Image Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filteredItems.map((item) => {
          return (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                isEmerald 
                  ? "bg-[#011c14] border-[#10b981]/25 text-white" 
                  : isNavy
                    ? "bg-white border-slate-200 text-slate-900"
                    : isGold
                      ? "bg-[#FAF8F5] border-[#EFE9D9] text-[#1c1811] shadow-2xs hover:border-[#c5a85c]/50"
                      : isDark
                        ? "bg-slate-900 border-slate-800 text-slate-100"
                        : "bg-white border-slate-200 text-slate-900 shadow-2xs hover:border-emerald-500/30"
              }`}
            >
              {/* Right Side: Title & Description */}
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-base sm:text-lg leading-snug tracking-tight">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm opacity-70 mt-1 font-medium leading-relaxed">
                  {item.subtext}
                </p>

                {item.isDownloading && (
                  <div className="mt-2.5 w-full max-w-xs flex flex-col gap-1">
                    <div className={`flex items-center justify-between text-[11px] font-mono font-bold ${
                      isEmerald ? "text-[#34d399]" :
                      isNavy ? "text-[#3F63C6]" :
                      isGold ? "text-[#c5a85c]" :
                      "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      <span>جاري التحميل...</span>
                      <span>{toArabicNumerals(item.downloadProgress || 0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-200 ${
                          isEmerald ? "bg-[#34d399]" :
                          isNavy ? "bg-[#3F63C6]" :
                          isGold ? "bg-[#c5a85c]" :
                          "bg-emerald-500"
                        }`}
                        style={{ width: `${item.downloadProgress || 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Left Side: Size text & Round Plus/Minus Action Button */}
              <div className="flex items-center gap-3.5 shrink-0 dir-ltr">
                
                {/* Size Text */}
                <span className="text-xs font-mono font-bold opacity-75 dir-ltr whitespace-nowrap">
                  {toArabicNumerals(item.sizeMB.toString().replace('.', ','))} م.ب
                </span>

                {/* Round Button */}
                {item.isDownloading ? (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center animate-spin ${
                    isEmerald ? "bg-[#34d399]/20 text-[#34d399]" :
                    isNavy ? "bg-[#3F63C6]/20 text-[#3F63C6]" :
                    isGold ? "bg-[#c5a85c]/20 text-[#c5a85c]" :
                    "bg-emerald-500/20 text-emerald-600"
                  }`}>
                    <Loader2 size={20} />
                  </div>
                ) : item.isDownloaded ? (
                  <button
                    onClick={() => setConfirmDeleteModalItem(item)}
                    className="w-10 h-10 rounded-full bg-[#b83131] hover:bg-[#992222] text-white font-black flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95"
                    title="حذف هذا الكتاب من التخزين"
                  >
                    <Minus size={22} strokeWidth={3.8} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleDownloadItem(item.id)}
                    className={`w-10 h-10 rounded-full font-black flex items-center justify-center transition cursor-pointer shadow-2xs active:scale-95 ${
                      isEmerald ? "bg-[#34d399] hover:bg-[#2cb885] text-[#011c14]" :
                      isNavy ? "bg-[#3F63C6] hover:bg-[#3352ab] text-white" :
                      isGold ? "bg-[#c5a85c] hover:bg-[#b89a4e] text-[#1c1811]" :
                      "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                    title="تحميل الكتاب"
                  >
                    <Plus size={22} strokeWidth={3.5} />
                  </button>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Deleting Item */}
      <AnimatePresence>
        {confirmDeleteModalItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${cardContainerBg}`}
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <div className="p-3 bg-rose-500/15 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">تأكيد حذف التخزين</h3>
                  <p className="text-xs opacity-75">هل أنت تأكد من إزالة هذا الكتاب أو المقاطع المحملة؟</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-6">
                <p className="font-bold text-sm">{confirmDeleteModalItem.title}</p>
                <p className="text-xs opacity-70 mt-1">{confirmDeleteModalItem.subtext}</p>
                <p className="text-xs font-mono font-bold text-rose-500 mt-2">الحجم: {toArabicNumerals(confirmDeleteModalItem.sizeMB)} م.ب</p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmDeleteModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold opacity-80 hover:opacity-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleDeleteItem(confirmDeleteModalItem.id)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>تأكيد الحذف</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
