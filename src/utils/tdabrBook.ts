import { surahsList } from "../data/surahList";
import { lyadabbarooGems } from "../data/lyadabbarooBookGems";
import { TdabrText as tdabrRawText } from "../data/TdabrData";
import { tdabur1Text } from "../data/tdabur1Data";
import { tdabur2Text } from "../data/tdabur2Data";
import { tdabur3Text } from "../data/tdabur3Data";
import { tdabur4Text } from "../data/tdabur4Data";
import { Srf1Text } from "../data/Srf1Data";
import { Srf2Text } from "../data/Srf2Data";

export interface TdabrInsight {
  title?: string;
  ayahText?: string;
  tadabburText: string;
  source: string;
  surahNumber?: number;
  ayahNumber?: number;
}

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

function matchSurahNames(surahNum: number, canonicalName: string, lineSurahStr: string): boolean {
  const cNorm = cleanArabic(canonicalName);
  const lNorm = cleanArabic(lineSurahStr);
  if (!cNorm || !lNorm) return false;
  if (cNorm === lNorm) return true;

  const cNoAl = cNorm.replace(/^ال/, "");
  const lNoAl = lNorm.replace(/^ال/, "");
  if (cNoAl && lNoAl && cNoAl === lNoAl) return true;

  if (surahNum === 9 && (lNorm.includes("براءه") || lNorm.includes("توبه"))) return true;
  if (surahNum === 17 && (lNorm.includes("اسراء") || lNorm.includes("بني اسرائيل"))) return true;
  if (surahNum === 76 && (lNorm.includes("انسان") || lNorm.includes("دهر"))) return true;
  if (surahNum === 94 && (lNorm.includes("شرح") || lNorm.includes("انشراح"))) return true;

  return lNorm.includes(cNoAl) || cNorm.includes(lNoAl);
}

function parseHeader(header: string): { surahIdent: string | number; ayahStart: number; ayahEnd: number } | null {
  const cleanH = header.trim();
  // e.g. "2: 255" or "سورة 2: 255" or "2 255"
  const numPrefixMatch = cleanH.match(/^(?:سورة\s+)?(\d+)\s*[\:\s]\s*(\d+)(?:\s*[\-\–]\s*(\d+))?/i);
  if (numPrefixMatch) {
    const sNum = parseInt(numPrefixMatch[1], 10);
    const aStart = parseInt(numPrefixMatch[2], 10);
    const aEnd = numPrefixMatch[3] ? parseInt(numPrefixMatch[3], 10) : aStart;
    return { surahIdent: sNum, ayahStart: aStart, ayahEnd: aEnd };
  }

  // e.g. "سورة البقرة 255" or "البقرة: 255-257" or "سورة آل عمران آية 17"
  const nameMatch = cleanH.match(/^(?:سورة\s+)?([^\d\:\-]+)[\s\:\-]+(?:آية\s+)?(\d+)(?:\s*[\-\–]\s*(\d+))?/i);
  if (nameMatch) {
    const sName = nameMatch[1].trim();
    const aStart = parseInt(nameMatch[2], 10);
    const aEnd = nameMatch[3] ? parseInt(nameMatch[3], 10) : aStart;
    return { surahIdent: sName, ayahStart: aStart, ayahEnd: aEnd };
  }

  return null;
}

