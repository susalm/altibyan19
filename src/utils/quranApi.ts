/**
 * Utility functions for Quran API calls with automatic fallbacks
 * for static web hosting (e.g. Hostinger, cPanel, Vercel static) where
 * Node.js server.ts API proxies are not running or return 404 / index.html.
 */

import { getCachedPageSvg, saveCachedPageSvg } from "./quranPageCache";
import { getOfflineMukhtasarTafsir, getOfflineMukhtasarTafsirFallback } from "./mukhtasarBook";
import { getOfflineAysarTafsir, getOfflineAysarTafsirFallback } from "./aysarBook";
import { getOfflineEnglishTranslation } from "./englishTranslation";
import { SURAH_HEADER_POSITIONS } from "./surahHeaderMap";
import { getAuthenticFrameSvg } from "./mushafFrameSvgData";

// Helper to check if text is HTML (e.g. SPA index.html fallback on 404)
function isHtmlResponse(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html") || trimmed.startsWith("<head");
}

/**
 * Fetch JSON with automatic fallback to direct external API
 */
export async function fetchAlquranCloud(endpoint: string): Promise<any> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const primaryUrl = `/api/alquran-cloud/${cleanEndpoint}`;
  const fallbackUrl = `https://api.alquran.cloud/${cleanEndpoint}`;

  try {
    const res = await fetch(primaryUrl);
    if (res.ok) {
      const text = await res.text();
      if (!isHtmlResponse(text)) {
        try {
          const json = JSON.parse(text);
          if (json && (json.code === 200 || json.data)) {
            return json;
          }
        } catch {
          // ignore, continue to fallback
        }
      }
    }
  } catch (err) {
    console.warn(`Local API proxy for ${cleanEndpoint} failed, using direct CDN/API fallback:`, err);
  }

  // Fallback direct call
  const fallbackRes = await fetch(fallbackUrl);
  if (!fallbackRes.ok) {
    throw new Error(`Failed to fetch ${cleanEndpoint} from Alquran Cloud API (${fallbackRes.status})`);
  }
  const fallbackText = await fallbackRes.text();
  if (isHtmlResponse(fallbackText)) {
    throw new Error("Invalid response from Alquran Cloud API");
  }
  return JSON.parse(fallbackText);
}

/**
 * Fetch Quran SVG page with automatic direct CDN fallbacks for Hostinger and static servers
 */
export async function fetchQuranSvg(
  pageNum: number,
  provider: string = "quran-svg",
  signal?: AbortSignal
): Promise<string> {
  // Check local offline database first
  const localCached = await getCachedPageSvg(pageNum, provider);
  if (localCached) {
    return processSvgAdjustments(localCached, pageNum);
  }

  const pageStr3 = String(pageNum).padStart(3, "0");
  const primaryUrl = `/api/quran-svg/${pageNum}?provider=${encodeURIComponent(provider)}`;

  let finalSvg: string | null = null;

  // First attempt: local proxy endpoint
  try {
    const res = await fetch(primaryUrl, { signal });
    if (res.ok) {
      const text = await res.text();
      if (!isHtmlResponse(text) && (text.includes("<svg") || text.includes("<image"))) {
        finalSvg = processSvgAdjustments(text, pageNum);
      }
    }
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    console.warn(`Local SVG proxy failed for page ${pageNum}, using direct GitHub CDN fallback...`);
  }

  if (!finalSvg) {
    // Fallback URLs depending on provider
    let urlsToTry: string[] = [];

    if (provider === "quran-tajweed") {
      urlsToTry = [
        `https://cdn.jsdelivr.net/gh/ahmedmabdullatif/quran-hafs-svg@main/svg/${pageStr3}.svg`,
        `https://cdn.jsdelivr.net/gh/susalm/MushafDatabase-Ligature-Based-SVG@main/SVG%20V1.0/${pageStr3}.svg`,
        `https://raw.githubusercontent.com/ahmedmabdullatif/quran-hafs-svg/main/svg/${pageStr3}.svg`,
      ];
    } else {
      // Default quran-svg
      urlsToTry = [
        `https://cdn.jsdelivr.net/gh/ahmedmabdullatif/quran-hafs-svg@main/svg/${pageStr3}.svg`,
        `https://cdn.jsdelivr.net/gh/susalm/MushafDatabase-Ligature-Based-SVG@main/SVG%20V1.0/${pageStr3}.svg`,
        `https://raw.githubusercontent.com/ahmedmabdullatif/quran-hafs-svg/main/svg/${pageStr3}.svg`,
      ];
    }

    if (!finalSvg) {
      for (const url of urlsToTry) {
        try {
          const res = await fetch(url, { signal });
          if (res.ok) {
            const text = await res.text();
            if (!isHtmlResponse(text) && (text.includes("<svg") || text.includes("<image"))) {
              finalSvg = processSvgAdjustments(text, pageNum);
              break;
            }
          }
        } catch (err: any) {
          if (err?.name === "AbortError") throw err;
        }
      }
    }
  }

  if (!finalSvg) {
    // Universal last fallback
    const imgUrl = `https://files.quran.app/hafs/madani/width_1024/page${pageStr3}.png`;
    finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 456 700" width="100%" height="100%"><image href="${imgUrl}" width="456" height="700" /></svg>`;
  }

  // Save to IndexedDB asynchronously
  saveCachedPageSvg(pageNum, provider, finalSvg).catch(() => {});

  return finalSvg;
}

