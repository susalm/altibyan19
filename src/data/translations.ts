export interface TranslationKeys {
  appName: string;
  index: string;
  library: string;
  downloads: string;
  settings: string;
  mushaf: string;
  autoScroll: string;
  recitation: string;
  khatmah: string;
  bookmarks: string;
  tafsirs: string;
  appSettingsTitle: string;
  appSettingsSub: string;
  themeSelector: string;
  greenTheme: string;
  goldTheme: string;
  blueTheme: string;
  emeraldTheme: string;
  reciterSettingsTitle: string;
  defaultReciter: string;
  autoAdvanceText: string;
  displayOptionsTitle: string;
  narrationTitle: string;
  showTranslationText: string;
  showTranslationSub: string;
  fontSizeTitle: string;
  fontSizeSm: string;
  fontSizeMd: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontSize2xl: string;
  fontTypeTitle: string;
  uthmanicFont: string;
  simpleFont: string;
  autoScrollTitle: string;
  autoScrollEnable: string;
  autoScrollSub: string;
  scrollSpeed: string;
  slower: string;
  faster: string;
  speedDescriptionVerySlow: string;
  speedDescriptionNormal: string;
  speedDescriptionFast: string;
  speedDescriptionVeryFast: string;
  speedDescriptionUltraFast: string;
  instructionTitle: string;
  instructionSingleTap: string;
  instructionSingleTapDesc: string;
  instructionDoubleTap: string;
  instructionDoubleTapDesc: string;
  instructionScroll: string;
  instructionScrollDesc: string;
  aiSectionTitle: string;
  aiPrivacyDesc: string;
  aiModelDesc: string;
  aiLocalDataDesc: string;
  versionLabel: string;
  craftedWith: string;
  forQuran: string;
  appLanguageTitle: string;
  chooseLanguage: string;
  activeProjectsTitle: string;
  activeProjectsSub: string;
  loadingModules: string;
  noActiveModules: string;
  projectVersion: string;
  mushafSgLabel: string;
  audioRecitationLabel: string;
  tafsirLibraryLabel: string;
  aiChatCompanionLabel: string;
  dhikrLabel: string;
  khatmahLabel: string;
  searchPlaceholder: string;
  popularSurahs: string;
  juzs: string;
  surahs: string;
  hizbs: string;
  searchTitle: string;
  searchSub: string;
  allSurahs: string;
  totalAyahs: string;
  revelationPlace: string;
  meccan: string;
  medinan: string;
  lastOpened: string;
  resumeReading: string;
  noBookmarks: string;
  noBookmarksDesc: string;
  clearAll: string;
  hideMushafFrameLabel: string;
  hideMushafFrameDesc: string;
  stretchMushafLabel: string;
  stretchMushafDesc: string;
  readingModeTitle: string;
  readingModePage: string;
  readingModeContinuous: string;
  shareAyah: string;
}

