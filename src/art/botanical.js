// Hand-drawn botanical sprigs in the same engraved line style as the cupids:
// fine ink outlines over wine burgundy blossoms and deep moss foliage.

import { PI, cubic, pt, tangentAt } from './geom.js';

const LEAF_INK = '#2f3216';
const LEAF_WASH = '#5c6130';
const STEM = '#3f4320';
const PETAL_INK = '#3e0c13';
const PETAL_WASH = '#7a1e29';
const HEART_WASH = '#d8bf86';

const deg = (r) => (r * 180) / PI;
// Small deterministic jitter so repeated leaves and petals don't look stamped.
const jitter = (seed) => { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280) - 0.5; };

// Leaf pointing along +x from its base at 0,0.
function leaf(L, W) {
  return `
  <path d="M0 0C${pt([L * 0.28, -W])} ${pt([L * 0.72, -W * 0.85])} ${pt([L, 0])}C${pt([L * 0.72, W * 0.85])} ${pt([L * 0.28, W])} 0 0Z"
    fill="${LEAF_WASH}" fill-opacity=".92" stroke="${LEAF_INK}" stroke-width=".7"/>
  <path d="M${pt([L * 0.04, 0])}Q${pt([L * 0.5, W * 0.12])} ${pt([L * 0.9, 0])}" fill="none" stroke="${LEAF_INK}" stroke-width=".45"/>
  <path d="M${pt([L * 0.3, W * 0.05])}l${pt([L * 0.14, -W * 0.55])}M${pt([L * 0.52, W * 0.06])}l${pt([L * 0.12, -W * 0.5])}M${pt([L * 0.4, W * 0.06])}l${pt([L * 0.12, W * 0.48])}M${pt([L * 0.62, W * 0.05])}l${pt([L * 0.1, W * 0.42])}"
    fill="none" stroke="${LEAF_INK}" stroke-width=".3" stroke-linecap="round"/>`;
}

// Five-petal blossom centred on 0,0.
function blossom(r, seed = 1) {
  const j = jitter(seed);
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const a = deg((2 * PI * i) / 5) + j() * 14;
    const R = r * (1 + j() * 0.12);
    petals += `<g transform="rotate(${a.toFixed(1)})">
      <path d="M0 0C${pt([R * 0.25, -R * 0.62])} ${pt([R * 0.95, -R * 0.72])} ${pt([R * 1.02, -R * 0.12])}Q${pt([R * 0.92, 0])} ${pt([R * 1.02, R * 0.12])}C${pt([R * 0.95, R * 0.72])} ${pt([R * 0.25, R * 0.62])} 0 0Z"
        fill="${PETAL_WASH}" fill-opacity=".97" stroke="${PETAL_INK}" stroke-width=".6"/>
      <path d="M${pt([R * 0.3, 0])}Q${pt([R * 0.55, R * 0.04])} ${pt([R * 0.72, -R * 0.02])}" fill="none" stroke="${PETAL_INK}" stroke-width=".3" stroke-opacity=".7"/>
    </g>`;
  }
  let stamens = '';
  for (let i = 0; i < 7; i++) {
    const a = (2 * PI * i) / 7 + 0.3;
    const p = [Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34];
    stamens += `<path d="M0 0L${pt(p)}" /><circle cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="${(r * 0.05).toFixed(2)}" fill="${PETAL_INK}"/>`;
  }
  return `${petals}
  <g stroke="${PETAL_INK}" stroke-width=".3">${stamens}</g>
  <circle r="${(r * 0.17).toFixed(2)}" fill="${HEART_WASH}" stroke="${PETAL_INK}" stroke-width=".45"/>`;
}

// Closed bud: a teardrop of petals with a little calyx.
function bud(r) {
  return `
  <path d="M0 0C${pt([r * 0.4, -r * 0.7])} ${pt([r * 1.5, -r * 0.6])} ${pt([r * 1.8, 0])}C${pt([r * 1.5, r * 0.6])} ${pt([r * 0.4, r * 0.7])} 0 0Z"
    fill="${PETAL_WASH}" fill-opacity=".97" stroke="${PETAL_INK}" stroke-width=".6"/>
  <path d="M${pt([r * 0.5, 0])}Q${pt([r * 1.1, -r * 0.1])} ${pt([r * 1.7, 0])}" fill="none" stroke="${PETAL_INK}" stroke-width=".3"/>
  <path d="M0 0Q${pt([r * 0.5, -r * 0.6])} ${pt([r * 0.8, -r * 0.35])}M0 0Q${pt([r * 0.5, r * 0.6])} ${pt([r * 0.8, r * 0.35])}"
    fill="${LEAF_WASH}" fill-opacity=".5" stroke="${LEAF_INK}" stroke-width=".55"/>`;
}

const berry = (r) => `<circle r="${r}" fill="${PETAL_WASH}" stroke="${PETAL_INK}" stroke-width=".5"/>
  <path d="M${pt([-r * 0.45, -r * 0.1])}A${r * 0.55} ${r * 0.55} 0 0 1 ${pt([-r * 0.05, -r * 0.5])}" fill="none" stroke="#fff" stroke-width=".5" stroke-opacity=".9"/>`;

const at = ([x, y], a, body) => `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${a.toFixed(1)})">${body}</g>`;