/**
 * Build authentic Uthman Taha Mushaf Surah header frame SVG markup matching traditional King Fahd Mushaf arabesque frame
 */
export function renderUthmanTahaFrame(
  id: string,
  yCenter: number,
  h: number = 36,
  isOpeningPage: boolean = false,
  surahNumber?: number,
  surahName?: string
): string {
  if (isOpeningPage) {
    // Opening pages (viewBox 0 0 235 235) - Width = 211
    const yTop = yCenter - h / 2;
    const x0 = 12;
    const w = 211;
    return getAuthenticFrameSvg(id, x0, yTop, w, h, surahNumber, surahName);
  }

  // Standard pages (viewBox 0 0 345 550) - Width = 335 (x: 5..340)
  const yTop = yCenter - h / 2;
  const x0 = 5;
  const w = 335;
  return getAuthenticFrameSvg(id, x0, yTop, w, h, surahNumber, surahName);
}

/**
 * Post-processing adjustments for Quran SVG pages:
 * 1. Ensure overflow="visible" on root SVG and Surah header frames.
 * 2. Prevent page background rects from covering frames or text.
 * 3. Extract/move Surah header frame to the end before </svg> so it is in the foreground.
 * 4. Calibrate frame coordinates individually for each Surah header (centered vertically & horizontally, no overlap).
 */
