import fs from 'fs';

const surahs = [
  { num: 1, name: "الفاتحة", page: 1 },
  { num: 2, name: "البقرة", page: 2 },
  { num: 3, name: "آل عمران", page: 50 },
  { num: 4, name: "النساء", page: 77 },
  { num: 5, name: "المائدة", page: 106 },
  { num: 6, name: "الأنعام", page: 128 },
  { num: 7, name: "الأعراف", page: 151 },
  { num: 8, name: "الأنفال", page: 177 },
  { num: 9, name: "التوبة", page: 187 },
  { num: 10, name: "يونس", page: 208 },
  { num: 11, name: "هود", page: 221 },
  { num: 12, name: "يوسف", page: 235 },
  { num: 13, name: "الرعد", page: 249 },
  { num: 14, name: "إبراهيم", page: 255 },
  { num: 15, name: "الحجر", page: 262 },
  { num: 16, name: "النحل", page: 267 },
  { num: 17, name: "الإسراء", page: 282 },
  { num: 18, name: "الكهف", page: 293 },
  { num: 19, name: "مريم", page: 305 },
  { num: 20, name: "طه", page: 312 },
  { num: 21, name: "الأنبياء", page: 322 },
  { num: 22, name: "الحج", page: 332 },
  { num: 23, name: "المؤمنون", page: 342 },
  { num: 24, name: "النور", page: 350 },
  { num: 25, name: "الفرقان", page: 359 },
  { num: 26, name: "الشعراء", page: 367 },
  { num: 27, name: "النمل", page: 377 },
  { num: 28, name: "القصص", page: 385 },
  { num: 29, name: "العنكبوت", page: 396 },
  { num: 30, name: "الروم", page: 404 },
  { num: 31, name: "لقمان", page: 411 },
  { num: 32, name: "السجدة", page: 415 },
  { num: 33, name: "الأحزاب", page: 418 },
  { num: 34, name: "سبأ", page: 428 },
  { num: 35, name: "فاطر", page: 434 },
  { num: 36, name: "يس", page: 440 },
  { num: 37, name: "الصافات", page: 446 },
  { num: 38, name: "ص", page: 453 },
  { num: 39, name: "الزمر", page: 458 },
  { num: 40, name: "غافر", page: 467 },
  { num: 41, name: "فصلت", page: 477 },
  { num: 42, name: "الشورى", page: 483 },
  { num: 43, name: "الزخرف", page: 489 },
  { num: 44, name: "الدخان", page: 496 },
  { num: 45, name: "الجاثية", page: 499 },
  { num: 46, name: "الأحقاف", page: 502 },
  { num: 47, name: "محمد", page: 507 },
  { num: 48, name: "الفتح", page: 511 },
  { num: 49, name: "الحجرات", page: 515 },
  { num: 50, name: "ق", page: 518 },
  { num: 51, name: "الذاريات", page: 520 },
  { num: 52, name: "الطور", page: 523 },
  { num: 53, name: "النجم", page: 526 },
  { num: 54, name: "القمر", page: 528 },
  { num: 55, name: "الرحمن", page: 531 },
  { num: 56, name: "الواقعة", page: 534 },
  { num: 57, name: "الحديد", page: 537 },
  { num: 58, name: "المجادلة", page: 542 },
  { num: 59, name: "الحشر", page: 545 },
  { num: 60, name: "الممتحنة", page: 549 },
  { num: 61, name: "الصف", page: 551 },
  { num: 62, name: "الجمعة", page: 553 },
  { num: 63, name: "المنافقون", page: 554 },
  { num: 64, name: "التغابن", page: 556 },
  { num: 65, name: "الطلاق", page: 558 },
  { num: 66, name: "التحريم", page: 560 },
  { num: 67, name: "الملك", page: 562 },
  { num: 68, name: "القلم", page: 564 },
  { num: 69, name: "الحاقة", page: 566 },
  { num: 70, name: "المعارج", page: 568 },
  { num: 71, name: "نوح", page: 570 },
  { num: 72, name: "الجن", page: 572 },
  { num: 73, name: "المزمل", page: 574 },
  { num: 74, name: "المدثر", page: 575 },
  { num: 75, name: "القيامة", page: 577 },
  { num: 76, name: "الإنسان", page: 578 },
  { num: 77, name: "المرسلات", page: 580 },
  { num: 78, name: "النبأ", page: 582 },
  { num: 79, name: "النازعات", page: 583 },
  { num: 80, name: "عبس", page: 585 },
  { num: 81, name: "التكوير", page: 586 },
  { num: 82, name: "الانفطار", page: 587 },
  { num: 83, name: "المطففين", page: 587 },
  { num: 84, name: "الانشقاق", page: 589 },
  { num: 85, name: "البروج", page: 590 },
  { num: 86, name: "الطارق", page: 591 },
  { num: 87, name: "الأعلى", page: 591 },
  { num: 88, name: "الغاشية", page: 592 },
  { num: 89, name: "الفجر", page: 593 },
  { num: 90, name: "البلد", page: 594 },
  { num: 91, name: "الشمس", page: 595 },
  { num: 92, name: "الليل", page: 595 },
  { num: 93, name: "الضحى", page: 596 },
  { num: 94, name: "الشرح", page: 596 },
  { num: 95, name: "التين", page: 597 },
  { num: 96, name: "العلق", page: 597 },
  { num: 97, name: "القدر", page: 598 },
  { num: 98, name: "البينة", page: 598 },
  { num: 99, name: "الزلزلة", page: 599 },
  { num: 100, name: "العاديات", page: 599 },
  { num: 101, name: "القارعة", page: 600 },
  { num: 102, name: "التكاثر", page: 600 },
  { num: 103, name: "العصر", page: 601 },
  { num: 104, name: "الهمزة", page: 601 },
  { num: 105, name: "الفيل", page: 601 },
  { num: 106, name: "قريش", page: 602 },
  { num: 107, name: "الماعون", page: 602 },
  { num: 108, name: "الكوثر", page: 602 },
  { num: 109, name: "الكافرون", page: 603 },
  { num: 110, name: "النصر", page: 603 },
  { num: 111, name: "المسد", page: 603 },
  { num: 112, name: "الإخلاص", page: 604 },
  { num: 113, name: "الفلق", page: 604 },
  { num: 114, name: "الناس", page: 604 }
];

