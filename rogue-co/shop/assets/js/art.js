// Flat SVG garment illustrations, recolored per colorway.
// These stand in for product photography: replace `art()` calls with <img> tags once real photos exist.
// A type can carry a graphic print after a colon, e.g. "tee:sun" draws the Night Tide tee.

const EMBER = "#d2542b";
const OCHRE = "#e6a23c";
const INK = "#0d1222";
const COTTON = "#f2ebdf";

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

const wordmark = (fill, x, y, size = 13) =>
  `<text x="${x}" y="${y}" fill="${fill}" font-family="'DM Serif Display', Georgia, serif" font-size="${size}" text-anchor="middle">R&amp;Co</text>`;

/* ---------- Graphic prints for tees (drawn around the chest, centre ≈ 100,108) ---------- */
const PRINTS = {
  sun: (c, l) => `
    <circle cx="100" cy="100" r="24" fill="${OCHRE}"/>
    <path d="M76 100 A24 24 0 0 1 124 100 Z" fill="${EMBER}" opacity=".85"/>
    <g fill="${c}"><rect x="74" y="104" width="52" height="3"/><rect x="74" y="111" width="52" height="3"/><rect x="74" y="118" width="52" height="3"/></g>
    <path d="M70 130 Q80 124 90 130 T110 130 T130 130" fill="none" stroke="${l}" stroke-width="2.5" stroke-linecap="round"/>
    <text x="100" y="148" fill="${l}" font-family="'DM Serif Display', Georgia, serif" font-size="9" letter-spacing="1" text-anchor="middle" textLength="58" lengthAdjust="spacingAndGlyphs">NIGHT TIDE</text>`,
  wave: (c, l) => `
    <g fill="none" stroke-width="5" stroke-linecap="round">
      <path d="M68 96 Q78 84 88 96 T108 96 T128 96" stroke="${EMBER}"/>
      <path d="M68 112 Q78 100 88 112 T108 112 T128 112" stroke="${OCHRE}"/>
      <path d="M68 128 Q78 116 88 128 T108 128 T128 128" stroke="${l}"/>
    </g>
    <text x="100" y="150" fill="${l}" font-family="'DM Serif Display', Georgia, serif" font-size="9" text-anchor="middle" textLength="58" lengthAdjust="spacingAndGlyphs">TIDE &amp; RIOT</text>`,
  bloom: () => `
    <g fill="${OCHRE}">
      ${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="100" cy="92" rx="8" ry="15" transform="rotate(${a} 100 110)"/>`).join("")}
    </g>
    <circle cx="100" cy="110" r="10" fill="${EMBER}"/>`,
  lines: (c, l) => `
    <g stroke="${l}" stroke-width="3" stroke-linecap="round">
      <path d="M72 88 H128"/><path d="M76 98 H124" opacity=".85"/><path d="M70 108 H112" opacity=".7"/>
      <path d="M84 118 H130" opacity=".55"/><path d="M74 128 H104" opacity=".4"/><path d="M92 138 H122" opacity=".25"/>
    </g>
    <rect x="112" y="104" width="10" height="8" fill="${EMBER}"/>`,
};

/* ---------- Garment silhouettes ---------- */
const LONG_BODY = "M66 34 L88 24 Q100 36 112 24 L134 34 L160 60 L178 184 L158 188 L140 98 L140 206 L60 206 L60 98 L42 188 L22 184 L40 60 Z";
const SHORT_BODY = "M62 38 L86 26 Q100 40 114 26 L138 38 L172 66 L154 92 L138 82 L138 204 L62 204 L62 82 L46 92 L28 66 Z";

const placket = (d, l, from = 52, to = 196) => `
  <path d="M100 ${from} V${to + 8}" stroke="${d}" stroke-width="2.5"/>
  <g fill="${l}" opacity=".8">${[0, 1, 2, 3, 4].map((i) => `<circle cx="104" cy="${from + 14 + i * ((to - from - 14) / 4)}" r="2.2"/>`).join("")}</g>`;

function legs(c, d, top, wide = false) {
  const hem = wide ? [44, 156] : [52, 148];
  return `<rect class="g" x="62" y="${top}" width="76" height="14" rx="2" fill="${d}"/>
    <path class="g" d="M62 ${top + 14} H138 L${hem[1]} 216 H108 L100 ${top + 70} L92 216 H${hem[0]} Z" fill="${c}"/>
    <path d="M100 ${top + 14} V${top + 64}" stroke="${d}" stroke-width="3"/>`;
}

const SHAPES = {
  tee: (c, d, l, print) => `
    <path class="g" d="${SHORT_BODY}" fill="${c}"/>
    <path d="M86 26 Q100 42 114 26" fill="none" stroke="${d}" stroke-width="5"/>
    <path d="M64 196 H136" stroke="${d}" stroke-width="2" opacity=".5"/>
    ${print && PRINTS[print] ? PRINTS[print](c, l) : wordmark(l, 100, 92)}`,

  shirt: (c, d, l) => `
    <path class="g" d="${LONG_BODY}" fill="${c}"/>
    <path d="M84 24 L100 44 L116 24 L122 36 L100 56 L78 36 Z" fill="${shade(c, -0.08)}" stroke="${d}" stroke-width="1.5"/>
    ${placket(d, d)}
    <rect x="112" y="80" width="18" height="20" rx="2" fill="none" stroke="${d}" stroke-width="2"/>
    <path d="M24 172 L42 176 M176 172 L158 176" stroke="${d}" stroke-width="4"/>`,

  overshirt: (c, d, l) => `
    <path class="g" d="${LONG_BODY}" fill="${c}"/>
    <path d="M82 24 L100 46 L118 24 L126 34 L100 60 L74 34 Z" fill="${d}"/>
    ${placket(shade(d, -0.2), l, 56)}
    <g fill="none" stroke="${d}" stroke-width="2.5">
      <rect x="68" y="78" width="24" height="26" rx="2"/><path d="M68 86 H92"/>
      <rect x="108" y="78" width="24" height="26" rx="2"/><path d="M108 86 H132"/>
    </g>
    <path d="M24 172 L42 176 M176 172 L158 176" stroke="${d}" stroke-width="5"/>`,

  camp: (c, d, l) => `
    <path class="g" d="${SHORT_BODY}" fill="${c}"/>
    <path d="M86 26 L100 58 L114 26 L126 32 L108 60 L100 58 L92 60 L74 32 Z" fill="${shade(c, -0.1)}" stroke="${d}" stroke-width="1.5"/>
    ${placket(d, d, 60, 190)}
    <path d="M46 90 L56 84 M154 90 L144 84" stroke="${d}" stroke-width="3" opacity=".6"/>`,

  denim: (c, d) => `${legs(c, d, 20)}
    <g fill="none" stroke="${OCHRE}" stroke-width="1.6" stroke-dasharray="4 3">
      <path d="M68 38 Q76 60 96 46"/><path d="M132 38 Q124 60 104 46"/>
      <path d="M58 44 L52 214 M142 44 L148 214"/>
    </g>
    <circle cx="100" cy="27" r="3" fill="#b8893a"/>`,

  trouser: (c, d, l) => `${legs(c, d, 20, true)}
    <path d="M94 28 Q90 48 86 56 M106 28 Q110 48 114 56" stroke="${l}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M70 40 Q74 70 66 96 M130 40 Q126 70 134 96" stroke="${d}" stroke-width="2" fill="none" opacity=".6"/>`,
};

export function art(type, hex, label = "") {
  const [shape, print] = String(type).split(":");
  const draw = SHAPES[shape] ?? SHAPES.tee;
  const dark = shade(hex, -0.28);
  const ink = luminance(hex) > 0.55 ? INK : COTTON;
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="garment" viewBox="0 0 200 230" ${a11y} focusable="false">${draw(hex, dark, ink, print)}</svg>`;
}
