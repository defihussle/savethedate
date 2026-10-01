// Page 1 artwork: the carved gold frame / photo booth, and the satin bow it hangs from.
// Shared coordinate system: viewBox "0 -110 300 730". The frame occupies y 0–620,
// the bow and its ribbon live in the 110 units above it.

import { PI, cubic, spiral, taper, lineW, lerp, tangentAt, ribbon } from './geom.js';

export const BOOTH_VIEWBOX = '0 -110 300 730';
export const SLOT_Y = 113; // centre line of the printing slot, frame units

function notchedRect(x0, y0, x1, y1, r) {
  return `M${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 0 ${x1} ${y0 + r}V${y1 - r}` +
    `A${r} ${r} 0 0 0 ${x1 - r} ${y1}H${x0 + r}A${r} ${r} 0 0 0 ${x0} ${y1 - r}V${y0 + r}` +
    `A${r} ${r} 0 0 0 ${x0 + r} ${y0}Z`;
}

function roundRect(x0, y0, x1, y1, r) {
  return `M${x0 + r} ${y0}H${x1 - r}Q${x1} ${y0} ${x1} ${y0 + r}V${y1 - r}Q${x1} ${y1} ${x1 - r} ${y1}` +
    `H${x0 + r}Q${x0} ${y1} ${x0} ${y1 - r}V${y0 + r}Q${x0} ${y0} ${x0 + r} ${y0}Z`;
}

// Carved leaf that sweeps along a curve and rolls over into a scroll at its tip.
function scrollLeaf(p0, c1, c2, E, curl, r0, w) {
  const a = cubic(p0, c1, c2, E);
  const [tx, ty] = tangentAt(a, 1);
  const C = [E[0] - ty * curl * r0, E[1] + tx * curl * r0];
  const a0 = Math.atan2(E[1] - C[1], E[0] - C[0]);
  const dir = -Math.sin(a0) * tx + Math.cos(a0) * ty > 0 ? 1 : -1;
  const sp = spiral(C[0], C[1], r0, r0 * 0.3, a0, a0 + dir * PI * 1.7);
  const f = (t) => (t < 0.62 ? a(t / 0.62) : sp((t - 0.62) / 0.38));
  const wf = (t) => w * (t < 0.2 ? 0.45 + 2.75 * t : t < 0.62 ? 1 : lerp(1, 0.4, (t - 0.62) / 0.38));
  return { d: taper(f, wf, 70), dot: [...C, w * 0.75] };
}

// Rounded lobe (petal / shell rib) growing from p along angle `ang`.
const lobe = (p, ang, len, wid) =>
  taper((t) => [p[0] + Math.cos(ang) * len * t, p[1] + Math.sin(ang) * len * t], (t) => wid * Math.sqrt(Math.sin(PI * t)), 24);

const fan = (p, mid, spread, count, len, wid) => Array.from({ length: count }, (_, i) => {
  const k = i / (count - 1) - 0.5;
  return lobe(p, mid + spread * k, len * (1 - 0.35 * Math.abs(k)), wid);
});

const volute = (cx, cy, r0, r1, a0, turns, w0, w1) =>
  taper(spiral(cx, cy, r0, r1, a0, a0 + turns * 2 * PI), lineW(w0, w1), 70);

// Items are path strings, [x, y, r] beads, or scrollLeaf results.
function collect(items) {
  const d = [], dots = [];
  for (const it of items) {
    if (typeof it === 'string') d.push(it);
    else if (Array.isArray(it)) dots.push(it);
    else { d.push(it.d); dots.push(it.dot); }
  }
  return { d, dots };
}

