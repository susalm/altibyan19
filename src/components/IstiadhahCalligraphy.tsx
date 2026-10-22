import React, { useEffect, useState } from "react";

interface IstiadhahCalligraphyProps {
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  height?: number | string;
}

let cachedAlphaCanvas: HTMLCanvasElement | null = null;
let baseImagePromise: Promise<HTMLCanvasElement> | null = null;

/**
 * Creates or retrieves a cached high-resolution alpha canvas containing
 * the classical Arabic calligraphy for "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ" (الاستعاذة).
 * Alpha is 255 on glyphs, 0 on background.
 */
export function getBaseAlphaCanvas(): Promise<HTMLCanvasElement> {
  if (cachedAlphaCanvas) return Promise.resolve(cachedAlphaCanvas);
  if (baseImagePromise) return baseImagePromise;

  baseImagePromise = new Promise((resolve) => {
    try {
      const w = 1200;
      const h = 260;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(canvas);
        return;
      }

      // Check document fonts readiness
      const text = "أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيْطَٰنِ ٱلرَّجِيمِ";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Authentic Medina Uthman Taha (QCF) script font
      ctx.font = "bold 88px 'UthmanTaha', 'UthmanicHafs', 'QCF4_QBSML', 'Amiri', serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(text, w / 2, h / 2 + 10);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      let minX = w,
        minY = h,
        maxX = 0,
        maxY = 0;
      let hasVisible = false;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const a = data[idx + 3];
          if (a > 15) {
            hasVisible = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (hasVisible && maxX > minX && maxY > minY) {
        const padding = 12;
        const cropX = Math.max(0, minX - padding);
        const cropY = Math.max(0, minY - padding);
        const cropW = Math.min(w - cropX, maxX - minX + 1 + padding * 2);
        const cropH = Math.min(h - cropY, maxY - minY + 1 + padding * 2);

        const cropped = document.createElement("canvas");
        cropped.width = cropW;
        cropped.height = cropH;
        const cCtx = cropped.getContext("2d");
        if (cCtx) {
          cCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          cachedAlphaCanvas = cropped;
          resolve(cropped);
          return;
        }
      }

      cachedAlphaCanvas = canvas;
      resolve(canvas);
    } catch {
      const fallback = document.createElement("canvas");
      fallback.width = 600;
      fallback.height = 120;
      resolve(fallback);
    }
  });

  return baseImagePromise;
}

/**
 * Renders the classical Arabic calligraphy of "أعوذ بالله من الشيطان الرجيم" (الاستعاذة)
 * with a 100% transparent background and dynamic customizable color tint.
 */
export const IstiadhahCalligraphy: React.FC<IstiadhahCalligraphyProps> = ({
  color = "#FFFFFF",
  className = "",
  style = {},
  height = 32,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    getBaseAlphaCanvas().then((baseCanvas) => {
      if (!isCurrent || !baseCanvas.width) return;

      const tintCanvas = document.createElement("canvas");
      tintCanvas.width = baseCanvas.width;
      tintCanvas.height = baseCanvas.height;
      const ctx = tintCanvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(baseCanvas, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, tintCanvas.width, tintCanvas.height);

      if (isCurrent) {
        setDataUrl(tintCanvas.toDataURL("image/png"));
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [color]);

  return (
    <div
      className={`inline-flex items-center justify-center relative select-none ${className}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="أعوذ بالله من الشيطان الرجيم"
          className="h-full w-auto max-w-full object-contain select-none pointer-events-none transition-all duration-150"
        />
      ) : (
        <span
          className="font-bold text-xs sm:text-sm select-none tracking-wide"
          style={{ color, fontFamily: "'UthmanTaha', 'UthmanicHafs', 'QCF4_QBSML', 'Amiri', serif" }}
        >
          أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيْطَٰنِ ٱلرَّجِيمِ
        </span>
      )}
    </div>
  );
};

export default IstiadhahCalligraphy;
