import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface DropdownOption {
  value: string | number;
  label: string;
  subLabel?: string;
}

interface CustomDropdownProps {
  label?: string;
  value: string | number;
  onChange: (val: string | number) => void;
  options: DropdownOption[];
  isDark?: boolean;
  theme?: string;
  searchable?: boolean;
  isSurahList?: boolean;
  disabled?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  value,
  onChange,
  options = [],
  isDark = false,
  theme = "default",
  searchable = false,
  isSurahList = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = searchable && search
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  return (
    <div className="relative w-full" ref={dropdownRef} dir="rtl">
      {label && (
        <label className="block text-xs font-semibold mb-1 opacity-80">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
          isDark
            ? "bg-slate-900/80 border-slate-700/70 text-slate-100 hover:border-emerald-500/50"
            : "bg-white border-slate-200 text-slate-800 hover:border-amber-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className="truncate">{currentOption?.label || String(value)}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-xl max-h-60 overflow-hidden flex flex-col ${
            isDark
              ? "bg-slate-900 border-slate-700 text-slate-100"
              : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          {searchable && (
            <div className="p-2 border-b border-slate-700/40 sticky top-0 bg-inherit z-10 flex items-center gap-1.5">
              <Search size={14} className="opacity-50 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث..."
                className="w-full bg-transparent text-xs focus:outline-hidden"
                autoFocus
              />
            </div>
          )}

          <div className="overflow-y-auto flex-1 p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-4 text-xs opacity-50">لا توجد خيارات</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-right transition-colors ${
                    String(opt.value) === String(value)
                      ? "bg-emerald-600 text-white font-bold"
                      : "hover:bg-slate-500/15"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.subLabel && (
                    <span className="text-[10px] opacity-60 mr-2 shrink-0">{opt.subLabel}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
