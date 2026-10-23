import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { toPng, toBlob } from "html-to-image";
import {
  Sparkles,
  X,
  Copy,
  Share2,
  Download,
  Check,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  RotateCcw,
  Palette,
  Square,
  Move,
  FileText,
  SlidersHorizontal,
  Layers,
  Image as ImageIcon,
  SunMedium,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  Bookmark,
  Ban,
  Lock,
  Unlock,
  ArrowLeftRight,
  Star,
  Trash2,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Maximize2,
  RotateCw,
} from "lucide-react";
import { surahsList } from "../data/surahList";
import { quranSvgPageMetadata, getSurahStartPage } from "../data/quranSvgPageMetadata";
import { SurahSelectModal } from "./SurahSelectModal";
import { SurahHeaderFrame } from "./SurahHeaderFrame";
import { getAuthenticFrameSvgInner } from "../utils/mushafFrameSvgData";
import { fetchAlquranCloud } from "../utils/quranApi";
import { initOfflineFonts } from "../utils/fontOfflineCache";
import { SURAH_HEADER_POSITIONS } from "../utils/surahHeaderMap";
import {
  Qcf4Word,
  Qcf4Line,
  Qcf4PageData,
  fetchQcf4VerseWords,
  fetchQcf4Page,
  loadQcf4Font,
  ensureQbsmlLoaded,
  isQbsmlLoaded,
  getSurahHeaderGlyph,
  getBismillahGlyph,
} from "../utils/qcf4Utils";

import textureWood from "../assets/images/texture_wood_warm_1787560837497.jpg";
import textureClay from "../assets/images/texture_clay_natural_1787565145056.jpg";
import textureLeather from "../assets/images/texture_leather_rich_1787565160287.jpg";
import textureGoldFoil from "../assets/images/smooth_gold_texture_1787569064133.jpg";
import bgDesertFlower from "../assets/images/bg_desert_flower_1787560894280.jpg";
import textureMarble from "../assets/images/texture_marble_1787560922634.jpg";
import textureParchment from "../assets/images/texture_parchment_1787560941429.jpg";
import textureCosmicSky from "../assets/images/texture_cosmic_sky_1787643332494.jpg";
import texturePurpleWatercolor from "../assets/images/texture_purple_watercolor_1787643344233.jpg";
import { AlTibyanCalligraphy } from "./AlTibyanCalligraphy";

export interface ShareAyahData {
  mode?: "single" | "range" | "page";
  ayah: {
    number?: number;
    numberInSurah: number;
    text: string;
    page?: number;
    juz?: number;
  };
  ayahTo?: number;
  pageNumber?: number;
  surahName: string;
  surahNumber: number;
  isNavDefaultOpen?: boolean;
}

interface ShareAyahModalProps {
  shareData: ShareAyahData | null;
  onClose: () => void;
  theme?: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet" | string;
  isDark?: boolean;
}

const toArabicNumerals = (num: number): string => {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((d) => arabicDigits[parseInt(d, 10)] ?? d)
    .join("");
};

// Aspect Ratios
export type AspectRatioType = "auto" | "9:16" | "1:1" | "16:9" | "custom";

interface AspectRatioOption {
  id: AspectRatioType;
  label: string;
  subLabel: string;
  ratioClass: string;
  width: number;
  height: number;
}

const aspectRatioOptions: AspectRatioOption[] = [
  { id: "auto", label: "تلقائي (متجاوب)", subLabel: "حسب طول الآيات", ratioClass: "", width: 1080, height: 1350 },
  { id: "9:16", label: "طول (9:16)", subLabel: "ستوري", ratioClass: "aspect-[9/16]", width: 1080, height: 1920 },
  { id: "1:1", label: "مربع (1:1)", subLabel: "مربع", ratioClass: "aspect-square", width: 1080, height: 1080 },
  { id: "16:9", label: "عريض (16:9)", subLabel: "عريض", ratioClass: "aspect-[16/9]", width: 1920, height: 1080 },
  { id: "custom", label: "قياس مخصص", subLabel: "أبعاد حرة", ratioClass: "", width: 1080, height: 1350 },
];

// Gradients Palette
export interface GradientPreset {
  id: string;
  name: string;
  color1: string;
  color2: string;
  textDefault: string;
}

export const gradientPresets: GradientPreset[] = [
  { id: "magenta-dawn", name: "وردي ماجنتا", color1: "#8B1D48", color2: "#F56E8A", textDefault: "#FFFFFF" },
  { id: "emerald-velvet", name: "زمردي مخملي", color1: "#012519", color2: "#0a4c33", textDefault: "#FAF8F5" },
  { id: "navy-deep", name: "كحلي ملكي", color1: "#0b1528", color2: "#1e2e4f", textDefault: "#FFFFFF" },
  { id: "gold-velvet", name: "ذهبي ملكي", color1: "#1C1917", color2: "#685023", textDefault: "#FFE082" },
  { id: "purple-sunset", name: "غروب الأرجوان", color1: "#2e0854", color2: "#6d156c", textDefault: "#FAF8F5" },
  { id: "ethereal-light", name: "أثيري ناصع", color1: "#FCFBF7", color2: "#E8E2D2", textDefault: "#012519" },
  { id: "soft-sky", name: "سماوي لطيف", color1: "#0369a1", color2: "#38bdf8", textDefault: "#FFFFFF" },
  { id: "teal-ocean", name: "فيروزي هادئ", color1: "#044e54", color2: "#14b8a6", textDefault: "#FFFFFF" },
  { id: "amber-warm", name: "عنبري دافئ", color1: "#78350f", color2: "#d97706", textDefault: "#FFFFFF" },
  { id: "nebula-indigo", name: "سديم نيلي", color1: "#1e1b4b", color2: "#4338ca", textDefault: "#FFFFFF" },
];

// Solid Colors Palette
export const solidColorPresets = [
  { id: "mushaf-cream", name: "ورق المصحف", value: "#FCFAF7", textDefault: "#1C1917" },
  { id: "soft-rose", name: "وردي ناعم", value: "#F8C8DC", textDefault: "#4A0E2E" },
  { id: "soft-mint", name: "نعناعي هادئ", value: "#D1E7DD", textDefault: "#0F5132" },
  { id: "cream-light", name: "كريمي دافئ", value: "#FFF9E6", textDefault: "#1C1917" },
  { id: "sky-pastel", name: "سماوي فاتح", value: "#E0F2FE", textDefault: "#0369A1" },
  { id: "emerald-dark", name: "زمردي داكن", value: "#012519", textDefault: "#FAF8F5" },
  { id: "navy-dark", name: "كحلي داكن", value: "#0B1528", textDefault: "#FFFFFF" },
  { id: "velvet-black", name: "أسود مخملي", value: "#1C1917", textDefault: "#FAF8F5" },
  { id: "gold-amber", name: "ذهبي أندلسي", value: "#C5A85C", textDefault: "#1C1917" },
  { id: "warm-beige", name: "بيج عتيق", value: "#FAF2DF", textDefault: "#1C1917" },
  { id: "coral-pink", name: "مرجاني دافئ", value: "#FB7185", textDefault: "#FFFFFF" },
  { id: "pure-white", name: "أبيض ناصع", value: "#FFFFFF", textDefault: "#111827" },
  { id: "slate-dark", name: "رمادي داكن", value: "#0F172A", textDefault: "#FFFFFF" },
];

// Helper function to create clean, URL-safe SVG Data URLs for CSS and Canvas with custom stroke color
export function createSvgDataUrl(svgString: string, strokeColor: string = "#ffffff"): string {
  let clean = svgString.trim();
  if (strokeColor && strokeColor.toLowerCase() !== "#ffffff") {
    clean = clean.replace(/stroke="#ffffff"/gi, `stroke="${strokeColor}"`)
                 .replace(/stroke='#ffffff'/gi, `stroke="${strokeColor}"`)
                 .replace(/stroke="#fff"/gi, `stroke="${strokeColor}"`)
                 .replace(/stroke='#fff'/gi, `stroke="${strokeColor}"`);
  }
  if (!clean.includes('xmlns="http://www.w3.org/2000/svg"')) {
    clean = clean.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(clean)}`;
}

// Patterns & Textures
export interface PatternPreset {
  id: string;
  name: string;
  category: "all" | "islamic" | "nature";
  rawSvg?: string;
  svgPattern: string; // SVG data URL or CSS background pattern
  desc: string;
}

export const patternPresets: PatternPreset[] = [
  {
    id: "islamic-concentric-diamond",
    name: "معينات متداخلة",
    category: "islamic",
    desc: "معينات متداخلة بزوايا 45°",
    rawSvg: `<svg width="60" height="60" viewBox="0 0 60 60"><g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M30 0 L60 30 L30 60 L0 30 Z"/><path d="M30 6 L54 30 L30 54 L6 30 Z"/><path d="M30 12 L48 30 L30 48 L12 30 Z"/><path d="M30 18 L42 30 L30 42 L18 30 Z"/><path d="M30 24 L36 30 L30 36 L24 30 Z"/><path d="M0 0 L30 30 L60 0"/><path d="M0 60 L30 30 L60 60"/><path d="M0 6 L24 30 L0 54"/><path d="M60 6 L36 30 L60 54"/><path d="M0 12 L18 30 L0 48"/><path d="M60 12 L42 30 L60 48"/><path d="M0 18 L12 30 L0 42"/><path d="M60 18 L48 30 L60 42"/><path d="M0 24 L6 30 L0 36"/><path d="M60 24 L54 30 L60 36"/></g></svg>`,
    svgPattern: createSvgDataUrl(`<svg width="60" height="60" viewBox="0 0 60 60"><g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M30 0 L60 30 L30 60 L0 30 Z"/><path d="M30 6 L54 30 L30 54 L6 30 Z"/><path d="M30 12 L48 30 L30 48 L12 30 Z"/><path d="M30 18 L42 30 L30 42 L18 30 Z"/><path d="M30 24 L36 30 L30 36 L24 30 Z"/><path d="M0 0 L30 30 L60 0"/><path d="M0 60 L30 30 L60 60"/><path d="M0 6 L24 30 L0 54"/><path d="M60 6 L36 30 L60 54"/><path d="M0 12 L18 30 L0 48"/><path d="M60 12 L42 30 L60 48"/><path d="M0 18 L12 30 L0 42"/><path d="M60 18 L48 30 L60 42"/><path d="M0 24 L6 30 L0 36"/><path d="M60 24 L54 30 L60 36"/></g></svg>`),
  },
  {
    id: "islamic-mashrabiya",
    name: "مشربية حجازية",
    category: "islamic",
    desc: "خراطة مشربية هندسية متداخلة",
    rawSvg: `<svg width="60" height="52" viewBox="0 0 60 52"><g fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="30,8.66 45,17.32 45,34.64 30,43.3 15,34.64 15,17.32"/><circle cx="30" cy="26" r="3.5" stroke-width="1.2"/><path d="M30 8.66 L30 0 M45 17.32 L60 8.66 M45 34.64 L60 43.3 M30 43.3 L30 52 M15 34.64 L0 43.3 M15 17.32 L0 8.66"/><circle cx="0" cy="0" r="3"/><circle cx="60" cy="0" r="3"/><circle cx="60" cy="52" r="3"/><circle cx="0" cy="52" r="3"/><circle cx="30" cy="0" r="2.5"/><circle cx="30" cy="52" r="2.5"/><circle cx="0" cy="26" r="2.5"/><circle cx="60" cy="26" r="2.5"/><path d="M0 0 L15 17.32 M60 0 L45 17.32 M60 52 L45 34.64 M0 52 L15 34.64"/><path d="M0 26 L15 17.32 L15 34.64 Z M60 26 L45 17.32 L45 34.64 Z"/></g></svg>`,
    svgPattern: createSvgDataUrl(`<svg width="60" height="52" viewBox="0 0 60 52"><g fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="30,8.66 45,17.32 45,34.64 30,43.3 15,34.64 15,17.32"/><circle cx="30" cy="26" r="3.5" stroke-width="1.2"/><path d="M30 8.66 L30 0 M45 17.32 L60 8.66 M45 34.64 L60 43.3 M30 43.3 L30 52 M15 34.64 L0 43.3 M15 17.32 L0 8.66"/><circle cx="0" cy="0" r="3"/><circle cx="60" cy="0" r="3"/><circle cx="60" cy="52" r="3"/><circle cx="0" cy="52" r="3"/><circle cx="30" cy="0" r="2.5"/><circle cx="30" cy="52" r="2.5"/><circle cx="0" cy="26" r="2.5"/><circle cx="60" cy="26" r="2.5"/><path d="M0 0 L15 17.32 M60 0 L45 17.32 M60 52 L45 34.64 M0 52 L15 34.64"/><path d="M0 26 L15 17.32 L15 34.64 Z M60 26 L45 17.32 L45 34.64 Z"/></g></svg>`),
  },
  {
    id: "islamic-muqarnas-lattice",
    name: "قمريات ومقرنصات",
    category: "islamic",
    desc: "معينات متقاطعة وأركان مدرجة",
    rawSvg: `<svg width="64" height="64" viewBox="0 0 64 64"><g fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M32 8 L40 16 L48 16 L48 24 L56 32 L48 40 L48 48 L40 48 L32 56 L24 48 L16 48 L16 40 L8 32 L16 24 L16 16 L24 16 Z"/><path d="M32 0 L32 8 M64 32 L56 32 M32 64 L32 56 M0 32 L8 32"/><path d="M0 0 L16 16 M64 0 L48 16 M64 64 L48 48 M0 64 L16 48"/><rect x="28" y="28" width="8" height="8" transform="rotate(45 32 32)"/><rect x="-4" y="-4" width="8" height="8" transform="rotate(45 0 0)"/><rect x="60" y="-4" width="8" height="8" transform="rotate(45 64 0)"/><rect x="60" y="60" width="8" height="8" transform="rotate(45 64 64)"/><rect x="-4" y="60" width="8" height="8" transform="rotate(45 0 64)"/></g></svg>`,
    svgPattern: createSvgDataUrl(`<svg width="64" height="64" viewBox="0 0 64 64"><g fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M32 8 L40 16 L48 16 L48 24 L56 32 L48 40 L48 48 L40 48 L32 56 L24 48 L16 48 L16 40 L8 32 L16 24 L16 16 L24 16 Z"/><path d="M32 0 L32 8 M64 32 L56 32 M32 64 L32 56 M0 32 L8 32"/><path d="M0 0 L16 16 M64 0 L48 16 M64 64 L48 48 M0 64 L16 48"/><rect x="28" y="28" width="8" height="8" transform="rotate(45 32 32)"/><rect x="-4" y="-4" width="8" height="8" transform="rotate(45 0 0)"/><rect x="60" y="-4" width="8" height="8" transform="rotate(45 64 0)"/><rect x="60" y="60" width="8" height="8" transform="rotate(45 64 64)"/><rect x="-4" y="60" width="8" height="8" transform="rotate(45 0 64)"/></g></svg>`),
  },
  {
    id: "islamic-twelve-star",
    name: "شمسية أندلسية",
    category: "islamic",
    desc: "نجمة 12 رأساً مع بتلات معشقة",
    rawSvg: `<svg width="80" height="80" viewBox="0 0 80 80"><g fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><circle cx="40" cy="40" r="8" stroke-width="1"/><path d="M40 10 L46 25 L60 20 L55 34 L70 40 L55 46 L60 60 L46 55 L40 70 L34 55 L20 60 L25 46 L10 40 L25 34 L20 20 L34 25 Z"/><path d="M40 0 L40 10 M80 40 L70 40 M40 80 L40 70 M0 40 L10 40"/><path d="M0 0 L16 16 M80 0 L64 16 M80 80 L64 64 M0 80 L16 64"/><path d="M0 20 L10 25 M20 0 L25 10 M60 0 L55 10 M80 20 L70 25 M80 60 L70 55 M60 80 L55 70 M20 80 L25 70 M0 60 L10 55"/><polygon points="16,16 25,10 34,25 25,34"/><polygon points="64,16 55,10 46,25 55,34"/><polygon points="64,64 55,70 46,55 55,46"/><polygon points="16,64 25,70 34,55 25,46"/></g></svg>`,
    svgPattern: createSvgDataUrl(`<svg width="80" height="80" viewBox="0 0 80 80"><g fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><circle cx="40" cy="40" r="8" stroke-width="1"/><path d="M40 10 L46 25 L60 20 L55 34 L70 40 L55 46 L60 60 L46 55 L40 70 L34 55 L20 60 L25 46 L10 40 L25 34 L20 20 L34 25 Z"/><path d="M40 0 L40 10 M80 40 L70 40 M40 80 L40 70 M0 40 L10 40"/><path d="M0 0 L16 16 M80 0 L64 16 M80 80 L64 64 M0 80 L16 64"/><path d="M0 20 L10 25 M20 0 L25 10 M60 0 L55 10 M80 20 L70 25 M80 60 L70 55 M60 80 L55 70 M20 80 L25 70 M0 60 L10 55"/><polygon points="16,16 25,10 34,25 25,34"/><polygon points="64,16 55,10 46,25 55,34"/><polygon points="64,64 55,70 46,55 55,46"/><polygon points="16,64 25,70 34,55 25,46"/></g></svg>`),
  },
  {
    id: "islamic-intersecting-circles",
    name: "دوائر متشابكة",
    category: "islamic",
    desc: "بتلات وزهور متناغمة",
    rawSvg: `<svg width="50" height="50" viewBox="0 0 50 50"><g fill="none" stroke="#ffffff" stroke-width="1.5"><circle cx="25" cy="25" r="25"/><circle cx="0" cy="0" r="25"/><circle cx="50" cy="0" r="25"/><circle cx="50" cy="50" r="25"/><circle cx="0" cy="50" r="25"/><circle cx="25" cy="0" r="25"/><circle cx="50" cy="25" r="25"/><circle cx="25" cy="50" r="25"/><circle cx="0" cy="25" r="25"/></g></svg>`,
    svgPattern: createSvgDataUrl(`<svg width="50" height="50" viewBox="0 0 50 50"><g fill="none" stroke="#ffffff" stroke-width="1.5"><circle cx="25" cy="25" r="25"/><circle cx="0" cy="0" r="25"/><circle cx="50" cy="0" r="25"/><circle cx="50" cy="50" r="25"/><circle cx="0" cy="50" r="25"/><circle cx="25" cy="0" r="25"/><circle cx="50" cy="25" r="25"/><circle cx="25" cy="50" r="25"/><circle cx="0" cy="25" r="25"/></g></svg>`),
  },
  {
    id: "islamic-interlocking-ribbon-stars",
    name: "أشرطة نجمية",
    category: "islamic",
    desc: "تضفير أشرطة ونجوم ثمانية",
    rawSvg: `<svg width="70" height="70" viewBox="0 0 70 70"><g fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"><path d="M35 12 L43 20 L56 20 L56 33 L64 41 L56 49 L56 62 L43 62 L35 70 L27 62 L14 62 L14 49 L6 41 L14 33 L14 20 L27 20 Z"/><path d="M35 17 L41 23 L51 23 L51 33 L57 39 L51 45 L51 55 L41 55 L35 61 L29 55 L19 55 L19 45 L13 39 L19 33 L19 23 L29 23 Z"/><path d="M0 6 L6 0 M0 14 L14 0 M0 56 L14 70 M0 64 L6 70 M70 6 L64 0 M70 14 L56 0 M70 56 L56 70 M70 64 L64 70"/><path d="M35 0 L35 12 M0 35 L14 35 M70 35 L56 35 M35 70 L35 62"/><path d="M23 0 L35 12 L47 0 M23 70 L35 58 L47 70"/><path d="M0 23 L12 35 L0 47 M70 23 L58 35 L70 47"/></g></svg>`,
    svgPattern: createSvgDataUrl(`<svg width="70" height="70" viewBox="0 0 70 70"><g fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"><path d="M35 12 L43 20 L56 20 L56 33 L64 41 L56 49 L56 62 L43 62 L35 70 L27 62 L14 62 L14 49 L6 41 L14 33 L14 20 L27 20 Z"/><path d="M35 17 L41 23 L51 23 L51 33 L57 39 L51 45 L51 55 L41 55 L35 61 L29 55 L19 55 L19 45 L13 39 L19 33 L19 23 L29 23 Z"/><path d="M0 6 L6 0 M0 14 L14 0 M0 56 L14 70 M0 64 L6 70 M70 6 L64 0 M70 14 L56 0 M70 56 L56 70 M70 64 L64 70"/><path d="M35 0 L35 12 M0 35 L14 35 M70 35 L56 35 M35 70 L35 62"/><path d="M23 0 L35 12 L47 0 M23 70 L35 58 L47 70"/><path d="M0 23 L12 35 L0 47 M70 23 L58 35 L70 47"/></g></svg>`),
  },
  {
    id: "manuscript-flow",
    name: "توريق دمشقي",
    category: "islamic",
    desc: "نجمة دمشقية بأغصان زهرية",
    rawSvg: `<svg width="72" height="72" viewBox="0 0 72 72"><g fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="36" cy="36" r="10" stroke-width="1"/><path d="M36 4 L44 24 L64 24 L48 36 L54 56 L36 44 L18 56 L24 36 L8 24 L28 24 Z"/><path d="M0 0 L20 20 M72 0 L52 20 M72 72 L52 52 M0 72 L20 52"/><path d="M36 0 L36 12 M72 36 L60 36 M36 72 L36 60 M0 36 L12 36"/><rect x="30" y="30" width="12" height="12" transform="rotate(45 36 36)"/></g></svg>`,
    svgPattern: createSvgDataUrl(`<svg width="72" height="72" viewBox="0 0 72 72"><g fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="36" cy="36" r="10" stroke-width="1"/><path d="M36 4 L44 24 L64 24 L48 36 L54 56 L36 44 L18 56 L24 36 L8 24 L28 24 Z"/><path d="M0 0 L20 20 M72 0 L52 20 M72 72 L52 52 M0 72 L20 52"/><path d="M36 0 L36 12 M72 36 L60 36 M36 72 L36 60 M0 36 L12 36"/><rect x="30" y="30" width="12" height="12" transform="rotate(45 36 36)"/></g></svg>`),
  },
  {
    id: "natural-canvas",
    name: "توريق أندلسي",
    category: "islamic",
    desc: "أغصان توريق وزخارف نباتية",
    rawSvg: `<svg width="64" height="64" viewBox="0 0 64 64"><g fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 0 C24 16, 8 20, 8 32 C8 44, 24 48, 32 64 C40 48, 56 44, 56 32 C56 20, 40 16, 32 0 Z"/><path d="M0 32 C16 24, 20 8, 32 8 C44 8, 48 24, 64 32 C48 40, 44 56, 32 56 C20 56, 16 40, 0 32 Z"/><circle cx="32" cy="32" r="6" stroke-width="1.2"/><path d="M32 20 C28 26, 28 38, 32 44 M20 32 C26 28, 38 28, 44 32"/><path d="M0 0 Q 16 16, 0 32 Q 16 16, 32 0 M64 0 Q 48 16, 64 32 Q 48 16, 32 0 M64 64 Q 48 48, 64 32 Q 48 48, 32 64 M0 64 Q 16 48, 0 32 Q 16 48, 32 64"/></g></svg>`,
    svgPattern: createSvgDataUrl(`<svg width="64" height="64" viewBox="0 0 64 64"><g fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 0 C24 16, 8 20, 8 32 C8 44, 24 48, 32 64 C40 48, 56 44, 56 32 C56 20, 40 16, 32 0 Z"/><path d="M0 32 C16 24, 20 8, 32 8 C44 8, 48 24, 64 32 C48 40, 44 56, 32 56 C20 56, 16 40, 0 32 Z"/><circle cx="32" cy="32" r="6" stroke-width="1.2"/><path d="M32 20 C28 26, 28 38, 32 44 M20 32 C26 28, 38 28, 44 32"/><path d="M0 0 Q 16 16, 0 32 Q 16 16, 32 0 M64 0 Q 48 16, 64 32 Q 48 16, 32 0 M64 64 Q 48 48, 64 32 Q 48 48, 32 64 M0 64 Q 16 48, 0 32 Q 16 48, 32 64"/></g></svg>`),
  },
  {
    id: "wood-grain-fibers",
    name: "عقد فاطمي",
    category: "islamic",
    desc: "تضفير فاطمي بنجوم مثمنة",
    rawSvg: `<svg width="60" height="60" viewBox="0 0 60 60"><g fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M30 6 L44 20 L44 40 L30 54 L16 40 L16 20 Z"/><path d="M6 30 L20 16 L40 16 L54 30 L40 44 L20 44 Z"/><circle cx="30" cy="30" r="5"/><path d="M0 0 L16 16 M60 0 L44 16 M60 60 L44 44 M0 60 L16 44"/><path d="M30 0 L30 6 M60 30 L54 30 M30 60 L30 54 M0 30 L6 30"/><polygon points="30,18 36,24 36,36 30,42 24,36 24,24"/><path d="M0 20 L6 16 L16 20 M60 20 L54 16 L44 20 M60 40 L54 44 L44 40 M0 40 L6 44 L16 40"/></g></svg>`,
    svgPattern: createSvgDataUrl(`<svg width="60" height="60" viewBox="0 0 60 60"><g fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M30 6 L44 20 L44 40 L30 54 L16 40 L16 20 Z"/><path d="M6 30 L20 16 L40 16 L54 30 L40 44 L20 44 Z"/><circle cx="30" cy="30" r="5"/><path d="M0 0 L16 16 M60 0 L44 16 M60 60 L44 44 M0 60 L16 44"/><path d="M30 0 L30 6 M60 30 L54 30 M30 60 L30 54 M0 30 L6 30"/><polygon points="30,18 36,24 36,36 30,42 24,36 24,24"/><path d="M0 20 L6 16 L16 20 M60 20 L54 16 L44 20 M60 40 L54 44 L44 40 M0 40 L6 44 L16 40"/></g></svg>`),
  },
  {
    id: "islamic-andalusian-arches",
    name: "أقواس أندلسية",
    category: "islamic",
    desc: "أقواس حدوية مورقة ومفصصة",
    rawSvg: `<svg width="60" height="60" viewBox="0 0 60 60"><g fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M0 30 C 12 10, 18 10, 30 30 C 42 10, 48 10, 60 30"/><path d="M0 30 C 12 50, 18 50, 30 30 C 42 50, 48 50, 60 30"/><path d="M30 0 C 10 12, 10 18, 30 30 C 10 42, 10 48, 30 60"/><path d="M30 0 C 50 12, 50 18, 30 30 C 50 42, 50 48, 30 60"/><circle cx="30" cy="30" r="7"/><circle cx="0" cy="0" r="7"/><circle cx="60" cy="0" r="7"/><circle cx="60" cy="60" r="7"/><circle cx="0" cy="60" r="7"/><path d="M30 23 C 27 27, 27 33, 30 37 C 33 33, 33 27, 30 23 Z"/><path d="M23 30 C 27 27, 33 27, 37 30 C 33 33, 27 33, 23 30 Z"/><path d="M0 7 C 4 10, 4 10, 7 0 M60 7 C 56 10, 56 10, 53 0 M60 53 C 56 50, 56 50, 53 60 M0 53 C 4 50, 4 50, 7 60"/></g></svg>`,
    svgPattern: createSvgDataUrl(`<svg width="60" height="60" viewBox="0 0 60 60"><g fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M0 30 C 12 10, 18 10, 30 30 C 42 10, 48 10, 60 30"/><path d="M0 30 C 12 50, 18 50, 30 30 C 42 50, 48 50, 60 30"/><path d="M30 0 C 10 12, 10 18, 30 30 C 10 42, 10 48, 30 60"/><path d="M30 0 C 50 12, 50 18, 30 30 C 50 42, 50 48, 30 60"/><circle cx="30" cy="30" r="7"/><circle cx="0" cy="0" r="7"/><circle cx="60" cy="0" r="7"/><circle cx="60" cy="60" r="7"/><circle cx="0" cy="60" r="7"/><path d="M30 23 C 27 27, 27 33, 30 37 C 33 33, 33 27, 30 23 Z"/><path d="M23 30 C 27 27, 33 27, 37 30 C 33 33, 27 33, 23 30 Z"/><path d="M0 7 C 4 10, 4 10, 7 0 M60 7 C 56 10, 56 10, 53 0 M60 53 C 56 50, 56 50, 53 60 M0 53 C 4 50, 4 50, 7 60"/></g></svg>`),
  },
  {
    id: "mushaf-script-lines",
    name: "هندسة مملوكية",
    category: "islamic",
    desc: "تشبيك هندسي مملوكي فاخر",
    rawSvg: `<svg width="64" height="64" viewBox="0 0 64 64"><g fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M32 4 L60 32 L32 60 L4 32 Z"/><rect x="12" y="12" width="40" height="40"/><circle cx="32" cy="32" r="10"/><path d="M32 0 L32 64 M0 32 L64 32"/><path d="M0 0 L64 64 M0 64 L64 0"/><circle cx="32" cy="32" r="22"/></g></svg>`,
    svgPattern: createSvgDataUrl(`<svg width="64" height="64" viewBox="0 0 64 64"><g fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M32 4 L60 32 L32 60 L4 32 Z"/><rect x="12" y="12" width="40" height="40"/><circle cx="32" cy="32" r="10"/><path d="M32 0 L32 64 M0 32 L64 32"/><path d="M0 0 L64 64 M0 64 L64 0"/><circle cx="32" cy="32" r="22"/></g></svg>`),
  },
];

// Rich Photo-Realistic Textures & Materials (خامات وتأثيرات واقعية)
export interface TexturePreset {
  id: string;
  name: string;
  category: "wood" | "clay" | "leather" | "gold" | "nature" | "marble" | "manuscript" | "art" | "cosmic";
  imageUrl: string;
  desc: string;
  defaultTextColor: string;
  defaultFrameColor: string;
  defaultBgGradient?: { color1: string; color2: string };
}

export const texturePresets: TexturePreset[] = [
  {
    id: "texture-leather",
    name: "جلد داكن فاخر",
    category: "leather",
    desc: "ملمس جلد طبيعي داكن فاخر ومعتق",
    imageUrl: textureLeather,
    defaultTextColor: "#FAF8F5",
    defaultFrameColor: "#D4AF37",
    defaultBgGradient: { color1: "#26150b", color2: "#4a2c1a" },
  },
  {
    id: "texture-cosmic-sky",
    name: "سماء فلكية وسديم",
    category: "nature",
    desc: "خامة سماء زرقاء مرصعة بالنجوم والسديم الكوني",
    imageUrl: textureCosmicSky,
    defaultTextColor: "#FFFFFF",
    defaultFrameColor: "#FFE082",
    defaultBgGradient: { color1: "#061828", color2: "#0d435e" },
  },
  {
    id: "texture-purple-watercolor",
    name: "تموجات بنفسجية فنية",
    category: "art",
    desc: "خامة ألوان مائية بنفسجية ولمسات انسيابية فاخرة",
    imageUrl: texturePurpleWatercolor,
    defaultTextColor: "#FFFFFF",
    defaultFrameColor: "#FFE082",
    defaultBgGradient: { color1: "#2d0b4e", color2: "#6a1b82" },
  },
  {
    id: "texture-wood-warm",
    name: "خشب دافئ عريق",
    category: "wood",
    desc: "ألواح خشب طبيعي معتق وأنيق",
    imageUrl: textureWood,
    defaultTextColor: "#FAF8F5",
    defaultFrameColor: "#E2C376",
    defaultBgGradient: { color1: "#2b1408", color2: "#4a2511" },
  },
  {
    id: "texture-clay",
    name: "طين وفخار تراثي",
    category: "clay",
    desc: "ملمس طين وجص فخاري أصيل",
    imageUrl: textureClay,
    defaultTextColor: "#FAF8F5",
    defaultFrameColor: "#FFE082",
    defaultBgGradient: { color1: "#3e1c10", color2: "#783e22" },
  },
  {
    id: "texture-gold-foil",
    name: "ذهب صقيل نقي",
    category: "gold",
    desc: "خامة ذهب ملكي مصقول ناعم بدون تعرجات",
    imageUrl: textureGoldFoil,
    defaultTextColor: "#1C1917",
    defaultFrameColor: "#685023",
    defaultBgGradient: { color1: "#5a431c", color2: "#C5A85C" },
  },
  {
    id: "bg-desert-flower",
    name: "زهرة الأمل بالصحراء",
    category: "nature",
    desc: "زهرة بيضاء تنبثق بالحياة والأمل",
    imageUrl: bgDesertFlower,
    defaultTextColor: "#FFFFFF",
    defaultFrameColor: "#C5A85C",
    defaultBgGradient: { color1: "#1b2838", color2: "#3b5878" },
  },
  {
    id: "texture-marble",
    name: "رخام أبيض وذهبي",
    category: "marble",
    desc: "رخام ناصع بعروق ذهبية نقية",
    imageUrl: textureMarble,
    defaultTextColor: "#012519",
    defaultFrameColor: "#C5A85C",
    defaultBgGradient: { color1: "#e4ded2", color2: "#faf8f5" },
  },
  {
    id: "texture-parchment",
    name: "مخطوطة بردي عتيقة",
    category: "manuscript",
    desc: "ورق مصاحف قديم بلمسة أصيلة",
    imageUrl: textureParchment,
    defaultTextColor: "#1C1917",
    defaultFrameColor: "#8B1D48",
    defaultBgGradient: { color1: "#3d2b1f", color2: "#8c6b4f" },
  },
];

