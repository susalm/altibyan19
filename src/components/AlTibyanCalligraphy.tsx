import React from "react";

interface AlTibyanCalligraphyProps {
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  height?: number | string;
}

/**
 * Open Quran Book Icon component matching the user's logo
 */
export const QuranBookEmblemIcon: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 28,
  color = "currentColor",
  className = "",
}) => {
  return (
    <svg
      viewBox="0 0 100 60"
      width={size * (100 / 60)}
      height={size}
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
    >
      {/* Upper Left Page */}
      <path d="M 48.5 21 C 40 13 25 10 10 11 L 23 36 C 37 33 46 39 48.5 47 Z" />
      {/* Upper Right Page */}
      <path d="M 51.5 21 C 60 13 75 10 90 11 L 77 36 C 63 33 54 39 51.5 47 Z" />
      {/* Left Outer Page Rim */}
      <path d="M 8 14 L 20 39 C 35 36 45 43 49 50 L 49 52 C 44 45 33 39 17 42 L 6 17 Z" />
      {/* Right Outer Page Rim */}
      <path d="M 92 14 L 80 39 C 65 36 55 43 51 50 L 51 52 C 56 45 67 39 83 42 L 94 17 Z" />
      {/* Bottom Chevron Book Spine Cover */}
      <path d="M 4 19 L 49 54 L 50 55.5 L 51 54 L 96 19 L 92 17 L 50 50.5 L 8 17 Z" />
    </svg>
  );
};

/**
 * Renders the logo with the Open Book Emblem on the RIGHT of "التبيان"
 * without any tashkeel (diacritics).
 */
export const AlTibyanCalligraphy: React.FC<AlTibyanCalligraphyProps> = ({
  color = "#D4AF37",
  className = "",
  style = {},
  height = 18,
}) => {
  const numericHeight = typeof height === "number" ? height : 18;

  return (
    <div
      dir="rtl"
      className={`inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        color,
        ...style,
      }}
    >
      {/* "مصحف التبيان" typography in Cairo font without icon */}
      <span
        className="font-bold tracking-wide select-none leading-none whitespace-nowrap"
        style={{
          color,
          fontFamily: "'Cairo', sans-serif",
          fontSize: `${Math.max(10, Math.round(numericHeight * 0.58))}px`,
        }}
      >
        مصحف التبيان
      </span>
    </div>
  );
};
