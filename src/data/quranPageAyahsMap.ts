import { quranSvgPageMetadata } from "./quranSvgPageMetadata";
import { surahsList } from "./surahList";

export interface PageAyahRange {
  page: number;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  surahNameAr?: string;
}

export function getAyahsForPage(pageNum: number): PageAyahRange | null {
  const safePage = Math.max(1, Math.min(pageNum, 604));
  const meta = quranSvgPageMetadata.find((p) => p.page === safePage);
  if (!meta) {
    return {
      page: safePage,
      surahNumber: 1,
      startAyah: 1,
      endAyah: 7,
      surahNameAr: "الفاتحة",
    };
  }

  const surah = surahsList.find((s) => s.number === meta.surahNumber);

  return {
    page: safePage,
    surahNumber: meta.surahNumber,
    startAyah: 1,
    endAyah: surah ? surah.numberOfAyahs : 7,
    surahNameAr: meta.surahNameAr,
  };
}
