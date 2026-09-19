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
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Islamic Quran Emblem SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id={`quran-gold-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c.secondary} />
            <stop offset="50%" stopColor={c.gold} />
            <stop offset="100%" stopColor={c.primary} />
          </linearGradient>
          <linearGradient id={`quran-page-${theme}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor={c.bookPages} />
          </linearGradient>
          <radialGradient id={`quran-glow-${theme}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={c.primary} stopOpacity="0.35" />
            <stop offset="100%" stopColor={c.primary} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Glow */}
        <circle cx="24" cy="24" r="22" fill={`url(#quran-glow-${theme})`} />

        {/* Islamic 8-Point Star (Rub el Hizb Medallion Frame) */}
        <g transform="rotate(0 24 24)">
          <rect
            x="7"
            y="7"
            width="34"
            height="34"
            rx="5"
            fill={c.bg}
            stroke={`url(#quran-gold-${theme})`}
            strokeWidth="1.6"
            className="transition-colors"
          />
        </g>
        <g transform="rotate(45 24 24)">
          <rect
            x="7"
            y="7"
            width="34"
            height="34"
            rx="5"
            fill={c.bg}
            fillOpacity="0.4"
            stroke={`url(#quran-gold-${theme})`}
            strokeWidth="1.6"
            className="transition-colors"
          />
        </g>

        {/* Inner Ornamental Ring */}
        <circle
          cx="24"
          cy="24"
          r="16"
          fill="none"
          stroke={c.secondary}
          strokeWidth="0.8"
          strokeDasharray="2 1.5"
          opacity="0.75"
        />

        {/* Open Holy Quran (المصحف الشريف) */}
        {/* Quran Wooden Stand (Rahlah - رحلة المصحف) */}
        <path
          d="M16 35 L24 29 L32 35 M20 32 L24 35 L28 32"
          stroke={c.secondary}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Left Quran Page with 3D Depth */}
        <path
          d="M24 28 C20 25.5 15 26 13 28.5 L13 18 C15 15.5 20 15 24 17.5 Z"
          fill={`url(#quran-page-${theme})`}
          stroke={c.secondary}
          strokeWidth="1"
        />
        {/* Left Page Script Lines */}
        <line x1="15.5" y1="18.5" x2="21.5" y2="17.2" stroke={c.primary} strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
        <line x1="15" y1="21.5" x2="22" y2="20.2" stroke={c.primary} strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
        <line x1="15.5" y1="24.5" x2="21.5" y2="23.2" stroke={c.primary} strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />

        {/* Right Quran Page with 3D Depth */}
        <path
          d="M24 28 C28 25.5 33 26 35 28.5 L35 18 C33 15.5 28 15 24 17.5 Z"
          fill={`url(#quran-page-${theme})`}
          stroke={c.secondary}
          strokeWidth="1"
        />
        {/* Right Page Script Lines */}
        <line x1="26.5" y1="17.2" x2="32.5" y2="18.5" stroke={c.primary} strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
        <line x1="26" y1="20.2" x2="33" y2="21.5" stroke={c.primary} strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
        <line x1="26.5" y1="23.2" x2="32.5" y2="24.5" stroke={c.primary} strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />

        {/* Quran Center Spine & Golden Bookmark Ribbon */}
        <path
          d="M24 17 L24 28.5"
          stroke={c.secondary}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M24 28.5 Q23 31.5 24 33"
          stroke={c.primary}
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Celestial Noor Rays (أشعة النور الإلهي) */}
        <path d="M24 10 L24 13" stroke={c.secondary} strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
        <path d="M19 12 L20.8 14.2" stroke={c.secondary} strokeWidth="1" strokeLinecap="round" opacity="0.75" />
        <path d="M29 12 L27.2 14.2" stroke={c.secondary} strokeWidth="1" strokeLinecap="round" opacity="0.75" />
        
        {/* Star Noor Sparkle on Top */}
        <circle cx="24" cy="9.5" r="1" fill={c.primary} />
      </svg>

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
