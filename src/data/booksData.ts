// 7 Main Categories
export type MainCategory = "tafsir" | "translations" | "linguistics" | "sciences" | "mutashabihat" | "tadabbur" | "notes";

// Sub-categories per main category
export type SubCategory = 
  | "mukhtasarat" | "mutawassitat" | "mutawwalat" // for tafsir
  | "english_translations" | "world_translations" // for translations
  | "garib" | "irab" | "sarf" | "balagha" | "maani" // for linguistics
  | "ahkam" | "asbab"                             // for sciences
  | "mutashabihat_kutub"                          // for mutashabihat
  | "fawaid"                                      // for tadabbur
  | "books_notes" | "ayah_notes";                // for notes

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

// Catalog of default library books
export const DEFAULT_BOOKS: LibraryBookItem[] = [
  // --- تفاسير: المختصرات ---
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
    id: "tafsir_mukhtasar",
    title: "المختصر في التفسير",
    author: "مركز تفسير للدراسات القرآنية",
    mainCategory: "tafsir",
    subCategory: "mukhtasarat",
    apiType: "tafsir_mukhtasar",
    isDownloaded: true,
  },

  // --- الترجمات المعتمدة ---
  {
    id: "english_rwwad",
    title: "رواد الترجمة (الإنجليزية)",
    author: "مركز رواد الترجمة (Rowwad Translation Center)",
    mainCategory: "translations",
    subCategory: "english_translations",
    apiType: "english_rwwad",
    isDownloaded: true,
  },
  {
    id: "english_saheeh",
    title: "صحيح إنترناشونال",
    author: "Sahih International (الإنجليزية)",
    mainCategory: "translations",
    subCategory: "english_translations",
    apiType: "english_saheeh",
    isDownloaded: true,
  },
  {
    id: "translation_hilali_khan",
    title: "الهلالي ومحسن خان",
    author: "د. محمد تقي الدين الهلالي ود. محمد محسن خان",
    mainCategory: "translations",
    subCategory: "english_translations",
    apiType: "english_hilali_khan",
    isDownloaded: true,
  },
  {
    id: "french_rashid",
    title: "الفرنسية (رشيد معاش)",
    author: "Rachid Maach (الفرنسية)",
    mainCategory: "translations",
    subCategory: "world_translations",
    apiType: "french_rashid",
    isDownloaded: true,
  },
  {
    id: "spanish_garcia",
    title: "الإسبانية (عيسى غارسيا)",
    author: "Isa Garcia (الإسبانية)",
    mainCategory: "translations",
    subCategory: "world_translations",
    apiType: "spanish_garcia",
    isDownloaded: true,
  },
  {
    id: "german_bubenheim",
    title: "الألمانية (بوبنهايم)",
    author: "Frank Bubenheim (الألمانية)",
    mainCategory: "translations",
    subCategory: "world_translations",
    apiType: "german_bubenheim",
    isDownloaded: true,
  },
  {
    id: "urdu_junagarhi",
    title: "الأردية (جوناكارهي)",
    author: "مولانا محمد جوناكارهي (الأردية)",
    mainCategory: "translations",
    subCategory: "world_translations",
    apiType: "urdu_junagarhi",
    isDownloaded: true,
  },
  {
    id: "turkish_shaban",
    title: "التركية (شعبان بريش)",
    author: "Şaban Piriş (التركية)",
    mainCategory: "translations",
    subCategory: "world_translations",
    apiType: "turkish_shaban",
    isDownloaded: true,
  },
  {
    id: "indonesian_affairs",
    title: "الإندونيسية (الشؤون الدينية)",
    author: "Kementerian Agama (الإندونيسية)",
    mainCategory: "translations",
    subCategory: "world_translations",
    apiType: "indonesian_affairs",
    isDownloaded: true,
  },
  {
    id: "russian_kuliev",
    title: "الروسية (إلمير كولييف)",
    author: "Elmir Kuliev (الروسية)",
    mainCategory: "translations",
    subCategory: "world_translations",
    apiType: "russian_kuliev",
    isDownloaded: true,
  },

  // --- تفاسير: المتوسطات ---
  {
    id: "tafsir_sadi",
    title: "السعدي",
    author: "الشيخ عبد الرحمن بن ناصر السعدي",
    mainCategory: "tafsir",
    subCategory: "mutawassitat",
    apiType: "tafsir_sadi",
    isDownloaded: true,
  },

  // --- تفاسير: المطولات ---
  {
    id: "tafsir_kathir",
    title: "ابن كثير",
    author: "الحافظ ابن كثير",
    mainCategory: "tafsir",
    subCategory: "mutawwalat",
    apiType: "tafsir_kathir",
    isDownloaded: true,
  },
  {
    id: "tafsir_tabari",
    title: "الطبري",
    author: "الإمام الطبري",
    mainCategory: "tafsir",
    subCategory: "mutawwalat",
    apiType: "tafsir_tabari",
    isDownloaded: true,
  },
  {
    id: "tafsir_qurtubi",
    title: "القرطبي",
    author: "الإمام القرطبي",
    mainCategory: "tafsir",
    subCategory: "mutawwalat",
    apiType: "tafsir_qurtubi",
    isDownloaded: true,
  },
  {
    id: "tafsir_baghawi",
    title: "البغوي",
    author: "الإمام البغوي",
    mainCategory: "tafsir",
    subCategory: "mutawwalat",
    apiType: "tafsir_baghawi",
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
    title: "الإعراب",
    author: "محمود الصافي",
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

  // --- علوم: أحكام القرآن وأسباب النزول ---
  {
    id: "ahkam_quran_jassas",
    title: "أحكام القرآن (الجصاص)",
    author: "أبو بكر الرازي الجصاص (ت: قمحاوي)",
    description: "كتاب أحكام القرآن للإمام أبي بكر أحمد بن علي الرازي الجصاص الحنفي (المتوفى: 370هـ)، بتحقيق الشيخ محمد صادق قمحاوي (دار إحياء التراث العربي).",
    mainCategory: "sciences",
    subCategory: "ahkam",
    apiType: "ahkam_quran_jassas",
    isDownloaded: true,
  },
  {
    id: "ahkam_quran_arabi",
    title: "أحكام القرآن (ابن العربي)",
    author: "ابن العربي",
    mainCategory: "sciences",
    subCategory: "ahkam",
    apiType: "ahkam_quran_arabi",
    isDownloaded: true,
  },
  {
    id: "muharrar_asbab",
    title: "المحرر في أسباب النزول",
    author: "د. خالد بن سليمان المزيني",
    mainCategory: "sciences",
    subCategory: "asbab",
    apiType: "muharrar_asbab",
    isDownloaded: true,
  },

  // --- تدبر: كتاب ليدبروا آياته ---
  {
    id: "book_tadabbur",
    title: "ليدبروا آياته",
    author: "مركز تدبر للدراسات القرآنية",
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
