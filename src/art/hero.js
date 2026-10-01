// Page 2 artwork. All layers share viewBox "0 0 400 460" so they stack precisely.

import { PI, cubic, chain, taper, lineW, ribbon, heartPath, tangentAt, pt, v3, smoothstep, rgb } from './geom.js';
import { callaBloom } from './calla.js';

export const HERO_VIEWBOX = '0 0 400 460';

export function ovalSVG() {
  return `
  <defs>
    <filter id="ovalEmboss" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b"/>
      <feOffset in="b" dx="3" dy="5" result="o"/>
      <feFlood flood-color="#8a7456" flood-opacity=".22"/><feComposite in2="o" operator="in" result="sh"/>
      <feOffset in="b" dx="-2" dy="-3" result="o2"/>
      <feFlood flood-color="#fff" flood-opacity=".9"/><feComposite in2="o2" operator="in" result="hi"/>
      <feMerge><feMergeNode in="sh"/><feMergeNode in="hi"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#ovalEmboss)" fill="none">
    <ellipse cx="150" cy="118" rx="122" ry="150" stroke="#f7f1e8" stroke-width="15"/>
    <ellipse cx="150" cy="118" rx="108" ry="136" stroke="#f5eee4" stroke-width="3"/>
  </g>`;
}

// ── Sage silk ribbon ───────────────────────────────────────────────────────
// One continuous S-curve: enters behind the photo strip, sweeps across the lily
// stems, loops back and threads through the locket's bail.
const ribbonPath = chain(
  cubic([430, 118], [360, 132], [300, 150], [236, 196]),
  cubic([236, 196], [176, 240], [112, 262], [128, 306]),
  cubic([128, 306], [142, 344], [196, 318], [214, 334]),
  cubic([214, 334], [236, 352], [290, 390], [330, 446]),
);
const silk = (from, to) => ribbon(ribbonPath, {
  from, to, n: Math.round((to - from) * 260), w: 30,
  twist: (t) => 1.25 * Math.sin(PI * t * 3.1 + 0.4) + 0.15,
  wfn: (t) => (t > 0.72 && t < 0.78 ? 0.55 + 0.45 * Math.abs(t - 0.75) / 0.03 : 1),
  base: [150, 164, 118], back: [132, 146, 104], amb: 0.62, dif: 0.45, spec: 0.42, shin: 8,
  vcut: to === 1,
});
export const RIBBON_SPLIT = 0.2;
export const ribbonBackSVG = () => `<g opacity=".78">${silk(0, RIBBON_SPLIT)}</g>`;
export const ribbonFrontSVG = () => `<g opacity=".78">${silk(RIBBON_SPLIT, 1)}</g>`;

// ── Calla lilies ───────────────────────────────────────────────────────────
function calla(stemLen, rot, seed) {
  const stem = taper(cubic([0, 1], [3, stemLen * 0.3], [-5, stemLen * 0.7], [6, stemLen]), lineW(2.3, 3.2), 50);
  return `
  <path d="${stem}" fill="url(#stem)"/>
  <path d="M-0.9 6C0 ${stemLen * 0.3} -3.8 ${stemLen * 0.7} 4.8 ${stemLen}" stroke="#d5e0bf" stroke-width=".55" fill="none" opacity=".6"/>
  <g filter="url(#petalSoft)">${callaBloom({ H: 58, rot, seed })}</g>`;
}

export function liliesSVG() {
  return `
  <defs>
    <linearGradient id="stem" x1="0" x2="1">
      <stop offset="0" stop-color="#6c8350"/><stop offset=".35" stop-color="#9db27f"/>
      <stop offset=".55" stop-color="#b3c497"/><stop offset="1" stop-color="#5f7646"/>
    </linearGradient>
    <filter id="petalSoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".25"/></filter>
    <filter id="lilyShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3.2"/><feOffset dx="4" dy="6"/>
      <feComponentTransfer><feFuncA type="linear" slope=".16"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#lilyShadow)">
    <g transform="translate(74 322) rotate(-62) scale(.95)">${calla(240, -62, 2)}</g>
    <g transform="translate(96 262) rotate(-40) scale(1.22)">${calla(215, -40, 1)}</g>
  </g>`;
}

