import React, { useEffect, useState } from "react";
import { Qcf4Word, fetchQcf4VerseWords, loadQcf4Font } from "../utils/qcf4Utils";

interface Qcf4VerseTextProps {
  surah: number;
  ayah: number;
  page?: number;
  fallbackText?: string;
  className?: string;
  fontSize?: string;
  textColor?: string;
  highlight?: boolean;
  maxWords?: number;
  theme?: string;
  isDark?: boolean;
}

export const Qcf4VerseText: React.FC<Qcf4VerseTextProps> = ({
  surah,
  ayah,
  page,
  fallbackText,
  className = "",
  fontSize,
  textColor,
  highlight = false,
  maxWords,
  theme,
  isDark = false,
}) => {
  const [words, setWords] = useState<Qcf4Word[]>([]);
  const [font, setFont] = useState<string>("QCF4_Hafs_01");
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadVerse() {
      try {
        const res = await fetchQcf4VerseWords(surah, ayah, page, controller.signal);
        if (!isMounted) return;
        if (res.words && res.words.length > 0) {
          // Load fonts
          const fontNames = new Set<string>();
          if (res.font) fontNames.add(res.font);
          res.words.forEach((w) => {
            if (w.font) fontNames.add(w.font);
          });
          await Promise.all(Array.from(fontNames).map((f) => loadQcf4Font(f)));
          if (!isMounted) return;
          setWords(res.words);
          setFont(res.font || "QCF4_Hafs_01");
          setLoaded(true);
        } else {
          setLoaded(false);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        if (isMounted) setLoaded(false);
      }
    }

    loadVerse();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [surah, ayah, page]);

  if (!loaded || words.length === 0) {
    return (
      <span 
        className={className} 
        style={{ 
          fontSize, 
          color: textColor || (theme === "emerald-velvet" ? "#FAF8F5" : isDark ? "#f1f5f9" : "#0f172a"), 
          fontFamily: "'Amiri', 'UthmanicHafs', serif" 
        }}
      >
        {fallbackText || `آية ${ayah}`}
      </span>
    );
  }

  let displayedWords = words;
  let isTruncated = false;

  if (maxWords && maxWords > 0) {
    const wordList: Qcf4Word[] = [];
    let count = 0;
    const hasSymbol = words[0] && words[0].char === "۞";
    const effectiveLimit = hasSymbol ? maxWords + 1 : maxWords;

    for (const w of words) {
      if (w.type === "end") continue;
      wordList.push(w);
      count++;
      if (count >= effectiveLimit) break;
    }

    const actualWordCount = words.filter((w) => w.type !== "end").length;
    if (actualWordCount > effectiveLimit) {
      isTruncated = true;
    }
    displayedWords = wordList;
  }

  const endColorClass = 
    theme === "navy-velvet" ? (isDark ? "text-blue-400" : "text-[#3F63C6]") :
    theme === "gold-velvet" ? (isDark ? "text-[#fcd34d]" : "text-[#c5a85c]") :
    theme === "emerald-velvet" ? (isDark ? "text-[#34d399]" : "text-[#059669]") :
    isDark ? "text-emerald-400" : "text-emerald-700";

  return (
    <span
      className={`inline-flex flex-wrap items-center justify-center gap-1 dir-rtl select-none ${className} ${
        highlight ? (isDark ? "bg-emerald-500/30 text-emerald-200 rounded px-1" : "bg-amber-400/30 rounded px-1") : ""
      }`}
      dir="rtl"
      style={{ fontSize }}
    >
      {displayedWords.map((w, idx) => (
        <span
          key={`vw-${surah}-${ayah}-${idx}`}
          style={{
            fontFamily: `${w.font || font}, 'Amiri', serif`,
            lineHeight: 1.5,
            color: w.type !== "end" && textColor ? textColor : undefined,
          }}
          className={w.type === "end" ? `${endColorClass} font-semibold` : (textColor ? "" : (theme === "emerald-velvet" ? "text-[#FAF8F5]" : isDark ? "text-slate-100" : "text-slate-900"))}
        >
          {w.char}
        </span>
      ))}
      {isTruncated && <span className="text-slate-400 dark:text-slate-500 font-sans px-0.5 font-bold">...</span>}
    </span>
  );
};