// Corner cartouche, local coords: outer corner at 0,0, rails run along +x and +y.
function cornerOrnament() {
  const items = [
    ...fan([13, 13], PI * 1.25, PI * 0.95, 5, 19, 4.6),
    volute(19, 19, 11, 2.6, PI * 1.25, 1.15, 4.4, 1.6), [19, 19, 3],
  ];
  for (const flip of [false, true]) {
    const P = ([x, y]) => (flip ? [y, x] : [x, y]);
    const c = flip ? -1 : 1;
    items.push(scrollLeaf(P([20, 5]), P([34, -4]), P([54, -3]), P([70, 7]), c, 5.5, 3.8));
    items.push(scrollLeaf(P([27, 27]), P([36, 33]), P([46, 33]), P([54, 27]), -c, 3.8, 2.6));
    items.push([...P([40, 17]), 2.2], [...P([48, 17]), 1.6], [...P([55, 17]), 1.2]);
  }
  return collect(items);
}

// Shell-and-scroll crest centred on 0,0 (the outer edge of the rail), rising towards -y.
function crestOrnament() {
  const items = [...fan([0, 6], -PI / 2, PI * 0.95, 7, 25, 5), [0, 6, 4.2]];
  for (const s of [-1, 1]) {
    const X = ([x, y]) => [x * s, y];
    items.push(scrollLeaf(X([8, 10]), X([20, 14]), X([30, 4]), X([30, -8]), -s, 5.5, 3.6));
    items.push(scrollLeaf(X([30, 10]), X([46, -2]), X([62, -2]), X([78, 8]), s, 5, 3.6));
    items.push(scrollLeaf(X([28, 22]), X([40, 29]), X([52, 29]), X([60, 23]), -s, 3.6, 2.5));
  }
  return collect(items);
}

// Spray for the middle of each long side; local: outer edge at 0,0, inward is +x.
function sideOrnament() {
  const items = [...fan([10, 0], PI, PI * 0.8, 3, 15, 4.2), [12, 0, 4]];
  for (const s of [-1, 1]) {
    items.push(scrollLeaf([10, 6 * s], [2, 18 * s], [4, 32 * s], [14, 44 * s], s, 5, 3.5));
    items.push([19, 20 * s, 1.8]);
  }
  return collect(items);
}

const paths = (list, attrs = '') => list.map((p) => `<path d="${p}" ${attrs}/>`).join('');
const circles = (list) => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
const orn = ({ d, dots }) => paths(d) + circles(dots);

function emboss(id, blur, scale, shadow) {
  return `
  <filter id="${id}" filterUnits="userSpaceOnUse" x="-60" y="-140" width="420" height="800" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="b"/>
    <feDiffuseLighting in="b" surfaceScale="${scale}" diffuseConstant="1.22" lighting-color="#fff" result="d">
      <feDistantLight azimuth="225" elevation="50"/></feDiffuseLighting>
    <feSpecularLighting in="b" surfaceScale="${scale}" specularConstant=".85" specularExponent="18" lighting-color="#fff2cf" result="s">
      <feDistantLight azimuth="225" elevation="40"/></feSpecularLighting>
    <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="1" result="lit"/>
    <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
    <feComposite in="lit" in2="s2" operator="arithmetic" k2="1" k3=".9" result="out"/>
    ${shadow ? `
    <feGaussianBlur in="SourceAlpha" stdDeviation="${shadow}"/>
    <feOffset dx="${shadow * 0.7}" dy="${shadow * 1.1}" result="o"/>
    <feFlood flood-color="#3b2a0c" flood-opacity=".55"/>
    <feComposite in2="o" operator="in" result="sh"/>
    <feMerge><feMergeNode in="sh"/><feMergeNode in="out"/></feMerge>` : ''}
  </filter>`;
}