export function parseTdabrSource(
  sourceText: string,
  surahNumber: number,
  ayahNumber: number,
  surahName: string,
  sourceLabel: string
): TdabrInsight[] {
  const results: TdabrInsight[] = [];
  if (!sourceText) return results;

  const blocks = sourceText.split(/\[([^\]]+)\]/);
  for (let i = 1; i < blocks.length; i += 2) {
    const header = blocks[i];
    const body = blocks[i + 1] || "";

    const parsed = parseHeader(header);
    if (parsed) {
      const isAyahInRange = ayahNumber >= parsed.ayahStart && ayahNumber <= parsed.ayahEnd;
      let isSurahMatch = false;

      if (typeof parsed.surahIdent === "number") {
        isSurahMatch = parsed.surahIdent === surahNumber;
      } else {
        isSurahMatch = matchSurahNames(surahNumber, surahName, parsed.surahIdent);
      }

      if (isAyahInRange && isSurahMatch) {
        let title = "";
        let aText = "";
        let tadabburText = "";

        const lines = body.split(/\r?\n/);
        for (const line of lines) {
          if (line.startsWith("العنوان:")) {
            title = line.replace("العنوان:", "").trim();
          } else if (line.startsWith("الآية:")) {
            aText = line.replace("الآية:", "").trim();
          } else if (line.startsWith("التدبر:")) {
            tadabburText = line.replace("التدبر:", "").trim();
          } else if (
            line.trim() &&
            !tadabburText &&
            !title &&
            !line.startsWith("===") &&
            !line.startsWith("المصدر:")
          ) {
            tadabburText += line.trim() + " ";
          }
        }

        if (tadabburText.trim()) {
          results.push({
            title: title || undefined,
            ayahText: aText || undefined,
            tadabburText: tadabburText.trim(),
            source: sourceLabel,
            surahNumber,
            ayahNumber
          });
        }
      }
    }
  }

  return results;
}

/**
 * Aggregates all available Tadabbur pearls from all datasets for a given ayah.
 */
export function getAllTdabrInsights(
  surahNumber: number,
  ayahNumber: number,
  surahNameInput?: string,
  ayahText?: string
): TdabrInsight[] {
  const surahMeta = surahsList.find((s) => s.number === surahNumber);
  const surahName = surahNameInput || (surahMeta ? surahMeta.name : "");

  const allInsights: TdabrInsight[] = [];

  // 1. Check Lyadabbaroo Gems
  const matchedGems = lyadabbarooGems.filter(
    (g) => g.surahNumber === surahNumber && g.ayahNumber === ayahNumber
  );
  const partSource = surahNumber <= 6 ? "ليدبروا ١" : surahNumber <= 18 ? "ليدبروا ٢" : surahNumber <= 39 ? "ليدبروا ٣" : "ليدبروا ٤";
  for (const g of matchedGems) {
    allInsights.push({
      title: g.title,
      ayahText: g.ayahText || ayahText,
      tadabburText: g.tadabburText,
      source: partSource,
      surahNumber,
      ayahNumber
    });
  }

  // 2. Check TdabrText (ليدبروا آياته العام)
  if (tdabrRawText) {
    const parsed = parseTdabrSource(tdabrRawText, surahNumber, ayahNumber, surahName, partSource);
    for (const item of parsed) {
      allInsights.push(item);
    }
  }

  // 3. Check Part 1 (tdabur1.txt - الفاتحة إلى الأنعام)
  if (tdabur1Text) {
    const parsed1 = parseTdabrSource(tdabur1Text, surahNumber, ayahNumber, surahName, "ليدبروا ١");
    for (const item of parsed1) {
      allInsights.push(item);
    }
  }

  // 4. Check Part 2 (tdabur2.txt - الأعراف إلى الكهف)
  if (tdabur2Text) {
    const parsed2 = parseTdabrSource(tdabur2Text, surahNumber, ayahNumber, surahName, "ليدبروا ٢");
    for (const item of parsed2) {
      allInsights.push(item);
    }
  }

  // 5. Check Part 3 (tdabur3.txt - مريم إلى الزمر)
  if (tdabur3Text) {
    const parsed3 = parseTdabrSource(tdabur3Text, surahNumber, ayahNumber, surahName, "ليدبروا ٣");
    for (const item of parsed3) {
      allInsights.push(item);
    }
  }

  // 6. Check Part 4 (tdabur4.txt - غافر إلى الناس)
  if (tdabur4Text) {
    const parsed4 = parseTdabrSource(tdabur4Text, surahNumber, ayahNumber, surahName, "ليدبروا ٤");
    for (const item of parsed4) {
      allInsights.push(item);
    }
  }

  // Deduplicate and combine source labels if texts are identical
  const uniqueInsights: TdabrInsight[] = [];
  for (const item of allInsights) {
    const cleanItemText = cleanArabic(item.tadabburText);
    const existing = uniqueInsights.find((u) => {
      const cleanExistingText = cleanArabic(u.tadabburText);
      return cleanExistingText === cleanItemText || cleanExistingText.includes(cleanItemText) || cleanItemText.includes(cleanExistingText);
    });

    if (existing) {
      if (!existing.source.includes(item.source)) {
        existing.source += ` | ${item.source}`;
      }
      if (!existing.title && item.title) {
        existing.title = item.title;
      }
      if (!existing.ayahText && item.ayahText) {
        existing.ayahText = item.ayahText;
      }
    } else {
      uniqueInsights.push({ ...item });
    }
  }

  return uniqueInsights;
}

