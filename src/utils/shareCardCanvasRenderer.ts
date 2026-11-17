import { getAuthenticFrameSvgInner } from "./mushafFrameSvgData";
import { surahsList } from "../data/surahList";
import { SURAH_HEADER_POSITIONS } from "./surahHeaderMap";
import {
  Qcf4Word,
  Qcf4Line,
  isQcf4FontLoaded,
  isQbsmlLoaded,
  isQcfHafs01Loaded,
  loadQcf4Font,
  ensureQbsmlLoaded,
  QCF4_QBSML_ISTIADHAH_GLYPHS,
} from "./qcf4Utils";

export type ShareCardAspectRatio =
  | "auto"
  | "3:4"
  | "4:3"
  | "16:9"
  | "9:16"
  | "1:1"
  | "4:5"
  | "custom";

export type ShareCardFontId =
  | "mushaf"
  | "uthmani"
  | "amiri"
  | "cairo"
  | "naskh"
  | "scheherazade";

export type ShareCardBgType = "gradient" | "solid" | "transparent";
export type ShareCardFrameStyle = "authentic" | "classic" | "minimal" | "none";
export type ShareCardAlign = "justify" | "center" | "right";
export type ShareCardScope = "single" | "range" | "page";

export interface ShareCardVerseItem {
  surahNumber: number;
  surahName: string;
  numberInSurah: number;
  text: string;
  page?: number;
  qcfWords?: Qcf4Word[];
}

export interface ShareCardRenderConfig {
  scope: ShareCardScope;
  surahNumber: number;
  surahName: string;
  pageNumber: number;
  ayahFrom: number;
  ayahTo: number;
  verses: ShareCardVerseItem[];
  qcfPageLines?: Qcf4Line[];
  qcfPageFont?: string;
  qcfReady?: boolean;

  aspectRatio: ShareCardAspectRatio;
  customWidth: number;
  customHeight: number;

  fontId: ShareCardFontId;
  fontSizeScale: number; // 0.7 to 1.4
  lineHeightScale: number; // 1.4 to 2.4
  textAlign: ShareCardAlign;

  bgType: ShareCardBgType;
  bgGradientType: "linear" | "radial";
  bgAngle: number;
  bgColor1: string;
  bgColor2: string;
  solidColor: string;
  borderRadius: number;

  textColor: string;
  ayahNumberColor: string;
  frameColor: string;
  frameBgColor: string;
  ornamentOpacity: number; // 0 to 1
  textPlateOpacity: number; // 0 to 0.9

  frameStyle: ShareCardFrameStyle;
  showSurahHeader: boolean;
  showIstiadhah?: boolean;
  showBismillah: boolean;
  showAyahNumbers: boolean;
  showFooter: boolean;
  showMetadataInFooter: boolean;
}

export interface ShareCardRenderResult {
  width: number;
  height: number;
  usedQcf4: boolean;
  usedQbsmlHeader: boolean;
  appliedFontScale: number;
}

export const toArabicDigits = (num: number | string): string =>
  String(num).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

export const stripLeadingBismillah = (text: string, surahNumber: number, ayahNum: number): string => {
  if (!text) return "";
  // Surah Al-Fatihah (1) Ayah 1 IS Bismillah
  if (surahNumber === 1 && ayahNum === 1) return text.trim();
  // Surah At-Tawbah (9) has no Bismillah
  if (surahNumber === 9) return text.trim();
  if (ayahNum !== 1) return text.trim();

  // Remove standard Alquran Cloud Bismillah prefix from Ayah 1 when header Bismillah is displayed separately
  const normalized = text.trim();
  const patterns = [
    /^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*/,
    /^بِسْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ\s*/,
    /^بسم\s+الله\s+الرحمن\s+الرحيم\s*/,
  ];
  for (const p of patterns) {
    if (p.test(normalized)) {
      const stripped = normalized.replace(p, "").trim();
      if (stripped.length > 0) return stripped;
    }
  }
  return normalized;
};

// Cached loaded bitmap images (SVG frame & app logo)
const imagePromiseCache = new Map<string, Promise<HTMLImageElement | null>>();
const glyphVerifyCache = new Map<string, boolean>();

function loadImageCached(key: string, src: string): Promise<HTMLImageElement | null> {
  if (imagePromiseCache.has(key)) {
    return imagePromiseCache.get(key)!;
  }
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      imagePromiseCache.delete(key);
      resolve(null);
    };
    img.src = src;
  });
  imagePromiseCache.set(key, p);
  return p;
}

/**
 * Verifies that a font + PUA glyph actually renders in HTML5 Canvas
 * AND does NOT render as an empty box or matching the .notdef tofu signature!
 */
export function verifyCanvasGlyph(fontFamily: string, sampleChar: string): boolean {
  const cacheKey = `${fontFamily}::${sampleChar}`;
  if (glyphVerifyCache.has(cacheKey)) {
    return glyphVerifyCache.get(cacheKey)!;
  }
  if (typeof document === "undefined") return false;

  try {
    if (!isQcf4FontLoaded(fontFamily)) {
      return false;
    }

    const size = 28;
    const scratch = document.createElement("canvas");
    scratch.width = size;
    scratch.height = size;
    const ctx = scratch.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;

    const getSignature = (ch: string): { ink: number; hash: string } => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `20px "${fontFamily}"`;
      ctx.fillText(ch, size / 2, size / 2);
      const data = ctx.getImageData(0, 0, size, size).data;
      let ink = 0;
      let hashParts = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 20) {
          ink++;
          hashParts = (hashParts * 31 + i) & 0x7fffffff;
        }
      }
      return { ink, hash: `${ink}:${hashParts}` };
    };

    const targetSig = getSignature(sampleChar);
    if (targetSig.ink < 4) {
      return false;
    }

    // Compare against unmapped PUA codepoint (\uFFFD / \uEFFE) which triggers .notdef tofu box
    const notdefSig = getSignature("\uEFFE");
    if (notdefSig.ink > 0 && targetSig.hash === notdefSig.hash) {
      return false;
    }

    glyphVerifyCache.set(cacheKey, true);
    return true;
  } catch {
    return false;
  }
}

export async function ensureStudioFontsReady(
  fontId: ShareCardFontId,
  qcfFontsNeeded: string[] = []
): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;

  const baseLoads: Promise<unknown>[] = [
    document.fonts.load('400 28px "Cairo"').catch(() => null),
    document.fonts.load('700 28px "Cairo"').catch(() => null),
    document.fonts.load('400 32px "Amiri"').catch(() => null),
    document.fonts.load('400 32px "UthmanTaha"').catch(() => null),
    document.fonts.load('400 32px "UthmanicHafs"').catch(() => null),
  ];

  if (fontId === "naskh") {
    baseLoads.push(document.fonts.load('400 32px "Noto Naskh Arabic"').catch(() => null));
  } else if (fontId === "scheherazade") {
    baseLoads.push(document.fonts.load('400 32px "Scheherazade New"').catch(() => null));
  }

  baseLoads.push(ensureQbsmlLoaded().catch(() => null));
  baseLoads.push(loadQcf4Font("QCF4_Hafs_01").catch(() => null));

  for (const qf of qcfFontsNeeded) {
    if (qf) {
      baseLoads.push(loadQcf4Font(qf).catch(() => null));
    }
  }

  await Promise.all(baseLoads);
  try {
    await document.fonts.ready;
  } catch {
    // ignore
  }
}

