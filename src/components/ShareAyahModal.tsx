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
  Type,
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
import {
  Qcf4Word,
  Qcf4Line,
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
import istiadhaCalligraphyImg from "../assets/images/istiadha_calligraphy_1787675484366.jpg";
import { AlTibyanCalligraphy } from "./AlTibyanCalligraphy";
import { IstiadhahCalligraphy, getBaseAlphaCanvas } from "./IstiadhahCalligraphy";

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
export function createSurahHeaderSvg(borderColor: string = "#C5A85C", accentColor: string = "#C5A85C", triangleAccent: string = "#52b7eb"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 10 900 90" fill="none">
    <defs>
      <g id="star">
        <polygon points="0,-28 8,-14 20,-20 14,-8 28,0 14,8 20,20 8,14 0,28 -8,14 -20,20 -14,8 -28,0 -14,-8 -20,-20 -8,-14" fill="${accentColor}" stroke="${borderColor}" stroke-width="1.2" />
        <polygon points="0,-21 6,-10 15,-15 10,-6 21,0 10,6 15,15 6,10 0,21 -6,10 -15,15 -10,6 -21,0 -10,-6 -15,-15 -6,-10" fill="${triangleAccent}" stroke="${borderColor}" stroke-width="0.8" />
        <polygon points="0,-12 3.5,-6 8.5,-8.5 6,-3.5 12,0 6,3.5 8.5,8.5 3.5,6 0,12 -3.5,6 -8.5,8.5 -6,3.5 -12,0 -6,-3.5 -8.5,-8.5 -3.5,-6" fill="none" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="0" y1="-28" x2="0" y2="28" stroke="${borderColor}" stroke-width="0.7" />
        <line x1="-28" y1="0" x2="28" y2="0" stroke="${borderColor}" stroke-width="0.7" />
        <line x1="-20" y1="-20" x2="20" y2="20" stroke="${borderColor}" stroke-width="0.5" />
        <line x1="-20" y1="20" x2="20" y2="-20" stroke="${borderColor}" stroke-width="0.5" />
        <circle cx="0" cy="0" r="5.0" fill="none" stroke="${borderColor}" stroke-width="0.8" />
        <circle cx="0" cy="0" r="3.0" fill="${accentColor}" stroke="${borderColor}" stroke-width="0.5" />
        <circle cx="0" cy="0" r="1.2" fill="#ffffff" />
        <polygon points="-58,-40 -50,-32 -58,-24 -66,-32" fill="none" stroke="${borderColor}" stroke-width="0.8" />
        <polygon points="-58,-37 -52,-32 -58,-27 -64,-32" fill="${triangleAccent}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.5" />
        <polygon points="-58,40 -50,32 -58,24 -66,32" fill="none" stroke="${borderColor}" stroke-width="0.8" />
        <polygon points="-58,37 -52,32 -58,27 -64,32" fill="${triangleAccent}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.5" />
        <polygon points="58,-40 66,-32 58,-24 50,-32" fill="none" stroke="${borderColor}" stroke-width="0.8" />
        <polygon points="58,-37 64,-32 58,-27 52,-32" fill="${triangleAccent}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.5" />
        <polygon points="58,40 66,32 58,24 50,32" fill="none" stroke="${borderColor}" stroke-width="0.8" />
        <polygon points="58,37 64,32 58,27 52,32" fill="${triangleAccent}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.5" />
        <line x1="-20" y1="-20" x2="-58" y2="-32" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="-20" y1="20" x2="-58" y2="32" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="20" y1="-20" x2="58" y2="-32" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="20" y1="20" x2="58" y2="32" stroke="${borderColor}" stroke-width="0.6" />
        <circle cx="-58" cy="-32" r="1.4" fill="${triangleAccent}" stroke="${borderColor}" stroke-width="0.4" />
        <circle cx="-58" cy="32" r="1.4" fill="${triangleAccent}" stroke="${borderColor}" stroke-width="0.4" />
        <circle cx="58" cy="-32" r="1.4" fill="${triangleAccent}" stroke="${borderColor}" stroke-width="0.4" />
        <circle cx="58" cy="32" r="1.4" fill="${triangleAccent}" stroke="${borderColor}" stroke-width="0.4" />
      </g>
    </defs>
    <g transform="translate(0, 55) scale(1, 0.82) translate(0, -55)">
      <rect x="10" y="12" width="230" height="86" fill="${borderColor}" fill-opacity="0.30" />
      <rect x="660" y="12" width="230" height="86" fill="${borderColor}" fill-opacity="0.30" />
      <path d="M 10,12 L 890,12 L 890,98 L 10,98 Z" fill="none" stroke="${borderColor}" stroke-width="1.6" />
      <g>
        <polygon points="10,10 84,55 10,100" fill="none" stroke="${borderColor}" stroke-width="1.1" />
        <polygon points="15,18 78,55 15,92" fill="${triangleAccent}" fill-opacity="0.4" stroke="${borderColor}" stroke-width="0.7" />
        <polygon points="25,55 48,28 72,55 48,82" fill="${triangleAccent}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.9" />
        <polygon points="34,55 48,36 62,55 48,74" fill="${triangleAccent}" fill-opacity="0.95" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="10" y1="55" x2="84" y2="55" stroke="${borderColor}" stroke-width="0.9" />
        <circle cx="48" cy="55" r="2.2" fill="#ffffff" stroke="${borderColor}" stroke-width="0.6" />
        <circle cx="84" cy="55" r="1.8" fill="${triangleAccent}" stroke="${borderColor}" stroke-width="0.6" />
      </g>
      <g>
        <polygon points="240,12 140,55 240,98" fill="none" stroke="${borderColor}" stroke-width="1.1" />
        <polygon points="234,18 146,55 234,92" fill="${triangleAccent}" fill-opacity="0.4" stroke="${borderColor}" stroke-width="0.7" />
        <polygon points="220,55 192,28 152,55 192,82" fill="${triangleAccent}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.9" />
        <polygon points="210,55 192,36 162,55 192,74" fill="${triangleAccent}" fill-opacity="0.95" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="240" y1="55" x2="140" y2="55" stroke="${borderColor}" stroke-width="0.9" />
        <circle cx="192" cy="55" r="2.2" fill="#ffffff" stroke="${borderColor}" stroke-width="0.6" />
        <circle cx="140" cy="55" r="1.8" fill="${triangleAccent}" stroke="${borderColor}" stroke-width="0.6" />
      </g>
      <g>
        <polygon points="890,12 816,55 890,98" fill="none" stroke="${borderColor}" stroke-width="1.1" />
        <polygon points="884,18 822,55 884,92" fill="${triangleAccent}" fill-opacity="0.4" stroke="${borderColor}" stroke-width="0.7" />
        <polygon points="875,55 852,28 828,55 852,82" fill="${triangleAccent}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.9" />
        <polygon points="866,55 852,36 838,55 852,74" fill="${triangleAccent}" fill-opacity="0.95" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="890" y1="55" x2="816" y2="55" stroke="${borderColor}" stroke-width="0.9" />
        <circle cx="852" cy="55" r="2.2" fill="#ffffff" stroke="${borderColor}" stroke-width="0.6" />
        <circle cx="816" cy="55" r="1.8" fill="${triangleAccent}" stroke="${borderColor}" stroke-width="0.6" />
      </g>
      <g>
        <polygon points="660,12 760,55 660,98" fill="none" stroke="${borderColor}" stroke-width="1.1" />
        <polygon points="666,18 754,55 666,92" fill="${triangleAccent}" fill-opacity="0.4" stroke="${borderColor}" stroke-width="0.7" />
        <polygon points="680,55 708,28 748,55 708,82" fill="${triangleAccent}" fill-opacity="0.75" stroke="${borderColor}" stroke-width="0.9" />
        <polygon points="690,55 708,36 738,55 708,74" fill="${triangleAccent}" fill-opacity="0.95" stroke="${borderColor}" stroke-width="0.6" />
        <line x1="660" y1="55" x2="760" y2="55" stroke="${borderColor}" stroke-width="0.9" />
        <circle cx="708" cy="55" r="2.2" fill="#ffffff" stroke="${borderColor}" stroke-width="0.6" />
        <circle cx="760" cy="55" r="1.8" fill="${triangleAccent}" stroke="${borderColor}" stroke-width="0.6" />
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

// Authentic Medina Mushaf Surah Header SVG for High-Resolution Export
export function createAuthenticSurahHeaderSvg(frameColor: string = "#C5A85C", textColor: string = "#FAF8F5"): string {
  try {
    const { scopedDefs, scopedBody } = getAuthenticFrameSvgInner("share_modal_canvas");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240.20621 30.23196" width="240.20621" height="30.23196" fill="none" style="--surah-frame-stroke:${frameColor};--surah-inner-stroke:${frameColor};--surah-inner-fill:rgba(0,0,0,0.04);--surah-accent-solid:${frameColor};--surah-accent-deep:${frameColor};--surah-highlight:#ffffff;--surah-grad-high:#ffffff;--surah-grad-mid:${frameColor};--surah-grad-deep:${frameColor};color:${frameColor};">
      <defs>
        <style>
          .surah_frame_outer_border { fill: none !important; stroke: currentColor !important; }
          .surah_frame_cartouche_bg { fill: none !important; stroke: none !important; }
          .surah_frame_inner_contour { fill: rgba(0,0,0,0.04) !important; stroke: currentColor !important; }
        </style>
        ${scopedDefs}
      </defs>
      <g class="surah_header_frame">
        ${scopedBody}
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return createSurahHeaderSvg(frameColor, frameColor);
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
  const widthPercentage = Math.min(100, Math.max(70, Math.round(92 * (scale || 1))));

  if (headerStyle === "classic") {
    return (
      <div
        className={`w-full my-1.5 mx-auto flex items-center justify-center ${className}`}
        style={{ maxWidth: `${widthPercentage}%`, ...style }}
      >
        <div className="relative w-full aspect-[900/105] flex items-center justify-center">
          <img
            src={createSurahHeaderSvg(frameColor, frameColor)}
            alt={surahName}
            className="w-full h-full object-contain pointer-events-none select-none"
          />
          <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
            <span
              style={{
                fontFamily: "'QCF4_QBSML', 'Amiri', serif",
                fontSize: "clamp(18px, 5.5cqi, 40px)",
                color: textColor,
                transform: "translateY(-7%)",
                direction: "rtl",
                textAlign: "center",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {glyph || (surahNumber ? getSurahHeaderGlyph(surahNumber, surahName) : (surahName || ""))}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (headerStyle === "minimal") {
    return (
      <div
        className={`w-full my-1.5 mx-auto flex items-center justify-center ${className}`}
        style={{ maxWidth: `${widthPercentage}%`, ...style }}
      >
        <div
          className="px-6 py-1.5 rounded-full border flex items-center justify-center gap-2 shadow-xs text-center"
          style={{ borderColor: frameColor, backgroundColor: "rgba(0,0,0,0.25)" }}
        >
          <span
            style={{
              fontFamily: "'QCF4_QBSML', 'Amiri', serif",
              fontSize: "clamp(16px, 4.8cqi, 32px)",
              color: textColor,
              transform: "translateY(-4%)",
              direction: "rtl",
              textAlign: "center",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {glyph || (surahNumber ? getSurahHeaderGlyph(surahNumber, surahName) : (surahName || ""))}
          </span>
        </div>
      </div>
    );
  }

  // Official / Default: Authentic Medina Mushaf Surah Header Frame
  return (
    <div
      className={`w-full my-1 mx-auto flex items-center justify-center transition-all ${className}`}
      style={{ maxWidth: `${widthPercentage}%`, ...style }}
    >
      <SurahHeaderFrame
        surahNumber={surahNumber}
        surahName={surahName || ""}
        customFrameColor={frameColor}
        customTextColor={textColor}
        className="w-full"
      />
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
  openingHeaderMode?: "auto" | "bismillah" | "istiadhah" | "surah_frame";
  openingHeaderSize?: number;
  openingHeaderColor?: string;
  openingHeaderFont?: "match_ayah" | "qcf4" | "amiri" | "uthman" | "cairo";
  // Card Ayahs Content & Mode Defaults:
  shareMode?: "single" | "range" | "page";
  defaultSurahNumber?: number;
  defaultSurahName?: string;
  defaultAyahNumber?: number;
  rangeFrom?: number;
  rangeTo?: number;
  selectedPageNumber?: number;
}

export const DEFAULT_SHARE_STYLE: SavedShareStyle = {
  bgCategory: "solid",
  gradientType: "linear",
  gradientAngle: 135,
  radialSpread: 75,
  gradientColor1: "#1C1917",
  gradientColor2: "#685023",
  selectedSolidColor: "#1C1917",
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
  showAyahFrame: true,
  selectedFrameStyle: "rectangle",
  frameColor: "#C5A85C",
  frameWidth: 2,
  frameInset: 24,
  showSurahHeaderFrame: false, // Replaced by Bismillah/Istiadhah!
  showOpeningHeader: true, // Active opening header
  openingHeaderMode: "auto", // Auto: Bismillah for beginning, Istiadhah for middle
  openingHeaderSize: 30,
  openingHeaderColor: "#FAF8F5",
  openingHeaderFont: "match_ayah",
  surahHeaderStyle: "authentic",
  surahHeaderColor: "#C5A85C",
  surahHeaderTextColor: "#FAF8F5",
  surahHeaderScale: 100,
  selectedQuranFont: "qcf4",
  textFontSize: 28,
  textShadowOpacity: 0,
  textAlign: "justify",
  textColor: "#FAF8F5",
  logoColor: "#FAF8F5",
  showIstiadhah: false,
  istiadhahColor: "#FAF8F5",
  istiadhahSize: 38,
  showSurahInfo: false,
  showWatermark: false,
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
        // Enforce solid single-color background and remove istiadhah, watermark, and footer surah info by default
        parsed.bgCategory = "solid";
        parsed.selectedSolidColor = parsed.selectedSolidColor || parsed.gradientColor1 || "#1C1917";
        parsed.showIstiadhah = false;
        parsed.showSurahInfo = false;
        parsed.showWatermark = false;

        // Opening Header (Bismillah / Istiadhah) default configuration
        parsed.showOpeningHeader = parsed.showOpeningHeader ?? true;
        parsed.openingHeaderMode = parsed.openingHeaderMode || "auto";
        parsed.openingHeaderSize = parsed.openingHeaderSize ?? 30;
        parsed.openingHeaderColor = parsed.openingHeaderColor || parsed.textColor || "#FAF8F5";
        parsed.openingHeaderFont = parsed.openingHeaderFont || "match_ayah";
        if (parsed.showSurahHeaderFrame === true && parsed.openingHeaderMode === undefined) {
          parsed.showSurahHeaderFrame = false;
        }

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
        // Ensure surahHeaderTextColor follows verse textColor
        if (!parsed.surahHeaderTextColor || parsed.surahHeaderTextColor === parsed.surahHeaderColor) {
          parsed.surahHeaderTextColor = parsed.textColor || DEFAULT_SHARE_STYLE.textColor;
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
  const [bgCategory, setBgCategory] = useState<"gradient" | "solid" | "pattern" | "texture" | "none">(() => initialStyle.bgCategory || "gradient");
  const [gradientType, setGradientType] = useState<"linear" | "radial">(() => initialStyle.gradientType || "linear");
  const [showPattern, setShowPattern] = useState<boolean>(() => initialStyle.showPattern ?? false);
  const [gradientAngle, setGradientAngle] = useState<number>(() => initialStyle.gradientAngle ?? 135);
  const [radialSpread, setRadialSpread] = useState<number>(() => initialStyle.radialSpread ?? 75);
  const [gradientColor1, setGradientColor1] = useState<string>(() => initialStyle.gradientColor1 || DEFAULT_SHARE_STYLE.gradientColor1 || "#1C1917");
  const [gradientColor2, setGradientColor2] = useState<string>(() => initialStyle.gradientColor2 || DEFAULT_SHARE_STYLE.gradientColor2 || "#685023");
  const [selectedSolidColor, setSelectedSolidColor] = useState<string>(() => initialStyle.selectedSolidColor || "#1C1917");
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
  const [showAyahFrame, setShowAyahFrame] = useState<boolean>(() => (initialStyle.showAyahFrame ?? (initialStyle.selectedFrameStyle !== "none")));
  const [selectedFrameStyle, setSelectedFrameStyle] = useState<FrameStyleType>(() => initialStyle.selectedFrameStyle || "rectangle");
  const [frameColor, setFrameColor] = useState<string>(() => initialStyle.frameColor || "#D4AF37");
  const [frameWidth, setFrameWidth] = useState<number>(() => initialStyle.frameWidth ?? 2);
  const [frameInset, setFrameInset] = useState<number>(() => initialStyle.frameInset ?? 24);

  // Opening Header (Bismillah / Istiadhah) Controls - Independent of Ayah settings
  const [showOpeningHeader, setShowOpeningHeader] = useState<boolean>(() => initialStyle.showOpeningHeader ?? true);
  const [openingHeaderMode, setOpeningHeaderMode] = useState<"auto" | "bismillah" | "istiadhah" | "surah_frame">(() => initialStyle.openingHeaderMode || "auto");
  const [openingHeaderSize, setOpeningHeaderSize] = useState<number>(() => initialStyle.openingHeaderSize ?? 30);
  const [openingHeaderColor, setOpeningHeaderColor] = useState<string>(() => initialStyle.openingHeaderColor || initialStyle.textColor || "#FAF8F5");
  const [openingHeaderFont, setOpeningHeaderFont] = useState<"match_ayah" | "qcf4" | "amiri" | "uthman" | "cairo">(() => (initialStyle.openingHeaderFont as any) || "match_ayah");

  // Surah Header Frame Controls
  const [showSurahHeaderFrame, setShowSurahHeaderFrame] = useState<boolean>(() => initialStyle.showSurahHeaderFrame ?? false);
  const [surahHeaderStyle, setSurahHeaderStyle] = useState<"authentic" | "classic" | "minimal">(() => initialStyle.surahHeaderStyle || "authentic");
  const [surahHeaderTextColor, setSurahHeaderTextColor] = useState<string>(() => initialStyle.textColor || "#FAF8F5");
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
  const [textFontSize, setTextFontSize] = useState<number>(() => initialStyle.textFontSize ?? 28);
  const [textShadowOpacity, setTextShadowOpacity] = useState<number>(() => initialStyle.textShadowOpacity ?? 0);
  const [textAlign, setTextAlign] = useState<"justify" | "center" | "right" | "left">(() => initialStyle.textAlign || "justify");
  const [textColor, setTextColor] = useState<string>(() => initialStyle.textColor || "#FAF8F5");
  const [surahHeaderColor, setSurahHeaderColor] = useState<string>(() => initialStyle.surahHeaderColor || "#C5A85C");
  const [logoColor, setLogoColor] = useState<string | undefined>(() => initialStyle.logoColor || undefined);

  // Metadata State (Istiadhah, Surah Info, Watermark)
  const [showIstiadhah, setShowIstiadhah] = useState<boolean>(() => initialStyle.showIstiadhah ?? false);
  const [istiadhahColor, setIstiadhahColor] = useState<string>(() => initialStyle.istiadhahColor || initialStyle.textColor || "#FAF8F5");
  const [istiadhahSize, setIstiadhahSize] = useState<number>(() => initialStyle.istiadhahSize ?? 38);
  const [showSurahInfo, setShowSurahInfo] = useState<boolean>(() => initialStyle.showSurahInfo ?? false);
  const [showWatermark, setShowWatermark] = useState<boolean>(() => initialStyle.showWatermark ?? false);

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
  const [shareMode, setShareMode] = useState<"single" | "range" | "page">(() => shareData?.mode || initialStyle.shareMode || "single");
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
      setQcf4Lines([]);
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

  // Dynamic Auto-sizing: Adjusts dimensions, aspect ratio, and typography automatically to fit verse length
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
      (selectedPageNumber === 1 || selectedPageNumber === 2) ||
      (activeData?.surahNumber === 1) ||
      (activeData?.surahNumber === 2 && rangeFrom === 1 && rangeTo <= 5);

    if (shareMode === "page") {
      return {
        width: 1080,
        height: 1920,
        ratioClass: "aspect-[9/16]",
        aspectStyle: "9 / 16",
        fontSize: isOpeningMushafPage ? 17 : 13.5,
        isTall: true,
        label: "صفحة المصحف (9:16)",
      };
    }

    const isCompactMode = !showIstiadhah && !showSurahInfo && !showWatermark;

    if (isCompactMode) {
      // 1. Very short verse (under ~95 characters or <= 14 words, e.g. 1-2 lines, like Al-Kawthar, Al-Ikhlas, short single ayahs)
      if (effectiveCharLen <= 95) {
        return {
          width: 1080,
          height: 680,
          ratioClass: "aspect-[27/17]",
          aspectStyle: "27 / 17",
          fontSize: 33,
          isTall: false,
          label: "مدمج متناسق (آيات قصيرة)",
        };
      }

      // 2. Short-to-medium verse or 2-verse range (96 - 240 chars, ~3-5 lines like Ibrahim 40-41)
      if (effectiveCharLen <= 240) {
        return {
          width: 1080,
          height: 900,
          ratioClass: "aspect-[6/5]",
          aspectStyle: "6 / 5",
          fontSize: 28,
          isTall: false,
          label: "متوازن مدمج (آيات متوسطة)",
        };
      }

      // 3. Medium-long verse or range (241 - 460 chars, ~6-9 lines like Ayat Al-Kursi)
      if (effectiveCharLen <= 460) {
        return {
          width: 1080,
          height: 1220,
          ratioClass: "aspect-[54/61]",
          aspectStyle: "54 / 61",
          fontSize: 26,
          isTall: true,
          label: "طولي متوازن (مقاطع متوسطة)",
        };
      }

      // 4. Long verse or multi-verse range (461 - 750 chars, 10-14 lines)
      if (effectiveCharLen <= 750) {
        return {
          width: 1080,
          height: 1540,
          ratioClass: "aspect-[27/38]",
          aspectStyle: "27 / 38",
          fontSize: 23,
          isTall: true,
          label: "طولي كامل (مقاطع ممتدة)",
        };
      }

      // 5. Extra long verse (over 750 chars, e.g. Ayat Al-Dayn, Al-Baqarah 282, or wide range)
      return {
        width: 1080,
        height: 1920,
        ratioClass: "aspect-[9/16]",
        aspectStyle: "9 / 16",
        fontSize: 20,
        isTall: true,
        label: "طولي ممتد (مقاطع طويلة)",
      };
    }

    // Standard Spacious Mode (when Istiadhah or footers are enabled)
    // 1. Very short verse (under ~95 characters or <= 14 words)
    if (effectiveCharLen <= 95) {
      return {
        width: 1080,
        height: 1080,
        ratioClass: "aspect-square",
        aspectStyle: "1 / 1",
        fontSize: 34,
        isTall: false,
        label: "مربع متناسق (1:1) للآيات القصيرة",
      };
    }

    // 2. Short-to-medium verse or 2-verse range (96 - 240 chars, ~3-5 lines like Ibrahim 40-41)
    if (effectiveCharLen <= 240) {
      return {
        width: 1080,
        height: 1350,
        ratioClass: "aspect-[4/5]",
        aspectStyle: "4 / 5",
        fontSize: 28,
        isTall: false,
        label: "طولي متوازن (4:5) للآيات المتوسطة",
      };
    }

    // 3. Medium-long verse or range (241 - 460 chars, ~6-9 lines like Ayat Al-Kursi)
    if (effectiveCharLen <= 460) {
      return {
        width: 1080,
        height: 1620,
        ratioClass: "aspect-[2/3]",
        aspectStyle: "2 / 3",
        fontSize: 26,
        isTall: true,
        label: "طولي متوسط (2:3) للمقاطع الطويلة",
      };
    }

    // 4. Long verse or multi-verse range (461 - 750 chars, 10-14 lines)
    if (effectiveCharLen <= 750) {
      return {
        width: 1080,
        height: 1920,
        ratioClass: "aspect-[9/16]",
        aspectStyle: "9 / 16",
        fontSize: 23,
        isTall: true,
        label: "طولي كامل (9:16) للآيات الممتدة",
      };
    }

    // 5. Extra long verse (over 750 chars, e.g. Ayat Al-Dayn, Al-Baqarah 282, or wide range)
    return {
      width: 1080,
      height: 2160,
      ratioClass: "aspect-[1/2]",
      aspectStyle: "1 / 2",
      fontSize: 20,
      isTall: true,
      label: "طولي فائق (1:2) للآيات الطويلة جداً",
    };
  }, [activeData, shareMode, rangeFrom, rangeTo, selectedPageNumber, qcf4Words, showIstiadhah, showSurahInfo, showWatermark]);

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
    setSelectedAspectRatio("9:16");
    setSelectedFrameStyle("none");
    setShowWatermark(false);
    setShowSurahInfo(false);
    setShowIstiadhah(false);
    // Page 1 and Page 2 have 8 lines in Mushaf instead of 15, so use larger, authentic typography
    if (targetPageNum === 1 || targetPageNum === 2) {
      setTextFontSize(17);
    } else {
      setTextFontSize(13.5);
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

    if (applyDefaults) {
      applyPageDefaults(safePage);
    }

    const pageMeta = quranSvgPageMetadata.find((p) => p.page === safePage);
    const surahNumber = pageMeta?.surahNumber || 1;
    const surahName = pageMeta?.surahNameAr || "الفاتحة";

    setCurrentShareData({
      mode: "page",
      surahNumber,
      surahName,
      pageNumber: safePage,
      ayah: {
        numberInSurah: 1,
        text: "",
        page: safePage,
      },
    });

    setIsLoadingVerse(true);
    try {
      let combinedText = "";

      try {
        const res = await fetchAlquranCloud(`v1/page/${safePage}/quran-uthmani`);
        if (res?.data?.ayahs && Array.isArray(res.data.ayahs)) {
          const pageAyahs = res.data.ayahs;
          combinedText = pageAyahs
            .map((a: any) => `${a.text} ﴿${toArabicNumerals(a.numberInSurah)}﴾`)
            .join(" ");
        }
      } catch (netErr) {
        console.warn("ShareAyahModal page network fetch failed, using offline QCF4 data:", netErr);
      }

      // Offline local reconstruction for full Page
      if (!combinedText) {
        try {
          const pageData = await fetchQcf4Page(safePage);
          if (pageData?.lines && pageData.lines.length > 0) {
            const pageWords: string[] = [];
            pageData.lines.forEach((l) => {
              l.words?.forEach((w) => {
                if (w.type === "word" && (w.char || w.text)) {
                  pageWords.push(w.char || w.text || "");
                } else if (w.type === "end") {
                  pageWords.push(w.char || "۝");
                }
              });
            });
            if (pageWords.length > 0) {
              combinedText = pageWords.join(" ");
            }
          }
        } catch (e) {
          console.warn("Offline QCF page fetch:", e);
        }
      }

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
      setDeletedLayerNotice({ layer: "header", name: "الترويسة (البسملة / الاستعاذة)" });
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

  // Floating Controls: Exact design from IMG_1787
  const renderLayerControls = (element: "ayah" | "header" | "info" | "watermark", _label?: string) => {
    if (selectedLayer !== element) return null;

    return (
      <div className="layer-controls-box prevent-drag absolute -inset-1 sm:-inset-1.5 pointer-events-none z-30 select-none">
        {/* Active Selection Bounding Box (Solid Blue Border) */}
        <div className="absolute inset-0 border-2 border-blue-500 rounded-[2px] pointer-events-none shadow-xs" />

        {/* Stem Line connecting to Rotation Handle */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-[2px] h-3.5 bg-blue-500 pointer-events-none" />

        {/* Top-Center Rotation & Re-center Handle */}
        <button
          type="button"
          onPointerDown={(e) => handleStartRotate(e, element)}
          className="pointer-events-auto absolute -top-[33px] left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-blue-500 shadow-md flex items-center justify-center text-blue-500 hover:bg-blue-50 hover:scale-110 active:scale-95 transition-transform cursor-grab active:cursor-grabbing touch-none select-none z-40"
          title="اسحب للتدوير، أو انقر لإعادة التوسيط والضبط (0°)"
        >
          <RotateCw size={13} className="stroke-[2.5]" />
        </button>

        {/* Top-Right Corner Red Delete Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDeleteLayer(element);
          }}
          className="pointer-events-auto absolute -top-3 -right-3 sm:-top-3.5 sm:-right-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-600 hover:bg-red-700 active:scale-90 text-white border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform z-40 touch-none select-none"
          title="حذف العنصر"
        >
          <Trash2 size={12} className="stroke-[2.5]" />
        </button>

        {/* Top-Left Corner Blue Move Handle */}
        <div
          onPointerDown={(e) => handleStartDrag(e, element)}
          className="move-handle pointer-events-auto absolute -top-3 -left-3 sm:-top-3.5 sm:-left-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 text-white border-2 border-white shadow-md flex items-center justify-center cursor-move hover:scale-110 active:scale-95 transition-transform z-40 touch-none select-none"
          title="اسحب لتحريك العنصر"
        >
          <Move size={12} className="stroke-[2.5]" />
        </div>

        {/* Bottom-Right Corner Blue Scale Handle */}
        <div
          onPointerDown={(e) => handleStartCornerResize(e, element)}
          className="pointer-events-auto absolute -bottom-2.5 -right-2.5 sm:-bottom-3 sm:-right-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center cursor-nwse-resize hover:scale-110 active:scale-125 transition-transform z-40 touch-none select-none"
          title="اسحب للتكبير أو التصغير"
        />

        {/* Bottom-Left Corner Blue Scale Handle */}
        <div
          onPointerDown={(e) => handleStartCornerResize(e, element)}
          className="pointer-events-auto absolute -bottom-2.5 -left-2.5 sm:-bottom-3 sm:-left-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center cursor-nesw-resize hover:scale-110 active:scale-125 transition-transform z-40 touch-none select-none"
          title="اسحب للتكبير أو التصغير"
        />

        {/* Top Midpoint Edge Handle (White pill with 3 blue bars) */}
        <div
          onPointerDown={(e) => handleStartCornerResize(e, element)}
          className="pointer-events-auto absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 sm:w-7 sm:h-3 rounded-full bg-white border border-blue-500 shadow-xs flex items-center justify-center gap-0.5 cursor-ns-resize hover:scale-110 active:scale-125 transition-transform z-40 touch-none select-none"
          title="اسحب لتعديل القياس"
        >
          <span className="w-0.5 h-1.5 bg-blue-500 rounded-full" />
          <span className="w-0.5 h-1.5 bg-blue-500 rounded-full" />
          <span className="w-0.5 h-1.5 bg-blue-500 rounded-full" />
        </div>

        {/* Bottom Midpoint Edge Handle */}
        <div
          onPointerDown={(e) => handleStartCornerResize(e, element)}
          className="pointer-events-auto absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 sm:w-7 sm:h-3 rounded-full bg-white border border-blue-500 shadow-xs flex items-center justify-center gap-0.5 cursor-ns-resize hover:scale-110 active:scale-125 transition-transform z-40 touch-none select-none"
          title="اسحب لتعديل القياس"
        >
          <span className="w-0.5 h-1.5 bg-blue-500 rounded-full" />
          <span className="w-0.5 h-1.5 bg-blue-500 rounded-full" />
          <span className="w-0.5 h-1.5 bg-blue-500 rounded-full" />
        </div>

        {/* Left Midpoint Edge Handle */}
        <div
          onPointerDown={(e) => handleStartCornerResize(e, element)}
          className="pointer-events-auto absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-6 sm:w-3 sm:h-7 rounded-full bg-white border border-blue-500 shadow-xs flex flex-col items-center justify-center gap-0.5 cursor-ew-resize hover:scale-110 active:scale-125 transition-transform z-40 touch-none select-none"
          title="اسحب لتعديل القياس"
        >
          <span className="h-0.5 w-1.5 bg-blue-500 rounded-full" />
          <span className="h-0.5 w-1.5 bg-blue-500 rounded-full" />
          <span className="h-0.5 w-1.5 bg-blue-500 rounded-full" />
        </div>

        {/* Right Midpoint Edge Handle */}
        <div
          onPointerDown={(e) => handleStartCornerResize(e, element)}
          className="pointer-events-auto absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-6 sm:w-3 sm:h-7 rounded-full bg-white border border-blue-500 shadow-xs flex flex-col items-center justify-center gap-0.5 cursor-ew-resize hover:scale-110 active:scale-125 transition-transform z-40 touch-none select-none"
          title="اسحب لتعديل القياس"
        >
          <span className="h-0.5 w-1.5 bg-blue-500 rounded-full" />
          <span className="h-0.5 w-1.5 bg-blue-500 rounded-full" />
          <span className="h-0.5 w-1.5 bg-blue-500 rounded-full" />
        </div>
      </div>
    );
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

  const cardPreviewRef = useRef<HTMLDivElement>(null);

  // Pre-load QBSML font
  useEffect(() => {
    let isMounted = true;
    ensureQbsmlLoaded()
      .then(() => {
        if (document.fonts) {
          document.fonts.ready.then(() => {
            if (isMounted) setQbsmlReady(true);
          });
        } else {
          if (isMounted) setQbsmlReady(true);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

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
              words.push(w);
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
              words.push(w);
            });
          });

          setQcf4Lines(pageData.lines || []);
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
    const width =
      selectedAspectRatio === "auto"
        ? autoDimensions.width
        : selectedAspectRatio === "custom"
        ? Math.max(300, Math.min(4000, customWidth))
        : activeAspect.width;
    const height =
      selectedAspectRatio === "auto"
        ? autoDimensions.height
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

        // 4. Draw Header Branding (Istiadhah Calligraphy at TOP - Independent Control & Scale)
        if (showIstiadhah && activeData) {
          ctx.save();
          const headerBaseY = (selectedAspectRatio === "9:16" || isTallRatio) ? height * 0.085 : height * 0.095;
          const headerX = width / 2 + (surahHeaderOffsetX / previewW) * width;
          const headerY = headerBaseY + (surahHeaderOffsetY / previewH) * height;
          const activeIstiadhaColor = istiadhahColor || textColor || "#FFFFFF";
          const targetH = Math.round(istiadhahSize * scaleRatio);

          try {
            const istiadhaImg = new window.Image();
            istiadhaImg.crossOrigin = "anonymous";
            istiadhaImg.src = istiadhaCalligraphyImg;
            await new Promise<void>((resolve) => {
              if (istiadhaImg.complete && istiadhaImg.naturalWidth > 0) {
                resolve();
              } else {
                istiadhaImg.onload = () => resolve();
                istiadhaImg.onerror = () => resolve();
              }
            });

            if (istiadhaImg.complete && istiadhaImg.naturalWidth > 0) {
              const targetW = Math.min(Math.round(width * 0.85), Math.round((targetH * istiadhaImg.naturalWidth) / istiadhaImg.naturalHeight));

              const offCanvas = document.createElement("canvas");
              offCanvas.width = istiadhaImg.naturalWidth;
              offCanvas.height = istiadhaImg.naturalHeight;
              const offCtx = offCanvas.getContext("2d");
              if (offCtx) {
                offCtx.drawImage(istiadhaImg, 0, 0);
                const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                  const r = data[i];
                  const g = data[i + 1];
                  const b = data[i + 2];
                  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                  let alpha = 255 - lum;
                  if (lum > 235) {
                    alpha = 0;
                  } else if (lum < 40) {
                    alpha = 255;
                  } else {
                    alpha = Math.round(((235 - lum) / 195) * 255);
                  }
                  data[i + 3] = Math.max(0, Math.min(255, alpha));
                  data[i] = 255;
                  data[i + 1] = 255;
                  data[i + 2] = 255;
                }
                offCtx.putImageData(imgData, 0, 0);

                offCtx.globalCompositeOperation = "source-in";
                offCtx.fillStyle = activeIstiadhaColor;
                offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

                ctx.drawImage(offCanvas, headerX - targetW / 2, headerY - targetH / 2, targetW, targetH);
              }
            } else {
              ctx.textAlign = "center";
              ctx.font = `bold ${Math.max(12, Math.round(targetH * 0.35))}px 'Amiri', 'Cairo', serif`;
              ctx.fillStyle = activeIstiadhaColor;
              ctx.fillText("أعوذ بالله من الشيطان الرجيم", headerX, headerY);
            }
          } catch (e) {
            ctx.textAlign = "center";
            ctx.font = `bold ${Math.max(12, Math.round(targetH * 0.35))}px 'Amiri', 'Cairo', serif`;
            ctx.fillStyle = activeIstiadhaColor;
            ctx.fillText("أعوذ بالله من الشيطان الرجيم", headerX, headerY);
          }
          ctx.restore();
        }

        // 5. Wrap and Draw Ayah Text with selected Quranic Typography
        if (!activeData) return;
        const isQcfValid = selectedQuranFont === "qcf4" && isQcf4Loaded && (qcf4Lines.length > 0 || qcf4Words.length > 0);
        type WordItem = { char: string; font?: string; type?: string };

        let baseFontFamily = "'QCF4_QBSML', 'Amiri', serif";
        if (selectedQuranFont === "qcf4") {
          baseFontFamily = isQcfValid
            ? `"${qcf4Font}", "QCF4_QBSML", "Amiri", "UthmanicHafs", serif`
            : "'QCF4_QBSML', 'Amiri', serif";
        } else if (selectedQuranFont === "amiri") {
          baseFontFamily = "'Amiri', serif";
        } else if (selectedQuranFont === "uthman") {
          baseFontFamily = "'UthmanicHafs', 'Amiri', serif";
        } else if (selectedQuranFont === "cairo") {
          baseFontFamily = "'Cairo', 'Amiri', sans-serif";
        }

        ctx.textBaseline = "middle";

        const frameTopY = (showAyahFrame && selectedFrameStyle !== "none") ? (frameInset / 380) * width : 0;
        const frameBottomY = (showAyahFrame && selectedFrameStyle !== "none") ? (frameInset / 380) * width : 0;

        const topLimit = showIstiadhah
          ? ((selectedAspectRatio === "9:16" || isTallRatio) ? height * 0.13 : height * 0.15)
          : (showAyahFrame && selectedFrameStyle !== "none")
          ? frameTopY + 14 * scaleRatio
          : height * 0.05;
        const bottomLimit = (showSurahInfo || showWatermark)
          ? ((selectedAspectRatio === "9:16" || isTallRatio) ? height * 0.90 : height * 0.88)
          : (showAyahFrame && selectedFrameStyle !== "none")
          ? height - frameBottomY - 14 * scaleRatio
          : height * 0.95;
        const availableH = bottomLimit - topLimit;
        const availableW = width * 0.84;
        const ayahDeltaY = (textOffsetY / previewH) * height;
        const ayahDeltaX = (textOffsetX / previewW) * width;

        // Preload authentic Surah Header SVG banner
        const surahHeaderImg = new window.Image();
        surahHeaderImg.src = createAuthenticSurahHeaderSvg(surahHeaderColor || "#C5A85C", surahHeaderTextColor || textColor);
        await new Promise<void>((resolve) => {
          if (surahHeaderImg.complete && surahHeaderImg.naturalWidth > 0) {
            resolve();
          } else {
            surahHeaderImg.onload = () => resolve();
            surahHeaderImg.onerror = () => {
              surahHeaderImg.src = createSurahHeaderSvg(surahHeaderColor || "#C5A85C", surahHeaderColor || "#C5A85C");
              surahHeaderImg.onload = () => resolve();
              surahHeaderImg.onerror = () => resolve();
            };
          }
        });

        // MODE 1: FULL PAGE AUTHENTIC QCF4 RENDERING (All 15 lines displayed precisely, or 8 lines for Page 1 & 2)
        const isOpeningMushafPage =
          (selectedPageNumber === 1 || selectedPageNumber === 2) ||
          (activeData?.surahNumber === 1) ||
          (activeData?.surahNumber === 2 && rangeFrom === 1 && rangeTo <= 5);

        if ((shareMode === "page" || isOpeningMushafPage || qcf4Lines.length > 0) && selectedQuranFont === "qcf4" && isQcfValid && qcf4Lines.length > 0) {
          const numLines = isOpeningMushafPage ? Math.max(qcf4Lines.length, 8) : Math.max(qcf4Lines.length, 15);
          const targetLineH = availableH / numLines;
          const pageLineFontSize = isOpeningMushafPage
            ? Math.min(ayahFontSize * 1.3, Math.max(16, Math.round(targetLineH * 0.52)))
            : Math.min(ayahFontSize, Math.max(12, Math.round(targetLineH * 0.58)));
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

          if (showAyahText) {
            qcf4Lines.forEach((line, lineIdx) => {
            const lineY = startY + lineIdx * targetLineH;
            const isSurahHeader = line.words.some((w) => w.type === "surah_header");
            const isBismillah = line.words.some((w) => w.type === "bismillah");

            if (isSurahHeader) {
              const headerWord = line.words.find((w) => w.type === "surah_header");
              const headerGlyph = headerWord?.char || getSurahHeaderGlyph(activeData.surahNumber, activeData.surahName);
              ctx.save();
              const hFontSize = Math.round(pageLineFontSize * (isOpeningMushafPage ? 1.3 : 1.15) * 1.7);
              ctx.font = `bold ${hFontSize}px "QCF4_QBSML", "Amiri", serif`;
              ctx.fillStyle = surahHeaderTextColor || textColor;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              // Authentic Medina Mushaf Banner Frame
              const bannerW = Math.min(availableW * 0.98, (isOpeningMushafPage ? 360 : 340) * scaleRatio);
              const bannerH = bannerW * (30.23196 / 240.20621);
              const bannerX = width / 2 - bannerW / 2 + ayahDeltaX;
              const bannerY = lineY - bannerH / 2;

              if (surahHeaderImg && surahHeaderImg.complete && surahHeaderImg.naturalWidth > 0) {
                ctx.drawImage(surahHeaderImg, bannerX, bannerY, bannerW, bannerH);
              }

              ctx.fillText(headerGlyph, width / 2 + ayahDeltaX, lineY - 3.5 * scaleRatio);
              ctx.restore();
              return;
            }

            if (isBismillah) {
              const bismillahWord = line.words.find((w) => w.type === "bismillah");
              ctx.save();
              const bFontSize = Math.round(pageLineFontSize * (isOpeningMushafPage ? 1.3 : 1.2));
              ctx.font = `${bFontSize}px "QCF4_QBSML", "Amiri", serif`;
              ctx.fillStyle = textColor;
              ctx.textAlign = "center";
              ctx.fillText(getBismillahGlyph(), width / 2 + ayahDeltaX, lineY - 4 * scaleRatio);
              ctx.restore();
              return;
            }

            // Normal Quran Verse Line
            const wordWidths = line.words.map((w) => {
              const f = w.font || qcf4Font;
              ctx.font = `${pageLineFontSize}px "${f}", ${baseFontFamily}`;
              return ctx.measureText(w.char || w.text || "").width;
            });
            const totalWordW = wordWidths.reduce((acc, val) => acc + val, 0);

            const isJustified = !isSurahHeader && !isBismillah && line.words.length > 2 && textAlign === "justify";
            let wordSpacing = Math.max(6, Math.round(pageLineFontSize * (isOpeningMushafPage ? 0.32 : 0.22)));

            if (isJustified && totalWordW < availableW && !isOpeningMushafPage) {
              wordSpacing = (availableW - totalWordW) / (line.words.length - 1);
            } else if (isOpeningMushafPage && isJustified && totalWordW < availableW * 0.92) {
              wordSpacing = Math.min(Math.round(pageLineFontSize * 0.45), (availableW * 0.92 - totalWordW) / Math.max(1, line.words.length - 1));
            }

            let startRightX = 0;
            if (isJustified && !isOpeningMushafPage) {
              startRightX = (width + availableW) / 2 + ayahDeltaX;
            } else if (textAlign === "center" || isOpeningMushafPage) {
              const lineWidth = totalWordW + (line.words.length - 1) * wordSpacing;
              startRightX = (width + lineWidth) / 2 + ayahDeltaX;
            } else if (textAlign === "right") {
              startRightX = (width + availableW) / 2 + ayahDeltaX;
            } else {
              const lineWidth = totalWordW + (line.words.length - 1) * wordSpacing;
              startRightX = (width - availableW) / 2 + lineWidth + ayahDeltaX;
            }

            let currentX = startRightX;
            line.words.forEach((w, wIdx) => {
              const wWidth = wordWidths[wIdx];
              const isEnd = w.type === "end";
              const f = w.font || qcf4Font;

              ctx.font = `${pageLineFontSize}px "${f}", ${baseFontFamily}`;
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
            const bismillahVariants = [
              "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
              "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
              "بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ",
              "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ",
              "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ"
            ];
            for (const b of bismillahVariants) {
              if (cleanedAyahText.startsWith(b)) {
                cleanedAyahText = cleanedAyahText.replace(b, "").trim();
                break;
              }
            }
          }

          const wordsList: WordItem[] = isQcfValid
            ? qcf4Words.map((w) => ({ char: w.char, font: w.font || qcf4Font, type: w.type }))
            : cleanedAyahText.split(" ").filter(Boolean).map((t) => ({ char: t, font: baseFontFamily, type: "word" }));

          let curFontSize = ayahFontSize;
          let lines: { words: WordItem[]; widths: number[]; totalWidth: number }[] = [];
          const maxTextWidth = availableW;

          // Auto-scale font size down if necessary so ALL lines fit inside available height
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

            const testLineHeight = Math.round(curFontSize * (selectedQuranFont === "qcf4" ? 1.6 : 1.85));
            if (lines.length * testLineHeight <= availableH || curFontSize <= 11) {
              break;
            }
            curFontSize = Math.max(10, Math.floor(curFontSize * 0.92));
          }

          const isPageSurahStart =
            shareMode === "page" &&
            surahsList.some((s) => getSurahStartPage(s.number) === selectedPageNumber);
          const pageStartingSurah = isPageSurahStart
            ? surahsList.find((s) => getSurahStartPage(s.number) === selectedPageNumber)
            : null;
          const targetSurahNum = pageStartingSurah ? pageStartingSurah.number : (activeData?.surahNumber || 1);
          const targetSurahName = pageStartingSurah ? pageStartingSurah.name : (activeData?.surahName || "");

          const hasSurahStart =
            (shareMode === "single" && Number(activeData?.ayah?.numberInSurah) === 1) ||
            (shareMode === "range" && Number(rangeFrom) === 1) ||
            isPageSurahStart;

          const isBismillah =
            openingHeaderMode === "bismillah" ||
            (openingHeaderMode === "auto" && hasSurahStart && Number(targetSurahNum) !== 9);
          const isIstiadhah =
            openingHeaderMode === "istiadhah" ||
            (openingHeaderMode === "auto" && (!hasSurahStart || Number(targetSurahNum) === 9));
          const isSurahFrame = openingHeaderMode === "surah_frame";
          const shouldDrawOpeningHeader = showOpeningHeader;

          const bannerFontSize = Math.max(20, Math.round(curFontSize * 1.1 * 1.6));
          const bannerScaleFactor = surahHeaderScale ? surahHeaderScale / 100 : 1;
          const bannerW = Math.min(availableW * 0.98, 340 * scaleRatio * bannerScaleFactor);
          const bannerH = isSurahFrame ? bannerW * (30.23196 / 240.20621) : 0;

          const curHeaderFontSize = Math.round(openingHeaderSize * scaleRatio);
          const ayahFontFamilyCanvas = getAyahFontFamily(true);
          let headerFontFamily = ayahFontFamilyCanvas;
          if (openingHeaderFont === "uthman") {
            headerFontFamily = '"UthmanicHafs", "Amiri", serif';
          } else if (openingHeaderFont === "cairo") {
            headerFontFamily = '"Cairo", sans-serif';
          } else if (openingHeaderFont === "amiri") {
            headerFontFamily = '"Amiri", serif';
          } else if (openingHeaderFont === "qcf4") {
            headerFontFamily = '"QCF4_QBSML", "Amiri", serif';
          }
          const headerColorToUse = isBismillah ? (openingHeaderColor || textColor) : (istiadhahColor || textColor);

          const headerTextH = shouldDrawOpeningHeader
            ? (isSurahFrame ? bannerH : Math.max(24 * scaleRatio, curHeaderFontSize * 1.3))
            : 0;
          const headerGap = shouldDrawOpeningHeader ? Math.max(8 * scaleRatio, curHeaderFontSize * 0.3) : 0;
          const headerExtraH = shouldDrawOpeningHeader ? headerTextH + headerGap : 0;

          const spaceWidth = Math.max(6, Math.round(curFontSize * 0.25));
          const lineHeight = Math.min(
            Math.round(curFontSize * (selectedQuranFont === "qcf4" ? 1.6 : 1.85)),
            Math.floor((availableH - headerExtraH) / Math.max(lines.length, 1))
          );
          const totalHeight = lines.length * lineHeight + headerExtraH;

          const isCompactLayout = !showIstiadhah && !showSurahInfo && !showWatermark;

          let startY = isCompactLayout
            ? topLimit + headerExtraH + Math.max(0, (availableH - totalHeight) / 2) + lineHeight / 2 + ayahDeltaY
            : height / 2 + ayahDeltaY - ((lines.length - 1) * lineHeight + headerExtraH) / 2 + headerExtraH;

          if (startY - headerExtraH - lineHeight / 2 < topLimit) {
            startY = topLimit + headerExtraH + lineHeight / 2;
          }
          if (startY + (lines.length - 1) * lineHeight + lineHeight / 2 > bottomLimit) {
            startY = bottomLimit - (lines.length - 1) * lineHeight - lineHeight / 2;
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

          // Draw Opening Header (Bismillah / Istiadhah / Surah Frame) independently of Ayah offset
          if (shouldDrawOpeningHeader) {
            const baseHeaderY = topLimit + (isSurahFrame ? bannerH / 2 + 10 * scaleRatio : Math.max(16 * scaleRatio, curHeaderFontSize * 0.8));
            const headerDrawX = width / 2 + (surahHeaderOffsetX / previewW) * width;
            const headerDrawY = baseHeaderY + (surahHeaderOffsetY / previewH) * height;

            if (isSurahFrame) {
              const bannerX = headerDrawX - bannerW / 2;
              const bannerBoxY = headerDrawY - bannerH / 2;

              if (surahHeaderImg && surahHeaderImg.complete && surahHeaderImg.naturalWidth > 0) {
                ctx.drawImage(surahHeaderImg, bannerX, bannerBoxY, bannerW, bannerH);
              }

              const useQbsml = isQbsmlLoaded();
              const headerGlyph = useQbsml
                ? getSurahHeaderGlyph(targetSurahNum, targetSurahName)
                : (targetSurahName?.startsWith("سُورَةُ") || targetSurahName?.startsWith("سورة") ? targetSurahName : `سُورَةُ ${targetSurahName}`);

              ctx.save();
              ctx.font = useQbsml
                ? `bold ${bannerFontSize}px "QCF4_QBSML", "Amiri", serif`
                : `bold ${Math.round(bannerFontSize * 0.95)}px "Amiri", "UthmanicHafs", serif`;
              ctx.fillStyle = surahHeaderTextColor || textColor;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(headerGlyph, headerDrawX, headerDrawY - 3.5 * scaleRatio);
              ctx.restore();
            } else if (isBismillah) {
              ctx.save();
              const useQbsml = (openingHeaderFont === "qcf4" || (openingHeaderFont === "match_ayah" && selectedQuranFont === "qcf4")) && isQbsmlLoaded();
              ctx.font = useQbsml
                ? `${curHeaderFontSize}px "QCF4_QBSML", "Amiri", serif`
                : `bold ${curHeaderFontSize}px ${headerFontFamily}`;
              ctx.fillStyle = headerColorToUse;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              const bismillahText = useQbsml
                ? getBismillahGlyph()
                : "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
              ctx.fillText(bismillahText, headerDrawX, headerDrawY);
              ctx.restore();
            } else {
              // isIstiadhah - Use the authentic calligraphy image from src/assets/images/istiadha_calligraphy_1787675484366.jpg
              try {
                const baseCanvas = await getBaseAlphaCanvas();
                if (baseCanvas && baseCanvas.width > 0 && baseCanvas.height > 0) {
                  const targetH = Math.round(curHeaderFontSize * 1.15);
                  const targetW = Math.min(
                    Math.round(availableW * 0.92),
                    Math.round((targetH * baseCanvas.width) / baseCanvas.height)
                  );
                  const offCanvas = document.createElement("canvas");
                  offCanvas.width = baseCanvas.width;
                  offCanvas.height = baseCanvas.height;
                  const offCtx = offCanvas.getContext("2d");
                  if (offCtx) {
                    offCtx.drawImage(baseCanvas, 0, 0);
                    offCtx.globalCompositeOperation = "source-in";
                    offCtx.fillStyle = headerColorToUse;
                    offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

                    ctx.save();
                    ctx.drawImage(
                      offCanvas,
                      headerDrawX - targetW / 2,
                      headerDrawY - targetH / 2,
                      targetW,
                      targetH
                    );
                    ctx.restore();
                  }
                } else {
                  ctx.save();
                  ctx.font = `${Math.round(curHeaderFontSize * 0.95)}px ${headerFontFamily}`;
                  ctx.fillStyle = headerColorToUse;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText("أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيْطَانِ ٱلرَّجِيمِ", headerDrawX, headerDrawY);
                  ctx.restore();
                }
              } catch (e) {
                ctx.save();
                ctx.font = `${Math.round(curHeaderFontSize * 0.95)}px ${headerFontFamily}`;
                ctx.fillStyle = headerColorToUse;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيْطَانِ ٱلرَّجِيمِ", headerDrawX, headerDrawY);
                ctx.restore();
              }
            }
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
              if (selectedQuranFont !== "qcf4") {
                const lineString = line.words.map((w) => w.char).join(" ");
                ctx.font = `${curFontSize}px ${baseFontFamily}`;
                ctx.fillStyle = textColor;
                ctx.textAlign = textAlign === "center" ? "center" : textAlign === "right" ? "right" : "left";
                const drawX =
                  textAlign === "center"
                    ? width / 2 + ayahDeltaX
                    : textAlign === "right"
                    ? (width + maxTextWidth) / 2 + ayahDeltaX
                    : (width - maxTextWidth) / 2 + ayahDeltaX;
                ctx.fillText(lineString, drawX, lineY);
              } else {
                let startRightX = 0;
                if (textAlign === "center") {
                  startRightX = (width + line.totalWidth) / 2 + ayahDeltaX;
                } else if (textAlign === "right") {
                  startRightX = (width + maxTextWidth) / 2 + ayahDeltaX;
                } else {
                  startRightX = (width - maxTextWidth) / 2 + line.totalWidth + ayahDeltaX;
                }

                let currentRight = startRightX;
                line.words.forEach((item, wIdx) => {
                  const wWidth = line.widths[wIdx];
                  ctx.font = `${curFontSize}px ${item.font ? `"${item.font}", ` : ""}${baseFontFamily}`;
                  ctx.fillStyle = textColor;
                  ctx.textAlign = "right";
                  ctx.fillText(item.char, currentRight, lineY);
                  currentRight -= (wWidth + spaceWidth);
                });
              }
            });
            ctx.restore();
          }
        }

        // 6. Footer (Al-Tibyan Logo on Bottom Right, Surah Info on Bottom Left)
        const footerBaseY = (selectedAspectRatio === "9:16" || isTallRatio) ? height * 0.94 : height * 0.93;

        // Bottom Left: Surah Name Badge / Icon
        if (showSurahInfo) {
          ctx.save();
          const infoX = width * 0.22 + (surahInfoOffsetX / previewW) * width;
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

        // Bottom Right: "مصحف التبيان" in Cairo font without icon
        if (showWatermark) {
          ctx.save();
          const logoX = width * 0.82 + (watermarkOffsetX / previewW) * width;
          const logoY = footerBaseY + (watermarkOffsetY / previewH) * height;
          const activeLogoColor = logoColor || textColor || "#FAF8F5";
          const logoScaleFactor = (watermarkScale || 100) / 100;
          ctx.translate(logoX, logoY);
          ctx.scale(logoScaleFactor, logoScaleFactor);
          ctx.translate(-logoX, -logoY);

          try {
            const fontSize = Math.round(width * 0.018);
            ctx.font = `bold ${fontSize}px 'Cairo', sans-serif`;
            ctx.fillStyle = activeLogoColor;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText("مصحف التبيان", logoX, logoY);
          } catch (e) {
            ctx.font = `bold ${Math.round(width * 0.018)}px 'Cairo', sans-serif`;
            ctx.fillStyle = activeLogoColor;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("مصحف التبيان", logoX, logoY);
          }
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

    isCardDirtyRef.current = true;
    const timer = setTimeout(async () => {
      if (cardPreviewRef.current) {
        try {
          if (document.fonts) {
            await document.fonts.ready;
          }
          const exportFilter = (node: Node) =>
            !(
              node instanceof HTMLElement &&
              (node.classList.contains("prevent-drag") ||
                node.classList.contains("layer-controls-box") ||
                node.hasAttribute("data-export-ignore"))
            );
          
          try {
            const blob = await toBlob(cardPreviewRef.current, {
              pixelRatio: 1.5,
              cacheBust: false,
              skipFonts: true,
              filter: exportFilter,
            });
            if (blob) {
              cachedExportBlobRef.current = blob;
              const objectUrl = URL.createObjectURL(blob);
              cachedDataUrlRef.current = objectUrl;
              isCardDirtyRef.current = false;
              setGeneratedImageUrl(objectUrl);
              return;
            }
          } catch (blobErr) {
            console.warn("Fast toBlob pre-render skipped:", blobErr);
          }

          const dataUrl = await toPng(cardPreviewRef.current, {
            pixelRatio: 1.5,
            cacheBust: false,
            skipFonts: true,
            filter: exportFilter,
          });
          if (dataUrl) {
            cachedDataUrlRef.current = dataUrl;
            cachedExportBlobRef.current = dataUrlToBlob(dataUrl);
            isCardDirtyRef.current = false;
            setGeneratedImageUrl(dataUrl);
            return;
          }
        } catch {
          await drawCanvas();
        }
      } else {
        await drawCanvas();
      }
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
      const bismillahVariants = [
        "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
        "بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ",
        "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ",
        "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ",
      ];
      for (const b of bismillahVariants) {
        if (t.startsWith(b)) {
          t = t.replace(b, "").trim();
          break;
        }
      }
    }
    return t;
  };

  const getExportedImageBlob = async (forceFresh = false): Promise<{ url: string; blob: Blob | null }> => {
    // 0. INSTANT FAST-PATH: If pre-rendered Blob is already available and card hasn't been modified, return in 0ms!
    if (!forceFresh && !isCardDirtyRef.current && cachedExportBlobRef.current) {
      const url = cachedDataUrlRef.current || (generatedImageUrl ? generatedImageUrl : URL.createObjectURL(cachedExportBlobRef.current));
      return { url, blob: cachedExportBlobRef.current };
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
            pixelRatio: 1.5,
            cacheBust: false,
            skipFonts: true,
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
              pixelRatio: 1.5,
              cacheBust: false,
              skipFonts: true,
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
    setShowAyahFrame(defaultToUse.showAyahFrame ?? true);
    setSelectedFrameStyle(defaultToUse.selectedFrameStyle || "rectangle");
    setFrameColor(defaultToUse.frameColor || "#C5A85C");
    setFrameWidth(defaultToUse.frameWidth ?? 2);
    setFrameInset(defaultToUse.frameInset ?? 24);
    setShowOpeningHeader(defaultToUse.showOpeningHeader ?? true);
    setOpeningHeaderMode(defaultToUse.openingHeaderMode || "auto");
    setOpeningHeaderSize(defaultToUse.openingHeaderSize ?? 30);
    setOpeningHeaderColor(defaultToUse.openingHeaderColor || defaultToUse.textColor || "#FAF8F5");
    setOpeningHeaderFont(defaultToUse.openingHeaderFont || "match_ayah");
    setShowSurahHeaderFrame(defaultToUse.showSurahHeaderFrame ?? false);
    setSurahHeaderStyle(defaultToUse.surahHeaderStyle || "authentic");
    setSurahHeaderColor(defaultToUse.surahHeaderColor || "#C5A85C");
    setSurahHeaderTextColor(defaultToUse.textColor || "#FAF8F5");
    setSurahHeaderScale(defaultToUse.surahHeaderScale ?? 100);
    setSelectedQuranFont(defaultToUse.selectedQuranFont || "qcf4");
    setTextFontSize(defaultToUse.textFontSize ?? 28);
    setTextShadowOpacity(defaultToUse.textShadowOpacity ?? 0);
    setTextAlign(defaultToUse.textAlign || "justify");
    setTextColor(defaultToUse.textColor || "#FAF8F5");
    setSurahHeaderColor(defaultToUse.surahHeaderColor || "#C5A85C");
    setLogoColor(defaultToUse.logoColor);
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
    setIstiadhahColor(defaultToUse.istiadhahColor || defaultToUse.textColor || "#FAF8F5");
    setIstiadhahSize(defaultToUse.istiadhahSize ?? 38);
    setShowSurahInfo(defaultToUse.showSurahInfo ?? false);
    setShowWatermark(defaultToUse.showWatermark ?? false);
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

  // Helper to render opening header (Bismillah for beginning, Istiadhah for middle)
  const renderOpeningHeader = () => {
    if (!showOpeningHeader) return null;

    const isPageSurahStart =
      shareMode === "page" &&
      surahsList.some((s) => getSurahStartPage(s.number) === selectedPageNumber);
    const pageStartingSurah = isPageSurahStart
      ? surahsList.find((s) => getSurahStartPage(s.number) === selectedPageNumber)
      : null;
    const targetSurahNum = pageStartingSurah ? pageStartingSurah.number : (activeData?.surahNumber || 1);
    const targetSurahName = pageStartingSurah ? pageStartingSurah.name : (activeData?.surahName || "");
    const hasSurahStart =
      (shareMode === "single" && Number(activeData?.ayah?.numberInSurah) === 1) ||
      (shareMode === "range" && Number(rangeFrom) === 1) ||
      isPageSurahStart;

    if (openingHeaderMode === "surah_frame") {
      return (
        <div
          data-layer="header"
          onPointerDown={(e) => handleStartDrag(e, "header")}
          className={`absolute top-4 sm:top-5 left-0 right-0 z-20 px-3 flex items-center justify-center select-none transition-transform ${
            !isMovementLocked ? "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-blue-400/50 rounded-lg py-0.5" : "cursor-default"
          }`}
          style={{
            transform: `translate3d(${surahHeaderOffsetX}px, ${surahHeaderOffsetY}px, 0) scale(${surahHeaderScale ? surahHeaderScale / 100 : 1}) rotate(${surahHeaderRotation}deg)`,
            transformOrigin: "center center",
            touchAction: "none",
          }}
          title="إطار اسم السورة (انقر للتحديد، اسحب للتحريك، باعد بإصبعين للتكبير)"
        >
          {renderLayerControls("header", "إطار السورة")}
          <ShareSurahHeaderFrame
            surahNumber={targetSurahNum}
            surahName={targetSurahName}
            frameColor={surahHeaderColor || "#C5A85C"}
            textColor={surahHeaderTextColor || textColor}
            headerStyle={surahHeaderStyle}
            scale={surahHeaderScale ? surahHeaderScale / 100 : 1}
          />
        </div>
      );
    }

    const isBismillah =
      openingHeaderMode === "bismillah" ||
      (openingHeaderMode === "auto" && hasSurahStart && Number(targetSurahNum) !== 9);

    const ayahFontFamily = getAyahFontFamily(false);
    let headerFontFamily = ayahFontFamily;
    if (openingHeaderFont === "uthman") {
      headerFontFamily = "'UthmanicHafs', 'Amiri', serif";
    } else if (openingHeaderFont === "cairo") {
      headerFontFamily = "'Cairo', sans-serif";
    } else if (openingHeaderFont === "amiri") {
      headerFontFamily = "'Amiri', serif";
    } else if (openingHeaderFont === "qcf4") {
      headerFontFamily = "'QCF4_QBSML', 'Amiri', serif";
    }

    // Istiadhah strictly matches the verses font (خط الآيات) by default or when match_ayah is active
    const istiadhahFontToUse =
      openingHeaderFont === "match_ayah" || !openingHeaderFont || openingHeaderFont === "qcf4"
        ? ayahFontFamily
        : headerFontFamily;

    const fontToApply = isBismillah ? headerFontFamily : istiadhahFontToUse;
    const headerColor = isBismillah ? (openingHeaderColor || textColor) : (istiadhahColor || textColor);

    const useQbsmlBismillah = isBismillah && (openingHeaderFont === "qcf4" || (openingHeaderFont === "match_ayah" && selectedQuranFont === "qcf4")) && isQbsmlLoaded();

    return (
      <div
        data-layer="header"
        onPointerDown={(e) => handleStartDrag(e, "header")}
        className={`absolute top-4 sm:top-5 left-0 right-0 z-20 px-3 flex items-center justify-center select-none transition-transform ${
          !isMovementLocked ? "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-blue-400/50 rounded-lg py-0.5" : "cursor-default"
        }`}
        style={{
          transform: `translate3d(${surahHeaderOffsetX}px, ${surahHeaderOffsetY}px, 0) scale(${surahHeaderScale ? surahHeaderScale / 100 : 1}) rotate(${surahHeaderRotation}deg)`,
          transformOrigin: "center center",
          touchAction: "none",
        }}
        title={isBismillah ? "البسملة (انقر للتحديد، اسحب للتحريك، باعد بإصبعين للتكبير)" : "الاستعاذة (انقر للتحديد، اسحب للتحريك، باعد بإصبعين للتكبير)"}
      >
        {renderLayerControls("header", isBismillah ? "البسملة" : "الاستعاذة")}
        {isBismillah ? (
          <div
            className="w-full text-center tracking-normal select-none pointer-events-none"
            style={{
              fontFamily: useQbsmlBismillah ? "'QCF4_QBSML', 'Amiri', serif" : fontToApply,
              fontSize: `${openingHeaderSize}px`,
              color: headerColor,
              lineHeight: 1.25,
            }}
          >
            {useQbsmlBismillah ? (
              getBismillahGlyph()
            ) : (
              "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
            )}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center select-none pointer-events-none px-2 py-0.5">
            <IstiadhahCalligraphy
              color={headerColor}
              height={Math.max(22, openingHeaderSize)}
            />
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
                <div className="w-full max-w-[min(100%,360px)] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[540px] flex items-center justify-between px-1 mb-2">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Sparkles size={11} className={`sm:w-3 sm:h-3 ${tTheme.accentText}`} />
                      <span>معاينة البطاقة</span>
                    </span>
                  </div>
                  {selectedAspectRatio === "auto" && (
                    <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium flex items-center gap-1">
                      <span>مقاس تلقائي:</span>
                      <span className="font-bold">{autoDimensions.label}</span>
                    </span>
                  )}
                </div>

                <div
                  ref={cardPreviewRef}
                  id="share-ayah-card-preview"
                  onTouchStart={handleCardTouchStart}
                  onTouchMove={handleCardTouchMove}
                  onTouchEnd={handleCardTouchEnd}
                  onTouchCancel={handleCardTouchEnd}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setSelectedLayer(null);
                    }
                  }}
                  className={`w-full max-w-[min(100%,360px)] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[540px] rounded-2xl overflow-hidden shadow-2xl relative border border-white/10 flex items-center justify-center select-none transition-all duration-300 ${
                    selectedAspectRatio === "auto"
                      ? autoDimensions.ratioClass
                      : selectedAspectRatio !== "custom"
                      ? (aspectRatioOptions.find((a) => a.id === selectedAspectRatio)?.ratioClass || "aspect-[9/16]")
                      : ""
                  }`}
                  style={{
                    touchAction: isMovementLocked ? "auto" : "none",
                    aspectRatio:
                      selectedAspectRatio === "auto"
                        ? autoDimensions.aspectStyle
                        : selectedAspectRatio === "custom"
                        ? `${customWidth} / ${customHeight}`
                        : undefined,
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
                  {/* Texture Background Layer */}
                  {bgCategory === "texture" && showTexture && selectedTextureId && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-all duration-300 z-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url("${texturePresets.find((t) => t.id === selectedTextureId)?.imageUrl || texturePresets[0].imageUrl}")`,
                        opacity: textureOpacity,
                      }}
                    />
                  )}

                  {/* Contrast Vignette Layer for Textures */}
                  {bgCategory === "texture" && (
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/35 via-black/10 to-black/45 z-0" />
                  )}

                  {/* Pattern Overlay Layer */}
                  {showPattern && selectedPatternId && selectedPatternId !== "none" && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-all duration-300 z-[1]"
                      style={{
                        backgroundImage: `url("${
                          (() => {
                            const pat = patternPresets.find((p) => p.id === selectedPatternId);
                            if (!pat) return patternPresets[0].svgPattern;
                            return pat.rawSvg ? createSvgDataUrl(pat.rawSvg, patternColor) : pat.svgPattern;
                          })()
                        }")`,
                        backgroundRepeat: "repeat",
                        backgroundSize: "60px 60px",
                        opacity: patternOpacity,
                      }}
                    />
                  )}

                  {/* Frame & Borders */}
                  {showAyahFrame && selectedFrameStyle !== "none" && (
                    <>
                      {selectedFrameStyle === "rectangle" && (
                        <>
                          <div
                            className="absolute border pointer-events-none transition-all duration-200"
                            style={{
                              inset: `${frameInset}px`,
                              borderColor: frameColor,
                              borderWidth: `${frameWidth}px`,
                            }}
                          />
                          <div
                            className="absolute border pointer-events-none opacity-35"
                            style={{
                              inset: `${frameInset + 6}px`,
                              borderColor: frameColor,
                              borderWidth: `1px`,
                            }}
                          />
                          {/* Corner Diamonds */}
                          <div className="absolute w-2 h-2 rotate-45 pointer-events-none -translate-x-1/2 -translate-y-1/2" style={{ top: `${frameInset}px`, left: `${frameInset}px`, backgroundColor: frameColor }} />
                          <div className="absolute w-2 h-2 rotate-45 pointer-events-none translate-x-1/2 -translate-y-1/2" style={{ top: `${frameInset}px`, right: `${frameInset}px`, backgroundColor: frameColor }} />
                          <div className="absolute w-2 h-2 rotate-45 pointer-events-none -translate-x-1/2 translate-y-1/2" style={{ bottom: `${frameInset}px`, left: `${frameInset}px`, backgroundColor: frameColor }} />
                          <div className="absolute w-2 h-2 rotate-45 pointer-events-none translate-x-1/2 translate-y-1/2" style={{ bottom: `${frameInset}px`, right: `${frameInset}px`, backgroundColor: frameColor }} />
                        </>
                      )}

                      {selectedFrameStyle === "andalusian" && (
                        <>
                          <div
                            className="absolute border pointer-events-none transition-all duration-200"
                            style={{
                              inset: `${frameInset}px`,
                              borderColor: frameColor,
                              borderWidth: `${frameWidth}px`,
                            }}
                          />
                          <div
                            className="absolute border pointer-events-none opacity-35"
                            style={{
                              inset: `${frameInset + 6}px`,
                              borderColor: frameColor,
                              borderWidth: `1px`,
                            }}
                          />
                          {/* Corner Andalusian floral brackets */}
                          <div className="absolute w-4 h-4 border-t-2 border-r-2 rounded-tl-lg pointer-events-none" style={{ top: `${frameInset - 1}px`, right: `${frameInset - 1}px`, borderColor: frameColor }} />
                          <div className="absolute w-4 h-4 border-t-2 border-l-2 rounded-tr-lg pointer-events-none" style={{ top: `${frameInset - 1}px`, left: `${frameInset - 1}px`, borderColor: frameColor }} />
                          <div className="absolute w-4 h-4 border-b-2 border-r-2 rounded-bl-lg pointer-events-none" style={{ bottom: `${frameInset - 1}px`, right: `${frameInset - 1}px`, borderColor: frameColor }} />
                          <div className="absolute w-4 h-4 border-b-2 border-l-2 rounded-br-lg pointer-events-none" style={{ bottom: `${frameInset - 1}px`, left: `${frameInset - 1}px`, borderColor: frameColor }} />
                        </>
                      )}

                      {selectedFrameStyle === "vintage-border" && (
                        <>
                          <div
                            className="absolute border pointer-events-none transition-all duration-200"
                            style={{
                              inset: `${frameInset}px`,
                              borderColor: frameColor,
                              borderWidth: `${frameWidth}px`,
                            }}
                          />
                          <div
                            className="absolute border border-dotted pointer-events-none opacity-60"
                            style={{
                              inset: `${frameInset + 6}px`,
                              borderColor: frameColor,
                              borderWidth: `1.5px`,
                            }}
                          />
                          {/* Corner knots */}
                          <div className="absolute w-2 h-2 pointer-events-none -translate-x-1/2 -translate-y-1/2" style={{ top: `${frameInset}px`, left: `${frameInset}px`, backgroundColor: frameColor }} />
                          <div className="absolute w-2 h-2 pointer-events-none translate-x-1/2 -translate-y-1/2" style={{ top: `${frameInset}px`, right: `${frameInset}px`, backgroundColor: frameColor }} />
                          <div className="absolute w-2 h-2 pointer-events-none -translate-x-1/2 translate-y-1/2" style={{ bottom: `${frameInset}px`, left: `${frameInset}px`, backgroundColor: frameColor }} />
                          <div className="absolute w-2 h-2 pointer-events-none translate-x-1/2 translate-y-1/2" style={{ bottom: `${frameInset}px`, right: `${frameInset}px`, backgroundColor: frameColor }} />
                        </>
                      )}

                      {selectedFrameStyle === "rounded" && (
                        <>
                          <div
                            className="absolute border rounded-2xl pointer-events-none transition-all duration-200"
                            style={{
                              inset: `${frameInset}px`,
                              borderColor: frameColor,
                              borderWidth: `${frameWidth}px`,
                            }}
                          />
                          <div
                            className="absolute border rounded-xl pointer-events-none opacity-35"
                            style={{
                              inset: `${frameInset + 6}px`,
                              borderColor: frameColor,
                              borderWidth: `1px`,
                            }}
                          />
                        </>
                      )}

                      {selectedFrameStyle === "minimal" && (
                        <>
                          <div
                            className="absolute border pointer-events-none transition-all duration-200"
                            style={{
                              inset: `${frameInset}px`,
                              borderColor: frameColor,
                              borderWidth: `1px`,
                            }}
                          />
                          {/* Minimal corner cross ticks */}
                          <div className="absolute w-2 h-2 border-t-2 border-l-2 pointer-events-none" style={{ top: `${frameInset - 3}px`, left: `${frameInset - 3}px`, borderColor: frameColor }} />
                          <div className="absolute w-2 h-2 border-t-2 border-r-2 pointer-events-none" style={{ top: `${frameInset - 3}px`, right: `${frameInset - 3}px`, borderColor: frameColor }} />
                          <div className="absolute w-2 h-2 border-b-2 border-l-2 pointer-events-none" style={{ bottom: `${frameInset - 3}px`, left: `${frameInset - 3}px`, borderColor: frameColor }} />
                          <div className="absolute w-2 h-2 border-b-2 border-r-2 pointer-events-none" style={{ bottom: `${frameInset - 3}px`, right: `${frameInset - 3}px`, borderColor: frameColor }} />
                        </>
                      )}
                    </>
                  )}

                  {/* Opening Header (Basmala / Isti'adha / Surah Frame) - Fully Independent Drag (Up/Down/Left/Right) */}
                  {showOpeningHeader ? (
                    renderOpeningHeader()
                  ) : showIstiadhah ? (
                    <div
                      data-layer="header"
                      onPointerDown={(e) => handleStartDrag(e, "header")}
                      className={`absolute top-4 sm:top-5 left-0 right-0 text-center z-20 select-none ${
                        isDraggingElement === "header" ? "transition-none scale-105" : "transition-transform duration-75"
                      } ${
                        !isMovementLocked ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                      }`}
                      style={{
                        transform: `translate3d(${surahHeaderOffsetX}px, ${surahHeaderOffsetY}px, 0)`,
                        touchAction: "none",
                      }}
                    >
                      {renderLayerControls("header", "الاستعاذة")}
                      <div className={`inline-flex items-center justify-center relative transition-all ${
                        !isMovementLocked ? "hover:ring-1 hover:ring-emerald-400/50 cursor-grab active:cursor-grabbing ring-1 ring-emerald-400/30 rounded-full px-2 py-1" : ""
                      } ${
                        isDraggingElement === "header" ? "ring-2 ring-emerald-400/90 rounded-full px-2 py-1" : ""
                      }`}>
                        <IstiadhahCalligraphy
                          color={istiadhahColor || textColor}
                          height={istiadhahSize}
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* TEXT CONTAINER (Ayah text window) - Draggable, Rotatable & Scalable just like other layers */}
                  {showAyahText && (
                    <div
                      data-layer="ayah"
                      onPointerDown={(e) => handleStartDrag(e, "ayah")}
                      className={
                        shareMode === "page"
                          ? `w-[94%] max-w-[340px] px-2.5 py-1.5 rounded-xl h-[78%] flex flex-col justify-between items-stretch text-center z-10 select-none relative ${
                              isDraggingElement === "ayah" ? "transition-none shadow-2xl scale-[1.01]" : "transition-shadow"
                            } ${
                              !isMovementLocked ? "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-blue-400/40" : "cursor-default"
                            }`
                          : `w-fit max-w-[90%] mx-auto px-4 py-3 rounded-2xl flex flex-col items-center justify-center text-center z-10 select-none relative ${
                              isDraggingElement === "ayah" ? "transition-none shadow-2xl scale-[1.01]" : "transition-shadow"
                            } ${
                              !isMovementLocked ? "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-blue-400/40" : "cursor-default"
                            }`
                      }
                      style={{
                        transform: `translate3d(${textOffsetX}px, ${textOffsetY}px, 0) scale(${ayahScale ? ayahScale / 100 : 1}) rotate(${textRotation}deg)`,
                        transformOrigin: "center center",
                        backgroundColor: textShadowOpacity > 0 ? `rgba(0, 0, 0, ${textShadowOpacity})` : undefined,
                        touchAction: "none",
                      }}
                    >
                      {renderLayerControls("ayah", "نص الآيات")}
                    {isLoadingVerse ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-6 text-emerald-300/80">
                        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium">جاري تحميل الآية الكريمة...</span>
                      </div>
                    ) : (shareMode === "page" || ((selectedPageNumber === 1 || selectedPageNumber === 2 || activeData?.surahNumber === 1 || (activeData?.surahNumber === 2 && rangeFrom === 1 && rangeTo <= 5)) && qcf4Lines.length > 0)) && selectedQuranFont === "qcf4" && isQcf4Loaded && qcf4Lines.length > 0 ? (
                      <div
                        className="w-full h-full flex flex-col justify-between items-stretch text-center select-none pointer-events-none"
                        dir="rtl"
                      >
                        {qcf4Lines.map((line, lIdx) => {
                          const isOpeningMushafPage = (selectedPageNumber === 1 || selectedPageNumber === 2) || (activeData?.surahNumber === 1) || (activeData?.surahNumber === 2 && rangeFrom === 1 && rangeTo <= 5);
                          const isSurahHeader = line.words.some((w) => w.type === "surah_header");
                          const isBismillah = line.words.some((w) => w.type === "bismillah");
                          const isJustified = !isSurahHeader && !isBismillah && line.words.length > 2 && textAlign === "justify";

                          return (
                            <div
                              key={`share-page-line-${lIdx}`}
                              className={`w-full flex items-center ${
                                isSurahHeader || isBismillah
                                  ? "justify-center"
                                  : isJustified && !isOpeningMushafPage
                                  ? "justify-between"
                                  : textAlign === "right"
                                  ? "justify-start gap-1.5"
                                  : textAlign === "left"
                                  ? "justify-end gap-1.5"
                                  : "justify-center gap-1.5"
                              } py-0 text-center flex-nowrap`}
                              style={{
                                minHeight: isOpeningMushafPage ? "1.75em" : "1.15em",
                                lineHeight: isOpeningMushafPage ? 1.35 : 1.1,
                              }}
                            >
                              {line.words.map((w, wIdx) => {
                                const isSurahHeaderWord = w.type === "surah_header";
                                const isBismillahWord = w.type === "bismillah";
                                const isEnd = w.type === "end";
                                const wordFont = w.font || (isSurahHeaderWord || isBismillahWord ? "QCF4_QBSML" : qcf4Font);

                                if (isSurahHeaderWord) {
                                  return (
                                    <div
                                      key={`pw-${lIdx}-${wIdx}`}
                                      className="w-full flex items-center justify-center py-0.5"
                                    >
                                      <ShareSurahHeaderFrame
                                        surahNumber={activeData?.surahNumber || 1}
                                        surahName={activeData?.surahName || ""}
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
                                  return (
                                    <div
                                      key={`pw-${lIdx}-${wIdx}`}
                                      className="w-full text-center my-0.5 select-none flex items-center justify-center -translate-y-1 sm:-translate-y-1.5"
                                      style={{
                                        fontFamily: "'QCF4_QBSML', 'Amiri', serif",
                                        fontSize: `${Math.max(16, isOpeningMushafPage ? textFontSize * 1.35 : textFontSize * 1.25)}px`,
                                        color: textColor,
                                        lineHeight: 1.2,
                                      }}
                                    >
                                      {getBismillahGlyph()}
                                    </div>
                                  );
                                }

                                return (
                                  <span
                                    key={`pw-${lIdx}-${wIdx}`}
                                    style={{
                                      fontFamily: `"${wordFont}", 'QCF4_QBSML', 'Amiri', serif`,
                                      fontSize: `${textFontSize}px`,
                                      color: textColor,
                                      lineHeight: isOpeningMushafPage ? 1.35 : 1.15,
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
                      <div className="w-full h-full flex-1 flex flex-col items-center justify-center select-none pointer-events-none text-center" dir="rtl">
                        <div
                          className="w-full flex flex-wrap items-center justify-center gap-x-1 gap-y-1.5 select-none pointer-events-none text-center"
                          style={{
                            direction: "rtl",
                            justifyContent:
                              textAlign === "right"
                                ? "flex-start"
                                : textAlign === "left"
                                ? "flex-end"
                                : "center",
                            textAlign: textAlign as any,
                          }}
                        >
                          {qcf4Words.map((w, idx) => (
                            <span
                              key={`qcf4-w-${activeData?.surahNumber || 1}-${activeData?.ayah?.numberInSurah || 1}-${idx}`}
                              style={{
                                fontFamily: w.font || qcf4Font || "'QCF4_QBSML', 'Amiri', 'UthmanicHafs', serif",
                                fontSize: `${textFontSize}px`,
                                color: textColor,
                                lineHeight: 1.8,
                              }}
                            >
                              {w.char || w.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex-1 flex flex-col items-center justify-center select-none pointer-events-none text-center" dir="rtl">
                        <p
                          className={`w-full select-none pointer-events-none text-center ${shareMode === "page" ? "line-clamp-none" : ""}`}
                          style={{
                            fontSize: `${textFontSize}px`,
                            color: textColor,
                            textAlign: textAlign as any,
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
                      </div>
                    )}
                  </div>
                  )}

                  {/* Footer Surah Info (Bottom Left) - Draggable (Up/Down/Left/Right) */}
                  {showSurahInfo && (
                    <div
                      data-layer="info"
                      onPointerDown={(e) => handleStartDrag(e, "info")}
                      className={`absolute bottom-3.5 left-4 z-20 select-none ${
                        isDraggingElement === "info" ? "transition-none scale-105" : "transition-transform duration-75"
                      } ${
                        !isMovementLocked ? "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-blue-400/40" : "cursor-default"
                      }`}
                      style={{
                        transform: `translate3d(${surahInfoOffsetX}px, ${surahInfoOffsetY}px, 0) scale(${surahInfoScale ? surahInfoScale / 100 : 1}) rotate(${surahInfoRotation}deg)`,
                        transformOrigin: "center center",
                        touchAction: "none",
                      }}
                      title="شارة السورة (انقر للتحديد، اسحب للتحريك، باعد بإصبعين للتكبير)"
                    >
                      {renderLayerControls("info", "شارة السورة")}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm inline-flex items-center gap-1.5 transition-all backdrop-blur-[2px] ${
                          !isMovementLocked ? "hover:ring-1 hover:ring-blue-400/40 cursor-grab active:cursor-grabbing" : ""
                        }`}
                        style={{
                          color: logoColor || textColor,
                          borderColor: `${logoColor || textColor}35`,
                          backgroundColor: `${logoColor || textColor}12`,
                        }}
                      >
                        <span className="text-sm font-normal leading-none flex items-center gap-1.5" style={{ fontFamily: "QCF4_QBSML, 'Amiri', serif" }}>
                          {getSurahHeaderGlyph(activeData.surahNumber, activeData.surahName) ? (
                            <>
                              <span className="opacity-95">{getSurahHeaderGlyph(activeData.surahNumber, activeData.surahName)}</span>
                              <span className="font-bold text-xs" style={{ fontFamily: "'Amiri', serif" }}>
                                {activeData.surahName?.startsWith("سورة") ? activeData.surahName : `سورة ${activeData.surahName}`}
                              </span>
                            </>
                          ) : (
                            <span className="font-bold text-xs" style={{ fontFamily: "'Amiri', serif" }}>
                              {activeData.surahName?.startsWith("سورة") ? activeData.surahName : `سورة ${activeData.surahName}`}
                            </span>
                          )}
                        </span>
                        {shareMode === "page" && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="text-[10px] font-bold">
                              {toArabicNumerals(selectedPageNumber)}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Al-Tibyan Logo (Bottom Right) - Draggable (Up/Down/Left/Right) */}
                  {showWatermark && (
                    <div
                      data-layer="watermark"
                      onPointerDown={(e) => handleStartDrag(e, "watermark")}
                      className={`absolute bottom-3.5 right-4 z-20 select-none ${
                        isDraggingElement === "watermark" ? "transition-none scale-105" : "transition-transform duration-75"
                      } ${
                        !isMovementLocked ? "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-blue-400/40" : "cursor-default"
                      }`}
                      style={{
                        transform: `translate3d(${watermarkOffsetX}px, ${watermarkOffsetY}px, 0) scale(${watermarkScale ? watermarkScale / 100 : 1}) rotate(${watermarkRotation}deg)`,
                        transformOrigin: "center center",
                        touchAction: "none",
                      }}
                      title="شعار التبيان (انقر للتحديد، اسحب للتحريك، باعد بإصبعين للتكبير)"
                    >
                      {renderLayerControls("watermark", "شعار التبيان")}
                      <div
                        className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded transition-all ${
                          !isMovementLocked ? "hover:ring-1 hover:ring-blue-400/40 cursor-grab active:cursor-grabbing" : ""
                        }`}
                      >
                        <AlTibyanCalligraphy
                          color={logoColor || textColor || "#FAF8F5"}
                          height={18}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Aspect Ratio Selector Pills, Lock/Unlock Movement Toggle, and Reset Position Button */}
                <div className="flex items-center justify-center gap-1 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto no-scrollbar flex-nowrap max-w-full px-1">
                  <div className={`flex items-center gap-0.5 sm:gap-1.5 p-0.5 sm:p-1 rounded-2xl border shrink-0 flex-nowrap ${tTheme.aspectContainer}`}>
                    {aspectRatioOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedAspectRatio(opt.id)}
                        className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-0.5 sm:gap-1 whitespace-nowrap shrink-0 ${
                          selectedAspectRatio === opt.id
                            ? tTheme.aspectActive
                            : tTheme.aspectInactive
                        }`}
                        title={opt.id === "auto" ? `القياس التلقائي المتجاوب: ${autoDimensions.label}` : opt.subLabel}
                      >
                        {opt.id === "auto" && (
                          <Sparkles
                            size={10}
                            className={`sm:w-3 sm:h-3 ${selectedAspectRatio === "auto" ? "text-amber-200" : tTheme.accentText}`}
                          />
                        )}
                        <span className="text-[11px]">{opt.label}</span>
                        {opt.id === "auto" && selectedAspectRatio === "auto" && (
                          <span className="text-[8px] sm:text-[9px] opacity-90 font-mono">({autoDimensions.aspectStyle})</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Lock / Unlock Toggle Button on the left of Aspect Ratio Pills */}
                  <button
                    id="share-ayah-lock-toggle-btn"
                    type="button"
                    onClick={() => {
                      const nextState = !isMovementLocked;
                      setIsMovementLocked(nextState);
                      setShareStatus(
                        nextState
                          ? "تم قفل محتويات البطاقة ومنع تحريكها"
                          : "تم فتح قفل الحماية: يمكنك الآن سحب وتحريك نصوص وشعارات البطاقة بحرية"
                      );
                      setTimeout(() => setShareStatus(null), 3000);
                    }}
                    title={
                      isMovementLocked
                        ? "قفل الحماية مفعّل لمنع التحريك (اضغط لفتح القفل والسماح بالتحريك)"
                        : "قفل الحماية مفتوح: يمكنك سحب أي عنصر (اضغط للقفل والتثبيت)"
                    }
                    className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-2xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shadow-xs shrink-0 whitespace-nowrap ${
                      isMovementLocked
                        ? tTheme.quickBtn
                        : "bg-emerald-500/20 border-emerald-400 text-emerald-400 ring-2 ring-emerald-400/30"
                    }`}
                  >
                    {isMovementLocked ? (
                      <>
                        <Lock size={11} className="sm:w-3 sm:h-3 shrink-0 text-emerald-500" />
                        <span className="text-[11px]">قفل التحريك</span>
                      </>
                    ) : (
                      <>
                        <Unlock size={11} className="sm:w-3 sm:h-3 shrink-0 text-emerald-400 animate-pulse" />
                        <span className="text-[11px]">التحريك متاح</span>
                      </>
                    )}
                  </button>

                  {(textOffsetX !== 0 || textOffsetY !== 0 || textRotation !== 0 || surahHeaderOffsetX !== 0 || surahHeaderOffsetY !== 0 || surahHeaderRotation !== 0 || surahInfoOffsetX !== 0 || surahInfoOffsetY !== 0 || surahInfoRotation !== 0 || watermarkOffsetX !== 0 || watermarkOffsetY !== 0 || watermarkRotation !== 0) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(surahHeaderOffsetX !== 0 || surahHeaderOffsetY !== 0 || surahHeaderRotation !== 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSurahHeaderOffsetX(0);
                            setSurahHeaderOffsetY(0);
                            setSurahHeaderRotation(0);
                          }}
                          title="إعادة ضبط موضع وتدوير الترويسة (البسملة/الاستعاذة) إلى المنتصف"
                          className={`px-2 py-1.5 rounded-2xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0 whitespace-nowrap ${tTheme.quickBtn}`}
                        >
                          <RotateCcw size={10} className={`shrink-0 ${tTheme.accentText}`} />
                          <span>توسيط الترويسة</span>
                        </button>
                      )}
                      {(textOffsetX !== 0 || textOffsetY !== 0 || textRotation !== 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            setTextOffsetX(0);
                            setTextOffsetY(0);
                            setTextRotation(0);
                          }}
                          title="إعادة ضبط موضع وتدوير الآيات إلى المنتصف"
                          className={`px-2 py-1.5 rounded-2xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0 whitespace-nowrap ${tTheme.quickBtn}`}
                        >
                          <RotateCcw size={10} className={`shrink-0 ${tTheme.accentText}`} />
                          <span>توسيط الآيات</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setTextOffsetX(0);
                          setTextOffsetY(0);
                          setTextRotation(0);
                          setSurahHeaderOffsetX(0);
                          setSurahHeaderOffsetY(0);
                          setSurahHeaderRotation(0);
                          setSurahInfoOffsetX(0);
                          setSurahInfoOffsetY(0);
                          setSurahInfoRotation(0);
                          setWatermarkOffsetX(0);
                          setWatermarkOffsetY(0);
                          setWatermarkRotation(0);
                          setSurahHeaderScale(100);
                          setSurahInfoScale(100);
                          setWatermarkScale(100);
                          setAyahScale(100);
                          setTextFontSize(shareMode === "page" ? 14 : 28);
                          setShareStatus("تمت إعادة ضبط وتوسيط كافة العناصر إلى الوضع الافتراضي");
                          setTimeout(() => setShareStatus(null), 3000);
                        }}
                        title="إعادة ضبط كافة العناصر إلى المنتصف والقياس الافتراضي"
                        className={`px-2.5 py-1.5 rounded-2xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0 whitespace-nowrap ${tTheme.quickBtn}`}
                      >
                        <RotateCcw size={11} className={`shrink-0 ${tTheme.accentText}`} />
                        <span>إعادة ضبط الكل</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Custom Aspect Ratio Configuration Panel (Visible when selectedAspectRatio is 'custom') */}
                {selectedAspectRatio === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    className={`mt-2.5 p-3 rounded-2xl border flex flex-col gap-2.5 max-w-[380px] w-full mx-auto shadow-md ${tTheme.innerBox}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold flex items-center gap-1.5 ${tTheme.innerBoxHeader}`}>
                        <SlidersHorizontal size={13} className={tTheme.accentText} />
                        <span>أبعاد القياس المخصص</span>
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${tTheme.accentBadge}`}>
                        {toArabicNumerals(customWidth)} × {toArabicNumerals(customHeight)} بكسل
                      </span>
                    </div>

                    {/* Quick Popular Aspect Ratio Presets */}
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {[
                        { label: "4:5 إنستغرام", w: 1080, h: 1350 },
                        { label: "3:4 عمودي", w: 1080, h: 1440 },
                        { label: "2:3 صورة", w: 1080, h: 1620 },
                        { label: "4:3 كلاسيك", w: 1440, h: 1080 },
                        { label: "3:2 أفقي", w: 1620, h: 1080 },
                      ].map((preset) => {
                        const isMatch = customWidth === preset.w && customHeight === preset.h;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setCustomWidth(preset.w);
                              setCustomHeight(preset.h);
                            }}
                            className={`px-2 py-0.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                              isMatch ? tTheme.toggleActive : tTheme.toggleInactive
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Precise Custom Width & Height Inputs with Swap Button */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex-1 flex flex-col gap-1">
                        <label className={`text-[10px] font-semibold ${tTheme.innerBoxSub}`}>
                          العرض (px):
                        </label>
                        <input
                          type="number"
                          min={320}
                          max={4000}
                          step={10}
                          value={customWidth}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) setCustomWidth(val);
                          }}
                          onBlur={() => setCustomWidth((w) => Math.max(300, Math.min(4000, w || 1080)))}
                          className={`w-full px-2 py-1 rounded-xl border text-center font-bold text-xs focus:outline-none transition-all ${tTheme.innerBox}`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const temp = customWidth;
                          setCustomWidth(customHeight);
                          setCustomHeight(temp);
                        }}
                        title="عكس الأبعاد (أفقي / طولي)"
                        className={`mt-4 p-1.5 rounded-xl border shrink-0 transition-transform active:scale-90 hover:rotate-180 duration-300 cursor-pointer ${tTheme.quickBtn}`}
                      >
                        <ArrowLeftRight size={13} className={tTheme.accentText} />
                      </button>

                      <div className="flex-1 flex flex-col gap-1">
                        <label className={`text-[10px] font-semibold ${tTheme.innerBoxSub}`}>
                          الارتفاع (px):
                        </label>
                        <input
                          type="number"
                          min={320}
                          max={4000}
                          step={10}
                          value={customHeight}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) setCustomHeight(val);
                          }}
                          onBlur={() => setCustomHeight((h) => Math.max(300, Math.min(4000, h || 1350)))}
                          className={`w-full px-2 py-1 rounded-xl border text-center font-bold text-xs focus:outline-none transition-all ${tTheme.innerBox}`}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* STUDIO CONTROL TABS */}
              <div className="w-full space-y-3 pt-1">
                
                {/* 🌟 SHARE SCOPE SELECTOR: آية واحدة | عدة آيات | صفحة كاملة */}
                <div className={`p-0.5 sm:p-1 rounded-2xl border shadow-inner grid grid-cols-3 gap-1 ${tTheme.tabContainer}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setShareMode("single");
                      handleChangeVerse(activeData.surahNumber, activeData.ayah.numberInSurah || 1);
                    }}
                    className={`py-1 sm:py-1.5 px-1 sm:px-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                      shareMode === "single" ? tTheme.tabActive : tTheme.tabInactive
                    }`}
                  >
                    <BookOpen size={11} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="text-[11px]">آية واحدة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShareMode("range");
                      handleChangeRange(activeData.surahNumber, rangeFrom, rangeTo);
                    }}
                    className={`py-1 sm:py-1.5 px-1 sm:px-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                      shareMode === "range" ? tTheme.tabActive : tTheme.tabInactive
                    }`}
                  >
                    <Layers size={11} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="text-[11px]">عدة آيات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShareMode("page");
                      handleChangePage(selectedPageNumber);
                    }}
                    className={`py-1 sm:py-1.5 px-1 sm:px-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                      shareMode === "page" ? tTheme.tabActive : tTheme.tabInactive
                    }`}
                  >
                    <FileText size={11} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="text-[11px]">صفحة كاملة</span>
                  </button>
                </div>

                {/* 🌟 SELECTOR ROW ACCORDING TO MODE */}
                <div className={`p-2 sm:p-2.5 rounded-2xl border shadow-xs space-y-2 sm:space-y-2.5 ${tTheme.innerBox}`}>
                  {/* Mode 1: Single Ayah */}
                  {shareMode === "single" && (
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                      {/* Surah Selector Button with QCF4 Surah Glyph */}
                      <div className="relative flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => setIsSurahDropdownOpen(!isSurahDropdownOpen)}
                          className={`w-full py-1 sm:py-1.5 px-2 sm:px-3 rounded-xl border text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-xs ${tTheme.selectedCard}`}
                          title="اختيار السورة"
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                            <BookOpen size={12} className={`sm:w-3.5 sm:h-3.5 shrink-0 ${tTheme.accentText}`} />
                            <span
                              className="text-xs xs:text-sm sm:text-base md:text-lg font-normal leading-none select-none truncate"
                              style={{ fontFamily: "QCF4_QBSML, 'Amiri', serif" }}
                            >
                              {getSurahHeaderGlyph(activeData.surahNumber, activeData.surahName) || `سورة ${activeData.surahName}`}
                            </span>
                          </div>
                          <ChevronDown size={11} className={`sm:w-3 sm:h-3 shrink-0 opacity-70 transition-transform duration-200 ${isSurahDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        <SurahSelectModal
                          isOpen={isSurahDropdownOpen}
                          onClose={() => setIsSurahDropdownOpen(false)}
                          selectedSurahNumber={activeData.surahNumber}
                          onSelectSurah={(num) => {
                            handleChangeVerse(num, 1);
                          }}
                          isDark={true}
                          theme="gold-velvet"
                          align="right"
                        />
                      </div>

                      {/* Ayah Stepper and Selector */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={activeData.ayah.numberInSurah <= 1 || isLoadingVerse}
                          onClick={() => handleChangeVerse(activeData.surahNumber, activeData.ayah.numberInSurah - 1)}
                          title="الآية السابقة"
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${tTheme.quickBtn}`}
                        >
                          <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>

                        <div className="relative flex items-center">
                          <select
                            value={activeData.ayah.numberInSurah}
                            disabled={isLoadingVerse}
                            onChange={(e) => handleChangeVerse(activeData.surahNumber, parseInt(e.target.value, 10))}
                            className={`py-1 sm:py-1.5 px-1.5 sm:px-2.5 text-[10px] xs:text-[11px] sm:text-xs font-bold rounded-xl border appearance-none text-center cursor-pointer min-w-[62px] sm:min-w-[70px] transition-all shadow-xs ${tTheme.subTabActive}`}
                          >
                            {Array.from({ length: currentSurahObj.numberOfAyahs }, (_, i) => i + 1).map((aNum) => (
                              <option key={aNum} value={aNum} className="bg-slate-900 text-white">
                                آية {toArabicNumerals(aNum)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          disabled={activeData.ayah.numberInSurah >= currentSurahObj.numberOfAyahs || isLoadingVerse}
                          onClick={() => handleChangeVerse(activeData.surahNumber, activeData.ayah.numberInSurah + 1)}
                          title="الآية التالية"
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${tTheme.quickBtn}`}
                        >
                          <ChevronLeft size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Multiple Ayahs (Range) */}
                  {shareMode === "range" && (
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

                {/* 3 Main Tabs (الخط | الخلفية | الإطار) */}
                <div className={`grid grid-cols-3 gap-1 sm:gap-1.5 p-0.5 sm:p-1 rounded-2xl border shadow-inner ${tTheme.tabContainer}`}>
                  <button
                    onClick={() => setActiveTab("typography")}
                    className={`py-1.5 sm:py-2 px-1 sm:px-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                      activeTab === "typography"
                        ? tTheme.tabActive
                        : tTheme.tabInactive
                    }`}
                  >
                    <Type size={11} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="text-[11px]">الخط</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("background")}
                    className={`py-1.5 sm:py-2 px-1 sm:px-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                      activeTab === "background"
                        ? tTheme.tabActive
                        : tTheme.tabInactive
                    }`}
                  >
                    <Palette size={11} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="text-[11px]">الخلفية</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("frame")}
                    className={`py-1.5 sm:py-2 px-1 sm:px-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                      activeTab === "frame"
                        ? tTheme.tabActive
                        : tTheme.tabInactive
                    }`}
                  >
                    <Square size={11} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="text-[11px]">الإطار</span>
                  </button>
                </div>

                {/* TAB 1: صانع الخلفية */}
                {activeTab === "background" && (
                  <div className={`space-y-3.5 p-3.5 rounded-2xl border backdrop-blur-xs ${tTheme.panelBg}`}>
                    {/* Sub Category Selector - 5 Primary Categories in a single clean row */}
                    <div className={`flex flex-nowrap items-center justify-between gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-xl w-full max-w-lg mx-auto border overflow-x-auto no-scrollbar ${tTheme.subTabsContainer}`}>
                      <button
                        id="bg-category-tab-gradient"
                        onClick={() => setBgCategory("gradient")}
                        className={`flex-1 min-w-0 py-1 sm:py-1.5 px-1 sm:px-1.5 text-[9px] xs:text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap ${
                          bgCategory === "gradient"
                            ? tTheme.subTabActive
                            : tTheme.subTabInactive
                        }`}
                      >
                        <Sparkles size={11} className="sm:w-3 sm:h-3 shrink-0" />
                        <span className="whitespace-nowrap">تدرجات</span>
                      </button>

                      <button
                        id="bg-category-tab-solid"
                        onClick={() => setBgCategory("solid")}
                        className={`flex-1 min-w-0 py-1 sm:py-1.5 px-1 sm:px-1.5 text-[9px] xs:text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap ${
                          bgCategory === "solid"
                            ? tTheme.subTabActive
                            : tTheme.subTabInactive
                        }`}
                      >
                        <Palette size={11} className="sm:w-3 sm:h-3 shrink-0" />
                        <span className="whitespace-nowrap">لون</span>
                      </button>

                      <button
                        id="bg-category-tab-pattern"
                        onClick={() => setBgCategory("pattern")}
                        className={`flex-1 min-w-0 py-1 sm:py-1.5 px-1 sm:px-1.5 text-[9px] xs:text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap ${
                          bgCategory === "pattern"
                            ? tTheme.subTabActive
                            : tTheme.subTabInactive
                        }`}
                      >
                        <SlidersHorizontal size={11} className="sm:w-3 sm:h-3 shrink-0" />
                        <span className="whitespace-nowrap">نقوش</span>
                      </button>

                      <button
                        id="bg-category-tab-texture"
                        onClick={() => {
                          setBgCategory("texture");
                          setShowTexture(true);
                        }}
                        className={`flex-1 min-w-0 py-1 sm:py-1.5 px-1 sm:px-1.5 text-[9px] xs:text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap ${
                          bgCategory === "texture"
                            ? tTheme.subTabActive
                            : tTheme.subTabInactive
                        }`}
                      >
                        <Layers size={11} className="sm:w-3 sm:h-3 shrink-0" />
                        <span className="whitespace-nowrap">خامات</span>
                      </button>

                      <button
                        id="bg-category-tab-none"
                        onClick={() => {
                          setBgCategory("none");
                          setShowTexture(false);
                          setShowPattern(false);
                          setTextShadowOpacity(0);
                        }}
                        className={`flex-1 min-w-0 py-1 sm:py-1.5 px-1 sm:px-1.5 text-[9px] xs:text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap ${
                          bgCategory === "none"
                            ? tTheme.subTabActive
                            : tTheme.subTabInactive
                        }`}
                      >
                        <Ban size={11} className="sm:w-3 sm:h-3 shrink-0" />
                        <span className="whitespace-nowrap">بلا خلفية</span>
                      </button>
                    </div>

                    {/* Sub-View: التدرجات اللونية (Gradients View) */}
                    {bgCategory === "gradient" && (
                      <div className="space-y-3">
                        {/* Gradient Control Field (حقل التحكم بالتدرج) with Linear & Radial Switcher & Parameters */}
                        <div id="gradient-control-field" className={`p-3 rounded-xl border space-y-3 ${tTheme.innerBox}`}>
                          {/* Linear vs Radial Mode Switcher with Icons */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold ${tTheme.innerBoxHeader}`}>
                              نمط التدرج
                            </span>
                            <div className={`flex gap-1 p-1 rounded-xl border ${tTheme.subTabsContainer}`}>
                              <button
                                id="gradient-mode-linear-btn"
                                onClick={() => setGradientType("linear")}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  gradientType === "linear"
                                    ? tTheme.subTabActive
                                    : tTheme.subTabInactive
                                }`}
                              >
                                <Sparkles size={12} />
                                <span>خطي</span>
                              </button>
                              <button
                                id="gradient-mode-radial-btn"
                                onClick={() => setGradientType("radial")}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  gradientType === "radial"
                                    ? tTheme.subTabActive
                                    : tTheme.subTabInactive
                                }`}
                              >
                                <SunMedium size={12} />
                                <span>شعاعي</span>
                              </button>
                            </div>
                          </div>

                          {/* Linear Controls */}
                          {gradientType === "linear" && (
                            <div className="pt-2 border-t border-white/5 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[11px] font-bold ${tTheme.innerBoxSub}`}>
                                  زاوية واتجاه التدرج
                                </span>
                                <span className={`text-[11px] font-bold font-mono ${tTheme.accentText}`}>
                                  {gradientAngle}°
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  {[
                                    { label: "0°", angle: 0 },
                                    { label: "45°", angle: 45 },
                                    { label: "90°", angle: 90 },
                                    { label: "135°", angle: 135 },
                                    { label: "180°", angle: 180 },
                                    { label: "270°", angle: 270 },
                                  ].map((ang) => (
                                    <button
                                      key={ang.angle}
                                      onClick={() => setGradientAngle(ang.angle)}
                                      className={`px-2 py-0.5 text-[10px] font-bold rounded border cursor-pointer transition-all ${
                                        gradientAngle === ang.angle
                                          ? tTheme.subTabActive
                                          : "border-white/10 text-white/70 hover:bg-white/10"
                                      }`}
                                    >
                                      {ang.label}
                                    </button>
                                  ))}
                                </div>

                                <div className="flex items-center gap-2 flex-1 min-w-[140px] justify-end">
                                  <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={gradientAngle}
                                    onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                                    className={`w-full max-w-[130px] h-1.5 rounded-lg appearance-none cursor-pointer ${tTheme.sliderTrack} ${tTheme.sliderAccent}`}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Radial Controls */}
                          {gradientType === "radial" && (
                            <div className="pt-2 border-t border-white/5 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  <SunMedium size={12} className={tTheme.accentText} />
                                  <span className={`text-[11px] font-bold ${tTheme.innerBoxSub}`}>
                                    انتشار وتوهج الشعاع
                                  </span>
                                </div>
                                <span className={`text-[11px] font-bold font-mono ${tTheme.accentText}`}>
                                  {radialSpread}%
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1">
                                  {[
                                    { label: "مركز ضيق", val: 35 },
                                    { label: "متوسط", val: 60 },
                                    { label: "متوازن", val: 85 },
                                    { label: "واسع", val: 120 },
                                    { label: "غامر", val: 160 },
                                  ].map((item) => (
                                    <button
                                      key={item.val}
                                      onClick={() => setRadialSpread(item.val)}
                                      className={`px-2 py-0.5 text-[10px] font-bold rounded border cursor-pointer transition-all ${
                                        radialSpread === item.val
                                          ? tTheme.subTabActive
                                          : "border-white/10 text-white/70 hover:bg-white/10"
                                      }`}
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </div>

                                <div className="flex items-center gap-2 flex-1 min-w-[140px] justify-end">
                                  <input
                                    type="range"
                                    min="15"
                                    max="200"
                                    value={radialSpread}
                                    onChange={(e) => setRadialSpread(parseInt(e.target.value))}
                                    className={`w-full max-w-[130px] h-1.5 rounded-lg appearance-none cursor-pointer ${tTheme.sliderTrack} ${tTheme.sliderAccent}`}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Presets Grid - Compact Icon/Swatch Only */}
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5">
                          {gradientPresets.map((preset) => {
                            const isSelected = gradientColor1 === preset.color1 && gradientColor2 === preset.color2;
                            const presetBackground =
                              gradientType === "radial"
                                ? `radial-gradient(circle at center, ${preset.color2} 0%, ${preset.color1} 100%)`
                                : `linear-gradient(${gradientAngle}deg, ${preset.color1}, ${preset.color2})`;

                            return (
                              <button
                                key={preset.id}
                                title={preset.name}
                                onClick={() => {
                                  setGradientColor1(preset.color1);
                                  setGradientColor2(preset.color2);
                                  setTextColor(preset.textDefault);
                                  setSurahHeaderTextColor(preset.textDefault);
                                }}
                                style={{
                                  background: presetBackground,
                                }}
                                className={`h-8 rounded-lg relative shadow-xs transition-all duration-150 cursor-pointer border-2 flex items-center justify-center ${
                                  isSelected
                                    ? "border-amber-400 ring-2 ring-amber-400/40 scale-105"
                                    : "border-white/15 hover:border-white/40 hover:scale-105"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-3.5 h-3.5 rounded-full bg-black/60 text-amber-400 flex items-center justify-center backdrop-blur-xs">
                                    <Check size={8} className="stroke-[3px]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom Colors Picker */}
                        <div className={`p-2.5 rounded-xl border space-y-1.5 ${tTheme.innerBox}`}>
                          <span className={`text-xs font-bold block ${tTheme.innerBoxHeader}`}>
                            {gradientType === "radial" ? "ألوان التدرج الشعاعي" : "ألوان التدرج الخطي"}
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <div className={`flex items-center justify-between p-2 rounded-xl border transition-all ${tTheme.unselectedCard}`}>
                              <span className={`text-[11px] sm:text-xs font-bold truncate ml-1 ${tTheme.innerBoxSub}`}>
                                {gradientType === "radial" ? "لون المركز" : "لون البداية"}
                              </span>
                              <label
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/30 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden transition-transform hover:scale-110 shrink-0 bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400"
                                title={gradientType === "radial" ? "اختر لون المركز" : "اختر لون البداية"}
                              >
                                <input
                                  type="color"
                                  value={gradientType === "radial" ? gradientColor2 : gradientColor1}
                                  onChange={(e) => {
                                    if (gradientType === "radial") {
                                      setGradientColor2(e.target.value);
                                    } else {
                                      setGradientColor1(e.target.value);
                                    }
                                  }}
                                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                />
                              </label>
                            </div>

                            <div className={`flex items-center justify-between p-2 rounded-xl border transition-all ${tTheme.unselectedCard}`}>
                              <span className={`text-[11px] sm:text-xs font-bold truncate ml-1 ${tTheme.innerBoxSub}`}>
                                {gradientType === "radial" ? "لون الأطراف" : "لون النهاية"}
                              </span>
                              <label
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/30 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden transition-transform hover:scale-110 shrink-0 bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400"
                                title={gradientType === "radial" ? "اختر لون الأطراف" : "اختر لون النهاية"}
                              >
                                <input
                                  type="color"
                                  value={gradientType === "radial" ? gradientColor1 : gradientColor2}
                                  onChange={(e) => {
                                    if (gradientType === "radial") {
                                      setGradientColor1(e.target.value);
                                    } else {
                                      setGradientColor2(e.target.value);
                                    }
                                  }}
                                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-View: لون موحد */}
                    {bgCategory === "solid" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5">
                          {solidColorPresets.map((preset) => {
                            const isSelected = selectedSolidColor === preset.value;
                            return (
                              <button
                                key={preset.id}
                                title={preset.name}
                                onClick={() => {
                                  setSelectedSolidColor(preset.value);
                                  setTextColor(preset.textDefault);
                                  setSurahHeaderTextColor(preset.textDefault);
                                }}
                                style={{ backgroundColor: preset.value }}
                                className={`h-8 rounded-lg relative shadow-xs transition-all duration-150 cursor-pointer border-2 flex items-center justify-center ${
                                  isSelected
                                    ? "border-amber-400 ring-2 ring-amber-400/40 scale-105"
                                    : "border-black/15 hover:border-white/40 hover:scale-105"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-3.5 h-3.5 rounded-full bg-black/60 text-amber-400 flex items-center justify-center backdrop-blur-xs">
                                    <Check size={8} className="stroke-[3px]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom Color Input */}
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between ${tTheme.innerBox}`}>
                          <span className={`text-xs font-bold ${tTheme.innerBoxHeader}`}>
                            لون مخصص
                          </span>
                          <label
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/30 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden transition-transform hover:scale-110 shrink-0 bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400"
                            title="اختر لون مخصص"
                          >
                            <input
                              type="color"
                              value={selectedSolidColor}
                              onChange={(e) => setSelectedSolidColor(e.target.value)}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Sub-View: منوع خامة ونمط */}
                    {bgCategory === "pattern" && (
                      <div className="space-y-3">
                        {/* Toggle Pattern Active */}
                        <div className={`p-2 rounded-xl border flex items-center justify-between ${tTheme.innerBox}`}>
                          <div className="flex items-center gap-1.5">
                            <SlidersHorizontal size={12} className={tTheme.accentText} />
                            <span className={`text-xs font-bold ${tTheme.innerBoxHeader}`}>
                              تفعيل النقش بالخلفية
                            </span>
                          </div>
                          <button
                            onClick={() => setShowPattern(!showPattern)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all border ${
                              showPattern ? tTheme.subTabActive : tTheme.unselectedCard
                            }`}
                          >
                            {showPattern ? "مفعّل ✓" : "معطّل"}
                          </button>
                        </div>

                        {/* Pattern Cards Grid - Compact Icon Only */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5">
                          {/* None Option */}
                          <button
                            onClick={() => {
                              setSelectedPatternId("none");
                              setShowPattern(false);
                            }}
                            title="بدون نقش"
                            className={`h-11 rounded-lg transition-all cursor-pointer border relative overflow-hidden flex items-center justify-center group ${
                              !showPattern || selectedPatternId === "none"
                                ? tTheme.selectedCard
                                : tTheme.unselectedCard
                            }`}
                          >
                            <span className="text-[10px] text-white/60 font-medium">بدون</span>
                            {(!showPattern || selectedPatternId === "none") && (
                              <div className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
                                <Check size={10} className={tTheme.accentText} />
                              </div>
                            )}
                          </button>

                          {patternPresets.map((pat) => {
                            const isSelected = showPattern && selectedPatternId === pat.id;
                            const swatchSvg = pat.rawSvg ? createSvgDataUrl(pat.rawSvg, patternColor) : pat.svgPattern;
                            return (
                              <button
                                key={pat.id}
                                onClick={() => {
                                  setSelectedPatternId(pat.id);
                                  setShowPattern(true);
                                }}
                                title={`${pat.name} - ${pat.desc}`}
                                className={`h-11 rounded-lg transition-all cursor-pointer border relative overflow-hidden group ${
                                  isSelected
                                    ? tTheme.selectedCard
                                    : tTheme.unselectedCard
                                }`}
                              >
                                {/* Pattern preview swatch */}
                                <div
                                  className="w-full h-full bg-black/40"
                                  style={{
                                    backgroundImage: `url("${swatchSvg}")`,
                                    backgroundRepeat: "repeat",
                                    backgroundSize: "20px 20px",
                                  }}
                                />
                                {isSelected && (
                                  <div className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5">
                                    <Check size={10} className={tTheme.accentText} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Pattern Color & Opacity Controls */}
                        <div className={`p-2.5 rounded-xl border space-y-2.5 ${tTheme.innerBox} ${!showPattern ? "opacity-50 pointer-events-none" : ""}`}>
                          {/* Pattern Color Selector */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <Palette size={12} className={tTheme.accentText} />
                              <span className={`text-xs font-bold ${tTheme.innerBoxHeader}`}>
                                لون خطوط النقش
                              </span>
                            </div>
                            {/* Custom Color Input */}
                            <label
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/30 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden transition-transform hover:scale-110 shrink-0 bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400"
                              title="اختر لون خطوط النقش"
                            >
                              <input
                                type="color"
                                value={patternColor}
                                onChange={(e) => setPatternColor(e.target.value)}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                              />
                            </label>
                          </div>

                          {/* Pattern Opacity Slider */}
                          <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
                            <span className={`text-xs font-bold whitespace-nowrap ${tTheme.innerBoxHeader}`}>
                              الوضوح: {Math.round(patternOpacity * 100)}%
                            </span>
                            <input
                              type="range"
                              min="5"
                              max="80"
                              value={Math.round(patternOpacity * 100)}
                              onChange={(e) => setPatternOpacity(parseInt(e.target.value) / 100)}
                              className={`flex-1 max-w-xs h-1.5 rounded-lg appearance-none cursor-pointer ${tTheme.sliderTrack} ${tTheme.sliderAccent}`}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-View: خامات وتأثيرات واقعية */}
                    {bgCategory === "texture" && (
                      <div className="space-y-3">
                        {/* Toggle Texture Active */}
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between ${tTheme.innerBox}`}>
                          <div className="flex items-center gap-2">
                            <Layers size={13} className={tTheme.accentText} />
                            <div>
                              <span className={`text-xs font-bold block ${tTheme.innerBoxHeader}`}>
                                تفعيل الخامة بالخلفية
                              </span>
                              <span className={`text-[10px] ${tTheme.innerBoxSub}`}>
                                خامات واقعية تضفي لمسة عريقة ودافئة
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowTexture(!showTexture)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all border ${
                              showTexture ? tTheme.subTabActive : tTheme.unselectedCard
                            }`}
                          >
                            {showTexture ? "مفعّلة ✓" : "معطّلة"}
                          </button>
                        </div>

                        {/* Texture Cards Grid - Compact Icon Only */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5">
                          {texturePresets.map((tex) => {
                            const isSelected = showTexture && selectedTextureId === tex.id;
                            return (
                              <button
                                key={tex.id}
                                title={`${tex.name} - ${tex.desc}`}
                                onClick={() => {
                                  setSelectedTextureId(tex.id);
                                  setShowTexture(true);
                                  setTextColor(tex.defaultTextColor);
                                  setIstiadhahColor(tex.defaultTextColor);
                                  setFrameColor(tex.defaultFrameColor);
                                  setSurahHeaderColor(tex.defaultFrameColor);
                                  if (tex.defaultBgGradient) {
                                    setGradientColor1(tex.defaultBgGradient.color1);
                                    setGradientColor2(tex.defaultBgGradient.color2);
                                  }
                                }}
                                className={`h-11 rounded-lg transition-all cursor-pointer border relative overflow-hidden group ${
                                  isSelected
                                    ? tTheme.selectedCard
                                    : tTheme.unselectedCard
                                }`}
                              >
                                {/* Thumbnail Image Swatch */}
                                <div className="w-full h-full bg-black/40 relative">
                                  <img
                                    src={tex.imageUrl}
                                    alt={tex.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>

                                {isSelected && (
                                  <div className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 z-10">
                                    <Check size={10} className={tTheme.accentText} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Texture Opacity Slider */}
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${tTheme.innerBox} ${!showTexture ? "opacity-50 pointer-events-none" : ""}`}>
                          <span className={`text-xs font-bold whitespace-nowrap ${tTheme.innerBoxHeader}`}>
                            الوضوح: {Math.round(textureOpacity * 100)}%
                          </span>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={Math.round(textureOpacity * 100)}
                            onChange={(e) => setTextureOpacity(parseInt(e.target.value) / 100)}
                            className={`flex-1 max-w-xs h-1.5 rounded-lg appearance-none cursor-pointer ${tTheme.sliderTrack} ${tTheme.sliderAccent}`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Sub-View: بلا خلفية (شفاف Transparent PNG) */}
                    {bgCategory === "none" && (
                      <div className="space-y-3">
                        <div className={`p-4 rounded-xl border space-y-3 text-center ${tTheme.innerBox}`}>
                          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                            <Ban size={20} />
                          </div>
                          <div>
                            <h4 className={`text-xs sm:text-sm font-bold ${tTheme.innerBoxHeader}`}>
                              خلفية شفافة (بلا خلفية)
                            </h4>
                            <p className={`text-[11px] sm:text-xs mt-1 leading-relaxed ${tTheme.innerBoxSub}`}>
                              يتم تصدير وحفظ بطاقة الآية الكريمة بصيغة <b>PNG شفافة</b> بالكامل بدون أي لون أو خلفية، مثالية للتصميم، المونتاج، وستوري البرامج.
                            </p>
                          </div>

                          {/* Quick Color Adjustments for Text & Frame */}
                          <div className="pt-3 border-t border-white/10 space-y-2 text-right">
                            <span className={`text-[11px] font-bold block ${tTheme.innerBoxSub}`}>
                              ألوان مقترحة للنص مع الخلفية الشفافة:
                            </span>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              {[
                                { name: "أبيض ناصع", text: "#FFFFFF", frame: "#FFFFFF" },
                                { name: "ذهبي فاخر", text: "#FFE082", frame: "#D4AF37" },
                                { name: "أسود داكن", text: "#111827", frame: "#1F2937" },
                                { name: "زمردي", text: "#6EE7B7", frame: "#10B981" },
                                { name: "سماوي", text: "#7DD3FC", frame: "#0284C7" },
                              ].map((preset) => (
                                <button
                                  key={preset.name}
                                  onClick={() => {
                                    setTextColor(preset.text);
                                    setIstiadhahColor(preset.text);
                                    setFrameColor(preset.frame);
                                    setSurahHeaderColor(preset.frame);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    textColor === preset.text ? tTheme.subTabActive : tTheme.quickBtn
                                  }`}
                                >
                                  <span
                                    className="w-3 h-3 rounded-full border border-white/40 inline-block shadow-xs"
                                    style={{ backgroundColor: preset.text }}
                                  />
                                  <span>{preset.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: الإطار والحدود */}
                {activeTab === "frame" && (
                  <div className={`space-y-3.5 p-3.5 rounded-2xl border backdrop-blur-xs ${tTheme.panelBg}`}>
                    <div className="space-y-3">
                      {/* Quick Toggle Card */}
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${tTheme.innerBox}`}>
                        <div className="flex items-center gap-2">
                          <Square size={16} className={showAyahFrame && selectedFrameStyle !== "none" ? tTheme.accentText : "text-slate-400"} />
                          <div>
                            <span className="text-xs font-bold block">إطار الآية (البطاقة)</span>
                            <span className={`text-[10px] block ${tTheme.innerBoxSub}`}>إظهار أو إخفاء الإطار المحيط ببطاقة الآية</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const next = !showAyahFrame;
                            setShowAyahFrame(next);
                            if (next && selectedFrameStyle === "none") {
                              setSelectedFrameStyle("rectangle");
                            }
                          }}
                          className={`flex items-center gap-1.5 py-1 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            showAyahFrame && selectedFrameStyle !== "none" ? tTheme.toggleActive : tTheme.toggleInactive
                          }`}
                        >
                          <span>{showAyahFrame && selectedFrameStyle !== "none" ? "مُفعّل" : "مُعطّل"}</span>
                          <span className={`w-2 h-2 rounded-full ${showAyahFrame && selectedFrameStyle !== "none" ? tTheme.toggleDotActive : tTheme.toggleDotInactive}`} />
                        </button>
                      </div>

                      {/* Frame Style Options */}
                      <div className="space-y-1.5">
                        <span className={`text-xs font-bold block ${tTheme.innerBoxHeader}`}>نمط إطار الآية:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {frameStyleOptions.map((frameOpt) => {
                            const isSelected = (showAyahFrame && selectedFrameStyle === frameOpt.id) || (!showAyahFrame && frameOpt.id === "none");
                            return (
                              <button
                                key={frameOpt.id}
                                onClick={() => {
                                  if (frameOpt.id === "none") {
                                    setShowAyahFrame(false);
                                    setSelectedFrameStyle("none");
                                  } else {
                                    setShowAyahFrame(true);
                                    setSelectedFrameStyle(frameOpt.id);
                                  }
                                }}
                                className={`p-2.5 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                                  isSelected
                                    ? tTheme.selectedCard
                                    : tTheme.unselectedCard
                                }`}
                              >
                                {frameOpt.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Inline Adjustments for Ayah Frame */}
                      <div className="space-y-2.5 pt-1">
                        <div className={`space-y-1 p-2.5 rounded-xl border ${tTheme.innerBox}`}>
                          <div className={`flex justify-between text-xs font-bold ${tTheme.innerBoxHeader}`}>
                            <span>سُمك إطار الآية</span>
                            <span className={tTheme.accentText}>{frameWidth} بكسل</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="6"
                            value={frameWidth}
                            onChange={(e) => setFrameWidth(parseInt(e.target.value))}
                            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${tTheme.sliderTrack} ${tTheme.sliderAccent}`}
                          />
                        </div>

                        <div className={`space-y-1 p-2.5 rounded-xl border ${tTheme.innerBox}`}>
                          <div className={`flex justify-between text-xs font-bold ${tTheme.innerBoxHeader}`}>
                            <span>الهامش الداخلي للإطار</span>
                            <span className={tTheme.accentText}>{frameInset} بكسل</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="45"
                            value={frameInset}
                            onChange={(e) => setFrameInset(parseInt(e.target.value))}
                            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${tTheme.sliderTrack} ${tTheme.sliderAccent}`}
                          />
                        </div>

                        {/* Frame Color */}
                        <div className={`space-y-1.5 p-2.5 rounded-xl border ${tTheme.innerBox}`}>
                          <span className={`text-xs font-bold block ${tTheme.innerBoxHeader}`}>لون إطار الآية</span>
                          <div className="flex flex-wrap gap-2 items-center">
                            {frameColorPalette.map((color) => (
                              <button
                                key={`af-${color}`}
                                onClick={() => setFrameColor(color)}
                                style={{ backgroundColor: color }}
                                className={`w-6 h-6 rounded-full border border-white/20 transition-transform cursor-pointer flex items-center justify-center ${
                                  frameColor === color ? "scale-115 ring-2 ring-amber-400" : "hover:scale-105"
                                }`}
                                title={`اختر اللون ${color}`}
                              >
                                {frameColor === color && (
                                  <Check
                                    size={10}
                                    className={
                                      color === "#FFFFFF" || color === "#FAF8F5" || color === "#E2C376" || color === "#C5A85C"
                                        ? "text-slate-900"
                                        : "text-white"
                                    }
                                  />
                                )}
                              </button>
                            ))}
                            {/* Custom Color Input */}
                            <label
                              className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden transition-transform hover:scale-110 bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400"
                              title="لون مخصص لإطار الآية"
                            >
                              <input
                                type="color"
                                value={frameColor}
                                onChange={(e) => setFrameColor(e.target.value)}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: الخط وبيانات الآية */}
                {activeTab === "typography" && (
                  <div className={`space-y-3.5 p-3.5 rounded-2xl border backdrop-blur-xs ${tTheme.panelBg}`}>
                    {/* Font Size Slider */}
                    <div className={`space-y-2 p-2.5 rounded-xl border ${tTheme.innerBox}`}>
                      <div className={`flex justify-between items-center text-xs font-bold ${tTheme.innerBoxHeader}`}>
                        <span>حجم الخط</span>
                        <span className={tTheme.accentText}>{textFontSize} بكسل</span>
                      </div>

                      {/* Precision Range Slider */}
                      <input
                        type="range"
                        min={shareMode === "page" ? "6" : "14"}
                        max={shareMode === "page" ? "22" : "50"}
                        value={textFontSize}
                        onChange={(e) => setTextFontSize(parseInt(e.target.value))}
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${tTheme.sliderTrack} ${tTheme.sliderAccent}`}
                      />
                    </div>

                    {/* Independent Opening Header (البسملة / الاستعاذة) Controls */}
                    <div className={`space-y-2 p-2.5 rounded-xl border ${tTheme.innerBox}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold block ${tTheme.innerBoxHeader}`}>
                            البسملة / الاستعاذة (ترويسة مستقلة):
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            showOpeningHeader ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-500/20 text-slate-400"
                          }`}>
                            {showOpeningHeader
                              ? (openingHeaderMode === "auto" ? "تلقائي ذكي" : openingHeaderMode === "bismillah" ? "بسملة دائماً" : openingHeaderMode === "istiadhah" ? "استعاذة دائماً" : "إطار السورة")
                              : "مُعطّلة"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowOpeningHeader(!showOpeningHeader)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                              showOpeningHeader ? tTheme.toggleActive : tTheme.toggleInactive
                            }`}
                          >
                            {showOpeningHeader ? "إخفاء" : "إظهار"}
                          </button>
                          {showOpeningHeader && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpeningHeaderSize(textFontSize);
                                setOpeningHeaderColor(textColor);
                              }}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${tTheme.unselectedCard}`}
                              title="مطابقة الحجم واللون تلقائياً مع الآية"
                            >
                              مطابقة الآية
                            </button>
                          )}
                        </div>
                      </div>

                      {showOpeningHeader && (
                        <div className="space-y-2 pt-1 border-t border-white/5">
                          {/* Size Slider */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={tTheme.innerBoxSub}>حجم خط البسملة / الاستعاذة:</span>
                              <span className={`font-mono font-bold ${tTheme.accentText}`}>{openingHeaderSize} بكسل</span>
                            </div>
                            <input
                              type="range"
                              min="16"
                              max="54"
                              value={openingHeaderSize}
                              onChange={(e) => setOpeningHeaderSize(parseInt(e.target.value))}
                              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${tTheme.sliderTrack} ${tTheme.sliderAccent}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Shading/Backdrop */}
                    <div className={`space-y-1 p-2.5 rounded-xl border ${tTheme.innerBox}`}>
                      <div className={`flex justify-between text-xs font-bold ${tTheme.innerBoxHeader}`}>
                        <span>تعتيم الخلفية خلف النص</span>
                        <span className={tTheme.accentText}>{Math.round(textShadowOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="85"
                        value={Math.round(textShadowOpacity * 100)}
                        onChange={(e) => setTextShadowOpacity(parseInt(e.target.value) / 100)}
                        className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${tTheme.sliderTrack} ${tTheme.sliderAccent}`}
                      />
                    </div>

                    {/* Text Alignment */}
                    <div className={`flex justify-between items-center p-2.5 rounded-xl border ${tTheme.innerBox}`}>
                      <span className={`text-xs font-bold ${tTheme.innerBoxHeader}`}>المحاذاة:</span>
                      <div className="flex gap-1">
                        {[
                          { align: "right", icon: <AlignRight size={13} />, title: "محاذاة لليمين" },
                          { align: "justify", icon: <AlignJustify size={13} />, title: "ضبط الأسطر (كالمصحف)" },
                          { align: "center", icon: <AlignCenter size={13} />, title: "توسيط من غير ضبط" },
                          { align: "left", icon: <AlignLeft size={13} />, title: "محاذاة لليسار" },
                        ].map((btn) => (
                          <button
                            key={btn.align}
                            type="button"
                            title={btn.title}
                            onClick={() => setTextAlign(btn.align as any)}
                            className={`p-1.5 rounded-lg cursor-pointer transition-all border ${
                              textAlign === btn.align
                                ? tTheme.subTabActive
                                : tTheme.unselectedCard
                            }`}
                          >
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Picker Controls: دوائر شبكة الألوان المخصصة */}
                    <div className={`p-2.5 rounded-xl border space-y-2 ${tTheme.innerBox}`}>
                      <span className={`text-xs font-bold block ${tTheme.innerBoxHeader}`}>
                        الألوان (النص واسم السورة / الاستعاذة / زخرفة الإطار / مصحف التبيان):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* 1. Text Color Picker Circle */}
                        <div className={`flex items-center justify-between p-2 rounded-xl border transition-all ${tTheme.toggleActive}`}>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] sm:text-xs font-bold truncate ml-1">نص الآيات والاسم</span>
                            <span className="text-[9px] text-emerald-400 font-medium">متابعة ومزامنة تامة</span>
                          </div>
                          <label
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/30 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden transition-transform hover:scale-110 shrink-0 bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400"
                            title="اختر لون نص الآيات واسم السورة داخل الإطار"
                          >
                            <input
                              type="color"
                              value={textColor}
                              onChange={(e) => {
                                const newColor = e.target.value;
                                setTextColor(newColor);
                                setSurahHeaderTextColor(newColor);
                              }}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                          </label>
                        </div>

                        {/* 2. Istiadhah Color Picker Circle */}
                        <div className={`flex items-center justify-between p-2 rounded-xl border transition-all ${showIstiadhah ? tTheme.toggleActive : tTheme.toggleInactive}`}>
                          <span className="text-[11px] sm:text-xs font-bold truncate ml-1">الاستعاذة</span>
                          <label
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/30 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden transition-transform hover:scale-110 shrink-0 bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400"
                            title="اختر لون الاستعاذة"
                          >
                            <input
                              type="color"
                              value={istiadhahColor || textColor}
                              onChange={(e) => {
                                setIstiadhahColor(e.target.value);
                                if (!showIstiadhah) {
                                   setShowIstiadhah(true);
                                }
                              }}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                          </label>
                        </div>

                        {/* 3. Bismillah Color Picker Circle (البسملة) */}
                        <div className={`flex items-center justify-between p-2 rounded-xl border transition-all ${showOpeningHeader ? tTheme.toggleActive : tTheme.toggleInactive}`}>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] sm:text-xs font-bold truncate ml-1">البسملة</span>
                            <span className="text-[9px] opacity-70 font-normal">لون خط البسملة</span>
                          </div>
                          <label
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/30 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden transition-transform hover:scale-110 shrink-0 bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400"
                            title="اختر لون البسملة"
                          >
                            <input
                              type="color"
                              value={openingHeaderColor || textColor}
                              onChange={(e) => {
                                const newColor = e.target.value;
                                setOpeningHeaderColor(newColor);
                                if (!showOpeningHeader) {
                                  setShowOpeningHeader(true);
                                }
                              }}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                          </label>
                        </div>

                        {/* 4. Watermark "مصحف التبيان" Color Picker Circle */}
                        <div className={`flex items-center justify-between p-2 rounded-xl border transition-all ${showWatermark ? tTheme.toggleActive : tTheme.toggleInactive}`}>
                          <span className="text-[11px] sm:text-xs font-bold truncate ml-1">مصحف التبيان</span>
                          <label
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/30 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden transition-transform hover:scale-110 shrink-0 bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-400"
                            title="اختر لون عبارة مصحف التبيان"
                          >
                            <input
                              type="color"
                              value={logoColor || textColor}
                              onChange={(e) => {
                                setLogoColor(e.target.value);
                                if (!showWatermark) {
                                  setShowWatermark(true);
                                }
                              }}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Verse Metadata, Frames & Watermark Toggles */}
                    <div className={`space-y-1.5 pt-1.5 border-t ${tTheme.innerBox.split(" ")[1] || "border-slate-800"}`}>
                      <span className={`text-xs font-bold block ${tTheme.innerBoxHeader}`}>إظهار / إخفاء العناصر والإطارات:</span>
                      <div className="grid grid-cols-5 gap-1">
                        {/* 1. إطار الآية */}
                        <button
                          id="toggle-ayah-frame-btn"
                          onClick={() => {
                            const next = !showAyahFrame;
                            setShowAyahFrame(next);
                            if (next && selectedFrameStyle === "none") {
                              setSelectedFrameStyle("rectangle");
                            }
                          }}
                          className={`flex items-center justify-center gap-1 py-1 px-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap min-w-0 ${
                            showAyahFrame && selectedFrameStyle !== "none"
                              ? tTheme.toggleActive
                              : tTheme.toggleInactive
                          }`}
                          title="إظهار أو إخفاء إطار الآية"
                        >
                          <span className="truncate text-[10px]">إطار الآية</span>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${showAyahFrame && selectedFrameStyle !== "none" ? tTheme.toggleDotActive : tTheme.toggleDotInactive}`} />
                        </button>

                        {/* 2. البسملة (أيقونة مستقلة) */}
                        <button
                          id="toggle-bismillah-btn"
                          onClick={() => {
                            const isCurrentlyBismillah = showOpeningHeader && (openingHeaderMode === "bismillah" || openingHeaderMode === "auto");
                            if (isCurrentlyBismillah) {
                              setShowOpeningHeader(false);
                            } else {
                              setShowOpeningHeader(true);
                              setOpeningHeaderMode("bismillah");
                            }
                          }}
                          className={`flex items-center justify-center gap-1 py-1 px-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap min-w-0 ${
                            showOpeningHeader && (openingHeaderMode === "bismillah" || openingHeaderMode === "auto")
                              ? tTheme.toggleActive
                              : tTheme.toggleInactive
                          }`}
                          title="إظهار أو إخفاء البسملة الشريفة (بسم الله الرحمن الرحيم)"
                        >
                          <span className="truncate text-[10px]">البسملة</span>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            showOpeningHeader && (openingHeaderMode === "bismillah" || openingHeaderMode === "auto")
                              ? tTheme.toggleDotActive
                              : tTheme.toggleDotInactive
                          }`} />
                        </button>

                        {/* 3. الاستعاذة (أيقونة مستقلة) */}
                        <button
                          id="toggle-istiadhah-btn"
                          onClick={() => {
                            const isCurrentlyIstiadhah = showIstiadhah || (showOpeningHeader && openingHeaderMode === "istiadhah");
                            if (isCurrentlyIstiadhah) {
                              setShowIstiadhah(false);
                              if (openingHeaderMode === "istiadhah") {
                                setShowOpeningHeader(false);
                              }
                            } else {
                              setShowIstiadhah(true);
                              setShowOpeningHeader(true);
                              setOpeningHeaderMode("istiadhah");
                            }
                          }}
                          className={`flex items-center justify-center gap-1 py-1 px-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap min-w-0 ${
                            showIstiadhah || (showOpeningHeader && openingHeaderMode === "istiadhah")
                              ? tTheme.toggleActive
                              : tTheme.toggleInactive
                          }`}
                          title="إظهار أو إخفاء الاستعاذة (أعوذ بالله من الشيطان الرجيم)"
                        >
                          <span className="truncate text-[10px]">الاستعاذة</span>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            showIstiadhah || (showOpeningHeader && openingHeaderMode === "istiadhah")
                              ? tTheme.toggleDotActive
                              : tTheme.toggleDotInactive
                          }`} />
                        </button>

                        {/* 4. بيانات السورة */}
                        <button
                          id="toggle-surah-info-btn"
                          onClick={() => setShowSurahInfo(!showSurahInfo)}
                          className={`flex items-center justify-center gap-1 py-1 px-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap min-w-0 ${
                            showSurahInfo
                              ? tTheme.toggleActive
                              : tTheme.toggleInactive
                          }`}
                          title="إظهار أو إخفاء شارة وبيانات السورة"
                        >
                          <span className="truncate text-[10px]">بيانات السورة</span>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${showSurahInfo ? tTheme.toggleDotActive : tTheme.toggleDotInactive}`} />
                        </button>

                        {/* 5. مصحف التبيان */}
                        <button
                          id="toggle-watermark-btn"
                          onClick={() => setShowWatermark(!showWatermark)}
                          className={`flex items-center justify-center gap-1 py-1 px-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap min-w-0 ${
                            showWatermark
                              ? tTheme.toggleActive
                              : tTheme.toggleInactive
                          }`}
                          title="إظهار أو إخفاء شعار مصحف التبيان"
                        >
                          <span className="truncate text-[10px]">مصحف التبيان</span>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${showWatermark ? tTheme.toggleDotActive : tTheme.toggleDotInactive}`} />
                        </button>
                      </div>
                    </div>

                    {/* Direct Drag-and-drop Status & Controls (السحب المباشر) */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${tTheme.innerBox}`}>
                      <div className="flex items-center gap-2">
                        <Move size={14} className={tTheme.accentText} />
                        <div>
                          <span className={`text-xs font-bold block ${tTheme.innerBoxHeader}`}>
                            تحريك العناصر بالسحب المباشر:
                          </span>
                          <span className={`text-[10px] block ${tTheme.subText}`}>
                            اسحب أي عنصر (الآية، السورة، الشعار) لأعلى وأسفل أو يميناً ويساراً مباشرة على البطاقة
                          </span>
                        </div>
                      </div>

                      {(textOffsetX !== 0 || textOffsetY !== 0 || surahHeaderOffsetX !== 0 || surahHeaderOffsetY !== 0 || surahInfoOffsetX !== 0 || surahInfoOffsetY !== 0 || watermarkOffsetX !== 0 || watermarkOffsetY !== 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            setTextOffsetX(0);
                            setTextOffsetY(0);
                            setSurahHeaderOffsetX(0);
                            setSurahHeaderOffsetY(0);
                            setSurahInfoOffsetX(0);
                            setSurahInfoOffsetY(0);
                            setWatermarkOffsetX(0);
                            setWatermarkOffsetY(0);
                          }}
                          title="إعادة ضبط مواضع كافة العناصر إلى المنتصف"
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${tTheme.quickBtn}`}
                        >
                          <RotateCcw size={11} />
                          <span>توسيط الكل</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
                    id="share-ayah-save-default-footer-btn"
                    type="button"
                    onClick={handleSaveAsDefault}
                    title="تعيين هذا التنسيق الحالي كافتراضي لجميع مشاركات الآيات القادمة"
                    aria-label="تعيين هذا التنسيق الحالي كافتراضي لجميع مشاركات الآيات القادمة"
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer border active:scale-95 shrink-0 ${
                      isDefaultSaved ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : tTheme.secondaryBtn
                    }`}
                  >
                    {isDefaultSaved ? (
                      <Check size={16} className="sm:w-[18px] sm:h-[18px] shrink-0 text-emerald-400 stroke-[2.5px]" />
                    ) : (
                      <Bookmark size={15} className="sm:w-4 sm:h-4 shrink-0" />
                    )}
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
                  {/* Android / Mobile Instant Save & View Card button */}
                  <button
                    type="button"
                    onClick={handleOpenPreviewModal}
                    title="معاينة وحفظ بطاقة الآية"
                    aria-label="معاينة وحفظ بطاقة الآية"
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer border active:scale-95 shrink-0 ${tTheme.secondaryBtn}`}
                  >
                    <Eye size={16} className="sm:w-[18px] sm:h-[18px] shrink-0 text-amber-400" />
                  </button>

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