// ── Heart locket ───────────────────────────────────────────────────────────
// Polished champagne gold: each rim is a rounded metal profile that reflects a soft
// studio environment, so it reads as a real piece of jewellery.
const GOLD = [236, 200, 132];
const KEY = v3.norm([-0.45, -0.6, 0.66]);
const FILL = v3.norm([0.65, -0.15, 0.74]);
function metal(n) {
  const R = [2 * n[2] * n[0], 2 * n[2] * n[1], 2 * n[2] * n[2] - 1];
  const up = -R[1];
  const e = 0.3 + 0.72 * smoothstep(-0.4, 0.6, up)
    + 1.5 * Math.pow(Math.max(0, v3.dot(R, KEY)), 36)
    + 0.45 * Math.pow(Math.max(0, v3.dot(R, FILL)), 10)
    - 0.3 * Math.exp(-((up + 0.28) ** 2) / 0.01);
  const hot = Math.max(0, e - 1);
  return rgb(GOLD.map((c, k) => c * Math.min(e, 1.05) + hot * [255, 244, 220][k] * 0.55));
}

// A rounded metal band following a closed curve (screen coords).
function metalRing(curve, W, nT = 180, nP = 9) {
  const P = [];
  let area = 0;
  for (let i = 0; i < nT; i++) {
    const a = curve(i / nT), b = curve((i + 1) / nT);
    area += a[0] * b[1] - b[0] * a[1];
  }
  const sgn = area > 0 ? 1 : -1;
  for (let i = 0; i <= nT; i++) {
    const t = (i % nT) / nT;
    const c = curve(t);
    const [tx, ty] = tangentAt(curve, Math.min(0.9995, Math.max(0.0005, t)));
    const N = [ty * sgn, -tx * sgn];
    const row = [];
    for (let j = 0; j <= nP; j++) {
      const ph = -PI / 2 + (PI * j) / nP;
      row.push({ p: [c[0] + N[0] * (W / 2) * Math.sin(ph), c[1] + N[1] * (W / 2) * Math.sin(ph)], n: v3.norm([N[0] * Math.sin(ph), N[1] * Math.sin(ph), Math.cos(ph)]) });
    }
    P.push(row);
  }
  let out = '';
  for (let i = 0; i < nT; i++) {
    for (let j = 0; j < nP; j++) {
      const a = P[i][j], b = P[i + 1][j], c = P[i + 1][j + 1], d = P[i][j + 1];
      const col = metal(v3.norm([a.n[0] + c.n[0], a.n[1] + c.n[1], a.n[2] + c.n[2]]));
      out += `<path d="M${pt(a.p)}L${pt(b.p)}L${pt(c.p)}L${pt(d.p)}Z" fill="${col}" stroke="${col}"/>`;
    }
  }
  return `<g stroke-width=".3">${out}</g>`;
}

// Same outline as heartPath(), as a closed parametric curve.
function heartCurve(cx, cy, s, rotDeg) {
  const r = (rotDeg * PI) / 180, cs = Math.cos(r), sn = Math.sin(r);
  const P = (x, y) => { const X = x * s, Y = y * s; return [cx + X * cs - Y * sn, cy + X * sn + Y * cs]; };
  return chain(
    cubic(P(0, -0.32), P(0, -0.85), P(-0.95, -0.95), P(-0.98, -0.3)),
    cubic(P(-0.98, -0.3), P(-1, 0.22), P(-0.5, 0.58), P(0, 0.98)),
    cubic(P(0, 0.98), P(0.5, 0.58), P(1, 0.22), P(0.98, -0.3)),
    cubic(P(0.98, -0.3), P(0.95, -0.95), P(0, -0.85), P(0, -0.32)),
  );
}
const circleCurve = (cx, cy, r) => (t) => [cx + r * Math.cos(2 * PI * t), cy + r * Math.sin(2 * PI * t)];

