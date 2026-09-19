import React, { useState } from "react";
import { Bookmark } from "../types";
import { surahsList } from "../data/surahList";
import { motion, AnimatePresence } from "motion/react";
import { Bookmark as BookmarkIcon, Trash2, BookOpen, Clock, Sparkles } from "lucide-react";

interface FavoritesScreenProps {
  bookmarks: Bookmark[];
  onSelectSurah: (surahNumber: number, startAyah?: number) => void;
  onClearAll?: () => void;
  onRemoveBookmark?: (surahNumber: number, ayahNumber?: number) => void;
  isDark: boolean;
  theme?: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet";
}

export default function FavoritesScreen({
  bookmarks,
  onSelectSurah,
  onClearAll,
  onRemoveBookmark,
  isDark,
  theme = "light"
}: FavoritesScreenProps) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  return (
    <div id="favorites-screen-root" className="w-full max-w-full px-3 sm:px-6 py-4 space-y-6 text-right font-sans">
      {/* Title Header */}
      <div id="favorites-header" className={`flex items-center justify-between border-b pb-4 ${
        theme === "emerald-velvet"
          ? "border-[#c5a85c]/30"
          : isDark ? "border-slate-800" : "border-slate-100"
      }`}>
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            theme === "emerald-velvet"
              ? "bg-[#c5a85c]/15 text-[#c5a85c]"
              : theme === "navy-velvet"
                ? "bg-[#3F63C6]/10 text-[#3F63C6]"
                : theme === "gold-velvet"
                  ? "bg-[#c5a85c]/15 text-[#c5a85c]"
                  : "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500"
          }`}>
            <BookmarkIcon size={22} className={
              theme === "navy-velvet"
                ? "fill-[#3F63C6]/20 text-[#3F63C6]"
                : theme === "gold-velvet" || theme === "emerald-velvet"
                  ? "fill-[#c5a85c]/20 text-[#c5a85c]"
                  : "fill-emerald-500/20 text-emerald-500"
            } />
          </div>
          <div>
            <h2 className={`text-md font-bold ${
              theme === "emerald-velvet"
                ? "text-[#FAF8F5]"
                : isDark ? "text-slate-100" : "text-slate-900"
            }`}>علاماتي المرجعية</h2>
          </div>
        </div>

        {bookmarks.length > 0 && onClearAll && (
          <div className="relative">
            {!showConfirmClear ? (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                className={`p-2 rounded-xl text-xxs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  theme === "emerald-velvet"
                    ? "bg-rose-950/20 border-rose-900/30 text-rose-400 hover:bg-rose-950/40"
                    : isDark
                      ? "bg-rose-950/20 border-rose-900/30 text-rose-400 hover:bg-rose-950/40"
                      : "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100"
                }`}
              >
                <Trash2 size={13} />
                <span>حذف جميع العلامات</span>
              </button>
            ) : (
              <div className={`flex items-center gap-2 border p-1.5 rounded-xl text-xxs font-bold animate-pulse ${
                theme === "emerald-velvet"
                  ? "bg-[#011a12] border-[#c5a85c]/30 text-rose-400"
                  : isDark ? "bg-slate-900 border-slate-800 text-rose-400" : "bg-white border-slate-200"
              }`}>
                <span className="text-rose-400 px-1">حذف الكل؟</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setShowConfirmClear(false);
                  }}
                  className="px-2 py-1 bg-rose-600 text-white rounded-lg cursor-pointer"
                >
                  نعم
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className={`px-2 py-1 rounded-lg cursor-pointer ${
                    theme === "emerald-velvet" ? "bg-[#012519] text-[#FAF8F5]/80" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  لا
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bookmarks List Container */}
      <div id="favorites-list-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {bookmarks.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {bookmarks.map((b) => {
              const matchingSurah = surahsList.find(s => s.number === b.surahNumber);
              
              // Color helper for categories
              const getCategoryInfo = (cat?: string) => {
                switch (cat) {
                  case "reading":
                    return {
                      label: "تلاوة",
                      bg: "bg-red-500/10 border-red-500/25 text-red-500 dark:text-red-400",
                      iconClass: "fill-red-500 text-red-500 dark:fill-red-400 dark:text-red-400",
                      badge: "bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20"
                    };
                  case "memorization":
                    return {
                      label: "حفظ",
                      bg: "bg-sky-500/10 border-sky-400/25 text-sky-400",
                      iconClass: "fill-sky-400 text-sky-400",
                      badge: "bg-sky-400/10 text-sky-400 border border-sky-400/20"
                    };
                  case "revision":
                    return {
                      label: "مراجعة",
                      bg: "bg-emerald-500/10 border-emerald-400/25 text-emerald-400",
                      iconClass: "fill-emerald-400 text-emerald-400",
                      badge: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                    };
                  case "contemplation":
                    return {
                      label: "تدبر",
                      bg: "bg-purple-500/10 border-purple-400/25 text-purple-500 dark:text-purple-400",
                      iconClass: "fill-purple-500 text-purple-500 dark:fill-purple-400 dark:text-purple-400",
                      badge: "bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20"
                    };
                  default:
                    return {
                      label: "تلاوة",
                      bg: "bg-red-500/10 border-red-500/25 text-red-500 dark:text-red-400",
                      iconClass: "fill-red-500 text-red-500 dark:fill-red-400 dark:text-red-400",
                      badge: "bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20"
                    };
                }
              };

              const catInfo = getCategoryInfo(b.category);

              return (
                <motion.div
                  id={`bookmark-card-main-${b.id}`}
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`group relative flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                    theme === "emerald-velvet"
                      ? "bg-[#011a12] border-[#c5a85c]/25 text-[#FAF8F5] hover:bg-[#012519]"
                      : theme === "gold-velvet"
                        ? "bg-white hover:bg-slate-50 border-[#c5a85c]/30 text-[#012c1e]"
                        : theme === "navy-velvet"
                          ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm"
                          : isDark 
                            ? "bg-emerald-950/10 hover:bg-emerald-950/20 border-emerald-900/20 text-slate-100" 
                            : "bg-emerald-50/10 hover:bg-emerald-50/30 border-emerald-100/60 text-slate-800"
                  }`}
                  onClick={() => onSelectSurah(b.surahNumber, b.ayahNumber)}
                >
                  {/* Content (Name & Ayah details) */}
                  <div className="flex items-center gap-3.5">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all ${catInfo.bg}`}>
                      <BookmarkIcon size={18} className={catInfo.iconClass} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${catInfo.badge}`}>
                          {catInfo.label}
                        </span>
                        <h3 className={`text-sm font-bold ${
                          theme === "emerald-velvet"
                            ? "text-[#FAF8F5]"
                            : isDark ? "text-slate-100" : "text-slate-850"
                        }`}>
                          سورة {matchingSurah?.name || b.surahName}
                        </h3>
                      </div>
                      <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
                        theme === "emerald-velvet"
                          ? "text-[#FAF8F5]/80"
                          : isDark ? "text-slate-400" : "text-slate-500"
                      }`}>
                        <BookOpen size={12} className={
                          theme === "navy-velvet"
                            ? "text-[#3F63C6]"
                            : theme === "gold-velvet" || theme === "emerald-velvet"
                              ? "text-[#c5a85c]"
                              : "text-amber-500"
                        } />
                        <span>{b.ayahNumber ? `الآية الكريمة رقم ${b.ayahNumber}` : "بداية السورة المباركة"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions / Timestamp */}
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <div className="text-left space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 justify-end">
                        <Clock size={10} />
                        <span>{b.timestamp}</span>
                      </p>
                    </div>
                    
                    {onRemoveBookmark && (
                      <button
                        type="button"
                        onClick={() => onRemoveBookmark(b.surahNumber, b.ayahNumber)}
                        className={`p-2 rounded-lg border opacity-70 hover:opacity-100 transition-all cursor-pointer ${
                          theme === "emerald-velvet"
                            ? "bg-[#011a12] border-[#c5a85c]/35 text-rose-500 hover:text-rose-400"
                            : theme === "gold-velvet"
                              ? "bg-emerald-950/20 border-[#c5a85c]/30 text-rose-600 hover:text-rose-500"
                              : theme === "navy-velvet"
                                ? "bg-slate-100 border-slate-200 text-rose-500 hover:text-rose-600"
                                : isDark 
                                  ? "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-emerald-400" 
                                  : "bg-white border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-100"
                        }`}
                        title="إزالة العلامة"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className={`text-center py-20 rounded-3xl border ${
            theme === "emerald-velvet"
              ? "bg-[#011a12] border-[#c5a85c]/25 text-[#FAF8F5]/85"
              : isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-100 shadow-xs"
          }`}>
            <BookmarkIcon id="fav-placeholder-bookmark" className={`mx-auto mb-4 animate-bounce ${
              theme === "navy-velvet"
                ? "text-[#3F63C6]/40"
                : theme === "gold-velvet" || theme === "emerald-velvet"
                  ? "text-[#c5a85c]/40"
                  : "text-emerald-500/40"
            }`} size={44} />
            <p className={`font-bold ${
              theme === "emerald-velvet"
                ? "text-[#FAF8F5]"
                : isDark ? "text-slate-300" : "text-slate-700"
            }`}>قائمة علاماتك فارغة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}
