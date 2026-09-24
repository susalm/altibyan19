import React, { useState, useEffect } from "react";
import { 
  X, 
  Search, 
  Globe, 
  BookOpen, 
  Check, 
  ExternalLink, 
  Download, 
  Sparkles, 
  Loader2,
  FileText
} from "lucide-react";
import { 
  fetchLanguages, 
  fetchSingleLanguage, 
  ApiLanguage, 
  ApiTranslationBook 
} from "../utils/quranContentApi";
import { LibraryBookItem } from "../data/booksData";

interface TranslationsCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: string;
  onSelectTranslation: (book: LibraryBookItem) => void;
  theme?: string;
  isDark?: boolean;
}

// Popular quick selection languages
const POPULAR_LANGUAGES = [
  { abr: "en", name: "English", arabicName: "الإنجليزية" },
  { abr: "fr", name: "Français", arabicName: "الفرنسية" },
  { abr: "es", name: "Español", arabicName: "الإسبانية" },
  { abr: "de", name: "Deutsch", arabicName: "الألمانية" },
  { abr: "ur", name: "اردو", arabicName: "الأردية" },
  { abr: "tr", name: "Türkçe", arabicName: "التركية" },
  { abr: "id", name: "Bahasa Indonesia", arabicName: "الإندونيسية" },
  { abr: "ru", name: "Русский", arabicName: "الروسية" },
  { abr: "zh", name: "中文", arabicName: "الصينية" },
  { abr: "fa", name: "فارسی", arabicName: "الفارسية" },
];

