import React, { useState, useEffect, useRef, useMemo } from "react";
import { surahsList } from "../data/surahList";
import { quranThematicIndex, ThematicVerse } from "../data/quranThematicIndex";
import { getSurahStartPage, quranSvgPageMetadata } from "../data/quranSvgPageMetadata";

interface QuranWordSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVerse: (
    surahNum: number,
    surahName: string,
    ayahNum: number,
    pageNum: number,
    ayahText: string
  ) => void;
  isDark?: boolean;
  theme?: string;
  inDrawer?: boolean;
}

export interface SearchResultItem {
  id: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
  pageNumber: number;
  matchedPart?: string;
}

// Normalize Arabic text for search (remove diacritics, normalize alef/yaa/taa marbuta)
function normalizeArabicText(text: string): string {
  if (!text) return "";
  return text
    // Remove tashkeel / harakat
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, "")
    // Normalize alef
    .replace(/[إأآٱ]/g, "ا")
    // Normalize yaa
    .replace(/ى/g, "ي")
    // Normalize taa marbuta
    .replace(/ة/g, "ه")
    // Remove tatweel
    .replace(/ـ/g, "")
    .trim()
    .toLowerCase();
}

// Estimate page number for surah + ayah
function resolvePageNumber(surahNumber: number, ayahNumber: number): number {
  const meta = quranSvgPageMetadata.find((p) => p.surahNumber === surahNumber);
  if (meta) {
    const startPage = getSurahStartPage(surahNumber);
    // Find next surah page or 604
    const nextStartPage = surahNumber < 114 ? getSurahStartPage(surahNumber + 1) : 604;
    const totalPages = Math.max(1, nextStartPage - startPage);
    const surahInfo = surahsList.find((s) => s.number === surahNumber);
    const totalAyahs = surahInfo ? surahInfo.numberOfAyahs : 1;
    const estimatedOffset = Math.floor(((ayahNumber - 1) / totalAyahs) * totalPages);
    return Math.min(604, Math.max(1, startPage + estimatedOffset));
  }
  return getSurahStartPage(surahNumber);
}

