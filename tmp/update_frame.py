import xml.etree.ElementTree as ET

ET.register_namespace('', 'http://www.w3.org/2000/svg')
with open('public/quran-soura-112-frame.svg', 'r', encoding='utf-8') as f:
    text = f.read()

root = ET.fromstring(text)
defs = root.find('{http://www.w3.org/2000/svg}defs')
defs_str = ET.tostring(defs, encoding='unicode')
# find first '>' and last '</'
first_gt = defs_str.index('>')
last_lt = defs_str.rindex('</')
inner_defs = defs_str[first_gt + 1:last_lt].strip()

g = root.find('{http://www.w3.org/2000/svg}g')
g_str = ET.tostring(g, encoding='unicode').strip()

# Add classes to specific paths for CSS styling
g_str = g_str.replace('id="path4395"', 'id="path4395" class="surah_frame_cartouche_bg"')
g_str = g_str.replace('id="path3369"', 'id="path3369" class="surah_frame_outer_border"')
g_str = g_str.replace('id="path3371"', 'id="path3371" class="surah_frame_inner_contour"')

inner_defs_escaped = inner_defs.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
g_str_escaped = g_str.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

out_ts = f'''// Authentic Medina Mushaf Surah Header SVG Template (Extracted from authentic Quran Medina Mushaf source)
// High-fidelity vector contours, ornaments, and cartouche for Surah header frame

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

export function getAuthenticSurahFrameSvg(id: string = "mushaf_surah_frame"): string {{
  const {{ scopedDefs, scopedBody }} = getAuthenticFrameSvgInner(id);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240.20621 30.23196" width="240.20621" height="30.23196" fill="none">
    <defs>
      <style>
        .surah_frame_outer_border {{ fill: none !important; stroke: currentColor !important; }}
        .surah_frame_cartouche_bg {{ fill: none !important; stroke: none !important; }}
        .surah_frame_inner_contour {{ fill: rgba(0,0,0,0.04) !important; stroke: currentColor !important; }}
      </style>
      ${{scopedDefs}}
    </defs>
    ${{scopedBody}}
  </svg>`;
}}
'''

with open('src/utils/mushafFrameSvgData.ts', 'w', encoding='utf-8') as f:
    f.write(out_ts)

print("SUCCESS: Updated src/utils/mushafFrameSvgData.ts with clean, valid XML!")
