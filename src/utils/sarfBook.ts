import { surahsList } from "../data/surahList";
import { Srf1Text } from "../data/Srf1Data";
import { Srf2Text } from "../data/Srf2Data";
import { quranEerabData } from "../data/quran_eerab";

function cleanArabic(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u064B-\u065F\u0670\u0671]/g, "")
    .replace(/[أإآءٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/^سورة\s+/, "")
    .replace(/^سوره\s+/, "")
    .replace(/[\(\)\[\]:.\-_]/g, "")
    .trim();
}

function stripQuranicMarks(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u0671\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, "")
    .replace(/[{}﴿﴾]/g, "")
    .trim();
}

/**
 * Smart rule-based offline Grammatical Analyzer (إعراب الآية)
 */
function generateSmartOfflineEerab(
  surahNumber: number,
  ayahNumber: number,
  surahName?: string,
  ayahText?: string
): string {
  const sMeta = surahsList.find((s) => s.number === surahNumber);
  const sName = surahName || sMeta?.name || `السورة ${surahNumber}`;
  const rawText = ayahText || "";
  const cleanedText = stripQuranicMarks(rawText);
  const words = cleanedText.split(/\s+/).filter(Boolean);

  let output = `### 📖 إعراب الآية (${sName} - آية ${ayahNumber})\n\n`;
  output += `قال الله تعالى: (${rawText})\n\n`;
  output += `#### 📍 أولاً: إعراب المفردات (تحليل إعرابي دقيق كلمة بكلمة):\n\n`;

  const items: string[] = [];

  words.forEach((word, idx) => {
    const norm = cleanArabic(word);

    // Prepositions / Particles
    if (/^(باسم|بسم)$/.test(norm)) {
      items.push(`(${word}): الباء حرف جر مبني على الكسر، و"اسم": اسم مجرور وعلامة جره الكسرة الظاهرة، وهو مضاف.`);
    } else if (/^(الله|لله|بالله|فالله|تالله|والله)$/.test(norm)) {
      if (norm === "لله") {
        items.push(`(${word}): اللام حرف جر، ولفظ الجلالة "الله": اسم مجرور وعلامة جره الكسرة الظاهرة للتعظيم.`);
      } else if (norm === "بالله" || norm === "تالله" || norm === "والله") {
        items.push(`(${word}): حرف جر وقسم، ولفظ الجلالة "الله": اسم مجرور وعلامة جره الكسرة للتعظيم.`);
      } else {
        items.push(`(${word}): (لفظ الجلالة) اسم كريم عظيم القدر معرب بحسب موقعه الإعرابي في سياق النظم للتعظيم.`);
      }
    } else if (/^(الرحمن|الرحيم)$/.test(norm)) {
      items.push(`(${word}): نعت للفظ الجلالة أو صفة مجرورة وعلامة جرها الكسرة الظاهرة.`);
    } else if (/^(الحمد)$/.test(norm)) {
      items.push(`(${word}): مبتدأ مرفوع وعلامة رفعه الضمة الظاهرة على آخره.`);
    } else if (/^(رب)$/.test(norm)) {
      items.push(`(${word}): نعت مجرور وعلامة جره الكسرة الظاهرة، وهو مضاف.`);
    } else if (/^(العالمين)$/.test(norm)) {
      items.push(`(${word}): مضاف إليه مجرور وعلامة جره الياء لأنه ملحق بجمع المذكر السالم.`);
    } else if (/^(اياك)$/.test(norm)) {
      items.push(`(${word}): ضمير منفصل مبني على الفتح في محل نصب مفعول به مقدم للحصر والاختصاص.`);
    } else if (/^(نعبد|نستعين|يؤمنون|ينفقون|يعلمون|يشعرون|يتقون|يفلحون|يكذبون|يعملون)$/.test(norm)) {
      if (norm.endsWith("ون")) {
        items.push(`(${word}): فعل مضارع مرفوع وعلامة رفعه ثبوت النون لأنه من الأفعال الخمسة، والواو ضمير متصل مبني في محل رفع فاعل.`);
      } else {
        items.push(`(${word}): فعل مضارع مرفوع وعلامة رفعه الضمة الظاهرة، والفاعل ضمير مستتر تقديره (نحن).`);
      }
    } else if (/^(اهدنا|اقم|اقرا|قل|سبح|استغفر|توب|ادع)$/.test(norm)) {
      if (norm === "اهدنا") {
        items.push(`(${word}): فعل أمر (دعاء) مبني على حذف حرف العلة، و"نا" ضمير متصل مبني في محل نصب مفعول به أول، والفاعل مستتر.`);
      } else if (norm === "قل") {
        items.push(`(${word}): فعل أمر مبني على السكون، والفاعل ضمير مستتر وجوباً تقديره (أنت).`);
      } else {
        items.push(`(${word}): فعل أمر مبني على السكون (أو حذف حرف العلة)، والفاعل ضمير مستتر تقديره (أنت).`);
      }
    } else if (/^(ذالك|ذلك|هذا|هذه|هؤلاء|اولئك|تلك)$/.test(norm)) {
      items.push(`(${word}): اسم إشارة مبني في محل رفع/نصب حسب موقعه التركيبي.`);
    } else if (/^(الكتاب|القران|الصراط|المستقيم)$/.test(norm)) {
      items.push(`(${word}): بدل/نعت/خبر منصوب أو مرفوع وعلامة إعرابه الحركة الظاهرة.`);
    } else if (/^(لا)$/.test(norm)) {
      items.push(`(${word}): حرف نفي مبني على السكون لا محل له من الإعراب (أو نافية للجنس).`);
    } else if (/^(ريب)$/.test(norm)) {
      items.push(`(${word}): اسم لا نافية للجنس مبني على الفتح في محل نصب.`);
    } else if (/^(فيه|فيهما|فيهم|عليها|عليهم|اليهم|منهم|به|بهم|لنا|لكم|له|لها)$/.test(norm)) {
      items.push(`(${word}): جار ومجرور (أو متعلقان بمحذوف خبر أو حال أو بالفعل السابق).`);
    } else if (/^(هدى)$/.test(norm)) {
      items.push(`(${word}): خبر مبتدأ أو حال مرفوع/منصوب بضمة أو فتحة مقدرة على الألف للتعذر.`);
    } else if (/^(للمتقين|للمؤمنين|للصابرين|للكافرين|للظالمين)$/.test(norm)) {
      items.push(`(${word}): اللام حرف جر، والاسم بعدها مجرور وعلامة جره الياء لأنه جمع مذكر سالم.`);
    } else if (/^(إن|ان|إنا|اننا|كان|لكن|ليت|لعل)$/.test(norm)) {
      items.push(`(${word}): حرف توكيد ونصب ناسخ (ينصب المبتدأ اسماً له ويرفع الخبر).`);
    } else if (/^(الذين|الذي|التي|اللواتي|اللاتي|من|ما)$/.test(norm)) {
      items.push(`(${word}): اسم موصول مبني على الفتح/السكون في محل رفع أو نصب أو جر بحسب موقعه.`);
    } else if (/^(من|عن|في|على|إلى|حتى|مذ|منذ|رب)$/.test(norm)) {
      items.push(`(${word}): حرف جر مبني لا محل له من الإعراب.`);
    } else if (/^(هو|هي|هما|هم|هن|انت|انتم|انا|نحن)$/.test(norm)) {
      items.push(`(${word}): ضمير منفصل مبني في محل رفع مبتدأ أو فاعل أو تأكيد.`);
    } else if (/^(قال|قالوا|قالت|كان|كانوا|امنا|كفروا|جاء|انزل|خلق|جعل)$/.test(norm)) {
      if (norm.endsWith("وا")) {
        items.push(`(${word}): فعل ماضٍ مبني على الضم لاتصاله بواو الجماعة، والواو ضمير متصل مبني في محل رفع فاعل.`);
      } else {
        items.push(`(${word}): فعل ماضٍ مبني على الفتح الظاهر، والفاعل اسم ظاهر أو ضمير مستتر.`);
      }
    } else if (norm.startsWith("و") && word.length > 2) {
      items.push(`(${word}): الواو حرف عطف (أو استئناف أو حال)، وما بعدها معطوف أو مستأنف بحسب السياق.`);
    } else if (norm.startsWith("ف") && word.length > 2) {
      items.push(`(${word}): الفاء رابطة لجواب الشرط أو عاطفة تفيد الترتيب والتعقيب.`);
    } else if (word.startsWith("ال")) {
      items.push(`(${word}): اسم معرف بـ (أل) معرب بحسب موقعه الإعرابي في الجملة (مرفوع أو منصوب أو مجرور).`);
    } else if (word.endsWith("ون") || word.endsWith("ين")) {
      items.push(`(${word}): صيغة جمع مذكر سالم أو من الأفعال الخمسة معربة بالحروف.`);
    } else {
      items.push(`(${word}): مفردة قرآنية كريمة، معربة بحسب موقعها التركيبي والسياقي في الآية.`);
    }
  });

  output += items.join("\n") + "\n\n";

  output += `#### 📍 ثانياً: إعراب الجمل والسياق التركيبي:\n`;
  output += `- جملة الآية الكريمة: جملة تامة النظم محكمة البناء، ذات دلالة عقدية وتشريعية وسلوكية أصيلة.\n`;
  output += `- المحل الإعرابي للجمل: الجملة استئنافية أو ابتدائية لا محل لها من الإعراب، أو معطوفة على ما قبلها، وتشتمل على ما يتبعها من صلات موصول ومتعلقات الجار والمجرور التابعة لمعاني الأفعال.`;

  return output.replace(/\*{1,3}/g, "").trim();
}

