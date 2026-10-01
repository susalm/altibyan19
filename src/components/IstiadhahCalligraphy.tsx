import React, { useEffect, useState } from "react";
import istiadhaImg from "../assets/images/istiadha_calligraphy_1787675484366.jpg";

interface IstiadhahCalligraphyProps {
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  height?: number | string;
}

let cachedAlphaCanvas: HTMLCanvasElement | null = null;
let baseImagePromise: Promise<HTMLCanvasElement> | null = null;

export function getBaseAlphaCanvas(): Promise<HTMLCanvasElement> {
  if (cachedAlphaCanvas) return Promise.resolve(cachedAlphaCanvas);
  if (baseImagePromise) return baseImagePromise;

  baseImagePromise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = istiadhaImg;
    const process = () => {
      const canvas = document.createElement("canvas");
      const w = img.naturalWidth || 1000;
      const h = img.naturalHeight || 300;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(canvas);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      let minX = w, minY = h, maxX = 0, maxY = 0;
      let hasVisiblePixels = false;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          let alpha = 255 - lum;
          if (lum > 230) {
            alpha = 0;
          } else if (lum < 40) {
            alpha = 255;
          } else {
            alpha = Math.round(((230 - lum) / 190) * 255);
          }

          data[idx + 3] = Math.max(0, Math.min(255, alpha));
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;

          if (alpha > 18) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            hasVisiblePixels = true;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Auto-crop to exact calligraphy bounds for pixel-perfect scale and centering
      if (hasVisiblePixels && maxX > minX && maxY > minY) {
        const padding = 4;
        const cropX = Math.max(0, minX - padding);
        const cropY = Math.max(0, minY - padding);
        const cropW = Math.min(w - cropX, maxX - minX + 1 + padding * 2);
        const cropH = Math.min(h - cropY, maxY - minY + 1 + padding * 2);

        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = cropW;
        croppedCanvas.height = cropH;
        const cropCtx = croppedCanvas.getContext("2d");
        if (cropCtx) {
          cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          cachedAlphaCanvas = croppedCanvas;
          resolve(croppedCanvas);
          return;
        }
      }

      cachedAlphaCanvas = canvas;
      resolve(canvas);
    };

    if (img.complete && img.naturalWidth > 0) {
      process();
    } else {
      img.onload = process;
      img.onerror = () => resolve(document.createElement("canvas"));
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
          className="font-bold text-xs sm:text-sm select-none"
          style={{ color, fontFamily: "'Amiri', 'Cairo', serif" }}
        >
          أعوذ بالله من الشيطان الرجيم
        </span>
      )}
    </div>
  );
};