// Frame Styles
export type FrameStyleType =
  | "none"
  | "rectangle"
  | "andalusian"
  | "vintage-border"
  | "rounded"
  | "minimal";

export interface FrameStyleOption {
  id: FrameStyleType;
  name: string;
}

export const frameStyleOptions: FrameStyleOption[] = [
  { id: "none", name: "بدون إطار" },
  { id: "rectangle", name: "كلاسيكي مزدوج" },
  { id: "andalusian", name: "أندلسي مزخرف" },
  { id: "vintage-border", name: "إطار مذهب منقط" },
  { id: "rounded", name: "إطار مقوس ناعم" },
  { id: "minimal", name: "خط ملكي دقيق" },
];

export const frameColorPalette = [
  "#C5A85C", "#E2C376", "#FFFFFF", "#FAF8F5", "#012519", "#0B1528", "#8B1D48", "#1C1917"
];

export const shareColorsPalette = [
  "#FFFFFF", "#FAF8F5", "#FFE082", "#81C784", "#64B5F6", "#E1BEE7", "#FFB74D", "#E57373",
  "#011c14", "#1b3168", "#111827", "#D97706", "#059669", "#2563EB", "#7C3AED", "#DC2626",
];

// Helper to create Authentic Medina Mushaf Surah Header Frame SVG Data URL for Canvas
export function createSurahHeaderSvg(borderColor: string = "#C5A85C", accentColor: string = "#C5A85C", triangleAccent?: string): string {
  const activeTriangle = triangleAccent || accentColor || borderColor;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 10 900 90" fill="none">
    <defs>
      <g id="star">
        <polygon points="0,-28 8,-14 20,-20 14,-8 28,0 14,8 20,20 8,14 0,28 -8,14 -20,20 -14,8 -28,0 -14,-8 -20,-20 -8,-14" fill="${accentColor}" stroke="${borderColor}" stroke-width="1.2" />
        <polygon points="0,-21 6,-10 15,-15 10,-6 21,0 10,6 15,15 6,10 0,21 -6,10 -15,15 -10,6 -21,0 -10,-6 -15,-15 -6,-10" fill="${activeTriangle}" stroke="${borderColor}" stroke-width="0.8" />
        <polygon points="0,-12 3.5,-6 8.5,-8.5 6,-3.5 12,0 6,3.5 8.5,8.5 3.5,6 0,12 -3.5,6 -8.5,8.5 -6,3.5 -12,0 -6,-3.5 -8.5,-8.5 -3.5,-6" fill="none" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="0" y1="-28" x2="0" y2="28" stroke="${borderColor}" stroke-width="0.7" />
        <line x1="-28" y1="0" x2="28" y2="0" stroke="${borderColor}" stroke-width="0.7" />
        <line x1="-20" y1="-20" x2="20" y2="20" stroke="${borderColor}" stroke-width="0.5" />
        <line x1="-20" y1="20" x2="20" y2="-20" stroke="${borderColor}" stroke-width="0.5" />
        <circle cx="0" cy="0" r="5.0" fill="none" stroke="${borderColor}" stroke-width="0.8" />
        <circle cx="0" cy="0" r="3.0" fill="${accentColor}" stroke="${borderColor}" stroke-width="0.5" />
        <circle cx="0" cy="0" r="1.2" fill="#ffffff" />
        <polygon points="-58,-40 -50,-32 -58,-24 -66,-32" fill="none" stroke="${borderColor}" stroke-width="0.8" />
        <polygon points="-58,-37 -52,-32 -58,-27 -64,-32" fill="${activeTriangle}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.5" />
        <polygon points="-58,40 -50,32 -58,24 -66,32" fill="none" stroke="${borderColor}" stroke-width="0.8" />
        <polygon points="-58,37 -52,32 -58,27 -64,32" fill="${activeTriangle}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.5" />
        <polygon points="58,-40 66,-32 58,-24 50,-32" fill="none" stroke="${borderColor}" stroke-width="0.8" />
        <polygon points="58,-37 64,-32 58,-27 52,-32" fill="${activeTriangle}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.5" />
        <polygon points="58,40 66,32 58,24 50,32" fill="none" stroke="${borderColor}" stroke-width="0.8" />
        <polygon points="58,37 64,32 58,27 52,32" fill="${activeTriangle}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.5" />
        <line x1="-20" y1="-20" x2="-58" y2="-32" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="-20" y1="20" x2="-58" y2="32" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="20" y1="-20" x2="58" y2="-32" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="20" y1="20" x2="58" y2="32" stroke="${borderColor}" stroke-width="0.6" />
        <circle cx="-58" cy="-32" r="1.4" fill="${activeTriangle}" stroke="${borderColor}" stroke-width="0.4" />
        <circle cx="-58" cy="32" r="1.4" fill="${activeTriangle}" stroke="${borderColor}" stroke-width="0.4" />
        <circle cx="58" cy="-32" r="1.4" fill="${activeTriangle}" stroke="${borderColor}" stroke-width="0.4" />
        <circle cx="58" cy="32" r="1.4" fill="${activeTriangle}" stroke="${borderColor}" stroke-width="0.4" />
      </g>
    </defs>
    <g transform="translate(0, 55) scale(1, 0.82) translate(0, -55)">
      <rect x="10" y="12" width="230" height="86" fill="${borderColor}" fill-opacity="0.30" />
      <rect x="660" y="12" width="230" height="86" fill="${borderColor}" fill-opacity="0.30" />
      <path d="M 10,12 L 890,12 L 890,98 L 10,98 Z" fill="none" stroke="${borderColor}" stroke-width="1.6" />
      <g>
        <polygon points="10,10 84,55 10,100" fill="none" stroke="${borderColor}" stroke-width="1.1" />
        <polygon points="15,18 78,55 15,92" fill="${activeTriangle}" fill-opacity="0.4" stroke="${borderColor}" stroke-width="0.7" />
        <polygon points="25,55 48,28 72,55 48,82" fill="${activeTriangle}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.9" />
        <polygon points="34,55 48,36 62,55 48,74" fill="${activeTriangle}" fill-opacity="0.95" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="10" y1="55" x2="84" y2="55" stroke="${borderColor}" stroke-width="0.9" />
        <circle cx="48" cy="55" r="2.2" fill="#ffffff" stroke="${borderColor}" stroke-width="0.6" />
        <circle cx="84" cy="55" r="1.8" fill="${activeTriangle}" stroke="${borderColor}" stroke-width="0.6" />
      </g>
      <g>
        <polygon points="240,12 140,55 240,98" fill="none" stroke="${borderColor}" stroke-width="1.1" />
        <polygon points="234,18 146,55 234,92" fill="${activeTriangle}" fill-opacity="0.4" stroke="${borderColor}" stroke-width="0.7" />
        <polygon points="220,55 192,28 152,55 192,82" fill="${activeTriangle}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.9" />
        <polygon points="210,55 192,36 162,55 192,74" fill="${activeTriangle}" fill-opacity="0.95" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="240" y1="55" x2="140" y2="55" stroke="${borderColor}" stroke-width="0.9" />
        <circle cx="192" cy="55" r="2.2" fill="#ffffff" stroke="${borderColor}" stroke-width="0.6" />
        <circle cx="140" cy="55" r="1.8" fill="${activeTriangle}" stroke="${borderColor}" stroke-width="0.6" />
      </g>
      <g>
        <polygon points="890,12 816,55 890,98" fill="none" stroke="${borderColor}" stroke-width="1.1" />
        <polygon points="884,18 822,55 884,92" fill="${activeTriangle}" fill-opacity="0.4" stroke="${borderColor}" stroke-width="0.7" />
        <polygon points="875,55 852,28 828,55 852,82" fill="${activeTriangle}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.9" />
        <polygon points="866,55 852,36 838,55 852,74" fill="${activeTriangle}" fill-opacity="0.95" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="890" y1="55" x2="816" y2="55" stroke="${borderColor}" stroke-width="0.9" />
        <circle cx="852" cy="55" r="2.2" fill="#ffffff" stroke="${borderColor}" stroke-width="0.6" />
        <circle cx="816" cy="55" r="1.8" fill="${activeTriangle}" stroke="${borderColor}" stroke-width="0.6" />
      </g>
      <g>
        <polygon points="660,12 760,55 660,98" fill="none" stroke="${borderColor}" stroke-width="1.1" />
        <polygon points="666,18 754,55 666,92" fill="${activeTriangle}" fill-opacity="0.4" stroke="${borderColor}" stroke-width="0.7" />
        <polygon points="680,55 708,28 748,55 708,82" fill="${activeTriangle}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.9" />
        <polygon points="690,55 708,36 738,55 708,74" fill="${activeTriangle}" fill-opacity="0.95" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="660" y1="55" x2="760" y2="55" stroke="${borderColor}" stroke-width="0.9" />
        <circle cx="708" cy="55" r="2.2" fill="#ffffff" stroke="${borderColor}" stroke-width="0.6" />
        <circle cx="760" cy="55" r="1.8" fill="${activeTriangle}" stroke="${borderColor}" stroke-width="0.6" />
      </g>
      <g transform="translate(112, 55)"><use href="#star" /></g>
      <g transform="translate(788, 55)"><use href="#star" /></g>
      <path d="M 282.00 12.00 L 618.00 12.00 C 643.20 12.00 646.00 17.60 646.00 26.00 L 660.00 26.00 L 660.00 34.00 C 657.00 49.00 666.00 52.50 686.00 55.00 C 666.00 57.50 657.00 61.00 660.00 76.00 L 660.00 84.00 L 646.00 84.00 C 646.00 92.40 643.20 98.00 618.00 98.00 L 282.00 98.00 C 256.80 98.00 254.00 92.40 254.00 84.00 L 240.00 84.00 L 240.00 76.00 C 243.00 61.00 234.00 57.50 214.00 55.00 C 234.00 52.50 243.00 49.00 240.00 34.00 L 240.00 26.00 L 254.00 26.00 C 254.00 17.60 256.80 12.00 282.00 12.00 Z" fill="none" stroke="${borderColor}" stroke-width="1.5" />
      <path d="M 240,12 L 240,26" stroke="${borderColor}" stroke-width="1.5" />
      <path d="M 240,98 L 240,84" stroke="${borderColor}" stroke-width="1.5" />
      <path d="M 660,12 L 660,26" stroke="${borderColor}" stroke-width="1.5" />
      <path d="M 660,98 L 660,84" stroke="${borderColor}" stroke-width="1.5" />
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function shadeColor(color: string, percent: number): string {
  let hex = (color || "#C5A85C").replace("#", "").trim();
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const num = parseInt(hex, 16);
  if (isNaN(num)) return percent < 0 ? "#8C7436" : "#E2CF8E";
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Authentic Medina Mushaf Surah Header SVG for High-Resolution Export
export function createAuthenticSurahHeaderSvg(frameColor: string = "#C5A85C", _textColor: string = "#FAF8F5"): string {
  try {
    const activeColor = frameColor || "#C5A85C";
    const deepShade = shadeColor(activeColor, -30);
    const midShade = activeColor;
    const highShade = shadeColor(activeColor, 40);

    const { scopedDefs, scopedBody } = getAuthenticFrameSvgInner("share_modal_canvas", {
      frameStroke: activeColor,
      innerStroke: activeColor,
      innerFill: "transparent",
      accentSolid: midShade,
      accentDeep: deepShade,
      highlight: "#ffffff",
      gradHigh: highShade,
      gradMid: midShade,
      gradDeep: deepShade,
      textColor: activeColor,
    });

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240.20621 30.23196" width="240.20621" height="30.23196" fill="none" overflow="visible">
      <defs>
        <style>
          .surah_frame_outer_border, [id*="path3763"], [id*="path4079"] { fill: none !important; fill-opacity: 0 !important; stroke: ${activeColor} !important; stroke-width: 1.5px !important; stroke-opacity: 1 !important; stroke-linecap: round !important; stroke-linejoin: round !important; }
          .surah_frame_cartouche_bg, [id*="path4395"], [class*="cartouche"], [id*="cartouche"] { fill: none !important; fill-opacity: 0 !important; stroke: none !important; }
          .surah_frame_inner_contour { fill: none !important; fill-opacity: 0 !important; stroke: ${activeColor} !important; }
        </style>
        ${scopedDefs}
      </defs>
      ${scopedBody}
      <rect x="0.8" y="0.8" width="238.6" height="28.63" rx="0.6" fill="none" stroke="${activeColor}" stroke-width="1.5" stroke-opacity="1" opacity="1" class="surah_frame_outer_border" />
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return createSurahHeaderSvg(frameColor, frameColor, frameColor);
  }
}

// Authentic Medina Mushaf Surah Header Frame for the Share Card
export const ShareSurahHeaderFrame: React.FC<{
  surahNumber?: number;
  surahName?: string;
  glyph?: string;
  frameColor?: string;
  textColor?: string;
  className?: string;
  style?: React.CSSProperties;
  headerStyle?: "authentic" | "classic" | "minimal";
  scale?: number;
}> = ({
  surahNumber,
  surahName,
  glyph,
  frameColor = "#C5A85C",
  textColor = "#FAF8F5",
  className = "",
  style = {},
  headerStyle = "authentic",
  scale = 1,
}) => {
  const widthPercentage = scale && scale !== 1 ? Math.min(100, Math.max(70, Math.round(100 * scale))) : 100;

  // Resolve Surah formatted title for fallback and QBSML glyph
  let formattedTitle = "";
  const surahInfo = surahNumber ? surahsList.find((s) => s.number === surahNumber) : null;
  if (surahInfo) {
    formattedTitle = `سُورَةُ ${surahInfo.name}`;
  } else if (surahName && surahName.length > 1) {
    formattedTitle = surahName.trim();
    if (!formattedTitle.startsWith("سُورَةُ") && !formattedTitle.startsWith("سورة")) {
      formattedTitle = `سُورَةُ ${formattedTitle}`;
    } else if (formattedTitle.startsWith("سورة ")) {
      formattedTitle = formattedTitle.replace("سورة ", "سُورَةُ ");
    }
  } else {
    formattedTitle = surahNumber ? `سُورَةُ ${surahNumber}` : "";
  }

  const surahTextToDisplay = glyph || (surahNumber ? (isQbsmlLoaded() ? String.fromCharCode(0xF100 + (surahNumber - 1)) : (getSurahHeaderGlyph(surahNumber, formattedTitle) || formattedTitle)) : formattedTitle);

  if (headerStyle === "classic") {
    return (
      <div
        className={`w-full my-1 mx-auto flex items-center justify-center ${className}`}
        style={{ maxWidth: `${widthPercentage}%`, ...style }}
      >
        <div className="relative w-full aspect-[900/105] flex items-center justify-center">
          <img
            src={createSurahHeaderSvg(frameColor, frameColor)}
            alt={formattedTitle || surahName}
            className="w-full h-full object-contain pointer-events-none select-none"
          />
          <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
            <span
              style={{
                fontFamily: "'QCF4_QBSML', 'Amiri', 'Traditional Arabic', serif",
                fontSize: "clamp(16px, 5.2cqi, 36px)",
                color: textColor,
                transform: "translateY(-7%)",
                direction: "rtl",
                textAlign: "center",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
              }}
            >
              {surahTextToDisplay}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (headerStyle === "minimal") {
    return (
      <div
        className={`w-full my-1 mx-auto flex items-center justify-center ${className}`}
        style={{ maxWidth: `${widthPercentage}%`, ...style }}
      >
        <div
          className="px-6 py-1.5 rounded-full border flex items-center justify-center gap-2 shadow-xs text-center"
          style={{ borderColor: frameColor, backgroundColor: "rgba(0,0,0,0.25)" }}
        >
          <span
            style={{
              fontFamily: "'QCF4_QBSML', 'Amiri', 'Traditional Arabic', serif",
              fontSize: "clamp(15px, 4.5cqi, 30px)",
              color: textColor,
              transform: "translateY(-4%)",
              direction: "rtl",
              textAlign: "center",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
            }}
          >
            {surahTextToDisplay}
          </span>
        </div>
      </div>
    );
  }

  // Official / Default: Authentic Medina Mushaf Surah Header Frame from Quran-soura-112.svg
  // Render high-fidelity vector inline SVG directly in the DOM for instant, 100% reliable display
  const frameId = useMemo(
    () => `share_hdr_${surahNumber || "def"}_${(frameColor || "").replace(/[^a-zA-Z0-9]/g, "")}`,
    [surahNumber, frameColor]
  );

  const framePalette = useMemo(() => {
    const col = frameColor || "#C5A85C";
    const darkShade = shadeColor(col, -30);
    const lightShade = shadeColor(col, 40);
    return {
      frameStroke: col,
      innerStroke: col,
      innerFill: "transparent",
      accentSolid: col,
      accentDeep: darkShade,
      highlight: "#ffffff",
      gradHigh: lightShade,
      gradMid: col,
      gradDeep: darkShade,
      textColor: textColor || col,
    };
  }, [frameColor, textColor]);

  const { scopedDefs, scopedBody } = useMemo(
    () => getAuthenticFrameSvgInner(frameId, framePalette),
    [frameId, framePalette]
  );

  return (
    <div
      className={`w-full my-0 mx-auto flex items-center justify-center transition-all ${className}`}
      style={{ maxWidth: `${widthPercentage}%`, ...style }}
    >
      <div className="relative w-full aspect-[240.20621/30.23196] flex items-center justify-center">
        <svg
          viewBox="0 0 240.20621 30.23196"
          overflow="visible"
          className="w-full h-full object-contain pointer-events-none select-none block"
          style={{ color: frameColor, overflow: "visible" }}
        >
          <defs
            dangerouslySetInnerHTML={{
              __html: `
                <style>
                  .surah_frame_outer_border, [id*="path3763"], [id*="path4079"] { fill: none !important; fill-opacity: 0 !important; stroke: ${frameColor} !important; stroke-width: 1.5px !important; stroke-opacity: 1 !important; stroke-linecap: round !important; stroke-linejoin: round !important; }
                  .surah_frame_cartouche_bg, [id*="path4395"], [class*="cartouche"], [id*="cartouche"] { fill: none !important; fill-opacity: 0 !important; stroke: none !important; }
                  .surah_frame_inner_contour { fill: none !important; fill-opacity: 0 !important; stroke: ${frameColor} !important; }
                </style>
                ${scopedDefs}
              `,
            }}
          />
          <g className="surah_header_frame" dangerouslySetInnerHTML={{ __html: scopedBody }} />
          <rect x="0.8" y="0.8" width="238.6" height="28.63" rx="0.6" fill="none" stroke={frameColor} strokeWidth="1.5" strokeOpacity="1" opacity="1" className="surah_frame_outer_border" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
          <span
            style={{
              fontFamily: "'QCF4_QBSML', 'Amiri', 'Traditional Arabic', serif",
              fontSize: "clamp(16px, 5.2cqi, 36px)",
              color: textColor,
              fontWeight: "normal",
              textShadow: "none",
              boxShadow: "none",
              filter: "none",
              WebkitFilter: "none",
              transform: "translateY(-14%)",
              direction: "rtl",
              textAlign: "center",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
            }}
          >
            {surahTextToDisplay}
          </span>
        </div>
      </div>
    </div>
  );
};

export const LOCAL_SHARE_STYLE_KEY = "quran_share_default_style_v3";
export const USER_CUSTOM_DEFAULT_STYLE_KEY = "quran_share_user_custom_default_v3";
export const DEFAULT_SHARE_AYAH_KEY = "quran_share_default_ayah_v3";

export interface SavedShareStyle {
  bgCategory?: "gradient" | "solid" | "pattern" | "texture" | "none";
  gradientType?: "linear" | "radial";
  gradientAngle?: number;
  radialSpread?: number;
  gradientColor1?: string;
  gradientColor2?: string;
  selectedSolidColor?: string;
  selectedPatternId?: string;
  showPattern?: boolean;
  patternOpacity?: number;
  patternColor?: string;
  selectedTextureId?: string;
  showTexture?: boolean;
  textureOpacity?: number;
  selectedAspectRatio?: AspectRatioType;
  customWidth?: number;
  customHeight?: number;
  showAyahFrame?: boolean;
  selectedFrameStyle?: FrameStyleType;
  frameColor?: string;
  frameWidth?: number;
  frameInset?: number;
  showSurahHeaderFrame?: boolean;
  surahHeaderStyle?: "authentic" | "classic" | "minimal";
  surahHeaderColor?: string;
  surahHeaderTextColor?: string;
  surahHeaderScale?: number;
  selectedQuranFont?: "qcf4" | "amiri" | "uthman" | "cairo";
  textFontSize?: number;
  textShadowOpacity?: number;
  textAlign?: "justify" | "center" | "right" | "left";
  textColor?: string;
  logoColor?: string;
  showIstiadhah?: boolean;
  istiadhahColor?: string;
  istiadhahSize?: number;
  showSurahInfo?: boolean;
  showWatermark?: boolean;
  surahInfoOffsetY?: number;
  surahInfoOffsetX?: number;
  surahInfoScale?: number;
  watermarkOffsetY?: number;
  watermarkOffsetX?: number;
  watermarkScale?: number;
  textOffsetY?: number;
  textOffsetX?: number;
  showAyahText?: boolean;
  surahHeaderOffsetY?: number;
  surahHeaderOffsetX?: number;
  // Opening Header (Bismillah / Istiadhah / Surah Frame) Controls:
  showOpeningHeader?: boolean;
  openingHeaderMode?: "auto" | "bismillah" | "surah_frame";
  openingHeaderSize?: number;
  openingHeaderColor?: string;
  openingHeaderFont?: string;
  // Card Ayahs Content & Mode Defaults:
  shareMode?: "single" | "range" | "page";
  defaultSurahNumber?: number;
  defaultSurahName?: string;
  defaultAyahNumber?: number;
  rangeFrom?: number;
  rangeTo?: number;
  selectedPageNumber?: number;
}

export type BismillahFontId = "uthman" | "uthman_taha" | "qcf4" | "amiri" | "naskh" | "scheherazade" | "ruqaa";

export interface BismillahFontOption {
  id: BismillahFontId;
  label: string;
  family: string;
  canvasFamily: string;
}

// Authentic Quran Fonts from src/utils/fontOfflineCache.ts & src/utils/qcf4Utils.ts
export const BISMILLAH_FONTS: BismillahFontOption[] = [
  { id: "uthman_taha", label: "مصحف عثمان طه (QCF4)", family: "'QCF4_Hafs_01', 'QCF4_QBSML', 'UthmanTaha', 'UthmanicHafs', serif", canvasFamily: '"QCF4_Hafs_01", "QCF4_QBSML", "UthmanTaha", "UthmanicHafs", serif' },
  { id: "uthman", label: "مصحف المدينة (حفص)", family: "'QCF4_Hafs_01', 'QCF4_QBSML', 'UthmanTaha', 'UthmanicHafs', serif", canvasFamily: '"QCF4_Hafs_01", "QCF4_QBSML", "UthmanTaha", "UthmanicHafs", serif' },
  { id: "qcf4", label: "مصحف عثمان طه (QCF4)", family: "'QCF4_Hafs_01', 'QCF4_QBSML', 'UthmanTaha', 'UthmanicHafs', serif", canvasFamily: '"QCF4_Hafs_01", "QCF4_QBSML", "UthmanTaha", "UthmanicHafs", serif' },
  { id: "amiri", label: "الخط الأميري القرآني", family: "'Amiri', 'UthmanTaha', serif", canvasFamily: '"Amiri", serif' },
  { id: "naskh", label: "النسخ القرآني", family: "'Noto Naskh Arabic', 'Scheherazade New', serif", canvasFamily: '"Noto Naskh Arabic", serif' },
  { id: "scheherazade", label: "خط شهرزاد القرآني", family: "'Scheherazade New', 'Amiri', serif", canvasFamily: '"Scheherazade New", serif' },
  { id: "ruqaa", label: "خط الرقعة", family: "'Aref Ruqaa', 'Amiri', serif", canvasFamily: '"Aref Ruqaa", serif' },
];

export const getBismillahFontObj = (fontId?: string): BismillahFontOption => {
  return BISMILLAH_FONTS.find((f) => f.id === fontId) || BISMILLAH_FONTS[0];
};

export const DEFAULT_SHARE_STYLE: SavedShareStyle = {
  bgCategory: "solid",
  gradientType: "linear",
  gradientAngle: 135,
  radialSpread: 75,
  gradientColor1: "#FCFAF7",
  gradientColor2: "#EFECE6",
  selectedSolidColor: "#FCFAF7",
  selectedPatternId: "islamic-concentric-diamond",
  patternOpacity: 0.3,
  patternColor: "#C5A85C",
  showPattern: false,
  selectedTextureId: "texture-leather",
  showTexture: false,
  textureOpacity: 0.9,
  selectedAspectRatio: "auto",
  customWidth: 1080,
  customHeight: 1350,
  showAyahFrame: false,
  selectedFrameStyle: "none",
  frameColor: "#C5A85C",
  frameWidth: 2,
  frameInset: 24,
  showSurahHeaderFrame: true, // Surah frame at top
  showOpeningHeader: true, // Active opening header (Bismillah)
  openingHeaderMode: "auto", // Auto: Bismillah for beginning of surah
  openingHeaderSize: 30,
  openingHeaderColor: "#1C1917",
  openingHeaderFont: "uthman_taha",
  surahHeaderStyle: "authentic",
  surahHeaderColor: "#C5A85C",
  surahHeaderTextColor: "#1C1917",
  surahHeaderScale: 100,
  selectedQuranFont: "qcf4",
  textFontSize: 28,
  textShadowOpacity: 0,
  textAlign: "justify",
  textColor: "#1C1917",
  logoColor: "#1C1917",
  showIstiadhah: false,
  istiadhahColor: "#1C1917",
  istiadhahSize: 38,
  showSurahInfo: false,
  showWatermark: true,
  surahInfoOffsetY: 0,
  surahInfoOffsetX: 0,
  surahInfoScale: 100,
  watermarkOffsetY: 0,
  watermarkOffsetX: 0,
  watermarkScale: 100,
  textOffsetY: 0,
  textOffsetX: 0,
  showAyahText: true,
  surahHeaderOffsetY: 0,
  surahHeaderOffsetX: 0,
  shareMode: "range",
  defaultSurahNumber: 14,
  defaultSurahName: "ابراهيم",
  defaultAyahNumber: 40,
  rangeFrom: 40,
  rangeTo: 41,
  selectedPageNumber: 260,
};

export function getInitialShareStyle(theme?: string, isDark?: boolean): SavedShareStyle {
  try {
    const customDefault = localStorage.getItem(USER_CUSTOM_DEFAULT_STYLE_KEY);
    const savedLocal = localStorage.getItem(LOCAL_SHARE_STYLE_KEY);
    const legacyV2 = localStorage.getItem("quran_share_user_custom_default_v2") || localStorage.getItem("quran_share_default_style_v2");
    const chosen = customDefault || savedLocal || legacyV2;
    if (chosen) {
      const parsed = JSON.parse(chosen);
      if (parsed && typeof parsed === "object") {
        // Enforce solid single-color background and enable watermark by default
        parsed.bgCategory = "solid";
        parsed.selectedSolidColor = parsed.selectedSolidColor || "#FCFAF7";
        if ((parsed.selectedSolidColor === "#1C1917" || !parsed.selectedSolidColor) && !customDefault) {
          parsed.selectedSolidColor = "#FCFAF7";
          parsed.textColor = "#1C1917";
          parsed.openingHeaderColor = "#1C1917";
          parsed.surahHeaderTextColor = "#1C1917";
          parsed.logoColor = "#1C1917";
        }
        parsed.showIstiadhah = false;
        parsed.showSurahInfo = false;
        parsed.showWatermark = true;
        parsed.showAyahFrame = false;
        parsed.selectedFrameStyle = "none";

        // Opening Header (Bismillah / Istiadhah) default configuration
        parsed.showOpeningHeader = parsed.showOpeningHeader ?? true;
        parsed.showSurahHeaderFrame = parsed.showSurahHeaderFrame ?? true;
        parsed.openingHeaderMode = parsed.openingHeaderMode || "auto";
        parsed.openingHeaderSize = parsed.openingHeaderSize ?? 30;
        parsed.openingHeaderColor = parsed.openingHeaderColor || parsed.textColor || "#1C1917";
        parsed.openingHeaderFont = parsed.openingHeaderFont && parsed.openingHeaderFont !== "match_ayah" ? parsed.openingHeaderFont : "uthman_taha";

        // Discard deprecated legacy purple presets (#2e0854 / #6d156c)
        if (parsed.gradientColor1 === "#2e0854" || parsed.gradientColor2 === "#6d156c") {
          parsed.gradientColor1 = DEFAULT_SHARE_STYLE.gradientColor1;
          parsed.gradientColor2 = DEFAULT_SHARE_STYLE.gradientColor2;
        }
        // If it was previous automatic default to Al-Fatiha (1:1-7), update to Ibrahim (14:40-41)
        if (!customDefault && (parsed.defaultSurahNumber === 1 || !parsed.defaultSurahNumber)) {
          parsed.defaultSurahNumber = 14;
          parsed.defaultSurahName = "ابراهيم";
          parsed.defaultAyahNumber = 40;
          parsed.rangeFrom = 40;
          parsed.rangeTo = 41;
          parsed.selectedPageNumber = 260;
        }
        // Ensure default aspect ratio is adaptive auto mode
        if (!parsed.selectedAspectRatio || parsed.selectedAspectRatio === "9:16") {
          parsed.selectedAspectRatio = "auto";
        }
        // Ensure textFontSize for verses is not stuck at tiny page font size
        if (parsed.textFontSize && parsed.textFontSize < 22) {
          parsed.textFontSize = 28;
        }
        return { ...DEFAULT_SHARE_STYLE, ...parsed };
      }
    }
  } catch (e) {
    console.warn("Failed to load saved share style:", e);
  }

  return DEFAULT_SHARE_STYLE;
}

export const ShareAyahModal: React.FC<ShareAyahModalProps> = ({
  shareData,
  onClose,
  theme = "light",
  isDark = false,
}) => {
  // Dynamic Theme Styling Configuration
  const tTheme = useMemo(() => {
    if (theme === "emerald-velvet") {
      return {
        modalBg: "bg-[#011610] text-[#FAF8F5] border-[#c5a85c]/30 shadow-2xl",
        headerFooterBg: "bg-[#012519]/95 border-[#c5a85c]/20",
        headerIcon: "bg-[#c5a85c]/15 border-[#c5a85c]/30 text-[#c5a85c]",
        subText: "text-[#FAF8F5]/60",
        closeBtn: "border border-[#c5a85c]/30 bg-[#011a12] text-[#FAF8F5] hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/15 shadow-xs",
        
        tabContainer: "bg-[#011a12] border-[#c5a85c]/25",
        tabActive: "bg-[#c5a85c] text-[#011a12] font-black shadow-md",
        tabInactive: "text-[#FAF8F5]/60 hover:text-[#FAF8F5] hover:bg-[#c5a85c]/10",
        
        aspectContainer: "bg-[#011a12] border-[#c5a85c]/25",
        aspectActive: "bg-[#c5a85c] text-[#011a12] font-black shadow-md scale-[1.02]",
        aspectInactive: "text-[#FAF8F5]/60 hover:text-[#FAF8F5]",
        
        panelBg: "border-[#c5a85c]/25 bg-[#011f15]/80",
        innerBox: "bg-[#011610]/80 border-[#c5a85c]/20",
        innerBoxHeader: "text-[#FAF8F5]",
        innerBoxSub: "text-[#FAF8F5]/60",
        
        subTabsContainer: "bg-[#011610] border-[#c5a85c]/20",
        subTabActive: "bg-[#c5a85c] text-[#011a12] font-black shadow-xs",
        subTabInactive: "text-[#FAF8F5]/60 hover:text-[#FAF8F5]",
        
        selectedCard: "bg-[#c5a85c]/20 border-[#c5a85c] text-[#FAF8F5] shadow-md ring-2 ring-[#c5a85c]/30",
        unselectedCard: "bg-[#011610]/70 border-[#c5a85c]/20 text-[#FAF8F5]/80 hover:border-[#c5a85c]/50",
        accentText: "text-[#c5a85c]",
        accentBadge: "bg-[#c5a85c]/15 text-[#c5a85c] border-[#c5a85c]/30",
        
        sliderAccent: "accent-[#c5a85c]",
        sliderTrack: "bg-[#011610] border border-[#c5a85c]/20",
        checkboxAccent: "accent-[#c5a85c]",
        
        quickBtn: "border-[#c5a85c]/45 bg-[#011a12] hover:bg-[#012519] text-[#FAF8F5] shadow-xs border",
        primaryBtn: "bg-[#c5a85c] text-[#011a12] hover:bg-[#d4ba74] font-black shadow-md",
        secondaryBtn: "border-[#c5a85c]/40 text-[#c5a85c] hover:bg-[#c5a85c]/15",
        closeModalBtn: "border-[#c5a85c]/30 bg-[#011a12] hover:bg-[#012519] text-[#FAF8F5]",
        
        toggleActive: "bg-[#c5a85c]/20 border-[#c5a85c] text-[#FAF8F5]",
        toggleInactive: "border-[#c5a85c]/20 text-[#FAF8F5]/60 bg-[#011610]/70 hover:bg-[#011a12]",
        toggleDotActive: "bg-[#c5a85c]",
        toggleDotInactive: "bg-[#FAF8F5]/30",
        statusNotice: "bg-[#c5a85c]/15 text-[#c5a85c] border-[#c5a85c]/30",
      };
    } else if (theme === "gold-velvet") {
      return {
        modalBg: "bg-[#FAF8F5] text-[#011c14] border-[#c5a85c]/35 shadow-2xl",
        headerFooterBg: "bg-[#f5efe0]/95 border-[#c5a85c]/20",
        headerIcon: "bg-[#c5a85c]/20 border-[#c5a85c]/40 text-[#011c14]",
        subText: "text-stone-500",
        closeBtn: "border border-[#c5a85c]/40 bg-white text-stone-800 hover:text-red-600 hover:border-red-400 hover:bg-red-50 shadow-xs",
        
        tabContainer: "bg-[#eae2d3] border-[#c5a85c]/30",
        tabActive: "bg-[#c5a85c] text-white font-black shadow-md",
        tabInactive: "text-stone-600 hover:text-stone-900 hover:bg-[#c5a85c]/10",
        
        aspectContainer: "bg-[#eae2d3] border-[#c5a85c]/30",
        aspectActive: "bg-[#c5a85c] text-white font-black shadow-md scale-[1.02]",
        aspectInactive: "text-stone-600 hover:text-stone-900",
        
        panelBg: "border-[#c5a85c]/25 bg-white/90 shadow-sm",
        innerBox: "bg-[#fcfaf7] border-[#c5a85c]/20",
        innerBoxHeader: "text-[#011c14]",
        innerBoxSub: "text-stone-500",
        
        subTabsContainer: "bg-[#eae2d3] border-[#c5a85c]/20",
        subTabActive: "bg-[#c5a85c] text-white font-black shadow-xs",
        subTabInactive: "text-stone-600 hover:text-stone-900",
        
        selectedCard: "bg-[#c5a85c]/20 border-[#c5a85c] text-[#011c14] shadow-md ring-2 ring-[#c5a85c]/30",
        unselectedCard: "bg-white border-[#c5a85c]/20 text-stone-700 hover:border-[#c5a85c]/50",
        accentText: "text-[#8a6d25]",
        accentBadge: "bg-[#c5a85c]/20 text-[#011c14] border-[#c5a85c]/35",
        
        sliderAccent: "accent-[#c5a85c]",
        sliderTrack: "bg-stone-200 border border-stone-300",
        checkboxAccent: "accent-[#c5a85c]",
        
        quickBtn: "border-[#c5a85c]/50 bg-white hover:bg-[#f5efe0] text-stone-800 shadow-xs border",
        primaryBtn: "bg-[#c5a85c] text-white hover:bg-[#b5984c] font-black shadow-md",
        secondaryBtn: "border-[#c5a85c] text-[#8a6d25] hover:bg-[#c5a85c]/10",
        closeModalBtn: "border-[#c5a85c]/30 bg-white hover:bg-[#f5efe0] text-stone-800",
        
        toggleActive: "bg-[#c5a85c]/15 border-[#c5a85c] text-[#011c14]",
        toggleInactive: "border-[#c5a85c]/20 text-stone-600 bg-white hover:bg-stone-50",
        toggleDotActive: "bg-[#c5a85c]",
        toggleDotInactive: "bg-stone-300",
        statusNotice: "bg-[#c5a85c]/15 text-[#8a6d25] border-[#c5a85c]/30",
      };
    } else if (theme === "navy-velvet") {
      return {
        modalBg: "bg-white text-slate-800 border-[#3F63C6]/20 shadow-2xl",
        headerFooterBg: "bg-slate-50/95 border-[#3F63C6]/15",
        headerIcon: "bg-[#3F63C6]/10 border-[#3F63C6]/25 text-[#2B4C9B]",
        subText: "text-slate-500",
        closeBtn: "border border-[#3F63C6]/30 bg-white text-slate-800 hover:text-red-600 hover:border-red-400 hover:bg-red-50 shadow-xs",
        
        tabContainer: "bg-slate-100/90 border-[#3F63C6]/20",
        tabActive: "bg-[#1E3A8A] text-white font-black shadow-md",
        tabInactive: "text-slate-600 hover:text-slate-900 hover:bg-white/80",
        
        aspectContainer: "bg-slate-100/90 border-[#3F63C6]/20",
        aspectActive: "bg-[#1E3A8A] text-white font-black shadow-md scale-[1.02]",
        aspectInactive: "text-slate-600 hover:text-slate-900",
        
        panelBg: "border-[#3F63C6]/20 bg-slate-50/70",
        innerBox: "bg-white border-[#3F63C6]/20 shadow-xs",
        innerBoxHeader: "text-slate-800 font-bold",
        innerBoxSub: "text-slate-500",
        
        subTabsContainer: "bg-slate-100/80 border-[#3F63C6]/15",
        subTabActive: "bg-[#1E3A8A] text-white font-black shadow-xs",
        subTabInactive: "text-slate-600 hover:text-slate-900",
        
        selectedCard: "bg-[#3F63C6]/10 border-[#1E3A8A] text-[#1E3A8A] shadow-xs ring-2 ring-[#3F63C6]/25",
        unselectedCard: "bg-white border-slate-200 text-slate-700 hover:border-[#3F63C6]/40",
        accentText: "text-[#1E3A8A]",
        accentBadge: "bg-[#3F63C6]/10 text-[#1E3A8A] border-[#3F63C6]/25",
        
        sliderAccent: "accent-[#1E3A8A]",
        sliderTrack: "bg-slate-200 border border-slate-300",
        checkboxAccent: "accent-[#1E3A8A]",
        
        quickBtn: "border-[#3F63C6]/40 bg-white hover:bg-slate-50 text-slate-800 shadow-xs border",
        primaryBtn: "bg-[#1E3A8A] text-white hover:bg-[#172554] font-black shadow-md",
        secondaryBtn: "border-[#1E3A8A]/40 text-[#1E3A8A] hover:bg-[#1E3A8A]/10",
        closeModalBtn: "border-[#3F63C6]/25 bg-white hover:bg-slate-50 text-slate-800",
        
        toggleActive: "bg-[#3F63C6]/15 border-[#1E3A8A] text-[#1E3A8A]",
        toggleInactive: "border-slate-200 text-slate-500 bg-white hover:bg-slate-50",
        toggleDotActive: "bg-[#1E3A8A]",
        toggleDotInactive: "bg-slate-300",
        statusNotice: "bg-[#3F63C6]/10 text-[#1E3A8A] border-[#3F63C6]/25",
      };
    } else if (isDark) {
      return {
        modalBg: "bg-slate-900 text-slate-100 border-slate-800 shadow-2xl",
        headerFooterBg: "bg-slate-950/90 border-slate-800",
        headerIcon: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
        subText: "text-slate-400",
        closeBtn: "border border-slate-700 bg-slate-800 text-slate-100 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/15 shadow-xs",
        
        tabContainer: "bg-slate-950/80 border-slate-800",
        tabActive: "bg-emerald-600 text-white font-black shadow-md",
        tabInactive: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50",
        
        aspectContainer: "bg-slate-950/60 border-slate-800",
        aspectActive: "bg-emerald-600 text-white font-black shadow-md scale-[1.02]",
        aspectInactive: "text-slate-400 hover:text-slate-200",
        
        panelBg: "border-slate-800 bg-slate-900/60",
        innerBox: "bg-slate-950/50 border-slate-800",
        innerBoxHeader: "text-slate-100",
        innerBoxSub: "text-slate-400",
        
        subTabsContainer: "bg-slate-950/60 border-slate-800",
        subTabActive: "bg-emerald-600 text-white font-black shadow-xs",
        subTabInactive: "text-slate-400 hover:text-slate-200",
        
        selectedCard: "bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-md ring-2 ring-emerald-400/20",
        unselectedCard: "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700",
        accentText: "text-emerald-400",
        accentBadge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        
        sliderAccent: "accent-emerald-500",
        sliderTrack: "bg-slate-800",
        checkboxAccent: "accent-emerald-500",
        
        quickBtn: "border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-100 shadow-xs border",
        primaryBtn: "bg-emerald-600 text-white hover:bg-emerald-500 font-black shadow-md",
        secondaryBtn: "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10",
        closeModalBtn: "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300",
        
        toggleActive: "bg-emerald-500/15 border-emerald-400/50 text-emerald-300",
        toggleInactive: "border-slate-800 text-slate-400 bg-slate-950/40 hover:bg-slate-900",
        toggleDotActive: "bg-emerald-400",
        toggleDotInactive: "bg-slate-700",
        statusNotice: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      };
    } else {
      // Light Mode (default emerald-light or clean slate)
      return {
        modalBg: "bg-white text-slate-800 border-emerald-100 shadow-2xl",
        headerFooterBg: "bg-slate-50/95 border-slate-100",
        headerIcon: "bg-emerald-100 text-emerald-800 border-emerald-200",
        subText: "text-slate-500",
        closeBtn: "border border-slate-300 bg-white text-slate-800 hover:text-red-600 hover:border-red-400 hover:bg-red-50 shadow-xs",
        
        tabContainer: "bg-slate-100/90 border-slate-200",
        tabActive: "bg-emerald-600 text-white font-black shadow-md",
        tabInactive: "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50",
        
        aspectContainer: "bg-slate-100/80 border-slate-200",
        aspectActive: "bg-emerald-600 text-white font-black shadow-md scale-[1.02]",
        aspectInactive: "text-slate-600 hover:text-slate-900",
        
        panelBg: "border-slate-200 bg-slate-50/70 shadow-sm",
        innerBox: "bg-white border-slate-200 shadow-xs",
        innerBoxHeader: "text-slate-800",
        innerBoxSub: "text-slate-500",
        
        subTabsContainer: "bg-slate-100 border-slate-200",
        subTabActive: "bg-emerald-600 text-white font-black shadow-xs",
        subTabInactive: "text-slate-600 hover:text-slate-900",
        
        selectedCard: "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-500/20",
        unselectedCard: "bg-white border-slate-200 text-slate-700 hover:border-slate-300",
        accentText: "text-emerald-700 font-bold",
        accentBadge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        
        sliderAccent: "accent-emerald-600",
        sliderTrack: "bg-slate-200 border border-slate-300",
        checkboxAccent: "accent-emerald-600",
        
        quickBtn: "border-slate-300 bg-white hover:bg-slate-100 text-slate-800 shadow-xs border",
        primaryBtn: "bg-emerald-600 text-white hover:bg-emerald-700 font-black shadow-md",
        secondaryBtn: "border-emerald-600/40 text-emerald-700 hover:bg-emerald-50",
        closeModalBtn: "border-slate-200 bg-white hover:bg-slate-100 text-slate-700",
        
        toggleActive: "bg-emerald-50 border-emerald-500 text-emerald-900",
        toggleInactive: "border-slate-200 text-slate-600 bg-white hover:bg-slate-50",
        toggleDotActive: "bg-emerald-600",
        toggleDotInactive: "bg-slate-300",
        statusNotice: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    }
  }, [theme, isDark]);

  // Main Navigation Studio Tabs
  const [activeTab, setActiveTab] = useState<"background" | "frame" | "typography">("typography");

  // Style Defaults Initializer
  const initialStyle = useMemo(() => getInitialShareStyle(theme, isDark), [theme, isDark]);

  // Background Maker State
  const [bgCategory, setBgCategory] = useState<"gradient" | "solid" | "pattern" | "texture" | "none">(() => initialStyle.bgCategory || "solid");
  const [gradientType, setGradientType] = useState<"linear" | "radial">(() => initialStyle.gradientType || "linear");
  const [showPattern, setShowPattern] = useState<boolean>(() => initialStyle.showPattern ?? false);
  const [gradientAngle, setGradientAngle] = useState<number>(() => initialStyle.gradientAngle ?? 135);
  const [radialSpread, setRadialSpread] = useState<number>(() => initialStyle.radialSpread ?? 75);
  const [gradientColor1, setGradientColor1] = useState<string>(() => initialStyle.gradientColor1 || DEFAULT_SHARE_STYLE.gradientColor1 || "#FCFAF7");
  const [gradientColor2, setGradientColor2] = useState<string>(() => initialStyle.gradientColor2 || DEFAULT_SHARE_STYLE.gradientColor2 || "#EFECE6");
  const [selectedSolidColor, setSelectedSolidColor] = useState<string>(() => initialStyle.selectedSolidColor || "#FCFAF7");
  const [selectedPatternId, setSelectedPatternId] = useState<string>(() => initialStyle.selectedPatternId || "islamic-concentric-diamond");
  const [patternOpacity, setPatternOpacity] = useState<number>(() => initialStyle.patternOpacity ?? 0.3);
  const [patternColor, setPatternColor] = useState<string>(() => initialStyle.patternColor || "#D4AF37");

  // Textures & Materials State
  const [selectedTextureId, setSelectedTextureId] = useState<string>(() => initialStyle.selectedTextureId || "texture-leather");
  const [showTexture, setShowTexture] = useState<boolean>(() => initialStyle.showTexture ?? false);
  const [textureOpacity, setTextureOpacity] = useState<number>(() => initialStyle.textureOpacity ?? 0.9);

  // Aspect Ratio
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatioType>(() => initialStyle.selectedAspectRatio || "auto");
  const [customWidth, setCustomWidth] = useState<number>(() => initialStyle.customWidth ?? 1080);
  const [customHeight, setCustomHeight] = useState<number>(() => initialStyle.customHeight ?? 1350);

  // Frames & Borders State
  const [frameSubTab, setFrameSubTab] = useState<"ayah" | "adjust">("ayah");
  const [showAyahFrame, setShowAyahFrame] = useState<boolean>(() => initialStyle.showAyahFrame ?? false);
  const [selectedFrameStyle, setSelectedFrameStyle] = useState<FrameStyleType>(() => initialStyle.selectedFrameStyle || "none");
  const [frameColor, setFrameColor] = useState<string>(() => initialStyle.frameColor || "#D4AF37");
  const [frameWidth, setFrameWidth] = useState<number>(() => initialStyle.frameWidth ?? 2);
  const [frameInset, setFrameInset] = useState<number>(() => initialStyle.frameInset ?? 24);

  // Opening Header (Bismillah) Controls - Independent of Ayah settings
  const [showOpeningHeader, setShowOpeningHeader] = useState<boolean>(() => initialStyle.showOpeningHeader ?? true);
  const [openingHeaderMode, setOpeningHeaderMode] = useState<"auto" | "bismillah" | "surah_frame">(() => (initialStyle.openingHeaderMode === "bismillah" || initialStyle.openingHeaderMode === "surah_frame") ? initialStyle.openingHeaderMode : "auto");
  const [openingHeaderSize, setOpeningHeaderSize] = useState<number>(() => initialStyle.openingHeaderSize ?? 30);
  const [openingHeaderColor, setOpeningHeaderColor] = useState<string>(() => initialStyle.openingHeaderColor || initialStyle.textColor || "#1C1917");
  const [openingHeaderFont, setOpeningHeaderFont] = useState<string>(() => (initialStyle.openingHeaderFont && initialStyle.openingHeaderFont !== "match_ayah" ? initialStyle.openingHeaderFont : "uthman"));

  // Surah Header Frame Controls
  const [showSurahHeaderFrame, setShowSurahHeaderFrame] = useState<boolean>(() => initialStyle.showSurahHeaderFrame ?? true);
  const [surahHeaderStyle, setSurahHeaderStyle] = useState<"authentic" | "classic" | "minimal">(() => initialStyle.surahHeaderStyle || "authentic");
  const [surahHeaderTextColor, setSurahHeaderTextColor] = useState<string>(() => initialStyle.textColor || "#1C1917");
  const [surahHeaderScale, setSurahHeaderScale] = useState<number>(() => initialStyle.surahHeaderScale ?? 100);

  // Typography & Style State
  const [selectedQuranFont, setSelectedQuranFont] = useState<"qcf4" | "amiri" | "uthman" | "cairo">(() => initialStyle.selectedQuranFont || "qcf4");

  // Helper to get the exact font family of verses (for preview and canvas)
  const getAyahFontFamily = (forCanvas: boolean = false) => {
    if (selectedQuranFont === "amiri") {
      return forCanvas ? '"Amiri", serif' : "'Amiri', serif";
    }
    if (selectedQuranFont === "cairo") {
      return forCanvas ? '"Cairo", sans-serif' : "'Cairo', sans-serif";
    }
    // "qcf4" and "uthman" use the King Fahd Complex authentic Uthmanic Hafs font
    return forCanvas
      ? '"UthmanicHafs", "Amiri", serif'
      : "'UthmanicHafs', 'Amiri', serif";
  };
  const savedAyahFontSizeRef = useRef<number>(
    (initialStyle.textFontSize && initialStyle.textFontSize >= 22) ? initialStyle.textFontSize : 28
  );
  const [savedAyahFontSize, setSavedAyahFontSize] = useState<number>(() => {
    return (initialStyle.textFontSize && initialStyle.textFontSize >= 22) ? initialStyle.textFontSize : 28;
  });
  const savedAspectRatioRef = useRef<AspectRatioType>(
    (initialStyle.selectedAspectRatio && initialStyle.selectedAspectRatio !== "9:16")
      ? initialStyle.selectedAspectRatio
      : "auto"
  );

  const [textFontSize, setTextFontSize] = useState<number>(() => {
    const initialMode = shareData?.mode || initialStyle.shareMode || "range";
    if (initialMode === "page") {
      const pageNum = shareData?.pageNumber || initialStyle.selectedPageNumber || 1;
      return (pageNum === 1 || pageNum === 2) ? 18 : 15;
    }
    const saved = initialStyle.textFontSize;
    return (saved && saved >= 22) ? saved : 28;
  });
  const [textShadowOpacity, setTextShadowOpacity] = useState<number>(() => initialStyle.textShadowOpacity ?? 0);
  const [textAlign, setTextAlign] = useState<"justify" | "center" | "right" | "left">(() => initialStyle.textAlign || "justify");
  const [textColor, setTextColor] = useState<string>(() => initialStyle.textColor || "#1C1917");
  const [surahHeaderColor, setSurahHeaderColor] = useState<string>(() => initialStyle.surahHeaderColor || "#C5A85C");
  const [logoColor, setLogoColor] = useState<string | undefined>(() => initialStyle.logoColor || "#1C1917");

  // Metadata State (Istiadhah, Surah Info, Watermark)
  const [showIstiadhah, setShowIstiadhah] = useState<boolean>(() => initialStyle.showIstiadhah ?? false);
  const [istiadhahColor, setIstiadhahColor] = useState<string>(() => initialStyle.istiadhahColor || initialStyle.textColor || "#1C1917");
  const [istiadhahSize, setIstiadhahSize] = useState<number>(() => initialStyle.istiadhahSize ?? 38);
  const [showSurahInfo, setShowSurahInfo] = useState<boolean>(() => initialStyle.showSurahInfo ?? false);
  const [showWatermark, setShowWatermark] = useState<boolean>(() => initialStyle.showWatermark ?? true);

  // Element Offsets & Positions (تحريك العناصر)
  const [textOffsetY, setTextOffsetY] = useState<number>(() => initialStyle.textOffsetY ?? 0);
  const [textOffsetX, setTextOffsetX] = useState<number>(() => initialStyle.textOffsetX ?? 0);
  const [surahHeaderOffsetY, setSurahHeaderOffsetY] = useState<number>(() => initialStyle.surahHeaderOffsetY ?? 0);
  const [surahHeaderOffsetX, setSurahHeaderOffsetX] = useState<number>(() => initialStyle.surahHeaderOffsetX ?? 0);
  const [surahInfoOffsetY, setSurahInfoOffsetY] = useState<number>(() => initialStyle.surahInfoOffsetY ?? 0);
  const [surahInfoOffsetX, setSurahInfoOffsetX] = useState<number>(() => initialStyle.surahInfoOffsetX ?? 0);
  const [watermarkOffsetY, setWatermarkOffsetY] = useState<number>(() => initialStyle.watermarkOffsetY ?? 0);
  const [watermarkOffsetX, setWatermarkOffsetX] = useState<number>(() => initialStyle.watermarkOffsetX ?? 0);
  const [surahInfoScale, setSurahInfoScale] = useState<number>(() => initialStyle.surahInfoScale ?? 100);
  const [watermarkScale, setWatermarkScale] = useState<number>(() => initialStyle.watermarkScale ?? 100);
  const [ayahScale, setAyahScale] = useState<number>(100);
  const [showAyahText, setShowAyahText] = useState<boolean>(() => initialStyle.showAyahText ?? true);

  // Layer Rotation Angles (تدوير العناصر بالدرجات)
  const [textRotation, setTextRotation] = useState<number>(0);
  const [surahHeaderRotation, setSurahHeaderRotation] = useState<number>(0);
  const [surahInfoRotation, setSurahInfoRotation] = useState<number>(0);
  const [watermarkRotation, setWatermarkRotation] = useState<number>(0);

  // Active Selected Layer for touch/finger controls
  const [selectedLayer, setSelectedLayer] = useState<"ayah" | "header" | "info" | "watermark" | null>(null);
  const [deletedLayerNotice, setDeletedLayerNotice] = useState<{ layer: "ayah" | "header" | "info" | "watermark"; name: string } | null>(null);

  // QCF4 Font Glyphs for authentic Quranic rendering
  const [qcf4Words, setQcf4Words] = useState<Qcf4Word[]>([]);
  const [qcf4Lines, setQcf4Lines] = useState<Qcf4Line[]>([]);
  const [pageSurahSections, setPageSurahSections] = useState<{
    surahNumber: number;
    surahName: string;
    ayahsText: string;
  }[]>([]);
  const [qcf4Font, setQcf4Font] = useState<string>("QCF4_Hafs_01");
  const [isQcf4Loaded, setIsQcf4Loaded] = useState<boolean>(false);
  const [qbsmlReady, setQbsmlReady] = useState<boolean>(() => isQbsmlLoaded());

  // Default Style Saved Toast State
  const [isDefaultSaved, setIsDefaultSaved] = useState<boolean>(true);

  // Automatically ensure current styling is saved as the default format
  useEffect(() => {
    try {
      const currentFullStyle: SavedShareStyle = {
        bgCategory,
        gradientType,
        gradientAngle,
        radialSpread,
        gradientColor1,
        gradientColor2,
        selectedSolidColor,
        selectedPatternId,
        showPattern,
        patternOpacity,
        patternColor,
        selectedTextureId,
        showTexture,
        textureOpacity,
        selectedAspectRatio,
        customWidth,
        customHeight,
        showAyahFrame,
        selectedFrameStyle,
        frameColor,
        frameWidth,
        frameInset,
        showOpeningHeader,
        openingHeaderMode,
        openingHeaderSize,
        openingHeaderColor,
        openingHeaderFont,
        showSurahHeaderFrame,
        surahHeaderStyle,
        surahHeaderColor,
        surahHeaderTextColor,
        surahHeaderScale,
        selectedQuranFont,
        textFontSize: shareMode === "page" ? Math.max(26, savedAyahFontSizeRef.current || 28) : Math.max(22, textFontSize),
        textShadowOpacity,
        textAlign,
        textColor,
        logoColor,
        showIstiadhah,
        istiadhahColor,
        istiadhahSize,
        showSurahInfo,
        showWatermark,
        surahInfoOffsetY,
        surahInfoOffsetX,
        surahInfoScale,
        watermarkOffsetY,
        watermarkOffsetX,
        watermarkScale,
        textOffsetY,
        textOffsetX,
        showAyahText,
        surahHeaderOffsetY,
        surahHeaderOffsetX,
      };
      localStorage.setItem(LOCAL_SHARE_STYLE_KEY, JSON.stringify(currentFullStyle));
      localStorage.setItem(USER_CUSTOM_DEFAULT_STYLE_KEY, JSON.stringify(currentFullStyle));
      localStorage.setItem("quran_share_default_style_v1", JSON.stringify(currentFullStyle));
      localStorage.setItem("quran_share_user_custom_default_v1", JSON.stringify(currentFullStyle));
    } catch {}
  }, []);

  // Auto-persist user's chosen default styling across shares
  useEffect(() => {
    try {
      const styleToSave: SavedShareStyle = {
        bgCategory,
        gradientType,
        gradientAngle,
        radialSpread,
        gradientColor1,
        gradientColor2,
        selectedSolidColor,
        selectedPatternId,
        showPattern,
        patternOpacity,
        patternColor,
        selectedTextureId,
        showTexture,
        textureOpacity,
        selectedAspectRatio,
        customWidth,
        customHeight,
        showAyahFrame,
        selectedFrameStyle,
        frameColor,
        frameWidth,
        frameInset,
        showOpeningHeader,
        openingHeaderMode,
        openingHeaderSize,
        openingHeaderColor,
        openingHeaderFont,
        showSurahHeaderFrame,
        surahHeaderStyle,
        surahHeaderColor,
        surahHeaderTextColor,
        surahHeaderScale,
        selectedQuranFont,
        textFontSize: shareMode === "page" ? Math.max(26, savedAyahFontSizeRef.current || 28) : Math.max(22, textFontSize),
        textShadowOpacity,
        textAlign,
        textColor,
        logoColor,
        showIstiadhah,
        istiadhahColor,
        istiadhahSize,
        showSurahInfo,
        showWatermark,
        surahInfoOffsetY,
        surahInfoOffsetX,
        surahInfoScale,
        watermarkOffsetY,
        watermarkOffsetX,
        watermarkScale,
        textOffsetY,
        textOffsetX,
        showAyahText,
        surahHeaderOffsetY,
        surahHeaderOffsetX,
      };
      localStorage.setItem(LOCAL_SHARE_STYLE_KEY, JSON.stringify(styleToSave));
      localStorage.setItem(USER_CUSTOM_DEFAULT_STYLE_KEY, JSON.stringify(styleToSave));
      localStorage.setItem("quran_share_default_style_v1", JSON.stringify(styleToSave));
      localStorage.setItem("quran_share_user_custom_default_v1", JSON.stringify(styleToSave));
    } catch (e) {
      console.warn("Failed to auto-save share style:", e);
    }
  }, [
    bgCategory,
    gradientType,
    gradientAngle,
    radialSpread,
    gradientColor1,
    gradientColor2,
    selectedSolidColor,
    selectedPatternId,
    showPattern,
    patternOpacity,
    patternColor,
    selectedTextureId,
    showTexture,
    textureOpacity,
    selectedAspectRatio,
    customWidth,
    customHeight,
    showAyahFrame,
    selectedFrameStyle,
    frameColor,
    frameWidth,
    frameInset,
    showOpeningHeader,
    openingHeaderMode,
    openingHeaderSize,
    openingHeaderColor,
    openingHeaderFont,
    showSurahHeaderFrame,
    surahHeaderStyle,
    surahHeaderColor,
    surahHeaderTextColor,
    surahHeaderScale,
    selectedQuranFont,
    textFontSize,
    textShadowOpacity,
    textAlign,
    textColor,
    logoColor,
    showIstiadhah,
    istiadhahColor,
    istiadhahSize,
    showSurahInfo,
    showWatermark,
    surahInfoOffsetY,
    surahInfoOffsetX,
    surahInfoScale,
    watermarkOffsetY,
    watermarkOffsetX,
    watermarkScale,
    textOffsetY,
    textOffsetX,
    showAyahText,
    surahHeaderOffsetY,
    surahHeaderOffsetX,
  ]);

  // Active Dragging Element Indicator
  const [isDraggingElement, setIsDraggingElement] = useState<string | null>(null);
  // Movement Lock State (Default: unlocked for interactive fingertip controls)
  const [isMovementLocked, setIsMovementLocked] = useState<boolean>(false);

  // Surah & Ayah Selector State
  const [currentShareData, setCurrentShareData] = useState<ShareAyahData | null>(shareData);
  const [shareMode, setShareMode] = useState<"single" | "range" | "page">(() => shareData?.mode || initialStyle.shareMode || "range");
  const [rangeFrom, setRangeFrom] = useState<number>(() => shareData?.ayah?.numberInSurah || initialStyle.rangeFrom || 1);
  const [rangeTo, setRangeTo] = useState<number>(() => shareData?.ayahTo || initialStyle.rangeTo || 1);
  const [selectedPageNumber, setSelectedPageNumber] = useState<number>(() => shareData?.pageNumber || shareData?.ayah?.page || initialStyle.selectedPageNumber || 1);
  const [isLoadingVerse, setIsLoadingVerse] = useState<boolean>(false);
  const [isSurahDropdownOpen, setIsSurahDropdownOpen] = useState<boolean>(false);
  const [surahSearchQuery, setSurahSearchQuery] = useState<string>("");

  // Synchronize when shareData prop changes
  useEffect(() => {
    if (shareData) {
      let initialMode = shareData.mode || initialStyle.shareMode || "range";
      let fromNum = shareData.ayah?.numberInSurah || initialStyle.rangeFrom || 40;
      let toNum = shareData.ayahTo || initialStyle.rangeTo || 41;
      let pageNum = shareData.pageNumber || shareData.ayah?.page || initialStyle.selectedPageNumber || 260;
      let targetSurahNum = shareData.surahNumber || initialStyle.defaultSurahNumber || 14;
      let targetSurahName = shareData.surahName || initialStyle.defaultSurahName || "ابراهيم";

      // If opened generically from nav (isNavDefaultOpen) or no specific verse text passed:
      if (shareData.isNavDefaultOpen) {
        try {
          const savedAyahRaw = localStorage.getItem(DEFAULT_SHARE_AYAH_KEY);
          const savedStyleRaw = localStorage.getItem(USER_CUSTOM_DEFAULT_STYLE_KEY) || localStorage.getItem(LOCAL_SHARE_STYLE_KEY);
          if (savedAyahRaw) {
            const parsed = JSON.parse(savedAyahRaw);
            if (parsed.mode) initialMode = parsed.mode;
            if (parsed.surahNumber) targetSurahNum = Number(parsed.surahNumber);
            if (parsed.ayahNumber) fromNum = Number(parsed.ayahNumber);
            if (parsed.rangeTo) toNum = Number(parsed.rangeTo);
            if (parsed.pageNumber) pageNum = Number(parsed.pageNumber);
          } else if (savedStyleRaw) {
            const parsed = JSON.parse(savedStyleRaw);
            if (parsed.shareMode) initialMode = parsed.shareMode;
            if (parsed.defaultSurahNumber) targetSurahNum = Number(parsed.defaultSurahNumber);
            if (parsed.defaultAyahNumber) fromNum = Number(parsed.defaultAyahNumber);
            if (parsed.rangeTo) toNum = Number(parsed.rangeTo);
            if (parsed.selectedPageNumber) pageNum = Number(parsed.selectedPageNumber);
          }
          const foundSurah = surahsList.find((s) => s.number === targetSurahNum);
          if (foundSurah) targetSurahName = foundSurah.name;
        } catch {}
      }

      setShareMode(initialMode);
      if (initialMode === "page") {
        setTextFontSize((pageNum === 1 || pageNum === 2) ? 18 : 15);
      } else {
        setQcf4Lines([]);
      }
      setRangeFrom(fromNum);
      setRangeTo(toNum);
      setSelectedPageNumber(pageNum);
      setActiveTab("typography");

      // Reset all manual drag offsets so the verse is perfectly centered
      setTextOffsetY(0);
      setTextOffsetX(0);
      setSurahHeaderOffsetY(0);
      setSurahHeaderOffsetX(0);
      setSurahInfoOffsetY(0);
      setSurahInfoOffsetX(0);
      setWatermarkOffsetY(0);
      setWatermarkOffsetX(0);

      // Set currentShareData immediately so the card renders instantly without waiting for network
      setCurrentShareData({
        ...shareData,
        surahNumber: targetSurahNum,
        surahName: targetSurahName,
        mode: initialMode,
        ayah: {
          ...shareData.ayah,
          numberInSurah: fromNum,
          text: shareData.ayah?.text || "",
          page: pageNum,
        },
        ayahTo: toNum,
        pageNumber: pageNum,
      });

      if (initialMode === "page") {
        handleChangePage(pageNum, false);
      } else if (initialMode === "range") {
        handleChangeRange(targetSurahNum, fromNum, toNum);
      } else {
        if (!shareData.ayah?.text || shareData.isNavDefaultOpen) {
          handleChangeVerse(targetSurahNum, fromNum);
        }
      }
    }
  }, [shareData]);

  const activeData = currentShareData || shareData;

  // Dynamic Auto-sizing: Adjusts dimensions and typography automatically to fit verse length
  const autoDimensions = useMemo(() => {
    const rawText = activeData?.ayah?.text || "";
    const wordCount = qcf4Words?.length || 0;
    // Calculate reliable character length, using word count or range as fallback if rawText is pending
    const effectiveCharLen = rawText.length > 0
      ? rawText.length
      : (wordCount > 0
          ? wordCount * 6.5
          : (shareMode === "range" ? Math.max(1, (rangeTo - rangeFrom + 1)) * 70 : 100));

    const isOpeningMushafPage =
      shareMode === "page" && (selectedPageNumber === 1 || selectedPageNumber === 2);

    if (shareMode === "page") {
      return {
        width: 1080,
        height: isOpeningMushafPage ? 1400 : 1920,
        ratioClass: "h-auto min-h-[460px]",
        aspectStyle: undefined,
        fontSize: isOpeningMushafPage ? 20 : 15,
        isTall: true,
        label: isOpeningMushafPage ? "صفحة البداية (الفاتحة / البقرة)" : "صفحة المصحف",
      };
    }

    // Dynamic height scaling smoothly according to verse length without rigid height constraints
    const estimatedHeight = Math.max(
      240,
      Math.min(4200, Math.round(150 + (effectiveCharLen * 1.45) + (showSurahHeaderFrame ? 85 : 0) + (showOpeningHeader ? 60 : 0) + (showWatermark ? 65 : 0) + (showSurahInfo ? 25 : 0)))
    );

    return {
      width: 1080,
      height: estimatedHeight,
      ratioClass: "h-auto min-h-[220px]",
      aspectStyle: undefined,
      fontSize: effectiveCharLen > 500 ? 22 : effectiveCharLen > 250 ? 26 : 28,
      isTall: estimatedHeight > 1080,
      label: "تمدد تلقائي متجاوب",
    };
  }, [activeData, shareMode, rangeFrom, rangeTo, selectedPageNumber, qcf4Words, showSurahHeaderFrame, showOpeningHeader, showSurahInfo, showWatermark]);

  const currentSurahObj = useMemo(() => {
    if (!activeData) return surahsList[0];
    return surahsList.find((s) => s.number === activeData.surahNumber) || surahsList[0];
  }, [activeData]);

  const filteredSurahs = useMemo(() => {
    if (!surahSearchQuery.trim()) return surahsList;
    const q = surahSearchQuery.trim().toLowerCase();
    return surahsList.filter(
      (s) =>
        s.name.includes(q) ||
        s.number.toString().includes(q) ||
        s.englishName.toLowerCase().includes(q)
    );
  }, [surahSearchQuery]);

  // Explicit Save as Default Handler (Saves both full styling and active card ayahs)
  const handleSaveAsDefault = () => {
    try {
      const curSurahNum = activeData?.surahNumber || initialStyle.defaultSurahNumber || 1;
      const curSurahName = activeData?.surahName || initialStyle.defaultSurahName || "الفاتحة";
      const curAyahNum = activeData?.ayah?.numberInSurah || initialStyle.defaultAyahNumber || 1;

      const currentFullStyle: SavedShareStyle = {
        bgCategory,
        gradientType,
        gradientAngle,
        radialSpread,
        gradientColor1,
        gradientColor2,
        selectedSolidColor,
        selectedPatternId,
        showPattern,
        patternOpacity,
        patternColor,
        selectedTextureId,
        showTexture,
        textureOpacity,
        selectedAspectRatio,
        customWidth,
        customHeight,
        showAyahFrame,
        selectedFrameStyle,
        frameColor,
        frameWidth,
        frameInset,
        showOpeningHeader,
        openingHeaderMode,
        openingHeaderSize,
        openingHeaderColor,
        openingHeaderFont,
        showSurahHeaderFrame,
        surahHeaderStyle,
        surahHeaderColor,
        surahHeaderTextColor,
        surahHeaderScale,
        selectedQuranFont,
        textFontSize,
        textShadowOpacity,
        textAlign,
        textColor,
        logoColor,
        showIstiadhah,
        istiadhahColor,
        istiadhahSize,
        showSurahInfo,
        showWatermark,
        surahInfoOffsetY,
        surahInfoOffsetX,
        watermarkOffsetY,
        watermarkOffsetX,
        textOffsetY,
        textOffsetX,
        surahHeaderOffsetY,
        surahHeaderOffsetX,
        shareMode,
        defaultSurahNumber: curSurahNum,
        defaultSurahName: curSurahName,
        defaultAyahNumber: curAyahNum,
        rangeFrom,
        rangeTo,
        selectedPageNumber,
      };

      const defaultAyahConfig = {
        mode: shareMode,
        surahNumber: curSurahNum,
        surahName: curSurahName,
        ayahNumber: curAyahNum,
        rangeFrom,
        rangeTo,
        pageNumber: selectedPageNumber,
      };

      localStorage.setItem(LOCAL_SHARE_STYLE_KEY, JSON.stringify(currentFullStyle));
      localStorage.setItem(USER_CUSTOM_DEFAULT_STYLE_KEY, JSON.stringify(currentFullStyle));
      localStorage.setItem("quran_share_default_style_v1", JSON.stringify(currentFullStyle));
      localStorage.setItem("quran_share_user_custom_default_v1", JSON.stringify(currentFullStyle));
      localStorage.setItem(DEFAULT_SHARE_AYAH_KEY, JSON.stringify(defaultAyahConfig));
      setIsDefaultSaved(true);
      setShareStatus("تم حفظ هذه البطاقة وهذا التنسيق وهذه الآيات كافتراضي لصفحة المشاركة بنجاح ✨");
      setTimeout(() => {
        setShareStatus(null);
      }, 3500);
    } catch (e) {
      console.warn("Failed to save custom default share style:", e);
    }
  };

  const handleChangeVerse = async (newSurahNum: number, newAyahNum: number) => {
    const targetSurah = surahsList.find((s) => s.number === newSurahNum) || surahsList[0];
    const safeAyahNum = Math.max(1, Math.min(newAyahNum, targetSurah.numberOfAyahs));
    setShareMode("single");
    setQcf4Lines([]);

    // Restore comfortable verse font size if it was shrunk by page mode
    setTextFontSize((prevSize) => {
      if (prevSize < 22) {
        return Math.max(26, savedAyahFontSizeRef.current || 28);
      }
      return prevSize;
    });

    // Immediately update state with single ayah and clear stale multi-ayah text
    setCurrentShareData((prev) => ({
      mode: "single",
      surahNumber: targetSurah.number,
      surahName: targetSurah.name,
      ayah: {
        numberInSurah: safeAyahNum,
        text: (prev?.surahNumber === targetSurah.number && prev?.ayah?.numberInSurah === safeAyahNum && prev?.mode === "single") ? prev.ayah.text : "",
        page: prev?.ayah?.page || getSurahStartPage(newSurahNum),
        juz: prev?.ayah?.juz,
      },
    }));

    setIsLoadingVerse(true);
    try {
      let verseText = "";
      let pageNum: number | undefined;
      let juzNum: number | undefined;

      try {
        const res = await fetchAlquranCloud(`v1/ayah/${newSurahNum}:${safeAyahNum}/quran-uthmani`);
        if (res?.data?.text) {
          verseText = res.data.text;
          pageNum = res.data.page;
          juzNum = res.data.juz;
        } else {
          const fallbackRes = await fetchAlquranCloud(`v1/ayah/${newSurahNum}:${safeAyahNum}`);
          if (fallbackRes?.data?.text) {
            verseText = fallbackRes.data.text;
            pageNum = fallbackRes.data.page;
            juzNum = fallbackRes.data.juz;
          }
        }
      } catch (netErr) {
        console.warn("ShareAyahModal network fetch failed, using offline QCF4 data:", netErr);
      }

      // Offline local reconstruction
      if (!verseText) {
        try {
          const qcfRes = await fetchQcf4VerseWords(newSurahNum, safeAyahNum);
          if (qcfRes?.words && qcfRes.words.length > 0) {
            verseText = qcfRes.words
              .filter((w) => w.type === "word")
              .map((w) => w.char || w.text || "")
              .join(" ");
            pageNum = qcfRes.page;
          }
        } catch (e) {
          console.warn("Offline QCF verse fetch:", e);
        }
      }

      if (!pageNum) {
        pageNum = getSurahStartPage(newSurahNum);
      }

      setCurrentShareData({
        mode: "single",
        surahNumber: targetSurah.number,
        surahName: targetSurah.name,
        ayah: {
          numberInSurah: safeAyahNum,
          text: verseText || `سورة ${targetSurah.name} - الآية ${safeAyahNum}`,
          page: pageNum,
          juz: juzNum,
        },
      });
    } catch (err) {
      console.warn("Failed to load ayah in share modal:", err);
    } finally {
      setIsLoadingVerse(false);
    }
  };

  const handleChangeRange = async (newSurahNum: number, fromAyah: number, toAyah: number) => {
    const targetSurah = surahsList.find((s) => s.number === newSurahNum) || surahsList[0];
    const safeFrom = Math.max(1, Math.min(fromAyah, targetSurah.numberOfAyahs));
    const safeTo = Math.max(safeFrom, Math.min(toAyah, targetSurah.numberOfAyahs));
    setRangeFrom(safeFrom);
    setRangeTo(safeTo);
    setShareMode("range");
    setQcf4Lines([]);

    // Restore comfortable verse font size if it was shrunk by page mode
    setTextFontSize((prevSize) => {
      if (prevSize < 22) {
        return Math.max(26, savedAyahFontSizeRef.current || 28);
      }
      return prevSize;
    });

    setCurrentShareData((prev) => ({
      mode: "range",
      surahNumber: targetSurah.number,
      surahName: targetSurah.name,
      ayah: {
        numberInSurah: safeFrom,
        text: (prev?.surahNumber === targetSurah.number && prev?.mode === "range" && prev?.ayah?.numberInSurah === safeFrom) ? prev.ayah.text : "",
        page: prev?.ayah?.page || getSurahStartPage(newSurahNum),
        juz: prev?.ayah?.juz,
      },
      ayahTo: safeTo,
    }));

    setIsLoadingVerse(true);
    try {
      let combinedText = "";
      let firstAyahPage: number | undefined;
      let firstAyahJuz: number | undefined;

      try {
        const res = await fetchAlquranCloud(`v1/surah/${newSurahNum}/quran-uthmani`);
        if (res?.data?.ayahs && Array.isArray(res.data.ayahs)) {
          const selectedAyahs = res.data.ayahs.filter(
            (a: any) => a.numberInSurah >= safeFrom && a.numberInSurah <= safeTo
          );
          if (selectedAyahs.length > 0) {
            combinedText = selectedAyahs
              .map((a: any) => `${a.text} ﴿${toArabicNumerals(a.numberInSurah)}﴾`)
              .join(" ");
            firstAyahPage = selectedAyahs[0]?.page;
            firstAyahJuz = selectedAyahs[0]?.juz;
          }
        }
      } catch (netErr) {
        console.warn("ShareAyahModal range network fetch failed, using offline QCF4 data:", netErr);
      }

      // Offline local reconstruction for Range
      if (!combinedText) {
        try {
          const rangeTexts: string[] = [];
          for (let aNum = safeFrom; aNum <= safeTo; aNum++) {
            const qcfRes = await fetchQcf4VerseWords(newSurahNum, aNum);
            if (qcfRes?.words && qcfRes.words.length > 0) {
              const aText = qcfRes.words
                .filter((w) => w.type === "word")
                .map((w) => w.char || w.text || "")
                .join(" ");
              if (aText) {
                rangeTexts.push(`${aText} ﴿${toArabicNumerals(aNum)}﴾`);
              }
              if (!firstAyahPage && qcfRes.page) {
                firstAyahPage = qcfRes.page;
              }
            }
          }
          if (rangeTexts.length > 0) {
            combinedText = rangeTexts.join(" ");
          }
        } catch (e) {
          console.warn("Offline QCF range fetch:", e);
        }
      }

      setCurrentShareData({
        mode: "range",
        surahNumber: targetSurah.number,
        surahName: targetSurah.name,
        ayah: {
          numberInSurah: safeFrom,
          text: combinedText || `سورة ${targetSurah.name} : الآيات ${safeFrom}-${safeTo}`,
          page: firstAyahPage || getSurahStartPage(newSurahNum),
          juz: firstAyahJuz,
        },
        ayahTo: safeTo,
      });
    } catch (err) {
      console.warn("Failed to load range in share modal:", err);
    } finally {
      setIsLoadingVerse(false);
    }
  };

  const applyPageDefaults = (targetPageNum?: number) => {
    if (textFontSize >= 22) {
      savedAyahFontSizeRef.current = textFontSize;
      setSavedAyahFontSize(textFontSize);
    }
    if (selectedAspectRatio !== "9:16") {
      savedAspectRatioRef.current = selectedAspectRatio;
    }
    setSelectedAspectRatio("9:16");
    setSelectedFrameStyle("none");
    setShowWatermark(true);
    setShowSurahInfo(false);
    setShowSurahHeaderFrame(true);
    setShowIstiadhah(false);
    setShowOpeningHeader(true);
    setOpeningHeaderMode("auto");
    setQcf4Lines([]);
    // Page 1 and Page 2 have fewer words, so use slightly larger, authentic typography
    if (targetPageNum === 1 || targetPageNum === 2) {
      setTextFontSize(20);
    } else {
      setTextFontSize(16);
    }
    setTextOffsetX(0);
    setTextOffsetY(0);
    setSurahHeaderOffsetX(0);
    setSurahHeaderOffsetY(0);
    setSurahInfoOffsetX(0);
    setSurahInfoOffsetY(0);
    setWatermarkOffsetX(0);
    setWatermarkOffsetY(0);
  };

  const handleChangePage = async (newPageNum: number, applyDefaults = true) => {
    const safePage = Math.max(1, Math.min(newPageNum, 604));
    setSelectedPageNumber(safePage);
    setShareMode("page");

    if (textFontSize >= 22) {
      savedAyahFontSizeRef.current = textFontSize;
      setSavedAyahFontSize(textFontSize);
    }
    if (selectedAspectRatio !== "9:16") {
      savedAspectRatioRef.current = selectedAspectRatio;
    }

    if (applyDefaults) {
      applyPageDefaults(safePage);
    } else {
      setShowWatermark(true);
      setShowSurahHeaderFrame(true);
      setShowIstiadhah(false);
      setShowSurahInfo(false);
      setTextFontSize((safePage === 1 || safePage === 2) ? 18 : 15);
    }

    const pageMeta = quranSvgPageMetadata.find((p) => p.page === safePage);
    const surahNumber = pageMeta?.surahNumber || 1;
    const surahName = pageMeta?.surahNameAr || "الفاتحة";

    setIsLoadingVerse(true);
    try {
      // 1. Fetch authentic QCF4 page lines and preload fonts immediately
      let pageData: Qcf4PageData | null = null;
      try {
        pageData = await fetchQcf4Page(safePage);
        if (pageData?.lines && pageData.lines.length > 0) {
          const fontNames = new Set<string>();
          if (pageData.font) fontNames.add(pageData.font);
          fontNames.add("QCF4_QBSML");
          pageData.lines.forEach((l) => {
            l.words?.forEach((w) => {
              if (w.font) fontNames.add(w.font);
            });
          });
          await Promise.all(Array.from(fontNames).map((f) => loadQcf4Font(f)));
          if (document.fonts) {
            await document.fonts.ready;
          }

          const words: Qcf4Word[] = [];
          pageData.lines.forEach((l) => {
            l.words?.forEach((w) => {
              if (w.type !== "surah_header" && w.type !== "bismillah") {
                words.push(w);
              }
            });
          });

          setQcf4Lines(pageData.lines);
          setQcf4Words(words);
          setQcf4Font(pageData.font || "QCF4_Hafs_01");
          setIsQcf4Loaded(true);
        }
      } catch (qcfErr) {
        console.warn("Offline QCF page fetch error:", qcfErr);
      }

      let combinedText = "";
      const sections: { surahNumber: number; surahName: string; ayahsText: string }[] = [];

      try {
        const res = await fetchAlquranCloud(`v1/page/${safePage}/quran-uthmani`);
        if (res?.data?.ayahs && Array.isArray(res.data.ayahs)) {
          const pageAyahs = res.data.ayahs;
          combinedText = pageAyahs
            .map((a: any) => `${a.text} ﴿${toArabicNumerals(a.numberInSurah)}﴾`)
            .join(" ");

          let curSection: { surahNumber: number; surahName: string; ayahsText: string } | null = null;
          pageAyahs.forEach((a: any) => {
            const sNum = a.surah?.number || surahNumber;
            const sName = a.surah?.name || surahName;
            if (!curSection || curSection.surahNumber !== sNum) {
              if (curSection) sections.push(curSection);
              curSection = {
                surahNumber: sNum,
                surahName: sName,
                ayahsText: `${a.text} ﴿${toArabicNumerals(a.numberInSurah)}﴾`,
              };
            } else {
              curSection.ayahsText += ` ${a.text} ﴿${toArabicNumerals(a.numberInSurah)}﴾`;
            }
          });
          if (curSection) sections.push(curSection);
        }
      } catch (netErr) {
        console.warn("ShareAyahModal page network fetch failed, using offline QCF4 data:", netErr);
      }

      // Offline local reconstruction for full Page
      if (!combinedText && pageData?.lines) {
        const pageWords: string[] = [];
        let curSec: { surahNumber: number; surahName: string; ayahsText: string } | null = null;

        pageData.lines.forEach((l) => {
          l.words?.forEach((w) => {
            if (w.type === "word" && (w.char || w.text)) {
              pageWords.push(w.char || w.text || "");
              if (w.verse_key) {
                const [sNum] = w.verse_key.split(":").map(Number);
                if (sNum) {
                  const found = surahsList.find((s) => s.number === sNum);
                  const sName = found ? found.name : `سورة ${sNum}`;
                  if (!curSec || curSec.surahNumber !== sNum) {
                    if (curSec) sections.push(curSec);
                    curSec = { surahNumber: sNum, surahName: sName, ayahsText: w.char || w.text || "" };
                  } else {
                    curSec.ayahsText += ` ${w.char || w.text || ""}`;
                  }
                }
              }
            } else if (w.type === "end") {
              pageWords.push(w.char || "۝");
              if (curSec) curSec.ayahsText += ` ${w.char || "۝"}`;
            }
          });
        });
        if (curSec) sections.push(curSec);
        if (pageWords.length > 0) {
          combinedText = pageWords.join(" ");
        }
      }

      setPageSurahSections(sections);

      setCurrentShareData({
        mode: "page",
        pageNumber: safePage,
        surahNumber,
        surahName,
        ayah: {
          numberInSurah: 1,
          text: combinedText || `صفحة رقم ${safePage} من القرآن الكريم`,
          page: safePage,
          juz: pageMeta?.juz || 1,
        },
      });
    } catch (err) {
      console.warn("Failed to load page in share modal:", err);
    } finally {
      setIsLoadingVerse(false);
    }
  };

  // Reference for Multi-Touch Pinch to Zoom Gestures (بالأصابع)
  const touchPinchRef = useRef<{
    isPinching: boolean;
    startDist: number;
    targetLayer: "ayah" | "header" | "info" | "watermark";
    initialFontSize: number;
    initialHeaderScale: number;
    initialInfoScale: number;
    initialWatermarkScale: number;
    initialHeaderSize: number;
  }>({
    isPinching: false,
    startDist: 0,
    targetLayer: "ayah",
    initialFontSize: 28,
    initialHeaderScale: 100,
    initialInfoScale: 100,
    initialWatermarkScale: 100,
    initialHeaderSize: 30,
  });

  const handleCardTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isMovementLocked) return;
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      let target: "ayah" | "header" | "info" | "watermark" = selectedLayer || "ayah";
      try {
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const elUnder = document.elementFromPoint(midX, midY) as HTMLElement | null;
        const layerAttr = elUnder?.closest("[data-layer]")?.getAttribute("data-layer") as
          | "ayah"
          | "header"
          | "info"
          | "watermark"
          | null;
        if (layerAttr) {
          target = layerAttr;
          setSelectedLayer(layerAttr);
        }
      } catch {
        // fallback
      }

      touchPinchRef.current = {
        isPinching: true,
        startDist: dist,
        targetLayer: target,
        initialFontSize: textFontSize,
        initialHeaderScale: surahHeaderScale || 100,
        initialInfoScale: surahInfoScale || 100,
        initialWatermarkScale: watermarkScale || 100,
        initialHeaderSize: openingHeaderSize || 30,
      };
    }
  };

  const handleCardTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isMovementLocked || !touchPinchRef.current.isPinching) return;
    if (e.touches.length === 2) {
      try {
        e.preventDefault();
      } catch {
        // ignore passive event warning
      }
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const factor = dist / Math.max(10, touchPinchRef.current.startDist);

      const target = touchPinchRef.current.targetLayer;
      if (target === "ayah") {
        const newSize = Math.round(
          Math.max(shareMode === "page" ? 8 : 12, Math.min(shareMode === "page" ? 24 : 52, touchPinchRef.current.initialFontSize * factor))
        );
        setTextFontSize(newSize);
      } else if (target === "header") {
        const newScale = Math.round(Math.max(40, Math.min(220, touchPinchRef.current.initialHeaderScale * factor)));
        setSurahHeaderScale(newScale);
        const newHeaderSize = Math.round(Math.max(14, Math.min(54, touchPinchRef.current.initialHeaderSize * factor)));
        setOpeningHeaderSize(newHeaderSize);
      } else if (target === "info") {
        const newScale = Math.round(Math.max(50, Math.min(200, touchPinchRef.current.initialInfoScale * factor)));
        setSurahInfoScale(newScale);
      } else if (target === "watermark") {
        const newScale = Math.round(Math.max(50, Math.min(200, touchPinchRef.current.initialWatermarkScale * factor)));
        setWatermarkScale(newScale);
      }
    }
  };

  const handleCardTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2 && touchPinchRef.current.isPinching) {
      touchPinchRef.current.isPinching = false;
    }
  };

  const handleScaleLayer = (element: "ayah" | "header" | "info" | "watermark", delta: 1 | -1) => {
    if (element === "ayah") {
      setTextFontSize((prev) => Math.max(shareMode === "page" ? 8 : 12, Math.min(shareMode === "page" ? 24 : 52, prev + delta * 2)));
    } else if (element === "header") {
      setSurahHeaderScale((prev) => Math.max(40, Math.min(220, (prev || 100) + delta * 10)));
      setOpeningHeaderSize((prev) => Math.max(14, Math.min(54, (prev || 30) + delta * 2)));
    } else if (element === "info") {
      setSurahInfoScale((prev) => Math.max(50, Math.min(200, (prev || 100) + delta * 10)));
    } else if (element === "watermark") {
      setWatermarkScale((prev) => Math.max(50, Math.min(200, (prev || 100) + delta * 10)));
    }
  };

  const handleResetLayer = (element: "ayah" | "header" | "info" | "watermark") => {
    if (element === "ayah") {
      setTextOffsetX(0);
      setTextOffsetY(0);
      setTextRotation(0);
      setAyahScale(100);
      setTextFontSize(shareMode === "page" ? 14 : 28);
    } else if (element === "header") {
      setSurahHeaderOffsetX(0);
      setSurahHeaderOffsetY(0);
      setSurahHeaderRotation(0);
      setSurahHeaderScale(100);
      setOpeningHeaderSize(30);
    } else if (element === "info") {
      setSurahInfoOffsetX(0);
      setSurahInfoOffsetY(0);
      setSurahInfoRotation(0);
      setSurahInfoScale(100);
    } else if (element === "watermark") {
      setWatermarkOffsetX(0);
      setWatermarkOffsetY(0);
      setWatermarkRotation(0);
      setWatermarkScale(100);
    }
  };

  const handleDeleteLayer = (element: "ayah" | "header" | "info" | "watermark") => {
    if (element === "header") {
      setShowOpeningHeader(false);
      setDeletedLayerNotice({ layer: "header", name: "الترويسة (البسملة)" });
    } else if (element === "info") {
      setShowSurahInfo(false);
      setDeletedLayerNotice({ layer: "info", name: "شارة السورة والصفحة" });
    } else if (element === "watermark") {
      setShowWatermark(false);
      setDeletedLayerNotice({ layer: "watermark", name: "شعار التبيان" });
    } else if (element === "ayah") {
      setShowAyahText(false);
      setDeletedLayerNotice({ layer: "ayah", name: "نص الآيات الكريمة" });
    }
    setSelectedLayer(null);
    setTimeout(() => {
      setDeletedLayerNotice((prev) => (prev?.layer === element ? null : prev));
    }, 6000);
  };

  const handleRestoreLayer = (element: "ayah" | "header" | "info" | "watermark") => {
    if (element === "header") setShowOpeningHeader(true);
    else if (element === "info") setShowSurahInfo(true);
    else if (element === "watermark") setShowWatermark(true);
    else if (element === "ayah") setShowAyahText(true);
    setDeletedLayerNotice(null);
    setSelectedLayer(element);
  };

  // Rotation and angle handler (تدوير بزوايا حرة ومغناطيسية)
  const handleStartRotate = (
    e: React.PointerEvent<HTMLElement>,
    element: "ayah" | "header" | "info" | "watermark"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const parentEl = (e.currentTarget.closest("[data-layer]") as HTMLElement) || (e.currentTarget.parentElement as HTMLElement);
    const rect = parentEl?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : e.clientX;
    const centerY = rect ? rect.top + rect.height / 2 : e.clientY;

    const startPointerAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    let initRotation = 0;
    if (element === "ayah") initRotation = textRotation;
    else if (element === "header") initRotation = surahHeaderRotation;
    else if (element === "info") initRotation = surahInfoRotation;
    else if (element === "watermark") initRotation = watermarkRotation;

    let hasDragged = false;

    const onPointerMove = (moveEv: PointerEvent) => {
      moveEv.preventDefault();
      hasDragged = true;
      const currentPointerAngle = Math.atan2(moveEv.clientY - centerY, moveEv.clientX - centerX) * (180 / Math.PI);
      let newRot = Math.round(initRotation + (currentPointerAngle - startPointerAngle));

      while (newRot > 180) newRot -= 360;
      while (newRot < -180) newRot += 360;

      // Smart magnetic snap at 0, 90, -90, 180 degrees
      if (Math.abs(newRot) < 3.5) newRot = 0;
      else if (Math.abs(newRot - 90) < 3) newRot = 90;
      else if (Math.abs(newRot + 90) < 3) newRot = -90;
      else if (Math.abs(Math.abs(newRot) - 180) < 3) newRot = 180;

      if (element === "ayah") setTextRotation(newRot);
      else if (element === "header") setSurahHeaderRotation(newRot);
      else if (element === "info") setSurahInfoRotation(newRot);
      else if (element === "watermark") setWatermarkRotation(newRot);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      // If clicked without dragging, immediately reset rotation and re-center!
      if (!hasDragged) {
        if (element === "ayah") {
          setTextRotation(0);
          setTextOffsetX(0);
          setTextOffsetY(0);
        } else if (element === "header") {
          setSurahHeaderRotation(0);
          setSurahHeaderOffsetX(0);
          setSurahHeaderOffsetY(0);
        } else if (element === "info") {
          setSurahInfoRotation(0);
          setSurahInfoOffsetX(0);
          setSurahInfoOffsetY(0);
        } else if (element === "watermark") {
          setWatermarkRotation(0);
          setWatermarkOffsetX(0);
          setWatermarkOffsetY(0);
        }
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: false });
    window.addEventListener("pointercancel", onPointerUp, { passive: false });
  };

  const handleStartCornerResize = (
    e: React.PointerEvent<HTMLElement>,
    element: "ayah" | "header" | "info" | "watermark"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    const parentEl = (e.currentTarget.closest("[data-layer]") as HTMLElement) || (e.currentTarget.parentElement as HTMLElement);
    const rect = parentEl?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : startX;
    const centerY = rect ? rect.top + rect.height / 2 : startY;
    const startDist = Math.hypot(startX - centerX, startY - centerY) || 50;

    const initFontSize = textFontSize;
    const initAyahScale = ayahScale || 100;
    const initHeaderScale = surahHeaderScale || 100;
    const initHeaderSize = openingHeaderSize || 30;
    const initInfoScale = surahInfoScale || 100;
    const initWatermarkScale = watermarkScale || 100;

    const onPointerMove = (moveEv: PointerEvent) => {
      moveEv.preventDefault();
      const currentDist = Math.hypot(moveEv.clientX - centerX, moveEv.clientY - centerY);
      const factor = Math.max(0.35, Math.min(2.8, currentDist / startDist));

      if (element === "ayah") {
        const newScale = Math.round(Math.max(40, Math.min(220, initAyahScale * factor)));
        setAyahScale(newScale);
        const newSize = Math.round(
          Math.max(shareMode === "page" ? 8 : 12, Math.min(shareMode === "page" ? 24 : 52, initFontSize * factor))
        );
        setTextFontSize(newSize);
        if (shareMode !== "page" && newSize >= 20) {
          savedAyahFontSizeRef.current = newSize;
          setSavedAyahFontSize(newSize);
        }
      } else if (element === "header") {
        const newScale = Math.round(Math.max(40, Math.min(220, initHeaderScale * factor)));
        setSurahHeaderScale(newScale);
        const newSize = Math.round(Math.max(14, Math.min(54, initHeaderSize * factor)));
        setOpeningHeaderSize(newSize);
      } else if (element === "info") {
        const newScale = Math.round(Math.max(50, Math.min(200, initInfoScale * factor)));
        setSurahInfoScale(newScale);
      } else if (element === "watermark") {
        const newScale = Math.round(Math.max(50, Math.min(200, initWatermarkScale * factor)));
        setWatermarkScale(newScale);
      }
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: false });
    window.addEventListener("pointercancel", onPointerUp, { passive: false });
  };

  // Fluid Pointer Drag Handler for elements (Up, Down, Left, Right)
  const handleStartDrag = (
    e: React.PointerEvent<HTMLElement>,
    element: "ayah" | "header" | "info" | "watermark"
  ) => {
    const isMoveHandle = !!(e.target as HTMLElement).closest(".move-handle");
    if (!isMoveHandle && ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest(".prevent-drag"))) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    setSelectedLayer(element);
    if (isMovementLocked) return;

    setIsDraggingElement(element);
    const startX = e.clientX;
    const startY = e.clientY;

    let initX = 0;
    let initY = 0;
    if (element === "ayah") {
      initX = textOffsetX;
      initY = textOffsetY;
    } else if (element === "header") {
      initX = surahHeaderOffsetX;
      initY = surahHeaderOffsetY;
    } else if (element === "info") {
      initX = surahInfoOffsetX;
      initY = surahInfoOffsetY;
    } else if (element === "watermark") {
      initX = watermarkOffsetX;
      initY = watermarkOffsetY;
    }

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (element === "ayah") {
        setTextOffsetX(Math.round(initX + dx));
        setTextOffsetY(Math.round(initY + dy));
      } else if (element === "header") {
        setSurahHeaderOffsetX(Math.round(initX + dx));
        setSurahHeaderOffsetY(Math.round(initY + dy));
      } else if (element === "info") {
        setSurahInfoOffsetX(Math.round(initX + dx));
        setSurahInfoOffsetY(Math.round(initY + dy));
      } else if (element === "watermark") {
        setWatermarkOffsetX(Math.round(initX + dx));
        setWatermarkOffsetY(Math.round(initY + dy));
      }
    };

    const onPointerUp = () => {
      setIsDraggingElement(null);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: false });
    window.addEventListener("pointercancel", onPointerUp, { passive: false });
  };

  // Floating Controls: Disabled per design to fix card elements permanently in place
  const renderLayerControls = (_element: "ayah" | "header" | "info" | "watermark", _label?: string) => {
    return null;
  };

  // Image Generation & Export State
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [showAndroidSaveModal, setShowAndroidSaveModal] = useState<boolean>(false);
  const [previewModalImageUrl, setPreviewModalImageUrl] = useState<string>("");
  
  // Instant Share Cache references
  const cachedExportBlobRef = useRef<Blob | null>(null);
  const cachedDataUrlRef = useRef<string>("");
  const isCardDirtyRef = useRef<boolean>(true);
  const drawCanvasRef = useRef<(() => Promise<void>) | null>(null);

  const cardPreviewRef = useRef<HTMLDivElement>(null);

  // Pre-load Quran core fonts and QBSML and Hafs_01 fonts
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      initOfflineFonts().catch(() => {}),
      loadQcf4Font("QCF4_Hafs_01").catch(() => {}),
      ensureQbsmlLoaded().catch(() => {}),
    ]).then(async () => {
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch {}
      }
      if (isMounted) setQbsmlReady(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to render Bismillah authentically in DOM preview using the Quran fonts
  const renderBismillahContent = (fontId?: string, customChar?: string, customFont?: string) => {
    const activeFont = fontId || openingHeaderFont;
    const isQcf = activeFont === "uthman_taha" || activeFont === "qcf4" || activeFont === "uthman";
    const fObj = getBismillahFontObj(activeFont);

    if (isQcf) {
      const charToUse = customChar || "\uF8DD";
      const fontToUse = customFont || "QCF4_Hafs_01";
      return (
        <span
          className="tracking-normal select-none pointer-events-none inline-block text-center"
          style={{
            fontFamily: `'${fontToUse}', 'QCF4_Hafs_01', 'QCF4_QBSML', 'UthmanTaha', 'UthmanicHafs', serif`,
            direction: "rtl",
            display: "inline-block",
            fontSize: "0.95em",
            lineHeight: 1.25,
          }}
        >
          {charToUse}
        </span>
      );
    }

    return (
      <span
        className="tracking-normal select-none pointer-events-none inline-block text-center"
        style={{
          fontFamily: fObj.family,
          direction: "rtl",
          display: "inline-block",
        }}
      >
        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
      </span>
    );
  };

  // Helper to render Bismillah on Canvas using authentic Quran fonts with harmonious Medina Mushaf sizing
  const drawBismillahCanvas = (
    ctx: CanvasRenderingContext2D,
    fontId: string,
    fontSize: number,
    x: number,
    y: number,
    color: string,
    customGlyph?: string,
    customFont?: string
  ) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";

    const isQcf = fontId === "uthman_taha" || fontId === "qcf4" || fontId === "uthman";
    if (isQcf) {
      // Natural Medina Mushaf optical proportion: balanced with ayah lines, never oversized
      const qcfFontSize = Math.round(fontSize * 0.92);
      const glyph = customGlyph || "\uF8DD";
      const font = customFont || "QCF4_Hafs_01";
      ctx.font = `${qcfFontSize}px "${font}", "QCF4_Hafs_01", "QCF4_QBSML", "UthmanTaha", "UthmanicHafs", serif`;
      ctx.fillText(glyph, x, y);
    } else {
      const fObj = getBismillahFontObj(fontId);
      ctx.font = `${fontSize}px ${fObj.canvasFamily}`;
      ctx.fillText("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", x, y);
    }
    ctx.restore();
  };

  // Fetch QCF4 Glyphs when activeData changes
  useEffect(() => {
    if (!activeData) {
      setQcf4Words([]);
      setQcf4Lines([]);
      setIsQcf4Loaded(false);
      return;
    }
    let isMounted = true;

    async function loadQcfVerseData() {
      try {
        if (shareMode === "page") {
          setIsLoadingVerse(true);
        }
        await ensureQbsmlLoaded();

        if (shareMode === "page") {
          const pageNum = selectedPageNumber || activeData.ayah.page || 1;
          const pageData = await fetchQcf4Page(pageNum);
          if (!isMounted) return;

          const fontNames = new Set<string>();
          if (pageData.font) fontNames.add(pageData.font);
          fontNames.add("QCF4_QBSML");

          pageData.lines?.forEach((l) => {
            l.words?.forEach((w) => {
              if (w.font) fontNames.add(w.font);
            });
          });

          await Promise.all(Array.from(fontNames).map((f) => loadQcf4Font(f)));
          if (document.fonts) {
            await document.fonts.ready;
          }
          if (!isMounted) return;

          const words: Qcf4Word[] = [];
          pageData.lines?.forEach((l) => {
            l.words?.forEach((w) => {
              if (w.type !== "surah_header" && w.type !== "bismillah") {
                words.push(w);
              }
            });
          });

          setQcf4Lines(pageData.lines || []);
          setQcf4Words(words);
          setQcf4Font(pageData.font || "QCF4_Hafs_01");
          setIsQcf4Loaded(true);
          return;
        }

        // Special Mushaf formatting ONLY for Range mode with full Fatihah (page 1) or full opening Baqarah (page 2)
        const isFatihahFullRange = shareMode === "range" && activeData.surahNumber === 1 && rangeFrom === 1 && rangeTo >= 7;
        const isBaqarahOpeningRange = shareMode === "range" && activeData.surahNumber === 2 && rangeFrom === 1 && rangeTo === 5;

        if (shareMode === "range" && (isFatihahFullRange || isBaqarahOpeningRange)) {
          const targetPage = activeData.surahNumber === 1 ? 1 : 2;
          const pageData = await fetchQcf4Page(targetPage);
          if (!isMounted) return;

          const fontNames = new Set<string>();
          if (pageData.font) fontNames.add(pageData.font);
          fontNames.add("QCF4_QBSML");

          pageData.lines?.forEach((l) => {
            l.words?.forEach((w) => {
              if (w.font) fontNames.add(w.font);
            });
          });

          await Promise.all(Array.from(fontNames).map((f) => loadQcf4Font(f)));
          if (document.fonts) {
            await document.fonts.ready;
          }
          if (!isMounted) return;

          const words: Qcf4Word[] = [];
          pageData.lines?.forEach((l) => {
            l.words?.forEach((w) => {
              if (w.type !== "surah_header" && w.type !== "bismillah") {
                words.push(w);
              }
            });
          });

          setQcf4Lines([]);
          setQcf4Words(words);
          setQcf4Font(pageData.font || (targetPage === 1 ? "QCF4_Hafs_01" : "QCF4_Hafs_02"));
          setIsQcf4Loaded(true);
          return;
        }

        if (shareMode === "range") {
          const allWords: Qcf4Word[] = [];
          const fontsToLoad = new Set<string>();
          if (rangeFrom === 1) {
            fontsToLoad.add("QCF4_QBSML");
          }

          for (let aNum = rangeFrom; aNum <= rangeTo; aNum++) {
            try {
              const res = await fetchQcf4VerseWords(activeData.surahNumber, aNum);
              if (res.font) fontsToLoad.add(res.font);
              res.words?.forEach((w) => {
                if (w.font) fontsToLoad.add(w.font);
                allWords.push(w);
              });
            } catch (e) {
              console.warn(`Failed QCF for ayah ${aNum}:`, e);
            }
          }

          if (!isMounted) return;
          if (allWords.length > 0) {
            await Promise.all(Array.from(fontsToLoad).map((f) => loadQcf4Font(f)));
            if (document.fonts) {
              await document.fonts.ready;
            }
            if (!isMounted) return;
            setQcf4Lines([]);
            setQcf4Words(allWords);
            const mainFont = Array.from(fontsToLoad).find((f) => f !== "QCF4_QBSML") || "QCF4_Hafs_01";
            setQcf4Font(mainFont);
            setIsQcf4Loaded(true);
            setQbsmlReady(true);
          } else {
            setIsQcf4Loaded(false);
          }
          return;
        }

        // Single mode: STRICTLY ONE VERSE ONLY
        setQcf4Lines([]);
        const res = await fetchQcf4VerseWords(
          activeData.surahNumber,
          activeData.ayah.numberInSurah,
          activeData.ayah.page
        );
        if (!isMounted) return;
        if (res.words && res.words.length > 0) {
          const fontsToLoad = new Set<string>();
          if (activeData.ayah.numberInSurah === 1) {
            fontsToLoad.add("QCF4_QBSML");
          }
          if (res.font) fontsToLoad.add(res.font);
          res.words.forEach((w) => {
            if (w.font) fontsToLoad.add(w.font);
          });
          await Promise.all(Array.from(fontsToLoad).map((f) => loadQcf4Font(f)));
          if (document.fonts) {
            await document.fonts.ready;
          }
          if (!isMounted) return;
          setQcf4Lines([]);
          setQcf4Words(res.words);
          setQcf4Font(res.font || "QCF4_Hafs_01");
          setIsQcf4Loaded(true);
          setQbsmlReady(true);
        } else {
          setIsQcf4Loaded(false);
        }
      } catch (err) {
        console.warn("[ShareAyahModal] QCF4 font load fallback:", err);
        if (isMounted) setIsQcf4Loaded(false);
      } finally {
        if (isMounted) setIsLoadingVerse(false);
      }
    }

    loadQcfVerseData();
    return () => {
      isMounted = false;
    };
  }, [activeData, shareMode, rangeFrom, rangeTo, selectedPageNumber]);

  // Compute CSS Background string
  const currentBackgroundCss = useMemo(() => {
    if (bgCategory === "none") {
      return "transparent";
    }
    if (bgCategory === "solid") {
      return selectedSolidColor;
    }
    if (bgCategory === "gradient") {
      if (gradientType === "radial") {
        return `radial-gradient(circle at center, ${gradientColor2} 0%, ${gradientColor1} ${radialSpread}%)`;
      }
      return `linear-gradient(${gradientAngle}deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`;
    }
    if (gradientType === "radial") {
      return `radial-gradient(circle at center, ${gradientColor2} 0%, ${gradientColor1} ${radialSpread}%)`;
    }
    return `linear-gradient(${gradientAngle}deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`;
  }, [bgCategory, gradientType, gradientAngle, radialSpread, gradientColor1, gradientColor2, selectedSolidColor]);

  // High-Resolution Canvas Rendering & Image Generation
  useEffect(() => {
    if (!shareData) {
      setGeneratedImageUrl("");
      return;
    }

    setShareStatus(null);

    const activeAspect = aspectRatioOptions.find((a) => a.id === selectedAspectRatio) || aspectRatioOptions[0];
    const domWidth = cardPreviewRef.current?.offsetWidth || 1080;
    const domHeight = cardPreviewRef.current?.offsetHeight || cardPreviewRef.current?.scrollHeight || 0;
    const scale = 1080 / (domWidth || 1080);
    const width = 1080;
    const height =
      selectedAspectRatio === "auto"
        ? (shareMode === "page"
            ? (isOpeningMushafPage ? 1400 : 1920)
            : (domHeight > 0 ? Math.max(500, Math.round(domHeight * scale)) : autoDimensions.height))
        : selectedAspectRatio === "custom"
        ? Math.max(300, Math.min(4000, customHeight))
        : activeAspect.height;
    const isTallRatio = (height / width) > 1.25;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setIsGeneratingImage(false);
      return;
    }

    const drawCanvas = async () => {
      try {
        await ensureQbsmlLoaded().catch(() => {});
        if (qcf4Font) {
          await loadQcf4Font(qcf4Font).catch(() => {});
        }
        if (document.fonts) {
          await document.fonts.ready;
        }

        ctx.clearRect(0, 0, width, height);

        // 1. Draw Background (Gradient or Solid or None/Transparent)
        if (bgCategory === "none") {
          // Transparent canvas - no background fill
        } else if (bgCategory === "solid") {
          ctx.fillStyle = selectedSolidColor;
          ctx.fillRect(0, 0, width, height);
        } else if (gradientType === "radial") {
          const maxRadius = (Math.max(width, height) / 1.4) * (radialSpread / 100);
          const grad = ctx.createRadialGradient(
            width / 2,
            height / 2,
            0,
            width / 2,
            height / 2,
            Math.max(20, maxRadius)
          );
          grad.addColorStop(0, gradientColor2);
          grad.addColorStop(1, gradientColor1);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
        } else {
          const rad = (gradientAngle * Math.PI) / 180;
          const x1 = width / 2 - (Math.cos(rad) * width) / 2;
          const y1 = height / 2 - (Math.sin(rad) * height) / 2;
          const x2 = width / 2 + (Math.cos(rad) * width) / 2;
          const y2 = height / 2 + (Math.sin(rad) * height) / 2;
          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, gradientColor1);
          grad.addColorStop(1, gradientColor2);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
        }

        // 2. Draw Texture Background / Overlay if in texture mode
        if (bgCategory === "texture" && showTexture && selectedTextureId) {
          const texObj = texturePresets.find((t) => t.id === selectedTextureId);
          if (texObj && texObj.imageUrl) {
            try {
              const texImg = new window.Image();
              if (typeof texObj.imageUrl === "string" && (texObj.imageUrl.startsWith("http://") || texObj.imageUrl.startsWith("https://"))) {
                texImg.crossOrigin = "anonymous";
              }
              texImg.src = texObj.imageUrl;
              await new Promise<void>((resolve) => {
                if (texImg.complete) {
                  resolve();
                } else {
                  texImg.onload = () => resolve();
                  texImg.onerror = () => resolve();
                }
              });
              ctx.save();
              ctx.globalAlpha = Math.min(1, Math.max(0.05, textureOpacity));
              ctx.drawImage(texImg, 0, 0, width, height);

              // Contrast vignette layer for optimal Quranic text legibility
              const vignette = ctx.createLinearGradient(0, 0, 0, height);
              vignette.addColorStop(0, "rgba(0, 0, 0, 0.35)");
              vignette.addColorStop(0.5, "rgba(0, 0, 0, 0.12)");
              vignette.addColorStop(1, "rgba(0, 0, 0, 0.45)");
              ctx.fillStyle = vignette;
              ctx.fillRect(0, 0, width, height);
              ctx.restore();
            } catch (e) {
              console.warn("Texture canvas draw error:", e);
            }
          }
        }

        // 3. Draw Pattern Overlay if enabled
        if (showPattern && selectedPatternId && selectedPatternId !== "none" && patternOpacity > 0) {
          const patObj = patternPresets.find((p) => p.id === selectedPatternId);
          if (patObj) {
            try {
              const svgDataUrl = patObj.rawSvg 
                ? createSvgDataUrl(patObj.rawSvg, patternColor)
                : patObj.svgPattern;
              const patImg = new window.Image();
              if (typeof svgDataUrl === "string" && (svgDataUrl.startsWith("http://") || svgDataUrl.startsWith("https://"))) {
                patImg.crossOrigin = "anonymous";
              }
              patImg.src = svgDataUrl;
              await new Promise<void>((resolve) => {
                if (patImg.complete) {
                  resolve();
                } else {
                  patImg.onload = () => resolve();
                  patImg.onerror = () => resolve();
                }
              });
              ctx.save();
              ctx.globalAlpha = Math.max(0.02, patternOpacity);
              const pattern = ctx.createPattern(patImg, "repeat");
              if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, width, height);
              }
              ctx.restore();
            } catch (e) {
              console.warn("Pattern canvas draw error:", e);
            }
          }
        }

        // 3. Draw Frames & Borders
        if (showAyahFrame && selectedFrameStyle !== "none") {
          const margin = (frameInset / 340) * width;
          const strokeW = Math.max(1.5, (frameWidth / 340) * width);
          const innerOffset = Math.max(6, 12 * (width / 340));
          ctx.save();
          ctx.strokeStyle = frameColor;
          ctx.lineWidth = strokeW;

          if (selectedFrameStyle === "rectangle") {
            // Outer rectangle
            ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
            // Inner secondary border
            ctx.strokeStyle = frameColor;
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = Math.max(1, strokeW * 0.6);
            ctx.strokeRect(margin + innerOffset, margin + innerOffset, width - (margin + innerOffset) * 2, height - (margin + innerOffset) * 2);
            ctx.globalAlpha = 1.0;

            // Corner ornamental diamonds
            const drawDiamond = (cx: number, cy: number) => {
              const dSize = Math.max(4, 7 * (width / 340));
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(Math.PI / 4);
              ctx.fillStyle = frameColor;
              ctx.fillRect(-dSize / 2, -dSize / 2, dSize, dSize);
              ctx.restore();
            };
            drawDiamond(margin, margin);
            drawDiamond(width - margin, margin);
            drawDiamond(width - margin, height - margin);
            drawDiamond(margin, height - margin);
          } else if (selectedFrameStyle === "andalusian") {
            ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = Math.max(1, strokeW * 0.6);
            ctx.strokeRect(margin + innerOffset, margin + innerOffset, width - (margin + innerOffset) * 2, height - (margin + innerOffset) * 2);
            ctx.globalAlpha = 1.0;

            // Draw Andalusian corner floral brackets
            const bracketSize = Math.max(16, 32 * (width / 340));
            const drawAndalusianCorner = (cx: number, cy: number, rot: number) => {
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(rot);
              ctx.strokeStyle = frameColor;
              ctx.fillStyle = frameColor;
              ctx.lineWidth = strokeW;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(bracketSize, 0);
              ctx.bezierCurveTo(bracketSize * 0.6, bracketSize * 0.2, bracketSize * 0.2, bracketSize * 0.6, 0, bracketSize);
              ctx.closePath();
              ctx.stroke();
              // Center rosette dot
              ctx.beginPath();
              ctx.arc(bracketSize * 0.35, bracketSize * 0.35, Math.max(2, 4 * (width / 340)), 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            };
            drawAndalusianCorner(margin, margin, 0);
            drawAndalusianCorner(width - margin, margin, Math.PI / 2);
            drawAndalusianCorner(width - margin, height - margin, Math.PI);
            drawAndalusianCorner(margin, height - margin, -Math.PI / 2);
          } else if (selectedFrameStyle === "vintage-border") {
            ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
            // Dotted inner line
            ctx.save();
            ctx.strokeStyle = frameColor;
            ctx.lineWidth = Math.max(1, strokeW * 0.75);
            ctx.setLineDash([Math.max(3, 5 * (width / 340)), Math.max(3, 5 * (width / 340))]);
            ctx.strokeRect(margin + innerOffset, margin + innerOffset, width - (margin + innerOffset) * 2, height - (margin + innerOffset) * 2);
            ctx.restore();

            // Corner connect knot
            const kSize = Math.max(4, 8 * (width / 340));
            const drawKnot = (cx: number, cy: number) => {
              ctx.fillStyle = frameColor;
              ctx.fillRect(cx - kSize / 2, cy - kSize / 2, kSize, kSize);
            };
            drawKnot(margin, margin);
            drawKnot(width - margin, margin);
            drawKnot(width - margin, height - margin);
            drawKnot(margin, height - margin);
          } else if (selectedFrameStyle === "rounded") {
            const rad = Math.max(16, 32 * (width / 340));
            ctx.beginPath();
            ctx.roundRect(margin, margin, width - margin * 2, height - margin * 2, rad);
            ctx.stroke();

            // Inner rounded
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = Math.max(1, strokeW * 0.6);
            ctx.beginPath();
            ctx.roundRect(margin + innerOffset, margin + innerOffset, width - (margin + innerOffset) * 2, height - (margin + innerOffset) * 2, Math.max(8, rad - innerOffset));
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          } else if (selectedFrameStyle === "minimal") {
            ctx.lineWidth = Math.max(1, strokeW * 0.7);
            ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

            // Subtle extended corner crossbars
            const crossLen = Math.max(6, 12 * (width / 340));
            ctx.beginPath();
            // Top-left
            ctx.moveTo(margin - crossLen, margin); ctx.lineTo(margin, margin);
            ctx.moveTo(margin, margin - crossLen); ctx.lineTo(margin, margin);
            // Top-right
            ctx.moveTo(width - margin + crossLen, margin); ctx.lineTo(width - margin, margin);
            ctx.moveTo(width - margin, margin - crossLen); ctx.lineTo(width - margin, margin);
            // Bottom-right
            ctx.moveTo(width - margin + crossLen, height - margin); ctx.lineTo(width - margin, height - margin);
            ctx.moveTo(width - margin, height - margin + crossLen); ctx.lineTo(width - margin, height - margin);
            // Bottom-left
            ctx.moveTo(margin - crossLen, height - margin); ctx.lineTo(margin, height - margin);
            ctx.moveTo(margin, height - margin + crossLen); ctx.lineTo(margin, height - margin);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Dimensions & preview scale measurements
        const previewW = cardPreviewRef.current?.offsetWidth || 340;
        const previewH = cardPreviewRef.current?.offsetHeight || (previewW * (height / width));
        const scaleRatio = width / previewW;
        const ayahFontSize = Math.max(22, Math.round(textFontSize * scaleRatio));

        // 4. Header Branding (Istiadhah removed completely as requested by user)
        // No redundant Istiadhah drawn above or below the frame
        try {
          await loadQcf4Font("QCF4_Hafs_01");
          await ensureQbsmlLoaded();
          if (document.fonts) await document.fonts.ready;
        } catch {}

        // 5. Wrap and Draw Ayah Text with selected Quranic Typography
        if (!activeData) return;
        const isQcfValid = selectedQuranFont === "qcf4" && isQcf4Loaded && (qcf4Lines.length > 0 || qcf4Words.length > 0);
        type WordItem = { char: string; font?: string; type?: string };

        let baseFontFamily = "'QCF4_Hafs_01', 'QCF4_QBSML', 'Amiri', serif";
        if (selectedQuranFont === "qcf4") {
          baseFontFamily = isQcfValid
            ? `"${qcf4Font}", "QCF4_Hafs_01", "QCF4_QBSML", "Amiri", "UthmanicHafs", serif`
            : "'QCF4_Hafs_01', 'QCF4_QBSML', 'Amiri', serif";
        } else if (selectedQuranFont === "amiri") {
          baseFontFamily = "'Amiri', serif";
        } else if (selectedQuranFont === "uthman") {
          baseFontFamily = "'UthmanicHafs', 'Amiri', serif";
        } else if (selectedQuranFont === "cairo") {
          baseFontFamily = "'Cairo', 'Amiri', sans-serif";
        }

        ctx.textBaseline = "middle";
        ctx.direction = "rtl";

        const frameTopY = (showAyahFrame && selectedFrameStyle !== "none") ? (frameInset / 380) * width : 0;
        const frameBottomY = (showAyahFrame && selectedFrameStyle !== "none") ? (frameInset / 380) * width : 0;

        const isOpeningMushafPage =
          shareMode === "page" && (selectedPageNumber === 1 || selectedPageNumber === 2);
        const isPageShare = shareMode === "page";
        const topLimit = (showAyahFrame && selectedFrameStyle !== "none")
          ? frameTopY + (isPageShare ? 10 : 14) * scaleRatio
          : height * (isPageShare ? 0.022 : 0.035);
        // Footer & Divider geometry with generous, comfortable breathing space:
        const footerLogoFontSize = Math.max(18, Math.round(width * 0.024));
        const footerIconSize = Math.round(footerLogoFontSize * 2.7);
        const footerBaseY = height - Math.max(isPageShare ? 24 * scaleRatio : 28 * scaleRatio, 32);
        // Generous distance between the top of the logo/app name and the divider line
        const gapDividerToLogo = Math.max(22 * scaleRatio, 26);
        const dividerY = Math.round(footerBaseY - footerIconSize / 2 - gapDividerToLogo);
        // Generous distance between the last verse line and the divider line
        const gapVerseToDivider = Math.max(28 * scaleRatio, 34);

        const bottomLimit = (showSurahInfo || showWatermark)
          ? dividerY - gapVerseToDivider
          : (showAyahFrame && selectedFrameStyle !== "none")
          ? height - frameBottomY - (isPageShare ? 10 : 14) * scaleRatio
          : height * (isPageShare ? 0.978 : 0.96);

        const availableH = bottomLimit - topLimit;
        const availableW = (shareMode === "page" || isOpeningMushafPage) ? width * 0.94 : width * 0.91;
        const ayahDeltaY = (textOffsetY / previewH) * height;
        const ayahDeltaX = (textOffsetX / previewW) * width;

        // Preload authentic Surah Header SVG banner from Quran-soura-112.svg
        const surahHeaderImg = new window.Image();
        surahHeaderImg.src = surahHeaderColor ? createAuthenticSurahHeaderSvg(surahHeaderColor, surahHeaderTextColor || textColor) : "/quran-soura-112-frame.svg";
        await new Promise<void>((resolve) => {
          if (surahHeaderImg.complete && surahHeaderImg.naturalWidth > 0) {
            resolve();
          } else {
            surahHeaderImg.onload = () => resolve();
            surahHeaderImg.onerror = () => {
              surahHeaderImg.src = "/standalone-frame.svg";
              surahHeaderImg.onload = () => resolve();
              surahHeaderImg.onerror = () => {
                surahHeaderImg.src = createAuthenticSurahHeaderSvg(surahHeaderColor || "#C5A85C", surahHeaderTextColor || textColor);
                surahHeaderImg.onload = () => resolve();
                surahHeaderImg.onerror = () => resolve();
              };
            };
          }
        });

        // Preload approved app icon (/app-logo-256.png with fallback to /app-logo-512.png and /IMG_1767.png)
        const appLogoImg = new window.Image();
        // Do not use crossOrigin on same-origin local assets
        appLogoImg.src = "/app-logo-256.png";
        await new Promise<void>((resolve) => {
          if (appLogoImg.complete && appLogoImg.naturalWidth > 0) {
            resolve();
          } else {
            appLogoImg.onload = () => resolve();
            appLogoImg.onerror = () => {
              appLogoImg.src = "/app-logo-512.png";
              appLogoImg.onload = () => resolve();
              appLogoImg.onerror = () => {
                appLogoImg.src = "/IMG_1767.png";
                appLogoImg.onload = () => resolve();
                appLogoImg.onerror = () => resolve();
              };
            };
          }
        });

        // MODE 1: FULL PAGE AUTHENTIC QCF4 RENDERING (All 15 lines displayed precisely, or 8 lines for Page 1 & 2)
        if (shareMode === "page" && selectedQuranFont === "qcf4" && isQcfValid && qcf4Lines.length > 0) {
          const numLines = isOpeningMushafPage ? Math.max(qcf4Lines.length, 8) : Math.max(qcf4Lines.length, 15);
          const targetLineH = availableH / numLines;
          const pageLineFontSize = isOpeningMushafPage
            ? Math.max(20, Math.round(targetLineH * 0.52))
            : Math.max(16, Math.round(targetLineH * 0.48));
          const startY = topLimit + targetLineH / 2 + ayahDeltaY;

          // Shadow backdrop box for full page
          if (showAyahText && textShadowOpacity > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${textShadowOpacity})`;
            const boxPaddingY = 12 * scaleRatio;
            const boxPaddingX = 16 * scaleRatio;
            const rHeight = availableH + boxPaddingY * 2;
            const radius = 18 * scaleRatio;
            const x = (width - availableW) / 2 - boxPaddingX / 2 + ayahDeltaX;
            const y = topLimit - boxPaddingY + ayahDeltaY;
            const w = availableW + boxPaddingX;

            ctx.beginPath();
            ctx.roundRect(x, y, w, rHeight, radius);
            ctx.fill();
          }

          const targetPageNum = selectedPageNumber || activeData?.pageNumber || activeData?.ayah?.page || 1;
          const isPageMode = shareMode === "page";
          const pageHeaderPositions = SURAH_HEADER_POSITIONS[targetPageNum] || [];
          const hasHeaderAtPageTop = pageHeaderPositions.some((h) => Math.abs(h.yCenter - 25.2) < 5);
          const isFirstQcfLineHeader = qcf4Lines.length > 0 && qcf4Lines[0]?.words?.some((w) => w.type === "surah_header");
          const isPageStartingWithSurahAtTop = isPageMode && (
            qcf4Lines.length > 0 ? isFirstQcfLineHeader : hasHeaderAtPageTop
          );
          const isPageContinuationFromPrev = isPageMode && !isPageStartingWithSurahAtTop;
          const shouldDrawTopSurahFrame = showSurahHeaderFrame && !isPageContinuationFromPrev;

          // Draw the top Surah Header Frame in Mode 1 if enabled and not a continuation page
          if (shouldDrawTopSurahFrame) {
            const pageMeta = quranSvgPageMetadata.find((p) => p.page === targetPageNum);
            const topSurahNum = pageMeta?.surahNumber || activeData?.surahNumber || 1;
            const topSurahName = pageMeta?.surahNameAr || activeData?.surahName || "الفاتحة";

            const bannerScaleFactor = surahHeaderScale ? surahHeaderScale / 100 : 1;
            const topBannerW = Math.round(availableW * bannerScaleFactor);
            const topBannerH = topBannerW * (30.23196 / 240.20621);
            const topBannerX = (width - topBannerW) / 2 + (surahHeaderOffsetX / previewW) * width;
            const topBannerY = topLimit - topBannerH * 0.35 + (surahHeaderOffsetY / previewH) * height;

            if (surahHeaderImg && surahHeaderImg.complete && surahHeaderImg.naturalWidth > 0) {
              ctx.drawImage(surahHeaderImg, topBannerX, topBannerY, topBannerW, topBannerH);
              ctx.save();
              ctx.strokeStyle = surahHeaderColor || frameColor || "#C5A85C";
              ctx.lineWidth = Math.max(1.5, 1.5 * scaleRatio);
              ctx.strokeRect(topBannerX + 0.5, topBannerY + 0.5, topBannerW - 1, topBannerH - 1);
              ctx.restore();
            }

            const useQbsml = isQbsmlLoaded();
            const topHeaderGlyph = useQbsml
              ? getSurahHeaderGlyph(topSurahNum, topSurahName)
              : (topSurahName?.startsWith("سُورَةُ") || topSurahName?.startsWith("سورة") ? topSurahName : `سُورَةُ ${topSurahName}`);

            ctx.save();
            const topCartoucheY = topBannerY + topBannerH * 0.44;
            const topCenterX = topBannerX + topBannerW / 2;
            if (useQbsml) {
              const glyphFontSize = Math.round(topBannerH * 0.58);
              ctx.font = `${glyphFontSize}px "QCF4_QBSML", "Amiri", serif`;
              ctx.fillStyle = surahHeaderTextColor || textColor || "#1C1917";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(topHeaderGlyph, topCenterX, topCartoucheY);
            } else {
              const textFontSize = Math.round(topBannerH * 0.36);
              ctx.font = `bold ${textFontSize}px "Amiri", "UthmanicHafs", serif`;
              ctx.fillStyle = surahHeaderTextColor || textColor || "#1C1917";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(topHeaderGlyph, topCenterX, topCartoucheY);
            }
            ctx.restore();
          }

          if (showAyahText) {
            qcf4Lines.forEach((line, lineIdx) => {
            const lineY = startY + lineIdx * targetLineH;
            const isSurahHeader = line.words.some((w) => w.type === "surah_header");
            const isBismillah = line.words.some((w) => w.type === "bismillah");

            if (isSurahHeader) {
              if (!showSurahHeaderFrame) return;
              if (lineIdx === 0 && shouldDrawTopSurahFrame) return; // Top header is already drawn at the top of the card
              const headerWord = line.words.find((w) => w.type === "surah_header");

              let lineSurahNum: number | undefined;
              const glyphChar = headerWord?.char || "";
              if (glyphChar && glyphChar.length === 1) {
                const code = glyphChar.charCodeAt(0);
                if (code >= 0xF100 && code <= 0xF171) {
                  lineSurahNum = code - 0xF100 + 1;
                }
              }
              if (!lineSurahNum) {
                let hCount = 0;
                for (let i = 0; i < lineIdx; i++) {
                  if (qcf4Lines[i]?.words?.some((lw) => lw.type === "surah_header")) hCount++;
                }
                const pageToUse = selectedPageNumber || activeData?.pageNumber || activeData?.ayah?.page || 1;
                const pSurahs = SURAH_HEADER_POSITIONS[pageToUse] || [];
                if (pSurahs[hCount]) lineSurahNum = pSurahs[hCount].surah;
              }
              if (!lineSurahNum) {
                for (let li = lineIdx + 1; li < qcf4Lines.length; li++) {
                  for (const lw of qcf4Lines[li]?.words || []) {
                    if (lw.verse_key) {
                      const [vsNum] = lw.verse_key.split(":").map(Number);
                      if (vsNum) {
                        lineSurahNum = vsNum;
                        break;
                      }
                    }
                  }
                  if (lineSurahNum) break;
                }
              }
              const foundS = lineSurahNum ? surahsList.find((s) => s.number === lineSurahNum) : null;
              const lineSurahName = foundS ? foundS.name : "";

              ctx.save();

              // Authentic Medina Mushaf Banner Frame spanning full column width
              const bannerScaleFactor = surahHeaderScale ? surahHeaderScale / 100 : 1;
              const bannerW = Math.round(availableW * bannerScaleFactor);
              const bannerH = bannerW * (30.23196 / 240.20621);
              const bannerX = (width - bannerW) / 2 + ayahDeltaX;
              const bannerY = lineY - bannerH / 2;

              if (surahHeaderImg && surahHeaderImg.complete && surahHeaderImg.naturalWidth > 0) {
                ctx.drawImage(surahHeaderImg, bannerX, bannerY, bannerW, bannerH);
                ctx.save();
                ctx.strokeStyle = surahHeaderColor || frameColor || "#C5A85C";
                ctx.lineWidth = Math.max(1.5, 1.5 * scaleRatio);
                ctx.strokeRect(bannerX + 0.5, bannerY + 0.5, bannerW - 1, bannerH - 1);
                ctx.restore();
              }

              const useQbsml = isQbsmlLoaded();
              const cartoucheCenterY = bannerY + bannerH * 0.44;
              const headerGlyph = useQbsml
                ? (glyphChar || getSurahHeaderGlyph(lineSurahNum || activeData.surahNumber, lineSurahName))
                : (lineSurahName?.startsWith("سُورَةُ") || lineSurahName?.startsWith("سورة") ? lineSurahName : `سُورَةُ ${lineSurahName}`);

              if (useQbsml) {
                // Exact optical proportion for Medina cartouche (normal weight, no synthetic bold distortion)
                const glyphFontSize = Math.round(bannerH * 0.58);
                ctx.font = `${glyphFontSize}px "QCF4_QBSML", "Amiri", serif`;
                ctx.fillStyle = surahHeaderTextColor || textColor || "#1C1917";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(headerGlyph, width / 2 + ayahDeltaX, cartoucheCenterY);
              } else {
                let textFontSize = Math.round(bannerH * 0.36);
                ctx.font = `bold ${textFontSize}px "Amiri", "UthmanicHafs", serif`;
                ctx.fillStyle = surahHeaderTextColor || textColor || "#1C1917";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(headerGlyph, width / 2 + ayahDeltaX, cartoucheCenterY);
              }
              ctx.restore();
              return;
            }

            if (isBismillah) {
              const bWord = line.words.find((w) => w.type === "bismillah");
              const bChar = bWord?.char || "\uF8DD";
              const bFont = bWord?.font || "QCF4_Hafs_01";
              // Calibrated harmonious size: perfectly proportional to the verse lines
              const bFontSize = Math.round(pageLineFontSize * (isOpeningMushafPage ? 1.05 : 0.88));
              drawBismillahCanvas(
                ctx,
                openingHeaderFont,
                bFontSize,
                width / 2 + ayahDeltaX,
                lineY,
                openingHeaderColor || textColor,
                bChar,
                bFont
              );
              return;
            }

            // Normal Quran Verse Line
            // Measure words and auto-fit line font size so NO line ever overflows availableW
            let lineFontSize = pageLineFontSize;
            let wordWidths = line.words.map((w) => {
              const f = w.font || qcf4Font;
              ctx.font = `${lineFontSize}px "${f}", ${baseFontFamily}`;
              return ctx.measureText(w.char || w.text || "").width;
            });
            let totalWordW = wordWidths.reduce((acc, val) => acc + val, 0);

            // AUTO-FIT: If line width exceeds available column, scale line font size down safely
            const minGap = Math.max(4, Math.round(lineFontSize * 0.1));
            const minLineWidth = totalWordW + (line.words.length - 1) * minGap;
            if (minLineWidth > availableW) {
              const scaleDown = (availableW * 0.97) / minLineWidth;
              lineFontSize = Math.max(10, Math.floor(lineFontSize * scaleDown));
              wordWidths = line.words.map((w) => {
                const f = w.font || qcf4Font;
                ctx.font = `${lineFontSize}px "${f}", ${baseFontFamily}`;
                return ctx.measureText(w.char || w.text || "").width;
              });
              totalWordW = wordWidths.reduce((acc, val) => acc + val, 0);
            }

            // Identify if this line is the last line of a surah or the very last line of the page
            let nextSectionIdx = qcf4Lines.length;
            for (let i = lineIdx + 1; i < qcf4Lines.length; i++) {
              if (qcf4Lines[i]?.words?.some((w) => w.type === "surah_header")) {
                nextSectionIdx = i;
                break;
              }
            }
            const isLastLineOfSection = lineIdx === nextSectionIdx - 1;
            const isLastLine = lineIdx === qcf4Lines.length - 1 || isLastLineOfSection;

            // Center ONLY the last line (or in opening ornamental pages 1 & 2), and justify all other lines
            const shouldCenter =
              isLastLine ||
              isOpeningMushafPage ||
              textAlign === "center";

            const canJustify =
              !isSurahHeader &&
              !isBismillah &&
              !shouldCenter &&
              (textAlign === "justify" || !textAlign);

            let wordSpacing = Math.max(6, Math.round(lineFontSize * (isOpeningMushafPage ? 0.32 : 0.22)));

            if (canJustify && totalWordW < availableW && line.words.length > 1) {
              wordSpacing = (availableW - totalWordW) / (line.words.length - 1);
            } else if (isOpeningMushafPage && totalWordW < availableW * 0.92) {
              wordSpacing = Math.min(Math.round(lineFontSize * 0.42), (availableW * 0.92 - totalWordW) / Math.max(1, line.words.length - 1));
            }

            let startRightX = 0;
            if (canJustify && line.words.length > 1) {
              startRightX = (width + availableW) / 2 + ayahDeltaX;
            } else if (textAlign === "right") {
              startRightX = (width + availableW) / 2 + ayahDeltaX;
            } else {
              // Always center horizontally without stretching word gaps
              const lineWidth = totalWordW + (line.words.length - 1) * wordSpacing;
              startRightX = (width + lineWidth) / 2 + ayahDeltaX;
            }

            let currentX = startRightX;
            line.words.forEach((w, wIdx) => {
              const wWidth = wordWidths[wIdx];
              const f = w.font || qcf4Font;

              ctx.font = `${lineFontSize}px "${f}", ${baseFontFamily}`;
              ctx.fillStyle = textColor;
              ctx.textAlign = "right";
              ctx.fillText(w.char || w.text || "", currentX, lineY);
              currentX -= (wWidth + wordSpacing);
            });
          });
          }
        } else {
          // MODE 2: AUTO-FITTING WRAPPED TEXT (Single verse, verse range, or standard text fonts for full page)
          const rawAyahText = activeData.ayah.text || "";
          let cleanedAyahText = rawAyahText;
          if (activeData.surahNumber !== 1 && ((shareMode === "single" && activeData.ayah.numberInSurah === 1) || (shareMode === "range" && rangeFrom === 1))) {
            const bismillahRegex = /^(?:بِسْمِ\s*[\u0671\u0627]للَّ?هِ\s*[\u0671\u0627]لرَّحْمَ[ـٰ\u0670]?نِ\s*[\u0671\u0627]لرَّحِيمِ|بِسْمِ\s*[\u0671\u0627]للهِ\s*[\u0671\u0627]لرحمن\s*[\u0671\u0627]لرحيم|بِسْمِ\s*اللهِ\s*الرَّحْمٰنِ\s*الرَّحِيمِ|بسم\s*الله\s*الرحمن\s*الرحيم)[\s\r\n]*/u;
            cleanedAyahText = cleanedAyahText.replace(bismillahRegex, "").trim();
          }

          const wordsList: WordItem[] = isQcfValid
            ? qcf4Words.map((w) => ({ char: w.char, font: w.font || qcf4Font, type: w.type }))
            : cleanedAyahText.split(" ").filter(Boolean).map((t) => ({ char: t, font: baseFontFamily, type: "word" }));

          let curFontSize = ayahFontSize;
          let lines: { words: WordItem[]; widths: number[]; totalWidth: number }[] = [];
          const maxTextWidth = availableW;

          const isPageMode = shareMode === "page";
          const targetPageNum = selectedPageNumber || activeData?.pageNumber || activeData?.ayah?.page || 1;
          const pageMeta = isPageMode ? quranSvgPageMetadata.find((p) => p.page === targetPageNum) : null;
          const pageHeaderPositions = SURAH_HEADER_POSITIONS[targetPageNum] || [];
          const hasHeaderAtPageTop = pageHeaderPositions.some((h) => Math.abs(h.yCenter - 25.2) < 5);
          const isPageStartingWithSurahAtTop = isPageMode && hasHeaderAtPageTop;
          const isPageContinuationFromPrev = isPageMode && !isPageStartingWithSurahAtTop;

          const pageStartingSurah = isPageStartingWithSurahAtTop
            ? (surahsList.find((s) => getSurahStartPage(s.number) === targetPageNum) || (pageHeaderPositions[0] ? surahsList.find((s) => s.number === pageHeaderPositions[0].surah) : null))
            : null;
          const targetSurahNum = pageStartingSurah
            ? pageStartingSurah.number
            : (isPageMode ? (pageMeta?.surahNumber || activeData?.surahNumber || 1) : (activeData?.surahNumber || 1));
          const targetSurahName = pageStartingSurah
            ? pageStartingSurah.name
            : (isPageMode ? (pageMeta?.surahNameAr || activeData?.surahName || "الفاتحة") : (activeData?.surahName || ""));

          const isPageSurahStart = isPageStartingWithSurahAtTop;

          const hasSurahStart =
            (shareMode === "single" && Number(activeData?.ayah?.numberInSurah) === 1) ||
            (shareMode === "range" && Number(rangeFrom) === 1) ||
            isPageSurahStart;

          const isBismillah =
            !isPageMode
              ? (openingHeaderMode === "bismillah" ||
                 (openingHeaderMode === "auto" && hasSurahStart && Number(targetSurahNum) !== 9 && Number(targetSurahNum) !== 1))
              : (isPageSurahStart && Number(targetSurahNum) !== 9 && Number(targetSurahNum) !== 1);
          const shouldDrawSurahFrame = showSurahHeaderFrame && !isPageContinuationFromPrev;
          const shouldDrawOpeningHeader = showOpeningHeader && isBismillah;

          const bannerScaleFactor = surahHeaderScale ? surahHeaderScale / 100 : 1;
          const bannerW = Math.round(availableW * bannerScaleFactor);
          const bannerH = shouldDrawSurahFrame ? bannerW * (30.23196 / 240.20621) : 0;

          const curHeaderFontSize = Math.round(openingHeaderSize * scaleRatio);
          const ayahFontFamilyCanvas = getAyahFontFamily(true);
          const bFontObj = getBismillahFontObj(openingHeaderFont);
          const headerFontFamily = isBismillah ? bFontObj.canvasFamily : ayahFontFamilyCanvas;
          const headerColorToUse = openingHeaderColor || textColor;

          const openingTextH = shouldDrawOpeningHeader ? Math.max(28 * scaleRatio, curHeaderFontSize * 1.4) : 0;
          const headerGap = (shouldDrawSurahFrame && shouldDrawOpeningHeader) ? Math.max(14 * scaleRatio, curHeaderFontSize * 0.5) : 0;
          // Dedicated generous margin below the header frame / bismillah so the first verse line never touches the frame
          const headerBottomMargin = (shouldDrawSurahFrame || shouldDrawOpeningHeader)
            ? Math.max(30 * scaleRatio, 36)
            : 0;
          const headerExtraH = (shouldDrawSurahFrame ? bannerH : 0) +
            (shouldDrawOpeningHeader ? openingTextH : 0) +
            headerGap +
            headerBottomMargin;

          const heightAvailableForVerses = Math.max(availableH * 0.35, availableH - headerExtraH);

          // Auto-scale font size down if necessary so ALL lines fit comfortably inside available height with generous margins
          while (curFontSize >= 11) {
            lines = [];
            let curLineWords: WordItem[] = [];
            let curLineWidths: number[] = [];
            let curLineTotalWidth = 0;
            const spaceWidth = Math.max(6, Math.round(curFontSize * 0.25));

            for (let n = 0; n < wordsList.length; n++) {
              const item = wordsList[n];
              ctx.font = `${curFontSize}px ${item.font ? `"${item.font}", ` : ""}${baseFontFamily}`;
              const wWidth = ctx.measureText(item.char).width;
              const neededWidth = curLineWords.length === 0 ? wWidth : curLineTotalWidth + spaceWidth + wWidth;

              if (neededWidth > maxTextWidth && curLineWords.length > 0) {
                lines.push({
                  words: curLineWords,
                  widths: curLineWidths,
                  totalWidth: curLineTotalWidth,
                });
                curLineWords = [item];
                curLineWidths = [wWidth];
                curLineTotalWidth = wWidth;
              } else {
                curLineWords.push(item);
                curLineWidths.push(wWidth);
                curLineTotalWidth = neededWidth;
              }
            }
            if (curLineWords.length > 0) {
              lines.push({
                words: curLineWords,
                widths: curLineWidths,
                totalWidth: curLineTotalWidth,
              });
            }

            const testLineHeight = Math.round(curFontSize * (selectedQuranFont === "qcf4" ? 2.35 : 2.45));
            if (lines.length * testLineHeight <= heightAvailableForVerses || curFontSize <= 11) {
              break;
            }
            curFontSize = Math.max(10, Math.floor(curFontSize * 0.92));
          }

          const spaceWidth = Math.max(6, Math.round(curFontSize * 0.25));
          const baseMultiplier = selectedQuranFont === "qcf4" ? 2.5 : 2.6;
          const minDesiredLineHeight = Math.round(curFontSize * baseMultiplier);
          const availableForLines = availableH - headerExtraH;
          let calculatedLineHeight = minDesiredLineHeight;

          if (availableForLines > 0 && lines.length > 0) {
            const maxRoomPerLine = Math.floor(availableForLines / lines.length);
            if (maxRoomPerLine > minDesiredLineHeight) {
              // Expand line height up to 2.85x for gracious breathing room between lines
              calculatedLineHeight = Math.min(Math.round(curFontSize * 2.85), maxRoomPerLine);
            } else {
              calculatedLineHeight = Math.max(Math.round(curFontSize * 2.2), maxRoomPerLine);
            }
          }
          const lineHeight = calculatedLineHeight;
          const totalHeight = lines.length * lineHeight + headerExtraH;

          const isCompactLayout = !showSurahInfo && !showWatermark;

          let startY = isCompactLayout
            ? topLimit + headerExtraH + Math.max(0, (availableForLines - lines.length * lineHeight) / 2) + lineHeight / 2 + ayahDeltaY
            : height / 2 + ayahDeltaY - ((lines.length - 1) * lineHeight + headerExtraH) / 2 + headerExtraH;

          // Hard boundary: First line must never climb above topLimit + headerExtraH + lineHeight / 2
          // This permanently protects the first line from colliding with the surah header frame
          const minAllowedStartY = topLimit + headerExtraH + lineHeight / 2;
          if (startY < minAllowedStartY) {
            startY = minAllowedStartY;
          }
          if (startY + (lines.length - 1) * lineHeight + lineHeight / 2 > bottomLimit) {
            startY = Math.max(minAllowedStartY, bottomLimit - (lines.length - 1) * lineHeight - lineHeight / 2);
          }

          // Shadow backdrop box
          if (showAyahText && textShadowOpacity > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${textShadowOpacity})`;
            const boxPaddingY = curFontSize * 0.45;
            const boxPaddingX = 20 * scaleRatio;
            const rHeight = totalHeight + boxPaddingY * 2;
            const radius = 18 * scaleRatio;
            const x = (width - maxTextWidth) / 2 - boxPaddingX / 2 + ayahDeltaX;
            const y = startY - headerExtraH - lineHeight / 2 - boxPaddingY;
            const w = maxTextWidth + boxPaddingX;

            ctx.beginPath();
            ctx.roundRect(x, y, w, rHeight, radius);
            ctx.fill();
          }

          // 1. Draw Surah Frame at the top
          if (shouldDrawSurahFrame) {
            const baseHeaderY = topLimit + bannerH / 2;
            const headerDrawX = width / 2 + (surahHeaderOffsetX / previewW) * width;
            const headerDrawY = baseHeaderY + (surahHeaderOffsetY / previewH) * height;

            const bannerX = headerDrawX - bannerW / 2;
            const bannerBoxY = headerDrawY - bannerH / 2;

            if (surahHeaderImg && surahHeaderImg.complete && surahHeaderImg.naturalWidth > 0) {
              ctx.drawImage(surahHeaderImg, bannerX, bannerBoxY, bannerW, bannerH);
              // Ensure crisp outer surrounding border on canvas export
              ctx.save();
              ctx.strokeStyle = surahHeaderColor || frameColor || "#C5A85C";
              ctx.lineWidth = Math.max(1.5, 1.5 * scaleRatio);
              ctx.strokeRect(bannerX + 0.5, bannerBoxY + 0.5, bannerW - 1, bannerH - 1);
              ctx.restore();
            }

            const useQbsml = isQbsmlLoaded();
            const headerGlyph = useQbsml
              ? getSurahHeaderGlyph(targetSurahNum, targetSurahName)
              : (targetSurahName?.startsWith("سُورَةُ") || targetSurahName?.startsWith("سورة") ? targetSurahName : `سُورَةُ ${targetSurahName}`);

            ctx.save();
            const cartoucheCenterY = bannerBoxY + bannerH * 0.44;
            if (useQbsml) {
              // Exact optical proportion for Medina cartouche (normal weight, no synthetic bold distortion)
              const glyphFontSize = Math.round(bannerH * 0.58);
              ctx.font = `${glyphFontSize}px "QCF4_QBSML", "Amiri", serif`;
              ctx.fillStyle = surahHeaderTextColor || textColor || "#1C1917";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(headerGlyph, headerDrawX, cartoucheCenterY);
            } else {
              let textFontSize = Math.round(bannerH * 0.36);
              ctx.font = `bold ${textFontSize}px "Amiri", "UthmanicHafs", serif`;
              const maxCartoucheW = bannerW * 0.42;
              const measuredW = ctx.measureText(headerGlyph).width;
              if (measuredW > maxCartoucheW && measuredW > 0) {
                textFontSize = Math.max(12, Math.floor(textFontSize * (maxCartoucheW / measuredW)));
                ctx.font = `bold ${textFontSize}px "Amiri", "UthmanicHafs", serif`;
              }
              ctx.fillStyle = surahHeaderTextColor || textColor || "#1C1917";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(headerGlyph, headerDrawX, cartoucheCenterY);
            }
            ctx.restore();
          }

          // 2. Draw Opening Header (Bismillah only - Isti'adhah deleted completely as requested)
          if (shouldDrawOpeningHeader && isBismillah) {
            const baseOpeningY = topLimit + (shouldDrawSurahFrame ? bannerH + headerGap : 0) + openingTextH / 2;
            const headerDrawX = width / 2 + (surahHeaderOffsetX / previewW) * width;
            const headerDrawY = baseOpeningY + (surahHeaderOffsetY / previewH) * height;

            drawBismillahCanvas(
              ctx,
              openingHeaderFont,
              curHeaderFontSize,
              headerDrawX,
              headerDrawY,
              headerColorToUse
            );
          }

          // Draw each line RTL
          if (showAyahText) {
            const ayahScaleFactor = (ayahScale || 100) / 100;
            ctx.save();
            if (ayahScaleFactor !== 1 || textRotation !== 0) {
              const centerX = width / 2 + ayahDeltaX;
              const centerY = startY + ((lines.length - 1) * lineHeight) / 2;
              ctx.translate(centerX, centerY);
              if (textRotation !== 0) ctx.rotate((textRotation * Math.PI) / 180);
              if (ayahScaleFactor !== 1) ctx.scale(ayahScaleFactor, ayahScaleFactor);
              ctx.translate(-centerX, -centerY);
            }

            lines.forEach((line, i) => {
              const lineY = startY + i * lineHeight;
              const isLastLine = i === lines.length - 1;
              const isCenter = textAlign === "center" || isLastLine;
              const isLeft = textAlign === "left" && !isLastLine;
              const isRight = textAlign === "right" && !isLastLine;
              const isJustified = (textAlign === "justify" || !textAlign) && !isLastLine && line.words.length > 1;

              const wordsWidthTotal = line.widths.reduce((a, b) => a + b, 0);

              if (isJustified) {
                // ضبط كامل لكافة أسطر الآيات من الحافة اليمنى لليسرى
                const wordGap = (maxTextWidth - wordsWidthTotal) / (line.words.length - 1);
                let currentRight = (width + maxTextWidth) / 2 + ayahDeltaX;

                line.words.forEach((item, wIdx) => {
                  const wWidth = line.widths[wIdx];
                  const itemFont = item.font ? `"${item.font}", ` : "";
                  ctx.font = `${curFontSize}px ${itemFont}${baseFontFamily}`;
                  ctx.fillStyle = textColor;
                  ctx.direction = "rtl";
                  ctx.textAlign = "right";
                  ctx.fillText(item.char, currentRight, lineY);
                  currentRight -= (wWidth + wordGap);
                });
              } else if (isCenter) {
                // توسيط السطر الأخير حصراً بتناسق تام
                const standardSpace = spaceWidth;
                const calculatedLineWidth = wordsWidthTotal + (line.words.length - 1) * standardSpace;
                let currentRight = (width + calculatedLineWidth) / 2 + ayahDeltaX;

                line.words.forEach((item, wIdx) => {
                  const wWidth = line.widths[wIdx];
                  const itemFont = item.font ? `"${item.font}", ` : "";
                  ctx.font = `${curFontSize}px ${itemFont}${baseFontFamily}`;
                  ctx.fillStyle = textColor;
                  ctx.direction = "rtl";
                  ctx.textAlign = "right";
                  ctx.fillText(item.char, currentRight, lineY);
                  currentRight -= (wWidth + standardSpace);
                });
              } else if (isLeft) {
                // محاذاة لليسار
                const standardSpace = spaceWidth;
                const calculatedLineWidth = wordsWidthTotal + (line.words.length - 1) * standardSpace;
                let currentRight = (width - maxTextWidth) / 2 + calculatedLineWidth + ayahDeltaX;

                line.words.forEach((item, wIdx) => {
                  const wWidth = line.widths[wIdx];
                  const itemFont = item.font ? `"${item.font}", ` : "";
                  ctx.font = `${curFontSize}px ${itemFont}${baseFontFamily}`;
                  ctx.fillStyle = textColor;
                  ctx.direction = "rtl";
                  ctx.textAlign = "right";
                  ctx.fillText(item.char, currentRight, lineY);
                  currentRight -= (wWidth + standardSpace);
                });
              } else {
                // محاذاة لليمين
                const standardSpace = spaceWidth;
                let currentRight = (width + maxTextWidth) / 2 + ayahDeltaX;

                line.words.forEach((item, wIdx) => {
                  const wWidth = line.widths[wIdx];
                  const itemFont = item.font ? `"${item.font}", ` : "";
                  ctx.font = `${curFontSize}px ${itemFont}${baseFontFamily}`;
                  ctx.fillStyle = textColor;
                  ctx.direction = "rtl";
                  ctx.textAlign = "right";
                  ctx.fillText(item.char, currentRight, lineY);
                  currentRight -= (wWidth + standardSpace);
                });
              }
            });
            ctx.restore();
          }
        }

        // 6. Visible Divider Line & Footer with increased breathing distance
        // الحد الظاهر بين الآيات وشعار التطبيق (Visible Divider Line between Ayahs and Logo)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(width * 0.08, dividerY);
        ctx.lineTo(width * 0.92, dividerY);
        ctx.strokeStyle = logoColor || textColor || "#1C1917";
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = Math.max(1.5, Math.round(width * 0.0016));
        ctx.stroke();
        ctx.restore();

        // Bottom Left: Surah Name Badge / Icon (على يسار السطر)
        if (showSurahInfo) {
          ctx.save();
          const infoX = width * 0.20 + (surahInfoOffsetX / previewW) * width;
          const infoY = footerBaseY + (surahInfoOffsetY / previewH) * height;
          const activeSurahColor = logoColor || textColor || "#FAF8F5";
          const infoScaleFactor = (surahInfoScale || 100) / 100;
          ctx.translate(infoX, infoY);
          ctx.scale(infoScaleFactor, infoScaleFactor);
          ctx.translate(-infoX, -infoY);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const surahHeaderGlyph = getSurahHeaderGlyph(activeData.surahNumber, activeData.surahName);
          const surahNameClean = activeData.surahName?.startsWith("سورة") ? activeData.surahName : `سورة ${activeData.surahName}`;

          let displayText = "";
          let fontStr = "";
          if (shareMode === "page") {
            const pageText = `${toArabicNumerals(selectedPageNumber)}`;
            if (surahHeaderGlyph) {
              fontStr = `${Math.round(width * 0.024)}px "QCF4_QBSML", "Amiri", serif`;
              displayText = `${surahHeaderGlyph}  ${surahNameClean}  •  ${pageText}`;
            } else {
              fontStr = `bold ${Math.round(width * 0.021)}px "Amiri", serif`;
              displayText = `﴿ ${surahNameClean} • ${pageText} ﴾`;
            }
          } else {
            if (surahHeaderGlyph) {
              fontStr = `${Math.round(width * 0.026)}px "QCF4_QBSML", "Amiri", serif`;
              displayText = `${surahHeaderGlyph}  ${surahNameClean}`;
            } else {
              fontStr = `bold ${Math.round(width * 0.022)}px "Amiri", serif`;
              displayText = `﴿ ${surahNameClean} ﴾`;
            }
          }

          ctx.font = fontStr;
          const metrics = ctx.measureText(displayText);
          const padX = width * 0.018;
          const padY = width * 0.008;
          const badgeW = metrics.width + padX * 2;
          const badgeH = Math.round(width * 0.038);
          const badgeX = infoX - badgeW / 2;
          const badgeY = infoY - badgeH / 2;
          const badgeRadius = badgeH / 2;

          // Draw pill background
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
          ctx.fill();
          ctx.lineWidth = Math.max(1, width * 0.0015);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
          ctx.stroke();

          // Text fill
          ctx.fillStyle = activeSurahColor;
          ctx.fillText(displayText, infoX, infoY);
          ctx.restore();
        }

        // Bottom Right: شعار التطبيق المعتمد واسم التطبيق مكبر 100% بدقة فائقة على يمين السطر
        if (showWatermark !== false) {
          ctx.save();
          const activeLogoColor = logoColor || textColor || "#1C1917";
          const logoScaleFactor = (watermarkScale || 100) / 100;

          const fontSize = Math.max(18, Math.round(width * 0.024));
          // تكبير الشعار بنسبة 100% (مضاعفة الحجم من 1.35 إلى 2.7) بدقة عالية
          const iconSize = Math.round(fontSize * 2.7);
          const gap = Math.round(fontSize * 0.45);

          ctx.font = `bold ${fontSize}px 'Cairo', sans-serif`;
          ctx.fillStyle = activeLogoColor;
          ctx.textBaseline = "middle";

          // تثبيت الشعار واسم التطبيق على يمين السطر (Right of the line)
          const rightBaseX = width * 0.92 + (watermarkOffsetX / previewW) * width;
          const logoY = footerBaseY + (watermarkOffsetY / previewH) * height;

          ctx.translate(rightBaseX, logoY);
          ctx.scale(logoScaleFactor, logoScaleFactor);

          // في اليمين: الشعار في أقصى اليمين، واسم التطبيق على يساره
          const iconX = -iconSize;
          const iconY = -iconSize / 2;
          const textX = iconX - gap;

          if (appLogoImg.complete && appLogoImg.naturalWidth > 0) {
            try {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";
              ctx.drawImage(appLogoImg, iconX, iconY, iconSize, iconSize);
            } catch (e) {
              // fallback gracefully
            }
          } else {
            // Elegant vector fallback emblem if image fails to render
            ctx.save();
            ctx.fillStyle = activeLogoColor;
            ctx.beginPath();
            ctx.roundRect(iconX, iconY, iconSize, iconSize, iconSize * 0.22);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = `bold ${Math.round(iconSize * 0.55)}px 'Amiri', serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("ت", iconX + iconSize / 2, 0);
            ctx.restore();
          }

          ctx.textAlign = "right";
          ctx.fillText("مصحف التبيان", textX, 0);
          ctx.restore();
        }

        try {
          const dataUrl = canvas.toDataURL("image/png");
          cachedDataUrlRef.current = dataUrl;
          const directBlob = dataUrlToBlob(dataUrl);
          if (directBlob) {
            cachedExportBlobRef.current = directBlob;
          }
          isCardDirtyRef.current = false;
          setGeneratedImageUrl(dataUrl);
        } catch (exportErr) {
          console.warn("Canvas toDataURL export error:", exportErr);
          try {
            canvas.toBlob((blob) => {
              if (blob) {
                cachedExportBlobRef.current = blob;
                const blobUrl = URL.createObjectURL(blob);
                cachedDataUrlRef.current = blobUrl;
                isCardDirtyRef.current = false;
                setGeneratedImageUrl(blobUrl);
              }
            }, "image/png");
          } catch (blobErr) {
            console.warn("Canvas toBlob export fallback failed:", blobErr);
          }
        }
      } catch (err) {
        console.error("Failed drawing canvas:", err);
      } finally {
        setIsGeneratingImage(false);
      }
    };

    drawCanvasRef.current = drawCanvas;

    isCardDirtyRef.current = true;
    const timer = setTimeout(async () => {
      await drawCanvas();
    }, 120);

    return () => clearTimeout(timer);
  }, [
    activeData,
    shareMode,
    rangeFrom,
    rangeTo,
    selectedPageNumber,
    selectedAspectRatio,
    customWidth,
    customHeight,
    bgCategory,
    gradientType,
    radialSpread,
    gradientAngle,
    gradientColor1,
    gradientColor2,
    selectedSolidColor,
    selectedPatternId,
    showPattern,
    patternOpacity,
    selectedTextureId,
    showTexture,
    textureOpacity,
    showAyahFrame,
    selectedFrameStyle,
    frameColor,
    frameWidth,
    frameInset,
    showOpeningHeader,
    openingHeaderMode,
    openingHeaderSize,
    openingHeaderColor,
    openingHeaderFont,
    showSurahHeaderFrame,
    surahHeaderStyle,
    surahHeaderColor,
    surahHeaderTextColor,
    surahHeaderScale,
    selectedQuranFont,
    textFontSize,
    textShadowOpacity,
    textAlign,
    textColor,
    logoColor,
    textOffsetY,
    textOffsetX,
    surahHeaderOffsetY,
    surahHeaderOffsetX,
    surahInfoOffsetY,
    surahInfoOffsetX,
    watermarkOffsetY,
    watermarkOffsetX,
    showIstiadhah,
    istiadhahColor,
    istiadhahSize,
    showSurahInfo,
    showWatermark,
    surahInfoScale,
    watermarkScale,
    showAyahText,
    ayahScale,
    textRotation,
    qcf4Words,
    qcf4Lines,
    qcf4Font,
    isQcf4Loaded,
  ]);

  const dataUrlToBlob = (dataUrl: string): Blob | null => {
    try {
      const parts = dataUrl.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/png";
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.warn("dataUrlToBlob conversion failed:", e);
      return null;
    }
  };

  const getCleanedAyahTextForShare = (): string => {
    if (!activeData) return "";
    let t = activeData.ayah.text || "";
    if (
      activeData.surahNumber !== 1 &&
      ((shareMode === "single" && activeData.ayah.numberInSurah === 1) ||
        (shareMode === "range" && rangeFrom === 1))
    ) {
      const bismillahRegex = /^(?:بِسْمِ\s*[\u0671\u0627]للَّ?هِ\s*[\u0671\u0627]لرَّحْمَ[ـٰ\u0670]?نِ\s*[\u0671\u0627]لرَّحِيمِ|بِسْمِ\s*[\u0671\u0627]للهِ\s*[\u0671\u0627]لرحمن\s*[\u0671\u0627]لرحيم|بِسْمِ\s*اللهِ\s*الرَّحْمٰنِ\s*الرَّحِيمِ|بسم\s*الله\s*الرحمن\s*الرحيم)[\s\r\n]*/u;
      t = t.replace(bismillahRegex, "").trim();
    }
    return t;
  };

  const getExportedImageBlob = async (forceFresh = false): Promise<{ url: string; blob: Blob | null }> => {
    // 0. INSTANT FAST-PATH: If pre-rendered Blob is already available and card hasn't been modified, return in 0ms!
    if (!forceFresh && !isCardDirtyRef.current && cachedExportBlobRef.current) {
      const url = cachedDataUrlRef.current || (generatedImageUrl ? generatedImageUrl : URL.createObjectURL(cachedExportBlobRef.current));
      return { url, blob: cachedExportBlobRef.current };
    }

    // 1. PRIMARY: High-resolution direct Canvas rendering
    // Eliminates all font skipping and foreignObject clipping, ensuring authentic Medina Mushaf vector frame & calligraphy
    if (drawCanvasRef.current) {
      try {
        setIsGeneratingImage(true);
        await drawCanvasRef.current();
        if (cachedExportBlobRef.current && cachedDataUrlRef.current) {
          return { url: cachedDataUrlRef.current, blob: cachedExportBlobRef.current };
        }
      } catch (canvasErr) {
        console.warn("drawCanvas primary rendering skipped, trying DOM fallback:", canvasErr);
      } finally {
        setIsGeneratingImage(false);
      }
    }

    // 1. PRIMARY: Fast direct capture from live DOM card (cardPreviewRef.current)
    if (cardPreviewRef.current) {
      try {
        setIsGeneratingImage(true);

        const exportFilter = (node: Node) =>
          !(
            node instanceof HTMLElement &&
            (node.classList.contains("prevent-drag") ||
              node.classList.contains("layer-controls-box") ||
              node.hasAttribute("data-export-ignore"))
          );

        // Fast toBlob capture first (5-10x faster than toPng and eliminates JS string allocations)
        let blob: Blob | null = null;
        let dataUrl: string | null = null;

        try {
          blob = await toBlob(cardPreviewRef.current, {
            pixelRatio: Math.max(2.5, typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2),
            cacheBust: false,
            skipFonts: false,
            filter: exportFilter,
          });
        } catch (fastBlobErr) {
          console.warn("Direct toBlob capture skipped, trying toPng:", fastBlobErr);
        }

        if (blob) {
          dataUrl = URL.createObjectURL(blob);
        } else {
          try {
            dataUrl = await toPng(cardPreviewRef.current, {
              pixelRatio: Math.max(2.5, typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2),
              cacheBust: false,
              skipFonts: false,
              filter: exportFilter,
            });
            blob = dataUrl ? dataUrlToBlob(dataUrl) : null;
          } catch (innerErr) {
            console.warn("toPng capture failed:", innerErr);
          }
        }

        if (blob && dataUrl) {
          cachedExportBlobRef.current = blob;
          cachedDataUrlRef.current = dataUrl;
          isCardDirtyRef.current = false;
          setGeneratedImageUrl(dataUrl);
          return { url: dataUrl, blob };
        }
      } catch (err) {
        console.warn("Direct DOM capture failed, trying fallback:", err);
      } finally {
        setIsGeneratingImage(false);
      }
    }

    // 2. FALLBACK ONLY: If DOM element was unavailable or fast capture failed
    if (cachedExportBlobRef.current) {
      const url = cachedDataUrlRef.current || (generatedImageUrl ? generatedImageUrl : URL.createObjectURL(cachedExportBlobRef.current));
      return { url, blob: cachedExportBlobRef.current };
    }

    if (generatedImageUrl) {
      if (generatedImageUrl.startsWith("data:")) {
        const directBlob = dataUrlToBlob(generatedImageUrl);
        return { url: generatedImageUrl, blob: directBlob };
      }
      try {
        const res = await fetch(generatedImageUrl);
        const blob = await res.blob();
        return { url: generatedImageUrl, blob };
      } catch (e) {
        console.warn("Direct blob conversion fallback failed:", e);
      }
      return { url: generatedImageUrl, blob: null };
    }

    return { url: "", blob: null };
  };

  const handleOpenPreviewModal = async () => {
    setShareStatus("جاري تجهيز بطاقة الآية...");
    try {
      const { url } = await getExportedImageBlob();
      const targetUrl = url || generatedImageUrl;
      if (targetUrl) {
        setPreviewModalImageUrl(targetUrl);
        setShowAndroidSaveModal(true);
        setShareStatus(null);
      } else {
        setShareStatus("تعذر تجهيز بطاقة الآية");
      }
    } catch (e) {
      console.warn("handleOpenPreviewModal error:", e);
      if (generatedImageUrl) {
        setPreviewModalImageUrl(generatedImageUrl);
        setShowAndroidSaveModal(true);
      }
    }
  };

  const handleCopyShareText = () => {
    if (!activeData) return;
    const cleanedText = getCleanedAyahTextForShare();
    let textToShare = "";
    if (shareMode === "page") {
      textToShare = `﴿ ${cleanedText} ﴾\n[القرآن الكريم - صفحة ${toArabicNumerals(selectedPageNumber)} - سورة ${activeData.surahName}]`;
    } else if (shareMode === "range") {
      textToShare = `﴿ ${cleanedText} ﴾\n[سورة ${activeData.surahName} : الآيات ${toArabicNumerals(rangeFrom)}-${toArabicNumerals(rangeTo)}]`;
    } else {
      textToShare = `﴿ ${cleanedText} ﴾\n[سورة ${activeData.surahName} : ${activeData.ayah.numberInSurah}]`;
    }
    navigator.clipboard.writeText(textToShare);
    setShareStatus("تم نسخ نص الآيات بنجاح!");
    setTimeout(() => setShareStatus(null), 3000);
  };

  const handleDownloadImage = async () => {
    if (!activeData) return;
    setShareStatus("جاري تجهيز وحفظ بطاقة المشاركة...");
    try {
      const { url, blob } = await getExportedImageBlob();
      const targetUrl = url || generatedImageUrl;
      if (!targetUrl && !blob) {
        setShareStatus("تعذر استخراج الصورة - يرجى المحاولة ثانية");
        return;
      }

      let fileName = "";
      if (shareMode === "page") {
        fileName = `مصحف_التبيان_صفحة_${selectedPageNumber}_سورة_${activeData.surahName}.png`;
      } else if (shareMode === "range") {
        fileName = `مصحف_التبيان_سورة_${activeData.surahName}_آيات_${rangeFrom}_إلى_${rangeTo}.png`;
      } else {
        fileName = `مصحف_التبيان_سورة_${activeData.surahName}_آية_${activeData.ayah.numberInSurah}.png`;
      }

      const finalBlob = blob || (targetUrl && targetUrl.startsWith("data:") ? dataUrlToBlob(targetUrl) : null);

      // 1. Android Native Javascript Interface (if app was converted to Android APK with Webview bridge)
      if (typeof window !== "undefined") {
        const anyWin = window as any;
        if (anyWin.Android?.saveImage) {
          try {
            anyWin.Android.saveImage(targetUrl, fileName);
            setShareStatus("تم حفظ الصورة بنجاح في جهازك!");
            setTimeout(() => setShareStatus(null), 3000);
            return;
          } catch (bridgeErr) {
            console.warn("Android native saveImage failed:", bridgeErr);
          }
        }
      }

      // 2. File System Access API (Supported in Chrome/Edge on Desktop and modern Android browsers)
      if (typeof (window as any).showSaveFilePicker === "function" && finalBlob) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: "صورة بطاقة الآية PNG",
              accept: { "image/png": [".png"] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(finalBlob);
          await writable.close();
          setShareStatus("تم حفظ بطاقة المشاركة بنجاح في جهازك!");
          setTimeout(() => setShareStatus(null), 3500);
          return;
        } catch (pickerErr: any) {
          if (pickerErr?.name === "AbortError") {
            setShareStatus(null);
            return;
          }
          console.warn("showSaveFilePicker failed, trying standard link download:", pickerErr);
        }
      }

      // 3. Clean link download (Never use target="_blank" as it breaks in Android WebView)
      let downloadHref = targetUrl;
      let cleanupUrl: string | null = null;
      if (!downloadHref && finalBlob) {
        cleanupUrl = URL.createObjectURL(finalBlob);
        downloadHref = cleanupUrl;
      }

      if (downloadHref) {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = downloadHref;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
          if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
        }, 1000);
      }

      // 4. On Android / Mobile devices: Always open the Android Image Saver modal
      // This gives the user the 100% guarantee that they can see the image and long-press to save it
      // directly to their Gallery / Downloads, or share to WhatsApp, Telegram, etc.
      const isMobileOrAndroid = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      if (isMobileOrAndroid) {
        setPreviewModalImageUrl(targetUrl);
        setShowAndroidSaveModal(true);
        setShareStatus("تم تجهيز البطاقة! يمكنك الضغط مطولاً على الصورة لحفظها.");
      } else {
        setShareStatus("تم تنزيل بطاقة المشاركة بنجاح إلى جهازك!");
      }
      setTimeout(() => setShareStatus(null), 3500);
    } catch (e) {
      console.error("handleDownloadImage error:", e);
      if (generatedImageUrl) {
        setPreviewModalImageUrl(generatedImageUrl);
        setShowAndroidSaveModal(true);
      }
      setShareStatus("تم فتح بطاقة الآية - يمكنك الضغط مطولاً لحفظها");
    }
  };

  const handleShareImage = async () => {
    if (!activeData || isSharing) return;
    setIsSharing(true);
    setShareStatus("جاري تحضير نافذة المشاركة...");

    try {
      // 0. FAST PATH: Use pre-rendered blob immediately if ready to preserve user gesture
      let exported: { url: string; blob: Blob | null };
      if (!isCardDirtyRef.current && cachedExportBlobRef.current) {
        exported = {
          url: cachedDataUrlRef.current || generatedImageUrl,
          blob: cachedExportBlobRef.current,
        };
      } else {
        exported = await getExportedImageBlob();
      }

      const targetUrl = exported.url || generatedImageUrl;
      const finalBlob = exported.blob || (targetUrl && targetUrl.startsWith("data:") ? dataUrlToBlob(targetUrl) : null);

      if (!targetUrl && !finalBlob) {
        setIsSharing(false);
        handleDownloadImage();
        return;
      }

      const fileName = shareMode === "page" ? `quran-page-${selectedPageNumber}.png` : `ayah-${activeData.ayah.numberInSurah}.png`;
      const titleText = shareMode === "page" 
        ? `صفحة ${selectedPageNumber} من القرآن الكريم - سورة ${activeData.surahName}`
        : shareMode === "range"
        ? `آيات من سورة ${activeData.surahName} (${rangeFrom}-${rangeTo})`
        : `آية من سورة ${activeData.surahName}`;

      const shareText = `﴿ ${getCleanedAyahTextForShare()} ﴾\n[سورة ${activeData.surahName} : ${activeData.ayah.numberInSurah}] - مصحف التبيان`;

      // 1. Android Native Javascript Interface (if app was wrapped with a native bridge)
      if (typeof window !== "undefined") {
        const anyWin = window as any;
        if (anyWin.Android?.shareImage) {
          try {
            anyWin.Android.shareImage(targetUrl, "image/png", titleText);
            setShareStatus(null);
            setIsSharing(false);
            return;
          } catch (bridgeErr) {
            console.warn("Android native shareImage failed:", bridgeErr);
          }
        }
        if (anyWin.Capacitor?.Plugins?.Share) {
          try {
            await anyWin.Capacitor.Plugins.Share.share({
              title: titleText,
              text: shareText,
              url: targetUrl.startsWith("http") ? targetUrl : undefined,
              dialogTitle: "مشاركة بطاقة الآية",
            });
            setShareStatus(null);
            setIsSharing(false);
            return;
          } catch (capErr) {
            console.warn("Capacitor share failed:", capErr);
          }
        }
      }

      // 2. Web Share API with File object (Sharing the actual card image)
      let shareSucceeded = false;
      if (finalBlob && typeof File !== "undefined" && typeof navigator !== "undefined" && navigator.canShare) {
        try {
          const file = new File([finalBlob], fileName, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: titleText,
                text: shareText,
              });
              shareSucceeded = true;
              setShareStatus("تمت مشاركة بطاقة الآية بنجاح!");
              setTimeout(() => setShareStatus(null), 3000);
              setIsSharing(false);
              return;
            } catch (shareWithTextErr: any) {
              if (
                shareWithTextErr?.name === "AbortError" ||
                shareWithTextErr?.code === 20 ||
                shareWithTextErr?.message?.toLowerCase().includes("cancel") ||
                shareWithTextErr?.message?.toLowerCase().includes("abort")
              ) {
                setShareStatus(null);
                setIsSharing(false);
                return; // User cancelled share sheet
              }
              // Some mobile browsers fail when both text and files are passed, retry with file only:
              try {
                await navigator.share({
                  files: [file],
                  title: titleText,
                });
                shareSucceeded = true;
                setShareStatus("تمت مشاركة بطاقة الآية بنجاح!");
                setTimeout(() => setShareStatus(null), 3000);
                setIsSharing(false);
                return;
              } catch (shareOnlyFileErr: any) {
                if (
                  shareOnlyFileErr?.name === "AbortError" ||
                  shareOnlyFileErr?.code === 20 ||
                  shareOnlyFileErr?.message?.toLowerCase().includes("cancel")
                ) {
                  setShareStatus(null);
                  setIsSharing(false);
                  return;
                }
              }
            }
          }
        } catch (shareFileErr: any) {
          if (
            shareFileErr?.name === "AbortError" ||
            shareFileErr?.code === 20 ||
            shareFileErr?.message?.toLowerCase().includes("cancel") ||
            shareFileErr?.message?.toLowerCase().includes("abort")
          ) {
            setShareStatus(null);
            setIsSharing(false);
            return;
          }
          console.warn("navigator.share with files failed:", shareFileErr);
        }
      }

      // 3. Fallback when system file share is unavailable or not supported in this browser/frame:
      // Try copying the image directly to the clipboard so the user can paste it anywhere
      let copiedToClipboard = false;
      if (finalBlob && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": finalBlob }),
          ]);
          copiedToClipboard = true;
        } catch (clipErr) {
          console.warn("Clipboard copy failed:", clipErr);
        }
      }

      // 4. Open the full-featured Card Share & Save Modal:
      // This guarantees the user has immediate access to download the card image, copy it, or long-press!
      setPreviewModalImageUrl(targetUrl);
      setShowAndroidSaveModal(true);
      if (copiedToClipboard) {
        setShareStatus("تم نسخ صورة البطاقة للحافظة، ويمكنك حفظها أو مشاركتها من النافذة!");
      } else {
        setShareStatus("اختر طريقة حفظ أو مشاركة بطاقة الآية");
      }
    } catch (e: any) {
      if (
        e?.name === "AbortError" ||
        e?.code === 20 ||
        e?.message?.toLowerCase().includes("cancel")
      ) {
        setShareStatus(null);
        return;
      }
      console.warn("handleShareImage failed, opening save modal:", e);
      if (generatedImageUrl) {
        setPreviewModalImageUrl(generatedImageUrl);
        setShowAndroidSaveModal(true);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleResetDefaults = () => {
    const defaultToUse = DEFAULT_SHARE_STYLE;
    setBgCategory(defaultToUse.bgCategory || "gradient");
    setGradientType(defaultToUse.gradientType || "linear");
    setGradientAngle(defaultToUse.gradientAngle ?? 135);
    setRadialSpread(defaultToUse.radialSpread ?? 75);
    setGradientColor1(defaultToUse.gradientColor1 || "#1C1917");
    setGradientColor2(defaultToUse.gradientColor2 || "#685023");
    setSelectedSolidColor(defaultToUse.selectedSolidColor || "#1C1917");
    setSelectedPatternId(defaultToUse.selectedPatternId || "islamic-concentric-diamond");
    setShowPattern(defaultToUse.showPattern ?? false);
    setPatternOpacity(defaultToUse.patternOpacity ?? 0.3);
    setPatternColor(defaultToUse.patternColor || "#C5A85C");
    setSelectedTextureId(defaultToUse.selectedTextureId || "texture-leather");
    setShowTexture(defaultToUse.showTexture ?? false);
    setTextureOpacity(defaultToUse.textureOpacity ?? 0.9);
    setSelectedAspectRatio(defaultToUse.selectedAspectRatio || "auto");
    setCustomWidth(defaultToUse.customWidth ?? 1080);
    setCustomHeight(defaultToUse.customHeight ?? 1350);
    setShowAyahFrame(defaultToUse.showAyahFrame ?? false);
    setSelectedFrameStyle(defaultToUse.selectedFrameStyle || "none");
    setFrameColor(defaultToUse.frameColor || "#C5A85C");
    setFrameWidth(defaultToUse.frameWidth ?? 2);
    setFrameInset(defaultToUse.frameInset ?? 24);
    setShowOpeningHeader(defaultToUse.showOpeningHeader ?? true);
    setOpeningHeaderMode(defaultToUse.openingHeaderMode || "auto");
    setOpeningHeaderSize(defaultToUse.openingHeaderSize ?? 30);
    setOpeningHeaderColor(defaultToUse.openingHeaderColor || defaultToUse.textColor || "#1C1917");
    setOpeningHeaderFont(defaultToUse.openingHeaderFont || "uthman_taha");
    setShowSurahHeaderFrame(defaultToUse.showSurahHeaderFrame ?? true);
    setSurahHeaderStyle(defaultToUse.surahHeaderStyle || "authentic");
    setSurahHeaderColor(defaultToUse.surahHeaderColor || "#C5A85C");
    setSurahHeaderTextColor(defaultToUse.textColor || "#1C1917");
    setSurahHeaderScale(defaultToUse.surahHeaderScale ?? 100);
    setSelectedQuranFont(defaultToUse.selectedQuranFont || "qcf4");
    setTextFontSize(defaultToUse.textFontSize ?? 28);
    setTextShadowOpacity(defaultToUse.textShadowOpacity ?? 0);
    setTextAlign(defaultToUse.textAlign || "justify");
    setTextColor(defaultToUse.textColor || "#1C1917");
    setSurahHeaderColor(defaultToUse.surahHeaderColor || "#C5A85C");
    setLogoColor(defaultToUse.logoColor || "#1C1917");
    setTextOffsetY(defaultToUse.textOffsetY ?? 0);
    setTextOffsetX(defaultToUse.textOffsetX ?? 0);
    setSurahHeaderOffsetY(defaultToUse.surahHeaderOffsetY ?? 0);
    setSurahHeaderOffsetX(defaultToUse.surahHeaderOffsetX ?? 0);
    setSurahInfoOffsetY(defaultToUse.surahInfoOffsetY ?? 0);
    setSurahInfoOffsetX(defaultToUse.surahInfoOffsetX ?? 0);
    setSurahInfoScale(defaultToUse.surahInfoScale ?? 100);
    setWatermarkOffsetY(defaultToUse.watermarkOffsetY ?? 0);
    setWatermarkOffsetX(defaultToUse.watermarkOffsetX ?? 0);
    setWatermarkScale(defaultToUse.watermarkScale ?? 100);
    setShowAyahText(defaultToUse.showAyahText ?? true);
    setSelectedLayer(null);
    setShowIstiadhah(defaultToUse.showIstiadhah ?? false);
    setIstiadhahColor(defaultToUse.istiadhahColor || defaultToUse.textColor || "#1C1917");
    setIstiadhahSize(defaultToUse.istiadhahSize ?? 38);
    setShowSurahInfo(defaultToUse.showSurahInfo ?? false);
    setShowWatermark(defaultToUse.showWatermark ?? true);
    setIsMovementLocked(true);
    setActiveTab("typography");

    const defaultMode = defaultToUse.shareMode || "range";
    const defaultSurah = defaultToUse.defaultSurahNumber || 14;
    const defaultFrom = defaultToUse.rangeFrom || 40;
    const defaultTo = defaultToUse.rangeTo || 41;
    setShareMode(defaultMode);
    setRangeFrom(defaultFrom);
    setRangeTo(defaultTo);
    handleChangeRange(defaultSurah, defaultFrom, defaultTo);

    try {
      localStorage.setItem(LOCAL_SHARE_STYLE_KEY, JSON.stringify(DEFAULT_SHARE_STYLE));
      localStorage.setItem(USER_CUSTOM_DEFAULT_STYLE_KEY, JSON.stringify(DEFAULT_SHARE_STYLE));
      localStorage.setItem("quran_share_default_style_v1", JSON.stringify(DEFAULT_SHARE_STYLE));
      localStorage.setItem("quran_share_user_custom_default_v1", JSON.stringify(DEFAULT_SHARE_STYLE));
      localStorage.setItem(DEFAULT_SHARE_AYAH_KEY, JSON.stringify({
        mode: defaultMode,
        surahNumber: defaultSurah,
        surahName: defaultToUse.defaultSurahName || "ابراهيم",
        ayahNumber: defaultFrom,
        rangeFrom: defaultFrom,
        rangeTo: defaultTo,
        pageNumber: 260,
      }));
    } catch {}

    setShareStatus("تمت استعادة التنسيق الافتراضي بنجاح");
    setTimeout(() => setShareStatus(null), 3000);
  };

  const isOpeningMushafPage =
    shareMode === "page" && (selectedPageNumber === 1 || selectedPageNumber === 2);

  const isDisplayingQcf4Lines =
    shareMode === "page" &&
    selectedQuranFont === "qcf4" &&
    isQcf4Loaded &&
    qcf4Lines.length > 0;

  const isPageMode = (shareMode as string) === "page";
  const targetPageNum = selectedPageNumber || activeData?.pageNumber || activeData?.ayah?.page || 1;
  const pageHeaderPositions = SURAH_HEADER_POSITIONS[targetPageNum] || [];
  const hasHeaderAtPageTop = pageHeaderPositions.some((h) => Math.abs(h.yCenter - 25.2) < 5);
  const isFirstQcfLineHeader = qcf4Lines.length > 0 && qcf4Lines[0]?.words?.some((w) => w.type === "surah_header");

  const isPageStartingWithSurahAtTop = isPageMode && (
    qcf4Lines.length > 0 ? isFirstQcfLineHeader : hasHeaderAtPageTop
  );

  // If it's page mode and does NOT start with a surah header at the top, it is a continuation of a previous surah
  const isPageContinuationFromPrev = isPageMode && !isPageStartingWithSurahAtTop;
  const shouldShowSurahFrameAtTop = showSurahHeaderFrame && !isPageContinuationFromPrev;

  // Helper to render opening header (Surah Header Frame on top, and Bismillah below it when appropriate)
  const renderOpeningHeader = () => {
    if (!showSurahHeaderFrame && !showOpeningHeader) return null;

    const pageMeta = isPageMode ? quranSvgPageMetadata.find((p) => p.page === targetPageNum) : null;
    const targetSurahNum = isPageMode
      ? (pageMeta?.surahNumber || activeData?.surahNumber || 1)
      : (activeData?.surahNumber || 1);
    const targetSurahName = isPageMode
      ? (pageMeta?.surahNameAr || activeData?.surahName || "الفاتحة")
      : (activeData?.surahName || "");

    const isPageSurahStart = isPageStartingWithSurahAtTop;

    const hasSurahStart =
      (shareMode === "single" && Number(activeData?.ayah?.numberInSurah) === 1) ||
      (shareMode === "range" && Number(rangeFrom) === 1) ||
      isPageSurahStart;

    const isBismillah =
      !isPageMode
        ? (openingHeaderMode === "bismillah" ||
           (openingHeaderMode === "auto" && hasSurahStart && Number(targetSurahNum) !== 9 && Number(targetSurahNum) !== 1))
        : (isPageSurahStart && Number(targetSurahNum) !== 9 && Number(targetSurahNum) !== 1);

    const shouldShowBismillah = !isPageMode
      ? (showOpeningHeader && isBismillah)
      : (!isDisplayingQcf4Lines && isPageSurahStart && showOpeningHeader && isBismillah);

    if (!shouldShowSurahFrameAtTop && !shouldShowBismillah) {
      return null;
    }

    const bFontObj = getBismillahFontObj(openingHeaderFont);

    return (
      <div className="relative z-10 w-full flex flex-col items-center justify-center select-none cursor-default mt-0 mb-3 sm:mb-4 shrink-0 space-y-2">
        {/* سطر أعلى البطاقة: إطار اسم السورة مع الاسم */}
        {shouldShowSurahFrameAtTop && (
          <div className="w-full flex items-center justify-center px-1">
            <ShareSurahHeaderFrame
              surahNumber={targetSurahNum}
              surahName={targetSurahName}
              frameColor={surahHeaderColor || "#C5A85C"}
              textColor={surahHeaderTextColor || textColor}
              headerStyle={surahHeaderStyle}
              scale={surahHeaderScale ? surahHeaderScale / 100 : 1}
            />
          </div>
        )}

        {/* وتحته: البسملة فقط إن كانت مفعلة ومناسبة */}
        {shouldShowBismillah && (
          <div className="w-full px-3 flex items-center justify-center select-none pointer-events-none">
            <div
              className="w-full text-center tracking-normal select-none pointer-events-none"
              style={{
                fontFamily: bFontObj.family,
                fontSize: `${openingHeaderSize}px`,
                color: openingHeaderColor || textColor,
                lineHeight: 1.25,
              }}
            >
              {renderBismillahContent(openingHeaderFont)}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!shareData) return null;

  return createPortal(
    <div
      id="share-ayah-modal-backdrop"
      className="fixed top-0 inset-x-0 bottom-[48px] md:bottom-[52px] z-[490] w-full bg-black/95 flex flex-col items-stretch justify-start overflow-hidden p-0"
      onClick={onClose}
    >
      <div
        id="share-ayah-modal-container"
        onClick={(e) => e.stopPropagation()}
        className={`w-full h-full flex flex-col overflow-hidden ${tTheme.modalBg}`}
        style={{ direction: "rtl" }}
      >
          {/* Modal Header */}
          <div
            className={`px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b shrink-0 sticky top-0 z-30 backdrop-blur-md ${tTheme.headerFooterBg}`}
          >
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center font-bold border shrink-0 ${tTheme.headerIcon}`}>
                <Sparkles size={11} className="sm:w-3.5 sm:h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs sm:text-sm md:text-base leading-tight">
                  مشاركة الآية
                </span>
                <span className={`text-[9px] sm:text-[10px] font-medium leading-tight ${tTheme.subText}`}>
                  تصميم ومشاركة بطاقة الآية الكريمة
                </span>
              </div>
            </div>

            <button
              id="share-ayah-close-header-btn"
              onClick={onClose}
              title="إغلاق النافذة"
              className="p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 shrink-0"
            >
              <X size={16} className="sm:w-[18px] sm:h-[18px] stroke-[2.5px] text-red-500 dark:text-red-400" />
            </button>
          </div>

          {/* Main Visual Studio Area */}
          <div className="p-2 sm:p-4 md:p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar space-y-4 sm:space-y-5 touch-pan-y overscroll-contain w-full">
            <div className="flex flex-col items-center gap-3 sm:gap-4.5 w-full max-w-full lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto transition-all duration-300 px-0.5 sm:px-2">
              
              {/* LIVE CARD PREVIEW */}
              <div className="w-full flex flex-col items-center">
                {/* Header bar above card */}
                <div className="w-full flex items-center justify-between px-1 mb-2">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Sparkles size={11} className={`sm:w-3 sm:h-3 ${tTheme.accentText}`} />
                      <span>معاينة البطاقة</span>
                    </span>
                  </div>
                </div>

                <div
                  ref={cardPreviewRef}
                  id="share-ayah-card-preview"
                  dir="rtl"
                  className={`w-full max-w-full rounded-2xl overflow-hidden shadow-2xl relative border-0 flex flex-col items-center justify-between select-none transition-all duration-300 min-h-0 h-auto pt-3 sm:pt-4 pb-1 sm:pb-1.5 ${
                    shareMode === "page" ? "px-2.5 sm:px-4" : "px-3 sm:px-5"
                  }`}
                  style={{
                    direction: "rtl",
                    touchAction: "auto",
                    containerType: "inline-size",
                    background: bgCategory === "none" ? "transparent" : currentBackgroundCss,
                  }}
                >
                  {/* Transparent Canvas Checkerboard (Visible only in 'none' mode for visual clarity) */}
                  {bgCategory === "none" && (
                    <div
                      className="absolute inset-0 pointer-events-none z-0 opacity-30"
                      style={{
                        backgroundImage: `linear-gradient(45deg, #71717a 25%, transparent 25%), linear-gradient(-45deg, #71717a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #71717a 75%), linear-gradient(-45deg, transparent 75%, #71717a 75%)`,
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                        backgroundColor: "#18181b",
                      }}
                    />
                  )}

                  {/* سطر أعلى البطاقة: إطار اسم السورة وتحته البسملة */}
                  {(showSurahHeaderFrame || showOpeningHeader) && (
                    renderOpeningHeader()
                  )}

                  {/* TEXT CONTAINER (Ayah text window) - Stably positioned, full width, auto-expanding vertically */}
                  {showAyahText && (
                    <div
                      dir="rtl"
                      className={
                        shareMode === "page" || isOpeningMushafPage
                          ? "w-full flex-1 flex flex-col justify-around items-stretch text-center z-10 select-none relative cursor-default my-1 px-2 py-1"
                          : "w-full flex flex-col items-center justify-center text-center z-10 select-none relative cursor-default mt-1.5 sm:mt-2.5 mb-1 px-1 sm:px-2 py-0"
                      }
                      style={{
                        direction: "rtl",
                        backgroundColor: textShadowOpacity > 0 ? `rgba(0, 0, 0, ${textShadowOpacity})` : undefined,
                        touchAction: "auto",
                      }}
                    >
                    {isLoadingVerse || (shareMode === "page" && selectedQuranFont === "qcf4" && !isDisplayingQcf4Lines) ? (
                      <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-emerald-300/80">
                        <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium">جاري تحميل صفحة المصحف الشريف...</span>
                      </div>
                    ) : isDisplayingQcf4Lines ? (
                      <div
                        className={`w-full h-full flex flex-col ${isOpeningMushafPage ? "justify-around gap-1.5 sm:gap-2" : "justify-between gap-1 sm:gap-2"} items-stretch text-center select-none pointer-events-none py-1.5 sm:py-2.5`}
                        dir="rtl"
                        style={{ direction: "rtl" }}
                      >
                        {qcf4Lines.map((line, lIdx) => {
                          const isSurahHeader = line.words.some((w) => w.type === "surah_header");
                          const isBismillah = line.words.some((w) => w.type === "bismillah");

                          // Identify if this line is the last line of a surah or the very last line of the page
                          let nextSectionIdx = qcf4Lines.length;
                          for (let i = lIdx + 1; i < qcf4Lines.length; i++) {
                            if (qcf4Lines[i]?.words?.some((w) => w.type === "surah_header")) {
                              nextSectionIdx = i;
                              break;
                            }
                          }
                          const isLastLineOfSection = lIdx === nextSectionIdx - 1;
                          const isLastLine = lIdx === qcf4Lines.length - 1 || isLastLineOfSection;

                          // Center ONLY the last line (or in opening ornamental pages 1 & 2), and justify all other lines
                          const shouldCenter =
                            isLastLine ||
                            isOpeningMushafPage ||
                            textAlign === "center";

                          const shouldJustify =
                            !isSurahHeader &&
                            !isBismillah &&
                            !shouldCenter &&
                            (textAlign === "justify" || !textAlign);

                          // In page mode, the FIRST surah header (lIdx === 0) is displayed at top of preview only if it starts at line 1.
                          // For the 2nd and 3rd surah (lIdx > 0), we DO render it in place!
                          if (isSurahHeader && (!showSurahHeaderFrame || (lIdx === 0 && shouldShowSurahFrameAtTop))) return null;
                          if (isBismillah && !showOpeningHeader) return null;

                          return (
                            <div
                              key={`share-page-line-${lIdx}`}
                              dir="rtl"
                              className={`w-full flex items-center ${
                                isSurahHeader || isBismillah
                                  ? "justify-center"
                                  : shouldJustify
                                  ? "justify-between"
                                  : "justify-center gap-1.5 sm:gap-2.5"
                              } ${isOpeningMushafPage ? "py-1 sm:py-1.5 my-0.5" : "py-1 sm:py-1.5"} text-center flex-nowrap`}
                              style={{
                                direction: "rtl",
                                minHeight: isOpeningMushafPage ? "2.4em" : "2.15em",
                                lineHeight: isOpeningMushafPage ? 1.6 : 1.52,
                              }}
                            >
                              {line.words.map((w, wIdx) => {
                                const isSurahHeaderWord = w.type === "surah_header";
                                const isBismillahWord = w.type === "bismillah";
                                const isEnd = w.type === "end";
                                const wordFont = w.font || (isSurahHeaderWord || isBismillahWord ? "QCF4_QBSML" : qcf4Font);

                                if (isSurahHeaderWord) {
                                  // If line 0 is the 1st surah and already rendered at the very top of the card
                                  if (lIdx === 0 && shouldShowSurahFrameAtTop) return null;

                                  let lineSurahNum: number | undefined;
                                  const glyphChar = w.char || "";
                                  if (glyphChar && glyphChar.length === 1) {
                                    const code = glyphChar.charCodeAt(0);
                                    if (code >= 0xF100 && code <= 0xF171) {
                                      lineSurahNum = code - 0xF100 + 1;
                                    }
                                  }
                                  if (!lineSurahNum) {
                                    let hCount = 0;
                                    for (let i = 0; i < lIdx; i++) {
                                      if (qcf4Lines[i]?.words?.some((lw) => lw.type === "surah_header")) hCount++;
                                    }
                                    const pageToUse = selectedPageNumber || activeData?.pageNumber || activeData?.ayah?.page || 1;
                                    const pSurahs = SURAH_HEADER_POSITIONS[pageToUse] || [];
                                    if (pSurahs[hCount]) lineSurahNum = pSurahs[hCount].surah;
                                  }
                                  if (!lineSurahNum) {
                                    for (let li = lIdx + 1; li < qcf4Lines.length; li++) {
                                      for (const lw of qcf4Lines[li]?.words || []) {
                                        if (lw.verse_key) {
                                          const [vsNum] = lw.verse_key.split(":").map(Number);
                                          if (vsNum) {
                                            lineSurahNum = vsNum;
                                            break;
                                          }
                                        }
                                      }
                                      if (lineSurahNum) break;
                                    }
                                  }
                                  const foundS = lineSurahNum ? surahsList.find((s) => s.number === lineSurahNum) : null;
                                  const lineSurahName = foundS ? foundS.name : "";

                                  return (
                                    <div
                                      key={`pw-${lIdx}-${wIdx}`}
                                      className="w-full flex items-center justify-center my-0.5 sm:my-1"
                                      dir="rtl"
                                    >
                                      <ShareSurahHeaderFrame
                                        surahNumber={lineSurahNum || 1}
                                        surahName={lineSurahName}
                                        glyph={w.char}
                                        frameColor={surahHeaderColor || "#C5A85C"}
                                        textColor={surahHeaderTextColor || textColor}
                                        headerStyle={surahHeaderStyle}
                                        scale={surahHeaderScale ? surahHeaderScale / 100 : 1}
                                      />
                                    </div>
                                  );
                                }

                                if (isBismillahWord) {
                                  if (!showOpeningHeader) return null;
                                  const activeBFont = getBismillahFontObj(openingHeaderFont);
                                  return (
                                    <div
                                      key={`pw-${lIdx}-${wIdx}`}
                                      className="w-full text-center my-0.5 select-none flex items-center justify-center cursor-pointer"
                                      dir="rtl"
                                      style={{
                                        fontFamily: activeBFont.family,
                                        fontSize: shareMode === "page"
                                          ? (isOpeningMushafPage ? "clamp(1.15rem, 4.6cqi, 2.2rem)" : "clamp(0.95rem, 3.8cqi, 1.85rem)")
                                          : `${Math.max(15, textFontSize * 0.92)}px`,
                                        color: openingHeaderColor || textColor,
                                        lineHeight: 1.25,
                                        direction: "rtl",
                                      }}
                                    >
                                      {renderBismillahContent(openingHeaderFont, w.char, w.font)}
                                    </div>
                                  );
                                }

                                return (
                                  <span
                                    key={`pw-${lIdx}-${wIdx}`}
                                    dir="rtl"
                                    className="inline-block select-none pointer-events-none shrink-0"
                                    style={{
                                      fontFamily: `"${wordFont}", 'QCF4_QBSML', 'Amiri', serif`,
                                      fontSize: shareMode === "page"
                                        ? (isOpeningMushafPage ? "clamp(1.18rem, 5cqi, 2.45rem)" : "clamp(1.08rem, 4.65cqi, 2.3rem)")
                                        : `${isOpeningMushafPage ? Math.min(textFontSize, 26) : textFontSize}px`,
                                      color: textColor,
                                      lineHeight: isOpeningMushafPage ? 1.55 : 1.45,
                                      direction: "rtl",
                                    }}
                                  >
                                    {w.char || w.text}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ) : selectedQuranFont === "qcf4" && isQcf4Loaded && qcf4Words.length > 0 ? (
                      <div
                        className={`w-full select-none pointer-events-none flex flex-wrap items-center ${
                          textAlign === "right"
                            ? "justify-start"
                            : textAlign === "left"
                            ? "justify-end"
                            : "justify-center"
                        } gap-x-1 sm:gap-x-1.5 gap-y-1 text-center`}
                        dir="rtl"
                        style={{
                          direction: "rtl",
                          lineHeight: 2.2,
                        }}
                      >
                        {qcf4Words.map((w, idx) => (
                          <span
                            key={`qcf4-w-${activeData?.surahNumber || 1}-${activeData?.ayah?.numberInSurah || 1}-${idx}`}
                            dir="rtl"
                            style={{
                              fontFamily: w.font || qcf4Font || "'QCF4_QBSML', 'Amiri', 'UthmanicHafs', serif",
                              fontSize: `${textFontSize}px`,
                              color: textColor,
                              display: "inline-block",
                              direction: "rtl",
                              whiteSpace: "nowrap",
                            }}
                            className="shrink-0"
                          >
                            {w.char || w.text}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center justify-center select-none pointer-events-none" dir="rtl" style={{ direction: "rtl" }}>
                        {shareMode === "page" && pageSurahSections.length > 1 ? (
                          <div className="w-full flex flex-col items-center gap-2 sm:gap-3">
                            {pageSurahSections.map((sec, secIdx) => {
                              const showSecHeader = secIdx > 0 && showSurahHeaderFrame;
                              const showSecBismillah = secIdx > 0 && showOpeningHeader && sec.surahNumber !== 9;
                              return (
                                <div key={`sec-${sec.surahNumber}-${secIdx}`} className="w-full flex flex-col items-center">
                                  {showSecHeader && (
                                    <div className="w-full flex items-center justify-center my-1 sm:my-2 px-1">
                                      <ShareSurahHeaderFrame
                                        surahNumber={sec.surahNumber}
                                        surahName={sec.surahName}
                                        frameColor={surahHeaderColor || "#C5A85C"}
                                        textColor={surahHeaderTextColor || textColor}
                                        headerStyle={surahHeaderStyle}
                                        scale={surahHeaderScale ? surahHeaderScale / 100 : 1}
                                      />
                                    </div>
                                  )}
                                  {showSecBismillah && (
                                    <div
                                      className="w-full text-center my-0.5 sm:my-1 select-none flex items-center justify-center"
                                      dir="rtl"
                                      style={{
                                        fontFamily: "'UthmanicHafs', 'Amiri', serif",
                                        fontSize: `${Math.max(16, textFontSize * 1.15)}px`,
                                        color: openingHeaderColor || textColor,
                                        lineHeight: 1.3,
                                        direction: "rtl",
                                      }}
                                    >
                                      <span>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</span>
                                    </div>
                                  )}
                                  <p
                                    className="w-full select-none pointer-events-none"
                                    dir="rtl"
                                    style={{
                                      fontSize: shareMode === "page" ? "clamp(12px, 3.8cqi, 16px)" : `${textFontSize}px`,
                                      color: textColor,
                                      textAlign: textAlign === "right" ? "right" : textAlign === "left" ? "left" : "justify",
                                      textAlignLast: "center",
                                      textJustify: "inter-word",
                                      direction: "rtl",
                                      lineHeight: 1.6,
                                      fontFamily:
                                        selectedQuranFont === "amiri"
                                          ? "'Amiri', serif"
                                          : selectedQuranFont === "uthman"
                                          ? "'UthmanicHafs', 'Amiri', serif"
                                          : selectedQuranFont === "cairo"
                                          ? "'Cairo', sans-serif"
                                          : "'UthmanicHafs', 'Amiri', serif",
                                    }}
                                  >
                                    {sec.ayahsText}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p
                            className={`w-full select-none pointer-events-none ${shareMode === "page" ? "line-clamp-none" : ""}`}
                            dir="rtl"
                            style={{
                              fontSize: shareMode === "page" ? "clamp(12px, 3.8cqi, 16px)" : `${textFontSize}px`,
                              color: textColor,
                              textAlign: textAlign === "right" ? "right" : textAlign === "left" ? "left" : "justify",
                              textAlignLast: "center",
                              textJustify: "inter-word",
                              direction: "rtl",
                              lineHeight: shareMode === "page" ? 1.55 : 1.85,
                              fontFamily:
                                selectedQuranFont === "amiri"
                                  ? "'Amiri', serif"
                                  : selectedQuranFont === "uthman"
                                  ? "'UthmanicHafs', 'Amiri', serif"
                                  : selectedQuranFont === "cairo"
                                  ? "'Cairo', sans-serif"
                                  : "'UthmanicHafs', 'Amiri', serif",
                            }}
                          >
                            {(() => {
                              let t = activeData?.ayah?.text || "";
                              if (activeData?.surahNumber !== 1 && ((shareMode === "single" && activeData?.ayah?.numberInSurah === 1) || (shareMode === "range" && rangeFrom === 1))) {
                                const bismillahVariants = [
                                  "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                                  "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
                                  "بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ",
                                  "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ",
                                  "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ"
                                ];
                                for (const b of bismillahVariants) {
                                  if (t.startsWith(b)) {
                                    t = t.replace(b, "").trim();
                                    break;
                                  }
                                }
                              }
                              return t;
                            })()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {/* حد ظاهر بين الآيات وسطر شعار التطبيق */}
                  <div
                    className="relative z-10 w-full mt-3.5 mb-2 sm:mt-4 sm:mb-2.5 border-t select-none pointer-events-none"
                    style={{
                      borderColor: logoColor || textColor || "#1C1917",
                      opacity: 0.35,
                      borderTopWidth: "1.5px",
                    }}
                  />

                  {/* سطر أسفل البطاقة: على اليمين شعار التطبيق (مكبر 100%) واسم التطبيق، وعلى اليسار معلومات السورة/الصفحة (منزل قليلاً للأسفل) */}
                  <div
                    className="relative z-10 w-full flex items-center justify-between shrink-0 px-1 pt-0.5 pb-1 select-none cursor-default"
                    dir="rtl"
                  >
                    {/* على يمين السطر: شعار التطبيق مكبر 100% بدقة فائقة واسم التطبيق (مصحف التبيان بخط القاهرة) */}
                    {showWatermark !== false ? (
                      <div
                        className="flex items-center select-none cursor-default gap-2 sm:gap-2.5"
                        style={{
                          transform: `translate(${watermarkOffsetX}px, ${watermarkOffsetY}px) scale(${(watermarkScale || 100) / 100})`,
                          transformOrigin: "right center",
                        }}
                      >
                        {/* شعار التطبيق المعتمد */}
                        <img
                          src="/app-logo-256.png"
                          srcSet="/app-logo-256.png 1x, /app-logo-512.png 2x"
                          alt="شعار مصحف التبيان"
                          className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 select-none pointer-events-none drop-shadow-md rounded-lg"
                          style={{
                            imageRendering: "auto",
                            WebkitFontSmoothing: "antialiased",
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/IMG_1767.png";
                          }}
                        />
                        {/* اسم التطبيق على يسار الشعار (مصحف التبيان بخط القاهرة) */}
                        <span
                          className="font-bold tracking-wide select-none leading-none whitespace-nowrap"
                          style={{
                            color: logoColor || textColor || "#1C1917",
                            fontFamily: "'Cairo', sans-serif",
                            fontSize: "16px",
                          }}
                        >
                          مصحف التبيان
                        </span>
                      </div>
                    ) : (
                      <div className="w-0 shrink-0" />
                    )}

                    {/* على يسار السطر: مساحة خالية بعد حذف شارة معلومات السورة */}
                    <div className="w-0 shrink-0" />
                  </div>
                </div>
              </div>

              {/* STUDIO CONTROL TABS */}
              <div className="w-full space-y-3 pt-1">
                
                {/* 🌟 SHARE SCOPE SELECTOR: الآيات / صفحة كاملة */}
                <div className={`p-0.5 sm:p-1 rounded-2xl border shadow-inner grid grid-cols-2 gap-1 ${tTheme.tabContainer}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setShareMode("range");
                      setQcf4Lines([]);
                      const restoredSize = Math.max(26, savedAyahFontSizeRef.current || savedAyahFontSize || 28);
                      setTextFontSize(restoredSize);
                      if (savedAspectRatioRef.current && savedAspectRatioRef.current !== "9:16") {
                        setSelectedAspectRatio(savedAspectRatioRef.current);
                      } else {
                        setSelectedAspectRatio("auto");
                      }
                      handleChangeRange(activeData.surahNumber, rangeFrom, rangeTo);
                    }}
                    className={`py-1 sm:py-1.5 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      shareMode !== "page" ? tTheme.tabActive : tTheme.tabInactive
                    }`}
                  >
                    <Layers size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span>الآيات</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (textFontSize >= 22) {
                        savedAyahFontSizeRef.current = textFontSize;
                        setSavedAyahFontSize(textFontSize);
                      }
                      if (selectedAspectRatio !== "9:16") {
                        savedAspectRatioRef.current = selectedAspectRatio;
                      }
                      setShareMode("page");
                      handleChangePage(selectedPageNumber || activeData.ayah?.page || 1, false);
                    }}
                    className={`py-1 sm:py-1.5 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      shareMode === "page" ? tTheme.tabActive : tTheme.tabInactive
                    }`}
                  >
                    <BookOpen size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span>صفحة كاملة</span>
                  </button>
                </div>

                {/* 🌟 SELECTOR ROW: الآيات */}
                <div className={`p-2 sm:p-2.5 rounded-2xl border shadow-xs space-y-2 sm:space-y-2.5 ${tTheme.innerBox}`}>
                  {/* Mode: Multiple Ayahs (Range) */}
                  {shareMode !== "page" && (
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2">
                      {/* Surah Selector */}
                      <div className="relative flex-1 min-w-[105px] sm:min-w-[140px]">
                        <button
                          type="button"
                          onClick={() => setIsSurahDropdownOpen(!isSurahDropdownOpen)}
                          className={`w-full h-7 sm:h-[34px] py-0.5 sm:py-1 px-1.5 sm:px-2.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-1 shadow-xs ${tTheme.selectedCard}`}
                          title="اختيار السورة"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <BookOpen size={11} className={`${tTheme.accentText} sm:w-3.5 sm:h-3.5 shrink-0`} />
                            <span
                              className="text-xs xs:text-sm sm:text-base font-normal leading-none select-none truncate"
                              style={{ fontFamily: "QCF4_QBSML, 'Amiri', serif" }}
                            >
                              {getSurahHeaderGlyph(activeData.surahNumber, activeData.surahName) || `سورة ${activeData.surahName}`}
                            </span>
                          </div>
                          <ChevronDown size={11} className={`shrink-0 opacity-70 transition-transform duration-200 ${isSurahDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        <SurahSelectModal
                          isOpen={isSurahDropdownOpen}
                          onClose={() => setIsSurahDropdownOpen(false)}
                          selectedSurahNumber={activeData.surahNumber}
                          onSelectSurah={(num) => {
                            handleChangeRange(num, 1, Math.min(3, surahsList.find((s) => s.number === num)?.numberOfAyahs || 7));
                          }}
                          isDark={true}
                          theme="gold-velvet"
                          align="right"
                        />
                      </div>

                      {/* From Ayah Selector */}
                      <div className={`h-7 sm:h-[34px] flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 rounded-xl border shrink-0 ${tTheme.tabContainer}`}>
                        <span className="text-[9px] sm:text-[10px] font-bold opacity-75 shrink-0">من:</span>
                        <select
                          value={rangeFrom}
                          disabled={isLoadingVerse}
                          onChange={(e) => {
                            const newFrom = parseInt(e.target.value, 10);
                            handleChangeRange(activeData.surahNumber, newFrom, Math.max(newFrom, rangeTo));
                          }}
                          className={`py-0.5 px-1 sm:px-1.5 text-[10px] sm:text-xs font-bold rounded-lg border appearance-none text-center cursor-pointer transition-all ${tTheme.subTabActive}`}
                        >
                          {Array.from({ length: currentSurahObj.numberOfAyahs }, (_, i) => i + 1).map((aNum) => (
                            <option key={`from-${aNum}`} value={aNum} className="bg-slate-900 text-white">
                              {toArabicNumerals(aNum)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* To Ayah Selector */}
                      <div className={`h-7 sm:h-[34px] flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 rounded-xl border shrink-0 ${tTheme.tabContainer}`}>
                        <span className="text-[9px] sm:text-[10px] font-bold opacity-75 shrink-0">إلى:</span>
                        <select
                          value={rangeTo}
                          disabled={isLoadingVerse}
                          onChange={(e) => {
                            const newTo = parseInt(e.target.value, 10);
                            handleChangeRange(activeData.surahNumber, rangeFrom, newTo);
                          }}
                          className={`py-0.5 px-1 sm:px-1.5 text-[10px] sm:text-xs font-bold rounded-lg border appearance-none text-center cursor-pointer transition-all ${tTheme.subTabActive}`}
                        >
                          {Array.from({ length: currentSurahObj.numberOfAyahs - rangeFrom + 1 }, (_, i) => rangeFrom + i).map((aNum) => (
                            <option key={`to-${aNum}`} value={aNum} className="bg-slate-900 text-white">
                              {toArabicNumerals(aNum)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Count Badge */}
                      <span className={`h-7 sm:h-[34px] flex items-center px-2 text-[10px] sm:text-[11px] font-bold rounded-xl border shrink-0 ${tTheme.accentText} ${tTheme.innerBox}`}>
                        {toArabicNumerals(rangeTo - rangeFrom + 1)} آيات
                      </span>
                    </div>
                  )}

                  {/* Mode 3: Full Page */}
                  {shareMode === "page" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                        {/* Previous Page Button (RTL: right arrow goes to prev page) */}
                        <button
                          type="button"
                          disabled={selectedPageNumber <= 1 || isLoadingVerse}
                          onClick={() => handleChangePage(selectedPageNumber - 1, false)}
                          title="الصفحة السابقة"
                          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${tTheme.quickBtn}`}
                        >
                          <ChevronRight size={13} className="sm:w-4 sm:h-4" />
                        </button>

                        {/* Page Direct Selector */}
                        <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2">
                          <span className="text-[10px] sm:text-xs font-bold opacity-80">صفحة:</span>
                          <select
                            value={selectedPageNumber}
                            disabled={isLoadingVerse}
                            onChange={(e) => handleChangePage(parseInt(e.target.value, 10), false)}
                            className={`py-1 px-2 sm:px-3 text-[10px] sm:text-xs font-bold rounded-xl border appearance-none text-center cursor-pointer min-w-[80px] sm:min-w-[100px] transition-all shadow-xs ${tTheme.subTabActive}`}
                          >
                            {Array.from({ length: 604 }, (_, i) => i + 1).map((pNum) => (
                              <option key={`p-${pNum}`} value={pNum} className="bg-slate-900 text-white">
                                صفحة {toArabicNumerals(pNum)}
                              </option>
                            ))}
                          </select>
                          <span className="text-[9px] sm:text-[11px] opacity-60">من ٦٠٤</span>
                        </div>

                        {/* Next Page Button (RTL: left arrow goes to next page) */}
                        <button
                          type="button"
                          disabled={selectedPageNumber >= 604 || isLoadingVerse}
                          onClick={() => handleChangePage(selectedPageNumber + 1, false)}
                          title="الصفحة التالية"
                          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${tTheme.quickBtn}`}
                        >
                          <ChevronLeft size={13} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Loading Verse Feedback Indicator */}
                  {isLoadingVerse && (
                    <div className="text-[10px] text-center text-emerald-400 font-bold animate-pulse flex items-center justify-center gap-1.5 pt-1">
                      <Sparkles size={11} />
                      <span>جاري تحميل نص ورسم الآيات الكريمة...</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Status Notice */}
              {shareStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`w-full p-2 rounded-xl text-center text-xs font-bold border ${tTheme.statusNotice}`}
                >
                  {shareStatus}
                </motion.div>
              )}

              {/* Modal Bottom Footer Actions - Now in the original page flow under the controls */}
              <div
                id="share-ayah-modal-footer-bar"
                className={`w-full max-w-full lg:max-w-4xl xl:max-w-5xl p-2 sm:p-3 rounded-2xl border flex items-center justify-between gap-1.5 sm:gap-2 shadow-sm backdrop-blur-md mt-1 mb-8 sm:mb-10 ${tTheme.headerFooterBg}`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={onClose}
                    title="إغلاق النافذة"
                    aria-label="إغلاق النافذة"
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all cursor-pointer border flex items-center justify-center active:scale-95 shrink-0 ${tTheme.closeModalBtn}`}
                  >
                    <X size={16} className="sm:w-[18px] sm:h-[18px] stroke-[2.5px]" />
                  </button>

                  <button
                    onClick={handleResetDefaults}
                    title="إعادة ضبط كافة الإعدادات إلى الوضع الافتراضي"
                    aria-label="إعادة ضبط كافة الإعدادات إلى الوضع الافتراضي"
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer border active:scale-95 shrink-0 ${tTheme.secondaryBtn}`}
                  >
                    <RotateCcw size={15} className="sm:w-4 sm:h-4 shrink-0" />
                  </button>

                  <button
                    onClick={handleCopyShareText}
                    title="نسخ نص الآية الكريمة"
                    aria-label="نسخ نص الآية الكريمة"
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer border active:scale-95 shrink-0 ${tTheme.secondaryBtn}`}
                  >
                    <Copy size={15} className="sm:w-4 sm:h-4 shrink-0" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleShareImage}
                    disabled={isSharing}
                    title="مشاركة بطاقة الآية"
                    aria-label="مشاركة بطاقة الآية"
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0 ${tTheme.primaryBtn}`}
                  >
                    {isSharing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                    ) : (
                      <Share2 size={15} className="sm:w-4 sm:h-4 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    title="تحميل وحفظ بطاقة الآية كصورة"
                    aria-label="تحميل وحفظ بطاقة الآية كصورة"
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer border active:scale-95 shrink-0 ${tTheme.secondaryBtn}`}
                  >
                    {isSharing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                    ) : (
                      <Download size={15} className="sm:w-4 sm:h-4 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* مساحة فارغة أسفل الشريط بمقدار سطرين */}
              <div className="h-8 sm:h-10 w-full shrink-0" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Floating Undo Toast for Deleted Layers */}
        {deletedLayerNotice && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="fixed bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/95 border border-amber-400/80 shadow-2xl text-white text-xs font-bold backdrop-blur-md"
            style={{ direction: "rtl" }}
          >
            <div className="flex items-center gap-2">
              <Trash2 size={15} className="text-amber-400 shrink-0" />
              <span>تم حذف {deletedLayerNotice.name} من البطاقة</span>
            </div>
            <button
              type="button"
              onClick={() => handleRestoreLayer(deletedLayerNotice.layer)}
              className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw size={12} className="stroke-[2.5]" />
              <span>تراجع واستعادة</span>
            </button>
          </motion.div>
        )}

        {/* Universal Android / Mobile Save & Share Dialog */}
        {showAndroidSaveModal && (
          <div 
            id="android-save-modal-overlay"
            className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setShowAndroidSaveModal(false)}
          >
            <div 
              className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col p-4 sm:p-6 gap-3.5 shadow-2xl text-white text-right overflow-y-auto custom-scrollbar"
              style={{ direction: "rtl" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between w-full border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-amber-300">مشاركة وحفظ بطاقة الآية</h3>
                    <p className="text-[11px] text-slate-400">بطاقة عالية الدقة جاهزة للحفظ والمشاركة</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAndroidSaveModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="إغلاق"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Helpful Tip Banner */}
              <div className="w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 shadow-inner">
                <span className="text-lg shrink-0 leading-none">📱</span>
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">طريقة الحفظ والمشاركة المباشرة:</p>
                  <p className="text-[11px] text-amber-100/90 leading-relaxed">
                    اضغط <strong>مطولاً (Long Press)</strong> على الصورة بالأسفل ثم اختر <strong>"تنزيل الصورة"</strong> أو <strong>"مشاركة الصورة"</strong>، أو اضغط زر <strong>"تنزيل البطاقة"</strong> أو <strong>"نسخ الصورة"</strong> بالأسفل.
                  </p>
                </div>
              </div>

              {/* Card Image Display */}
              <div className="relative w-full max-h-[48vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black/50 border border-slate-800 p-1.5">
                {(previewModalImageUrl || generatedImageUrl) ? (
                  <img
                    src={previewModalImageUrl || generatedImageUrl}
                    alt="بطاقة مشاركة الآية"
                    className="max-h-[45vh] max-w-full object-contain rounded-xl shadow-lg select-all cursor-pointer transition hover:brightness-105"
                    title="اضغط مطولاً لحفظ الصورة أو مشاركتها"
                  />
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent" />
                    <span>جاري تجهيز الصورة عالية الدقة...</span>
                  </div>
                )}
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-1">
                {/* 1. Direct Download */}
                <button
                  type="button"
                  onClick={() => {
                    const src = previewModalImageUrl || generatedImageUrl;
                    if (!src) return;
                    let downloadUrl = src;
                    let revokeNeeded = false;
                    if (src.startsWith("data:")) {
                      const b = dataUrlToBlob(src);
                      if (b) {
                        downloadUrl = URL.createObjectURL(b);
                        revokeNeeded = true;
                      }
                    }
                    const a = document.createElement("a");
                    a.download = `مصحف_التبيان_آية_${activeData?.ayah?.numberInSurah || ""}.png`;
                    a.href = downloadUrl;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                      if (document.body.contains(a)) document.body.removeChild(a);
                      if (revokeNeeded) URL.revokeObjectURL(downloadUrl);
                    }, 1000);
                    setShareStatus("تم تنزيل بطاقة الآية بنجاح إلى جهازك!");
                  }}
                  className="px-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <Download size={15} />
                  <span>تنزيل البطاقة</span>
                </button>

                {/* 2. Copy Image to Clipboard */}
                <button
                  type="button"
                  onClick={async () => {
                    const src = previewModalImageUrl || generatedImageUrl;
                    const finalBlob = cachedExportBlobRef.current || (src && src.startsWith("data:") ? dataUrlToBlob(src) : null);
                    if (finalBlob && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
                      try {
                        await navigator.clipboard.write([
                          new ClipboardItem({ "image/png": finalBlob }),
                        ]);
                        setShareStatus("تم نسخ صورة البطاقة بنجاح! يمكنك لصقها الآن في واتساب أو أي تطبيق");
                      } catch {
                        setShareStatus("تعذر النسخ التلقائي - اضغط مطولاً على الصورة لحفظها");
                      }
                    } else {
                      setShareStatus("اضغط مطولاً على الصورة لنسخها أو حفظها");
                    }
                  }}
                  className="px-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <Copy size={15} />
                  <span>نسخ الصورة</span>
                </button>

                {/* 3. Share via Web Share */}
                <button
                  type="button"
                  onClick={async () => {
                    if (activeData) {
                      const src = previewModalImageUrl || generatedImageUrl;
                      const finalBlob = cachedExportBlobRef.current || (src && src.startsWith("data:") ? dataUrlToBlob(src) : null);
                      
                      // Try file share first
                      if (finalBlob && typeof File !== "undefined" && navigator.canShare) {
                        try {
                          const file = new File([finalBlob], `ayah-${activeData.ayah.numberInSurah}.png`, { type: "image/png" });
                          if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                              files: [file],
                              title: `آية من سورة ${activeData.surahName}`,
                              text: `﴿ ${getCleanedAyahTextForShare()} ﴾\n[سورة ${activeData.surahName} : ${activeData.ayah.numberInSurah}] - مصحف التبيان`,
                            });
                            return;
                          }
                        } catch {}
                      }

                      // If file share not supported, download instead:
                      const a = document.createElement("a");
                      a.download = `مصحف_التبيان_آية_${activeData?.ayah?.numberInSurah || ""}.png`;
                      a.href = src;
                      document.body.appendChild(a);
                      a.click();
                      setTimeout(() => {
                        if (document.body.contains(a)) document.body.removeChild(a);
                      }, 500);
                      setShareStatus("تم تنزيل البطاقة لجهازك!");
                    }
                  }}
                  className="px-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <Share2 size={15} />
                  <span>مشاركة</span>
                </button>

                {/* 4. Copy Ayah Text */}
                <button
                  type="button"
                  onClick={handleCopyShareText}
                  className="px-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                >
                  <Copy size={15} />
                  <span>نسخ النص</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowAndroidSaveModal(false)}
                className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                إغلاق والعودة للتعديل
              </button>
            </div>
          </div>
        )}
      </div>,
      document.body
    );
};