/**
 * Smart rule-based offline Morphological Analyzer (التحليل الصرفي)
 */
function generateSmartOfflineSarf(
  surahNumber: number,
  ayahNumber: number,
  surahName?: string,
  ayahText?: string
): string {
  const sMeta = surahsList.find((s) => s.number === surahNumber);
  const sName = surahName || sMeta?.name || `السورة ${surahNumber}`;
  const rawText = ayahText || "";
  const cleanedText = stripQuranicMarks(rawText);
  const words = cleanedText.split(/\s+/).filter(Boolean);

  let output = `### 🔍 التحليل الصرفي لألفاظ الآية (${sName} - آية ${ayahNumber})\n\n`;
  output += `قال الله تعالى: (${rawText})\n\n`;
  output += `#### 📍 البنية الصرفية والموازين العروضية للكلمات:\n\n`;

  const items: string[] = [];

  words.forEach((word) => {
    const norm = cleanArabic(word);

    if (norm === "اسم" || norm === "بسم") {
      items.push(`- (اسم): اسم جامد، أصله (سُمُوّ) وزنه (فِعْل) من جذر (سمو)، سقطت لامه وعوّض عنها همزة الوصل.`);
    } else if (norm === "الله" || norm === "لله") {
      items.push(`- (الله): علم على الذات الإلهية العلية، أصله (الإِله) حذفت الهمزة لكثرة الاستعمال وأُدغمت اللام باللام.`);
    } else if (norm === "الرحمن") {
      items.push(`- (الرَّحْمَٰنِ): صفة مشبهة باسم الفاعل على وزن (فَعْلاَن) من المادة الثلاثية (رحم) دالة على السعة والشمول.`);
    } else if (norm === "الرحيم") {
      items.push(`- (الرَّحِيمِ): صفة مشبهة أو صيغة مبالغة على وزن (فَعِيل) من المادة الثلاثية (رحم) دالة على الثبوت والتجدد.`);
    } else if (norm === "الحمد") {
      items.push(`- (الْحَمْدُ): مصدر سماعي للفعل الثلاثي (حَمِدَ) وزنه (فَعْل) من جذر (حمد).`);
    } else if (norm === "رب") {
      items.push(`- (رَبِّ): صفة مشبهة/اسم جامع وزنه (فَعْل) أصله (رَبَبَ) أدغمت الباءان من جذر (ربب).`);
    } else if (norm === "العالمين") {
      items.push(`- (الْعَالَمِينَ): جمع مذكر سالم ملحق، مفرده (عَالَم) وزنه (فَاعَل) من جذر (علم).`);
    } else if (norm === "مالك") {
      items.push(`- (مَالِكِ): اسم فاعل من الفعل الثلاثي المجرد (مَلَكَ) وزنه (فَاعِل) من جذر (ملك).`);
    } else if (norm === "يوم") {
      items.push(`- (يَوْمِ): اسم ذات وزمن جامد وزنه (فَعْل) من جذر (يوم).`);
    } else if (norm === "الدين") {
      items.push(`- (الدِّينِ): مصدر قياسي للفعل (دَانَ يَدِينُ) وزنه (فِعْل) من جذر (دين).`);
    } else if (norm === "نعبد") {
      items.push(`- (نَعْبُدُ): فعل مضارع ثلاثي مجرد وزنه (نَفْعُلُ) من جذر (عبد).`);
    } else if (norm === "نستعين") {
      items.push(`- (نَسْتَعِينُ): فعل مضارع مزيد بالسين والتاء للاستدعاء وزنه (نَسْتَفِيلُ) أصله (نَسْتَعْوِنُ) من جذر (عون).`);
    } else if (norm.includes("متقين") || norm.includes("المتقين")) {
      items.push(`- (الْمُتَّقِينَ): جمع اسم الفاعل (مُتَّقِي) من الفعل الخماسي (اتَّقَى) أصله (اوْتَقَى) أُبدلت الواو تاء وأدغمت وزنه (مُفْتَعِلِينَ) من جذر (وقي).`);
    } else if (norm.includes("مفلحون") || norm.includes("المفلحون")) {
      items.push(`- (الْمُفْلِحُونَ): جمع اسم الفاعل (مُفْلِح) من الفعل الرباعي المزيد بالهمزة (أَفْلَحَ) وزنه (مُفْعِلُونَ) من جذر (فلح).`);
    } else if (norm.includes("يؤمنون")) {
      items.push(`- (يُؤْمِنُونَ): مضارع رباعي مزيد بالهمزة (آمن/أأمن) وزنه (يُفْعِلُونَ) من جذر (أمن).`);
    } else {
      // General morphological breakdown
      let typeStr = "اسم مشتق/جامد أو فعل معرب";
      let rootStr = "ثلاثي مجرد/مزيد";
      if (word.startsWith("ال")) typeStr = "اسم معرف بـ (أل)";
      if (word.endsWith("ون") || word.endsWith("ين")) typeStr += " (صيغة جمع أو أفعال خمسة)";

      items.push(`- (${word}): ${typeStr}، وزنه الصرفي متناسق مع بنية الكلمة وجذرها اللغوي.`);
    }
  });

  output += items.join("\n") + "\n\n";
  output += `#### 📍 ميزات الصيغة والخصائص المورفولوجية:\n`;
  output += `- الكلمات تجمع بين الجمال اللفظي والاتساق مع الفواصل القرآنية.\n`;
  output += `- اختيار الصيغ الصرفية يخدم المعنى الدقيق والمراد الإلهي في الآية.\n`;

  return output.replace(/\*{1,3}/g, "").trim();
}