const defs = `
<defs>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f3e1a8"/><stop offset=".3" stop-color="#d9bb74"/>
    <stop offset=".55" stop-color="#efd9a0"/><stop offset=".8" stop-color="#c9a660"/>
    <stop offset="1" stop-color="#b08c4a"/>
  </linearGradient>
  <linearGradient id="goldDeep" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#d8bb78"/><stop offset=".5" stop-color="#c3a15c"/><stop offset="1" stop-color="#a5823f"/>
  </linearGradient>
  <linearGradient id="panel" x1="0" y1="0" x2=".35" y2="1">
    <stop offset="0" stop-color="#eee2c6"/><stop offset=".55" stop-color="#e7d8b6"/><stop offset="1" stop-color="#ddcba5"/>
  </linearGradient>
  <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f1e5c4"/><stop offset=".35" stop-color="#d7c28f"/>
    <stop offset=".6" stop-color="#efe1bb"/><stop offset="1" stop-color="#bfa56d"/>
  </linearGradient>
  <linearGradient id="slot" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000"/><stop offset=".6" stop-color="#1b1712"/><stop offset="1" stop-color="#3a3126"/>
  </linearGradient>
  <radialGradient id="lamp">
    <stop offset="0" stop-color="#fff4d4"/><stop offset=".45" stop-color="#f3c77a"/><stop offset="1" stop-color="#c98d3a" stop-opacity="0"/>
  </radialGradient>
  <clipPath id="panelClip"><rect x="46" y="64" width="208" height="504" rx="3"/></clipPath>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
  ${emboss('embossBody', 3.2, 5)}
  ${emboss('embossRing', 1.3, 3)}
  ${emboss('embossOrn', 1.1, 3.2, 1.6)}
  ${emboss('embossPlate', 1, 2)}
</defs>`;

export function frameSVG() {
  const corner = orn(cornerOrnament());
  const crest = orn(crestOrnament());
  const side = orn(sideOrnament());
  return `${defs}
  <g filter="url(#embossBody)">
    <path fill="url(#goldDeep)" fill-rule="evenodd"
      d="${notchedRect(12, 28, 288, 604, 22)} ${roundRect(46, 64, 254, 568, 3)}"/>
  </g>
  <g filter="url(#embossRing)" fill="none" stroke="url(#gold)">
    <path d="${notchedRect(22, 38, 278, 594, 16)}" stroke-width="7"/>
    <path d="${roundRect(40, 58, 260, 574, 4)}" stroke-width="5"/>
    <path d="${notchedRect(31, 47, 269, 585, 12)}" stroke-width="3.4" stroke-dasharray="0 6.2" stroke-linecap="round"/>
  </g>
  <rect x="46" y="64" width="208" height="504" rx="3" fill="url(#panel)"/>
  <g clip-path="url(#panelClip)">
    <rect x="46" y="64" width="208" height="504" rx="3" fill="none" stroke="#4a3610" stroke-width="16"
      opacity=".32" filter="url(#soft)" transform="translate(3 4)"/>
  </g>
  <rect x="46.5" y="64.5" width="207" height="503" rx="3" fill="none" stroke="#6b5226" stroke-opacity=".45"/>
  <g id="plate" class="plate">
    <g filter="url(#embossPlate)">
      <rect x="62" y="95" width="176" height="36" rx="3" fill="url(#plate)"/>
    </g>
    <rect x="65.5" y="98.5" width="169" height="29" rx="2" fill="none" stroke="#7a5f2c" stroke-opacity=".45" stroke-width=".6"/>
    <g fill="#b89a5c" stroke="#7a5f2c" stroke-width=".5">
      <circle cx="72" cy="113" r="2.7"/><circle cx="228" cy="113" r="2.7"/>
    </g>
    <path d="M70.2 111.4 73.8 114.6M226.2 111.4 229.8 114.6" stroke="#6b5226" stroke-width=".6"/>
    <rect x="80" y="108.6" width="140" height="8.8" rx="4.4" fill="url(#slot)"/>
    <rect x="80" y="108.6" width="140" height="8.8" rx="4.4" fill="none" stroke="#fff5da" stroke-opacity=".5" stroke-width=".5" transform="translate(0 .6)"/>
    <circle class="lamp-off" cx="150" cy="102" r="1.6" fill="#8d7446"/>
    <circle class="lamp" cx="150" cy="102" r="5" fill="url(#lamp)"/>
  </g>
  <g filter="url(#embossOrn)" fill="url(#gold)">
    <g transform="translate(12 28)">${corner}</g>
    <g transform="translate(288 28) scale(-1 1)">${corner}</g>
    <g transform="translate(12 604) scale(1 -1)">${corner}</g>
    <g transform="translate(288 604) scale(-1 -1)">${corner}</g>
    <g transform="translate(150 30)">${crest}</g>
    <g transform="translate(150 602) scale(.82 -.82)">${crest}</g>
    <g transform="translate(12 316)">${side}</g>
    <g transform="translate(288 316) scale(-1 1)">${side}</g>
    <circle cx="150" cy="-2" r="5.2" fill="none" stroke="url(#gold)" stroke-width="2.6"/>
  </g>`;
}