export function locketSVG() {
  const half = (x, rot, id) => `
    <g transform="translate(${x} 0) rotate(${rot})">
      <path d="${heartPath(0.9, 2, 34.6)}" fill="#6d4f1f"/>
      <path d="${heartPath(0, 1, 26.2)}" fill="url(#enamel)"/>
      <g clip-path="url(#lclip${id})">
        <path d="${heartPath(0, 1, 26.2)}" fill="none" stroke="#5b3f14" stroke-opacity=".5" stroke-width="5" filter="url(#lInner)" transform="translate(1.6 2.4)"/>
        <path d="M-30 -14L-6 -30L30 18L12 34Z" fill="url(#glare)"/>
      </g>
    </g>
    ${metalRing(heartCurve(x, 0, 30.6, rot), 7.6)}
    ${metalRing(heartCurve(x, 0.6, 26.4, rot), 1.5, 150, 5)}
    <g transform="translate(${x} 0) rotate(${rot})"><circle cx="0" cy="-8.6" r="2.6" fill="url(#bead)"/></g>`;
  const knuckle = (y, h) => `<rect x="-4.6" y="${y}" width="9.2" height="${h}" rx="2" fill="url(#hinge)"/>`;
  return `
  <defs>
    <radialGradient id="enamel" cx=".42" cy=".38" r=".8">
      <stop offset="0" stop-color="#fdfaf3"/><stop offset=".7" stop-color="#f3ebdc"/><stop offset="1" stop-color="#e2d5bd"/>
    </radialGradient>
    <linearGradient id="glare" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".38"/>
      <stop offset=".6" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="hinge" x1="0" x2="1">
      <stop offset="0" stop-color="#7a5a24"/><stop offset=".3" stop-color="#f6e2b0"/>
      <stop offset=".55" stop-color="#c9a466"/><stop offset="1" stop-color="#6d4f1f"/>
    </linearGradient>
    <radialGradient id="bead" cx=".35" cy=".3" r=".75">
      <stop offset="0" stop-color="#fff6dc"/><stop offset=".35" stop-color="#e2c27e"/><stop offset="1" stop-color="#7a5a24"/>
    </radialGradient>
    <clipPath id="lclipL"><path d="${heartPath(0, 1, 26.2)}"/></clipPath>
    <clipPath id="lclipR"><path d="${heartPath(0, 1, 26.2)}"/></clipPath>
    <filter id="lInner" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="lShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="c"/><feOffset in="c" dx="1" dy="2" result="c2"/>
      <feComponentTransfer in="c2" result="c3"><feFuncA type="linear" slope=".45"/></feComponentTransfer>
      <feGaussianBlur in="SourceAlpha" stdDeviation="3.5"/><feOffset dx="4" dy="7"/>
      <feComponentTransfer result="s"><feFuncA type="linear" slope=".22"/></feComponentTransfer>
      <feMerge><feMergeNode in="s"/><feMergeNode in="c3"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g transform="translate(214 378) scale(1.12)" filter="url(#lShadow)">
    ${half(-35, -9, 'L')}
    ${half(35, 9, 'R')}
    ${knuckle(-23, 6)}${knuckle(-16.4, 6)}${knuckle(-9.8, 6)}
    <path d="M-4.6 -16.7H4.6M-4.6 -10.1H4.6" stroke="#5b3f14" stroke-opacity=".6" stroke-width=".6"/>
    ${metalRing(circleCurve(0, -32, 5.4), 2.8, 60, 7)}
  </g>`;
}

// The initials sit in their own live-text layer (the metalwork is rasterised).
export const locketInitialsSVG = (i1, i2) => `
  <g transform="translate(214 378) scale(1.12)">
    <text transform="translate(-35 0) rotate(-9)" x="0" y="13" text-anchor="middle" class="locket-initial">${i1}</text>
    <text transform="translate(35 0) rotate(9)" x="0" y="13" text-anchor="middle" class="locket-initial">${i2}</text>
  </g>`;