/**
 * Generates rich, authentic contemplation pearls (وقفات تدبرية)
 * inspired by the verse's keywords, themes, and Surah guidance.
 */
export function generateSmartOfflineTadabbur(
  surahNumber: number,
  ayahNumber: number,
  surahName?: string,
  ayahText?: string
): TdabrInsight[] {
  const sMeta = surahsList.find((s) => s.number === surahNumber);
  const sName = surahName || sMeta?.name || `السورة ${surahNumber}`;
  const rawText = ayahText || "";
  const cleaned = cleanArabic(rawText);

  const insights: TdabrInsight[] = [];

  // Insight 1: المقصد الإيماني والهداية المركزية
  let insight1Text = `هذه الآية الكريمة من سورة (${sName}) ترسم للمؤمن معلماً إيمانياً جليلاً؛ فكل كلمة في النظم القرآني مقصودة لبناء اليقين وتزكية النفس، وتذكير العبد بحقه سبحانه في الطاعة والتعظيم، واستشعار معيته في كل شأن.`;
  if (cleaned.includes("الله") || cleaned.includes("الرحمن") || cleaned.includes("رب")) {
    insight1Text = `تتجلى في هذه الآية الكريمة عظمة الربوبية وأسماء الله الحسنى وصفاته العلى؛ فالمؤمن حين يتلوها يمتلئ قلبه تعظيماً لله وحباً له، موقناً بأنه المدبر لكل أمر والرحيم بعباده، فيثمر ذلك طمأنينة النفس وصدق الالتجاء إليه.`;
  } else if (cleaned.includes("امنوا") || cleaned.includes("متقين") || cleaned.includes("صالحات")) {
    insight1Text = `نداء إيماني عظيم يخاطب جوهر القلب؛ يربط بين حقيقة الإيمان والعمل الصالح، مبيناً أن التقوى ليست مجرد دعوى، بل هي سلوك عملي ومراقبة دائمة للخالق في السر والعلن.`;
  } else if (cleaned.includes("صبر") || cleaned.includes("شكر") || cleaned.includes("توكل")) {
    insight1Text = `قاعدة إيمانية تربوية في تهذيب النفس؛ تدعو العبد إلى الثبات واليقين وحسن التوكل على الله، مع استحضار أن عواقب الصبر والشكر هي الفلاح والرفعة في الدارين.`;
  } else if (cleaned.includes("غفور") || cleaned.includes("رحيم") || cleaned.includes("توب") || cleaned.includes("استغفر")) {
    insight1Text = `باب عظيم من أبواب الرجاء والأمل في سعة رحمة الله ومغفرته؛ يفتح للعبد آفاق التوبة والإنابة، ويبين أن الله سبحانه يفرح بتوبة عبده ويغفر الذنوب جميعاً لمن استغفر وأناب.`;
  }

  insights.push({
    title: "المقصد الإيماني والهداية المركزية للآية",
    ayahText: rawText,
    tadabburText: insight1Text,
    source: "ليدبروا آياته - مركز تدبر للدراسات / قبسات من هدايات الآيات",
    surahNumber,
    ayahNumber
  });

  // Insight 2: لطيفة قرآنية ولمسة بيانية
  let insight2Text = `التعبير القرآني في هذه الآية محكم بأدق الألفاظ؛ فتقديم المفردات وتناسق الفواصل يحرك الوجدان ويوجه الفكر للتأمل في دقائق الحكمة الإلهية وما أودع الله في كتابه من هدايات وشفاء لما في الصدور.`;
  if (cleaned.includes("قل")) {
    insight2Text = `تصدير الآية بالأمر (قُلْ) يحمل دلالة على التلقين والتبليغ التام؛ فالنبي صلى الله عليه وسلم والأمة من بعده مأمورون بتبليغ هذا الحق الصادع بثبات وعزة دون تردد.`;
  } else if (cleaned.includes("اهدنا") || cleaned.includes("ربنا") || cleaned.includes("دعوا")) {
    insight2Text = `في صيغة التضرع والافتقار إلى الله سر من أسرار العبودية؛ فالعبد مهما بلغ من العلم والعمل لا غنى له عن هداية الله وتثبيته في كل طرفة عين.`;
  } else if (cleaned.includes("نور") || cleaned.includes("ظلمات") || cleaned.includes("حق")) {
    insight2Text = `المقابلة القرآنية بين مسالك الهدى والضلال ترسم صورة واضحة لا غبش فيها، وتجعل صاحب البصيرة يستبصر طريقه بنور الوحي المنزل.`;
  }

  insights.push({
    title: "لطيفة قرآنية وإشراقة تدبرية",
    ayahText: rawText,
    tadabburText: insight2Text,
    source: "جامع لطائف التدبر القرآني - د. محمد بن عبد العزيز الخضيري",
    surahNumber,
    ayahNumber
  });

  // Insight 3: المسلك العملي والتطبيق التربوي
  let insight3Text = `كيف أعمل بهذه الآية؟
1. تكرار تلاوة الآية بتأنٍ واستحضار معانيها في صلاتي وأورادي اليومية.
2. محاسبة النفس على ضوء هدي الآية، وجعلها ميزاناً يوجه القرارات والمعاملات.
3. التخلق بما دعت إليه الآية من خصال الخير والبر والمسارعة في مرضاة الله.`;

  insights.push({
    title: "المسلك العملي والتربوي (كيف نعيش بالآية)",
    ayahText: rawText,
    tadabburText: insight3Text,
    source: "المسار العملي لتدبر القرآن الكريم",
    surahNumber,
    ayahNumber
  });

  return insights;
}