export const QuranWordSearchModal: React.FC<QuranWordSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectVerse,
  isDark = false,
  theme = "emerald",
  inDrawer = false,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchScope, setSearchScope] = useState<"all" | "quran">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Pre-index thematic verses for lightning-fast offline search
  const indexedVerses = useMemo(() => {
    const map = new Map<string, SearchResultItem>();
    quranThematicIndex.forEach((topic) => {
      topic.verses.forEach((v) => {
        const key = `${v.surahNumber}:${v.ayahNumber}`;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            surahNumber: v.surahNumber,
            surahName: v.surahName,
            ayahNumber: v.ayahNumber,
            text: v.text,
            pageNumber: resolvePageNumber(v.surahNumber, v.ayahNumber),
          });
        }
      });
    });
    return Array.from(map.values());
  }, []);

  // Handle Search Execution
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const normalizedQuery = normalizeArabicText(trimmed);

      // 1. Check if user typed Surah:Ayah (e.g. 2:255 or "البقرة 255")
      const surahAyahMatch = trimmed.match(/^(\d{1,3})[:\s]+(\d{1,3})$/);
      if (surahAyahMatch) {
        const sNum = parseInt(surahAyahMatch[1], 10);
        const aNum = parseInt(surahAyahMatch[2], 10);
        if (sNum >= 1 && sNum <= 114) {
          const surahObj = surahsList.find((s) => s.number === sNum);
          if (surahObj && aNum <= surahObj.numberOfAyahs) {
            const pageNum = resolvePageNumber(sNum, aNum);
            setResults([
              {
                id: `${sNum}:${aNum}`,
                surahNumber: sNum,
                surahName: surahObj.name,
                ayahNumber: aNum,
                text: `سورة ${surahObj.name} - الآية ${aNum}`,
                pageNumber: pageNum,
              },
            ]);
            setIsSearching(false);
            return;
          }
        }
      }

      // Check surah name + ayah (e.g. "البقرة 255")
      for (const s of surahsList) {
        const normName = normalizeArabicText(s.name);
        if (normalizedQuery.startsWith(normName)) {
          const rest = normalizedQuery.replace(normName, "").trim();
          const ayahNum = parseInt(rest, 10);
          if (ayahNum && ayahNum >= 1 && ayahNum <= s.numberOfAyahs) {
            setResults([
              {
                id: `${s.number}:${ayahNum}`,
                surahNumber: s.number,
                surahName: s.name,
                ayahNumber: ayahNum,
                text: `سورة ${s.name} - الآية ${ayahNum}`,
                pageNumber: resolvePageNumber(s.number, ayahNum),
              },
            ]);
            setIsSearching(false);
            return;
          }
        }
      }

      // 2. Search local indexed verses
      const localMatches: SearchResultItem[] = [];
      for (const item of indexedVerses) {
        const normText = normalizeArabicText(item.text);
        if (normText.includes(normalizedQuery)) {
          localMatches.push(item);
          if (localMatches.length >= 30) break;
        }
      }

      // 3. Online search fallback via AlQuran.cloud API if local results are few
      if (localMatches.length < 5 && trimmed.length >= 2) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(
            `https://api.alquran.cloud/v1/search/${encodeURIComponent(trimmed)}/all/ar`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data?.data?.matches && Array.isArray(data.data.matches)) {
              const apiMatches: SearchResultItem[] = data.data.matches.slice(0, 35).map((m: any) => {
                const sNumber = m.surah.number;
                const aNumber = m.numberInSurah;
                const sName = m.surah.name.replace(/^سُورَةُ\s*/, "");
                return {
                  id: `${sNumber}:${aNumber}`,
                  surahNumber: sNumber,
                  surahName: sName,
                  ayahNumber: aNumber,
                  text: m.text,
                  pageNumber: resolvePageNumber(sNumber, aNumber),
                };
              });

              // Merge unique matches
              const seen = new Set(localMatches.map((m) => m.id));
              const combined = [...localMatches];
              for (const am of apiMatches) {
                if (!seen.has(am.id)) {
                  seen.add(am.id);
                  combined.push(am);
                }
              }
              setResults(combined);
              setIsSearching(false);
              return;
            }
          }
        } catch {
          // Network error or timeout, rely on local matches
        }
      }

      setResults(localMatches);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, indexedVerses]);

  if (!isOpen) return null;

  // Theming
  const primaryBg =
    theme === "navy-velvet"
      ? "bg-[#3F63C6] hover:bg-[#3452a8]"
      : theme === "gold-velvet" || theme === "emerald-velvet"
      ? "bg-[#c5a85c] hover:bg-[#b3954a]"
      : "bg-emerald-600 hover:bg-emerald-700";

  const primaryText =
    theme === "navy-velvet"
      ? "text-[#3F63C6]"
      : theme === "gold-velvet" || theme === "emerald-velvet"
      ? "text-[#c5a85c]"
      : "text-emerald-600 dark:text-emerald-400";

  const content = (
    <div
      dir="rtl"
      className={`flex flex-col h-full w-full select-none ${
        inDrawer ? "" : "max-w-2xl mx-auto rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${primaryBg}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">البحث القرآني السريع</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">ابحث بالكلمة أو الآية أو اسم السورة ورقم الآية</p>
          </div>
        </div>
        {!inDrawer && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتب كلمة، جزءاً من آية، أو (البقرة 255)..."
            className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
          />
          <div className="absolute right-3 text-slate-400 pointer-events-none">
            {isSearching ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                inputRef.current?.focus();
              }}
              className="absolute left-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Results Counter / Quick Tips */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span>
            {query.trim().length >= 2
              ? `النتائج (${results.length})`
              : "اكتب حرفين على الأقل للبدء"}
          </span>
          <span className="text-[10px] opacity-75">
            بحث دقيق مع تجاهل التشكيل والهمزات
          </span>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {results.length > 0 ? (
          results.map((res) => (
            <button
              key={res.id}
              onClick={() => {
                onSelectVerse(
                  res.surahNumber,
                  res.surahName,
                  res.ayahNumber,
                  res.pageNumber,
                  res.text
                );
              }}
              className="w-full text-right p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 transition-all cursor-pointer group flex flex-col gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={`px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 shadow-xs border border-slate-200/60 dark:border-slate-700/60 ${primaryText}`}>
                  سورة {res.surahName} : {res.ayahNumber}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  صفحة {res.pageNumber}
                </span>
              </div>
              <p className="text-sm font-amiri leading-relaxed text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                {res.text}
              </p>
            </button>
          ))
        ) : query.trim().length >= 2 && !isSearching ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-center">
            <svg className="w-12 h-12 mb-2 stroke-current opacity-40" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">لم يتم العثور على نتائج تطابق &quot;{query}&quot;</p>
            <p className="text-xs mt-1 text-slate-400">جرب البحث بكلمة أخرى أو بجذر الكلمة دون زوائد</p>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto text-right mt-2">
              <button
                type="button"
                onClick={() => setQuery("الله نور السماوات")}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors"
              >
                ✨ آية النور
              </button>
              <button
                type="button"
                onClick={() => setQuery("الله لا إله إلا هو الحي القيوم")}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors"
              >
                🛡️ آية الكرسي
              </button>
              <button
                type="button"
                onClick={() => setQuery("فإن مع العسر يسرا")}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors"
              >
                🌿 اليسر بعد العسر
              </button>
              <button
                type="button"
                onClick={() => setQuery("ألا بذكر الله تطمئن القلوب")}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors"
              >
                🤍 طمأنينة القلب
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (inDrawer) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[85vh] h-[600px] flex flex-col">
        {content}
      </div>
    </div>
  );
};

export default QuranWordSearchModal;
