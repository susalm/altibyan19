import React, { useState } from "react";
import { QuranSettings } from "../types";
import { 
  Moon, 
  Sun, 
  Sliders, 
  Check, 
  Palette,
  X,
  Languages,
  ArrowUpDown,
  ArrowLeftRight,
  Star,
  Share2,
  MessageSquarePlus,
  Send
} from "lucide-react";
import { shareTextOnCapacitor, copyTextWithFallback } from "../utils/nativeShare";

interface SettingsScreenProps {
  settings: QuranSettings;
  onChangeSettings: (newSettings: Partial<QuranSettings>) => void;
  isDark: boolean;
  onToggleDarkMode: () => void;
  theme: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet";
  onChangeTheme?: (newTheme: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet") => void;
  inDrawer?: boolean;
  onClose?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onChangeSettings,
  isDark,
  onToggleDarkMode,
  theme,
  onChangeTheme,
  inDrawer = false,
  onClose,
}) => {
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"rate" | "share" | "feedback" | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // App Language
  const currentLang = settings.language || "ar";

  // Page Scroll Direction
  const isVertical = settings.scrollDirection === "vertical";

  // Dynamic Theme Colors calculation matching the screenshot & active theme
  const getThemeStyles = () => {
    switch (theme) {
      case "gold-velvet":
        return {
          pageBg: isDark ? "bg-[#17140E] text-[#FBF6E9]" : "bg-[#FBF8F1] text-[#292212]",
          cardBg: isDark ? "bg-[#231F17]" : "bg-[#FFFFFF]",
          cardBorder: isDark ? "border-[#4A3F29]" : "border-[#EDE4D0]",
          divider: isDark ? "bg-[#3D3422]" : "bg-[#F0E8D7]",
          badgeBg: isDark ? "bg-[#C5A85C]/15" : "bg-[#C5A85C]/10",
          iconColor: isDark ? "text-[#E6CA7E]" : "text-[#A88836]",
          activeBtn: isDark 
            ? "bg-[#38301F] border-[#C5A85C] text-[#FAF5E6] shadow-sm font-bold" 
            : "bg-[#F7EED8] border-[#C5A85C] text-[#2D230F] shadow-xs font-bold",
          inactiveBtn: isDark 
            ? "bg-[#1A1711] border-[#38301F] text-[#9E907B] hover:bg-[#2A241A]" 
            : "bg-[#FAFAFA] border-[#E8E2D2] text-[#6B7280] hover:bg-[#F5F2EB]",
          subCardBg: isDark ? "bg-[#1C1812] hover:bg-[#252018]" : "bg-[#FAF7F0] hover:bg-[#F5EFE3]",
          subCardBorder: isDark ? "border-[#38301F]" : "border-[#E8E1CF]",
          saveBtn: "bg-[#C5A85C] hover:bg-[#B5984C] text-[#FFFFFF] shadow-[#C5A85C]/25",
          switchOnBg: "bg-[#C5A85C]",
          accentDot: "bg-[#C5A85C]",
        };
      case "emerald-velvet":
        return {
          pageBg: isDark ? "bg-[#01160E] text-[#FAF8F5]" : "bg-[#F1F8F4] text-[#0A261C]",
          cardBg: isDark ? "bg-[#012519]" : "bg-[#FFFFFF]",
          cardBorder: isDark ? "border-[#064E3B]" : "border-[#CFE5DA]",
          divider: isDark ? "bg-[#064E3B]/60" : "bg-[#E0EFE8]",
          badgeBg: isDark ? "bg-[#10B981]/20" : "bg-[#10B981]/10",
          iconColor: isDark ? "text-[#34D399]" : "text-[#059669]",
          activeBtn: isDark 
            ? "bg-[#023E2A] border-[#10B981] text-[#FAF8F5] shadow-sm font-bold" 
            : "bg-[#D6F3E6] border-[#10B981] text-[#012A1C] shadow-xs font-bold",
          inactiveBtn: isDark 
            ? "bg-[#011E14] border-[#064E3B] text-[#86A397] hover:bg-[#02281B]" 
            : "bg-[#FAFAFA] border-[#DCEBE3] text-[#6B7280] hover:bg-[#F0F7F3]",
          subCardBg: isDark ? "bg-[#011E14] hover:bg-[#02281B]" : "bg-[#F4FAF6] hover:bg-[#EAF5EF]",
          subCardBorder: isDark ? "border-[#064E3B]/80" : "border-[#CCE4D8]",
          saveBtn: "bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] shadow-[#059669]/25",
          switchOnBg: "bg-[#059669]",
          accentDot: "bg-[#10B981]",
        };
      case "navy-velvet":
        return {
          pageBg: isDark ? "bg-[#091120] text-[#FAF8F5]" : "bg-[#F2F6FD] text-[#0D1F42]",
          cardBg: isDark ? "bg-[#0F1B30]" : "bg-[#FFFFFF]",
          cardBorder: isDark ? "border-[#1D3256]" : "border-[#D3E0FA]",
          divider: isDark ? "bg-[#1D3256]/60" : "bg-[#E4EDFD]",
          badgeBg: isDark ? "bg-[#3F63C6]/20" : "bg-[#3F63C6]/10",
          iconColor: isDark ? "text-[#60A5FA]" : "text-[#2563EB]",
          activeBtn: isDark 
            ? "bg-[#172E54] border-[#3F63C6] text-[#FAF8F5] shadow-sm font-bold" 
            : "bg-[#DFEBFE] border-[#3F63C6] text-[#0E244E] shadow-xs font-bold",
          inactiveBtn: isDark 
            ? "bg-[#0C172B] border-[#1D3256] text-[#8A9EB8] hover:bg-[#13223D]" 
            : "bg-[#FAFAFA] border-[#DCE6FA] text-[#6B7280] hover:bg-[#F2F6FE]",
          subCardBg: isDark ? "bg-[#0C172B] hover:bg-[#13223D]" : "bg-[#F5F8FE] hover:bg-[#EAF0FD]",
          subCardBorder: isDark ? "border-[#1D3256]/80" : "border-[#D0DEF8]",
          saveBtn: "bg-[#3F63C6] hover:bg-[#3152B3] text-[#FFFFFF] shadow-[#3F63C6]/25",
          switchOnBg: "bg-[#3F63C6]",
          accentDot: "bg-[#3F63C6]",
        };
      default:
        // Default light / dark
        return {
          pageBg: isDark ? "bg-[#0B0F17] text-slate-100" : "bg-[#FAF7F2] text-slate-900",
          cardBg: isDark ? "bg-[#131B29]" : "bg-[#FFFFFF]",
          cardBorder: isDark ? "border-slate-800" : "border-slate-200/90",
          divider: isDark ? "bg-slate-800" : "bg-slate-200/60",
          badgeBg: isDark ? "bg-emerald-500/15" : "bg-emerald-500/10",
          iconColor: isDark ? "text-emerald-400" : "text-emerald-700",
          activeBtn: isDark 
            ? "bg-slate-800 border-emerald-500 text-white shadow-sm font-bold" 
            : "bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs font-bold",
          inactiveBtn: isDark 
            ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850" 
            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100",
          subCardBg: isDark ? "bg-slate-900/60 hover:bg-slate-900" : "bg-slate-50 hover:bg-slate-100/70",
          subCardBorder: isDark ? "border-slate-800" : "border-slate-200",
          saveBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25",
          switchOnBg: "bg-emerald-600",
          accentDot: "bg-emerald-600",
        };
    }
  };

  const styleTokens = getThemeStyles();

  // Save Settings Handlers
  const handleSave = () => {
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      if (onClose) onClose();
    }, 900);
  };

  // Feedback Submission
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setActionNotice("شكراً جزيلاً لك! تم استلام مقترحك القيّم وسنعمل على دراسته وتطوير التطبيق به.");
    setTimeout(() => {
      setActionNotice(null);
      setModalType(null);
      setFeedbackText("");
    }, 2000);
  };

  // Share Application
  const handleShareApp = async () => {
    const shareData = {
      title: "مصحف التبيان الجامع",
      text: "أنصحكم بتطبيق مصحف التبيان الجامع، قراءة وتفاسير وإعراب وتدبر بدون إنترنت وبأجمل الخطوط والتصاميم.",
      url: window.location.origin.startsWith("http") ? window.location.origin : undefined,
    };
    const capRes = await shareTextOnCapacitor({
      title: shareData.title,
      text: shareData.text,
      url: shareData.url,
      dialogTitle: "مشاركة التطبيق",
    });
    if (capRes === "shared" || capRes === "cancelled") {
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (_) {}
    }
    const ok = await copyTextWithFallback(`${shareData.title}\n${shareData.text}${shareData.url ? `\n${shareData.url}` : ""}`);
    if (ok) {
      setActionNotice("تم نسخ رابط التطبيق ورسالة المشاركة بنجاح!");
      setTimeout(() => setActionNotice(null), 2500);
    }
  };

  return (
    <div
      dir="rtl"
      id="settings-screen-root"
      className={`w-full h-full min-h-screen flex flex-col justify-between select-none transition-colors duration-300 ${styleTokens.pageBg} p-3 sm:p-5 md:p-6 pb-20`}
    >
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-3.5 sm:gap-4 flex-1">
        
        {/* Notice Banner when toast active */}
        {actionNotice && (
          <div className="w-full p-3 sm:p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm text-center shadow-lg animate-fade-in flex items-center justify-center gap-2">
            <Check size={18} className="stroke-[3]" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* 1. لغة التطبيق / App Language */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs transition-all ${styleTokens.cardBg} ${styleTokens.cardBorder}`}>
          <div className="flex items-center justify-end gap-2 text-xs sm:text-sm font-semibold opacity-75 mb-3">
            <span>لغة التطبيق / App Language</span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${styleTokens.badgeBg}`}>
              <Languages size={15} className={styleTokens.iconColor} />
            </div>
          </div>
          <div className={`w-full h-[1px] ${styleTokens.divider} mb-4`} />
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => onChangeSettings({ language: "en" })}
              className={`h-14 sm:h-16 rounded-2xl font-bold text-[10px] transition-all cursor-pointer flex items-center justify-center border-2 active:scale-98 ${
                currentLang === "en" ? styleTokens.activeBtn : styleTokens.inactiveBtn
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onChangeSettings({ language: "ar" })}
              className={`h-14 sm:h-16 rounded-2xl font-bold text-[10px] transition-all cursor-pointer flex items-center justify-center border-2 active:scale-98 ${
                currentLang === "ar" ? styleTokens.activeBtn : styleTokens.inactiveBtn
              }`}
            >
              العربية
            </button>
          </div>
        </div>

        {/* 2. المظهر الليلي */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs flex items-center justify-between transition-all ${styleTokens.cardBg} ${styleTokens.cardBorder}`}>
          {/* Left: Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={onToggleDarkMode}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isDark ? styleTokens.switchOnBg : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isDark ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>

          {/* Right: Icon + Label */}
          <div className="flex items-center gap-3 text-right">
            <div className="flex flex-col items-end">
              <span className="text-sm sm:text-base font-bold">المظهر الليلي</span>
              <span className="text-xs opacity-70">
                {isDark ? "الوضع الليلي مفعّل" : "الوضع النهاري مفعّل"}
              </span>
            </div>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${styleTokens.badgeBg}`}>
              {isDark ? (
                <Moon size={18} className={styleTokens.iconColor} />
              ) : (
                <Sun size={18} className={styleTokens.iconColor} />
              )}
            </div>
          </div>
        </div>

        {/* 3. المظهر النهاري */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs transition-all ${styleTokens.cardBg} ${styleTokens.cardBorder}`}>
          <div className="flex items-center justify-end gap-2 text-xs sm:text-sm font-semibold opacity-75 mb-3">
            <span>المظهر النهاري</span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${styleTokens.badgeBg}`}>
              <Palette size={15} className={styleTokens.iconColor} />
            </div>
          </div>
          <div className={`w-full h-[1px] ${styleTokens.divider} mb-4`} />
          
          {/* 3 Squircle Theme Options Centered */}
          <div className="flex items-center justify-center gap-5 sm:gap-7 py-2">
            {/* 1. Navy Theme (المخملي النيلي) */}
            <button
              type="button"
              onClick={() => onChangeTheme?.("navy-velvet")}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all cursor-pointer bg-[#172E54] shadow-sm active:scale-95 ${
                theme === "navy-velvet" 
                  ? "ring-3 ring-[#3F63C6] ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105" 
                  : "opacity-85 hover:opacity-100 hover:scale-102"
              }`}
              title="المظهر النيلي"
            >
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
                {theme === "navy-velvet" && <div className="w-2.5 h-2.5 rounded-full bg-[#172E54]" />}
              </div>
            </button>

            {/* 2. Gold Velvet Theme (المخملي الذهبي - كما في الصورة) */}
            <button
              type="button"
              onClick={() => onChangeTheme?.("gold-velvet")}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all cursor-pointer bg-[#EEDBBD] border-2 border-[#C5A85C] shadow-sm active:scale-95 ${
                theme === "gold-velvet" 
                  ? "ring-3 ring-[#C5A85C] ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105" 
                  : "opacity-85 hover:opacity-100 hover:scale-102"
              }`}
              title="المظهر الذهبي"
            >
              <div className="w-5 h-5 rounded-full bg-[#C5A85C] flex items-center justify-center shadow-xs">
                {theme === "gold-velvet" && <div className="w-2.5 h-2.5 rounded-full bg-[#EEDBBD]" />}
              </div>
            </button>

            {/* 3. Emerald Velvet Theme (المخملي الزمردي) */}
            <button
              type="button"
              onClick={() => onChangeTheme?.("emerald-velvet")}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all cursor-pointer bg-[#D5F2E3] border-2 border-[#10B981]/50 shadow-sm active:scale-95 ${
                theme === "emerald-velvet" 
                  ? "ring-3 ring-[#10B981] ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105" 
                  : "opacity-85 hover:opacity-100 hover:scale-102"
              }`}
              title="المظهر الزمردي"
            >
              <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center shadow-xs">
                {theme === "emerald-velvet" && <div className="w-2.5 h-2.5 rounded-full bg-[#D5F2E3]" />}
              </div>
            </button>
          </div>
        </div>

        {/* 4. تقليب الصفحات */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs transition-all ${styleTokens.cardBg} ${styleTokens.cardBorder}`}>
          <div className="flex items-center justify-end gap-2 text-xs sm:text-sm font-semibold opacity-75 mb-1">
            <div className="flex flex-col items-end">
              <span>تقليب الصفحات</span>
              <span className="text-[10px] opacity-70">
                {isVertical
                  ? "الوضع المفعّل: رأسي لأعلى وأسفل فقط"
                  : "الوضع المفعّل: أفقي على اليمين واليسار فقط"}
              </span>
            </div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${styleTokens.badgeBg}`}>
              <Sliders size={15} className={styleTokens.iconColor} />
            </div>
          </div>
          <div className={`w-full h-[1px] ${styleTokens.divider} my-3`} />
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* رأسي */}
            <button
              type="button"
              onClick={() => onChangeSettings({ scrollDirection: "vertical" })}
              className={`h-14 sm:h-16 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 border-2 active:scale-98 ${
                isVertical ? styleTokens.activeBtn : styleTokens.inactiveBtn
              }`}
            >
              <ArrowUpDown size={17} className="shrink-0" />
              <span>رأسي (أعلى وأسفل)</span>
            </button>

            {/* أفقي */}
            <button
              type="button"
              onClick={() => onChangeSettings({ scrollDirection: "horizontal" })}
              className={`h-14 sm:h-16 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 border-2 active:scale-98 ${
                !isVertical ? styleTokens.activeBtn : styleTokens.inactiveBtn
              }`}
            >
              <ArrowLeftRight size={17} className="shrink-0" />
              <span>أفقي (يمين ويسار)</span>
            </button>
          </div>
        </div>

        {/* 5. الثلاث أزرار: التقييم | مشاركة التطبيق | مقترحات */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* مقترحات */}
          <button
            type="button"
            onClick={() => setModalType("feedback")}
            className={`p-3.5 sm:p-4 rounded-3xl border shadow-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${styleTokens.cardBg} ${styleTokens.cardBorder}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${styleTokens.badgeBg}`}>
              <MessageSquarePlus size={18} className={styleTokens.iconColor} />
            </div>
            <span className="text-xs sm:text-sm font-bold">مقترحات</span>
          </button>

          {/* مشاركة التطبيق */}
          <button
            type="button"
            onClick={handleShareApp}
            className={`p-3.5 sm:p-4 rounded-3xl border shadow-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${styleTokens.cardBg} ${styleTokens.cardBorder}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${styleTokens.badgeBg}`}>
              <Share2 size={18} className={styleTokens.iconColor} />
            </div>
            <span className="text-xs sm:text-sm font-bold">مشاركة التطبيق</span>
          </button>

          {/* التقييم */}
          <button
            type="button"
            onClick={() => setModalType("rate")}
            className={`p-3.5 sm:p-4 rounded-3xl border shadow-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${styleTokens.cardBg} ${styleTokens.cardBorder}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${styleTokens.badgeBg}`}>
              <Star size={18} className={styleTokens.iconColor} />
            </div>
            <span className="text-xs sm:text-sm font-bold">التقييم</span>
          </button>
        </div>

      </div>

      {/* 7. الزر السفلي العريض: حفظ وتطبيق الخيارات */}
      <div className="w-full max-w-2xl mx-auto pt-4 sticky bottom-0 z-20">
        <button
          type="button"
          onClick={handleSave}
          className={`w-full py-4 rounded-2xl font-bold text-[10px] shadow-lg transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 ${styleTokens.saveBtn}`}
        >
          {saveToast ? (
            <>
              <Check size={22} className="stroke-[3] animate-bounce" />
              <span>تم حفظ وتطبيق الخيارات بنجاح</span>
            </>
          ) : (
            <span>حفظ وتطبيق الخيارات</span>
          )}
        </button>
      </div>

      {/* Interactive Modal: Rate App */}
      {modalType === "rate" && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => setModalType(null)}>
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl flex flex-col items-center text-center gap-4 ${styleTokens.cardBg} ${styleTokens.cardBorder}`} onClick={(e) => e.stopPropagation()}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${styleTokens.badgeBg}`}>
              <Star size={28} className={styleTokens.iconColor} />
            </div>
            <h3 className="text-[10px] font-black">تقييم تطبيق مصحف التبيان</h3>
            <p className="text-xs opacity-80 leading-relaxed">
              نسعد بتقييمك لتطبيق مصحف التبيان ودعمك لنا في نشر كتاب الله الكريم وعلومه النافعة.
            </p>
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingScore(star)}
                  className="cursor-pointer transition-transform hover:scale-125"
                >
                  <Star
                    size={28}
                    className={star <= ratingScore ? "fill-amber-400 text-amber-400" : "text-slate-400"}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setActionNotice("شكراً جزيلاً لتقييمك ودعمك المبارك!");
                setModalType(null);
                setTimeout(() => setActionNotice(null), 2500);
              }}
              className={`w-full py-3 rounded-xl font-bold text-sm cursor-pointer ${styleTokens.saveBtn}`}
            >
              إرسال التقييم
            </button>
          </div>
        </div>
      )}

      {/* Interactive Modal: Feedback / Suggestions */}
      {modalType === "feedback" && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => setModalType(null)}>
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl flex flex-col gap-4 ${styleTokens.cardBg} ${styleTokens.cardBorder}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setModalType(null)} className="p-1.5 rounded-lg opacity-70 hover:opacity-100 cursor-pointer">
                <X size={20} />
              </button>
              <div className="flex items-center gap-2 font-bold text-base">
                <span>المقترحات والملاحظات</span>
                <MessageSquarePlus size={20} className={styleTokens.iconColor} />
              </div>
            </div>
            <p className="text-xs opacity-80 text-right leading-relaxed">
              يسعدنا تلقي أي مقترح أو إضافة ترغب برؤيتها في تطبيق مصحف التبيان.
            </p>
            <form onSubmit={handleSubmitFeedback} className="flex flex-col gap-3">
              <textarea
                rows={4}
                required
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="اكتب مقترحك أو ملاحظتك هنا..."
                className={`w-full p-3.5 rounded-2xl text-xs sm:text-sm border ${styleTokens.inactiveBtn} focus:outline-hidden text-right resize-none`}
              />
              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-sm cursor-pointer flex items-center justify-center gap-2 ${styleTokens.saveBtn}`}
              >
                <Send size={16} />
                <span>إرسال المقترح</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsScreen;