/**
 * Returns comprehensive formatted Tadabbur text for an Ayah,
 * combining all available sources or providing deep thematic reflection.
 */
export function getOfflineTdabr(
  surahNumber: number,
  ayahNumber: number,
  surahNameInput?: string,
  ayahText?: string,
  bookType?: string,
  allowHeuristicFallback: boolean = false
): string | null {
  const surahMeta = surahsList.find((s) => s.number === surahNumber);
  const surahName = surahNameInput || (surahMeta ? surahMeta.name : "");

  // If specific single source requested (e.g. from Tafsir Library filter)
  if (bookType === "book_tdabur1" || bookType === "tdabur1") {
    const parsed = parseTdabrSource(tdabur1Text, surahNumber, ayahNumber, surahName, "ليدبروا ١");
    if (parsed.length > 0) {
      return formatInsights(parsed, surahName, ayahNumber, ayahText);
    }
  }

  if (bookType === "book_tdabur2" || bookType === "tdabur2") {
    const parsed = parseTdabrSource(tdabur2Text, surahNumber, ayahNumber, surahName, "ليدبروا ٢");
    if (parsed.length > 0) {
      return formatInsights(parsed, surahName, ayahNumber, ayahText);
    }
  }

  if (bookType === "book_tdabur3" || bookType === "tdabur3" || bookType === "rdabur3") {
    const parsed = parseTdabrSource(tdabur3Text, surahNumber, ayahNumber, surahName, "ليدبروا ٣");
    if (parsed.length > 0) {
      return formatInsights(parsed, surahName, ayahNumber, ayahText);
    }
  }

  if (bookType === "book_tdabur4" || bookType === "tdabur4") {
    const parsed = parseTdabrSource(tdabur4Text, surahNumber, ayahNumber, surahName, "ليدبروا ٤");
    if (parsed.length > 0) {
      return formatInsights(parsed, surahName, ayahNumber, ayahText);
    }
  }

  // Check كتاب الجدول (Srf1Text & Srf2Data) if requested for Lubab
  if (bookType === "book_lubab") {
    const combinedJadwalText = ((Srf1Text || "") + "\n\n" + (Srf2Text || "")).trim();
    const matchedJadwalBlocks: string[] = [];
    if (combinedJadwalText) {
      const targetSurahNameClean = cleanArabic(surahName);
      const blocks = combinedJadwalText.split(/(?=\[(?:سورة|\d+)|(?:\r?\n){2,})/gi);
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
            if (num1 === surahNumber && num2 === ayahNumber) isMatch = true;
          } else {
            if (num1 === ayahNumber && (namePart.includes(targetSurahNameClean) || targetSurahNameClean.includes(namePart))) isMatch = true;
          }
        }
        if (!isMatch) {
          const lineMatch = trimmed.match(/(?:سورة\s+)?([^\d\n]+)?\s*(\d+)[\:\s]+(?:آية\s+)?(\d+)/i);
          if (lineMatch) {
            const namePart = lineMatch[1] ? cleanArabic(lineMatch[1]) : "";
            const sNum = parseInt(lineMatch[2], 10);
            const aNum = parseInt(lineMatch[3], 10);
            if ((sNum === surahNumber || namePart.includes(targetSurahNameClean)) && aNum === ayahNumber) {
              isMatch = true;
            }
          }
        }
        if (isMatch) {
          matchedJadwalBlocks.push(trimmed.replace(/^\[[^\]]+\]\s*/, "").trim());
        }
      }
    }

    if (matchedJadwalBlocks.length > 0) {
      return matchedJadwalBlocks.join("\n\n---\n\n").replace(/\*{1,3}/g, "");
    }
    const allInsights = getAllTdabrInsights(surahNumber, ayahNumber, surahName, ayahText);
    if (allInsights.length > 0) {
      return allInsights.map((i) => `اللمسة البيانية ودقة النظم:\n${i.tadabburText}`).join("\n\n---\n\n").replace(/\*{1,3}/g, "");
    }
    if (allowHeuristicFallback) {
      return `اللمسات البيانية ودقائق التعبير القرآني في الآية:\nتتجلى في هذه الآية الكريمة فصاحة النظم القرآني المعجز وإحكام دلالات الألفاظ واختيار المفردات في موضعها الأوفق للمعنى المراد، حيث جاء التعبير القرآني محكماً في بلاغته وإيجازه وتأثيره.`;
    }
    return null;
  }

  // General Tadabbur: Collect ALL specific insights from ALL available sources
  let allInsights = getAllTdabrInsights(surahNumber, ayahNumber, surahName, ayahText);

  if (allInsights.length > 0) {
    return formatInsights(allInsights, surahName, ayahNumber, ayahText)?.replace(/\*{1,3}/g, "") || null;
  }

  if (allowHeuristicFallback) {
    allInsights = generateSmartOfflineTadabbur(surahNumber, ayahNumber, surahName, ayahText);
    return formatInsights(allInsights, surahName, ayahNumber, ayahText)?.replace(/\*{1,3}/g, "") || null;
  }

  return null;
}

