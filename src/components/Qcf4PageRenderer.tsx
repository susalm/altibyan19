import React, { useEffect, useState } from "react";
import { Qcf4PageData, Qcf4Word, fetchQcf4Page, loadQcf4Font, prefetchQcf4Pages, getBismillahGlyph } from "../utils/qcf4Utils";
import { SurahHeaderFrame } from "./SurahHeaderFrame";
import { SURAH_HEADER_POSITIONS } from "../utils/surahHeaderMap";

interface Qcf4PageRendererProps {
  pageNumber: number;
  activeAyahKey?: string;
  onAyahClick?: (ayah: { surah: number; ayah: number; text?: string }) => void;
  onAyahDoubleClick?: (ayah: { surah: number; ayah: number; text?: string }) => void;
  isDark?: boolean;
  theme?: string;
  hideFrame?: boolean;
}

export const Qcf4PageRenderer: React.FC<Qcf4PageRendererProps> = ({
  pageNumber,
  activeAyahKey,
  onAyahClick,
  onAyahDoubleClick,
  isDark = false,
  theme = "light",
  hideFrame = false,
}) => {
  const [pageData, setPageData] = useState<Qcf4PageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadPage() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchQcf4Page(pageNumber, controller.signal);
        if (!isMounted) return;

        // Collect all font names used in this page
        const fontNames = new Set<string>();
        if (data.font) fontNames.add(data.font);
        fontNames.add("QCF4_QBSML");

        data.lines.forEach((line) => {
          line.words.forEach((w) => {
            if (w.font) fontNames.add(w.font);
          });
        });

        // Load fonts dynamically
        await Promise.all(Array.from(fontNames).map((f) => loadQcf4Font(f)));

        if (isMounted) {
          setPageData(data);
          setLoading(false);
          // Prefetch nearby QCF4 pages and fonts in background
          prefetchQcf4Pages(pageNumber).catch(() => {});
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(`[QCF4] Error loading page ${pageNumber}:`, err);
        if (isMounted) {
          setError(err?.message || "فشل تحميل بيانات المصحف (QCF4)");
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pageNumber]);

  const handleWordClick = (word: Qcf4Word) => {
    if (!word.verse_key || !onAyahClick) return;
    const [s, a] = word.verse_key.split(":").map(Number);
    if (s && a) {
      onAyahClick({ surah: s, ayah: a, text: word.text });
    }
  };

  const handleWordDoubleClick = (word: Qcf4Word) => {
    if (!word.verse_key || !onAyahDoubleClick) return;
    const [s, a] = word.verse_key.split(":").map(Number);
    if (s && a) {
      onAyahDoubleClick({ surah: s, ayah: a, text: word.text });
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[450px] flex flex-col items-center justify-center p-6 space-y-3">
        <div className={`w-8 h-8 border-4 rounded-full animate-spin ${
          theme === "navy-velvet" ? "border-[#1b3168] border-t-transparent" :
          theme === "gold-velvet" ? "border-[#c5a85c] border-t-transparent" :
          isDark ? "border-emerald-400 border-t-transparent" : "border-emerald-600 border-t-transparent"
        }`} />
        <p className="text-xs font-bold opacity-80">جاري تحميل خط المصحف (QCF4)...</p>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center space-y-2 text-red-500">
        <p className="font-bold text-sm">عذراً، حدث خطأ في تحميل الصفحة {pageNumber}</p>
        <p className="text-xs opacity-80">{error}</p>
      </div>
    );
  }

  return (
    <div 
      className={`w-full h-full flex flex-col justify-between items-stretch select-none overflow-hidden px-1 sm:px-3 py-1 sm:py-2 @container ${
        hideFrame ? "" : "p-3 sm:p-5 rounded-3xl border shadow-lg bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
      }`}
      style={{ containerType: "inline-size" }}
    >
      <div 
        className="w-full h-full flex flex-col justify-between items-stretch text-center leading-none my-auto"
        dir="rtl"
        style={{ fontFamily: pageData.font || "QCF4_Hafs_01" }}
      >
        {(() => {
          let headerCount = 0;
          const isOpeningPage = pageNumber === 1 || pageNumber === 2;
          return pageData.lines.map((line, lIdx) => {
            const isSurahHeaderLine = line.words.some(w => w.type === "surah_header");
            const isBismillahLine = line.words.some(w => w.type === "bismillah");
            const isSpecialLine = isSurahHeaderLine || isBismillahLine;
            const isLongLine = !isSpecialLine && line.words.length > 2;

            return (
              <div
                key={`line-${lIdx}`}
                className={`w-full flex items-center ${
                  isLongLine ? "justify-between" : "justify-center gap-1.5 sm:gap-3"
                } ${isOpeningPage ? "py-1 sm:py-2 my-auto" : "py-0.5 my-auto"} text-slate-900 dark:text-slate-100 transition-colors flex-nowrap`}
                style={{ minHeight: isOpeningPage ? "2.3em" : "1.8em" }}
              >
                {line.words.map((word, wIdx) => {
                  const isSurahHeader = word.type === "surah_header";
                  const isBismillah = word.type === "bismillah";
                  const isWordActive = Boolean(word.verse_key && word.verse_key === activeAyahKey);
                  const wordFont = word.font || (isSurahHeader || isBismillah ? "QCF4_QBSML" : pageData.font);

                  if (isSurahHeader) {
                    const currentHdrIdx = headerCount++;
                    let sNum: number | undefined;
                    if (word.char && word.char.length === 1) {
                      const code = word.char.charCodeAt(0);
                      if (code >= 0xF100 && code <= 0xF171) {
                        sNum = code - 0xF100 + 1;
                      }
                    }

                    if (!sNum) {
                      const pageSurahs = SURAH_HEADER_POSITIONS[pageNumber] || [];
                      if (pageSurahs[currentHdrIdx]) {
                        sNum = pageSurahs[currentHdrIdx].surah;
                      }
                    }

                    if (!sNum) {
                      for (let li = lIdx; li < pageData.lines.length; li++) {
                        for (const lw of pageData.lines[li].words) {
                          if (lw.verse_key) {
                            const [vsNum] = lw.verse_key.split(":").map(Number);
                            if (vsNum) {
                              sNum = vsNum;
                              break;
                            }
                          }
                        }
                        if (sNum) break;
                      }
                    }

                    return (
                      <div
                        key={`w-${lIdx}-${wIdx}`}
                        onClick={() => onAyahClick?.({ surah: sNum || 0, ayah: 0, text: "" })}
                        className={`w-full ${isOpeningPage ? "my-1.5 sm:my-2" : "my-1"} cursor-pointer flex items-center justify-center`}
                      >
                        <SurahHeaderFrame
                          surahName={word.char || ""}
                          surahNumber={sNum}
                          theme={theme}
                          isDark={isDark}
                          className={`w-full ${isOpeningPage ? "max-h-[58px]" : "max-h-[54px]"}`}
                        />
                      </div>
                    );
                  }

                if (isBismillah) {
                  return (
                    <div
                      key={`w-${lIdx}-${wIdx}`}
                      onClick={() => onAyahClick?.({ surah: 0, ayah: 0, text: "" })}
                      className={`w-full py-0.5 my-0.5 flex items-center justify-center cursor-pointer ${
                        isDark ? "text-emerald-300" : "text-emerald-800"
                      }`}
                      style={{ 
                        fontFamily: "'UthmanicHafs', 'Amiri', serif", 
                        fontSize: isOpeningPage ? "clamp(1.35rem, 5.6cqw, 2.95rem)" : "clamp(1.15rem, 5cqw, 2.6rem)" 
                      }}
                    >
                      <span>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</span>
                    </div>
                  );
                }

                const endGlyphColor = 
                  theme === "navy-velvet" ? (isDark ? "text-blue-400" : "text-[#1b3168]") :
                  theme === "gold-velvet" ? (isDark ? "text-[#fcd34d]" : "text-[#c5a85c]") :
                  theme === "emerald-velvet" ? (isDark ? "text-[#34d399]" : "text-[#059669]") :
                  isDark ? "text-emerald-400" : "text-emerald-700";

                return (
                  <span
                    key={`w-${lIdx}-${wIdx}`}
                    onClick={() => handleWordClick(word)}
                    onDoubleClick={() => handleWordDoubleClick(word)}
                    className={`inline-block cursor-pointer px-0.2 sm:px-0.5 py-0.2 rounded transition-all duration-150 whitespace-nowrap ${
                      isWordActive
                        ? isDark
                          ? "bg-emerald-500/30 text-emerald-200 font-bold ring-2 ring-emerald-400/50 shadow-sm"
                          : "bg-amber-400/40 text-amber-950 font-bold ring-2 ring-amber-500/50 shadow-sm"
                        : word.type === "end"
                          ? `${endGlyphColor} font-semibold`
                          : "hover:bg-emerald-500/15 hover:text-emerald-800 dark:hover:text-emerald-200"
                    }`}
                    style={{ 
                      fontFamily: wordFont,
                      fontSize: isOpeningPage ? "clamp(1.25rem, 5.1cqw, 2.85rem)" : "clamp(1.15rem, 4.7cqw, 2.65rem)",
                      lineHeight: "1.3"
                    }}
                    title={word.verse_key ? `آية ${word.verse_key}` : undefined}
                  >
                    {word.char}
                  </span>
                );
              })}
            </div>
          );
        });
      })()}
      </div>
    </div>
  );
};
