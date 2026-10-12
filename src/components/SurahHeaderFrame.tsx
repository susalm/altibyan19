import React, { useEffect, useState, useId } from "react";
import { ensureQbsmlLoaded, getSurahHeaderGlyph, isQbsmlLoaded } from "../utils/qcf4Utils";
import { surahsList } from "../data/surahList";
import { getAuthenticFrameSvgInner } from "../utils/mushafFrameSvgData";

export interface SurahHeaderFrameProps {
  surahName?: string;
  theme?: string;
  isDark?: boolean;
  surahNumber?: number;
  hideName?: boolean;
  customFrameColor?: string;
  customTextColor?: string;
  nameScale?: number;
  isFullScreenOrLandscape?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onOpenIndex?: (tab?: "surahs" | "quarters" | "go") => void;
}

export const SurahHeaderFrame: React.FC<SurahHeaderFrameProps> = ({
  surahName = "",
  theme = "default",
  isDark = false,
  surahNumber,
  hideName = false,
  customFrameColor,
  customTextColor,
  nameScale = 2,
  isFullScreenOrLandscape = false,
  className = "",
  style = {},
  onOpenIndex,
}) => {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [fontLoaded, setFontLoaded] = useState(() => isQbsmlLoaded());

  useEffect(() => {
    let isMounted = true;
    if (!fontLoaded) {
      ensureQbsmlLoaded().then(() => {
        if (isMounted) setFontLoaded(true);
      });
      if (typeof document !== "undefined" && "fonts" in document) {
        document.fonts.ready.then(() => {
          if (isMounted && isQbsmlLoaded()) {
            setFontLoaded(true);
          }
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [fontLoaded]);

  let resolvedSurahNumber = surahNumber;
  if (!resolvedSurahNumber && surahName) {
    // 1. Check if surahName is a single unicode glyph from QCF4_QBSML font (0xF100 - 0xF171)
    if (surahName.length === 1) {
      const code = surahName.charCodeAt(0);
      if (code >= 0xF100 && code <= 0xF171) {
        resolvedSurahNumber = code - 0xF100 + 1;
      }
    }
    // 2. Check if surahName matches by standard Arabic name or English name
    if (!resolvedSurahNumber) {
      const cleanName = surahName
        .replace(/[\u064B-\u065F\u0670]/g, "") // strip harakat
        .replace("سُورَةُ ", "")
        .replace("سورة ", "")
        .trim();
      const found = surahsList.find((s) => {
        const sClean = s.name.replace(/[\u064B-\u065F\u0670]/g, "").trim();
        return sClean === cleanName || s.name === cleanName || s.englishName.toLowerCase() === cleanName.toLowerCase();
      });
      if (found) {
        resolvedSurahNumber = found.number;
      }
    }
  }

  const surahInfo = resolvedSurahNumber ? surahsList.find((s) => s.number === resolvedSurahNumber) : null;
  const frameId = `surah_hdr_${resolvedSurahNumber || "c"}_${reactId}`;

  let formattedTitle = "";
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
    formattedTitle = resolvedSurahNumber ? `سُورَةُ ${resolvedSurahNumber}` : "";
  }

  // Theme-specific color parameters harmonized with Blue, Green, Gold, and Night Mode
  const getThemePalette = () => {
    const themeBg = isDark
      ? theme === "navy-velvet"
        ? "#060c18"
        : theme === "gold-velvet"
          ? "#141210"
          : "#011c14"
      : theme === "navy-velvet"
        ? "#FAFCFF"
        : theme === "gold-velvet"
          ? "#FFFEFA"
          : "#FAFDFB";

    const defaultTextColor = isDark
      ? "#FFFFFF"
      : "#000000";

    if (customFrameColor) {
      return {
        frameStroke: customFrameColor,
        innerStroke: customFrameColor,
        innerFill: "transparent",
        frameBg: themeBg,
        accentSolid: customFrameColor,
        accentDeep: customFrameColor,
        highlight: isDark ? "#ffffff" : "#ffffff",
        gradHigh: isDark ? "#e2e8f0" : "#ffffff",
        gradMid: customFrameColor,
        gradDeep: customFrameColor,
        textColor: customTextColor || defaultTextColor,
        glowFilter: "none",
      };
    }

    switch (theme) {
      case "navy-velvet":
        return {
          frameStroke: isDark ? "#60a5fa" : "#2563eb",
          innerStroke: isDark ? "#60a5fa" : "#2563eb",
          innerFill: "transparent",
          frameBg: themeBg,
          accentSolid: isDark ? "#3b82f6" : "#3b82f6",
          accentDeep: isDark ? "#1e3a8a" : "#1b3168",
          highlight: isDark ? "#bfdbfe" : "#ffffff",
          gradHigh: isDark ? "#bfdbfe" : "#dbeafe",
          gradMid: isDark ? "#60a5fa" : "#3b82f6",
          gradDeep: isDark ? "#1e3a8a" : "#1b3168",
          textColor: customTextColor || defaultTextColor,
          glowFilter: "none",
        };
      case "gold-velvet":
        return {
          frameStroke: isDark ? "#fcd34d" : "#c5a85c",
          innerStroke: isDark ? "#fcd34d" : "#c5a85c",
          innerFill: "transparent",
          frameBg: themeBg,
          accentSolid: isDark ? "#f59e0b" : "#c5a85c",
          accentDeep: isDark ? "#78350f" : "#715112",
          highlight: isDark ? "#fef08a" : "#ffffff",
          gradHigh: isDark ? "#fef08a" : "#fef9c3",
          gradMid: isDark ? "#fcd34d" : "#c5a85c",
          gradDeep: isDark ? "#92400e" : "#715112",
          textColor: customTextColor || defaultTextColor,
          glowFilter: "none",
        };
      case "emerald-velvet":
      default:
        return {
          frameStroke: isDark ? "#34d399" : "#059669",
          innerStroke: isDark ? "#34d399" : "#059669",
          innerFill: "transparent",
          frameBg: themeBg,
          accentSolid: isDark ? "#10b981" : "#10b981",
          accentDeep: isDark ? "#064e3b" : "#044f31",
          highlight: isDark ? "#a7f3d0" : "#ffffff",
          gradHigh: isDark ? "#a7f3d0" : "#d1fae5",
          gradMid: isDark ? "#34d399" : "#10b981",
          gradDeep: isDark ? "#064e3b" : "#044f31",
          textColor: customTextColor || defaultTextColor,
          glowFilter: "none",
        };
    }
  };

  const palette = getThemePalette();

  const cssVars = {
    color: palette.frameStroke,
    "--surah-frame-stroke": palette.frameStroke,
    "--surah-inner-stroke": palette.innerStroke,
    "--surah-inner-fill": palette.innerFill,
    "--surah-accent-solid": palette.accentSolid,
    "--surah-accent-deep": palette.accentDeep,
    "--surah-highlight": palette.highlight,
    "--surah-grad-high": palette.gradHigh,
    "--surah-grad-mid": palette.gradMid,
    "--surah-grad-deep": palette.gradDeep,
    ...style,
  } as React.CSSProperties;

  const { scopedDefs, scopedBody } = getAuthenticFrameSvgInner(frameId, palette);

  return (
    <div
      onClick={(e) => {
        if (onOpenIndex) {
          e.stopPropagation();
          onOpenIndex("surahs");
        }
      }}
      title="فتح فهرس السور"
      className={`surah_header_frame relative w-full max-w-none my-1 sm:my-2 px-0 animate-fade-in select-none ${
        onOpenIndex ? "cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all" : ""
      } ${className}`}
      style={{
        ...cssVars,
        containerType: "inline-size",
        aspectRatio: "240.20621 / 30.23196",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 240.20621 30.23196"
        overflow="visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="surah_header_frame_svg transition-all duration-300 block w-full"
        style={{ overflow: "visible" }}
      >
        <defs
          dangerouslySetInnerHTML={{
            __html: `
              ${scopedDefs}
              <style>
                .surah_frame_outer_border, [id*="path3763"], [id*="path4079"] {
                  fill: none !important;
                  fill-opacity: 0 !important;
                  stroke: ${palette.frameStroke || "#C5A85C"} !important;
                  stroke-width: 1.5px !important;
                  stroke-opacity: 1 !important;
                  stroke-linecap: round !important;
                  stroke-linejoin: round !important;
                }
                .surah_frame_cartouche_bg, [id*="path4395"], [class*="cartouche"], [id*="cartouche"] {
                  fill: ${palette.frameBg || "#FAFDFB"} !important;
                  fill-opacity: 1 !important;
                  stroke: none !important;
                }
                .surah_frame_inner_contour {
                  fill: none !important;
                  fill-opacity: 0 !important;
                  stroke: ${palette.frameStroke} !important;
                }
              </style>
            `,
          }}
        />
        <g className="surah_header_frame" dangerouslySetInnerHTML={{ __html: scopedBody }} />
        <rect x="0.8" y="0.8" width="238.6" height="28.63" rx="0.6" fill="none" stroke={palette.frameStroke || "#C5A85C"} strokeWidth="1.5" strokeOpacity="1" opacity="1" className="surah_frame_outer_border" />
      </svg>

      {/* Surah Name in Center Window of the Frame - Centered Horizontally & Vertically */}
      {!hideName && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        >
          <div
            className="flex items-center justify-center text-center select-none"
            style={{
              width: "56%",
              height: "85%",
              color: palette.textColor,
            }}
          >
            <span
              className="surah_header_text font-normal leading-none text-center select-none inline-flex items-center justify-center"
              style={{
                fontFamily: "QCF4_QBSML, 'Amiri', 'Traditional Arabic', serif",
                fontSize: "clamp(15px, 4.8cqi, 34px)",
                color: palette.textColor,
                transform: "translateY(-16%)",
                direction: "rtl",
                textAlign: "center",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "normal",
                textShadow: "none",
                boxShadow: "none",
                filter: "none",
                WebkitFilter: "none",
                WebkitTextStroke: "0px",
                stroke: "none",
                strokeWidth: 0,
              }}
            >
              {resolvedSurahNumber
                ? (fontLoaded || isQbsmlLoaded()
                    ? String.fromCharCode(0xF100 + (resolvedSurahNumber - 1))
                    : getSurahHeaderGlyph(resolvedSurahNumber, formattedTitle) || formattedTitle)
                : formattedTitle}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurahHeaderFrame;