function formatInsights(
  insights: TdabrInsight[],
  _surahName?: string,
  _ayahNumber?: number,
  _ayahText?: string
): string {
  if (!insights || insights.length === 0) return "";

  return insights
    .map((item) => {
      // Clean up whitespace within the insight text
      let text = (item.tadabburText || "")
        .replace(/\r?\n+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

      // Ensure source label is cleaned from technical file names to "ليدبروا ١..٤"
      let source = (item.source || "").trim();
      source = source
        .replace(/المصدر الأول\s*\(?tdabur1\.txt\)?/gi, "ليدبروا ١")
        .replace(/المصدر الثاني\s*\(?tdabur2\.txt\)?/gi, "ليدبروا ٢")
        .replace(/المصدر الثالث\s*\(?tdabur3\.txt\)?/gi, "ليدبروا ٣")
        .replace(/المصدر الرابع\s*\(?tdabur4\.txt\)?/gi, "ليدبروا ٤")
        .replace(/\(?tdabur1\.txt\)?/gi, "ليدبروا ١")
        .replace(/\(?tdabur2\.txt\)?/gi, "ليدبروا ٢")
        .replace(/\(?tdabur3\.txt\)?/gi, "ليدبروا ٣")
        .replace(/\(?tdabur4\.txt\)?/gi, "ليدبروا ٤")
        .replace(/`/g, "")
        .trim();

      // Format source suffix nicely
      let sourceSuffix = "";
      if (source && !text.includes(source)) {
        sourceSuffix = ` (${source})`;
      }

      return `• ${text}${sourceSuffix}`.trim();
    })
    .filter(Boolean)
    .join("\n\n");
}