// ── Cupid engraving ────────────────────────────────────────────────────────
// Two cherubs drawing their bows toward a heart, in fine engraved line work.
function cherub() {
  return `
  <path d="M45 24C50 17 62 18 65 28C67 36 63 45 55 47C47 49 40 43 40 35C40 30 42 27 45 24Z"/>
  <path d="M57 32.2q1.6-1.2 3.2 0M64.5 34.5q1.4 1.6-.4 2.6M58.5 40.5q2 1 3.6-.6"/>
  <path d="M47.5 33q-3 1.5-.5 4.5"/>
  <path d="M44 27c-3-2-1.5-6.5 1.5-5.5c2 .8 1.2 3-.6 2.6M49.5 21.5c-1-3.4 2.4-5.4 4.6-3.6c1.6 1.4.2 3.4-1.4 2.6M56 19.5c1.4-3 5.4-2.6 5.8.2c.2 2-2 2.6-3 1.2M41.5 32c-3.4-.4-3.6-4.6-.8-5.4c1.8-.4 2.8 1.6 1.4 2.6M62 22c2.8-1.4 5.2 1.4 3.8 3.6"/>
  <path d="M52 47C60 48 65 55 64 63C63 70 56 74 48 72C42 70 40 62 42 55C43 51 47 48 52 47"/>
  <path d="M44 51C38 40 28 30 16 27C11 26 8 29 11 32C6 33 5 37 9 38.5C5 40.5 6 44.5 10.5 44.5C8 47.5 10.5 51 15 50C15 53.5 19 55 22.5 53C24 56.5 28 58 31 56.5C36 56 40 55 43 54"/>
  <path d="M40 47C34 41 27 36 18 33M39 50C32 46 25 43 13 41.5M40 52.5C33 50 27 49 17 48M41 54C35 53.5 30 53.5 24 53.5"/>
  <path d="M58 50.5C66 46.5 76 44.5 84 44.4M59 55C67 51 76 49 84 49"/>
  <path d="M84 44.4c3.5-.6 5 1.2 4.6 2.6c-.3 1.4-2 2.2-4.6 2"/>
  <path d="M84 20C97 32 97 62 84 74"/>
  <path d="M84 20c-1.6-1.4-1.2-3.4.6-3.2M84 74c-1.6 1.4-1.2 3.4.6 3.2"/>
  <path d="M84 20L65 47.2L84 74" stroke-width=".45"/>
  <path d="M63 47.4c-1.4-2.4 1-4.4 3-3.2c1.6 1 1.2 3.4-.6 4"/>
  <path d="M58 47.3L108 45.4"/>
  <path d="M112 45.2L104 41.6L105.6 45.4L104 49.2Z" fill="currentColor"/>
  <path d="M59 47.2l-3.4-3.6M62 47.1l-3.4-3.6M59 47.3l-3.4 3.4M62 47.2l-3.4 3.4"/>
  <path d="M48 71C44 78 37 82 30 80C26 79 24 82 27 84C33 88 42 88 50 82C53 79 55 76 55 73"/>
  <path d="M58 70C65 76 66 86 60 92C58 94 55 94 55 91C56 88 58 85 57 80"/>
  <path d="M42 64C50 60 57 67 64 64C71 62 76 69 88 71C80 73 76 76 72 82C67 76 60 74 54 75"/>
  <path d="M64 64C68 68 70 72 72 82"/>`;
}

export function cupidsSVG() {
  return `
  <g fill="none" stroke="currentColor" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round">
    <g transform="translate(6 6)">${cherub()}</g>
    <g transform="translate(294 6) scale(-1 1)">${cherub()}</g>
    <path d="${heartPath(150, 64, 19)}" stroke-width=".9"/>
    <path d="${heartPath(150, 64.6, 15.5)}" stroke-width=".45"/>
  </g>`;
}