export function processSvgAdjustments(text: string, pageNum: number): string {
  if (!text || !text.includes("<svg")) return text;
  let result = text;

  // 1. Ensure root <svg> element has overflow="visible"
  result = result.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
    let newAttrs = attrs;
    if (/\boverflow=["'][^"']*["']/i.test(newAttrs)) {
      newAttrs = newAttrs.replace(/\boverflow=["'][^"']*["']/i, 'overflow="visible"');
    } else {
      newAttrs = ` overflow="visible"${newAttrs}`;
    }
    return `<svg${newAttrs}>`;
  });

  // 2. Remove ONLY full-page/full-canvas obscuring background rect tags if present
  result = result.replace(/<rect\b[^>]*(?:width=["'](?:100%|235|345|456|1024)["']|fill=["'](?:#fff|white|#ffffff)["'])[^>]*>/gi, "");

  // 3. Tag rosette groups (contains scale(...) in transform attribute) and digit groups
  result = result.replace(/<g\b([^>]*scale\([^>]*)>/gi, '<g$1 class="ayah_rosette_group">');
  result = result.replace(/<g\b([^>]*(?:ayah:[xy]|fill-rule|ayah_number|ayah_num)[^>]*)>/gi, '<g$1 class="ayah_digit_group">');

  // Tag paths inside rosette groups as ayah_rosette_path
  result = result.replace(/<g[^>]*class="[^"]*ayah_rosette_group[^"]*"[^>]*>[\s\S]*?<\/g>/gi, (block) => {
    return block.replace(/<path\b([^>]*)>/gi, (pMatch, pAttrs) => {
      if (/\bclass=["']/.test(pAttrs)) {
        return `<path${pAttrs.replace(/\bclass=["']([^"']*)["']/, 'class="$1 ayah_rosette_path"')}>`;
      } else {
        return `<path${pAttrs} class="ayah_rosette_path">`;
      }
    });
  });

  // Tag paths inside digit groups as ayah_digit_path
  result = result.replace(/<g[^>]*class="[^"]*ayah_digit_group[^"]*"[^>]*>[\s\S]*?<\/g>/gi, (block) => {
    return block.replace(/<path\b([^>]*)>/gi, (pMatch, pAttrs) => {
      if (/\bclass=["']/.test(pAttrs)) {
        return `<path${pAttrs.replace(/\bclass=["']([^"']*)["']/, 'class="$1 ayah_digit_path"')}>`;
      } else {
        return `<path${pAttrs} class="ayah_digit_path">`;
      }
    });
  });

  // Also tag any standalone <path> with ayah:x / ayah:y / ayah_number / ayah_num
  result = result.replace(/<path\b([^>]*(?:ayah:[xy]|ayah_number|ayah_num)[^>]*)>/gi, (match, attrs) => {
    if (/\bclass=["']/.test(attrs)) {
      return `<path${attrs.replace(/\bclass=["']([^"']*)["']/, 'class="$1 ayah_digit_path"')}>`;
    } else {
      return `<path${attrs} class="ayah_digit_path">`;
    }
  });

  // 4. Strip any existing/prior surah header frames or frame layers so frames are never duplicated
  const layerIdx = result.indexOf('<g id="surah-header-frame-layer"');
  if (layerIdx !== -1) {
    const endSvgIdx = result.lastIndexOf('</svg>');
    if (endSvgIdx > layerIdx) {
      result = result.slice(0, layerIdx) + result.slice(endSvgIdx);
    }
  }
  result = result.replace(/<g\b[^>]*(?:id=["'](?:surah_header_frame|surah-frame|page_surah_frame)[^"']*["']|class=["'][^"']*(?:surah_header_frame|surah-frame)[^"']*["'])[^>]*>[\s\S]*?<\/g>/gi, "");
  // Also strip any misplaced or redundant surah name text elements
  result = result.replace(/<text\b[^>]*class=["'][^"']*surah_header_text[^"']*["'][^>]*>[\s\S]*?<\/text>/gi, "");
  result = result.replace(/<text\b[^>]*style=["'][^"']*QCF4_QBSML[^"']*["'][^>]*>[\s\S]*?<\/text>/gi, "");

  // 5. Build authentic Mushaf Surah Header Frames (Uthman Taha design) for all Surahs starting on this page
  let generatedFrames = "";
  const surahsOnPage = SURAH_HEADER_POSITIONS[pageNum] || [];

  if (pageNum !== 1 && pageNum !== 2 && surahsOnPage.length > 0) {
    // Standard pages (viewBox 0 0 345 550) - Generate authentic Uthman Taha frame for EVERY Surah on this page
    surahsOnPage.forEach((sInfo) => {
      const h = sInfo.height || 36;
      generatedFrames += renderUthmanTahaFrame(
        `surah_header_frame_${sInfo.surah}`,
        sInfo.yCenter,
        h,
        false,
        sInfo.surah
      );
    });
  }

  // 6. Append the single frame layer directly before </svg> to guarantee top/foreground layer
  const framesToAppend = generatedFrames.trim();
  if (framesToAppend) {
    const frameLayer = `\n<g id="surah-header-frame-layer" class="surah_header_frame_layer" overflow="visible" pointer-events="none">\n${framesToAppend}\n</g>\n`;
    const lastCloseSvg = result.lastIndexOf("</svg>");
    if (lastCloseSvg !== -1) {
      result = result.slice(0, lastCloseSvg) + frameLayer + result.slice(lastCloseSvg);
    } else {
      result = `${result}${frameLayer}</svg>`;
    }
  }

  return result;
}

/**
 * Get EveryAyah Audio URL with fallback
 */
export function getAudioUrl(reciterId: string, surahNum: number, ayahNum: number): { primary: string; fallback: string } {
  const surahStr = String(surahNum).padStart(3, "0");
  const ayahStr = String(ayahNum).padStart(3, "0");
  const filename = `${surahStr}${ayahStr}.mp3`;
  return {
    primary: `/api/everyayah/${reciterId}/${filename}`,
    fallback: `https://everyayah.com/data/${reciterId}/${filename}`,
  };
}

/**
 * Fetch Tafsir with direct Alquran Cloud fallback if /api/tafsir is unavailable
 */
export async function fetchTafsirData(surahNumber: number, ayahNumber: number, mode: string = "tafsir-muyassar"): Promise<any> {
  if (mode === "tafsir_mukhtasar" || mode === "tafsir-mukhtasar") {
    const offlineMukhtasar = getOfflineMukhtasarTafsir(surahNumber, ayahNumber);
    if (offlineMukhtasar) {
      return {
        status: "success",
        text: offlineMukhtasar,
        result: offlineMukhtasar,
        source: "المختصر في تفسير القرآن الكريم - مستودع التبيان (https://github.com/susalm/mushaf-altibyan-/tree/main/tafsir-mcp-main)"
      };
    }

    // Direct GitHub fetch attempt from susalm/mushaf-altibyan- repository (tafsir-mcp-main)
    const altibyanUrls = [
      `https://raw.githubusercontent.com/susalm/mushaf-altibyan-/main/tafsir-mcp-main/tafsir/mukhtasar/${surahNumber}/${ayahNumber}.json`,
      `https://raw.githubusercontent.com/susalm/mushaf-altibyan-/main/tafsir-mcp-main/tafsir/${mode}/${surahNumber}/${ayahNumber}.json`,
      `https://raw.githubusercontent.com/susalm/mushaf-altibyan-/main/tafsir-mcp-main/mcp/mukhtasar/${surahNumber}/${ayahNumber}.json`,
      `https://raw.githubusercontent.com/susalm/mushaf-altibyan-/main/tafsir-mcp-main/data/${surahNumber}/${ayahNumber}.json`,
      `https://raw.githubusercontent.com/susalm/mushaf-altibyan-/main/tafsir-mcp-main/tafsir_mukhtasar/${surahNumber}/${ayahNumber}.json`
    ];

    for (const url of altibyanUrls) {
      try {
        const ghRes = await fetch(url);
        if (ghRes.ok) {
          const data = await ghRes.json();
          const textVal = data.text || data.result || data.tafsir || data.content;
          if (textVal) {
            return {
              status: "success",
              text: textVal,
              result: textVal,
              source: "المختصر في تفسير القرآن الكريم - مستودع التبيان (https://github.com/susalm/mushaf-altibyan-/tree/main/tafsir-mcp-main)"
            };
          }
        }
      } catch (e) {
        // ignore & try next
      }
    }
  }

  if (mode === "tafsir_aysar" || mode === "tafsir-aysar") {
    const offlineAysar = getOfflineAysarTafsir(surahNumber, ayahNumber);
    if (offlineAysar) {
      return {
        status: "success",
        text: offlineAysar,
        result: offlineAysar,
        source: "أيسر التفاسير لكلام العلي الكبير - مستودع التبيان (https://github.com/susalm/mushaf-altibyan-/tree/main/tafsir-mcp-main)"
      };
    }

    const aysarUrls = [
      `https://raw.githubusercontent.com/susalm/mushaf-altibyan-/main/tafsir-mcp-main/tafsir/aysar/${surahNumber}/${ayahNumber}.json`,
      `https://raw.githubusercontent.com/susalm/mushaf-altibyan-/main/tafsir-mcp-main/tafsir_aysar/${surahNumber}/${ayahNumber}.json`,
      `https://raw.githubusercontent.com/susalm/mushaf-altibyan-/main/tafsir-mcp-main/data/aysar/${surahNumber}/${ayahNumber}.json`
    ];

    for (const url of aysarUrls) {
      try {
        const ghRes = await fetch(url);
        if (ghRes.ok) {
          const data = await ghRes.json();
          const textVal = data.text || data.result || data.tafsir || data.content;
          if (textVal) {
            return {
              status: "success",
              text: textVal,
              result: textVal,
              source: "أيسر التفاسير لكلام العلي الكبير - مستودع التبيان (https://github.com/susalm/mushaf-altibyan-/tree/main/tafsir-mcp-main)"
            };
          }
        }
      } catch (_) {}
    }
  }

  try {
    const res = await fetch("/api/tafsir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surahNumber, ayahNumber, mode, type: mode }),
    });
    if (res.ok) {
      const text = await res.text();
      if (!isHtmlResponse(text)) {
        const json = JSON.parse(text);
        if (json && (json.text || json.result)) {
          return {
            status: "success",
            text: json.text || json.result,
            result: json.result || json.text,
            source: json.source
          };
        }
      }
    }
  } catch (err) {
    console.warn("Local tafsir API failed, falling back to offline generator:", err);
  }

  if (mode === "tafsir_mukhtasar" || mode === "tafsir-mukhtasar") {
    const fallback = getOfflineMukhtasarTafsirFallback(surahNumber, ayahNumber);
    return {
      status: "success",
      text: fallback,
      result: fallback,
      source: "المختصر في تفسير القرآن الكريم (مركز تفسير للدراسات القرآنية)"
    };
  }

  if (mode === "tafsir_aysar" || mode === "tafsir-aysar") {
    const fallback = getOfflineAysarTafsirFallback(surahNumber, ayahNumber);
    return {
      status: "success",
      text: fallback,
      result: fallback,
      source: "أيسر التفاسير لكلام العلي الكبير (الشيخ أبو بكر الجزائري)"
    };
  }

  if (mode === "tafsir_waseet" || mode === "tafsir_waseet_tantawi") {
    try {
      const qtsRes = await fetch(`http://api.quran-tafseer.com/tafseer/5/${surahNumber}/${ayahNumber}`);
      if (qtsRes.ok) {
        const qtsData = await qtsRes.json();
        if (qtsData?.text) {
          return {
            status: "success",
            text: qtsData.text,
            result: qtsData.text,
            source: "التفسير الوسيط للقرآن الكريم (د. محمد سيد طنطاوي)"
          };
        }
      }
    } catch (e) {}

    try {
      const fbData = await fetchAlquranCloud(`v1/ayah/${surahNumber}:${ayahNumber}/ar.waseet`);
      if (fbData?.data?.text) {
        return {
          status: "success",
          text: fbData.data.text,
          result: fbData.data.text,
          source: "التفسير الوسيط للقرآن الكريم (د. محمد سيد طنطاوي)"
        };
      }
    } catch (e) {}
  }

  // Fallback for translations or tafsirs
  const isTranslation = mode === "english" || mode === "translation" || mode.startsWith("translation_") || mode.includes("en.") || mode.includes("fr.") || mode.includes("ur.") || mode.includes("id.") || mode.includes("bn.");
  const edition = isTranslation
    ? (mode === "translation_clear_quran" || mode === "translation_mukhtasar_en" ? "en.itani" :
       mode === "translation_french" ? "fr.hamidullah" :
       mode === "translation_urdu" ? "ur.jalandhry" :
       mode === "translation_indonesian" ? "id.indonesian" :
       mode === "translation_mukhtasar_bn" ? "bn.bengali" :
       mode === "translation_hilali_khan" ? "en.hilali" : "en.sahih")
    : "ar.muyassar";

  try {
    const fallbackJson = await fetchAlquranCloud(`v1/ayah/${surahNumber}:${ayahNumber}/${edition}`);
    if (fallbackJson?.data?.text) {
      return {
        status: "success",
        text: fallbackJson.data.text,
        result: fallbackJson.data.text,
        source: isTranslation ? "الترجمة المعتمدة" : "التفسير الميسر",
      };
    }
  } catch (e) {
    console.warn("fetchAlquranCloud failed, using offline fallback:", e);
  }

  if (isTranslation) {
    const offlineEn = getOfflineEnglishTranslation(surahNumber, ayahNumber);
    if (offlineEn) {
      return {
        status: "success",
        text: offlineEn,
        result: offlineEn,
        source: "الترجمة الإنجليزية المعتمدة (Sahih International - بدون إنترنت)",
      };
    }
    return {
      status: "success",
      text: "Translation temporarily unavailable offline.",
      result: "Translation temporarily unavailable offline.",
      source: "الترجمة",
    };
  }

  const offlineAny = getOfflineAysarTafsir(surahNumber, ayahNumber) || getOfflineMukhtasarTafsir(surahNumber, ayahNumber) || getOfflineAysarTafsirFallback(surahNumber, ayahNumber);
  return {
    status: "success",
    text: offlineAny,
    result: offlineAny,
    source: "التفسير المتاح بدون إنترنت",
  };
}
