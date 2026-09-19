import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Award, CheckCircle, RefreshCw, ChevronLeft, BookOpen, Plus, Trash2, Info, Check, HelpCircle } from "lucide-react";
import { juzList } from "../data/juzList";

interface HizbInfo {
  number: number;
  nameAr: string;
  startSurahNumber: number;
  startSurahName: string;
  startAyahNumber: number;
}

interface JuzInfo {
  number: number;
  nameAr: string;
  nameEn: string;
  startSurahNumber: number;
  startSurahName: string;
  startAyahNumber: number;
  hizbs: [HizbInfo, HizbInfo];
}

interface KhatmahPlan {
  id: string;
  name: string;
  durationDays: 3 | 7 | 10 | 15 | 30 | 60;
  startDate: string;
  completedDays: number[]; // indices of completed days (1-indexed)
  createdAt: number;
}

interface KhatmahScreenProps {
  isDark: boolean;
  theme?: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet";
  onSelectSurah: (surahNumber: number, startAyah?: number) => void;
}

const LOCAL_KHATMAH_KEY = "quran_khatmah_tebyan_plan";

export default function KhatmahScreen({ isDark, theme = "light", onSelectSurah }: KhatmahScreenProps) {
  const [activePlan, setActivePlan] = useState<KhatmahPlan | null>(null);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  
  // Setup Form state
  const [planName, setPlanName] = useState<string>("ورد الختمة المباركة");
  const [duration, setDuration] = useState<3 | 7 | 10 | 15 | 30 | 60>(30);
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Load plan from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_KHATMAH_KEY);
      if (saved) {
        setActivePlan(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Could not load Khatmah plan:", e);
    }
  }, []);

  // Save plan helper
  const savePlan = (plan: KhatmahPlan | null) => {
    setActivePlan(plan);
    try {
      if (plan) {
        localStorage.setItem(LOCAL_KHATMAH_KEY, JSON.stringify(plan));
      } else {
        localStorage.removeItem(LOCAL_KHATMAH_KEY);
      }
      // Dispatch custom event for real-time synchronization
      window.dispatchEvent(new Event("khatmah_updated"));
    } catch (e) {
      console.error("Could not save Khatmah plan:", e);
    }
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    const newPlan: KhatmahPlan = {
      id: `plan-${Date.now()}`,
      name: planName.trim(),
      durationDays: duration,
      startDate: startDate || new Date().toISOString().split("T")[0],
      completedDays: [],
      createdAt: Date.now()
    };

    savePlan(newPlan);
    setShowSetup(false);
  };

  const handleDeletePlan = () => {
    setShowDeleteConfirm(true);
  };

  const toggleDayCompletion = (dayNum: number) => {
    if (!activePlan) return;
    
    let updatedCompleted = [...activePlan.completedDays];
    if (updatedCompleted.includes(dayNum)) {
      updatedCompleted = updatedCompleted.filter((d) => d !== dayNum);
    } else {
      updatedCompleted.push(dayNum);
    }

    savePlan({
      ...activePlan,
      completedDays: updatedCompleted
    });
  };

  // Quick action: log next uncompleted day
  const handleLogNextDay = () => {
    if (!activePlan) return;
    
    const durationDays = activePlan.durationDays;
    // Find first day from 1 to durationDays that is not in completedDays
    for (let d = 1; d <= durationDays; d++) {
      if (!activePlan.completedDays.includes(d)) {
        toggleDayCompletion(d);
        break;
      }
    }
  };

  // Helper to map a day to its reading portion
  const getPortionForDay = (day: number, planDuration: number): {
    title: string;
    description: string;
    startSurah: number;
    startAyah: number;
  } => {
    if (planDuration === 3) {
      // 10 Juzs per day
      const juzIdx1 = Math.min((day - 1) * 10, 20);
      const juz1 = juzList[juzIdx1];
      const juzLast = juzList[Math.min(juzIdx1 + 9, 29)];
      return {
        title: `من ${juz1.nameAr} إلى ${juzLast.nameAr}`,
        description: `يبدأ من سورة ${juz1.startSurahName} (الآية ${juz1.startAyahNumber})`,
        startSurah: juz1.startSurahNumber,
        startAyah: juz1.startAyahNumber
      };
    } else if (planDuration === 7) {
      // Custom grouping for 7 days
      let startIdx = 0;
      let count = 4;
      if (day === 1) { startIdx = 0; count = 4; }
      else if (day === 2) { startIdx = 4; count = 4; }
      else if (day === 3) { startIdx = 8; count = 4; }
      else if (day === 4) { startIdx = 12; count = 4; }
      else if (day === 5) { startIdx = 16; count = 4; }
      else if (day === 6) { startIdx = 20; count = 5; }
      else if (day === 7) { startIdx = 25; count = 5; }
      
      const juz1 = juzList[startIdx];
      const juzLast = juzList[startIdx + count - 1];
      return {
        title: `من ${juz1.nameAr} إلى ${juzLast.nameAr}`,
        description: `يبدأ من سورة ${juz1.startSurahName} (الآية ${juz1.startAyahNumber})`,
        startSurah: juz1.startSurahNumber,
        startAyah: juz1.startAyahNumber
      };
    } else if (planDuration === 30) {
      // 1 Juz per day
      const juzIdx = Math.min(day - 1, 29);
      const juz = juzList[juzIdx];
      return {
        title: juz.nameAr,
        description: `من سورة ${juz.startSurahName} (الآية ${juz.startAyahNumber})`,
        startSurah: juz.startSurahNumber,
        startAyah: juz.startAyahNumber
      };
    } else if (planDuration === 15) {
      // 2 Juzs per day
      const juzIdx1 = Math.min((day - 1) * 2, 28);
      const juzIdx2 = Math.min(juzIdx1 + 1, 29);
      const juz1 = juzList[juzIdx1];
      const juz2 = juzList[juzIdx2];
      return {
        title: `${juz1.nameAr} و ${juz2.nameAr}`,
        description: `يبدأ من سورة ${juz1.startSurahName} (الآية ${juz1.startAyahNumber})`,
        startSurah: juz1.startSurahNumber,
        startAyah: juz1.startAyahNumber
      };
    } else if (planDuration === 10) {
      // 3 Juzs per day
      const juzIdx1 = Math.min((day - 1) * 3, 27);
      const juz1 = juzList[juzIdx1];
      const juzLast = juzList[Math.min(juzIdx1 + 2, 29)];
      return {
        title: `المنطقة: من ${juz1.nameAr} إلى ${juzLast.nameAr}`,
        description: `يبدأ من سورة ${juz1.startSurahName} (الآية ${juz1.startAyahNumber})`,
        startSurah: juz1.startSurahNumber,
        startAyah: juz1.startAyahNumber
      };
    } else {
      // 60 days: 1 Hizb per day
      const juzIdx = Math.floor((day - 1) / 2);
      const hizbSubIdx = (day - 1) % 2;
      const juz = juzList[Math.min(juzIdx, 29)];
      const hizb = juz.hizbs[hizbSubIdx];
      return {
        title: hizb.nameAr,
        description: `سورة ${hizb.startSurahName} (الآية ${hizb.startAyahNumber})`,
        startSurah: hizb.startSurahNumber,
        startAyah: hizb.startAyahNumber
      };
    }
  };

  // Convert English numbers to Arabic Numerals for native feeling
  const toArabicNumerals = (num: number | string): string => {
    return String(num).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
  };

  const totalQuranPages = 604;
  const completedDaysCount = activePlan ? activePlan.completedDays.length : 0;
  const planDuration = activePlan ? activePlan.durationDays : 30;

  // Calculate completed Quran pages based on read portions/days out of 604 pages
  const completedPages = activePlan 
    ? Math.min(604, Math.round((completedDaysCount / planDuration) * totalQuranPages))
    : 0;
  const remainingPages = Math.max(0, totalQuranPages - completedPages);
  const quranCompletionPercent = activePlan && planDuration > 0
    ? Number(((completedPages / totalQuranPages) * 100).toFixed(1))
    : 0;

  const progressPercent = activePlan 
    ? Math.round((activePlan.completedDays.length / activePlan.durationDays) * 100) 
    : 0;

  return (
    <div id="khatmah-screen-root" dir="rtl" className="w-full max-w-full px-3 sm:px-6 py-4 space-y-6 text-right font-sans">
      
      {/* Title & Banner Card */}
      <div id="khatmah-title-card" className={`flex items-center justify-between border-b pb-4 ${
        theme === "emerald-velvet"
          ? "border-[#c5a85c]/30"
          : theme === "navy-velvet"
            ? "border-slate-200"
            : theme === "gold-velvet"
              ? "border-[#c5a85c]/25"
              : isDark ? "border-slate-800" : "border-slate-100"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            theme === "emerald-velvet"
              ? "bg-[#c5a85c]/15 text-[#c5a85c]"
              : theme === "navy-velvet"
                ? "bg-[#3F63C6]/15 text-[#3F63C6]"
                : theme === "gold-velvet"
                  ? "bg-[#c5a85c]/15 text-[#c5a85c]"
                  : "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          }`}>
            <Award size={22} />
          </div>
          <div>
            <h2 className={`text-md font-bold ${
              theme === "emerald-velvet"
                ? "text-[#FAF8F5]"
                : theme === "navy-velvet"
                  ? "text-slate-900"
                  : theme === "gold-velvet"
                    ? "text-[#011c14]"
                    : isDark ? "text-slate-100" : "text-slate-900"
            }`}>منظّم ومتابع الختمات المباركة</h2>
          </div>
        </div>

        {activePlan && (
          <button
            type="button"
            onClick={handleDeletePlan}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xxs font-bold ${
              theme === "emerald-velvet"
                ? "text-rose-400 hover:bg-[#011a12]"
                : theme === "navy-velvet"
                  ? "text-rose-600 hover:bg-rose-50"
                  : theme === "gold-velvet"
                    ? "text-rose-600 hover:bg-[#FAF8F5]/80"
                    : "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            }`}
            title="حذف خطة الختمة ومسح التقدم"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">إنهاء الخطة</span>
          </button>
        )}
      </div>

      {!activePlan && !showSetup && (
        <div className={`p-8 rounded-2xl border text-center space-y-6 ${
          theme === "emerald-velvet"
            ? "bg-[#011a12] border-[#c5a85c]/25 text-[#FAF8F5] shadow-sm"
            : theme === "navy-velvet"
              ? "bg-white border-slate-200 text-slate-800 shadow-sm"
              : theme === "gold-velvet"
                ? "bg-[#FAF8F5] border-[#c5a85c]/25 text-[#011c14] shadow-sm"
                : isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-150 shadow-sm"
        }`}>
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            theme === "emerald-velvet"
              ? "bg-[#c5a85c]/15 text-[#c5a85c]"
              : theme === "navy-velvet"
                ? "bg-[#3F63C6]/10 text-[#3F63C6]"
                : theme === "gold-velvet"
                  ? "bg-[#c5a85c]/10 text-[#c5a85c]"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
          }`}>
            <Calendar size={32} />
          </div>
          <div className="space-y-2">
            <h3 className={`text-base font-bold ${
              theme === "emerald-velvet"
                ? "text-[#FAF8F5]"
                : theme === "navy-velvet"
                  ? "text-slate-900"
                  : theme === "gold-velvet"
                    ? "text-[#011c14]"
                    : isDark ? "text-slate-100" : "text-slate-800"
            }`}>لم تقم بإنشاء خطة ختمة نشطة بعد</h3>
          </div>

          <button
            type="button"
            onClick={() => {
              setPlanName("ورد الختمة المباركة");
              setDuration(30);
              setShowSetup(true);
            }}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 mx-auto cursor-pointer ${
              theme === "emerald-velvet"
                ? "bg-[#c5a85c] hover:bg-[#b09247] text-[#011c14]"
                : theme === "navy-velvet"
                  ? "bg-[#3F63C6] hover:bg-[#3252AB] text-white"
                  : theme === "gold-velvet"
                    ? "bg-[#c5a85c] hover:bg-[#b09247] text-[#011c14]"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            <Plus size={16} />
            <span>ابدأ خطة ختمة جديدة الآن</span>
          </button>
        </div>
      )}
       {/* Setup Form Drawer / Card */}
      {showSetup && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border ${
            theme === "emerald-velvet" ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5] shadow-sm" :
            theme === "gold-velvet" ? "bg-[#FAF8F5] border-[#c5a85c]/35 text-[#011c14] shadow-xs" :
            theme === "navy-velvet" ? "bg-white border-slate-200 text-slate-850 shadow-sm" :
            isDark ? "bg-slate-900 border-slate-800" : "bg-[#FCFBF7] border-emerald-100 shadow-md"
          }`}
        >
          <h3 className={`text-sm font-bold mb-4 pb-2 border-b ${
            theme === "emerald-velvet" ? "border-[#c5a85c]/30 text-[#FAF8F5]" :
            theme === "navy-velvet" ? "border-slate-200 text-[#3F63C6]" :
            theme === "gold-velvet" ? "border-[#c5a85c]/30 text-[#011c14] font-bold" :
            isDark ? "border-slate-800 text-slate-100" : "border-emerald-50 text-emerald-950"
          } flex items-center gap-1.5`}>
            <span>تخصيص وإعداد الختمة الجديدة</span>
          </h3>

          <form onSubmit={handleCreatePlan} className="space-y-5 text-right">
            {/* Plan Name */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-bold ${
                theme === "emerald-velvet" ? "text-[#FAF8F5]/90" :
                theme === "navy-velvet" ? "text-slate-700" :
                theme === "gold-velvet" ? "text-[#011c14]/90" :
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                اسم الختمة المباركة
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                required
                className={`w-full p-3 rounded-xl border text-xs font-bold transition-all text-right ${
                  theme === "emerald-velvet"
                    ? "bg-[#012519] border-[#c5a85c]/50 text-[#FAF8F5] focus:border-[#c5a85c]"
                    : theme === "navy-velvet"
                      ? "bg-white border-slate-300 text-slate-800 focus:border-[#3F63C6]"
                      : theme === "gold-velvet"
                        ? "bg-[#FAF8F5] border-[#c5a85c]/50 text-slate-800 focus:border-[#c5a85c]"
                        : isDark 
                          ? "bg-slate-950 border-slate-700 focus:border-emerald-600 text-slate-100" 
                          : "bg-white border-slate-300 focus:border-emerald-500 text-slate-800"
                }`}
                placeholder="أدخل اسماً مخصصاً (مثال: ختمة التلاوة والتدبر)"
              />
            </div>

            {/* Plan Duration Options */}
            <div className="space-y-2">
              <label className={`block text-xs font-bold ${
                theme === "emerald-velvet" ? "text-[#FAF8F5]" :
                theme === "navy-velvet" ? "text-slate-700" :
                theme === "gold-velvet" ? "text-[#011c14]" :
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                المدة الزمنية المفضلة (الورد اليومي)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 3, label: "٣ أيام", desc: "١٠ أجزاء يومياً" },
                  { days: 7, label: "٧ أيام", desc: "٤-٥ أجزاء يومياً" },
                  { days: 10, label: "١٠ أيام", desc: "٣ أجزاء يومياً" },
                  { days: 15, label: "١٥ يوماً", desc: "جزآن يومياً" },
                  { days: 30, label: "٣٠ يوماً", desc: "جزء واحد يومياً" },
                  { days: 60, label: "٦٠ يوماً", desc: "حزب واحد يومياً" }
                ].map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setDuration(opt.days as 3 | 7 | 10 | 15 | 30 | 60)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-center items-center gap-1 ${
                      duration === opt.days
                        ? theme === "emerald-velvet"
                          ? "bg-[#c5a85c]/20 border-2 border-[#c5a85c] text-[#c5a85c] font-bold shadow-xs"
                          : theme === "navy-velvet"
                            ? "bg-[#3F63C6]/15 border-2 border-[#3F63C6] text-[#3F63C6] font-bold shadow-xs"
                            : theme === "gold-velvet"
                              ? "bg-[#c5a85c]/20 border-2 border-[#c5a85c] text-[#011c14] font-bold shadow-xs"
                              : isDark ? "bg-emerald-950/40 border-2 border-emerald-500 text-emerald-300 font-bold shadow-xs" : "bg-emerald-50 border-2 border-emerald-600 text-emerald-900 font-bold shadow-xs"
                        : theme === "emerald-velvet"
                          ? "bg-[#012519] border border-[#c5a85c]/40 text-[#FAF8F5]/90 hover:bg-[#012c1e] hover:border-[#c5a85c]/70"
                          : theme === "navy-velvet"
                            ? "bg-slate-50 border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400"
                            : theme === "gold-velvet"
                              ? "bg-[#FAF8F5] border border-[#c5a85c]/40 text-slate-800 hover:bg-[#c5a85c]/10 hover:border-[#c5a85c]/70"
                              : isDark ? "bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[9px] opacity-75 font-semibold">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Start Date */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-bold ${
                theme === "emerald-velvet" ? "text-[#FAF8F5]" :
                theme === "navy-velvet" ? "text-slate-700" :
                theme === "gold-velvet" ? "text-[#011c14]" :
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                تاريخ بداية الخطة
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className={`w-full p-3 rounded-xl border text-xs font-bold transition-all text-right ${
                  theme === "emerald-velvet"
                    ? "bg-[#012519] border-[#c5a85c]/50 text-[#FAF8F5] focus:border-[#c5a85c]"
                    : theme === "navy-velvet"
                      ? "bg-white border-slate-300 text-slate-800 focus:border-[#3F63C6]"
                      : theme === "gold-velvet"
                        ? "bg-[#FAF8F5] border-[#c5a85c]/50 text-slate-800 focus:border-[#c5a85c]"
                        : isDark 
                          ? "bg-slate-950 border-slate-700 focus:border-emerald-600 text-slate-100" 
                          : "bg-white border-slate-300 focus:border-emerald-500 text-slate-800"
                }`}
              />
            </div>

            {/* Actions Buttons */}
            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSetup(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  theme === "emerald-velvet"
                    ? "bg-[#012519] hover:bg-[#012c1e] text-[#FAF8F5]"
                    : theme === "navy-velvet"
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      : theme === "gold-velvet"
                        ? "bg-slate-100/50 hover:bg-slate-200 text-slate-700"
                        : isDark ? "bg-slate-800 hover:bg-slate-750 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  theme === "emerald-velvet"
                    ? "bg-[#c5a85c] hover:bg-[#b09247] text-[#011c14]"
                    : theme === "navy-velvet"
                      ? "bg-[#3F63C6] hover:bg-[#3252AB] text-white"
                      : theme === "gold-velvet"
                        ? "bg-[#c5a85c] hover:bg-[#b09247] text-[#011c14]"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                إنشاء وبدء الختمة
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Active Khatmah Progress Dashboard */}
      {activePlan && (
        <div className="space-y-6">
          
          {/* Main Quran Completion Progress Bar (شريط تقدم ختم القرآن الكريم بناءً على الصفحات المقروءة) */}
          <div className={`p-5 rounded-2xl border transition-all ${
            theme === "emerald-velvet" ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5] shadow-sm" :
            theme === "gold-velvet" ? "bg-[#FAF8F5] border-[#c5a85c]/35 text-[#011c14] shadow-xs" :
            theme === "navy-velvet" ? "bg-white border-slate-200 text-slate-850 shadow-sm" :
            isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-100 shadow-xs"
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  theme === "emerald-velvet" ? "bg-[#c5a85c]/20 text-[#c5a85c]" :
                  theme === "navy-velvet" ? "bg-[#3F63C6]/15 text-[#3F63C6]" :
                  theme === "gold-velvet" ? "bg-[#c5a85c]/20 text-[#c5a85c]" :
                  "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                }`}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${
                    theme === "emerald-velvet" ? "text-[#FAF8F5]" :
                    theme === "navy-velvet" ? "text-slate-900" :
                    theme === "gold-velvet" ? "text-[#011c14]" :
                    isDark ? "text-slate-100" : "text-slate-800"
                  }`}>
                    شريط تقدم ختم القرآن الكريم
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    النسبة المئوية المنجزة من المصحف بناءً على الصفحات المقروءة ({toArabicNumerals(completedPages)} من ٦٠٤ صفحة)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className={`text-2xl font-bold font-mono tracking-tight ${
                  theme === "emerald-velvet" ? "text-[#c5a85c]" :
                  theme === "navy-velvet" ? "text-[#3F63C6]" :
                  theme === "gold-velvet" ? "text-[#c5a85c]" :
                  "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {toArabicNumerals(quranCompletionPercent)}%
                </span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                  completedPages === 604
                    ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/40"
                    : theme === "emerald-velvet" ? "bg-[#c5a85c]/15 text-[#c5a85c]" :
                      theme === "navy-velvet" ? "bg-[#3F63C6]/10 text-[#3F63C6]" :
                      theme === "gold-velvet" ? "bg-[#c5a85c]/15 text-[#011c14]" :
                      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}>
                  {completedPages === 604 ? "تم ختم المصحف 🎉" : `متبقي ${toArabicNumerals(remainingPages)} صفحة`}
                </span>
              </div>
            </div>

            {/* Visual High-Fidelity Multi-segment Progress Bar */}
            <div className="space-y-2 my-3">
              <div className={`relative h-4 w-full rounded-full overflow-hidden p-0.5 border ${
                theme === "emerald-velvet" ? "bg-[#012519] border-[#c5a85c]/25" :
                theme === "navy-velvet" ? "bg-slate-100 border-slate-200" :
                theme === "gold-velvet" ? "bg-[#c5a85c]/10 border-[#c5a85c]/25" :
                "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              }`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, (completedPages / 604) * 100))}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full transition-all relative overflow-hidden ${
                    theme === "emerald-velvet" ? "bg-gradient-to-l from-[#c5a85c] to-[#e6cf8b]" :
                    theme === "navy-velvet" ? "bg-gradient-to-l from-[#3F63C6] to-[#60a5fa]" :
                    theme === "gold-velvet" ? "bg-gradient-to-l from-[#c5a85c] to-[#d4af37]" :
                    "bg-gradient-to-l from-emerald-500 via-teal-500 to-emerald-600"
                  }`}
                >
                  <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
                </motion.div>
              </div>

              {/* Progress Milestones Markers */}
              <div className="relative flex justify-between text-[9px] font-bold text-slate-400 px-1 pt-0.5">
                <span className={completedPages >= 1 ? (theme === "emerald-velvet" ? "text-[#c5a85c]" : "text-emerald-600 font-extrabold") : ""}>البداية (ص١)</span>
                <span className={completedPages >= 151 ? (theme === "emerald-velvet" ? "text-[#c5a85c]" : "text-emerald-600 font-extrabold") : ""}>الربع (ص١٥١)</span>
                <span className={completedPages >= 302 ? (theme === "emerald-velvet" ? "text-[#c5a85c]" : "text-emerald-600 font-extrabold") : ""}>النصف (ص٣٠٢)</span>
                <span className={completedPages >= 453 ? (theme === "emerald-velvet" ? "text-[#c5a85c]" : "text-emerald-600 font-extrabold") : ""}>٣/٤ (ص٤٥٣)</span>
                <span className={completedPages >= 604 ? (theme === "emerald-velvet" ? "text-[#c5a85c]" : "text-emerald-600 font-extrabold") : ""}>الختم (ص٦٠٤)</span>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className={`p-2 rounded-xl text-center ${
                theme === "emerald-velvet" ? "bg-[#012519]/70" :
                theme === "navy-velvet" ? "bg-slate-50" :
                theme === "gold-velvet" ? "bg-[#c5a85c]/10" :
                "bg-slate-50 dark:bg-slate-800/50"
              }`}>
                <span className="text-[10px] text-slate-400 block font-semibold">الصفحات المقروءة</span>
                <span className="text-xs font-bold font-mono">{toArabicNumerals(completedPages)} ص</span>
              </div>
              <div className={`p-2 rounded-xl text-center ${
                theme === "emerald-velvet" ? "bg-[#012519]/70" :
                theme === "navy-velvet" ? "bg-slate-50" :
                theme === "gold-velvet" ? "bg-[#c5a85c]/10" :
                "bg-slate-50 dark:bg-slate-800/50"
              }`}>
                <span className="text-[10px] text-slate-400 block font-semibold">المتبقي للختم</span>
                <span className="text-xs font-bold font-mono">{toArabicNumerals(remainingPages)} ص</span>
              </div>
              <div className={`p-2 rounded-xl text-center ${
                theme === "emerald-velvet" ? "bg-[#012519]/70" :
                theme === "navy-velvet" ? "bg-slate-50" :
                theme === "gold-velvet" ? "bg-[#c5a85c]/10" :
                "bg-slate-50 dark:bg-slate-800/50"
              }`}>
                <span className="text-[10px] text-slate-400 block font-semibold">الأجزاء المقروءة</span>
                <span className="text-xs font-bold font-mono">{toArabicNumerals((completedPages / 20.133).toFixed(1))} / ٣٠</span>
              </div>
              <div className={`p-2 rounded-xl text-center ${
                theme === "emerald-velvet" ? "bg-[#012519]/70" :
                theme === "navy-velvet" ? "bg-slate-50" :
                theme === "gold-velvet" ? "bg-[#c5a85c]/10" :
                "bg-slate-50 dark:bg-slate-800/50"
              }`}>
                <span className="text-[10px] text-slate-400 block font-semibold">الأيام المكتملة</span>
                <span className="text-xs font-bold font-mono">{toArabicNumerals(completedDaysCount)} / {toArabicNumerals(planDuration)} ي</span>
              </div>
            </div>
          </div>

          {/* Main Bento Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Visual Circular/Linear Progress Card */}
            <div className={`p-5 rounded-2xl border md:col-span-2 flex flex-col justify-between space-y-4 ${
              theme === "emerald-velvet" ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5] shadow-sm" :
              theme === "gold-velvet" ? "bg-[#FAF8F5] border-[#c5a85c]/35 text-[#011c14] shadow-xs" :
              theme === "navy-velvet" ? "bg-white border-slate-200 text-slate-850 shadow-sm" :
              isDark ? "bg-slate-900 border-slate-850" : "bg-white border-slate-100 shadow-xs"
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                    theme === "emerald-velvet" ? "bg-[#c5a85c]/15 text-[#c5a85c] border border-[#c5a85c]/30" :
                    theme === "navy-velvet" ? "bg-[#3F63C6]/10 text-[#3F63C6]" :
                    theme === "gold-velvet" ? "bg-[#c5a85c]/15 text-[#011c14]" : 
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}>
                    الخطة نشطة
                  </span>
                  <h3 className={`text-sm font-bold mt-2 ${
                    theme === "emerald-velvet" ? "text-[#FAF8F5]" :
                    theme === "navy-velvet" ? "text-slate-900" :
                    theme === "gold-velvet" ? "text-[#011c14]" :
                    isDark ? "text-slate-100" : "text-slate-800"
                  }`}>{activePlan.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    بدأت في: {new Date(activePlan.startDate).toLocaleDateString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                
                <div className="text-left" dir="ltr">
                  <span className={`text-xl font-bold font-mono ${theme === "emerald-velvet" ? "text-[#c5a85c]" : theme === "navy-velvet" ? "text-[#3F63C6]" : theme === "gold-velvet" ? "text-[#c5a85c]" : "text-emerald-600 dark:text-emerald-400"}`}>{toArabicNumerals(progressPercent)}%</span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">معدل الإنجاز</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className={`h-2.5 w-full rounded-full overflow-hidden ${
                  theme === "emerald-velvet" ? "bg-[#012519]" :
                  theme === "navy-velvet" ? "bg-slate-100" :
                  theme === "gold-velvet" ? "bg-[#c5a85c]/10" :
                  "bg-slate-100 dark:bg-slate-800"
                }`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className={`h-full ${theme === "emerald-velvet" ? "bg-[#c5a85c]" : theme === "navy-velvet" ? "bg-[#3F63C6]" : theme === "gold-velvet" ? "bg-[#c5a85c]" : "bg-gradient-to-r from-emerald-500 to-emerald-600"}`}
                  />
                </div>
                <div className="flex justify-between text-xxs text-slate-400 font-bold">
                  <span>أتممت {toArabicNumerals(activePlan.completedDays.length)} من {toArabicNumerals(activePlan.durationDays)} يوماً</span>
                  <span>المتبقي {toArabicNumerals(activePlan.durationDays - activePlan.completedDays.length)} يوماً</span>
                </div>
              </div>

              {/* Quick Action Button to log next day */}
              {activePlan.completedDays.length < activePlan.durationDays ? (
                <button
                  type="button"
                  onClick={handleLogNextDay}
                  className={`w-full py-2.5 px-4 rounded-xl text-xxs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-1 ${
                    theme === "emerald-velvet"
                      ? "bg-[#c5a85c] hover:bg-[#b09247] text-[#011c14]"
                      : theme === "navy-velvet"
                        ? "bg-[#3F63C6] hover:bg-[#3252AB] text-white"
                        : theme === "gold-velvet"
                          ? "bg-[#c5a85c] hover:bg-[#b09247] text-[#011c14]"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  <CheckCircle size={14} />
                  <span>تسجيل إنجاز اليوم التالي والتقدم</span>
                </button>
              ) : (
                <div className={`p-2.5 rounded-xl text-center text-xxs font-bold border ${
                  theme === "emerald-velvet"
                    ? "bg-[#c5a85c]/10 border-[#c5a85c]/35 text-[#c5a85c]"
                    : theme === "navy-velvet"
                      ? "bg-[#3F63C6]/10 border-[#3F63C6]/25 text-[#3F63C6]"
                      : theme === "gold-velvet"
                        ? "bg-[#c5a85c]/10 border-[#c5a85c]/25 text-[#011c14]"
                        : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30"
                }`}>
                  🎉 مبارك! لقد أتممت الختمة بنجاح، تقبل الله منك هذا العمل الصالح.
                </div>
              )}
            </div>

            {/* Daily Target Info Card */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
              theme === "emerald-velvet" ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5] shadow-sm" :
              theme === "gold-velvet" ? "bg-[#FAF8F5] border-[#c5a85c]/35 text-[#011c14] shadow-xs" :
              theme === "navy-velvet" ? "bg-white border-slate-200 text-slate-850 shadow-sm" :
              isDark ? "bg-slate-900 border-slate-850" : "bg-[#f4fdf8] border-emerald-100/80 shadow-[0_12px_40px_rgba(15,76,58,0.04)]"
            }`}>
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">الورد اليومي المطلوب</span>
                <h4 className={`text-md font-bold ${
                  theme === "emerald-velvet" ? "text-[#c5a85c]" :
                  theme === "navy-velvet" ? "text-[#3F63C6]" :
                  theme === "gold-velvet" ? "text-emerald-800 font-bold" : 
                  "text-emerald-800 dark:text-emerald-400"
                }`}>
                  {activePlan.durationDays === 3 && "١٠ أجزاء كاملة"}
                  {activePlan.durationDays === 7 && "٤ إلى ٥ أجزاء"}
                  {activePlan.durationDays === 10 && "٣ أجزاء كاملة"}
                  {activePlan.durationDays === 15 && "جزآن كاملان"}
                  {activePlan.durationDays === 30 && "جزء واحد كامل"}
                  {activePlan.durationDays === 60 && "حزب واحد كامل (نصف جزء)"}
                </h4>
                <p className={`text-xxs leading-relaxed ${
                  theme === "emerald-velvet" ? "text-[#FAF8F5]/85" :
                  theme === "navy-velvet" ? "text-slate-500" :
                  theme === "gold-velvet" ? "text-[#011c14]/80" : 
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}>
                  {activePlan.durationDays === 3 && "خطة فائقة السرعة لختم المصحف كاملاً في ثلاثة أيام فقط بمعدل ١٠ أجزاء يومياً."}
                  {activePlan.durationDays === 7 && "خطة أسبوعية لختم المصحف كاملاً في سبعة أيام بمعدل ٤ إلى ٥ أجزاء يومياً."}
                  {activePlan.durationDays === 30 && "قراءة جزء واحد يومياً يتيح لك ختم القرآن كاملاً في غضون شهر كامل بشكل ميسر."}
                  {activePlan.durationDays === 15 && "مضاعفة الورد لجزأين يومياً للختم السريع خلال أسبوعين مباركين."}
                  {activePlan.durationDays === 10 && "خطة سريعة ومكثفة لختم المصحف بمعدل ثلاثة أجزاء في اليوم الواحد."}
                  {activePlan.durationDays === 60 && "خطة مخففة ومستمرة بمعدل حزب واحد في اليوم لختم القرآن كل شهرين."}
                </p>
              </div>

              <div className={`pt-3 border-t border-dashed flex justify-between items-center text-xxs font-bold ${
                theme === "emerald-velvet" ? "border-[#c5a85c]/20" :
                theme === "navy-velvet" ? "border-slate-100" :
                theme === "gold-velvet" ? "border-[#c5a85c]/15" :
                "border-slate-200 dark:border-slate-800"
              }`}>
                <span className="text-slate-400">مدة الخطة:</span>
                <span className={
                  theme === "emerald-velvet" ? "text-[#c5a85c] font-bold" :
                  theme === "navy-velvet" ? "text-[#3F63C6]" :
                  theme === "gold-velvet" ? "text-emerald-800 font-bold" : 
                  isDark ? "text-emerald-300" : "text-emerald-850"
                }>{toArabicNumerals(activePlan.durationDays)} يوماً</span>
              </div>
            </div>
          </div>

          {/* Detailed Days Timeline Table */}
          <div className="space-y-3">
            <h3 className={`text-xs font-bold flex items-center justify-between ${
              theme === "emerald-velvet" ? "text-[#FAF8F5]" :
              theme === "navy-velvet" ? "text-slate-800" :
              theme === "gold-velvet" ? "text-[#011c14]" :
              isDark ? "text-slate-200" : "text-slate-700"
            }`}>
              <span>جدول الأيام والأوراد المحددة</span>
              <span className="text-[10px] font-semibold text-slate-400 font-mono">الخطة الزمنية التفصيلية</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {Array.from({ length: activePlan.durationDays }).map((_, idx) => {
                const dayNum = idx + 1;
                const isCompleted = activePlan.completedDays.includes(dayNum);
                const dayPortion = getPortionForDay(dayNum, activePlan.durationDays);

                return (
                  <div
                    key={dayNum}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isCompleted
                        ? theme === "emerald-velvet"
                          ? "bg-[#012519]/40 border-[#c5a85c]/10 opacity-80"
                          : theme === "navy-velvet"
                            ? "bg-[#3F63C6]/5 border-[#3F63C6]/15 opacity-80"
                            : theme === "gold-velvet"
                              ? "bg-[#c5a85c]/5 border-[#c5a85c]/15 opacity-80"
                              : isDark ? "bg-emerald-955/15 border-emerald-900/40 opacity-75" : "bg-emerald-50/20 border-emerald-100 opacity-90"
                        : theme === "emerald-velvet"
                          ? "bg-[#011a12] border-[#c5a85c]/25 hover:border-[#c5a85c]/40 hover:shadow-xs"
                          : theme === "navy-velvet"
                            ? "bg-white border-slate-200 hover:border-[#3F63C6]/30 hover:shadow-xs"
                            : theme === "gold-velvet"
                              ? "bg-[#FAF8F5] border-[#c5a85c]/15 hover:border-[#c5a85c]/25 hover:shadow-xs"
                              : isDark ? "bg-slate-900 border-slate-850 hover:border-slate-800" : "bg-white border-slate-100 hover:shadow-xs"
                    }`}
                  >
                    {/* Toggle Completion Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleDayCompletion(dayNum)}
                      className={`h-6 w-6 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                        isCompleted
                          ? theme === "emerald-velvet"
                            ? "bg-[#c5a85c] border-[#c5a85c] text-[#011c14]"
                            : theme === "navy-velvet"
                              ? "bg-[#3F63C6] border-[#3F63C6] text-white"
                              : theme === "gold-velvet"
                                ? "bg-[#c5a85c] border-[#c5a85c] text-[#011c14]"
                                : "bg-emerald-600 border-emerald-600 text-white"
                          : theme === "emerald-velvet"
                            ? "border-[#c5a85c]/20 bg-[#012519] hover:border-[#c5a85c]"
                            : theme === "navy-velvet"
                              ? "border-slate-300 bg-slate-50 hover:border-[#3F63C6]"
                              : theme === "gold-velvet"
                                ? "border-[#c5a85c]/20 bg-[#FAF8F5] hover:border-[#c5a85c]"
                                : isDark ? "border-slate-700 bg-slate-950 hover:border-emerald-800" : "border-slate-200 bg-slate-50 hover:border-emerald-300"
                      }`}
                      title={isCompleted ? "تحديد كغير منجز" : "تحديد كمنجز"}
                    >
                      {isCompleted && <Check size={14} className="stroke-[3px]" />}
                    </button>

                    {/* Day description info */}
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-start gap-1.5">
                        <span className={`text-xxs font-bold px-2 py-0.5 rounded-md ${
                          isCompleted
                            ? theme === "emerald-velvet"
                              ? "bg-[#c5a85c]/15 text-[#c5a85c]"
                              : theme === "navy-velvet"
                                ? "bg-[#3F63C6]/10 text-[#3F63C6]"
                                : theme === "gold-velvet"
                                  ? "bg-[#c5a85c]/10 text-emerald-800 font-bold"
                                  : "bg-emerald-150 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : theme === "emerald-velvet"
                              ? "bg-[#012519] text-[#FAF8F5]/70"
                              : theme === "navy-velvet"
                                ? "bg-slate-100 text-slate-500"
                                : theme === "gold-velvet"
                                  ? "bg-slate-200/65 text-slate-600"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          اليوم {toArabicNumerals(dayNum)}
                        </span>
                        <h4 className={`text-xs font-bold ${
                          isCompleted 
                            ? "line-through text-slate-400" 
                            : theme === "emerald-velvet"
                              ? "text-[#FAF8F5]"
                              : theme === "navy-velvet"
                                ? "text-slate-800"
                                : theme === "gold-velvet"
                                  ? "text-[#011c14]"
                                  : isDark ? "text-slate-200" : "text-slate-800"
                        }`}>
                          ورد {dayPortion.title}
                        </h4>
                      </div>
                    </div>

                    {/* Quick Link to directly open the portion in the Reader! */}
                    <button
                      type="button"
                      onClick={() => onSelectSurah(dayPortion.startSurah, dayPortion.startAyah)}
                      className={`p-2 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black ${
                        isCompleted
                          ? "bg-slate-100 border-slate-350 hover:bg-slate-200 text-slate-700"
                          : theme === "emerald-velvet"
                            ? "bg-[#c5a85c]/15 border-[#c5a85c] text-[#c5a85c] hover:bg-[#c5a85c]/25"
                            : theme === "navy-velvet"
                              ? "bg-[#3F63C6]/10 border-[#3F63C6] text-[#3F63C6] hover:bg-[#3F63C6]/20"
                            : theme === "gold-velvet"
                              ? "bg-[#c5a85c]/15 border-[#c5a85c] text-slate-800 hover:bg-[#c5a85c]/25"
                              : "bg-emerald-100 border-emerald-600 hover:bg-emerald-200 text-black"
                      }`}
                      title="فتح هذا الورد في المصحف للقراءة وتدبر الآيات"
                    >
                      <BookOpen size={12} className={
                        theme === "emerald-velvet"
                          ? "text-[#c5a85c]"
                          : theme === "navy-velvet"
                            ? "text-[#3F63C6]"
                            : theme === "gold-velvet"
                              ? "text-[#011c14]"
                              : "text-black"
                      } />
                      <span className="hidden sm:inline">اقرأ الورد</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Plan */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-transparent backdrop-blur-xs"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-sm rounded-2xl p-5 shadow-xl border text-right font-sans z-10 ${
                theme === "emerald-velvet"
                  ? "bg-[#011a12] border-[#c5a85c]/35 text-[#FAF8F5]"
                  : theme === "navy-velvet"
                    ? "bg-white border-slate-200 text-slate-850"
                    : theme === "gold-velvet"
                      ? "bg-[#FAF8F5] border-[#c5a85c]/35 text-[#011c14]"
                      : isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-150 text-slate-900"
              }`}
            >
              <div className={`flex items-center gap-3 mb-4 border-b pb-3 ${
                theme === "emerald-velvet" ? "border-[#c5a85c]/15" :
                theme === "navy-velvet" ? "border-slate-100" :
                theme === "gold-velvet" ? "border-[#c5a85c]/15" :
                "border-slate-100 dark:border-slate-800"
              }`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  theme === "emerald-velvet"
                    ? "bg-[#c5a85c]/15 text-[#c5a85c]"
                    : theme === "navy-velvet"
                      ? "bg-[#3F63C6]/15 text-[#3F63C6]"
                      : theme === "gold-velvet"
                        ? "bg-[#c5a85c]/15 text-[#c5a85c]"
                        : "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}>
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className={`text-sm font-black ${
                    theme === "emerald-velvet" ? "text-[#c5a85c]" :
                    theme === "navy-velvet" ? "text-slate-800" :
                    theme === "gold-velvet" ? "text-[#011c14]" :
                    "text-emerald-700 dark:text-emerald-350"
                  }`}>تأكيد حذف الختمة</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">إجراء نهائي لا يمكن التراجع عنه</p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed mb-5 ${
                theme === "emerald-velvet" ? "text-[#FAF8F5]/85" :
                theme === "navy-velvet" ? "text-slate-600" :
                theme === "gold-velvet" ? "text-[#011c14]/85" :
                isDark ? "text-slate-300" : "text-slate-650"
              }`}>
                هل أنت متأكد من رغبتك في حذف خطة الختمة الحالية ومسح جميع تفاصيل وتاريخ التقدم المحفوظ؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-colors ${
                    theme === "emerald-velvet"
                      ? "bg-[#012519] border-[#c5a85c]/20 text-[#FAF8F5] hover:bg-[#012c1e]"
                      : theme === "navy-velvet"
                        ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                        : theme === "gold-velvet"
                          ? "bg-slate-100/50 border-[#c5a85c]/20 hover:bg-slate-100 text-slate-700"
                          : isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    savePlan(null);
                    setShowDeleteConfirm(false);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl text-white cursor-pointer transition-colors flex items-center gap-1.5 ${
                    theme === "emerald-velvet"
                      ? "bg-rose-650 hover:bg-rose-700 text-white"
                      : theme === "navy-velvet"
                        ? "bg-[#3F63C6] hover:bg-[#3252AB]"
                        : "bg-rose-600 hover:bg-rose-700"
                  }`}
                  title="تأكيد الحذف"
                >
                  <Trash2 size={14} />
                  <span>تأكيد الحذف</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
