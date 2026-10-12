import React from "react";

interface AppLogoProps {
  size?: number;
  theme?: "light" | "dark" | "gold-velvet" | "navy-velvet" | "emerald-velvet";
  isDark?: boolean;
  className?: string;
  showText?: boolean;
  textColor?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 28,
  theme = "gold-velvet",
  isDark = false,
  className = "",
  showText = false,
  textColor,
}) => {
  // Theme color palettes for the Islamic Quran Logo
  const getColors = () => {
    if (theme === "emerald-velvet") {
      return {
        primary: "#34d399",
        secondary: "#c5a85c",
        accent: "#10b981",
        bg: "#011a12",
        bookCover: "#064e3b",
        bookPages: "#FAF8F5",
        gold: "#c5a85c",
      };
    }
    if (theme === "navy-velvet") {
      return {
        primary: "#60a5fa",
        secondary: "#c5a85c",
        accent: "#3F63C6",
        bg: "#1b3168",
        bookCover: "#1e3a8a",
        bookPages: "#F8FAFC",
        gold: "#c5a85c",
      };
    }
    if (theme === "gold-velvet") {
      return {
        primary: isDark ? "#fbbf24" : "#c5a85c",
        secondary: isDark ? "#c5a85c" : "#967228",
        accent: "#d97706",
        bg: isDark ? "#1c1917" : "#011c14",
        bookCover: "#78350f",
        bookPages: "#FFFDF5",
        gold: "#c5a85c",
      };
    }
    if (isDark) {
      return {
        primary: "#34d399",
        secondary: "#fbbf24",
        accent: "#10b981",
        bg: "#061e16",
        bookCover: "#064e3b",
        bookPages: "#f8fafc",
        gold: "#fbbf24",
      };
    }
    return {
      primary: "#10b981",
      secondary: "#c5a85c",
      accent: "#047857",
      bg: "#064e3b",
      bookCover: "#047857",
      bookPages: "#ffffff",
      gold: "#c5a85c",
    };
  };

  const c = getColors();

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`} dir="rtl">
      {/* Approved Islamic Quran Emblem IMG_1767 */}
      <img
        src="/app-logo-256.png"
        srcSet="/app-logo-256.png 1x, /app-logo-512.png 2x"
        alt="شعار مصحف التبيان"
        style={{ width: `${size}px`, height: `${size}px`, imageRendering: "auto" }}
        className="shrink-0 object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105 pointer-events-none"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "/IMG_1767.png";
        }}
      />

      {/* App Name with Cairo Font */}
      {showText && (
        <span
          className={`font-['Cairo'] font-bold text-base tracking-wide ${textColor || ""}`}
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          مصحف التِّبيان
        </span>
      )}
    </div>
  );
};
