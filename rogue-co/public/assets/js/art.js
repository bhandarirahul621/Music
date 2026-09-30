// Flat SVG garment illustrations, recolored per colorway.
// These stand in for product photography: replace `art()` calls with <img> tags once real photos exist.

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const target = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  const mix = (c) => Math.round((target - c) * p + c);
  const r = mix(n >> 16), g = mix((n >> 8) & 255), b = mix(n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

const logo = (fill, x, y, size = 13) =>
  `<text x="${x}" y="${y}" fill="${fill}" font-family="Anton, Impact, 'Arial Narrow', sans-serif" font-size="${size}" text-anchor="middle" letter-spacing="1">R&amp;CO</text>`;

const LONG_BODY = "M66 34 L88 24 Q100 36 112 24 L134 34 L160 60 L178 184 L158 188 L140 98 L140 206 L60 206 L60 98 L42 188 L22 184 L40 60 Z";

function legs(c, d, top) {
  return `<rect class="g" x="62" y="${top}" width="76" height="14" rx="2" fill="${d}"/>
    <path class="g" d="M62 ${top + 14} H138 L148 216 H108 L100 ${top + 70} L92 216 H52 Z" fill="${c}"/>
    <path d="M100 ${top + 14} V${top + 64}" stroke="${d}" stroke-width="3"/>`;
}

const SHAPES = {
  tee: (c, d, l) => `
    <path class="g" d="M62 38 L86 26 Q100 40 114 26 L138 38 L172 66 L154 92 L138 82 L138 204 L62 204 L62 82 L46 92 L28 66 Z" fill="${c}"/>
    <path d="M86 26 Q100 42 114 26" fill="none" stroke="${d}" stroke-width="5"/>
    <path d="M64 196 H136" stroke="${d}" stroke-width="2" opacity=".5"/>
    ${logo(l, 100, 92)}`,

  longsleeve: (c, d, l) => `
    <path class="g" d="${LONG_BODY}" fill="${c}"/>
    <path d="M88 24 Q100 40 112 24" fill="none" stroke="${d}" stroke-width="5"/>
    <rect x="60" y="194" width="80" height="12" fill="${d}" opacity=".45"/>
    <path d="M24 172 L42 176 M176 172 L158 176" stroke="${d}" stroke-width="4"/>
    ${logo(l, 100, 90)}`,

  hoodie: (c, d, l) => `
    <path class="g" d="M76 36 Q72 4 100 2 Q128 4 124 36 Z" fill="${d}"/>
    <path class="g" d="${LONG_BODY}" fill="${c}"/>
    <path d="M78 34 Q80 8 100 6 Q120 8 122 34 Q100 48 78 34 Z" fill="${c}"/>
    <path d="M88 32 Q90 16 100 14 Q110 16 112 32 Q100 40 88 32 Z" fill="${shade(d, -0.35)}"/>
    <path d="M94 42 L92 74 M106 42 L108 74" stroke="${l}" stroke-width="3" stroke-linecap="round"/>
    <path d="M72 150 H128 L136 190 H64 Z" fill="none" stroke="${d}" stroke-width="3"/>
    <rect x="60" y="194" width="80" height="12" fill="${d}" opacity=".45"/>
    ${logo(l, 100, 112)}`,

  jacket: (c, d, l) => `
    <path class="g" d="${LONG_BODY}" fill="${c}"/>
    <path d="M84 24 L100 52 L116 24 L126 30 L100 64 L74 30 Z" fill="${d}"/>
    <path d="M100 52 V206" stroke="${d}" stroke-width="3"/>
    <g fill="${l}" opacity=".85"><circle cx="106" cy="80" r="2.5"/><circle cx="106" cy="112" r="2.5"/><circle cx="106" cy="144" r="2.5"/><circle cx="106" cy="176" r="2.5"/></g>
    <rect x="114" y="76" width="18" height="20" rx="2" fill="none" stroke="${d}" stroke-width="2.5"/>
    <path d="M68 150 L78 176 M132 150 L122 176" stroke="${d}" stroke-width="3"/>`,

  puffer: (c, d, l) => `
    <path class="g" d="${LONG_BODY}" fill="${c}"/>
    <path d="M80 22 Q100 36 120 22 L126 44 Q100 58 74 44 Z" fill="${d}"/>
    <g stroke="${d}" stroke-width="3" opacity=".8">
      <path d="M60 86 H140 M60 116 H140 M60 146 H140 M60 176 H140"/>
      <path d="M34 100 L46 98 M154 98 L166 100 M30 130 L48 128 M152 128 L170 130 M27 160 L50 158 M150 158 L173 160"/>
    </g>
    <path d="M100 50 V206" stroke="${shade(d, -0.3)}" stroke-width="3"/>
    ${logo(l, 120, 104, 9)}`,

  pants: (c, d) => `${legs(c, d, 20)}
    <path d="M58 200 H94 M106 200 H144" stroke="${d}" stroke-width="2" opacity=".5"/>`,

  cargo: (c, d) => `${legs(c, d, 20)}
    <rect x="58" y="116" width="26" height="32" rx="3" fill="none" stroke="${d}" stroke-width="3"/>
    <rect x="116" y="116" width="26" height="32" rx="3" fill="none" stroke="${d}" stroke-width="3"/>
    <path d="M58 124 H84 M116 124 H142" stroke="${d}" stroke-width="3"/>`,

  denim: (c, d) => `${legs(c, d, 20)}
    <g fill="none" stroke="#d9a441" stroke-width="1.6" stroke-dasharray="4 3">
      <path d="M68 38 Q76 60 96 46"/><path d="M132 38 Q124 60 104 46"/>
      <path d="M58 44 L52 214 M142 44 L148 214"/>
    </g>
    <circle cx="100" cy="27" r="3" fill="#b8893a"/>`,

  shorts: (c, d, l) => `
    <rect class="g" x="60" y="50" width="80" height="16" rx="3" fill="${d}"/>
    <path class="g" d="M60 66 H140 L152 170 H106 L100 118 L94 170 H48 Z" fill="${c}"/>
    <path d="M96 60 Q92 80 88 86 M104 60 Q108 80 112 86" stroke="${l}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M100 66 V110" stroke="${d}" stroke-width="2"/>`,

  cap: (c, d, l) => `
    <path class="g" d="M40 140 Q42 62 100 58 Q158 62 160 140 Z" fill="${c}"/>
    <path d="M100 60 V140 M70 70 Q62 104 64 140 M130 70 Q138 104 136 140" stroke="${d}" stroke-width="2" fill="none" opacity=".7"/>
    <circle cx="100" cy="59" r="5" fill="${d}"/>
    <path class="g" d="M34 140 Q100 126 166 140 Q172 166 100 170 Q28 166 34 140 Z" fill="${d}"/>
    ${logo(l, 100, 116, 16)}`,

  beanie: (c, d, l) => `
    <path class="g" d="M54 150 Q52 48 100 46 Q148 48 146 150 Z" fill="${c}"/>
    <g stroke="${d}" stroke-width="2" opacity=".35">
      <path d="M70 60 V140 M85 52 V140 M100 48 V140 M115 52 V140 M130 60 V140"/>
    </g>
    <rect class="g" x="46" y="124" width="108" height="50" rx="10" fill="${d}"/>
    <g stroke="${shade(d, -0.3)}" stroke-width="2" opacity=".5">
      ${Array.from({ length: 12 }, (_, i) => `<path d="M${54 + i * 8.5} 128 V170"/>`).join("")}
    </g>
    <rect x="80" y="138" width="40" height="20" rx="2" fill="${l}"/>
    ${logo(luminance(l) > 0.5 ? "#1a1a1a" : "#f3efe6", 100, 153, 11)}`,

  tote: (c, d, l) => `
    <path d="M72 86 Q72 28 100 28 Q128 28 128 86" fill="none" stroke="${d}" stroke-width="9" stroke-linecap="round"/>
    <rect class="g" x="38" y="80" width="124" height="138" rx="4" fill="${c}"/>
    <rect x="38" y="80" width="124" height="14" fill="${d}" opacity=".35"/>
    ${logo(l, 100, 160, 24)}`,
};

export function art(type, hex, label = "") {
  const draw = SHAPES[type] ?? SHAPES.tee;
  const dark = shade(hex, -0.28);
  const ink = luminance(hex) > 0.55 ? "#1a1a1a" : "#f3efe6";
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="garment" viewBox="0 0 200 230" ${a11y} focusable="false">${draw(hex, dark, ink)}</svg>`;
}