// ── Satin bow ──────────────────────────────────────────────────────────────
const IVORY = [236, 227, 206];
const IVORY_BACK = [222, 211, 186];
const K = [150, -70];

const satin = (curve, extra) => ribbon(curve, {
  w: 15, base: IVORY, back: IVORY_BACK, amb: 0.62, dif: 0.42, spec: 0.55, shin: 10, ...extra,
});

// The two ribbon tails that run down and tuck behind the crest.
export function bowTailsSVG() {
  const left = cubic([K[0] - 2, K[1] + 4], [K[0] - 12, K[1] + 34], [134, -34], [147, -2]);
  const right = cubic([K[0] + 2, K[1] + 4], [K[0] + 12, K[1] + 34], [166, -34], [153, -2]);
  const tw = (t) => 0.55 * Math.sin(PI * t * 1.6) - 0.1;
  return satin(left, { twist: tw, wfn: (t) => 0.8 + 0.2 * t }) +
    satin(right, { twist: (t) => -tw(t), wfn: (t) => 0.8 + 0.2 * t });
}

export function bowSVG() {
  const loop = (s) => cubic([K[0] - 3 * s, K[1] - 1], [K[0] - 56 * s, K[1] - 52], [K[0] - 88 * s, K[1] + 14], [K[0] - 4 * s, K[1] + 4]);
  const pinch = (t) => 0.32 + 0.68 * Math.pow(Math.sin(PI * t), 0.55);
  const tw = (t) => 0.25 + 0.95 * Math.sin(PI * t) * (t - 0.45) * 2;
  // Short streamers that fall from the knot, cut in a swallowtail.
  const tail = (s) => cubic([K[0] + 2 * s, K[1] + 5], [K[0] + 16 * s, K[1] + 22], [K[0] + 26 * s, K[1] + 36], [K[0] + 36 * s, K[1] + 58]);
  return `
  <defs>
    <linearGradient id="knot" x1="0" x2="1">
      <stop offset="0" stop-color="#c9bc9b"/><stop offset=".35" stop-color="#fbf6ea"/>
      <stop offset=".65" stop-color="#ece3cf"/><stop offset="1" stop-color="#b9ab89"/>
    </linearGradient>
  </defs>
  ${satin(tail(-1), { twist: (t) => 0.3 + 0.6 * t, vcut: true, w: 15 })}
  ${satin(tail(1), { twist: (t) => -0.3 - 0.6 * t, vcut: true, w: 15 })}
  ${satin(loop(1), { twist: tw, wfn: pinch, w: 22 })}
  ${satin(loop(-1), { twist: (t) => -tw(t), wfn: pinch, w: 22 })}
  <rect x="${K[0] - 10}" y="${K[1] - 10}" width="20" height="20" rx="7" fill="url(#knot)"/>
  <path d="M${K[0] - 3} ${K[1] - 7}q-1.5 7 0 14M${K[0] + 3.2} ${K[1] - 6.5}q1.2 6.5 0 13" stroke="#a99b78" stroke-width=".55" fill="none" opacity=".7"/>`;
}
