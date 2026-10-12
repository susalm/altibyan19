import xml.etree.ElementTree as ET
import re

ET.register_namespace('', 'http://www.w3.org/2000/svg')

with open('public/quran-soura-112-frame.svg', 'r', encoding='utf-8') as f:
    text = f.read()

root = ET.fromstring(text)
defs = root.find('{http://www.w3.org/2000/svg}defs')
defs_str = ET.tostring(defs, encoding='unicode')
first_gt = defs_str.index('>')
last_lt = defs_str.rindex('</')
inner_defs = defs_str[first_gt + 1:last_lt].strip()

g = root.find('{http://www.w3.org/2000/svg}g')
g_str = ET.tostring(g, encoding='unicode').strip()

# Add classes to specific paths for CSS styling
g_str = g_str.replace('id="path4395"', 'id="path4395" class="surah_frame_cartouche_bg"')
g_str = g_str.replace('id="path3369"', 'id="path3369" class="surah_frame_outer_border"')
g_str = g_str.replace('id="path3371"', 'id="path3371" class="surah_frame_inner_contour"')

# Now inject the theme CSS variables into defs:
# In linear and radial gradients:
# #43b4e5 is the mid-gradient color
inner_defs = inner_defs.replace('#43b4e5', 'var(--surah-grad-mid, #43b4e5)')
# #126183 is the deep-gradient color
inner_defs = inner_defs.replace('#126183', 'var(--surah-grad-deep, #126183)')
# #ffffff in gradients is the high-gradient color
inner_defs = inner_defs.replace('stop-color:#ffffff', 'stop-color:var(--surah-grad-high, #ffffff)')
inner_defs = inner_defs.replace('stop-color:#f9fcfe', 'stop-color:var(--surah-highlight, #ffffff)')

# Now inject the theme CSS variables into body:
# #1c7897 is the deep accent color
g_str = g_str.replace('fill:#1c7897', 'fill:var(--surah-accent-deep, #1c7897)')
# #6ec5eb is the solid accent color
g_str = g_str.replace('fill:#6ec5eb', 'fill:var(--surah-accent-solid, #6ec5eb)')
# #000000 strokes (contours, ornaments, frames)
g_str = g_str.replace('stroke:#000000', 'stroke:var(--surah-frame-stroke, currentColor)')

inner_defs_escaped = inner_defs.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
g_str_escaped = g_str.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

out_ts = f'''// Authentic Medina Mushaf Surah Header SVG Template (Extracted from authentic Quran Medina Mushaf source)
// High-fidelity vector contours, ornaments, and cartouche for Surah header frame
// Fully responsive to themes: Gold, Emerald, Navy, and Dark mode via CSS custom variables

import {{ getSurahHeaderGlyph }} from "./qcf4Utils";

const RAW_DEFS_TEMPLATE = `{inner_defs_escaped}`;

const RAW_BODY_TEMPLATE = `{g_str_escaped}`;

export function getAuthenticFrameSvgInner(id: string): {{ scopedDefs: string; scopedBody: string }} {{
  const scopedDefs = RAW_DEFS_TEMPLATE
    .replace(/id="([^"]+)"/g, `id="$1_${{id}}"`)
    .replace(/url\\(#([^)]+)\\)/g, `url(#$1_${{id}})`);

  const scopedBody = RAW_BODY_TEMPLATE
    .replace(/id="([^"]+)"/g, `id="$1_${{id}}"`)
    .replace(/url\\(#([^)]+)\\)/g, `url(#$1_${{id}})`);

  return {{ scopedDefs, scopedBody }};
}}

export function getAuthenticFrameSvg(
  id: string = "mushaf_surah_frame",
  x?: number,
  y?: number,
  width?: number,
  height?: number,
  surahNumber?: number,
  surahName?: string
): string {{
  const {{ scopedDefs, scopedBody }} = getAuthenticFrameSvgInner(id);
  const defsBlock = `<defs>
    <style>
      .surah_frame_outer_border {{ fill: none !important; stroke: currentColor !important; }}
      .surah_frame_cartouche_bg {{ fill: none !important; stroke: none !important; }}
      .surah_frame_inner_contour {{ fill: var(--surah-inner-fill, rgba(0,0,0,0.04)) !important; stroke: currentColor !important; }}
    </style>
    ${{scopedDefs}}
  </defs>`;

  let textElement = "";
  if (surahNumber) {{
    const glyph = getSurahHeaderGlyph(surahNumber, surahName);
    if (glyph) {{
      textElement = `<text x="120.103" y="15.8" text-anchor="middle" dominant-baseline="central" class="surah_header_text" font-family="'QCF4_QBSML', 'Amiri', serif" font-size="14.5" fill="currentColor">${{glyph}}</text>`;
    }}
  }}

  if (x !== undefined && y !== undefined && width !== undefined && height !== undefined) {{
    return `<svg id="${{id}}" class="surah_header_frame" x="${{x}}" y="${{y}}" width="${{width}}" height="${{height}}" viewBox="0 0 240.20621 30.23196" fill="none" overflow="visible">
      ${{defsBlock}}
      ${{scopedBody}}
      ${{textElement}}
    </svg>`;
  }}

  return `<svg xmlns="http://www.w3.org/2000/svg" class="surah_header_frame" viewBox="0 0 240.20621 30.23196" width="240.20621" height="30.23196" fill="none">
    ${{defsBlock}}
    ${{scopedBody}}
    ${{textElement}}
  </svg>`;
}}

export const getAuthenticSurahFrameSvg = getAuthenticFrameSvg;
'''

with open('src/utils/mushafFrameSvgData.ts', 'w', encoding='utf-8') as f:
    f.write(out_ts)

print("SUCCESS: Updated mushafFrameSvgData.ts with theme CSS variables!")
