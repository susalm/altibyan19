export interface PageMetadata {
  page: number;
  juz: number;
  hizb: number;
  surahNumber: number;
  surahNameAr: string;
  surahNameEn: string;
  quarterPart: string;
}

export const surahStartPages: number[] = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594, 
  595, 595, 596, 596, 597, 597, 598, 598, 599, 599, 
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 
  603, 604, 604, 604
];

export function getSurahStartPage(surahNumber: number): number {
  if (surahNumber >= 1 && surahNumber <= 114) {
    return surahStartPages[surahNumber - 1];
  }
  return 1;
}

export const quranSvgPageMetadata: PageMetadata[] = [
  {
    "page": 1,
    "juz": 1,
    "hizb": 1,
    "surahNumber": 1,
    "surahNameAr": "الفاتحة",
    "surahNameEn": "Al-Fatiha",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 2,
    "juz": 1,
    "hizb": 1,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 3,
    "juz": 1,
    "hizb": 1,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 4,
    "juz": 1,
    "hizb": 1,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 5,
    "juz": 1,
    "hizb": 1,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 6,
    "juz": 1,
    "hizb": 1,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 7,
    "juz": 1,
    "hizb": 1,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 8,
    "juz": 1,
    "hizb": 1,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 9,
    "juz": 1,
    "hizb": 1,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 10,
    "juz": 1,
    "hizb": 1,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 11,
    "juz": 1,
    "hizb": 1,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 12,
    "juz": 1,
    "hizb": 2,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 13,
    "juz": 1,
    "hizb": 2,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 14,
    "juz": 1,
    "hizb": 2,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 15,
    "juz": 1,
    "hizb": 2,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 16,
    "juz": 1,
    "hizb": 2,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 17,
    "juz": 1,
    "hizb": 2,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 18,
    "juz": 1,
    "hizb": 2,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 19,
    "juz": 1,
    "hizb": 2,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 20,
    "juz": 1,
    "hizb": 2,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 21,
    "juz": 1,
    "hizb": 2,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 22,
    "juz": 2,
    "hizb": 3,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 23,
    "juz": 2,
    "hizb": 3,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 24,
    "juz": 2,
    "hizb": 3,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 25,
    "juz": 2,
    "hizb": 3,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 26,
    "juz": 2,
    "hizb": 3,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 27,
    "juz": 2,
    "hizb": 3,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 28,
    "juz": 2,
    "hizb": 3,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 29,
    "juz": 2,
    "hizb": 3,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 30,
    "juz": 2,
    "hizb": 3,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 31,
    "juz": 2,
    "hizb": 3,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 32,
    "juz": 2,
    "hizb": 4,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 33,
    "juz": 2,
    "hizb": 4,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 34,
    "juz": 2,
    "hizb": 4,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 35,
    "juz": 2,
    "hizb": 4,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 36,
    "juz": 2,
    "hizb": 4,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 37,
    "juz": 2,
    "hizb": 4,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 38,
    "juz": 2,
    "hizb": 4,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 39,
    "juz": 2,
    "hizb": 4,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 40,
    "juz": 2,
    "hizb": 4,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 41,
    "juz": 2,
    "hizb": 4,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 42,
    "juz": 3,
    "hizb": 5,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 43,
    "juz": 3,
    "hizb": 5,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 44,
    "juz": 3,
    "hizb": 5,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 45,
    "juz": 3,
    "hizb": 5,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 46,
    "juz": 3,
    "hizb": 5,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 47,
    "juz": 3,
    "hizb": 5,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 48,
    "juz": 3,
    "hizb": 5,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 49,
    "juz": 3,
    "hizb": 5,
    "surahNumber": 2,
    "surahNameAr": "البقرة",
    "surahNameEn": "Al-Baqara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 50,
    "juz": 3,
    "hizb": 5,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 51,
    "juz": 3,
    "hizb": 5,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 52,
    "juz": 3,
    "hizb": 6,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 53,
    "juz": 3,
    "hizb": 6,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 54,
    "juz": 3,
    "hizb": 6,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 55,
    "juz": 3,
    "hizb": 6,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 56,
    "juz": 3,
    "hizb": 6,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 57,
    "juz": 3,
    "hizb": 6,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 58,
    "juz": 3,
    "hizb": 6,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 59,
    "juz": 3,
    "hizb": 6,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 60,
    "juz": 3,
    "hizb": 6,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 61,
    "juz": 3,
    "hizb": 6,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 62,
    "juz": 3,
    "hizb": 6,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 63,
    "juz": 4,
    "hizb": 7,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 64,
    "juz": 4,
    "hizb": 7,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 65,
    "juz": 4,
    "hizb": 7,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 66,
    "juz": 4,
    "hizb": 7,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 67,
    "juz": 4,
    "hizb": 7,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 68,
    "juz": 4,
    "hizb": 7,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 69,
    "juz": 4,
    "hizb": 7,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 70,
    "juz": 4,
    "hizb": 7,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 71,
    "juz": 4,
    "hizb": 7,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 72,
    "juz": 4,
    "hizb": 7,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 73,
    "juz": 4,
    "hizb": 8,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 74,
    "juz": 4,
    "hizb": 8,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 75,
    "juz": 4,
    "hizb": 8,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 76,
    "juz": 4,
    "hizb": 8,
    "surahNumber": 3,
    "surahNameAr": "آل عمران",
    "surahNameEn": "Aal 'Imran",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 77,
    "juz": 4,
    "hizb": 8,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 78,
    "juz": 4,
    "hizb": 8,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 79,
    "juz": 4,
    "hizb": 8,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 80,
    "juz": 4,
    "hizb": 8,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 81,
    "juz": 4,
    "hizb": 8,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 82,
    "juz": 5,
    "hizb": 9,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 83,
    "juz": 5,
    "hizb": 9,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 84,
    "juz": 5,
    "hizb": 9,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 85,
    "juz": 5,
    "hizb": 9,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 86,
    "juz": 5,
    "hizb": 9,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 87,
    "juz": 5,
    "hizb": 9,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 88,
    "juz": 5,
    "hizb": 9,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 89,
    "juz": 5,
    "hizb": 9,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 90,
    "juz": 5,
    "hizb": 9,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 91,
    "juz": 5,
    "hizb": 9,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 92,
    "juz": 5,
    "hizb": 9,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 93,
    "juz": 5,
    "hizb": 10,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 94,
    "juz": 5,
    "hizb": 10,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 95,
    "juz": 5,
    "hizb": 10,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 96,
    "juz": 5,
    "hizb": 10,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 97,
    "juz": 5,
    "hizb": 10,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 98,
    "juz": 5,
    "hizb": 10,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 99,
    "juz": 5,
    "hizb": 10,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 100,
    "juz": 5,
    "hizb": 10,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 101,
    "juz": 5,
    "hizb": 10,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 102,
    "juz": 6,
    "hizb": 11,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 103,
    "juz": 6,
    "hizb": 11,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 104,
    "juz": 6,
    "hizb": 11,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 105,
    "juz": 6,
    "hizb": 11,
    "surahNumber": 4,
    "surahNameAr": "النساء",
    "surahNameEn": "An-Nisa",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 106,
    "juz": 6,
    "hizb": 11,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 107,
    "juz": 6,
    "hizb": 11,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 108,
    "juz": 6,
    "hizb": 11,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 109,
    "juz": 6,
    "hizb": 11,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 110,
    "juz": 6,
    "hizb": 11,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 111,
    "juz": 6,
    "hizb": 11,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 112,
    "juz": 6,
    "hizb": 11,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 113,
    "juz": 6,
    "hizb": 12,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 114,
    "juz": 6,
    "hizb": 12,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 115,
    "juz": 6,
    "hizb": 12,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 116,
    "juz": 6,
    "hizb": 12,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 117,
    "juz": 6,
    "hizb": 12,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 118,
    "juz": 6,
    "hizb": 12,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 119,
    "juz": 6,
    "hizb": 12,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 120,
    "juz": 6,
    "hizb": 12,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 121,
    "juz": 6,
    "hizb": 12,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 122,
    "juz": 7,
    "hizb": 13,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 123,
    "juz": 7,
    "hizb": 13,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 124,
    "juz": 7,
    "hizb": 13,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 125,
    "juz": 7,
    "hizb": 13,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 126,
    "juz": 7,
    "hizb": 13,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 127,
    "juz": 7,
    "hizb": 13,
    "surahNumber": 5,
    "surahNameAr": "المائدة",
    "surahNameEn": "Al-Ma'ida",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 128,
    "juz": 7,
    "hizb": 13,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 129,
    "juz": 7,
    "hizb": 13,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 130,
    "juz": 7,
    "hizb": 13,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 131,
    "juz": 7,
    "hizb": 13,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 132,
    "juz": 7,
    "hizb": 14,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 133,
    "juz": 7,
    "hizb": 14,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 134,
    "juz": 7,
    "hizb": 14,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 135,
    "juz": 7,
    "hizb": 14,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 136,
    "juz": 7,
    "hizb": 14,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 137,
    "juz": 7,
    "hizb": 14,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 138,
    "juz": 7,
    "hizb": 14,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 139,
    "juz": 7,
    "hizb": 14,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 140,
    "juz": 7,
    "hizb": 14,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 141,
    "juz": 7,
    "hizb": 14,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 142,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 143,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 144,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 145,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 146,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 147,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 148,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 149,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 150,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 6,
    "surahNameAr": "الأنعام",
    "surahNameEn": "Al-An'am",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 151,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 152,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 153,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 154,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 155,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 156,
    "juz": 8,
    "hizb": 15,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 157,
    "juz": 8,
    "hizb": 16,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 158,
    "juz": 8,
    "hizb": 16,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 159,
    "juz": 8,
    "hizb": 16,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 160,
    "juz": 8,
    "hizb": 16,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 161,
    "juz": 8,
    "hizb": 16,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 162,
    "juz": 9,
    "hizb": 17,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 163,
    "juz": 9,
    "hizb": 17,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 164,
    "juz": 9,
    "hizb": 17,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 165,
    "juz": 9,
    "hizb": 17,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 166,
    "juz": 9,
    "hizb": 17,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 167,
    "juz": 9,
    "hizb": 17,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 168,
    "juz": 9,
    "hizb": 17,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 169,
    "juz": 9,
    "hizb": 17,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 170,
    "juz": 9,
    "hizb": 17,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 171,
    "juz": 9,
    "hizb": 17,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 172,
    "juz": 9,
    "hizb": 17,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 173,
    "juz": 9,
    "hizb": 18,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 174,
    "juz": 9,
    "hizb": 18,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 175,
    "juz": 9,
    "hizb": 18,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 176,
    "juz": 9,
    "hizb": 18,
    "surahNumber": 7,
    "surahNameAr": "الأعراف",
    "surahNameEn": "Al-A'raf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 177,
    "juz": 9,
    "hizb": 18,
    "surahNumber": 8,
    "surahNameAr": "الأنفال",
    "surahNameEn": "Al-Anfal",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 178,
    "juz": 9,
    "hizb": 18,
    "surahNumber": 8,
    "surahNameAr": "الأنفال",
    "surahNameEn": "Al-Anfal",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 179,
    "juz": 9,
    "hizb": 18,
    "surahNumber": 8,
    "surahNameAr": "الأنفال",
    "surahNameEn": "Al-Anfal",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 180,
    "juz": 9,
    "hizb": 18,
    "surahNumber": 8,
    "surahNameAr": "الأنفال",
    "surahNameEn": "Al-Anfal",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 181,
    "juz": 9,
    "hizb": 18,
    "surahNumber": 8,
    "surahNameAr": "الأنفال",
    "surahNameEn": "Al-Anfal",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 182,
    "juz": 10,
    "hizb": 19,
    "surahNumber": 8,
    "surahNameAr": "الأنفال",
    "surahNameEn": "Al-Anfal",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 183,
    "juz": 10,
    "hizb": 19,
    "surahNumber": 8,
    "surahNameAr": "الأنفال",
    "surahNameEn": "Al-Anfal",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 184,
    "juz": 10,
    "hizb": 19,
    "surahNumber": 8,
    "surahNameAr": "الأنفال",
    "surahNameEn": "Al-Anfal",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 185,
    "juz": 10,
    "hizb": 19,
    "surahNumber": 8,
    "surahNameAr": "الأنفال",
    "surahNameEn": "Al-Anfal",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 186,
    "juz": 10,
    "hizb": 19,
    "surahNumber": 8,
    "surahNameAr": "الأنفال",
    "surahNameEn": "Al-Anfal",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 187,
    "juz": 10,
    "hizb": 19,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 188,
    "juz": 10,
    "hizb": 19,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 189,
    "juz": 10,
    "hizb": 19,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 190,
    "juz": 10,
    "hizb": 19,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 191,
    "juz": 10,
    "hizb": 19,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 192,
    "juz": 10,
    "hizb": 19,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 193,
    "juz": 10,
    "hizb": 20,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 194,
    "juz": 10,
    "hizb": 20,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 195,
    "juz": 10,
    "hizb": 20,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 196,
    "juz": 10,
    "hizb": 20,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 197,
    "juz": 10,
    "hizb": 20,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 198,
    "juz": 10,
    "hizb": 20,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 199,
    "juz": 10,
    "hizb": 20,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 200,
    "juz": 10,
    "hizb": 20,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 201,
    "juz": 10,
    "hizb": 20,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 202,
    "juz": 11,
    "hizb": 21,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 203,
    "juz": 11,
    "hizb": 21,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 204,
    "juz": 11,
    "hizb": 21,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 205,
    "juz": 11,
    "hizb": 21,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 206,
    "juz": 11,
    "hizb": 21,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 207,
    "juz": 11,
    "hizb": 21,
    "surahNumber": 9,
    "surahNameAr": "التوبة",
    "surahNameEn": "At-Tawba",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 208,
    "juz": 11,
    "hizb": 21,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 209,
    "juz": 11,
    "hizb": 21,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 210,
    "juz": 11,
    "hizb": 21,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 211,
    "juz": 11,
    "hizb": 21,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 212,
    "juz": 11,
    "hizb": 22,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 213,
    "juz": 11,
    "hizb": 22,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 214,
    "juz": 11,
    "hizb": 22,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 215,
    "juz": 11,
    "hizb": 22,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 216,
    "juz": 11,
    "hizb": 22,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 217,
    "juz": 11,
    "hizb": 22,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 218,
    "juz": 11,
    "hizb": 22,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 219,
    "juz": 11,
    "hizb": 22,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 220,
    "juz": 11,
    "hizb": 22,
    "surahNumber": 10,
    "surahNameAr": "يونس",
    "surahNameEn": "Yunus",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 221,
    "juz": 11,
    "hizb": 22,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 222,
    "juz": 12,
    "hizb": 23,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 223,
    "juz": 12,
    "hizb": 23,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 224,
    "juz": 12,
    "hizb": 23,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 225,
    "juz": 12,
    "hizb": 23,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 226,
    "juz": 12,
    "hizb": 23,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 227,
    "juz": 12,
    "hizb": 23,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 228,
    "juz": 12,
    "hizb": 23,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 229,
    "juz": 12,
    "hizb": 23,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 230,
    "juz": 12,
    "hizb": 23,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 231,
    "juz": 12,
    "hizb": 23,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 232,
    "juz": 12,
    "hizb": 24,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 233,
    "juz": 12,
    "hizb": 24,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 234,
    "juz": 12,
    "hizb": 24,
    "surahNumber": 11,
    "surahNameAr": "هود",
    "surahNameEn": "Hud",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 235,
    "juz": 12,
    "hizb": 24,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 236,
    "juz": 12,
    "hizb": 24,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 237,
    "juz": 12,
    "hizb": 24,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 238,
    "juz": 12,
    "hizb": 24,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 239,
    "juz": 12,
    "hizb": 24,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 240,
    "juz": 12,
    "hizb": 24,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 241,
    "juz": 12,
    "hizb": 24,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 242,
    "juz": 13,
    "hizb": 25,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 243,
    "juz": 13,
    "hizb": 25,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 244,
    "juz": 13,
    "hizb": 25,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 245,
    "juz": 13,
    "hizb": 25,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 246,
    "juz": 13,
    "hizb": 25,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 247,
    "juz": 13,
    "hizb": 25,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 248,
    "juz": 13,
    "hizb": 25,
    "surahNumber": 12,
    "surahNameAr": "يوسف",
    "surahNameEn": "Yusuf",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 249,
    "juz": 13,
    "hizb": 25,
    "surahNumber": 13,
    "surahNameAr": "الرعد",
    "surahNameEn": "Ar-Ra'd",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 250,
    "juz": 13,
    "hizb": 25,
    "surahNumber": 13,
    "surahNameAr": "الرعد",
    "surahNameEn": "Ar-Ra'd",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 251,
    "juz": 13,
    "hizb": 25,
    "surahNumber": 13,
    "surahNameAr": "الرعد",
    "surahNameEn": "Ar-Ra'd",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 252,
    "juz": 13,
    "hizb": 26,
    "surahNumber": 13,
    "surahNameAr": "الرعد",
    "surahNameEn": "Ar-Ra'd",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 253,
    "juz": 13,
    "hizb": 26,
    "surahNumber": 13,
    "surahNameAr": "الرعد",
    "surahNameEn": "Ar-Ra'd",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 254,
    "juz": 13,
    "hizb": 26,
    "surahNumber": 13,
    "surahNameAr": "الرعد",
    "surahNameEn": "Ar-Ra'd",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 255,
    "juz": 13,
    "hizb": 26,
    "surahNumber": 14,
    "surahNameAr": "ابراهيم",
    "surahNameEn": "Ibrahim",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 256,
    "juz": 13,
    "hizb": 26,
    "surahNumber": 14,
    "surahNameAr": "ابراهيم",
    "surahNameEn": "Ibrahim",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 257,
    "juz": 13,
    "hizb": 26,
    "surahNumber": 14,
    "surahNameAr": "ابراهيم",
    "surahNameEn": "Ibrahim",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 258,
    "juz": 13,
    "hizb": 26,
    "surahNumber": 14,
    "surahNameAr": "ابراهيم",
    "surahNameEn": "Ibrahim",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 259,
    "juz": 13,
    "hizb": 26,
    "surahNumber": 14,
    "surahNameAr": "ابراهيم",
    "surahNameEn": "Ibrahim",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 260,
    "juz": 13,
    "hizb": 26,
    "surahNumber": 14,
    "surahNameAr": "ابراهيم",
    "surahNameEn": "Ibrahim",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 261,
    "juz": 13,
    "hizb": 26,
    "surahNumber": 14,
    "surahNameAr": "ابراهيم",
    "surahNameEn": "Ibrahim",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 262,
    "juz": 14,
    "hizb": 27,
    "surahNumber": 15,
    "surahNameAr": "الحجر",
    "surahNameEn": "Al-Hijr",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 263,
    "juz": 14,
    "hizb": 27,
    "surahNumber": 15,
    "surahNameAr": "الحجر",
    "surahNameEn": "Al-Hijr",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 264,
    "juz": 14,
    "hizb": 27,
    "surahNumber": 15,
    "surahNameAr": "الحجر",
    "surahNameEn": "Al-Hijr",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 265,
    "juz": 14,
    "hizb": 27,
    "surahNumber": 15,
    "surahNameAr": "الحجر",
    "surahNameEn": "Al-Hijr",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 266,
    "juz": 14,
    "hizb": 27,
    "surahNumber": 15,
    "surahNameAr": "الحجر",
    "surahNameEn": "Al-Hijr",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 267,
    "juz": 14,
    "hizb": 27,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 268,
    "juz": 14,
    "hizb": 27,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 269,
    "juz": 14,
    "hizb": 27,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 270,
    "juz": 14,
    "hizb": 27,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 271,
    "juz": 14,
    "hizb": 27,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 272,
    "juz": 14,
    "hizb": 27,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 273,
    "juz": 14,
    "hizb": 28,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 274,
    "juz": 14,
    "hizb": 28,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 275,
    "juz": 14,
    "hizb": 28,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 276,
    "juz": 14,
    "hizb": 28,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 277,
    "juz": 14,
    "hizb": 28,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 278,
    "juz": 14,
    "hizb": 28,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 279,
    "juz": 14,
    "hizb": 28,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 280,
    "juz": 14,
    "hizb": 28,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 281,
    "juz": 14,
    "hizb": 28,
    "surahNumber": 16,
    "surahNameAr": "النحل",
    "surahNameEn": "An-Nahl",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 282,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 17,
    "surahNameAr": "الإسراء",
    "surahNameEn": "Al-Israa",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 283,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 17,
    "surahNameAr": "الإسراء",
    "surahNameEn": "Al-Israa",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 284,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 17,
    "surahNameAr": "الإسراء",
    "surahNameEn": "Al-Israa",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 285,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 17,
    "surahNameAr": "الإسراء",
    "surahNameEn": "Al-Israa",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 286,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 17,
    "surahNameAr": "الإسراء",
    "surahNameEn": "Al-Israa",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 287,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 17,
    "surahNameAr": "الإسراء",
    "surahNameEn": "Al-Israa",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 288,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 17,
    "surahNameAr": "الإسراء",
    "surahNameEn": "Al-Israa",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 289,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 17,
    "surahNameAr": "الإسراء",
    "surahNameEn": "Al-Israa",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 290,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 17,
    "surahNameAr": "الإسراء",
    "surahNameEn": "Al-Israa",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 291,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 17,
    "surahNameAr": "الإسراء",
    "surahNameEn": "Al-Israa",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 292,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 17,
    "surahNameAr": "الإسراء",
    "surahNameEn": "Al-Israa",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 293,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 18,
    "surahNameAr": "الكهف",
    "surahNameEn": "Al-Kahf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 294,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 18,
    "surahNameAr": "الكهف",
    "surahNameEn": "Al-Kahf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 295,
    "juz": 15,
    "hizb": 29,
    "surahNumber": 18,
    "surahNameAr": "الكهف",
    "surahNameEn": "Al-Kahf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 296,
    "juz": 15,
    "hizb": 30,
    "surahNumber": 18,
    "surahNameAr": "الكهف",
    "surahNameEn": "Al-Kahf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 297,
    "juz": 15,
    "hizb": 30,
    "surahNumber": 18,
    "surahNameAr": "الكهف",
    "surahNameEn": "Al-Kahf",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 298,
    "juz": 15,
    "hizb": 30,
    "surahNumber": 18,
    "surahNameAr": "الكهف",
    "surahNameEn": "Al-Kahf",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 299,
    "juz": 15,
    "hizb": 30,
    "surahNumber": 18,
    "surahNameAr": "الكهف",
    "surahNameEn": "Al-Kahf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 300,
    "juz": 15,
    "hizb": 30,
    "surahNumber": 18,
    "surahNameAr": "الكهف",
    "surahNameEn": "Al-Kahf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 301,
    "juz": 15,
    "hizb": 30,
    "surahNumber": 18,
    "surahNameAr": "الكهف",
    "surahNameEn": "Al-Kahf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 302,
    "juz": 16,
    "hizb": 31,
    "surahNumber": 18,
    "surahNameAr": "الكهف",
    "surahNameEn": "Al-Kahf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 303,
    "juz": 16,
    "hizb": 31,
    "surahNumber": 18,
    "surahNameAr": "الكهف",
    "surahNameEn": "Al-Kahf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 304,
    "juz": 16,
    "hizb": 31,
    "surahNumber": 18,
    "surahNameAr": "الكهف",
    "surahNameEn": "Al-Kahf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 305,
    "juz": 16,
    "hizb": 31,
    "surahNumber": 19,
    "surahNameAr": "مريم",
    "surahNameEn": "Maryam",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 306,
    "juz": 16,
    "hizb": 31,
    "surahNumber": 19,
    "surahNameAr": "مريم",
    "surahNameEn": "Maryam",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 307,
    "juz": 16,
    "hizb": 31,
    "surahNumber": 19,
    "surahNameAr": "مريم",
    "surahNameEn": "Maryam",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 308,
    "juz": 16,
    "hizb": 31,
    "surahNumber": 19,
    "surahNameAr": "مريم",
    "surahNameEn": "Maryam",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 309,
    "juz": 16,
    "hizb": 31,
    "surahNumber": 19,
    "surahNameAr": "مريم",
    "surahNameEn": "Maryam",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 310,
    "juz": 16,
    "hizb": 31,
    "surahNumber": 19,
    "surahNameAr": "مريم",
    "surahNameEn": "Maryam",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 311,
    "juz": 16,
    "hizb": 31,
    "surahNumber": 19,
    "surahNameAr": "مريم",
    "surahNameEn": "Maryam",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 312,
    "juz": 16,
    "hizb": 31,
    "surahNumber": 20,
    "surahNameAr": "طه",
    "surahNameEn": "Ta-Ha",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 313,
    "juz": 16,
    "hizb": 32,
    "surahNumber": 20,
    "surahNameAr": "طه",
    "surahNameEn": "Ta-Ha",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 314,
    "juz": 16,
    "hizb": 32,
    "surahNumber": 20,
    "surahNameAr": "طه",
    "surahNameEn": "Ta-Ha",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 315,
    "juz": 16,
    "hizb": 32,
    "surahNumber": 20,
    "surahNameAr": "طه",
    "surahNameEn": "Ta-Ha",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 316,
    "juz": 16,
    "hizb": 32,
    "surahNumber": 20,
    "surahNameAr": "طه",
    "surahNameEn": "Ta-Ha",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 317,
    "juz": 16,
    "hizb": 32,
    "surahNumber": 20,
    "surahNameAr": "طه",
    "surahNameEn": "Ta-Ha",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 318,
    "juz": 16,
    "hizb": 32,
    "surahNumber": 20,
    "surahNameAr": "طه",
    "surahNameEn": "Ta-Ha",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 319,
    "juz": 16,
    "hizb": 32,
    "surahNumber": 20,
    "surahNameAr": "طه",
    "surahNameEn": "Ta-Ha",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 320,
    "juz": 16,
    "hizb": 32,
    "surahNumber": 20,
    "surahNameAr": "طه",
    "surahNameEn": "Ta-Ha",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 321,
    "juz": 16,
    "hizb": 32,
    "surahNumber": 20,
    "surahNameAr": "طه",
    "surahNameEn": "Ta-Ha",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 322,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 21,
    "surahNameAr": "الأنبياء",
    "surahNameEn": "Al-Anbiya",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 323,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 21,
    "surahNameAr": "الأنبياء",
    "surahNameEn": "Al-Anbiya",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 324,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 21,
    "surahNameAr": "الأنبياء",
    "surahNameEn": "Al-Anbiya",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 325,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 21,
    "surahNameAr": "الأنبياء",
    "surahNameEn": "Al-Anbiya",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 326,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 21,
    "surahNameAr": "الأنبياء",
    "surahNameEn": "Al-Anbiya",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 327,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 21,
    "surahNameAr": "الأنبياء",
    "surahNameEn": "Al-Anbiya",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 328,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 21,
    "surahNameAr": "الأنبياء",
    "surahNameEn": "Al-Anbiya",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 329,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 21,
    "surahNameAr": "الأنبياء",
    "surahNameEn": "Al-Anbiya",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 330,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 21,
    "surahNameAr": "الأنبياء",
    "surahNameEn": "Al-Anbiya",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 331,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 21,
    "surahNameAr": "الأنبياء",
    "surahNameEn": "Al-Anbiya",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 332,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 22,
    "surahNameAr": "الحج",
    "surahNameEn": "Al-Hajj",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 333,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 22,
    "surahNameAr": "الحج",
    "surahNameEn": "Al-Hajj",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 334,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 22,
    "surahNameAr": "الحج",
    "surahNameEn": "Al-Hajj",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 335,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 22,
    "surahNameAr": "الحج",
    "surahNameEn": "Al-Hajj",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 336,
    "juz": 17,
    "hizb": 33,
    "surahNumber": 22,
    "surahNameAr": "الحج",
    "surahNameEn": "Al-Hajj",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 337,
    "juz": 17,
    "hizb": 34,
    "surahNumber": 22,
    "surahNameAr": "الحج",
    "surahNameEn": "Al-Hajj",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 338,
    "juz": 17,
    "hizb": 34,
    "surahNumber": 22,
    "surahNameAr": "الحج",
    "surahNameEn": "Al-Hajj",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 339,
    "juz": 17,
    "hizb": 34,
    "surahNumber": 22,
    "surahNameAr": "الحج",
    "surahNameEn": "Al-Hajj",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 340,
    "juz": 17,
    "hizb": 34,
    "surahNumber": 22,
    "surahNameAr": "الحج",
    "surahNameEn": "Al-Hajj",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 341,
    "juz": 17,
    "hizb": 34,
    "surahNumber": 22,
    "surahNameAr": "الحج",
    "surahNameEn": "Al-Hajj",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 342,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 23,
    "surahNameAr": "المؤمنون",
    "surahNameEn": "Al-Mu'minun",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 343,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 23,
    "surahNameAr": "المؤمنون",
    "surahNameEn": "Al-Mu'minun",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 344,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 23,
    "surahNameAr": "المؤمنون",
    "surahNameEn": "Al-Mu'minun",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 345,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 23,
    "surahNameAr": "المؤمنون",
    "surahNameEn": "Al-Mu'minun",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 346,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 23,
    "surahNameAr": "المؤمنون",
    "surahNameEn": "Al-Mu'minun",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 347,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 23,
    "surahNameAr": "المؤمنون",
    "surahNameEn": "Al-Mu'minun",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 348,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 23,
    "surahNameAr": "المؤمنون",
    "surahNameEn": "Al-Mu'minun",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 349,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 23,
    "surahNameAr": "المؤمنون",
    "surahNameEn": "Al-Mu'minun",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 350,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 24,
    "surahNameAr": "النور",
    "surahNameEn": "An-Nur",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 351,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 24,
    "surahNameAr": "النور",
    "surahNameEn": "An-Nur",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 352,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 24,
    "surahNameAr": "النور",
    "surahNameEn": "An-Nur",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 353,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 24,
    "surahNameAr": "النور",
    "surahNameEn": "An-Nur",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 354,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 24,
    "surahNameAr": "النور",
    "surahNameEn": "An-Nur",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 355,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 24,
    "surahNameAr": "النور",
    "surahNameEn": "An-Nur",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 356,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 24,
    "surahNameAr": "النور",
    "surahNameEn": "An-Nur",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 357,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 24,
    "surahNameAr": "النور",
    "surahNameEn": "An-Nur",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 358,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 24,
    "surahNameAr": "النور",
    "surahNameEn": "An-Nur",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 359,
    "juz": 18,
    "hizb": 35,
    "surahNumber": 25,
    "surahNameAr": "الفرقان",
    "surahNameEn": "Al-Furqan",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 360,
    "juz": 18,
    "hizb": 36,
    "surahNumber": 25,
    "surahNameAr": "الفرقان",
    "surahNameEn": "Al-Furqan",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 361,
    "juz": 18,
    "hizb": 36,
    "surahNumber": 25,
    "surahNameAr": "الفرقان",
    "surahNameEn": "Al-Furqan",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 362,
    "juz": 19,
    "hizb": 37,
    "surahNumber": 25,
    "surahNameAr": "الفرقان",
    "surahNameEn": "Al-Furqan",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 363,
    "juz": 19,
    "hizb": 37,
    "surahNumber": 25,
    "surahNameAr": "الفرقان",
    "surahNameEn": "Al-Furqan",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 364,
    "juz": 19,
    "hizb": 37,
    "surahNumber": 25,
    "surahNameAr": "الفرقان",
    "surahNameEn": "Al-Furqan",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 365,
    "juz": 19,
    "hizb": 37,
    "surahNumber": 25,
    "surahNameAr": "الفرقان",
    "surahNameEn": "Al-Furqan",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 366,
    "juz": 19,
    "hizb": 37,
    "surahNumber": 25,
    "surahNameAr": "الفرقان",
    "surahNameEn": "Al-Furqan",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 367,
    "juz": 19,
    "hizb": 37,
    "surahNumber": 26,
    "surahNameAr": "الشعراء",
    "surahNameEn": "Ash-Shu'ara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 368,
    "juz": 19,
    "hizb": 37,
    "surahNumber": 26,
    "surahNameAr": "الشعراء",
    "surahNameEn": "Ash-Shu'ara",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 369,
    "juz": 19,
    "hizb": 37,
    "surahNumber": 26,
    "surahNameAr": "الشعراء",
    "surahNameEn": "Ash-Shu'ara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 370,
    "juz": 19,
    "hizb": 37,
    "surahNumber": 26,
    "surahNameAr": "الشعراء",
    "surahNameEn": "Ash-Shu'ara",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 371,
    "juz": 19,
    "hizb": 37,
    "surahNumber": 26,
    "surahNameAr": "الشعراء",
    "surahNameEn": "Ash-Shu'ara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 372,
    "juz": 19,
    "hizb": 38,
    "surahNumber": 26,
    "surahNameAr": "الشعراء",
    "surahNameEn": "Ash-Shu'ara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 373,
    "juz": 19,
    "hizb": 38,
    "surahNumber": 26,
    "surahNameAr": "الشعراء",
    "surahNameEn": "Ash-Shu'ara",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 374,
    "juz": 19,
    "hizb": 38,
    "surahNumber": 26,
    "surahNameAr": "الشعراء",
    "surahNameEn": "Ash-Shu'ara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 375,
    "juz": 19,
    "hizb": 38,
    "surahNumber": 26,
    "surahNameAr": "الشعراء",
    "surahNameEn": "Ash-Shu'ara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 376,
    "juz": 19,
    "hizb": 38,
    "surahNumber": 26,
    "surahNameAr": "الشعراء",
    "surahNameEn": "Ash-Shu'ara",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 377,
    "juz": 19,
    "hizb": 38,
    "surahNumber": 27,
    "surahNameAr": "النمل",
    "surahNameEn": "An-Naml",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 378,
    "juz": 19,
    "hizb": 38,
    "surahNumber": 27,
    "surahNameAr": "النمل",
    "surahNameEn": "An-Naml",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 379,
    "juz": 19,
    "hizb": 38,
    "surahNumber": 27,
    "surahNameAr": "النمل",
    "surahNameEn": "An-Naml",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 380,
    "juz": 19,
    "hizb": 38,
    "surahNumber": 27,
    "surahNameAr": "النمل",
    "surahNameEn": "An-Naml",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 381,
    "juz": 19,
    "hizb": 38,
    "surahNumber": 27,
    "surahNameAr": "النمل",
    "surahNameEn": "An-Naml",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 382,
    "juz": 20,
    "hizb": 39,
    "surahNumber": 27,
    "surahNameAr": "النمل",
    "surahNameEn": "An-Naml",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 383,
    "juz": 20,
    "hizb": 39,
    "surahNumber": 27,
    "surahNameAr": "النمل",
    "surahNameEn": "An-Naml",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 384,
    "juz": 20,
    "hizb": 39,
    "surahNumber": 27,
    "surahNameAr": "النمل",
    "surahNameEn": "An-Naml",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 385,
    "juz": 20,
    "hizb": 39,
    "surahNumber": 28,
    "surahNameAr": "القصص",
    "surahNameEn": "Al-Qasas",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 386,
    "juz": 20,
    "hizb": 39,
    "surahNumber": 28,
    "surahNameAr": "القصص",
    "surahNameEn": "Al-Qasas",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 387,
    "juz": 20,
    "hizb": 39,
    "surahNumber": 28,
    "surahNameAr": "القصص",
    "surahNameEn": "Al-Qasas",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 388,
    "juz": 20,
    "hizb": 39,
    "surahNumber": 28,
    "surahNameAr": "القصص",
    "surahNameEn": "Al-Qasas",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 389,
    "juz": 20,
    "hizb": 39,
    "surahNumber": 28,
    "surahNameAr": "القصص",
    "surahNameEn": "Al-Qasas",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 390,
    "juz": 20,
    "hizb": 39,
    "surahNumber": 28,
    "surahNameAr": "القصص",
    "surahNameEn": "Al-Qasas",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 391,
    "juz": 20,
    "hizb": 39,
    "surahNumber": 28,
    "surahNameAr": "القصص",
    "surahNameEn": "Al-Qasas",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 392,
    "juz": 20,
    "hizb": 40,
    "surahNumber": 28,
    "surahNameAr": "القصص",
    "surahNameEn": "Al-Qasas",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 393,
    "juz": 20,
    "hizb": 40,
    "surahNumber": 28,
    "surahNameAr": "القصص",
    "surahNameEn": "Al-Qasas",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 394,
    "juz": 20,
    "hizb": 40,
    "surahNumber": 28,
    "surahNameAr": "القصص",
    "surahNameEn": "Al-Qasas",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 395,
    "juz": 20,
    "hizb": 40,
    "surahNumber": 28,
    "surahNameAr": "القصص",
    "surahNameEn": "Al-Qasas",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 396,
    "juz": 20,
    "hizb": 40,
    "surahNumber": 29,
    "surahNameAr": "العنكبوت",
    "surahNameEn": "Al-'Ankabut",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 397,
    "juz": 20,
    "hizb": 40,
    "surahNumber": 29,
    "surahNameAr": "العنكبوت",
    "surahNameEn": "Al-'Ankabut",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 398,
    "juz": 20,
    "hizb": 40,
    "surahNumber": 29,
    "surahNameAr": "العنكبوت",
    "surahNameEn": "Al-'Ankabut",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 399,
    "juz": 20,
    "hizb": 40,
    "surahNumber": 29,
    "surahNameAr": "العنكبوت",
    "surahNameEn": "Al-'Ankabut",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 400,
    "juz": 20,
    "hizb": 40,
    "surahNumber": 29,
    "surahNameAr": "العنكبوت",
    "surahNameEn": "Al-'Ankabut",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 401,
    "juz": 20,
    "hizb": 40,
    "surahNumber": 29,
    "surahNameAr": "العنكبوت",
    "surahNameEn": "Al-'Ankabut",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 402,
    "juz": 21,
    "hizb": 41,
    "surahNumber": 29,
    "surahNameAr": "العنكبوت",
    "surahNameEn": "Al-'Ankabut",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 403,
    "juz": 21,
    "hizb": 41,
    "surahNumber": 29,
    "surahNameAr": "العنكبوت",
    "surahNameEn": "Al-'Ankabut",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 404,
    "juz": 21,
    "hizb": 41,
    "surahNumber": 30,
    "surahNameAr": "الروم",
    "surahNameEn": "Ar-Rum",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 405,
    "juz": 21,
    "hizb": 41,
    "surahNumber": 30,
    "surahNameAr": "الروم",
    "surahNameEn": "Ar-Rum",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 406,
    "juz": 21,
    "hizb": 41,
    "surahNumber": 30,
    "surahNameAr": "الروم",
    "surahNameEn": "Ar-Rum",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 407,
    "juz": 21,
    "hizb": 41,
    "surahNumber": 30,
    "surahNameAr": "الروم",
    "surahNameEn": "Ar-Rum",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 408,
    "juz": 21,
    "hizb": 41,
    "surahNumber": 30,
    "surahNameAr": "الروم",
    "surahNameEn": "Ar-Rum",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 409,
    "juz": 21,
    "hizb": 41,
    "surahNumber": 30,
    "surahNameAr": "الروم",
    "surahNameEn": "Ar-Rum",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 410,
    "juz": 21,
    "hizb": 41,
    "surahNumber": 30,
    "surahNameAr": "الروم",
    "surahNameEn": "Ar-Rum",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 411,
    "juz": 21,
    "hizb": 41,
    "surahNumber": 31,
    "surahNameAr": "لقمان",
    "surahNameEn": "Luqman",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 412,
    "juz": 21,
    "hizb": 41,
    "surahNumber": 31,
    "surahNameAr": "لقمان",
    "surahNameEn": "Luqman",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 413,
    "juz": 21,
    "hizb": 41,
    "surahNumber": 31,
    "surahNameAr": "لقمان",
    "surahNameEn": "Luqman",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 414,
    "juz": 21,
    "hizb": 42,
    "surahNumber": 31,
    "surahNameAr": "لقمان",
    "surahNameEn": "Luqman",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 415,
    "juz": 21,
    "hizb": 42,
    "surahNumber": 32,
    "surahNameAr": "السجدة",
    "surahNameEn": "As-Sajda",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 416,
    "juz": 21,
    "hizb": 42,
    "surahNumber": 32,
    "surahNameAr": "السجدة",
    "surahNameEn": "As-Sajda",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 417,
    "juz": 21,
    "hizb": 42,
    "surahNumber": 32,
    "surahNameAr": "السجدة",
    "surahNameEn": "As-Sajda",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 418,
    "juz": 21,
    "hizb": 42,
    "surahNumber": 33,
    "surahNameAr": "الأحزاب",
    "surahNameEn": "Al-Ahzab",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 419,
    "juz": 21,
    "hizb": 42,
    "surahNumber": 33,
    "surahNameAr": "الأحزاب",
    "surahNameEn": "Al-Ahzab",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 420,
    "juz": 21,
    "hizb": 42,
    "surahNumber": 33,
    "surahNameAr": "الأحزاب",
    "surahNameEn": "Al-Ahzab",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 421,
    "juz": 21,
    "hizb": 42,
    "surahNumber": 33,
    "surahNameAr": "الأحزاب",
    "surahNameEn": "Al-Ahzab",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 422,
    "juz": 22,
    "hizb": 43,
    "surahNumber": 33,
    "surahNameAr": "الأحزاب",
    "surahNameEn": "Al-Ahzab",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 423,
    "juz": 22,
    "hizb": 43,
    "surahNumber": 33,
    "surahNameAr": "الأحزاب",
    "surahNameEn": "Al-Ahzab",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 424,
    "juz": 22,
    "hizb": 43,
    "surahNumber": 33,
    "surahNameAr": "الأحزاب",
    "surahNameEn": "Al-Ahzab",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 425,
    "juz": 22,
    "hizb": 43,
    "surahNumber": 33,
    "surahNameAr": "الأحزاب",
    "surahNameEn": "Al-Ahzab",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 426,
    "juz": 22,
    "hizb": 43,
    "surahNumber": 33,
    "surahNameAr": "الأحزاب",
    "surahNameEn": "Al-Ahzab",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 427,
    "juz": 22,
    "hizb": 43,
    "surahNumber": 33,
    "surahNameAr": "الأحزاب",
    "surahNameEn": "Al-Ahzab",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 428,
    "juz": 22,
    "hizb": 43,
    "surahNumber": 34,
    "surahNameAr": "سبإ",
    "surahNameEn": "Saba",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 429,
    "juz": 22,
    "hizb": 43,
    "surahNumber": 34,
    "surahNameAr": "سبإ",
    "surahNameEn": "Saba",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 430,
    "juz": 22,
    "hizb": 43,
    "surahNumber": 34,
    "surahNameAr": "سبإ",
    "surahNameEn": "Saba",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 431,
    "juz": 22,
    "hizb": 44,
    "surahNumber": 34,
    "surahNameAr": "سبإ",
    "surahNameEn": "Saba",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 432,
    "juz": 22,
    "hizb": 44,
    "surahNumber": 34,
    "surahNameAr": "سبإ",
    "surahNameEn": "Saba",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 433,
    "juz": 22,
    "hizb": 44,
    "surahNumber": 34,
    "surahNameAr": "سبإ",
    "surahNameEn": "Saba",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 434,
    "juz": 22,
    "hizb": 44,
    "surahNumber": 35,
    "surahNameAr": "فاطر",
    "surahNameEn": "Fatir",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 435,
    "juz": 22,
    "hizb": 44,
    "surahNumber": 35,
    "surahNameAr": "فاطر",
    "surahNameEn": "Fatir",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 436,
    "juz": 22,
    "hizb": 44,
    "surahNumber": 35,
    "surahNameAr": "فاطر",
    "surahNameEn": "Fatir",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 437,
    "juz": 22,
    "hizb": 44,
    "surahNumber": 35,
    "surahNameAr": "فاطر",
    "surahNameEn": "Fatir",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 438,
    "juz": 22,
    "hizb": 44,
    "surahNumber": 35,
    "surahNameAr": "فاطر",
    "surahNameEn": "Fatir",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 439,
    "juz": 22,
    "hizb": 44,
    "surahNumber": 35,
    "surahNameAr": "فاطر",
    "surahNameEn": "Fatir",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 440,
    "juz": 22,
    "hizb": 44,
    "surahNumber": 36,
    "surahNameAr": "يس",
    "surahNameEn": "Ya-Sin",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 441,
    "juz": 22,
    "hizb": 44,
    "surahNumber": 36,
    "surahNameAr": "يس",
    "surahNameEn": "Ya-Sin",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 442,
    "juz": 23,
    "hizb": 45,
    "surahNumber": 36,
    "surahNameAr": "يس",
    "surahNameEn": "Ya-Sin",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 443,
    "juz": 23,
    "hizb": 45,
    "surahNumber": 36,
    "surahNameAr": "يس",
    "surahNameEn": "Ya-Sin",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 444,
    "juz": 23,
    "hizb": 45,
    "surahNumber": 36,
    "surahNameAr": "يس",
    "surahNameEn": "Ya-Sin",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 445,
    "juz": 23,
    "hizb": 45,
    "surahNumber": 36,
    "surahNameAr": "يس",
    "surahNameEn": "Ya-Sin",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 446,
    "juz": 23,
    "hizb": 45,
    "surahNumber": 37,
    "surahNameAr": "الصافات",
    "surahNameEn": "As-Saffat",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 447,
    "juz": 23,
    "hizb": 45,
    "surahNumber": 37,
    "surahNameAr": "الصافات",
    "surahNameEn": "As-Saffat",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 448,
    "juz": 23,
    "hizb": 45,
    "surahNumber": 37,
    "surahNameAr": "الصافات",
    "surahNameEn": "As-Saffat",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 449,
    "juz": 23,
    "hizb": 45,
    "surahNumber": 37,
    "surahNameAr": "الصافات",
    "surahNameEn": "As-Saffat",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 450,
    "juz": 23,
    "hizb": 45,
    "surahNumber": 37,
    "surahNameAr": "الصافات",
    "surahNameEn": "As-Saffat",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 451,
    "juz": 23,
    "hizb": 45,
    "surahNumber": 37,
    "surahNameAr": "الصافات",
    "surahNameEn": "As-Saffat",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 452,
    "juz": 23,
    "hizb": 46,
    "surahNumber": 37,
    "surahNameAr": "الصافات",
    "surahNameEn": "As-Saffat",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 453,
    "juz": 23,
    "hizb": 46,
    "surahNumber": 38,
    "surahNameAr": "ص",
    "surahNameEn": "Saad",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 454,
    "juz": 23,
    "hizb": 46,
    "surahNumber": 38,
    "surahNameAr": "ص",
    "surahNameEn": "Saad",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 455,
    "juz": 23,
    "hizb": 46,
    "surahNumber": 38,
    "surahNameAr": "ص",
    "surahNameEn": "Saad",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 456,
    "juz": 23,
    "hizb": 46,
    "surahNumber": 38,
    "surahNameAr": "ص",
    "surahNameEn": "Saad",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 457,
    "juz": 23,
    "hizb": 46,
    "surahNumber": 38,
    "surahNameAr": "ص",
    "surahNameEn": "Saad",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 458,
    "juz": 23,
    "hizb": 46,
    "surahNumber": 39,
    "surahNameAr": "الزمر",
    "surahNameEn": "Az-Zumar",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 459,
    "juz": 23,
    "hizb": 46,
    "surahNumber": 39,
    "surahNameAr": "الزمر",
    "surahNameEn": "Az-Zumar",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 460,
    "juz": 23,
    "hizb": 46,
    "surahNumber": 39,
    "surahNameAr": "الزمر",
    "surahNameEn": "Az-Zumar",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 461,
    "juz": 23,
    "hizb": 46,
    "surahNumber": 39,
    "surahNameAr": "الزمر",
    "surahNameEn": "Az-Zumar",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 462,
    "juz": 24,
    "hizb": 47,
    "surahNumber": 39,
    "surahNameAr": "الزمر",
    "surahNameEn": "Az-Zumar",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 463,
    "juz": 24,
    "hizb": 47,
    "surahNumber": 39,
    "surahNameAr": "الزمر",
    "surahNameEn": "Az-Zumar",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 464,
    "juz": 24,
    "hizb": 47,
    "surahNumber": 39,
    "surahNameAr": "الزمر",
    "surahNameEn": "Az-Zumar",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 465,
    "juz": 24,
    "hizb": 47,
    "surahNumber": 39,
    "surahNameAr": "الزمر",
    "surahNameEn": "Az-Zumar",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 466,
    "juz": 24,
    "hizb": 47,
    "surahNumber": 39,
    "surahNameAr": "الزمر",
    "surahNameEn": "Az-Zumar",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 467,
    "juz": 24,
    "hizb": 47,
    "surahNumber": 40,
    "surahNameAr": "غافر",
    "surahNameEn": "Al-Ghafir",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 468,
    "juz": 24,
    "hizb": 47,
    "surahNumber": 40,
    "surahNameAr": "غافر",
    "surahNameEn": "Al-Ghafir",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 469,
    "juz": 24,
    "hizb": 47,
    "surahNumber": 40,
    "surahNameAr": "غافر",
    "surahNameEn": "Al-Ghafir",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 470,
    "juz": 24,
    "hizb": 47,
    "surahNumber": 40,
    "surahNameAr": "غافر",
    "surahNameEn": "Al-Ghafir",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 471,
    "juz": 24,
    "hizb": 47,
    "surahNumber": 40,
    "surahNameAr": "غافر",
    "surahNameEn": "Al-Ghafir",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 472,
    "juz": 24,
    "hizb": 48,
    "surahNumber": 40,
    "surahNameAr": "غافر",
    "surahNameEn": "Al-Ghafir",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 473,
    "juz": 24,
    "hizb": 48,
    "surahNumber": 40,
    "surahNameAr": "غافر",
    "surahNameEn": "Al-Ghafir",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 474,
    "juz": 24,
    "hizb": 48,
    "surahNumber": 40,
    "surahNameAr": "غافر",
    "surahNameEn": "Al-Ghafir",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 475,
    "juz": 24,
    "hizb": 48,
    "surahNumber": 40,
    "surahNameAr": "غافر",
    "surahNameEn": "Al-Ghafir",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 476,
    "juz": 24,
    "hizb": 48,
    "surahNumber": 40,
    "surahNameAr": "غافر",
    "surahNameEn": "Al-Ghafir",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 477,
    "juz": 24,
    "hizb": 48,
    "surahNumber": 41,
    "surahNameAr": "فصلت",
    "surahNameEn": "Fussilat",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 478,
    "juz": 24,
    "hizb": 48,
    "surahNumber": 41,
    "surahNameAr": "فصلت",
    "surahNameEn": "Fussilat",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 479,
    "juz": 24,
    "hizb": 48,
    "surahNumber": 41,
    "surahNameAr": "فصلت",
    "surahNameEn": "Fussilat",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 480,
    "juz": 24,
    "hizb": 48,
    "surahNumber": 41,
    "surahNameAr": "فصلت",
    "surahNameEn": "Fussilat",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 481,
    "juz": 24,
    "hizb": 48,
    "surahNumber": 41,
    "surahNameAr": "فصلت",
    "surahNameEn": "Fussilat",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 482,
    "juz": 25,
    "hizb": 49,
    "surahNumber": 41,
    "surahNameAr": "فصلت",
    "surahNameEn": "Fussilat",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 483,
    "juz": 25,
    "hizb": 49,
    "surahNumber": 42,
    "surahNameAr": "الشورى",
    "surahNameEn": "Ash-Shura",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 484,
    "juz": 25,
    "hizb": 49,
    "surahNumber": 42,
    "surahNameAr": "الشورى",
    "surahNameEn": "Ash-Shura",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 485,
    "juz": 25,
    "hizb": 49,
    "surahNumber": 42,
    "surahNameAr": "الشورى",
    "surahNameEn": "Ash-Shura",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 486,
    "juz": 25,
    "hizb": 49,
    "surahNumber": 42,
    "surahNameAr": "الشورى",
    "surahNameEn": "Ash-Shura",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 487,
    "juz": 25,
    "hizb": 49,
    "surahNumber": 42,
    "surahNameAr": "الشورى",
    "surahNameEn": "Ash-Shura",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 488,
    "juz": 25,
    "hizb": 49,
    "surahNumber": 42,
    "surahNameAr": "الشورى",
    "surahNameEn": "Ash-Shura",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 489,
    "juz": 25,
    "hizb": 49,
    "surahNumber": 43,
    "surahNameAr": "الزخرف",
    "surahNameEn": "Az-Zukhruf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 490,
    "juz": 25,
    "hizb": 49,
    "surahNumber": 43,
    "surahNameAr": "الزخرف",
    "surahNameEn": "Az-Zukhruf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 491,
    "juz": 25,
    "hizb": 49,
    "surahNumber": 43,
    "surahNameAr": "الزخرف",
    "surahNameEn": "Az-Zukhruf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 492,
    "juz": 25,
    "hizb": 50,
    "surahNumber": 43,
    "surahNameAr": "الزخرف",
    "surahNameEn": "Az-Zukhruf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 493,
    "juz": 25,
    "hizb": 50,
    "surahNumber": 43,
    "surahNameAr": "الزخرف",
    "surahNameEn": "Az-Zukhruf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 494,
    "juz": 25,
    "hizb": 50,
    "surahNumber": 43,
    "surahNameAr": "الزخرف",
    "surahNameEn": "Az-Zukhruf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 495,
    "juz": 25,
    "hizb": 50,
    "surahNumber": 43,
    "surahNameAr": "الزخرف",
    "surahNameEn": "Az-Zukhruf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 496,
    "juz": 25,
    "hizb": 50,
    "surahNumber": 44,
    "surahNameAr": "الدخان",
    "surahNameEn": "Ad-Dukhan",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 497,
    "juz": 25,
    "hizb": 50,
    "surahNumber": 44,
    "surahNameAr": "الدخان",
    "surahNameEn": "Ad-Dukhan",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 498,
    "juz": 25,
    "hizb": 50,
    "surahNumber": 44,
    "surahNameAr": "الدخان",
    "surahNameEn": "Ad-Dukhan",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 499,
    "juz": 25,
    "hizb": 50,
    "surahNumber": 45,
    "surahNameAr": "الجاثية",
    "surahNameEn": "Al-Jathiya",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 500,
    "juz": 25,
    "hizb": 50,
    "surahNumber": 45,
    "surahNameAr": "الجاثية",
    "surahNameEn": "Al-Jathiya",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 501,
    "juz": 25,
    "hizb": 50,
    "surahNumber": 45,
    "surahNameAr": "الجاثية",
    "surahNameEn": "Al-Jathiya",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 502,
    "juz": 25,
    "hizb": 50,
    "surahNumber": 46,
    "surahNameAr": "الأحقاف",
    "surahNameEn": "Al-Ahqaf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 503,
    "juz": 26,
    "hizb": 51,
    "surahNumber": 46,
    "surahNameAr": "الأحقاف",
    "surahNameEn": "Al-Ahqaf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 504,
    "juz": 26,
    "hizb": 51,
    "surahNumber": 46,
    "surahNameAr": "الأحقاف",
    "surahNameEn": "Al-Ahqaf",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 505,
    "juz": 26,
    "hizb": 51,
    "surahNumber": 46,
    "surahNameAr": "الأحقاف",
    "surahNameEn": "Al-Ahqaf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 506,
    "juz": 26,
    "hizb": 51,
    "surahNumber": 46,
    "surahNameAr": "الأحقاف",
    "surahNameEn": "Al-Ahqaf",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 507,
    "juz": 26,
    "hizb": 51,
    "surahNumber": 47,
    "surahNameAr": "محمد",
    "surahNameEn": "Muhammad",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 508,
    "juz": 26,
    "hizb": 51,
    "surahNumber": 47,
    "surahNameAr": "محمد",
    "surahNameEn": "Muhammad",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 509,
    "juz": 26,
    "hizb": 51,
    "surahNumber": 47,
    "surahNameAr": "محمد",
    "surahNameEn": "Muhammad",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 510,
    "juz": 26,
    "hizb": 51,
    "surahNumber": 47,
    "surahNameAr": "محمد",
    "surahNameEn": "Muhammad",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 511,
    "juz": 26,
    "hizb": 51,
    "surahNumber": 48,
    "surahNameAr": "الفتح",
    "surahNameEn": "Al-Fath",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 512,
    "juz": 26,
    "hizb": 51,
    "surahNumber": 48,
    "surahNameAr": "الفتح",
    "surahNameEn": "Al-Fath",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 513,
    "juz": 26,
    "hizb": 51,
    "surahNumber": 48,
    "surahNameAr": "الفتح",
    "surahNameEn": "Al-Fath",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 514,
    "juz": 26,
    "hizb": 52,
    "surahNumber": 48,
    "surahNameAr": "الفتح",
    "surahNameEn": "Al-Fath",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 515,
    "juz": 26,
    "hizb": 52,
    "surahNumber": 49,
    "surahNameAr": "الحجرات",
    "surahNameEn": "Al-Hujurat",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 516,
    "juz": 26,
    "hizb": 52,
    "surahNumber": 49,
    "surahNameAr": "الحجرات",
    "surahNameEn": "Al-Hujurat",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 517,
    "juz": 26,
    "hizb": 52,
    "surahNumber": 49,
    "surahNameAr": "الحجرات",
    "surahNameEn": "Al-Hujurat",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 518,
    "juz": 26,
    "hizb": 52,
    "surahNumber": 50,
    "surahNameAr": "ق",
    "surahNameEn": "Qaf",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 519,
    "juz": 26,
    "hizb": 52,
    "surahNumber": 50,
    "surahNameAr": "ق",
    "surahNameEn": "Qaf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 520,
    "juz": 26,
    "hizb": 52,
    "surahNumber": 51,
    "surahNameAr": "الذاريات",
    "surahNameEn": "Adh-Dhariyat",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 521,
    "juz": 26,
    "hizb": 52,
    "surahNumber": 51,
    "surahNameAr": "الذاريات",
    "surahNameEn": "Adh-Dhariyat",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 522,
    "juz": 27,
    "hizb": 53,
    "surahNumber": 51,
    "surahNameAr": "الذاريات",
    "surahNameEn": "Adh-Dhariyat",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 523,
    "juz": 27,
    "hizb": 53,
    "surahNumber": 52,
    "surahNameAr": "الطور",
    "surahNameEn": "At-Tur",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 524,
    "juz": 27,
    "hizb": 53,
    "surahNumber": 52,
    "surahNameAr": "الطور",
    "surahNameEn": "At-Tur",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 525,
    "juz": 27,
    "hizb": 53,
    "surahNumber": 52,
    "surahNameAr": "الطور",
    "surahNameEn": "At-Tur",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 526,
    "juz": 27,
    "hizb": 53,
    "surahNumber": 53,
    "surahNameAr": "النجم",
    "surahNameEn": "An-Najm",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 527,
    "juz": 27,
    "hizb": 53,
    "surahNumber": 53,
    "surahNameAr": "النجم",
    "surahNameEn": "An-Najm",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 528,
    "juz": 27,
    "hizb": 53,
    "surahNumber": 54,
    "surahNameAr": "القمر",
    "surahNameEn": "Al-Qamar",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 529,
    "juz": 27,
    "hizb": 53,
    "surahNumber": 54,
    "surahNameAr": "القمر",
    "surahNameEn": "Al-Qamar",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 530,
    "juz": 27,
    "hizb": 53,
    "surahNumber": 54,
    "surahNameAr": "القمر",
    "surahNameEn": "Al-Qamar",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 531,
    "juz": 27,
    "hizb": 53,
    "surahNumber": 55,
    "surahNameAr": "الرحمن",
    "surahNameEn": "Ar-Rahman",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 532,
    "juz": 27,
    "hizb": 54,
    "surahNumber": 55,
    "surahNameAr": "الرحمن",
    "surahNameEn": "Ar-Rahman",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 533,
    "juz": 27,
    "hizb": 54,
    "surahNumber": 55,
    "surahNameAr": "الرحمن",
    "surahNameEn": "Ar-Rahman",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 534,
    "juz": 27,
    "hizb": 54,
    "surahNumber": 56,
    "surahNameAr": "الواقعة",
    "surahNameEn": "Al-Waqi'a",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 535,
    "juz": 27,
    "hizb": 54,
    "surahNumber": 56,
    "surahNameAr": "الواقعة",
    "surahNameEn": "Al-Waqi'a",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 536,
    "juz": 27,
    "hizb": 54,
    "surahNumber": 56,
    "surahNameAr": "الواقعة",
    "surahNameEn": "Al-Waqi'a",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 537,
    "juz": 27,
    "hizb": 54,
    "surahNumber": 57,
    "surahNameAr": "الحديد",
    "surahNameEn": "Al-Hadid",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 538,
    "juz": 27,
    "hizb": 54,
    "surahNumber": 57,
    "surahNameAr": "الحديد",
    "surahNameEn": "Al-Hadid",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 539,
    "juz": 27,
    "hizb": 54,
    "surahNumber": 57,
    "surahNameAr": "الحديد",
    "surahNameEn": "Al-Hadid",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 540,
    "juz": 27,
    "hizb": 54,
    "surahNumber": 57,
    "surahNameAr": "الحديد",
    "surahNameEn": "Al-Hadid",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 541,
    "juz": 27,
    "hizb": 54,
    "surahNumber": 57,
    "surahNameAr": "الحديد",
    "surahNameEn": "Al-Hadid",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 542,
    "juz": 28,
    "hizb": 55,
    "surahNumber": 58,
    "surahNameAr": "المجادلة",
    "surahNameEn": "Al-Mujadila",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 543,
    "juz": 28,
    "hizb": 55,
    "surahNumber": 58,
    "surahNameAr": "المجادلة",
    "surahNameEn": "Al-Mujadila",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 544,
    "juz": 28,
    "hizb": 55,
    "surahNumber": 58,
    "surahNameAr": "المجادلة",
    "surahNameEn": "Al-Mujadila",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 545,
    "juz": 28,
    "hizb": 55,
    "surahNumber": 59,
    "surahNameAr": "الحشر",
    "surahNameEn": "Al-Hashr",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 546,
    "juz": 28,
    "hizb": 55,
    "surahNumber": 59,
    "surahNameAr": "الحشر",
    "surahNameEn": "Al-Hashr",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 547,
    "juz": 28,
    "hizb": 55,
    "surahNumber": 59,
    "surahNameAr": "الحشر",
    "surahNameEn": "Al-Hashr",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 548,
    "juz": 28,
    "hizb": 55,
    "surahNumber": 59,
    "surahNameAr": "الحشر",
    "surahNameEn": "Al-Hashr",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 549,
    "juz": 28,
    "hizb": 55,
    "surahNumber": 60,
    "surahNameAr": "الممتحنة",
    "surahNameEn": "Al-Mumtahana",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 550,
    "juz": 28,
    "hizb": 55,
    "surahNumber": 60,
    "surahNameAr": "الممتحنة",
    "surahNameEn": "Al-Mumtahana",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 551,
    "juz": 28,
    "hizb": 55,
    "surahNumber": 61,
    "surahNameAr": "الصف",
    "surahNameEn": "As-Saf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 552,
    "juz": 28,
    "hizb": 56,
    "surahNumber": 61,
    "surahNameAr": "الصف",
    "surahNameEn": "As-Saf",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 553,
    "juz": 28,
    "hizb": 56,
    "surahNumber": 62,
    "surahNameAr": "الجمعة",
    "surahNameEn": "Al-Jumu'a",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 554,
    "juz": 28,
    "hizb": 56,
    "surahNumber": 63,
    "surahNameAr": "المنافقون",
    "surahNameEn": "Al-Munafiqun",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 555,
    "juz": 28,
    "hizb": 56,
    "surahNumber": 63,
    "surahNameAr": "المنافقون",
    "surahNameEn": "Al-Munafiqun",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 556,
    "juz": 28,
    "hizb": 56,
    "surahNumber": 64,
    "surahNameAr": "التغابن",
    "surahNameEn": "At-Taghabun",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 557,
    "juz": 28,
    "hizb": 56,
    "surahNumber": 64,
    "surahNameAr": "التغابن",
    "surahNameEn": "At-Taghabun",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 558,
    "juz": 28,
    "hizb": 56,
    "surahNumber": 65,
    "surahNameAr": "الطلاق",
    "surahNameEn": "At-Talaq",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 559,
    "juz": 28,
    "hizb": 56,
    "surahNumber": 65,
    "surahNameAr": "الطلاق",
    "surahNameEn": "At-Talaq",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 560,
    "juz": 28,
    "hizb": 56,
    "surahNumber": 66,
    "surahNameAr": "التحريم",
    "surahNameEn": "At-Tahrim",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 561,
    "juz": 28,
    "hizb": 56,
    "surahNumber": 66,
    "surahNameAr": "التحريم",
    "surahNameEn": "At-Tahrim",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 562,
    "juz": 29,
    "hizb": 57,
    "surahNumber": 67,
    "surahNameAr": "الملك",
    "surahNameEn": "Al-Mulk",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 563,
    "juz": 29,
    "hizb": 57,
    "surahNumber": 67,
    "surahNameAr": "الملك",
    "surahNameEn": "Al-Mulk",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 564,
    "juz": 29,
    "hizb": 57,
    "surahNumber": 68,
    "surahNameAr": "القلم",
    "surahNameEn": "Al-Qalam",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 565,
    "juz": 29,
    "hizb": 57,
    "surahNumber": 68,
    "surahNameAr": "القلم",
    "surahNameEn": "Al-Qalam",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 566,
    "juz": 29,
    "hizb": 57,
    "surahNumber": 69,
    "surahNameAr": "الحاقة",
    "surahNameEn": "Al-Haqqa",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 567,
    "juz": 29,
    "hizb": 57,
    "surahNumber": 69,
    "surahNameAr": "الحاقة",
    "surahNameEn": "Al-Haqqa",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 568,
    "juz": 29,
    "hizb": 57,
    "surahNumber": 70,
    "surahNameAr": "المعارج",
    "surahNameEn": "Al-Ma'arij",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 569,
    "juz": 29,
    "hizb": 57,
    "surahNumber": 70,
    "surahNameAr": "المعارج",
    "surahNameEn": "Al-Ma'arij",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 570,
    "juz": 29,
    "hizb": 57,
    "surahNumber": 71,
    "surahNameAr": "نوح",
    "surahNameEn": "Nuh",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 571,
    "juz": 29,
    "hizb": 57,
    "surahNumber": 71,
    "surahNameAr": "نوح",
    "surahNameEn": "Nuh",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 572,
    "juz": 29,
    "hizb": 58,
    "surahNumber": 72,
    "surahNameAr": "الجن",
    "surahNameEn": "Al-Jinn",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 573,
    "juz": 29,
    "hizb": 58,
    "surahNumber": 72,
    "surahNameAr": "الجن",
    "surahNameEn": "Al-Jinn",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 574,
    "juz": 29,
    "hizb": 58,
    "surahNumber": 73,
    "surahNameAr": "المزمل",
    "surahNameEn": "Al-Muzzamil",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 575,
    "juz": 29,
    "hizb": 58,
    "surahNumber": 74,
    "surahNameAr": "المدثر",
    "surahNameEn": "Al-Mudathir",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 576,
    "juz": 29,
    "hizb": 58,
    "surahNumber": 74,
    "surahNameAr": "المدثر",
    "surahNameEn": "Al-Mudathir",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 577,
    "juz": 29,
    "hizb": 58,
    "surahNumber": 75,
    "surahNameAr": "القيامة",
    "surahNameEn": "Al-Qiyama",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 578,
    "juz": 29,
    "hizb": 58,
    "surahNumber": 76,
    "surahNameAr": "الانسان",
    "surahNameEn": "Al-Insan",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 579,
    "juz": 29,
    "hizb": 58,
    "surahNumber": 76,
    "surahNameAr": "الانسان",
    "surahNameEn": "Al-Insan",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 580,
    "juz": 29,
    "hizb": 58,
    "surahNumber": 77,
    "surahNameAr": "المرسلات",
    "surahNameEn": "Al-Mursalat",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 581,
    "juz": 29,
    "hizb": 58,
    "surahNumber": 77,
    "surahNameAr": "المرسلات",
    "surahNameEn": "Al-Mursalat",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 582,
    "juz": 30,
    "hizb": 59,
    "surahNumber": 78,
    "surahNameAr": "النبإ",
    "surahNameEn": "An-Naba",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 583,
    "juz": 30,
    "hizb": 59,
    "surahNumber": 79,
    "surahNameAr": "النازعات",
    "surahNameEn": "An-Nazi'at",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 584,
    "juz": 30,
    "hizb": 59,
    "surahNumber": 79,
    "surahNameAr": "النازعات",
    "surahNameEn": "An-Nazi'at",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 585,
    "juz": 30,
    "hizb": 59,
    "surahNumber": 80,
    "surahNameAr": "عبس",
    "surahNameEn": "Abasa",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 586,
    "juz": 30,
    "hizb": 59,
    "surahNumber": 81,
    "surahNameAr": "التكوير",
    "surahNameEn": "At-Takwir",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 587,
    "juz": 30,
    "hizb": 59,
    "surahNumber": 82,
    "surahNameAr": "الإنفطار",
    "surahNameEn": "Al-Infitar",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 588,
    "juz": 30,
    "hizb": 59,
    "surahNumber": 83,
    "surahNameAr": "المطففين",
    "surahNameEn": "Al-Mutafifin",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 589,
    "juz": 30,
    "hizb": 59,
    "surahNumber": 84,
    "surahNameAr": "الإنشقاق",
    "surahNameEn": "Al-Inshiqaq",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 590,
    "juz": 30,
    "hizb": 59,
    "surahNumber": 85,
    "surahNameAr": "البروج",
    "surahNameEn": "Al-Buruj",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 591,
    "juz": 30,
    "hizb": 59,
    "surahNumber": 86,
    "surahNameAr": "الطارق",
    "surahNameEn": "At-Tariq",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 592,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 88,
    "surahNameAr": "الغاشية",
    "surahNameEn": "Al-Ghashiya",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 593,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 89,
    "surahNameAr": "الفجر",
    "surahNameEn": "Al-Fajr",
    "quarterPart": "بداية الحزب"
  },
  {
    "page": 594,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 90,
    "surahNameAr": "البلد",
    "surahNameEn": "Al-Balad",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 595,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 91,
    "surahNameAr": "الشمس",
    "surahNameEn": "Ash-Shams",
    "quarterPart": "ربع الحزب"
  },
  {
    "page": 596,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 93,
    "surahNameAr": "الضحى",
    "surahNameEn": "Ad-Dhuhaa",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 597,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 95,
    "surahNameAr": "التين",
    "surahNameEn": "At-Tin",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 598,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 97,
    "surahNameAr": "القدر",
    "surahNameEn": "Al-Qadr",
    "quarterPart": "نصف الحزب"
  },
  {
    "page": 599,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 99,
    "surahNameAr": "الزلزلة",
    "surahNameEn": "Az-Zalzala",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 600,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 101,
    "surahNameAr": "القارعة",
    "surahNameEn": "Al-Qari'a",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 601,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 103,
    "surahNameAr": "العصر",
    "surahNameEn": "Al-'Asr",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 602,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 106,
    "surahNameAr": "قريش",
    "surahNameEn": "Quraysh",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 603,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 109,
    "surahNameAr": "الكافرون",
    "surahNameEn": "Al-Kafirun",
    "quarterPart": "ثلاثة أرباع"
  },
  {
    "page": 604,
    "juz": 30,
    "hizb": 60,
    "surahNumber": 112,
    "surahNameAr": "الإخلاص",
    "surahNameEn": "Al-Ikhlas",
    "quarterPart": "ثلاثة أرباع"
  }
];