/**
 * Smart rule-based offline Rhetorical Analyzer (أسرار البلاغة)
 * Extracts specific rhetorical devices, metaphors, contrasts, questions, emphasis, and wording directly from the Ayah.
 */
function generateSmartOfflineBalagha(
  surahNumber: number,
  ayahNumber: number,
  surahName?: string,
  ayahText?: string
): string {
  const sMeta = surahsList.find((s) => s.number === surahNumber);
  const sName = surahName || sMeta?.name || `السورة ${surahNumber}`;
  const rawText = ayahText || "";
  const cleanedText = stripQuranicMarks(rawText);
  const normText = cleanArabic(cleanedText);
  const words = cleanedText.split(/\s+/).filter(Boolean);

  let output = `### ✨ أسرار البلاغة والبيان (${sName} - آية ${ayahNumber})\n\n`;
  output += `قال الله تعالى: (${rawText})\n\n`;

  // 1. علم المعاني (دقة النظم والأساليب البلاغية الخاصة بالآية)
  output += `#### 1️⃣ علم المعاني ودقة النظم القرآني في الآية:\n`;
  const maaniPoints: string[] = [];

  if (normText.includes("اياك نعبد") || (normText.includes("اياك") && normText.includes("نستعين"))) {
    maaniPoints.push(`- التقديم والتأخير والقصر: تقديم المفعول به (إِيَّاكَ) على الفعلين (نَعْبُدُ) و(نَسْتَعِينُ) يفيد الحصر والتخصيص؛ أي: نخصك وحدك بالعبادة والاستعانة ولا نعبد ولا نستعين بسواك، وتقديم العبادة على الاستعانة لتقديم الوسيلة على الغاية وحق الله على حق العبد.`);
  }

  if (normText.includes("فيه") || normText.includes("عليهم") || normText.includes("منهم") || normText.includes("له") || normText.includes("اليها")) {
    const jarMatch = cleanedText.match(/\b(فيه|فيها|عليهم|علَيْهم|علَيها|منهم|منها|له|لها|إليه|إليها|بهم|بها)\b/);
    if (jarMatch && !maaniPoints.some(p => p.includes("الجار والمجرور"))) {
      maaniPoints.push(`- تقديم الجار والمجرور (${jarMatch[0]}): جاء التقديم في سياق النظم لإفادة العناية والاهتمام والتقرير وتأكيد اختصاص المعنى في الآية.`);
    }
  }

  if (/^(قل|اقرا|اتل|سبح|ادع|استغفر|اقم|اعلم|يا ايها|يا بني|يا عبادي)/.test(normText) || normText.includes("اهدنا") || normText.includes("ربنا") || normText.includes("اللهم")) {
    if (normText.includes("اهدنا") || normText.includes("ربنا") || normText.includes("اغفر") || normText.includes("ارحمنا") || normText.includes("تب علينا")) {
      maaniPoints.push(`- أسلوب الدعاء والتضرع: خرجت صيغة الطلب في الآية مخرج الدعاء والرجاء المستمر والتذلل لعظمة الخالق جل وعلا.`);
    } else if (normText.includes("قل")) {
      maaniPoints.push(`- أسلوب التلقين والتبليغ (قُلْ): تصدير الخطاب بفعل الأمر (قُلْ) لبيان أن القول وحي معجز منزّل من عند الله، وترسيخ أهمية الحكم المبلّغ.`);
    } else {
      maaniPoints.push(`- أسلوب الإنشاء الطلبي (الأمر/النداء): التكليف المباشر والنداء الموجه لشحذ الهمة ولفت الانتباه لأمر عظيم المقدار.`);
    }
  }

  // أساليب التوكيد الخاصة بالآية
  const emphasisParts: string[] = [];
  if (normText.includes("ان ") || normText.includes("انما") || normText.includes("انك") || normText.includes("انه") || normText.includes("انهم") || normText.includes("انا ")) {
    emphasisParts.push("حرف التوكيد المشبه بالفعل (إِنَّ / أَنَّ)");
  }
  if (normText.includes("لقد") || normText.includes("قد ")) {
    emphasisParts.push("حرف التحقيق والتوكيد (قَدْ / لَقَدْ)");
  }
  if (normText.includes("والله") || normText.includes("والعصر") || normText.includes("والشمس") || normText.includes("والفجر") || normText.includes("والتين") || normText.includes("والضحى") || normText.includes("والليل") || normText.includes("تالله")) {
    emphasisParts.push("أسلوب القسم الرباني لتعظيم المقسم به وتأكيد المقسم عليه");
  }
  if (normText.includes("كلا") || normText.includes("بلى")) {
    emphasisParts.push("حرف الردع والزجر والتوكيد (كَلَّا / بَلَى)");
  }
  if (normText.includes("انما")) {
    emphasisParts.push("أداة القصر والحصر (إِنَّمَا)");
  }

  if (emphasisParts.length > 0) {
    maaniPoints.push(`- التوكيد البلاغي: استخدمت الآية ${emphasisParts.join(" و")} لدفع الشك والإنكار وتثبيت عظمة الحقيقة القرآنية في وجدان المتلقي.`);
  }

  // الاستفهام والاستنكار
  if (normText.includes("أ") || normText.includes("هل") || normText.includes("كيف") || normText.includes("اين") || normText.includes("ماذا") || normText.includes("من ذا") || normText.includes("افلا") || normText.includes("الم ")) {
    const istifhamWord = words.find(w => /^(أ|أَ|أَلا|أَفَلا|أَلَم|هَل|كَيْف|أَيْن|مَاذَا|مَن)$/.test(w));
    if (istifhamWord || normText.includes("افلا") || normText.includes("الم")) {
      maaniPoints.push(`- الاستفهام البلاغي: خروج أداة الاستفهام في الآية عن حقيقتها إلى معاني التقرير، والتعجيب، والحث على التدبر، وإقامة الحجة على المنكرين.`);
    }
  }

  if (maaniPoints.length === 0) {
    maaniPoints.push(`- سلامة النظم وبراعة الربط: ترابط الجمل في هذه الآية على نسق يربط بين الأسباب ومسبباتها والغايات ووسائلها بدقة بالغة.`);
    maaniPoints.push(`- الإسناد الخبري المؤكد: صياغة خبرية صادقة قطعية الدلالة تدل على الثبوت والاستقرار التام في المعنى.`);
  }

  output += maaniPoints.join("\n") + "\n\n";

  // 2. علم البيان (الصور البيانية والتشبيه والاستعارة والكناية الخاصة بمفردات الآية)
  output += `#### 2️⃣ علم البيان والصور القرآنية في الآية:\n`;
  const bayanPoints: string[] = [];

  // فحص الكناية والاستعارة في ألفاظ الآية المحددة
  if (normText.includes("صراط") || normText.includes("سبيل") || normText.includes("طريق")) {
    const sWord = words.find(w => cleanArabic(w).includes("صراط") || cleanArabic(w).includes("سبيل"));
    bayanPoints.push(`- الاستعارة التصريحية في (${sWord || "الصِّرَاط"}): شبّه الدين الحق والمنهج القويم بالطريق المستقيم الواضح بجامع الإيصال إلى النجاة والسلامة، وحذف المشبه وصرح بالمشبه به.`);
  }

  if (normText.includes("نور") || normText.includes("ظلمات") || normText.includes("ضلال") || normText.includes("عمى")) {
    bayanPoints.push(`- الاستعارة البيانية المقابلة: استعارة (النور) للحق والإيمان، واستعارة (الظلمات والعمى) للباطل والكفر، للتجسيم وإبراز المعقول في صورة المحسوس الجلي.`);
  }

  if (normText.includes("يد الله") || normText.includes("عين") || normText.includes("عرش") || normText.includes("كرسي") || normText.includes("ملك")) {
    bayanPoints.push(`- الكناية والتصوير العظيم: استخدام ألفاظ الجلالة والعظمة كناية عن القدرة المطلقة، والكمال، والإحاطة الشاملة بكل ما في الكون.`);
  }

  if (normText.includes("ختم") || normText.includes("طبع") || normText.includes("غشاوة") || normText.includes("وقر") || normText.includes("صم") || normText.includes("بكم")) {
    bayanPoints.push(`- التمثيل والتشبيه الضمني: تصوير قلوب الغافلين والمكذبين في جمودها وعدم انتفاعها بالحق بصورة الشيء المختوم عليه أو المحجوب بغطاء سميك.`);
  }

  if (normText.includes("جنة") || normText.includes("نار") || normText.includes("انهار") || normText.includes("شجرة") || normText.includes("عذاب")) {
    bayanPoints.push(`- التصوير الحسي المبدع: نقل مشاهد الجزاء الأخروي في الآية إلى صور حيّة تثير الرهبة من العذاب والشوق إلى النعيم المقيم.`);
  }

  if (normText.includes("الرحمن") && normText.includes("الرحيم")) {
    bayanPoints.push(`- التدرج الدلالي في الصفات الإلهية: الجمع بين (الرَّحْمَٰن) الدال على سعة الرحمة وعمومها لجميع الخلائق، و(الرَّحِيم) الدال على دوامها وخصوصها بعباده المؤمنين.`);
  }

  if (bayanPoints.length === 0) {
    // التقاط أول كلمتين بارزتين في الآية لإبراز التصوير البياني الخاص بهما
    const significantWords = words.filter(w => w.length >= 3 && !/^(من|في|على|إلى|عن|ما|لا|هو|هم|ذا|ذو|قد|إن|أن)$/.test(cleanArabic(w)));
    const sampleWords = significantWords.slice(0, 2).map(w => `(${w})`).join(" و");
    bayanPoints.push(`- التجسيم والدلالة البيانية: تبرز الألفاظ القرآنية في الآية (${sampleWords || "مفردات الآية"}) المعاني المعنوية بصورة لفظية واضحة المعالم نابضة بالحياة والتأثير.`);
    bayanPoints.push(`- الكناية الدقيقة: التعبير باللفظ الموضوع وإرادة لازمه المعنوي بما يرفع من فصاحة التركيب ويغرس المقصد في القلب.`);
  }

  output += bayanPoints.join("\n") + "\n\n";

  // 3. علم البديع (المحسنات اللفظية والمعنوية والطباق والمقابلة والفواصل في الآية)
  output += `#### 3️⃣ علم البديع ومحاسن التعبير في الآية:\n`;
  const badiPoints: string[] = [];

  // البحث عن الطباق (المتضادات)
  const opposites = [
    ["الرحمن", "الرحيم"],
    ["المغضوب عليهم", "انعمت"],
    ["الضالين", "المستقيم"],
    ["الهدى", "الضلال"],
    ["النور", "الظلمات"],
    ["السموات", "الارض"],
    ["الليل", "النهار"],
    ["الحي", "الميت"],
    ["السر", "العلن"],
    ["يعلمون", "لا يعلمون"],
    ["يؤمنون", "كفروا"],
    ["الجنة", "النار"],
    ["خير", "شر"],
    ["حق", "باطل"],
    ["اول", "اخر"],
    ["ظاهر", "باطن"],
    ["يحيي", "يميت"],
    ["يبسط", "يقدر"]
  ];

  let foundOpposite = false;
  for (const [w1, w2] of opposites) {
    if (normText.includes(cleanArabic(w1)) && normText.includes(cleanArabic(w2))) {
      badiPoints.push(`- الطباق الإيجابي المعنوي بين (${w1}) و(${w2}): لإبراز المعنى وتوضيح الفروق الدقيقة؛ فالأشياء تزداد وضوحاً بأضدادها.`);
      foundOpposite = true;
      break;
    }
  }

  // الجناس الصوتي والاشتقاقي بين كلمات الآية
  const stems = words.map(w => ({ raw: w, norm: cleanArabic(w).slice(0, 4) }));
  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      if (stems[i].norm.length >= 3 && stems[i].norm === stems[j].norm && stems[i].raw !== stems[j].raw) {
        badiPoints.push(`- الجناس والاشتقاق اللفظي بين (${stems[i].raw}) و(${stems[j].raw}): يعطي تآلفاً صوتياً وجرساً نغمياً يثبت المعنى في ذهن السامع.`);
        foundOpposite = true;
        break;
      }
    }
    if (badiPoints.some(p => p.includes("الجناس"))) break;
  }

  // الفاصلة القرآنية والتناسب الصوتي لآخر الآية
  const lastWord = words[words.length - 1] || "";
  if (lastWord) {
    const rhymeEnding = lastWord.slice(-3).replace(/[\u064B-\u065F]/g, "");
    badiPoints.push(`- جمال الفاصلة القرآنية المنسجمة (${lastWord}): ختام الآية بحرف وروي متناسق مع السورة يُحدث جرساً صوتياً بديعاً ووقعاً مؤثراً في النفس.`);
  }

  if (badiPoints.length <= 1) {
    badiPoints.push(`- حسن الابتداء والختام: توافق مطلع الآية ومفرداتها مع خاتمتها بما يحقق التمام والكمال في التعبير.`);
  }

  output += badiPoints.join("\n") + "\n\n";

  // 4. بلاغة الإيجاز ودقة الإعجاز القرآني
  output += `#### 4️⃣ لطائف الإعجاز ودقة الاختيار اللفظي:\n`;
  output += `- إيجاز القصر في الآية: تضمن كلماتها أعمق المعاني الإيمانية والتشريعية بأوجز لفظ وأعذب عبارة دون حشو أو تطويل.\n`;
  output += `- مناسبة الألفاظ للسياق: كل حرف وحركة إعرابية في الآية مقصودة بعناية لخدمة المقصد العام للسورة (${sName}).`;

  return output.replace(/\*{1,3}/g, "").trim();
}

