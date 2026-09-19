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

  // Theme-specific color parameters for day and night modes
  const getThemePalette = () => {
    if (customFrameColor) {
      return {
        frameStroke: customFrameColor,
        innerStroke: customFrameColor,
        innerFill: "rgba(0, 0, 0, 0.04)",
        accentSolid: customFrameColor,
        accentDeep: customFrameColor,
        highlight: "#ffffff",
        gradHigh: "#ffffff",
        gradMid: customFrameColor,
        gradDeep: customFrameColor,
        textColor: customTextColor || customFrameColor,
        glowFilter: "none",
      };
    }

    switch (theme) {
      case "emerald-velvet":
        if (isDark) {
          return {
            frameStroke: "#34d399",
            innerStroke: "#34d399",
            innerFill: "rgba(52, 211, 153, 0.1)",
            accentSolid: "#34d399",
            accentDeep: "#059669",
            highlight: "#a7f3d0",
            gradHigh: "#a7f3d0",
            gradMid: "#34d399",
            gradDeep: "#064e3b",
            textColor: customTextColor || "#a7f3d0",
            glowFilter: "none",
          };
        } else {
          return {
            frameStroke: "#044f31",
            innerStroke: "#044f31",
            innerFill: "rgba(4, 79, 49, 0.05)",
            accentSolid: "#10b981",
            accentDeep: "#044f31",
            highlight: "#ffffff",
            gradHigh: "#d1fae5",
            gradMid: "#10b981",
            gradDeep: "#044f31",
            textColor: customTextColor || "#000000",
            glowFilter: "none",
          };
        }
      case "gold-velvet":
        if (isDark) {
          return {
            frameStroke: "#fcd34d",
            innerStroke: "#fcd34d",
            innerFill: "rgba(252, 211, 77, 0.1)",
            accentSolid: "#fcd34d",
            accentDeep: "#f59e0b",
            highlight: "#fef08a",
            gradHigh: "#fef08a",
            gradMid: "#fcd34d",
            gradDeep: "#92400e",
            textColor: customTextColor || "#fef08a",
            glowFilter: "none",
          };
        } else {
          return {
            frameStroke: "#967228",
            innerStroke: "#967228",
            innerFill: "rgba(150, 114, 40, 0.05)",
            accentSolid: "#c5a85c",
            accentDeep: "#715112",
            highlight: "#ffffff",
            gradHigh: "#fef9c3",
            gradMid: "#c5a85c",
            gradDeep: "#715112",
            textColor: customTextColor || "#000000",
            glowFilter: "none",
          };
        }
      case "navy-velvet":
        if (isDark) {
          return {
            frameStroke: "#60a5fa",
            innerStroke: "#60a5fa",
            innerFill: "rgba(96, 165, 250, 0.1)",
            accentSolid: "#60a5fa",
            accentDeep: "#2563eb",
            highlight: "#bfdbfe",
            gradHigh: "#bfdbfe",
            gradMid: "#60a5fa",
            gradDeep: "#1e3a8a",
            textColor: customTextColor || "#bfdbfe",
            glowFilter: "none",
          };
        } else {
          return {
            frameStroke: "#1b3168",
            innerStroke: "#1b3168",
            innerFill: "rgba(27, 49, 104, 0.05)",
            accentSolid: "#3b82f6",
            accentDeep: "#1b3168",
            highlight: "#ffffff",
            gradHigh: "#dbeafe",
            gradMid: "#3b82f6",
            gradDeep: "#1b3168",
            textColor: customTextColor || "#1b3168",
            glowFilter: "none",
          };
        }
      default:
        if (isDark) {
          return {
            frameStroke: "#34d399",
            innerStroke: "#34d399",
            innerFill: "rgba(52, 211, 153, 0.1)",
            accentSolid: "#34d399",
            accentDeep: "#059669",
            highlight: "#a7f3d0",
            gradHigh: "#a7f3d0",
            gradMid: "#34d399",
            gradDeep: "#064e3b",
            textColor: customTextColor || "#a7f3d0",
            glowFilter: "none",
          };
        } else {
          return {
            frameStroke: "#044f31",
            innerStroke: "#044f31",
            innerFill: "rgba(4, 79, 49, 0.04)",
            accentSolid: "#10b981",
            accentDeep: "#044f31",
            highlight: "#ffffff",
            gradHigh: "#e6f4ea",
            gradMid: "#10b981",
            gradDeep: "#044f31",
            textColor: customTextColor || "#000000",
            glowFilter: "none",
          };
        }
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

  const { scopedDefs, scopedBody } = getAuthenticFrameSvgInner(frameId);

  return (
    <div
      onClick={(e) => {
        if (onOpenIndex) {
          e.stopPropagation();
          onOpenIndex("surahs");
        }
      }}
      title="فتح فهرس السور"
      className={`surah_header_frame w-full max-w-none my-2.5 sm:my-3.5 px-0 animate-fade-in select-none ${
        onOpenIndex ? "cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all" : ""
      } ${className}`}
      style={cssVars}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 240.20621 30.23196"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="surah_header_frame_svg transition-all duration-300"
      >
        <defs>
          <style
            dangerouslySetInnerHTML={{
              __html: `
                .surah_frame_outer_border {
                  fill: none !important;
                  stroke: currentColor !important;
                }
                .surah_frame_cartouche_bg {
                  fill: none !important;
                  stroke: none !important;
                }
                .surah_frame_inner_contour {
                  fill: var(--surah-inner-fill, rgba(0,0,0,0.04)) !important;
                  stroke: currentColor !important;
                }
              `,
            }}
          />
          <g dangerouslySetInnerHTML={{ __html: scopedDefs }} />
        </defs>
        <g className="surah_header_frame" dangerouslySetInnerHTML={{ __html: scopedBody }} />

        {/* Dynamic Surah Name Calligraphy in Center Cartouche */}
        {!hideName && (
          <text
            x="120.1031"
            y="14.85"
            textAnchor="middle"
            dominantBaseline="central"
            alignmentBaseline="central"
            fill={palette.textColor}
            style={{
              fontFamily: "QCF4_QBSML, 'Amiri', 'Traditional Arabic', serif",
              fontWeight: "normal",
              fontSize: "13.5px",
            }}
            className="surah_header_text tracking-normal select-none"
          >
            {resolvedSurahNumber
              ? (fontLoaded || isQbsmlLoaded()
                  ? String.fromCharCode(0xF100 + (resolvedSurahNumber - 1))
                  : getSurahHeaderGlyph(resolvedSurahNumber, formattedTitle) || formattedTitle)
              : formattedTitle}
          </text>
        )}
      </svg>
    </div>
  );
};

export default SurahHeaderFrame;
