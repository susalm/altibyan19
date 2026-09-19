import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, X, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getSurahHeaderGlyph } from "../utils/qcf4Utils";

export interface DropdownOption<T> {
  value: T;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  surahNumber?: number;
  name?: string;
  arabicType?: string;
  numberOfAyahs?: number;
  juzStart?: number;
  englishName?: string;
}

interface CustomDropdownProps<T> {
  label?: string;
  value: T;
  onChange: (val: T) => void;
  options: DropdownOption<T>[];
  isDark: boolean;
  theme: string;
  searchable?: boolean;
  isSurahList?: boolean;
  className?: string;
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

export function renderWithAmiriNumbers(text: string | React.ReactNode) {
  if (typeof text !== "string") return text;
  const parts = text.split(/([٠-٩0-9]+)/g);
  if (parts.length === 1) return text;
  return parts.map((part, index) => {
    if (/^[٠-٩0-9]+$/.test(part)) {
      return (
        <span key={index} className="font-amiri font-bold inline-block px-0.5 leading-none">
          {part}
        </span>
      );
    }
    return part;
  });
}

export function CustomDropdown<T extends string | number>({
  label,
  value,
  onChange,
  options,
  isDark,
  theme,
  searchable = false,
  isSurahList = false,
  className = ""
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "مكية" | "مدنية">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const filteredOptions = useMemo(() => {
    let list = options;

    if (isSurahList && filterType !== "all") {
      list = list.filter(opt => opt.arabicType === filterType);
    }

    if (!searchable || !search.trim()) return list;
    const s = search.toLowerCase().trim();

    return list.filter(opt => {
      const labelMatch = opt.label.toLowerCase().includes(s);
      const valMatch = isSurahList && String(opt.value) === s;
      const subMatch = opt.sublabel && opt.sublabel.toLowerCase().includes(s);
      const nameMatch = opt.name && opt.name.toLowerCase().includes(s);
      const engMatch = opt.englishName && opt.englishName.toLowerCase().includes(s);
      const typeMatch = opt.arabicType && opt.arabicType.includes(s);

      return labelMatch || valMatch || subMatch || nameMatch || engMatch || typeMatch;
    });
  }, [options, search, searchable, isSurahList, filterType]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const isEmerald = theme === "emerald-velvet";
  const isGold = theme === "gold-velvet";
  const isNavy = theme === "navy-velvet";

  // Determine elegant colors with high-contrast borders suitable for the active theme
  const borderCol = isEmerald
    ? "border-[#c5a85c]/60 hover:border-[#c5a85c] focus-within:border-[#c5a85c]"
    : isGold
      ? "border-[#c5a85c]/50 hover:border-[#c5a85c] focus-within:border-[#c5a85c]"
      : isNavy
        ? "border-slate-300 hover:border-[#3F63C6]/60 focus-within:border-[#3F63C6]"
        : isDark
          ? "border-slate-750 hover:border-slate-600 focus-within:border-emerald-500"
          : "border-slate-300 hover:border-slate-400 focus-within:border-emerald-600";

  const dropdownBg = isEmerald
    ? "bg-[#012519] text-[#FAF8F5] shadow-sm shadow-black/20"
    : isNavy
      ? "bg-white text-slate-800 shadow-sm"
      : isGold
        ? "bg-[#FAF8F5] text-amber-950 shadow-sm"
        : isDark
          ? "bg-slate-950 text-white shadow-sm"
          : "bg-white text-slate-800 shadow-sm";

  const listBg = isEmerald
    ? "bg-[#011a12] border-[#c5a85c]/45 text-[#FAF8F5] shadow-2xl shadow-black/50"
    : isNavy
      ? "bg-white border-slate-200 text-slate-800 shadow-2xl"
      : isGold
        ? "bg-[#FAF8F5] border-[#c5a85c]/45 text-[#011c14] shadow-2xl"
        : isDark
          ? "bg-slate-900 border-slate-800 text-[#FAF8F5] shadow-2xl"
          : "bg-white border-slate-200 text-slate-800 shadow-2xl";

  const itemHover = isEmerald
    ? "hover:bg-[#012d1e] text-[#FAF8F5]"
    : isNavy
      ? "hover:bg-slate-100 text-slate-900"
      : isGold
        ? "hover:bg-[#c5a85c]/15 text-[#011c14]"
        : isDark
          ? "hover:bg-slate-800/80 text-[#FAF8F5]"
          : "hover:bg-slate-50 text-slate-900";

  const activeFocus = isEmerald
    ? "focus:ring-[#c5a85c]/50 focus:border-[#c5a85c]"
    : isGold
      ? "focus:ring-[#c5a85c]/50 focus:border-[#c5a85c]"
      : isNavy
        ? "focus:ring-[#3F63C6]/50 focus:border-[#3F63C6]"
        : "focus:ring-emerald-500/50 focus:border-emerald-500";

  const selectedSurahNum = selectedOption ? Number(selectedOption.surahNumber || selectedOption.value) : 1;

  return (
    <div 
      ref={dropdownRef} 
      className={`relative w-full cursor-pointer select-none ${className}`} 
      onClick={() => setIsOpen(!isOpen)}
    >
      {label && (
        <label className={`block text-[11px] font-bold mb-1.5 cursor-pointer flex items-center justify-between ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          <span>{label}</span>
          {isSurahList && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
              isEmerald || isGold ? "text-[#c5a85c]" : isNavy ? "text-[#3F63C6]" : "text-emerald-600"
            }`}>
              <span className="font-amiri font-bold text-xs">{toArabicNumerals(114)}</span> سورة
            </span>
          )}
        </label>
      )}
      
      {/* TRIGGER BUTTON */}
      <div
        className={`w-full min-h-[50px] sm:min-h-[54px] flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 ${borderCol} ${dropdownBg} ${activeFocus} hover:shadow-sm`}
      >
        {isSurahList && selectedOption?.value && !isNaN(selectedSurahNum) ? (
          <div className="flex items-center gap-3 truncate py-0.5 w-full">
            {/* Surah Number Emblem */}
            <div className={`flex h-8 w-8 rounded-xl items-center justify-center font-amiri font-bold text-[13px] border-2 shrink-0 shadow-xs ${
              isEmerald
                ? "bg-[#c5a85c]/15 text-[#c5a85c] border-[#c5a85c]/40"
                : isNavy
                  ? "bg-[#3F63C6]/10 text-[#3F63C6] border-[#3F63C6]/30"
                  : isGold
                    ? "bg-[#c5a85c]/15 text-[#c5a85c] border-[#c5a85c]/40"
                    : isDark ? "bg-slate-800 text-slate-100 border-slate-700" : "bg-slate-100 text-slate-900 border-slate-300"
            }`}>
              {toArabicNumerals(selectedSurahNum)}
            </div>

            {/* Surah Header Glyph */}
            <div className="flex items-center justify-between flex-1 truncate pr-1">
              <span 
                className={`text-[10px] font-normal leading-none select-none inline-flex items-center tracking-tight shrink-0 ${
                  isEmerald
                    ? "text-[#FAF8F5]"
                    : isDark
                      ? "text-slate-100"
                      : isGold
                        ? "text-amber-950"
                        : "text-slate-900"
                }`} 
                style={{ fontFamily: "QCF4_QBSML, 'Amiri', serif" }}
              >
                {getSurahHeaderGlyph(selectedSurahNum, selectedOption?.label)}
              </span>
            </div>
          </div>
        ) : (
          <span className={`truncate py-0.5 font-bold ${
            isEmerald
              ? "text-[#FAF8F5]"
              : isDark
                ? "text-slate-100"
                : isGold
                  ? "text-amber-950"
                  : "text-slate-900"
          }`}>
            {renderWithAmiriNumbers(selectedOption?.label)}
          </span>
        )}
        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          <ChevronDown size={17} className={`transition-transform duration-250 opacity-75 ${
            isOpen 
              ? (isEmerald ? "rotate-180 text-[#FAF8F5]" : isDark ? "rotate-180 text-slate-100" : "rotate-180 text-slate-900") 
              : (isEmerald ? "text-[#c5a85c]" : isDark ? "text-slate-400" : "text-slate-600")
          }`} />
        </div>
      </div>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.99 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-[250] mt-1.5 w-full rounded-2xl border-2 shadow-2xl flex flex-col overflow-hidden max-h-[380px] ${listBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Header */}
            {searchable && (
              <div className="p-2.5 border-b-2 border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/80 dark:bg-slate-950/80">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-inner">
                  <Search size={14} className="text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث باسم السورة أو رقمها..."
                    className="w-full bg-transparent text-xs outline-none border-none placeholder-slate-400 text-slate-900 dark:text-slate-100 focus:ring-0 p-0 text-right font-bold"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  {search && (
                    <button 
                      type="button" 
                      onClick={() => setSearch("")} 
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="مسح البحث"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* List Body with clear bordered items like Index */}
            <div className="overflow-y-auto custom-scrollbar p-2 space-y-1.5">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-8 text-xs text-slate-400 text-center flex flex-col items-center gap-2">
                  <Search size={22} className="opacity-40" />
                  <span>لا توجد نتائج مطابقة</span>
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  const surahNum = Number(opt.surahNumber || opt.value);
                  const isSurah = isSurahList && !isNaN(surahNum) && surahNum >= 1 && surahNum <= 114;

                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={`w-full text-right px-3 py-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        opt.disabled
                          ? "opacity-35 cursor-not-allowed"
                          : isSelected
                            ? isEmerald
                              ? "bg-[#012f20] border-[#c5a85c] text-white shadow-sm"
                              : isGold
                                ? "bg-[#FAF0D9] border-[#c5a85c] text-slate-900 shadow-sm"
                                : isNavy
                                  ? "bg-[#EEF2FF] border-[#3F63C6] text-slate-900 shadow-sm"
                                  : isDark
                                    ? "bg-slate-800 border-emerald-500 text-white shadow-sm"
                                    : "bg-emerald-50 border-emerald-600 text-slate-900 shadow-sm"
                            : isEmerald
                              ? "border-[#c5a85c]/25 hover:border-[#c5a85c]/60 hover:bg-[#012519] bg-[#011e15] text-white"
                              : isGold
                                ? "border-[#c5a85c]/30 hover:border-[#c5a85c] hover:bg-[#FAF8F5] bg-white text-slate-900"
                                : isNavy
                                  ? "border-slate-200 hover:border-[#3F63C6] hover:bg-slate-50 bg-white text-slate-900"
                                  : isDark
                                    ? "border-slate-800 hover:border-slate-600 hover:bg-slate-800/60 bg-slate-900/90 text-white"
                                    : "border-slate-200 hover:border-slate-400 hover:bg-slate-50 bg-white text-slate-900"
                      }`}
                    >
                      {isSurah ? (
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Surah Number Emblem */}
                          <div className={`flex h-8 w-8 rounded-lg items-center justify-center font-amiri font-bold text-[12px] border-2 shrink-0 ${
                            isSelected
                              ? isEmerald || isGold
                                ? "bg-[#c5a85c] text-[#011a12] border-[#c5a85c]"
                                : isNavy
                                  ? "bg-[#3F63C6] text-white border-[#3F63C6]"
                                  : "bg-emerald-600 text-white border-emerald-600"
                              : isEmerald
                                ? "bg-[#c5a85c]/15 text-[#c5a85c] border-[#c5a85c]/40"
                                : isNavy
                                  ? "bg-[#3F63C6]/10 text-[#3F63C6] border-[#3F63C6]/30"
                                  : isGold
                                    ? "bg-[#c5a85c]/15 text-[#c5a85c] border-[#c5a85c]/40"
                                    : isDark ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-slate-100 text-slate-800 border-slate-300"
                          }`}>
                            {toArabicNumerals(surahNum)}
                          </div>

                          {/* Surah Name / Header Glyph */}
                          <div className="text-right flex items-center gap-2">
                            <span 
                              className={`text-[10px] font-normal leading-none select-none ${
                                isDark 
                                  ? "text-slate-100" 
                                  : isEmerald 
                                    ? "text-[#FAF8F5]" 
                                    : isGold 
                                      ? "text-amber-950" 
                                      : "text-slate-900"
                              }`} 
                              style={{ fontFamily: "QCF4_QBSML, 'Amiri', serif" }}
                            >
                              {getSurahHeaderGlyph(surahNum, opt.label)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className={`truncate flex-1 pr-1 font-bold ${
                          isDark 
                            ? "text-slate-100" 
                            : isEmerald 
                              ? "text-[#FAF8F5]" 
                              : isGold 
                                ? "text-amber-950" 
                                : "text-slate-900"
                        }`}>
                          <p className="truncate">{renderWithAmiriNumbers(opt.label)}</p>
                          {opt.sublabel && <p className={`text-[10px] mt-0.5 truncate ${isDark || isEmerald ? "text-slate-400" : "opacity-60"}`}>{opt.sublabel}</p>}
                        </div>
                      )}

                      {/* Selected checkmark indicator */}
                      {isSelected && (
                        <div className={`p-1 rounded-full shrink-0 mr-2 ${
                          isEmerald || isGold
                            ? "bg-[#c5a85c] text-[#011a12]"
                            : isNavy
                              ? "bg-[#3F63C6] text-white"
                              : "bg-emerald-600 text-white"
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {isSurahList && (
              <div className="px-3 py-2 border-t-2 border-slate-200 dark:border-slate-800 text-[10px] font-bold flex items-center justify-between text-slate-500 bg-slate-50/90 dark:bg-slate-950/90 shrink-0">
                <span>المعروض: <span className="font-amiri font-bold text-xs">{toArabicNumerals(filteredOptions.length)}</span> سورة</span>
                <span>فهرس سور القرآن الكريم</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
