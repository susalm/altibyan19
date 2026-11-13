import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Search, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { surahsList } from "../data/surahList";
import { ensureQbsmlLoaded, getSurahHeaderGlyph } from "../utils/qcf4Utils";

interface SurahSelectDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSurahNumber: number;
  onSelectSurah: (surahNumber: number) => void;
  isDark: boolean;
  theme: string;
  align?: "left" | "right";
}

const toArabicNumerals = (num: number): string => {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((char) => {
      const parsed = parseInt(char, 10);
      return isNaN(parsed) ? char : digits[parsed];
    })
    .join("");
};

export const SurahSelectModal: React.FC<SurahSelectDropdownProps> = ({
  isOpen,
  onClose,
  selectedSurahNumber,
  onSelectSurah,
  isDark,
  theme,
  align = "right",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
  const [computedHeights, setComputedHeights] = useState<{ height: number; maxHeight: number }>({
    height: 340,
    maxHeight: 420,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      ensureQbsmlLoaded();
    }
  }, [isOpen]);

  // Calculate best direction (above or below trigger) and viewport-safe height so the list stays visible and scrollable
  useLayoutEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      const parentEl = dropdownRef.current?.parentElement;
      if (!parentEl) return;
      const rect = parentEl.getBoundingClientRect();
      const vh = window.innerHeight || 700;
      const spaceBelow = vh - rect.bottom;
      const spaceAbove = rect.top;
      const shouldOpenUp = spaceBelow < 280 && spaceAbove > spaceBelow;
      setOpenUpward(shouldOpenUp);
      const availableSpace = shouldOpenUp ? spaceAbove - 68 : spaceBelow - 56;
      const maxH = Math.min(420, Math.max(180, Math.floor(availableSpace)));
      const targetH = Math.min(maxH, Math.max(Math.min(260, maxH), Math.floor(vh * 0.45)));
      setComputedHeights({ height: targetH, maxHeight: maxH });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isOpen]);

  // Center currently selected surah within the list container only (without scrolling outer containers)
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const rafId = requestAnimationFrame(() => {
      const container = listRef.current;
      if (!container) return;
      const selectedEl = container.querySelector('[data-selected="true"]') as HTMLElement | null;
      if (selectedEl) {
        container.scrollTop = Math.max(
          0,
          selectedEl.offsetTop - container.clientHeight / 2 + selectedEl.clientHeight / 2
        );
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, selectedSurahNumber]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const container = dropdownRef.current?.parentElement || dropdownRef.current;
      if (container && !container.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return surahsList;
    const query = searchQuery.trim().toLowerCase();
    return surahsList.filter(
      (s) =>
        s.name.includes(query) ||
        `سورة ${s.name}`.includes(query) ||
        String(s.number) === query ||
        s.englishName.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.97 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={`absolute ${openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"} ${
          align === "left" ? "left-0" : "right-0"
        } z-[9999] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
          theme === "emerald-velvet"
            ? "bg-[#011e15] border-[#c5a85c]/40 text-[#FAF8F5]"
            : theme === "navy-velvet"
              ? "bg-[#F0F7FF] border-[#3F63C6]/30 text-slate-900"
              : theme === "gold-velvet"
                ? "bg-[#FAF5E6] border-[#c5a85c]/40 text-amber-950"
                : isDark
                  ? "bg-slate-950 border-slate-800 text-white"
                  : "bg-white border-emerald-200 text-slate-900"
        }`}
        style={{
          width: "280px",
          minWidth: "240px",
          maxWidth: "calc(100vw - 32px)",
          height: `${computedHeights.height}px`,
          maxHeight: `${computedHeights.maxHeight}px`,
          touchAction: "pan-y",
        }}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Field */}
        <div className="p-2 border-b border-inherit shrink-0">
          <div className={`relative flex items-center px-2.5 py-1.5 rounded-xl border transition-all ${
            theme === "emerald-velvet"
              ? "bg-[#01140e] border-[#c5a85c]/30 text-[#FAF8F5]"
              : theme === "navy-velvet"
                ? "bg-white border-[#3F63C6]/30 text-slate-900"
                : theme === "gold-velvet"
                  ? "bg-white border-[#c5a85c]/30 text-amber-950"
                  : isDark
                    ? "bg-slate-900 border-slate-800 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-900"
          }`}>
            <Search size={13} className="text-slate-400 shrink-0 ml-1.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن سورة..."
              className="w-full bg-transparent text-xs font-bold outline-none placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-red-500 dark:text-red-400 hover:text-red-600 mr-1 cursor-pointer p-0.5"
                title="مسح"
              >
                <X size={12} className="text-red-500 dark:text-red-400" />
              </button>
            )}
          </div>
        </div>

        {/* Surahs List */}
        <div
          ref={listRef}
          className="p-2 overflow-y-auto overflow-x-hidden space-y-1.5 custom-scroll flex-1 min-h-0 touch-pan-y overscroll-contain relative"
          style={{
            touchAction: "pan-y",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          }}
          onWheel={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {filteredSurahs.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 font-bold">
              لا توجد نتائج
            </div>
          ) : (
            filteredSurahs.map((surah) => {
              const isSelected = surah.number === selectedSurahNumber;
              return (
                <button
                  key={surah.number}
                  type="button"
                  data-selected={isSelected ? "true" : undefined}
                  onClick={() => {
                    onSelectSurah(surah.number);
                    onClose();
                  }}
                  className={`w-full px-3 py-3 sm:py-3.5 min-h-[58px] sm:min-h-[64px] rounded-xl border flex items-center justify-between transition-all duration-150 cursor-pointer text-right group touch-pan-y ${
                    isSelected
                      ? theme === "emerald-velvet"
                        ? "bg-[#012f20] border-[#34d399] text-[#FAF8F5] shadow-2xs"
                        : theme === "navy-velvet"
                          ? "bg-[#3F63C6]/15 border-[#3F63C6] text-slate-900 dark:text-white shadow-2xs"
                          : theme === "gold-velvet"
                            ? "bg-[#c5a85c]/25 border-[#c5a85c] text-amber-950 shadow-2xs"
                            : "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-slate-900 dark:text-slate-100 shadow-2xs"
                      : theme === "emerald-velvet"
                        ? "bg-[#011a12] border-transparent text-[#FAF8F5] hover:bg-[#012519]"
                        : theme === "navy-velvet"
                          ? "bg-white border-transparent text-slate-800 hover:bg-[#EAEBED]"
                          : theme === "gold-velvet"
                            ? "bg-white border-transparent text-amber-950 hover:bg-[#c5a85c]/10"
                            : isDark
                              ? "bg-slate-900 border-transparent hover:bg-slate-800 text-slate-100"
                              : "bg-white border-transparent hover:bg-emerald-50 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-visible py-0.5">
                    <span className={`flex h-7 w-7 rounded-lg items-center justify-center font-amiri font-bold text-xs border shrink-0 ${
                      isSelected
                        ? "bg-emerald-500 text-white border-emerald-400"
                        : theme === "emerald-velvet"
                          ? "bg-[#c5a85c]/15 text-[#c5a85c] border-[#c5a85c]/30"
                          : theme === "navy-velvet"
                            ? "bg-[#3F63C6]/10 text-[#3F63C6] border-[#3F63C6]/20"
                            : theme === "gold-velvet"
                              ? "bg-[#c5a85c]/10 text-[#c5a85c] border-[#c5a85c]/25"
                              : isDark ? "bg-emerald-950/50 text-emerald-300 border-emerald-900/40" : "bg-emerald-50 text-emerald-800 border-emerald-100"
                    }`}>
                      {toArabicNumerals(surah.number)}
                    </span>
                    <span
                      className="text-sm font-normal leading-relaxed select-none py-0.5 -translate-y-0.5 inline-block"
                      style={{ fontFamily: "QCF4_QBSML, 'Amiri', serif" }}
                    >
                      {getSurahHeaderGlyph(surah.number, surah.name) || surah.name}
                    </span>
                  </div>
                  {isSelected && <Check size={16} className="text-emerald-500 shrink-0 mr-1" />}
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