export const translations: Record<"ar" | "en", TranslationKeys> = {
  ar: {
    appName: "مصحف التِّبيان",
    index: "الفهرس",
    library: "آية آية",
    downloads: "التحميل",
    settings: "الإعدادات",
    mushaf: "المصحف",
    autoScroll: "التمرير",
    recitation: "التلاوة",
    khatmah: "الختمة",
    bookmarks: "علاماتي",
    tafsirs: "آية آية",
    appSettingsTitle: "إعدادات التطبيق والتلاوة",
    appSettingsSub: "خصص أسلوب قراءة وترتيل القرآن بالشكل الذي يناسبك",
    themeSelector: "سمة المصحف والتطبيق (الألوان والمظهر)",
    greenTheme: "أخضر",
    goldTheme: "ذهبي",
    blueTheme: "أزرق",
    emeraldTheme: "زمردي",
    reciterSettingsTitle: "إعدادات التلاوة والصوت (الترتيل المفضل)",
    defaultReciter: "القارئ الافتراضي",
    autoAdvanceText: "التشغيل الصوتي التلقائي المتتالي (الآية التي تليها)",
    displayOptionsTitle: "خيارات العرض والمصحف",
    narrationTitle: "رواية وطبعة المصحف الشريف",
    showTranslationText: "عرض الترجمة الإنجليزية",
    showTranslationSub: "عرض معاني الآيات الكريمة تحت النص العربي مباشرة",
    fontSizeTitle: "حجم خط الآيات الافتراضي",
    fontSizeSm: "صغير",
    fontSizeMd: "متطابق",
    fontSizeLg: "متوسط",
    fontSizeXl: "كبير",
    fontSize2xl: "ضخم",
    fontTypeTitle: "نوع خط الآيات",
    uthmanicFont: "✍️ الخط العثماني اليدوي (حفص)",
    simpleFont: "📝 الخط الإملائي العادي",
    autoScrollTitle: "خدمة تمرير الصفحة التلقائي للقراءة",
    autoScrollEnable: "تفعيل التمرير التلقائي لأسفل",
    autoScrollSub: "قم بتفعيل هذا الخيار لتقرأ وردك دون لمس الشاشة باستمرار",
    scrollSpeed: "سرعة التمرير",
    slower: "أبطأ",
    faster: "أسرع",
    speedDescriptionVerySlow: "بطيء جداً للتأمل والتلاوة المتأنية",
    speedDescriptionNormal: "معتدل للقراءة العادية المريحة",
    speedDescriptionFast: "سريع للمراجعة والحفظ",
    speedDescriptionVeryFast: "سريع جداً للتسميع السريع",
    speedDescriptionUltraFast: "فائق السرعة (تصفح سريع)",
    instructionTitle: "إرشادات التفاعل الذكي أثناء القراءة:",
    instructionSingleTap: "نقرة واحدة:",
    instructionSingleTapDesc: "تخفي وتظهر أشرطة الخيارات العلوية والسفلية للمصحف فوراً.",
    instructionDoubleTap: "نقرتان متتاليتان (مزدوجة):",
    instructionDoubleTapDesc: "لفتح نافذة تفسير الآية الكريمة المحددة والذكاء الاصطناعي.",
    instructionScroll: "شريط التحكم السفلي:",
    instructionScrollDesc: "يظهر تلقائياً أثناء القراءة لتعديل السرعة أو إيقافها مؤقتاً بيسر.",
    aiSectionTitle: "أمن البيانات ونموذج الذكاء الاصطناعي",
    aiPrivacyDesc: "تتم جميع اتصالات التفسير والبحث بالذكاء الاصطناعي من خلال الخادم الخلفي الآمن (Secure Server) لحفظ خصوصيتك بنسبة 100%.",
    aiModelDesc: "التطبيق مدعوم بأحدث طرازات الذكاء الاصطناعي من Google لضمان سرعة رد فائقة ودقة متناهية في التفسير والاستنباط.",
    aiLocalDataDesc: "بيانات حفظ المواضع (🔖) والمفضلة مخزنة محلياً في جهازك لضمان عودتك لقراءتها في جلسة القراءة المقبلة بكل يسر.",
    versionLabel: "الإصدار: v1.0.0 Stable",
    craftedWith: "صنع بكل",
    forQuran: "لأجل القرآن الكريم",
    appLanguageTitle: "لغة التطبيق / App Language",
    chooseLanguage: "اختر لغة واجهة المستخدم / Choose UI Language",
    activeProjectsTitle: "المشاريع النشطة ومكونات الملف الجديد",
    activeProjectsSub: "صفحات ومكونات المشروع الحالية:",
    loadingModules: "جاري الاستعلام عن موديولات النظام النشطة...",
    noActiveModules: "لا توجد موديولات نشطة حالياً في الخادم.",
    projectVersion: "إصدار",
    mushafSgLabel: "مصحف رواية حفص التفاعلي (SVG)",
    audioRecitationLabel: "التلاوة والتجويد الصوتي",
    tafsirLibraryLabel: "مكتبة التفسير والتدبر",
    aiChatCompanionLabel: "معلم التدبر بالذكاء الاصطناعي",
    dhikrLabel: "السبحة الأورادية والأذكار",
    khatmahLabel: "منظم الختمات القرآنية",
    searchPlaceholder: "ابحث بالسورة أو الجزء أو الصفحة أو الكلمة...",
    popularSurahs: "سور شائعة",
    juzs: "الأجزاء",
    surahs: "السور",
    hizbs: "الأحزاب",
    searchTitle: "البحث المتقدم في المصحف والتفاسير",
    searchSub: "اكتب كلمات البحث أو أرقام الآيات للوصول الفوري للتفاسير والنتائج",
    allSurahs: "جميع السور",
    totalAyahs: "آياتها",
    revelationPlace: "النزول",
    meccan: "مكية",
    medinan: "مدنية",
    lastOpened: "آخر موضع قراءة",
    resumeReading: "متابعة القراءة",
    noBookmarks: "لا توجد علامات محفوظة",
    noBookmarksDesc: "احفظ الآيات للرجوع إليها سريعاً بالنقر المزدوج على الآية",
    clearAll: "مسح الكل",
    hideMushafFrameLabel: "إخفاء إطار المصحف",
    hideMushafFrameDesc: "إخفاء الزخرفة والإطار الجانبي لصفحات المصحف (النمط التفاعلي SVG) لزيادة مساحة النص واختصاره",
    stretchMushafLabel: "تمديد آيات المصحف عرضاً",
    stretchMushafDesc: "تمديد آيات وصفحات المصحف لتمتد وتتمدد لتملأ الشاشة عرضاً لتسهيل القراءة وتكبير الحجم",
    readingModeTitle: "نمط عرض القراءة الافتراضي",
    readingModePage: "القراءة بالصفحة (عرض المصحف)",
    readingModeContinuous: "القراءة آية آية (عرض متتالي)",
    shareAyah: "مشاركة",
  },
  en: {
    appName: "Tebyan Mushaf",
    index: "Index",
    library: "Verse by Verse",
    downloads: "Downloads",
    settings: "Settings",
    mushaf: "Mushaf",
    autoScroll: "Scroll",
    recitation: "Recitation",
    khatmah: "Khatmah",
    bookmarks: "Bookmarks",
    tafsirs: "Verse by Verse",
    appSettingsTitle: "App & Recitation Settings",
    appSettingsSub: "Customize your Quran reading & recitation style as you prefer",
    themeSelector: "Mushaf & App Theme (Colors & Appearance)",
    greenTheme: "Green",
    goldTheme: "Gold",
    blueTheme: "Blue",
    emeraldTheme: "Emerald",
    reciterSettingsTitle: "Recitation & Audio Settings",
    defaultReciter: "Default Reciter",
    autoAdvanceText: "Continuous Audio Playback (Auto-Advance)",
    displayOptionsTitle: "Display & Mushaf Options",
    narrationTitle: "Quran Narration & Edition",
    showTranslationText: "English Translation",
    showTranslationSub: "Show English meaning directly below Arabic text",
    fontSizeTitle: "Default Verse Font Size",
    fontSizeSm: "Small",
    fontSizeMd: "Regular",
    fontSizeLg: "Medium",
    fontSizeXl: "Large",
    fontSize2xl: "Huge",
    fontTypeTitle: "Quran Font Type",
    uthmanicFont: "✍️ Uthmanic Script (Hafs)",
    simpleFont: "📝 Simple Amiri Font",
    autoScrollTitle: "Auto-Scroll Page Service",
    autoScrollEnable: "Enable Auto Scroll Down",
    autoScrollSub: "Activate this to read your daily portion without continuous screen touches",
    scrollSpeed: "Scroll Speed",
    slower: "Slower",
    faster: "Faster",
    speedDescriptionVerySlow: "Very slow for deep contemplation and slow recitation",
    speedDescriptionNormal: "Moderate for comfortable regular reading",
    speedDescriptionFast: "Fast for review and memorization",
    speedDescriptionVeryFast: "Very fast for quick revision",
    speedDescriptionUltraFast: "Ultra fast speed (quick scanning)",
    instructionTitle: "Smart Interaction Tips While Reading:",
    instructionSingleTap: "Single Tap:",
    instructionSingleTapDesc: "Instantly toggle the visibility of the top and bottom option bars.",
    instructionDoubleTap: "Double Tap:",
    instructionDoubleTapDesc: "To open the interpretation (Tafsir) of the selected verse and AI companion.",
    instructionScroll: "Bottom Controller:",
    instructionScrollDesc: "Appears automatically while reading to adjust or pause scroll speed easily.",
    aiSectionTitle: "Data Security & AI Model",
    aiPrivacyDesc: "All interpretation and AI-powered searches run via a Secure Server to guarantee 100% privacy.",
    aiModelDesc: "The application is powered by Google's latest AI models for high performance and deep understanding.",
    aiLocalDataDesc: "Last read positions (🔖) and bookmarks are saved locally on your device for easy resume.",
    versionLabel: "Version: v1.0.0 Stable",
    craftedWith: "Crafted with",
    forQuran: "for the Holy Quran",
    appLanguageTitle: "App Language / لغة التطبيق",
    chooseLanguage: "Choose UI Language / اختر لغة واجهة المستخدم",
    activeProjectsTitle: "Active Projects & Components",
    activeProjectsSub: "Current project pages and components:",
    loadingModules: "Querying active system modules...",
    noActiveModules: "No active modules on the server currently.",
    projectVersion: "v",
    mushafSgLabel: "Interactive Hafs Mushaf (SVG)",
    audioRecitationLabel: "Audio Recitation & Tajweed",
    tafsirLibraryLabel: "Tafsir & Contemplation Library",
    aiChatCompanionLabel: "AI Tafsir Contemplation Companion",
    dhikrLabel: "Adhkar & Electronic Rosary",
    khatmahLabel: "Quranic Khatmah Planner",
    searchPlaceholder: "Search surah, juz, page, or word...",
    popularSurahs: "Popular Surahs",
    juzs: "Juzs",
    surahs: "Surahs",
    hizbs: "Hizbs",
    searchTitle: "Advanced Quran & Tafsir Search",
    searchSub: "Type search terms or verse numbers for instant Tafsir and results",
    allSurahs: "All Surahs",
    totalAyahs: "Ayahs",
    revelationPlace: "Revelation",
    meccan: "Meccan",
    medinan: "Medinan",
    lastOpened: "Last read position",
    resumeReading: "Resume Reading",
    noBookmarks: "No bookmarks saved",
    noBookmarksDesc: "Save verses to refer back easily by double tapping any verse",
    clearAll: "Clear All",
    hideMushafFrameLabel: "Hide Page Border",
    hideMushafFrameDesc: "Hide decorative borders and frames around pages (Interactive SVG mode) to maximize text area",
    stretchMushafLabel: "Stretch Mushaf Verses",
    stretchMushafDesc: "Stretch Mushaf vector pages and text lines to fit the full width of the screen for larger words and better readability",
    readingModeTitle: "Default Reading Display Mode",
    readingModePage: "Page-by-Page (Mushaf View)",
    readingModeContinuous: "Ayah-by-Ayah (Continuous View)",
    shareAyah: "Share",
  }
};
