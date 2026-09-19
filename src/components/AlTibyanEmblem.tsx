import React from "react";

interface AlTibyanEmblemProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const AlTibyanEmblem: React.FC<AlTibyanEmblemProps> = ({
  size = 64,
  className = "",
  style = {},
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center relative select-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        ...style,
      }}
    >
      <img
        src="/IMG_1767.png"
        alt="شعار التبيان"
        className="w-full h-full object-contain select-none pointer-events-none drop-shadow-md transition-transform duration-200"
        style={{
          filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.45))",
        }}
      />
    </div>
  );
};
