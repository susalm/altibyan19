// 7 Main Categories
export type MainCategory = "tafsir" | "translations" | "linguistics" | "sciences" | "mutashabihat" | "tadabbur" | "notes";

// Sub-categories per main category
export type SubCategory = 
  | "mukhtasarat" | "mutawassitat" // for tafsir (الميسر، السعدي)
  | "english_translations"        // for translations (تقي الدين الهلالي ومحسن خان)
  | "garib" | "irab" | "sarf" | "balagha" | "maani" // for linguistics
  | "asbab"                       // for sciences (أسباب النزول)
  | "mutashabihat_kutub"          // for mutashabihat
  | "fawaid"                      // for tadabbur
  | "books_notes" | "ayah_notes"; // for notes

export interface LibraryBookItem {
  id: string;
  title: string;
  author: string;
  description?: string;
  mainCategory: MainCategory;
  subCategory: SubCategory;
  apiType?: string;
  isDownloaded?: boolean;
  sizeMB?: number;
}

// Catalog of default library books (مقتصرة بدقة على ما طلبه المستخدم: الميسر والسعدي، ترجمة الهلالي ومحسن خان، أسباب النزول، واللغويات والتدبر والمتشابهات)
export const DEFAULT_BOOKS: LibraryBookItem[] = [
  // --- تفاسير القرآن الكريم (التفسير الميسر وتفسير السعدي فقط) ---
  {
    id: "tafsir_muyassar",
    title: "التفسير الميسر",
    author: "مجمع الملك فهد لطباعة المصحف الشريف",
    mainCategory: "tafsir",
    subCategory: "mukhtasarat",
    apiType: "tafsir_muyassar",
    isDownloaded: true,
  },
  {
    id: "tafsir_sadi",
    title: "تفسير السعدي",
    author: "الشيخ عبد الرحمن بن ناصر السعدي",
    mainCategory: "tafsir",
    subCategory: "mutawassitat",
    apiType: "tafsir_sadi",
    isDownloaded: true,
  },

  // --- الترجمات المعتمدة (ترجمة تقي الدين الهلالي ومحسن خان فقط) ---
  {
    id: "translation_hilali_khan",
    title: "ترجمة تقي الدين الهلالي ومحسن خان",
    author: "د. محمد تقي الدين الهلالي ود. محمد محسن خان",
    mainCategory: "translations",
    subCategory: "english_translations",
    apiType: "english_hilali_khan",
    isDownloaded: true,
  },

  // --- لغويات: غريب الآية ---
  {
    id: "suraj_garib_quran",
    title: "غريب الآية",
    author: "د. محمد بن عبد العزيز الخضيري",
    description: "كتاب معتمد في بيان وتوضيح غريب مفردات القرآن الكريم ومعانيها بأسلوب ميسر ودقيق.",
    mainCategory: "linguistics",
    subCategory: "garib",
    apiType: "suraj_garib_quran",
    isDownloaded: true,
  },

  // --- لغويات: إعراب الآية ---
  {
    id: "book_irab",
    title: "إعراب القرآن الكريم",
    author: "ملف إعراب القرآن (quran_eerab.ts)",
    mainCategory: "linguistics",
    subCategory: "irab",
    apiType: "book_irab",
    isDownloaded: true,
  },

  // --- لغويات: التحليل الصرفي للآية ---
  {
    id: "book_sarf",
    title: "الصرف",
    author: "محمود الصافي",
    mainCategory: "linguistics",
    subCategory: "sarf",
    apiType: "book_sarf",
    isDownloaded: true,
  },

  // --- لغويات: بلاغة الآية ---
  {
    id: "book_balagha",
    title: "البلاغة",
    author: "محمود الصافي",
    mainCategory: "linguistics",
    subCategory: "balagha",
    apiType: "book_balagha",
    isDownloaded: true,
  },

  // --- علوم القرآن: أسباب النزول فقط ---
  {
    id: "muharrar_asbab",
    title: "المحرر في أسباب النزول",
    author: "د. خالد بن سليمان المزيني",
    mainCategory: "sciences",
    subCategory: "asbab",
    apiType: "muharrar_asbab",
    isDownloaded: true,
  },

  // --- تدبر: كتاب ليدبروا آياته بمجموعاته الخمس الكاملة ---
  {
    id: "book_tadabbur",
    title: "ليدبروا آياته (المجموعات الخمس كاملة)",
    author: "مركز تدبر للدراسات والبحوث القرآنية",
    description: "الموسوعة التدبرية الكاملة لكتاب «ليدبروا آياته» بمجموعاته الخمس، تجمع كل ما ورد في الآية من وقفات تدبرية ولطائف قرآنية موثقة.",
    mainCategory: "tadabbur",
    subCategory: "fawaid",
    apiType: "book_tadabbur",
    isDownloaded: true,
  },

  // --- المتشابهات: المتشابهات اللفظية وتوجيهها ---
  {
    id: "book_mutashabihat_saghir",
    title: "دليل المتشابهات اللفظية",
    author: "د. محمد بن عبد الله الصغير",
    mainCategory: "mutashabihat",
    subCategory: "mutashabihat_kutub",
    apiType: "book_mutashabihat_saghir",
    isDownloaded: true,
  },

  // --- كناشات: الكتب والآية ---
  {
    id: "user_notes_books",
    title: "ملاحظات الكتب",
    author: "كناشة المستخدم الشخصية",
    mainCategory: "notes",
    subCategory: "books_notes",
    isDownloaded: true,
  },
  {
    id: "user_notes_ayah",
    title: "ملاحظات الآية",
    author: "كناشة المستخدم الشخصية",
    mainCategory: "notes",
    subCategory: "ayah_notes",
    isDownloaded: true,
  }
];
