export interface HizbInfo {
  number: number;
  nameAr: string;
  startSurahNumber: number;
  startSurahName: string;
  startAyahNumber: number;
}

export interface JuzInfo {
  number: number;
  nameAr: string;
  nameEn: string;
  startSurahNumber: number;
  startSurahName: string;
  startAyahNumber: number;
  hizbs: [HizbInfo, HizbInfo];
}

export const juzList: JuzInfo[] = [
  {
    number: 1,
    nameAr: "الجزء الأول",
    nameEn: "Juz 1",
    startSurahNumber: 1,
    startSurahName: "الفاتحة",
    startAyahNumber: 1,
    hizbs: [
      { number: 1, nameAr: "الحزب الأول", startSurahNumber: 1, startSurahName: "الفاتحة", startAyahNumber: 1 },
      { number: 2, nameAr: "الحزب الثاني", startSurahNumber: 2, startSurahName: "البقرة", startAyahNumber: 75 }
    ]
  },
  {
    number: 2,
    nameAr: "الجزء الثاني",
    nameEn: "Juz 2",
    startSurahNumber: 2,
    startSurahName: "البقرة",
    startAyahNumber: 142,
    hizbs: [
      { number: 3, nameAr: "الحزب الثالث", startSurahNumber: 2, startSurahName: "البقرة", startAyahNumber: 142 },
      { number: 4, nameAr: "الحزب الرابع", startSurahNumber: 2, startSurahName: "البقرة", startAyahNumber: 203 }
    ]
  },
  {
    number: 3,
    nameAr: "الجزء الثالث",
    nameEn: "Juz 3",
    startSurahNumber: 2,
    startSurahName: "البقرة",
    startAyahNumber: 253,
    hizbs: [
      { number: 5, nameAr: "الحزب الخامس", startSurahNumber: 2, startSurahName: "البقرة", startAyahNumber: 253 },
      { number: 6, nameAr: "الحزب السادس", startSurahNumber: 3, startSurahName: "آل عمران", startAyahNumber: 15 }
    ]
  },
  {
    number: 4,
    nameAr: "الجزء الرابع",
    nameEn: "Juz 4",
    startSurahNumber: 3,
    startSurahName: "آل عمران",
    startAyahNumber: 93,
    hizbs: [
      { number: 7, nameAr: "الحزب السابع", startSurahNumber: 3, startSurahName: "آل عمران", startAyahNumber: 93 },
      { number: 8, nameAr: "الحزب الثامن", startSurahNumber: 3, startSurahName: "آل عمران", startAyahNumber: 171 }
    ]
  },
  {
    number: 5,
    nameAr: "الجزء الخامس",
    nameEn: "Juz 5",
    startSurahNumber: 4,
    startSurahName: "النساء",
    startAyahNumber: 24,
    hizbs: [
      { number: 9, nameAr: "الحزب التاسع", startSurahNumber: 4, startSurahName: "النساء", startAyahNumber: 24 },
      { number: 10, nameAr: "الحزب العاشر", startSurahNumber: 4, startSurahName: "النساء", startAyahNumber: 88 }
    ]
  },
  {
    number: 6,
    nameAr: "الجزء السادس",
    nameEn: "Juz 6",
    startSurahNumber: 4,
    startSurahName: "النساء",
    startAyahNumber: 148,
    hizbs: [
      { number: 11, nameAr: "الحزب الحادي عشر", startSurahNumber: 4, startSurahName: "النساء", startAyahNumber: 148 },
      { number: 12, nameAr: "الحزب الثاني عشر", startSurahNumber: 5, startSurahName: "المائدة", startAyahNumber: 27 }
    ]
  },
  {
    number: 7,
    nameAr: "الجزء السابع",
    nameEn: "Juz 7",
    startSurahNumber: 5,
    startSurahName: "المائدة",
    startAyahNumber: 82,
    hizbs: [
      { number: 13, nameAr: "الحزب الثالث عشر", startSurahNumber: 5, startSurahName: "المائدة", startAyahNumber: 82 },
      { number: 14, nameAr: "الحزب الرابع عشر", startSurahNumber: 6, startSurahName: "الأنعام", startAyahNumber: 36 }
    ]
  },
  {
    number: 8,
    nameAr: "الجزء الثامن",
    nameEn: "Juz 8",
    startSurahNumber: 6,
    startSurahName: "الأنعام",
    startAyahNumber: 111,
    hizbs: [
      { number: 15, nameAr: "الحزب الخامس عشر", startSurahNumber: 6, startSurahName: "الأنعام", startAyahNumber: 111 },
      { number: 16, nameAr: "الحزب السادس عشر", startSurahNumber: 7, startSurahName: "الأعراف", startAyahNumber: 47 }
    ]
  },
  {
    number: 9,
    nameAr: "الجزء التاسع",
    nameEn: "Juz 9",
    startSurahNumber: 7,
    startSurahName: "الأعراف",
    startAyahNumber: 88,
    hizbs: [
      { number: 17, nameAr: "الحزب السابع عشر", startSurahNumber: 7, startSurahName: "الأعراف", startAyahNumber: 88 },
      { number: 18, nameAr: "الحزب الثامن عشر", startSurahNumber: 7, startSurahName: "الأعراف", startAyahNumber: 171 }
    ]
  },
  {
    number: 10,
    nameAr: "الجزء العاشر",
    nameEn: "Juz 10",
    startSurahNumber: 8,
    startSurahName: "الأنفال",
    startAyahNumber: 41,
    hizbs: [
      { number: 19, nameAr: "الحزب التاسع عشر", startSurahNumber: 8, startSurahName: "الأنفال", startAyahNumber: 41 },
      { number: 20, nameAr: "الحزب العشرون", startSurahNumber: 9, startSurahName: "التوبة", startAyahNumber: 34 }
    ]
  },
  {
    number: 11,
    nameAr: "الجزء الحادي عشر",
    nameEn: "Juz 11",
    startSurahNumber: 9,
    startSurahName: "التوبة",
    startAyahNumber: 93,
    hizbs: [
      { number: 21, nameAr: "الحزب الحادي والعشرون", startSurahNumber: 9, startSurahName: "التوبة", startAyahNumber: 93 },
      { number: 22, nameAr: "الحزب الثاني والعشرون", startSurahNumber: 10, startSurahName: "يونس", startAyahNumber: 26 }
    ]
  },
  {
    number: 12,
    nameAr: "الجزء الثاني عشر",
    nameEn: "Juz 12",
    startSurahNumber: 11,
    startSurahName: "هود",
    startAyahNumber: 6,
    hizbs: [
      { number: 23, nameAr: "الحزب الثالث والعشرون", startSurahNumber: 11, startSurahName: "هود", startAyahNumber: 6 },
      { number: 24, nameAr: "الحزب الرابع والعشرون", startSurahNumber: 11, startSurahName: "هود", startAyahNumber: 84 }
    ]
  },
  {
    number: 13,
    nameAr: "الجزء الثالث عشر",
    nameEn: "Juz 13",
    startSurahNumber: 12,
    startSurahName: "يوسف",
    startAyahNumber: 53,
    hizbs: [
      { number: 25, nameAr: "الحزب الخامس والعشرون", startSurahNumber: 12, startSurahName: "يوسف", startAyahNumber: 53 },
      { number: 26, nameAr: "الحزب السادس والعشرون", startSurahNumber: 13, startSurahName: "الرعد", startAyahNumber: 19 }
    ]
  },
  {
    number: 14,
    nameAr: "الجزء الرابع عشر",
    nameEn: "Juz 14",
    startSurahNumber: 15,
    startSurahName: "الحجر",
    startAyahNumber: 1,
    hizbs: [
      { number: 27, nameAr: "الحزب السابع والعشرون", startSurahNumber: 15, startSurahName: "الحجر", startAyahNumber: 1 },
      { number: 28, nameAr: "الحزب الثامن والعشرون", startSurahNumber: 16, startSurahName: "النحل", startAyahNumber: 51 }
    ]
  },
  {
    number: 15,
    nameAr: "الجزء الخامس عشر",
    nameEn: "Juz 15",
    startSurahNumber: 17,
    startSurahName: "الإسراء",
    startAyahNumber: 1,
    hizbs: [
      { number: 29, nameAr: "الحزب التاسع والعشرون", startSurahNumber: 17, startSurahName: "الإسراء", startAyahNumber: 1 },
      { number: 30, nameAr: "الحزب الثلاثون", startSurahNumber: 18, startSurahName: "الكهف", startAyahNumber: 17 }
    ]
  },
  {
    number: 16,
    nameAr: "الجزء السادس عشر",
    nameEn: "Juz 16",
    startSurahNumber: 18,
    startSurahName: "الكهف",
    startAyahNumber: 75,
    hizbs: [
      { number: 31, nameAr: "الحزب الحادي والثلاثون", startSurahNumber: 18, startSurahName: "الكهف", startAyahNumber: 75 },
      { number: 32, nameAr: "الحزب الثاني والثلاثون", startSurahNumber: 20, startSurahName: "طه", startAyahNumber: 1 }
    ]
  },
  {
    number: 17,
    nameAr: "الجزء السابع عشر",
    nameEn: "Juz 17",
    startSurahNumber: 21,
    startSurahName: "الأنبياء",
    startAyahNumber: 1,
    hizbs: [
      { number: 33, nameAr: "الحزب الثالث والثلاثون", startSurahNumber: 21, startSurahName: "الأنبياء", startAyahNumber: 1 },
      { number: 34, nameAr: "الحزب الرابع والثلاثون", startSurahNumber: 22, startSurahName: "الحج", startAyahNumber: 38 }
    ]
  },
  {
    number: 18,
    nameAr: "الجزء الثامن عشر",
    nameEn: "Juz 18",
    startSurahNumber: 23,
    startSurahName: "المؤمنون",
    startAyahNumber: 1,
    hizbs: [
      { number: 35, nameAr: "الحزب الخامس والثلاثون", startSurahNumber: 23, startSurahName: "المؤمنون", startAyahNumber: 1 },
      { number: 36, nameAr: "الحزب السادس والثلاثون", startSurahNumber: 25, startSurahName: "الفرقان", startAyahNumber: 1 }
    ]
  },
  {
    number: 19,
    nameAr: "الجزء التاسع عشر",
    nameEn: "Juz 19",
    startSurahNumber: 25,
    startSurahName: "الفرقان",
    startAyahNumber: 21,
    hizbs: [
      { number: 37, nameAr: "الحزب السابع والثلاثون", startSurahNumber: 25, startSurahName: "الفرقان", startAyahNumber: 21 },
      { number: 38, nameAr: "الحزب الثامن والثلاثون", startSurahNumber: 26, startSurahName: "الشعراء", startAyahNumber: 111 }
    ]
  },
  {
    number: 20,
    nameAr: "الجزء العشرون",
    nameEn: "Juz 20",
    startSurahNumber: 27,
    startSurahName: "النمل",
    startAyahNumber: 56,
    hizbs: [
      { number: 39, nameAr: "الحزب التاسع والثلاثون", startSurahNumber: 27, startSurahName: "النمل", startAyahNumber: 56 },
      { number: 40, nameAr: "الحزب الأربعون", startSurahNumber: 28, startSurahName: "القصص", startAyahNumber: 51 }
    ]
  },
  {
    number: 21,
    nameAr: "الجزء الحادي والعشرون",
    nameEn: "Juz 21",
    startSurahNumber: 29,
    startSurahName: "العنكبوت",
    startAyahNumber: 46,
    hizbs: [
      { number: 41, nameAr: "الحزب الحادي والأربعون", startSurahNumber: 29, startSurahName: "العنكبوت", startAyahNumber: 46 },
      { number: 42, nameAr: "الحزب الثاني والأربعون", startSurahNumber: 31, startSurahName: "لقمان", startAyahNumber: 22 }
    ]
  },
  {
    number: 22,
    nameAr: "الجزء الثاني والعشرون",
    nameEn: "Juz 22",
    startSurahNumber: 33,
    startSurahName: "الأحزاب",
    startAyahNumber: 31,
    hizbs: [
      { number: 43, nameAr: "الحزب الثالث والأربعون", startSurahNumber: 33, startSurahName: "الأحزاب", startAyahNumber: 31 },
      { number: 44, nameAr: "الحزب الرابع والأربعون", startSurahNumber: 34, startSurahName: "سبأ", startAyahNumber: 23 }
    ]
  },
  {
    number: 23,
    nameAr: "الجزء الثالث والعشرون",
    nameEn: "Juz 23",
    startSurahNumber: 36,
    startSurahName: "يس",
    startAyahNumber: 28,
    hizbs: [
      { number: 45, nameAr: "الحزب الخامس والأربعون", startSurahNumber: 36, startSurahName: "يس", startAyahNumber: 28 },
      { number: 46, nameAr: "الحزب السادس والأربعون", startSurahNumber: 37, startSurahName: "الصافات", startAyahNumber: 145 }
    ]
  },
  {
    number: 24,
    nameAr: "الجزء الرابع والعشرون",
    nameEn: "Juz 24",
    startSurahNumber: 39,
    startSurahName: "الزمر",
    startAyahNumber: 32,
    hizbs: [
      { number: 47, nameAr: "الحزب السابع والأربعون", startSurahNumber: 39, startSurahName: "الزمر", startAyahNumber: 32 },
      { number: 48, nameAr: "الحزب الثامن والأربعون", startSurahNumber: 40, startSurahName: "غافر", startAyahNumber: 41 }
    ]
  },
  {
    number: 25,
    nameAr: "الجزء الخامس والعشرون",
    nameEn: "Juz 25",
    startSurahNumber: 41,
    startSurahName: "فصلت",
    startAyahNumber: 47,
    hizbs: [
      { number: 49, nameAr: "الحزب التاسع والأربعون", startSurahNumber: 41, startSurahName: "فصلت", startAyahNumber: 47 },
      { number: 50, nameAr: "الحزب الخمسون", startSurahNumber: 43, startSurahName: "الزخرف", startAyahNumber: 24 }
    ]
  },
  {
    number: 26,
    nameAr: "الجزء السادس والعشرون",
    nameEn: "Juz 26",
    startSurahNumber: 46,
    startSurahName: "الأحقاف",
    startAyahNumber: 1,
    hizbs: [
      { number: 51, nameAr: "الحزب الحادي والخمسون", startSurahNumber: 46, startSurahName: "الأحقاف", startAyahNumber: 1 },
      { number: 52, nameAr: "الحزب الثاني والخمسون", startSurahNumber: 48, startSurahName: "الفتح", startAyahNumber: 18 }
    ]
  },
  {
    number: 27,
    nameAr: "الجزء السابع والعشرون",
    nameEn: "Juz 27",
    startSurahNumber: 51,
    startSurahName: "الذاريات",
    startAyahNumber: 31,
    hizbs: [
      { number: 53, nameAr: "الحزب الثالث والخمسون", startSurahNumber: 51, startSurahName: "الذاريات", startAyahNumber: 31 },
      { number: 54, nameAr: "الحزب الرابع والخمسون", startSurahNumber: 54, startSurahName: "القمر", startAyahNumber: 55 }
    ]
  },
  {
    number: 28,
    nameAr: "الجزء الثامن والعشرون",
    nameEn: "Juz 28",
    startSurahNumber: 58,
    startSurahName: "المجادلة",
    startAyahNumber: 1,
    hizbs: [
      { number: 55, nameAr: "الحزب الخامس والخمسون", startSurahNumber: 58, startSurahName: "المجادلة", startAyahNumber: 1 },
      { number: 56, nameAr: "الحزب السادس والخمسون", startSurahNumber: 61, startSurahName: "الصف", startAyahNumber: 1 }
    ]
  },
  {
    number: 29,
    nameAr: "الجزء التاسع والعشرون",
    nameEn: "Juz 29",
    startSurahNumber: 67,
    startSurahName: "الملك",
    startAyahNumber: 1,
    hizbs: [
      { number: 57, nameAr: "الحزب السابع والخمسون", startSurahNumber: 67, startSurahName: "الملك", startAyahNumber: 1 },
      { number: 58, nameAr: "الحزب الثامن والخمسون", startSurahNumber: 72, startSurahName: "الجن", startAyahNumber: 1 }
    ]
  },
  {
    number: 30,
    nameAr: "الجزء الثلاثون",
    nameEn: "Juz 30",
    startSurahNumber: 78,
    startSurahName: "النبأ",
    startAyahNumber: 1,
    hizbs: [
      { number: 59, nameAr: "الحزب التاسع والخمسون", startSurahNumber: 78, startSurahName: "النبأ", startAyahNumber: 1 },
      { number: 60, nameAr: "الحزب الستون", startSurahNumber: 87, startSurahName: "الأعلى", startAyahNumber: 1 }
    ]
  }
];