/**
 * Primary offline interface for Sarf, Eerab, and Balagha.
 * Always guarantees 100% offline functionality without needing internet network calls!
 */
export function getOfflineSarf(
  surahNumber: number,
  ayahNumber: number,
  surahName?: string,
  ayahText?: string,
  mode?: string,
  allowHeuristicFallback: boolean = false
): string | null {
  const normMode = (mode || "all").toLowerCase();

  const eerabKey = `${surahNumber}:${ayahNumber}`;
  const localEerab = quranEerabData ? quranEerabData[eerabKey] : undefined;

  // Find matched blocks from Srf1 / Srf2 for Sarf & Balagha
  const combinedRawText = ((Srf1Text || "") + "\n\n" + (Srf2Text || "")).trim();
  const currentSurahMeta = surahsList.find((s) => s.number === surahNumber);
  const targetSurahName = cleanArabic(surahName || currentSurahMeta?.name || "");
  const targetSurahNum = surahNumber;
  const targetAyahNum = ayahNumber;

  const matchedBlocks: string[] = [];

  if (combinedRawText) {
    const blocks = combinedRawText.split(/(?=\[(?:سورة|\d+)|(?:\r?\n){2,})/gi);

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed || trimmed.startsWith("===") || trimmed.startsWith("المصدر:")) continue;

      let isMatch = false;

      const headerMatch = trimmed.match(/\[(?:سورة\s+)?([^\]\d]+)?\s*(\d+)[\:\s]*(\d+)?\]/i);
      if (headerMatch) {
        const namePart = headerMatch[1] ? cleanArabic(headerMatch[1]) : "";
        const num1 = parseInt(headerMatch[2], 10);
        const num2 = headerMatch[3] ? parseInt(headerMatch[3], 10) : null;

        if (num2 !== null) {
          if (num1 === targetSurahNum && num2 === targetAyahNum) {
            isMatch = true;
          }
        } else {
          if (num1 === targetAyahNum && (namePart.includes(targetSurahName) || targetSurahName.includes(namePart))) {
            isMatch = true;
          }
        }
      }

      if (!isMatch) {
        const lineMatch = trimmed.match(/(?:سورة\s+)?([^\d\n]+)?\s*(\d+)[\:\s]+(?:آية\s+)?(\d+)/i);
        if (lineMatch) {
          const namePart = lineMatch[1] ? cleanArabic(lineMatch[1]) : "";
          const sNum = parseInt(lineMatch[2], 10);
          const aNum = parseInt(lineMatch[3], 10);

          if ((sNum === targetSurahNum || namePart.includes(targetSurahName)) && aNum === targetAyahNum) {
            isMatch = true;
          }
        }
      }

      if (isMatch) {
        matchedBlocks.push(trimmed);
      }
    }
  }

  // 1. EERAB / BOOK_IRAB mode: Return ONLY Eerab and sentence analysis
  if (normMode === "eerab" || normMode === "book_irab" || normMode === "irab") {
    if (localEerab) {
      return localEerab.replace(/\*{1,3}/g, "").trim();
    }
    // Filter matched blocks from book that contain Eerab
    const eerabBlocks = matchedBlocks.filter(b => b.includes("الإعراب") || b.includes("إعراب"));
    if (eerabBlocks.length > 0) {
      const formattedBody = eerabBlocks
        .map((blk) => blk.replace(/^\[[^\]]+\]\s*/, "").trim())
        .join("\n\n---\n\n");
      return formattedBody.replace(/\*{1,3}/g, "").trim();
    }
    if (allowHeuristicFallback) {
      return generateSmartOfflineEerab(surahNumber, ayahNumber, surahName, ayahText)?.replace(/\*{1,3}/g, "") || null;
    }
    return null;
  }

  // 2. SARF / BOOK_SARF mode: Return ONLY Sarf (التحليل الصرفي)
  if (normMode === "sarf" || normMode === "book_sarf") {
    if (matchedBlocks.length > 0) {
      const formattedBody = matchedBlocks
        .map((blk) => blk.replace(/^\[[^\]]+\]\s*/, "").trim())
        .join("\n\n---\n\n");
      return formattedBody.replace(/\*{1,3}/g, "").trim();
    }
    if (allowHeuristicFallback) {
      return generateSmartOfflineSarf(surahNumber, ayahNumber, surahName, ayahText)?.replace(/\*{1,3}/g, "") || null;
    }
    return null;
  }

  // 3. BALAGHA / BOOK_BALAGHA mode: Return ONLY Balagha & Bayan
  if (normMode === "balagha" || normMode === "book_balagha") {
    const balaghaBlocks = matchedBlocks.filter(b => b.includes("البلاغة") || b.includes("البيان"));
    if (balaghaBlocks.length > 0) {
      const formattedBody = balaghaBlocks
        .map((blk) => blk.replace(/^\[[^\]]+\]\s*/, "").trim())
        .join("\n\n---\n\n");
      return formattedBody.replace(/\*{1,3}/g, "").trim();
    }
    if (allowHeuristicFallback) {
      return generateSmartOfflineBalagha(surahNumber, ayahNumber, surahName, ayahText)?.replace(/\*{1,3}/g, "") || null;
    }
    return null;
  }

  // 4. Default / BOOK_JADWAL_SAFI / ALL: Return combined sections if available
  if (localEerab || matchedBlocks.length > 0) {
    let contentBody = "";

    if (localEerab) {
      contentBody += `#### 📍 الإعراب والجمل:\n${localEerab}\n\n`;
    }

    if (matchedBlocks.length > 0) {
      const formattedBody = matchedBlocks
        .map((blk) => blk.replace(/^\[[^\]]+\]\s*/, "").trim())
        .join("\n\n---\n\n");
      contentBody += `#### 📍 التحليل الصرفي:\n${formattedBody}`;
    }

    return contentBody.replace(/\*{1,3}/g, "").trim();
  }

  if (allowHeuristicFallback) {
    let contentBody = `${generateSmartOfflineEerab(surahNumber, ayahNumber, surahName, ayahText)}\n\n${generateSmartOfflineSarf(surahNumber, ayahNumber, surahName, ayahText)}`;
    return contentBody.replace(/\*{1,3}/g, "").trim();
  }

  return null;
}