function getFontFamilyCss(fontId: ShareCardFontId): string {
  switch (fontId) {
    case "uthmani":
      return `"UthmanicHafs", "UthmanTaha", "Amiri", serif`;
    case "amiri":
      return `"Amiri", "Amiri Naskh", "Traditional Arabic", serif`;
    case "cairo":
      return `"Cairo", system-ui, sans-serif`;
    case "naskh":
      return `"Noto Naskh Arabic", "Amiri", serif`;
    case "scheherazade":
      return `"Scheherazade New", "Amiri", serif`;
    case "mushaf":
    default:
      return `"UthmanicHafs", "UthmanTaha", "Amiri", serif`;
  }
}

export function resolveCanvasDimensions(
  aspectRatio: ShareCardAspectRatio,
  customWidth: number,
  customHeight: number,
  computedAutoHeight?: number
): { width: number; height: number } {
  switch (aspectRatio) {
    case "1:1":
      return { width: 1080, height: 1080 };
    case "3:4":
      return { width: 1080, height: 1440 };
    case "4:3":
      return { width: 1440, height: 1080 };
    case "16:9":
      return { width: 1600, height: 900 };
    case "9:16":
      return { width: 1080, height: 1920 };
    case "4:5":
      return { width: 1080, height: 1350 };
    case "custom": {
      const safeW = Math.max(320, Math.min(3000, Math.round(customWidth || 1080)));
      const safeH = Math.max(320, Math.min(3000, Math.round(customHeight || 1350)));
      const ratio = safeW / safeH;
      // Scale cleanly so longest/base edge is high-DPI crisp (around 1200-1600px)
      if (ratio >= 1) {
        const w = Math.max(1080, Math.min(1800, safeW));
        const h = Math.max(480, Math.round(w / ratio));
        return { width: w, height: h };
      } else {
        const w = Math.max(960, Math.min(1440, safeW));
        const h = Math.max(600, Math.round(w / ratio));
        return { width: w, height: h };
      }
    }
    case "auto":
    default: {
      const w = 1080;
      const h = Math.max(680, Math.min(2600, Math.round(computedAutoHeight || 1120)));
      return { width: w, height: h };
    }
  }
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function getFrameBannerBitmap(frameColor: string, frameBgColor: string): Promise<HTMLImageElement | null> {
  const palette = {
    frameStroke: frameColor,
    innerStroke: frameColor,
    frameBg: frameBgColor,
    accentSolid: frameColor,
    gradMid: frameColor,
    textColor: "#000000",
  };
  const { scopedDefs, scopedBody } = getAuthenticFrameSvgInner("canvas_share", palette);
  // Build PURE VECTOR SVG (zero <text> tags — title is stamped directly by Canvas with verified fonts!)
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240.20621 30.23196" width="960" height="121" fill="none">
    <defs>
      ${scopedDefs}
      <style>
        .surah_frame_outer_border, [id*="path3763"], [id*="path4079"] { fill: none !important; stroke: ${frameColor} !important; stroke-width: 1.5px !important; }
        .surah_frame_cartouche_bg, [id*="path4395"], [class*="cartouche"], [id*="cartouche"] { fill: ${frameBgColor} !important; fill-opacity: 0.96 !important; stroke: none !important; }
        .surah_frame_inner_contour { fill: none !important; stroke: ${frameColor} !important; }
      </style>
    </defs>
    ${scopedBody}
    <rect class="surah_frame_outer_border" x="0.8" y="0.8" width="238.6" height="28.63" rx="0.8" fill="none" stroke="${frameColor}" stroke-width="1.5" />
  </svg>`;

  const key = `frame:${frameColor}:${frameBgColor}`;
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  return loadImageCached(key, dataUrl);
}

async function getAppLogoBitmap(): Promise<HTMLImageElement | null> {
  const primary = await loadImageCached("logo:256", "/app-logo-256.png");
  if (primary) return primary;
  return loadImageCached("logo:fallback", "/IMG_1767.png");
}

function cleanSurahTitle(name: string | undefined, surahNumber: number): string {
  const fromList = surahsList.find((s) => s.number === surahNumber)?.name;
  const raw = fromList || name || `سورة ${surahNumber}`;
  return raw
    .replace(/^سُورَةُ\s+/, "")
    .replace(/^سورة\s+/, "")
    .trim();
}

function resolveQcfHeaderSurahNumber(
  line: Qcf4Line,
  allLines: Qcf4Line[],
  lineIdx: number,
  pageNumber: number,
  headerIdx: number,
  fallbackSurahNum: number
): number {
  for (const w of line.words) {
    if (w.type === "surah_header" && w.char && w.char.length === 1) {
      const code = w.char.charCodeAt(0);
      if (code >= 0xf100 && code <= 0xf171) {
        return code - 0xf100 + 1;
      }
    }
  }

  for (let li = lineIdx + 1; li < allLines.length; li++) {
    for (const lw of allLines[li].words) {
      if (lw.verse_key) {
        const [vsNum] = lw.verse_key.split(":").map(Number);
        if (vsNum >= 1 && vsNum <= 114) {
          return vsNum;
        }
      }
    }
  }

  const posInfo = SURAH_HEADER_POSITIONS[pageNumber]?.[headerIdx];
  if (posInfo?.surah) {
    return posInfo.surah;
  }

  return fallbackSurahNum;
}

function findNextQcfSurahNumber(allLines: Qcf4Line[], startIdx: number, fallbackSurahNum: number): number {
  for (let li = startIdx + 1; li < allLines.length; li++) {
    for (const lw of allLines[li].words) {
      if (lw.verse_key) {
        const [vsNum] = lw.verse_key.split(":").map(Number);
        if (vsNum >= 1 && vsNum <= 114) {
          return vsNum;
        }
      }
    }
  }
  return fallbackSurahNum;
}

interface TextToken {
  text: string;
  font?: string;
  isAyahMarker?: boolean;
  isWordEndSpace?: boolean;
}

interface WrappedLine {
  tokens: TextToken[];
  isParagraphEnd: boolean;
  lineWidth: number;
}

interface RawCardSection {
  surahNumber: number;
  surahName: string;
  drawHeader: boolean;
  drawBismillah: boolean;
  qcfLines?: Qcf4Word[][];
  qcfWords?: Qcf4Word[];
  standardTokens?: TextToken[];
}

interface ComputedSectionLayout {
  raw: RawCardSection;
  lines: WrappedLine[];
  maxLineWidth: number;
  headerH: number;
  headerGap: number;
  istiadhahH: number;
  istiadhahGap: number;
  bismillahH: number;
  bismillahGap: number;
  platePadY: number;
  blockH: number;
  sectionGapAfter: number;
  totalSectionH: number;
}

function tokenizeStandardVerses(
  verses: ShareCardVerseItem[],
  showAyahNumbers: boolean,
  stripBismillahFirst: boolean
): TextToken[] {
  const tokens: TextToken[] = [];
  verses.forEach((v, idx) => {
    const cleanText = stripBismillahFirst && idx === 0
      ? stripLeadingBismillah(v.text, v.surahNumber, v.numberInSurah)
      : v.text.trim();
    const words = cleanText.split(/\s+/).filter(Boolean);
    words.forEach((w) => {
      tokens.push({ text: w });
    });
    if (showAyahNumbers) {
      tokens.push({
        text: `﴿${toArabicDigits(v.numberInSurah)}﴾`,
        isAyahMarker: true,
      });
    }
  });
  return tokens;
}

function measureQcfLineWidths(
  ctx: CanvasRenderingContext2D,
  tokens: TextToken[],
  fontSize: number,
  fallbackFontCss: string
): number[] {
  return tokens.map((t) => {
    const f = t.font ? `"${t.font}", ${fallbackFontCss}` : fallbackFontCss;
    ctx.font = `400 ${fontSize}px ${f}`;
    return ctx.measureText(t.text).width;
  });
}

function layoutStandardLines(
  ctx: CanvasRenderingContext2D,
  tokens: TextToken[],
  maxWidth: number,
  fontSize: number,
  fontCss: string
): WrappedLine[] {
  if (tokens.length === 0) return [];
  ctx.font = `400 ${fontSize}px ${fontCss}`;
  const spaceWidth = ctx.measureText(" ").width;

  const lines: WrappedLine[] = [];
  let current: TextToken[] = [];
  let currentWidth = 0;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    ctx.font = tok.isAyahMarker
      ? `600 ${Math.round(fontSize * 0.88)}px ${fontCss}`
      : `400 ${fontSize}px ${fontCss}`;
    const w = ctx.measureText(tok.text).width;

    const needed = current.length === 0 ? w : currentWidth + spaceWidth + w;

    if (current.length > 0 && needed > maxWidth) {
      if (tok.isAyahMarker && current.length > 1) {
        const pulled = current.pop()!;
        const recomputedW = current.reduce((acc, item, idx) => {
          ctx.font = item.isAyahMarker
            ? `600 ${Math.round(fontSize * 0.88)}px ${fontCss}`
            : `400 ${fontSize}px ${fontCss}`;
          return acc + ctx.measureText(item.text).width + (idx > 0 ? spaceWidth : 0);
        }, 0);
        lines.push({ tokens: current, isParagraphEnd: false, lineWidth: recomputedW });
        ctx.font = `400 ${fontSize}px ${fontCss}`;
        const pulledW = ctx.measureText(pulled.text).width;
        current = [pulled, tok];
        currentWidth = pulledW + spaceWidth + w;
      } else {
        lines.push({ tokens: current, isParagraphEnd: false, lineWidth: currentWidth });
        current = [tok];
        currentWidth = w;
      }
    } else {
      current.push(tok);
      currentWidth = needed;
    }
  }

  if (current.length > 0) {
    lines.push({ tokens: current, isParagraphEnd: true, lineWidth: currentWidth });
  }
  return lines;
}

function layoutQcf4Lines(
  ctx: CanvasRenderingContext2D,
  qcfWords: Qcf4Word[],
  maxWidth: number,
  fontSize: number,
  fallbackFontCss: string,
  showAyahNumbers: boolean,
  preformattedMushafWordLines?: Qcf4Word[][]
): WrappedLine[] {
  if (preformattedMushafWordLines && preformattedMushafWordLines.length > 0) {
    const result: WrappedLine[] = [];
    const gap = Math.max(2, fontSize * 0.06);
    for (const rawWords of preformattedMushafWordLines) {
      const lineWords = rawWords.filter(
        (w) => w.type !== "surah_header" && w.type !== "bismillah" && (showAyahNumbers || w.type !== "end")
      );
      if (lineWords.length === 0) continue;
      const tokens: TextToken[] = lineWords.map((w) => ({
        text: w.char,
        font: w.font,
        isAyahMarker: w.type === "end",
      }));
      const widths = measureQcfLineWidths(ctx, tokens, fontSize, fallbackFontCss);
      const lineWidth = widths.reduce((a, b) => a + b, 0) + Math.max(0, tokens.length - 1) * gap;
      result.push({
        tokens,
        isParagraphEnd: false,
        lineWidth,
      });
    }
    if (result.length > 0) {
      result[result.length - 1].isParagraphEnd = true;
    }
    return result;
  }

  const tokens: TextToken[] = qcfWords
    .filter((w) => w.type !== "surah_header" && w.type !== "bismillah" && (showAyahNumbers || w.type !== "end"))
    .map((w) => ({
      text: w.char,
      font: w.font,
      isAyahMarker: w.type === "end",
    }));

  if (tokens.length === 0) return [];
  const gap = Math.max(2, fontSize * 0.06);
  const widths = measureQcfLineWidths(ctx, tokens, fontSize, fallbackFontCss);

  const lines: WrappedLine[] = [];
  let current: TextToken[] = [];
  let currentW = 0;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const w = widths[i];
    const needed = current.length === 0 ? w : currentW + gap + w;
    if (current.length > 0 && needed > maxWidth) {
      lines.push({ tokens: current, isParagraphEnd: false, lineWidth: currentW });
      current = [tok];
      currentW = w;
    } else {
      current.push(tok);
      currentW = needed;
    }
  }
  if (current.length > 0) {
    lines.push({ tokens: current, isParagraphEnd: true, lineWidth: currentW });
  }
  return lines;
}

function buildRawCardSections(
  config: ShareCardRenderConfig,
  useQcf4: boolean
): RawCardSection[] {
  const showBanner = Boolean(config.showSurahHeader && config.frameStyle !== "none");

  if (useQcf4 && config.scope === "page" && config.qcfPageLines && config.qcfPageLines.length > 0) {
    interface QcfDraft {
      surahNumber: number;
      isSurahStart: boolean;
      hasExplicitBismillah: boolean;
      rawLines: Qcf4Word[][];
    }

    const drafts: QcfDraft[] = [];
    let currentDraft: QcfDraft | null = null;
    let hdrCount = 0;
    const fallbackSurahNum = config.verses[0]?.surahNumber || config.surahNumber || 1;

    for (let lIdx = 0; lIdx < config.qcfPageLines.length; lIdx++) {
      const line = config.qcfPageLines[lIdx];
      const hasSurahHeader =
        line.type === "surah_name" || line.words.some((w) => w.type === "surah_header");
      const hasBismillah =
        line.type === "basmallah" || line.words.some((w) => w.type === "bismillah");

      if (hasSurahHeader) {
        const sNum = resolveQcfHeaderSurahNumber(
          line,
          config.qcfPageLines,
          lIdx,
          config.pageNumber,
          hdrCount,
          fallbackSurahNum
        );
        hdrCount++;
        if (currentDraft && currentDraft.rawLines.length > 0) {
          drafts.push(currentDraft);
        }
        currentDraft = {
          surahNumber: sNum,
          isSurahStart: true,
          hasExplicitBismillah: false,
          rawLines: [],
        };
        continue;
      }

      if (hasBismillah) {
        if (!currentDraft) {
          const sNum = findNextQcfSurahNumber(config.qcfPageLines, lIdx, fallbackSurahNum);
          currentDraft = {
            surahNumber: sNum,
            isSurahStart: true,
            hasExplicitBismillah: true,
            rawLines: [],
          };
        } else {
          currentDraft.hasExplicitBismillah = true;
        }
        continue;
      }

      const verseWords = line.words.filter(
        (w) => w.type !== "surah_header" && w.type !== "bismillah" && (config.showAyahNumbers || w.type !== "end")
      );
      if (verseWords.length === 0) continue;

      // Split words in line by surah transitions if any line mixes keys
      const chunks: { surahNumber: number; firstAyah: number; words: Qcf4Word[] }[] = [];
      for (const w of verseWords) {
        let wSurah = currentDraft?.surahNumber || fallbackSurahNum;
        let wAyah = 0;
        if (w.verse_key) {
          const [sn, an] = w.verse_key.split(":").map(Number);
          if (sn >= 1 && sn <= 114) wSurah = sn;
          if (an >= 1) wAyah = an;
        }
        const prevChunk = chunks[chunks.length - 1];
        if (!prevChunk || prevChunk.surahNumber !== wSurah) {
          chunks.push({ surahNumber: wSurah, firstAyah: wAyah, words: [w] });
        } else {
          prevChunk.words.push(w);
        }
      }

      for (const chunk of chunks) {
        if (!currentDraft) {
          currentDraft = {
            surahNumber: chunk.surahNumber,
            isSurahStart: chunk.firstAyah === 1,
            hasExplicitBismillah: false,
            rawLines: [],
          };
        } else if (chunk.surahNumber !== currentDraft.surahNumber && currentDraft.rawLines.length > 0) {
          drafts.push(currentDraft);
          currentDraft = {
            surahNumber: chunk.surahNumber,
            isSurahStart: chunk.firstAyah === 1,
            hasExplicitBismillah: chunk.firstAyah === 1 && chunk.surahNumber !== 9 && chunk.surahNumber !== 1,
            rawLines: [],
          };
        }
        currentDraft.rawLines.push(chunk.words);
      }
    }

    if (currentDraft && currentDraft.rawLines.length > 0) {
      drafts.push(currentDraft);
    }

    if (drafts.length > 0) {
      return drafts.map((d) => ({
        surahNumber: d.surahNumber,
        surahName: cleanSurahTitle(undefined, d.surahNumber),
        drawHeader: showBanner,
        drawBismillah:
          config.showBismillah &&
          d.surahNumber !== 9 &&
          !(d.surahNumber === 1 && d.isSurahStart) &&
          (d.hasExplicitBismillah || (d.isSurahStart && d.surahNumber !== 1)),
        qcfLines: d.rawLines,
      }));
    }
  }

  // Non-page scopes always render as a single cohesive section
  if (config.scope !== "page") {
    const drawBismillah =
      config.showBismillah &&
      config.surahNumber !== 9 &&
      !(config.surahNumber === 1 && config.ayahFrom === 1);

    const allQcfWords: Qcf4Word[] = [];
    for (const v of config.verses) {
      if (v.qcfWords && v.qcfWords.length > 0) {
        allQcfWords.push(...v.qcfWords);
      }
    }

    return [
      {
        surahNumber: config.surahNumber,
        surahName: cleanSurahTitle(config.surahName, config.surahNumber),
        drawHeader: showBanner,
        drawBismillah,
        qcfWords: useQcf4 ? allQcfWords : undefined,
        standardTokens: useQcf4
          ? undefined
          : tokenizeStandardVerses(config.verses, config.showAyahNumbers, drawBismillah),
      },
    ];
  }

  // Page scope with standard Arabic font (or QCF4 fallback without qcfPageLines):
  // Group consecutive verses by surahNumber so multi-surah pages render each Surah frame + Bismillah inline!
  const groups: { surahNumber: number; surahName: string; verses: ShareCardVerseItem[] }[] = [];
  for (const v of config.verses) {
    const last = groups[groups.length - 1];
    if (!last || last.surahNumber !== v.surahNumber) {
      groups.push({
        surahNumber: v.surahNumber,
        surahName: cleanSurahTitle(v.surahName, v.surahNumber),
        verses: [v],
      });
    } else {
      last.verses.push(v);
    }
  }

  if (groups.length === 0) {
    return [
      {
        surahNumber: config.surahNumber,
        surahName: cleanSurahTitle(config.surahName, config.surahNumber),
        drawHeader: showBanner,
        drawBismillah: false,
        standardTokens: [],
      },
    ];
  }

  return groups.map((g) => {
    const startsAtAyahOne = (g.verses[0]?.numberInSurah || 1) === 1;
    const drawBismillah =
      config.showBismillah &&
      g.surahNumber !== 9 &&
      !(g.surahNumber === 1 && startsAtAyahOne) &&
      startsAtAyahOne;

    const groupQcfWords = useQcf4 ? g.verses.flatMap((v) => v.qcfWords || []) : undefined;

    return {
      surahNumber: g.surahNumber,
      surahName: g.surahName,
      drawHeader: showBanner,
      drawBismillah,
      qcfWords: groupQcfWords,
      standardTokens: useQcf4
        ? undefined
        : tokenizeStandardVerses(g.verses, config.showAyahNumbers, drawBismillah),
    };
  });
}

function drawSurahHeaderBanner(
  ctx: CanvasRenderingContext2D,
  config: ShareCardRenderConfig,
  surahNumber: number,
  surahName: string,
  W: number,
  padX: number,
  contentWidth: number,
  cursorY: number,
  headerH: number,
  bannerImg: HTMLImageElement | null
) {
  const cleanName = cleanSurahTitle(surahName, surahNumber);
  const qbsmlChar = String.fromCharCode(0xf100 + Math.max(0, Math.min(113, surahNumber - 1)));
  const useSectionQbsml = isQbsmlLoaded() && verifyCanvasGlyph("QCF4_QBSML", qbsmlChar);

  if (config.frameStyle === "authentic" && bannerImg) {
    const naturalRatio = 30.23196 / 240.20621;
    const maxWByHeight = headerH / naturalRatio;
    const targetBannerW = Math.min(contentWidth, 860, maxWByHeight);
    const targetBannerH = Math.round(targetBannerW * naturalRatio);
    const bx = Math.round((W - targetBannerW) / 2);
    const by = cursorY + Math.round((headerH - targetBannerH) / 2);
    ctx.drawImage(bannerImg, bx, by, targetBannerW, targetBannerH);

    ctx.save();
    ctx.fillStyle = config.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (useSectionQbsml) {
      ctx.font = `400 ${Math.round(targetBannerH * 0.56)}px "QCF4_QBSML"`;
      ctx.fillText(qbsmlChar, W / 2, by + targetBannerH * 0.47);
    } else {
      ctx.direction = "rtl";
      ctx.font = `700 ${Math.max(16, Math.round(targetBannerH * 0.39))}px "Amiri", "Cairo", serif`;
      ctx.fillText(`سُورَةُ ${cleanName}`, W / 2, by + targetBannerH * 0.5);
    }
    ctx.restore();
  } else if (config.frameStyle === "classic" || (config.frameStyle === "authentic" && !bannerImg)) {
    const boxW = Math.min(contentWidth, 680);
    const boxH = Math.min(82, headerH);
    const bx = Math.round((W - boxW) / 2);
    const by = cursorY + Math.round((headerH - boxH) / 2);
    ctx.save();
    ctx.fillStyle = config.frameBgColor;
    drawRoundedRectPath(ctx, bx, by, boxW, boxH, 16);
    ctx.fill();
    ctx.strokeStyle = config.frameColor;
    ctx.lineWidth = 2.2;
    drawRoundedRectPath(ctx, bx, by, boxW, boxH, 16);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    drawRoundedRectPath(ctx, bx + 6, by + 6, boxW - 12, boxH - 12, 12);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = config.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (useSectionQbsml) {
      ctx.font = `400 ${Math.max(20, Math.round(boxH * 0.62))}px "QCF4_QBSML"`;
      ctx.fillText(qbsmlChar, W / 2, by + boxH * 0.48);
    } else {
      ctx.direction = "rtl";
      ctx.font = `700 ${Math.max(16, Math.round(boxH * 0.44))}px "Amiri", "Cairo", serif`;
      ctx.fillText(`سُورَةُ ${cleanName}`, W / 2, by + boxH * 0.52);
    }
    ctx.restore();
  } else {
    // minimal
    ctx.save();
    ctx.fillStyle = config.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fontSize = Math.min(32, Math.max(18, Math.round(headerH * 0.48)));
    ctx.direction = "rtl";
    ctx.font = `700 ${fontSize}px "Amiri", "Cairo", serif`;
    const title = `سُورَةُ ${cleanName}`;
    const tw = ctx.measureText(title).width;
    const centerY = cursorY + headerH / 2;
    ctx.fillText(title, W / 2, centerY);

    const lineSpan = Math.max(40, (contentWidth - tw - 64) / 2);
    ctx.strokeStyle = config.frameColor;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(padX, centerY);
    ctx.lineTo(padX + lineSpan, centerY);
    ctx.moveTo(W - padX - lineSpan, centerY);
    ctx.lineTo(W - padX, centerY);
    ctx.stroke();
    ctx.restore();
  }
}

function drawOrnamentalBorders(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  opacity: number,
  radius: number
) {
  if (opacity <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;

  // Outer clean hairline inside rounded card edge
  const m1 = 22;
  ctx.lineWidth = 2;
  drawRoundedRectPath(ctx, m1, m1, w - m1 * 2, h - m1 * 2, Math.max(6, radius - 14));
  ctx.stroke();

  // Inner subtle rule
  const m2 = 30;
  ctx.lineWidth = 1;
  ctx.globalAlpha = opacity * 0.55;
  drawRoundedRectPath(ctx, m2, m2, w - m2 * 2, h - m2 * 2, Math.max(4, radius - 18));
  ctx.stroke();

  // Subtle corner diamond florets
  ctx.globalAlpha = opacity * 0.85;
  ctx.fillStyle = color;
  const corners = [
    [m2, m2],
    [w - m2, m2],
    [m2, h - m2],
    [w - m2, h - m2],
  ];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx + 5, cy);
    ctx.lineTo(cx, cy + 5);
    ctx.lineTo(cx - 5, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export async function renderShareCardToCanvas(
  canvas: HTMLCanvasElement,
  config: ShareCardRenderConfig
): Promise<ShareCardRenderResult> {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { width: 1080, height: 1080, usedQcf4: false, usedQbsmlHeader: false, appliedFontScale: 1 };
  }

  // Collect all QCF4 fonts referenced if Mushaf mode is requested
  const allQcfWords: Qcf4Word[] = [];
  if (config.verses.length > 0) {
    for (const v of config.verses) {
      if (v.qcfWords && v.qcfWords.length > 0) {
        allQcfWords.push(...v.qcfWords);
      }
    }
  }
  if (allQcfWords.length === 0 && config.qcfPageLines) {
    for (const line of config.qcfPageLines) {
      allQcfWords.push(...line.words);
    }
  }

  const qcfFontNames = Array.from(
    new Set(
      [
        config.qcfPageFont || "",
        ...allQcfWords.map((w) => w.font || ""),
      ].filter(Boolean)
    )
  );

  // Ensure fonts are loaded into document.fonts
  await ensureStudioFontsReady(config.fontId, config.fontId === "mushaf" ? qcfFontNames : []);

  // Verify QCF4 renderability strictly (no tofu squares ever!)
  let useQcf4 = config.fontId === "mushaf" && allQcfWords.length > 0;
  if (useQcf4) {
    const sampleWords = allQcfWords.filter((w) => w.type === "word" && w.char && w.font);
    if (sampleWords.length === 0) {
      useQcf4 = false;
    } else {
      const checkedFonts = new Set<string>();
      for (const sw of sampleWords) {
        if (checkedFonts.has(sw.font)) continue;
        checkedFonts.add(sw.font);
        if (!verifyCanvasGlyph(sw.font, sw.char.charAt(0))) {
          useQcf4 = false;
          break;
        }
      }
    }
  }

  // Build segmented sections (supports multi-surah pages cleanly in both QCF4 and Unicode modes)
  const rawSections = buildRawCardSections(config, useQcf4);

  // Verify header glyph, istiadhah glyphs, & bismillah glyph independently
  const firstSectionSurah = rawSections[0]?.surahNumber || config.surahNumber;
  const qbsmlChar = String.fromCharCode(0xf100 + Math.max(0, Math.min(113, firstSectionSurah - 1)));
  const useQbsmlHeader = isQbsmlLoaded() && verifyCanvasGlyph("QCF4_QBSML", qbsmlChar);
  const useQbsmlIstiadhah =
    Boolean(config.showIstiadhah) &&
    isQbsmlLoaded() &&
    QCF4_QBSML_ISTIADHAH_GLYPHS.every((g) => verifyCanvasGlyph("QCF4_QBSML", g));
  const useQcfBismillah = isQcfHafs01Loaded() && verifyCanvasGlyph("QCF4_Hafs_01", "\uF8DD");

  // Load SVG authentic banner and App Logo in parallel
  const [bannerImg, logoImg] = await Promise.all([
    config.showSurahHeader && config.frameStyle === "authentic"
      ? getFrameBannerBitmap(config.frameColor, config.frameBgColor)
      : Promise.resolve(null),
    config.showFooter ? getAppLogoBitmap() : Promise.resolve(null),
  ]);

  const fallbackFontCss = getFontFamilyCss(config.fontId === "mushaf" ? "uthmani" : config.fontId);
  const effectiveFontCss = getFontFamilyCss(config.fontId);

  // Estimate initial dimensions to perform layout & auto-fit cleanly
  const isFixedAspect = config.aspectRatio !== "auto";
  const initialDims = resolveCanvasDimensions(config.aspectRatio, config.customWidth, config.customHeight, 1200);
  const cardWidth = initialDims.width;

  const isWideLandscape = config.aspectRatio === "16:9" || config.aspectRatio === "4:3";
  const padX = Math.round(cardWidth * (isWideLandscape ? 0.085 : 0.095));
  const padTop = Math.round(cardWidth * (isWideLandscape ? 0.055 : 0.075));
  const padBottom = Math.round(cardWidth * (isWideLandscape ? 0.048 : 0.062));
  const contentWidth = cardWidth - padX * 2;
  const innerPlatePadX = config.textPlateOpacity > 0.01 ? 34 : 0;
  const textMaxWidth = contentWidth - innerPlatePadX * 2;

  const baseVerseFontSize = Math.round(
    (config.scope === "page" ? 36 : config.verses.length > 4 ? 42 : 50) * config.fontSizeScale
  );

  const shouldDrawIstiadhah = Boolean(config.showIstiadhah);
  const footerH = config.showFooter ? 68 : 0;
  const footerGap = config.showFooter ? 24 : 0;
  const sectionCount = rawSections.length;

  const baseHeaderH =
    config.showSurahHeader && config.frameStyle !== "none"
      ? Math.round(config.frameStyle === "minimal" ? 68 : Math.min(112, contentWidth * 0.125))
      : 0;

  let chosenFontSize = baseVerseFontSize;

  const computeLayoutForFontSize = (fs: number) => {
    const ls = Math.round(fs * config.lineHeightScale);
    const fitScale = fs < 30 ? Math.min(1, Math.max(0.78, fs / 32)) : 1;
    const bannerScale = fitScale;
    const gapScale = sectionCount >= 3 ? 0.62 * fitScale : sectionCount === 2 ? 0.78 * fitScale : fitScale;

    let maxLineWidth = 0;
    let bodyAndBannersH = 0;

    const computedSections: ComputedSectionLayout[] = rawSections.map((raw, idx) => {
      const lines = useQcf4
        ? layoutQcf4Lines(
            ctx,
            raw.qcfWords || [],
            textMaxWidth,
            fs,
            fallbackFontCss,
            config.showAyahNumbers,
            raw.qcfLines
          )
        : layoutStandardLines(ctx, raw.standardTokens || [], textMaxWidth, fs, effectiveFontCss);

      const secMaxW = lines.reduce((m, l) => Math.max(m, l.lineWidth), 0);
      if (secMaxW > maxLineWidth) maxLineWidth = secMaxW;

      const headerH = raw.drawHeader ? Math.max(64, Math.round(baseHeaderH * bannerScale)) : 0;
      const headerGap = headerH > 0 ? Math.max(8, Math.round(18 * gapScale)) : 0;

      const istiadhahH = idx === 0 && shouldDrawIstiadhah ? Math.max(38, Math.round(52 * bannerScale)) : 0;
      const istiadhahGap = istiadhahH > 0 ? Math.max(6, Math.round(14 * gapScale)) : 0;

      const bismillahH = raw.drawBismillah ? Math.max(42, Math.round(58 * bannerScale)) : 0;
      const bismillahGap = bismillahH > 0 ? Math.max(6, Math.round(16 * gapScale)) : 0;

      const platePadY =
        config.textPlateOpacity > 0.01
          ? sectionCount > 1
            ? Math.max(10, Math.round(18 * gapScale))
            : 34
          : sectionCount > 1
            ? 4
            : 10;

      const blockH = lines.length * ls + platePadY * 2;
      const sectionGapAfter = idx < sectionCount - 1 ? Math.max(10, Math.round(20 * gapScale)) : 0;
      const totalSectionH =
        headerH +
        headerGap +
        istiadhahH +
        istiadhahGap +
        bismillahH +
        bismillahGap +
        blockH +
        sectionGapAfter;

      bodyAndBannersH += totalSectionH;

      return {
        raw,
        lines,
        maxLineWidth: secMaxW,
        headerH,
        headerGap,
        istiadhahH,
        istiadhahGap,
        bismillahH,
        bismillahGap,
        platePadY,
        blockH,
        sectionGapAfter,
        totalSectionH,
      };
    });

    const totalH = padTop + bodyAndBannersH + footerGap + footerH + padBottom;
    return { ls, computedSections, bodyAndBannersH, totalH, maxLineWidth };
  };

  let layout = computeLayoutForFontSize(chosenFontSize);

  // Guard horizontal overflow on preformatted Mushaf lines (all aspect modes)
  while (layout.maxLineWidth > textMaxWidth + 2 && chosenFontSize > 16) {
    const ratioW = textMaxWidth / layout.maxLineWidth;
    const nextFs = Math.max(16, Math.floor(chosenFontSize * Math.min(0.95, ratioW + 0.02)));
    chosenFontSize = nextFs < chosenFontSize ? nextFs : chosenFontSize - 1;
    layout = computeLayoutForFontSize(chosenFontSize);
  }

  if (isFixedAspect) {
    const targetH = initialDims.height;
    while (layout.totalH > targetH && chosenFontSize > 14) {
      const ratio = targetH / layout.totalH;
      const nextFs = Math.max(14, Math.floor(chosenFontSize * Math.min(0.95, ratio + 0.03)));
      chosenFontSize = nextFs < chosenFontSize ? nextFs : chosenFontSize - 1;
      layout = computeLayoutForFontSize(chosenFontSize);
    }
  } else {
    while (layout.totalH > 2560 && chosenFontSize > 18) {
      chosenFontSize = Math.max(18, chosenFontSize - 2);
      layout = computeLayoutForFontSize(chosenFontSize);
    }
  }

  const lineStep = layout.ls;

  const finalDims = resolveCanvasDimensions(
    config.aspectRatio,
    config.customWidth,
    config.customHeight,
    layout.totalH
  );
  const W = finalDims.width;
  const H = finalDims.height;

  // Apply crisp physical canvas pixel dimensions
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // Clip rounded card perimeter
  drawRoundedRectPath(ctx, 0, 0, W, H, config.borderRadius);
  ctx.clip();

  // 1. Paint Background
  if (config.bgType === "solid") {
    ctx.fillStyle = config.solidColor;
    ctx.fillRect(0, 0, W, H);
  } else if (config.bgType === "gradient") {
    if (config.bgGradientType === "radial") {
      const grad = ctx.createRadialGradient(
        W * 0.5,
        H * 0.38,
        Math.min(W, H) * 0.05,
        W * 0.5,
        H * 0.5,
        Math.max(W, H) * 0.78
      );
      grad.addColorStop(0, config.bgColor1);
      grad.addColorStop(1, config.bgColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else {
      const rad = ((config.bgAngle - 90) * Math.PI) / 180;
      const halfDiag = Math.sqrt(W * W + H * H) / 2;
      const cx = W / 2;
      const cy = H / 2;
      const x1 = cx - Math.cos(rad) * halfDiag;
      const y1 = cy - Math.sin(rad) * halfDiag;
      const x2 = cx + Math.cos(rad) * halfDiag;
      const y2 = cy + Math.sin(rad) * halfDiag;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, config.bgColor1);
      grad.addColorStop(1, config.bgColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // 2. Paint Ornamental Double Borders (vector crisp)
  if (config.bgType !== "transparent") {
    drawOrnamentalBorders(ctx, W, H, config.frameColor, config.ornamentOpacity, config.borderRadius);
  }

  // Compute balanced vertical distribution
  const totalContentH = layout.bodyAndBannersH + footerGap + footerH;
  const availableCenterH = H - padTop - padBottom;
  const extraSpace = Math.max(0, availableCenterH - totalContentH);

  let cursorY = padTop + Math.round(extraSpace * 0.44);
  const plateX = padX;
  const plateW = contentWidth;
  const rightEdge = plateX + plateW - innerPlatePadX;
  const leftEdge = plateX + innerPlatePadX;
  const usableLineW = rightEdge - leftEdge;

  // 3..6 Render Each Surah Section (Header Banner -> Istiadhah (section 0) -> Bismillah -> Plate + Verses)
  for (let secIdx = 0; secIdx < layout.computedSections.length; secIdx++) {
    const sec = layout.computedSections[secIdx];

    if (sec.raw.drawHeader && sec.headerH > 0) {
      drawSurahHeaderBanner(
        ctx,
        config,
        sec.raw.surahNumber,
        sec.raw.surahName,
        W,
        padX,
        contentWidth,
        cursorY,
        sec.headerH,
        bannerImg
      );
      cursorY += sec.headerH + sec.headerGap;
    }

    if (sec.istiadhahH > 0) {
      ctx.save();
      ctx.fillStyle = config.textColor;
      ctx.globalAlpha = 0.92;
      ctx.textBaseline = "middle";
      const istiY = cursorY + sec.istiadhahH / 2;

      if (useQbsmlIstiadhah) {
        let istiFontSize = Math.max(22, Math.round(sec.istiadhahH * 0.69));
        const maxIstiW = Math.min(contentWidth * 0.78, 660);
        ctx.font = `400 ${istiFontSize}px "QCF4_QBSML"`;
        let glyphWidths = QCF4_QBSML_ISTIADHAH_GLYPHS.map((g) => ctx.measureText(g).width);
        let gap = Math.round(istiFontSize * 0.22);
        let totalW = glyphWidths.reduce((a, b) => a + b, 0) + gap * (glyphWidths.length - 1);

        if (totalW > maxIstiW && totalW > 0) {
          const scale = maxIstiW / totalW;
          istiFontSize = Math.max(18, Math.floor(istiFontSize * scale));
          ctx.font = `400 ${istiFontSize}px "QCF4_QBSML"`;
          glyphWidths = QCF4_QBSML_ISTIADHAH_GLYPHS.map((g) => ctx.measureText(g).width);
          gap = Math.round(istiFontSize * 0.22);
          totalW = glyphWidths.reduce((a, b) => a + b, 0) + gap * (glyphWidths.length - 1);
        }

        ctx.direction = "ltr";
        ctx.textAlign = "right";
        let cursorX = W / 2 + totalW / 2;
        for (let i = 0; i < QCF4_QBSML_ISTIADHAH_GLYPHS.length; i++) {
          ctx.fillText(QCF4_QBSML_ISTIADHAH_GLYPHS[i], cursorX, istiY);
          cursorX -= glyphWidths[i] + gap;
        }
      } else {
        ctx.textAlign = "center";
        ctx.direction = "rtl";
        ctx.font = `400 ${Math.max(18, Math.round(sec.istiadhahH * 0.54))}px "UthmanTaha", "Amiri", serif`;
        ctx.fillText("أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيْطَٰنِ ٱلرَّجِيمِ", W / 2, istiY);
      }
      ctx.restore();
      cursorY += sec.istiadhahH + sec.istiadhahGap;
    }

    if (sec.raw.drawBismillah && sec.bismillahH > 0) {
      ctx.save();
      ctx.fillStyle = config.textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const bisY = cursorY + sec.bismillahH / 2;
      if (useQcfBismillah) {
        const bisFs = Math.max(32, Math.min(46, Math.round(sec.bismillahH * 0.78)));
        ctx.font = `400 ${bisFs}px "QCF4_Hafs_01"`;
        ctx.fillText("\uF8DD", W / 2, bisY);
      } else {
        const bisFs = Math.max(26, Math.min(36, Math.round(sec.bismillahH * 0.62)));
        ctx.direction = "rtl";
        ctx.font = `400 ${bisFs}px "UthmanTaha", "Amiri", serif`;
        ctx.fillText("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", W / 2, bisY);
      }
      ctx.restore();
      cursorY += sec.bismillahH + sec.bismillahGap;
    }

    // Optional Soft Text Plate for Legibility
    const plateY = cursorY;
    if (config.textPlateOpacity > 0.01) {
      ctx.save();
      ctx.globalAlpha = config.textPlateOpacity;
      ctx.fillStyle = config.frameBgColor;
      drawRoundedRectPath(ctx, plateX, plateY, plateW, sec.blockH, 24);
      ctx.fill();
      ctx.globalAlpha = Math.min(0.45, config.textPlateOpacity * 0.7);
      ctx.strokeStyle = config.frameColor;
      ctx.lineWidth = 1.4;
      drawRoundedRectPath(ctx, plateX, plateY, plateW, sec.blockH, 24);
      ctx.stroke();
      ctx.restore();
    }

    // Verses Typography Engine for this section
    let textY = plateY + sec.platePadY + Math.round(lineStep * 0.54);
    for (let lineIdx = 0; lineIdx < sec.lines.length; lineIdx++) {
      const line = sec.lines[lineIdx];
      const isLastLine = lineIdx === sec.lines.length - 1 || line.isParagraphEnd;
      const count = line.tokens.length;

      if (useQcf4) {
        const tokenWidths = measureQcfLineWidths(ctx, line.tokens, chosenFontSize, fallbackFontCss);
        const rawContentW = tokenWidths.reduce((a, b) => a + b, 0);
        const defaultGap = Math.max(2, chosenFontSize * 0.06);
        const naturalW = rawContentW + Math.max(0, count - 1) * defaultGap;

        let gap = defaultGap;
        let cursorX = rightEdge;

        if (config.textAlign === "justify" && !isLastLine && count > 1 && naturalW < usableLineW) {
          gap = Math.min(chosenFontSize * 0.7, (usableLineW - rawContentW) / (count - 1));
        } else if (config.textAlign === "center" || (config.textAlign === "justify" && isLastLine)) {
          cursorX = leftEdge + (usableLineW + naturalW) / 2;
        }

        ctx.save();
        ctx.textBaseline = "middle";
        ctx.textAlign = "right";
        ctx.direction = "ltr";

        for (let i = 0; i < count; i++) {
          const tok = line.tokens[i];
          const w = tokenWidths[i];
          const f = tok.font ? `"${tok.font}", ${fallbackFontCss}` : fallbackFontCss;
          ctx.font = `400 ${chosenFontSize}px ${f}`;
          ctx.fillStyle = tok.isAyahMarker ? config.ayahNumberColor : config.textColor;
          ctx.fillText(tok.text, cursorX, textY);
          cursorX -= w + gap;
        }
        ctx.restore();
      } else {
        ctx.save();
        ctx.textBaseline = "middle";
        ctx.direction = "rtl";

        ctx.font = `400 ${chosenFontSize}px ${effectiveFontCss}`;
        const baseSpaceW = ctx.measureText(" ").width;

        const tokenWidths = line.tokens.map((tok) => {
          ctx.font = tok.isAyahMarker
            ? `600 ${Math.round(chosenFontSize * 0.88)}px ${effectiveFontCss}`
            : `400 ${chosenFontSize}px ${effectiveFontCss}`;
          return ctx.measureText(tok.text).width;
        });
        const pureTokensW = tokenWidths.reduce((a, b) => a + b, 0);
        const naturalW = pureTokensW + Math.max(0, count - 1) * baseSpaceW;

        let gap = baseSpaceW;
        let startRightX = rightEdge;

        if (config.textAlign === "justify" && !isLastLine && count > 1 && naturalW < usableLineW) {
          gap = Math.min(chosenFontSize * 0.9, (usableLineW - pureTokensW) / (count - 1));
        } else if (config.textAlign === "center" || (config.textAlign === "justify" && isLastLine)) {
          startRightX = leftEdge + (usableLineW + naturalW) / 2;
        }

        ctx.textAlign = "right";
        let cursorX = startRightX;

        for (let i = 0; i < count; i++) {
          const tok = line.tokens[i];
          const w = tokenWidths[i];
          if (tok.isAyahMarker) {
            ctx.font = `600 ${Math.round(chosenFontSize * 0.88)}px ${effectiveFontCss}`;
            ctx.fillStyle = config.ayahNumberColor;
          } else {
            ctx.font = `400 ${chosenFontSize}px ${effectiveFontCss}`;
            ctx.fillStyle = config.textColor;
          }
          ctx.fillText(tok.text, cursorX, textY);
          cursorX -= w + gap;
        }
        ctx.restore();
      }

      textY += lineStep;
    }

    cursorY = plateY + sec.blockH + sec.sectionGapAfter;
  }

  // 7. Footer Branding + Hairline Divider
  if (config.showFooter) {
    const footerTopY = H - padBottom - footerH;
    ctx.save();

    ctx.strokeStyle = config.frameColor;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padX, footerTopY);
    ctx.lineTo(W - padX, footerTopY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const itemCenterY = footerTopY + footerH * 0.58;

    let brandRightX = W - padX;
    if (logoImg) {
      const iconSize = 42;
      const ix = brandRightX - iconSize;
      const iy = itemCenterY - iconSize / 2;
      ctx.save();
      drawRoundedRectPath(ctx, ix, iy, iconSize, iconSize, 10);
      ctx.clip();
      ctx.drawImage(logoImg, ix, iy, iconSize, iconSize);
      ctx.restore();
      brandRightX = ix - 14;
    }

    ctx.fillStyle = config.textColor;
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.font = `700 22px "Cairo", system-ui, sans-serif`;
    ctx.fillText("مصحف التبيان", brandRightX, itemCenterY);

    if (config.showMetadataInFooter) {
      let refText = "";
      if (config.scope === "page") {
        const uniqueSectionNames = Array.from(
          new Set(rawSections.map((s) => cleanSurahTitle(s.surahName, s.surahNumber)))
        );
        const pageSurahLabel =
          uniqueSectionNames.length > 1
            ? uniqueSectionNames.join(" · ")
            : `سورة ${uniqueSectionNames[0] || cleanSurahTitle(config.surahName, config.surahNumber)}`;
        refText = `صفحة ${toArabicDigits(config.pageNumber)} · ${pageSurahLabel}`;
      } else {
        const sLabel = cleanSurahTitle(config.surahName, config.surahNumber);
        if (config.scope === "range" && config.ayahTo > config.ayahFrom) {
          refText = `سورة ${sLabel} · الآيات ${toArabicDigits(config.ayahFrom)}–${toArabicDigits(config.ayahTo)}`;
        } else {
          refText = `سورة ${sLabel} · آية ${toArabicDigits(config.ayahFrom)}`;
        }
      }

      ctx.globalAlpha = 0.78;
      ctx.fillStyle = config.textColor;
      ctx.textAlign = "left";
      ctx.font = `600 20px "Cairo", system-ui, sans-serif`;
      ctx.fillText(refText, padX, itemCenterY);
    }

    ctx.restore();
  }

  ctx.restore();

  return {
    width: W,
    height: H,
    usedQcf4: useQcf4,
    usedQbsmlHeader: useQbsmlHeader,
    appliedFontScale: Number((chosenFontSize / baseVerseFontSize).toFixed(2)),
  };
}

export async function exportCanvasToPng(canvas: HTMLCanvasElement): Promise<{
  blob: Blob;
  dataUrl: string;
  base64: string;
}> {
  const dataUrl = canvas.toDataURL("image/png", 1.0);
  const commaIdx = dataUrl.indexOf(",");
  const base64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : "";

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b && b.size > 0) {
          resolve(b);
        } else {
          reject(new Error("Canvas toBlob returned empty image"));
        }
      },
      "image/png",
      1.0
    );
  });

  return { blob, dataUrl, base64 };
}