async function run() {
  const surahHeaderPositions = {}; // page -> Array of { surah, name, yCenter, height, isFirstSurahOnPage }

  for (const s of surahs) {
    if (s.page === 1) {
      if (!surahHeaderPositions[1]) surahHeaderPositions[1] = [];
      surahHeaderPositions[1].push({ surah: 1, name: "الفاتحة", yCenter: -33, height: 28, isPage1Or2: true });
      continue;
    }
    if (s.page === 2) {
      if (!surahHeaderPositions[2]) surahHeaderPositions[2] = [];
      surahHeaderPositions[2].push({ surah: 2, name: "البقرة", yCenter: -37, height: 28, isPage1Or2: true });
      continue;
    }

    const pStr = String(s.page).padStart(3, '0');
    const text = await (await fetch(`https://cdn.jsdelivr.net/gh/ahmedmabdullatif/quran-hafs-svg@main/svg/${pStr}.svg`)).text();

    // Look for ayah 1 polygon
    const polyMatch = text.match(new RegExp(`<path[^>]*class="ayahPolygon"[^>]*ayah="1"[^>]*surah="${s.num}"[^>]*d="([^"]+)"|<path[^>]*class="ayahPolygon"[^>]*surah="${s.num}"[^>]*ayah="1"[^>]*d="([^"]+)"`));
    
    let ayah1TopY = null;
    if (polyMatch) {
      const d = polyMatch[1] || polyMatch[2];
      const nums = (d.match(/[-+]?\d*\.?\d+/g) || []).map(Number);
      let minY = 9999;
      for (let i = 1; i < nums.length; i += 2) {
        if (nums[i] < minY) minY = nums[i];
      }
      ayah1TopY = minY;
    }

    // Determine surah header Y center
    // On standard Mushaf pages (height 550, text height ~490):
    // If a Surah is at the top of the page (starts at top, e.g. ayah1TopY ≈ 86 or 50):
    // Surah header banner is placed at yCenter ≈ 50 (or ~36px height between y=32 and y=68).
    // If Surah starts mid-page or bottom (e.g. ayah1TopY = 230.6):
    // Surah header banner is placed above the basmalah & ayah 1!
    // Note: Basmalah takes about 35-40px before Ayah 1 (unless Surah 9 At-Tawbah which has no Basmalah).
    // If Surah 9 (At-Tawbah), header is at top: yCenter ≈ 50 (no basmalah).
    // For other surahs starting at ayah1TopY:
    // When ayah1TopY is at top (around 86.6): header yCenter is ~50.2. (50.2 + 36/2 = 68.2; Basmalah is ~50-86; Ayah 1 starts at 86.6).
    // When ayah1TopY is mid-page (e.g. 230.6): header yCenter is around (ayah1TopY - 36 - 18) = (ayah1TopY - 54) ≈ 176 - 194.
    // Let's verify with <g id="content"> translate or precise layout!

    let headerYCenter = 50.2;
    if (ayah1TopY !== null) {
      if (ayah1TopY <= 95) {
        headerYCenter = 50.2;
      } else {
        // Between previous text line and basmalah
        // Example: on p.604, Ayah 1 of 113 starts at 230.6. The header is centered around 174-177.
        // On p.604, Ayah 1 of 114 starts at 410.6. The header is centered around 354-357.
        headerYCenter = Math.round((ayah1TopY - 56.5) * 10) / 10;
      }
    }

    if (!surahHeaderPositions[s.page]) surahHeaderPositions[s.page] = [];
    surahHeaderPositions[s.page].push({
      surah: s.num,
      name: s.name,
      ayah1TopY,
      yCenter: headerYCenter,
      height: 36
    });
  }

  console.log("Calculated header positions for all pages with surahs:");
  fs.writeFileSync('surah-header-positions.json', JSON.stringify(surahHeaderPositions, null, 2));
  console.log(`Saved ${Object.keys(surahHeaderPositions).length} pages.`);
}

run();