// A stem drawn from its base (t=0) to its tip (t=1), dressed with alternating leaves
// and finished with a bud. `flowers` are [t, side, size] blossoms on short side twigs.
export function sprig(curve, { leaves = 8, leafL = 22, flowers = [], berries = [], tipBud = 6, seed = 1, skip = 0.06 } = {}) {
  const j = jitter(seed);
  let stemD = `M${pt(curve(0))}`;
  for (let i = 1; i <= 40; i++) stemD += `L${pt(curve(i / 40))}`;
  let out = `<path d="${stemD}" fill="none" stroke="${STEM}" stroke-width="1" stroke-linecap="round"/>`;

  for (let i = 0; i < leaves; i++) {
    const t = skip + (i / leaves) * (0.94 - skip);
    const side = i % 2 ? 1 : -1;
    const [tx, ty] = tangentAt(curve, t);
    const a = deg(Math.atan2(ty, tx)) + side * (42 + j() * 12);
    const scale = 1 - 0.45 * t;
    out += at(curve(t), a, leaf(leafL * scale * (1 + j() * 0.15), leafL * scale * 0.32));
  }

  for (const [t, side, size] of flowers) {
    const p = curve(t);
    const [tx, ty] = tangentAt(curve, t);
    const a = Math.atan2(ty, tx) + side * 0.95;
    const L = size * 1.6;
    const q = [p[0] + Math.cos(a) * L, p[1] + Math.sin(a) * L];
    out += `<path d="M${pt(p)}Q${pt([p[0] + Math.cos(a - side * 0.4) * L * 0.6, p[1] + Math.sin(a - side * 0.4) * L * 0.6])} ${pt(q)}" fill="none" stroke="${STEM}" stroke-width=".7"/>`;
    out += at(q, j() * 40, blossom(size, Math.round(t * 100) + seed));
  }

  for (const [t, side, r] of berries) {
    const p = curve(t);
    const [tx, ty] = tangentAt(curve, t);
    for (let k = 0; k < 3; k++) {
      const a = Math.atan2(ty, tx) + side * (0.5 + k * 0.45);
      const L = r * (3 + k * 0.6);
      const q = [p[0] + Math.cos(a) * L, p[1] + Math.sin(a) * L];
      out += `<path d="M${pt(p)}L${pt(q)}" stroke="${STEM}" stroke-width=".45"/>` + at(q, 0, berry(r));
    }
  }

  if (tipBud) {
    const [tx, ty] = tangentAt(curve, 1);
    out += at(curve(1), deg(Math.atan2(ty, tx)), bud(tipBud));
  }
  return out;
}

// ── Page 1: a floral crest above the photo booth frame ─────────────────────
// Frame coordinates (viewBox "0 -110 300 730"); the frame's top edge is at y≈28.
export function boothFloralsSVG() {
  const C = [150, -44];
  const arm = (s) => cubic([C[0] + 6 * s, C[1] + 4], [C[0] + 40 * s, C[1] - 18], [C[0] + 92 * s, C[1] - 6], [C[0] + 124 * s, C[1] + 34]);
  const upper = (s) => cubic([C[0] + 4 * s, C[1] - 6], [C[0] + 18 * s, C[1] - 34], [C[0] + 44 * s, C[1] - 46], [C[0] + 66 * s, C[1] - 44]);
  return `
  ${sprig(upper(-1), { leaves: 5, leafL: 15, tipBud: 4.5, seed: 3, berries: [[0.45, 1, 2.4]] })}
  ${sprig(upper(1), { leaves: 5, leafL: 15, tipBud: 4.5, seed: 4, berries: [[0.45, -1, 2.4]] })}
  ${sprig(arm(-1), { leaves: 9, leafL: 19, tipBud: 5, seed: 1, flowers: [[0.38, 1, 9], [0.7, -1, 7]] })}
  ${sprig(arm(1), { leaves: 9, leafL: 19, tipBud: 5, seed: 2, flowers: [[0.38, -1, 9], [0.7, 1, 7]] })}
  ${at(C, 8, blossom(15, 7))}`;
}

// ── Page 2: little sprays tucked onto the carved plate ─────────────────────
// Hero coordinates (viewBox "0 0 400 460"); the plate spans x 38–262, y 2–262 (PLATE in hero.js).
export function heroFloralsSVG() {
  return `
  ${sprig(cubic([40, 252], [28, 230], [26, 200], [30, 172]), { leaves: 7, leafL: 17, tipBud: 5, seed: 21, flowers: [[0.5, 1, 8]], berries: [[0.75, -1, 2.4]] })}
  ${sprig(cubic([46, 262], [66, 274], [88, 278], [112, 276]), { leaves: 6, leafL: 16, tipBud: 5, seed: 22, flowers: [[0.55, -1, 7]] })}
  ${at([30, 262], 0, blossom(9, 23))}
  ${at([44, 256], 30, blossom(12, 24))}
  ${sprig(cubic([254, 4], [236, -6], [216, -8], [198, -6]), { leaves: 5, leafL: 13, tipBud: 4, seed: 25, berries: [[0.5, -1, 2.2]] })}
  ${sprig(cubic([258, 10], [266, 28], [268, 46], [266, 64]), { leaves: 5, leafL: 13, tipBud: 4, seed: 26, flowers: [[0.6, 1, 6]] })}
  ${at([256, 6], 15, blossom(9, 27))}`;
}
