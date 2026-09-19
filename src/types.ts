export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
  arabicType: "مكية" | "مدنية";
  juzStart?: number;
}

export interface Ayah {
  number: number;         // Overall Quranic number
  numberInSurah: number;  // Number within the specific Surah
  text: string;
  translationEn: string;
  audio?: string;
  ayahKey?: string;       // e.g. "1:1"
  page?: number;          // Page number in Medina Mushaf
  juz?: number;
}

export interface Bookmark {
  id: string;
  surahNumber: number;
  surahName: string;
  ayahNumber?: number; // Optional, can be bookmarking the whole Surah or a specific Ayah
  timestamp: string;
  category?: "reading" | "revision" | "memorization" | "contemplation";
}

export interface Dhikr {
  id: string;
  category: "morning" | "evening" | "sleeping" | "after_prayer" | "prophetic";
  categoryAr: string;
  text: string;
  count: number; // target repetitions
  currentCount: number; // progress tracker
  benefit?: string;
  source?: string;
}

export interface Reciter {
  id: string;
  nameAr: string;
  nameEn: string;
  apiSubfolder: string; // Folder mapping on Alafasy, Al-Ghamdi, Al-Husary, etc.
}

export interface QuranSettings {
  fontSize: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  showTranslation: boolean;
  reciterId: string;
  colorTajweed: boolean;
  pageMode: "continuous" | "page-by-page" | "mushaf-svg" | "qcf4";
  autoAdvance: boolean;
  autoScrollSpeed?: number;
  autoScrollActive?: boolean;
  quranFont?: "uthmanic" | "amiri" | "naskh" | "scheherazade" | "traditional" | "qcf4";
  mushafProvider?: "quran-svg" | "quran-tajweed" | "qcf4";
  language?: "ar" | "en";
  hideMushafFrame?: boolean;
  stretchMushaf?: boolean;
  scrollDirection?: "horizontal" | "vertical";
  showQbsmlHeaders?: boolean;
  appIcon?: "default" | "alt";
  customAltIconUrl?: string;
}