export default function TranslationsCatalogModal({
  isOpen,
  onClose,
  activeMode,
  onSelectTranslation,
  theme = "emerald-velvet",
  isDark = false
}: TranslationsCatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [books, setBooks] = useState<ApiTranslationBook[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Load available languages from API
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoadingLanguages(true);
    fetchLanguages("ar")
      .then((data) => {
        if (mounted && data && data.length > 0) {
          setLanguages(data);
        }
      })
      .catch((err) => console.warn("Failed to load languages:", err))
      .finally(() => {
        if (mounted) setLoadingLanguages(false);
      });
    return () => { mounted = false; };
  }, [isOpen]);

  // Load books for selected language
  useEffect(() => {
    if (!isOpen || !selectedLang) return;
    let mounted = true;
    setLoadingBooks(true);
    fetchSingleLanguage(selectedLang, "ar")
      .then((res) => {
        if (mounted && res && res.translation_books) {
          setBooks(res.translation_books);
        }
      })
      .catch((err) => console.warn("Failed to load language books:", err))
      .finally(() => {
        if (mounted) setLoadingBooks(false);
      });
    return () => { mounted = false; };
  }, [isOpen, selectedLang]);

  if (!isOpen) return null;

  // Filter languages by search query
  const filteredLanguages = languages.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (l.english_name && l.english_name.toLowerCase().includes(q)) ||
      (l.arabic_name && l.arabic_name.includes(q)) ||
      (l.localized_name && l.localized_name.toLowerCase().includes(q)) ||
      (l.abr && l.abr.toLowerCase().includes(q))
    );
  });

  const handleSelectBook = (book: ApiTranslationBook) => {
    const appBook: LibraryBookItem = {
      id: book.key,
      title: book.title,
      author: book.description || book.title,
      mainCategory: "translations",
      subCategory: "english_translations",
      apiType: book.key,
      isDownloaded: true
    };
    onSelectTranslation(appBook);
    onClose();
  };

  const isSelected = (key: string) => {
    return activeMode === key || activeMode === `translation_${key}` || `translation_${activeMode}` === key;
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs select-none"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border-2 shadow-2xl overflow-hidden transition-all duration-300 ${
          theme === "emerald-velvet"
            ? "bg-[#012519] border-[#c5a85c]/40 text-[#FAF8F5]"
            : theme === "gold-velvet"
              ? "bg-[#FFFDF5] border-[#c5a85c]/40 text-[#011c14]"
              : theme === "navy-velvet"
                ? "bg-white border-[#3F63C6]/30 text-slate-900"
                : isDark
                  ? "bg-slate-900 border-slate-700 text-slate-100"
                  : "bg-white border-emerald-200 text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${
          theme === "emerald-velvet"
            ? "bg-[#011a12] border-[#c5a85c]/30"
            : theme === "gold-velvet"
              ? "bg-[#FAF5E6] border-[#c5a85c]/30"
              : theme === "navy-velvet"
                ? "bg-[#EFF6FF] border-[#3F63C6]/20"
                : isDark
                  ? "bg-slate-950/80 border-slate-800"
                  : "bg-emerald-50/80 border-emerald-200"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${
              theme === "emerald-velvet" || theme === "gold-velvet"
                ? "bg-[#c5a85c]/20 border-[#c5a85c]/40 text-[#c5a85c]"
                : theme === "navy-velvet"
                  ? "bg-[#3F63C6]/20 border-[#3F63C6]/40 text-[#3F63C6]"
                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-600"
            }`}>
              <Globe size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                مكتبة ترجمات القرآن الكريم العالمية
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  API المعتمد
                </span>
              </h2>
              <p className="text-xs opacity-75 font-medium">
                تصفح واختر من بين أكثر من 90 لغة و 69 ترجمة معتمدة لآيات القرآن الكريم
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 transition-all cursor-pointer"
            aria-label="إغلاق"
            title="إغلاق"
          >
            <X size={18} className="text-red-500 dark:text-red-400 stroke-[2.5px]" />
          </button>
        </div>

        {/* Quick Popular Languages Bar */}
        <div className={`px-4 py-2.5 border-b overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0 ${
          isDark ? "bg-slate-950/40 border-slate-800" : "bg-black/5 border-black/5"
        }`}>
          <span className="text-xs font-bold shrink-0 opacity-70 flex items-center gap-1">
            <Sparkles size={13} />
            أبرز اللغات:
          </span>
          {POPULAR_LANGUAGES.map((pl) => {
            const isCurrent = selectedLang === pl.abr;
            return (
              <button
                key={pl.abr}
                type="button"
                onClick={() => setSelectedLang(pl.abr)}
                className={`py-1 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                  isCurrent
                    ? theme === "emerald-velvet" || theme === "gold-velvet"
                      ? "bg-[#c5a85c] text-[#011c14] border-[#c5a85c] font-black scale-105"
                      : theme === "navy-velvet"
                        ? "bg-[#3F63C6] text-white border-[#3F63C6] font-black scale-105"
                        : "bg-emerald-600 text-white border-emerald-600 font-black scale-105"
                    : isDark
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {pl.arabicName} ({pl.name})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="p-3 sm:p-4 border-b flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن لغة (مثال: English, الفرنسية, Español, اردو)..."
              className={`w-full pr-10 pl-4 py-2 rounded-2xl text-xs sm:text-sm border transition-all focus:outline-none focus:ring-2 ${
                theme === "emerald-velvet"
                  ? "bg-[#011a12] border-[#c5a85c]/30 text-white placeholder-slate-400 focus:ring-[#c5a85c]/50"
                  : theme === "gold-velvet"
                    ? "bg-[#FAF5E6] border-[#c5a85c]/30 text-amber-950 placeholder-amber-900/50 focus:ring-[#c5a85c]/50"
                    : theme === "navy-velvet"
                      ? "bg-[#F8FAFC] border-[#3F63C6]/30 text-slate-900 placeholder-slate-400 focus:ring-[#3F63C6]/50"
                      : isDark
                        ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:ring-emerald-500/50"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-emerald-500/50"
              }`}
            />
          </div>
        </div>

        {/* Modal Main Content (Split view: Languages on right, Translation Books on left) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 sm:grid-cols-12 min-h-[350px]">
          {/* Languages Sidebar (4 cols) */}
          <div className={`sm:col-span-4 border-b sm:border-b-0 sm:border-l overflow-y-auto max-h-[220px] sm:max-h-full ${
            isDark ? "bg-slate-950/40 border-slate-800" : "bg-black/5 border-black/10"
          }`}>
            <div className="p-2 space-y-1">
              <div className="px-2 py-1 text-[11px] font-black uppercase opacity-60">
                قائمة اللغات المتاحة ({filteredLanguages.length})
              </div>
              {loadingLanguages && languages.length === 0 ? (
                <div className="p-4 flex items-center justify-center gap-2 text-xs opacity-60">
                  <Loader2 size={16} className="animate-spin" />
                  جاري تحميل اللغات...
                </div>
              ) : (
                filteredLanguages.map((lang) => {
                  const isLangActive = selectedLang === lang.abr;
                  return (
                    <button
                      key={lang.id || lang.abr}
                      type="button"
                      onClick={() => setSelectedLang(lang.abr)}
                      className={`w-full text-right p-2 sm:p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        isLangActive
                          ? theme === "emerald-velvet" || theme === "gold-velvet"
                            ? "bg-[#c5a85c] text-[#011c14] font-black shadow-xs"
                            : theme === "navy-velvet"
                              ? "bg-[#3F63C6] text-white font-black shadow-xs"
                              : "bg-emerald-600 text-white font-black shadow-xs"
                          : isDark
                            ? "text-slate-300 hover:bg-slate-800"
                            : "text-slate-700 hover:bg-black/5"
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-bold truncate">{lang.arabic_name || lang.english_name}</div>
                        <div className="text-[10px] opacity-75 truncate">{lang.english_name} - {lang.localized_name}</div>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-black/10 shrink-0 mr-1.5">
                        {lang.abr}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Translation Books Section (8 cols) */}
          <div className="sm:col-span-8 overflow-y-auto p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-current/10">
              <h3 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                <BookOpen size={16} />
                الترجمات المعتمدة للغة المختارة ({books.length})
              </h3>
              <span className="text-[11px] opacity-70">انقر لاختيار الترجمة وتفعيلها فوراً</span>
            </div>

            {loadingBooks ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2 opacity-60">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-xs">جاري تحميل تراجم هذه اللغة...</span>
              </div>
            ) : books.length === 0 ? (
              <div className="p-8 text-center opacity-60 text-xs sm:text-sm">
                لم يتم العثور على ترجمات مسجلة لهذه اللغة حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {books.map((book) => {
                  const active = isSelected(book.key);
                  return (
                    <div
                      key={book.id || book.key}
                      onClick={() => handleSelectBook(book)}
                      className={`p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col gap-2 relative group hover:scale-[1.01] ${
                        active
                          ? theme === "emerald-velvet" || theme === "gold-velvet"
                            ? "bg-[#c5a85c]/20 border-[#c5a85c] text-current shadow-md ring-2 ring-[#c5a85c]/40"
                            : theme === "navy-velvet"
                              ? "bg-[#3F63C6]/15 border-[#3F63C6] text-current shadow-md ring-2 ring-[#3F63C6]/40"
                              : "bg-emerald-500/15 border-emerald-500 text-current shadow-md ring-2 ring-emerald-500/40"
                          : isDark
                            ? "bg-slate-800/80 border-slate-700/80 hover:bg-slate-750"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            active
                              ? "bg-emerald-500 text-white font-bold"
                              : isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"
                          }`}>
                            {active ? <Check size={16} /> : <FileText size={16} />}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm leading-snug">
                              {book.title}
                            </h4>
                            <div className="text-[11px] font-mono opacity-60">{book.key}</div>
                          </div>
                        </div>

                        {active && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                            مُفعلة حالياً
                          </span>
                        )}
                      </div>

                      {book.description && (
                        <p className="text-xs opacity-80 leading-relaxed pr-10">
                          {book.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-current/10 flex items-center justify-between text-[11px] opacity-75">
                        <span className="flex items-center gap-1 font-medium">
                          <Check size={13} className="text-emerald-500" />
                          نص وترجمة رقمية معتمدة
                        </span>
                        {book.pdf_size && (
                          <span className="text-[10px] font-mono opacity-60">
                            PDF: {book.pdf_size}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-3 sm:p-4 border-t flex items-center justify-between text-xs ${
          isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="flex items-center gap-1.5 opacity-70">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>مدعوم بمحتوى القرآن الكريم (Quran Content API)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl font-bold cursor-pointer transition-all ${
              isDark ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-800"
            }`}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
