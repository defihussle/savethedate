// Page 2 artwork. All layers share viewBox "0 0 400 460" so they stack precisely.

import { PI, cubic, chain, taper, lineW, ribbon, heartPath } from './geom.js';

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
function calla(id, stemLen) {
  const stem = taper(cubic([0, 2], [3, stemLen * 0.3], [-5, stemLen * 0.7], [6, stemLen]), lineW(2.6, 3.4), 40);
  return `
  <path d="${stem}" fill="url(#stem)"/>
  <path d="M-0.8 6C0 ${stemLen * 0.3} -3.6 ${stemLen * 0.7} 5 ${stemLen}" stroke="#cfdcb0" stroke-width=".7" fill="none" opacity=".7"/>
  <path d="M0 4C-6 -12 -13 -30 -15 -46C-17 -60 -10 -72 0 -77C11 -83 25 -85 36 -95C31 -82 27 -71 21 -62C16 -50 10 -26 6 -12C4 -5 2 -1 0 4Z" fill="url(#spathe${id})"/>
  <path d="M0 4C-6 -12 -13 -30 -15 -46C-17 -60 -10 -72 0 -77C11 -83 25 -85 36 -95C31 -82 27 -71 21 -62C16 -50 10 -26 6 -12C4 -5 2 -1 0 4Z" fill="url(#spatheShade)"/>
  <path d="M-12.5 -53C-12 -65 -4 -75 6 -77C16 -79 23 -77 25 -69C21 -61 14 -55 7 -50C0 -45 -8 -45 -12.5 -53Z" fill="url(#throat)"/>
  <ellipse cx="4" cy="-59" rx="2.6" ry="11" transform="rotate(14 4 -59)" fill="url(#spadix)"/>
  <path d="M-15 -46C-17 -60 -10 -72 0 -77C11 -83 25 -85 36 -95" stroke="#fff" stroke-width="1" fill="none" opacity=".85"/>
  <path d="M22 -82C28 -86 32 -90 36 -95C31 -87 27 -82 23 -79Z" fill="#e7e0cc"/>
  <g stroke="#b7c298" stroke-width=".5" fill="none" opacity=".45">
    <path d="M2 -6C0 -26 -5 -46 -8 -64"/><path d="M5 -10C6 -30 9 -48 14 -66"/>
  </g>`;
}

export function liliesSVG() {
  return `
  <defs>
    <linearGradient id="stem" x1="0" x2="1">
      <stop offset="0" stop-color="#7c955a"/><stop offset=".45" stop-color="#a8bd84"/><stop offset="1" stop-color="#6f874f"/>
    </linearGradient>
    <linearGradient id="spathe1" x1="0" y1="1" x2=".3" y2="0">
      <stop offset="0" stop-color="#b7c795"/><stop offset=".3" stop-color="#eef0dc"/><stop offset=".7" stop-color="#fffdf5"/><stop offset="1" stop-color="#fbf7ec"/>
    </linearGradient>
    <linearGradient id="spathe2" x1="0" y1="1" x2=".3" y2="0">
      <stop offset="0" stop-color="#aebf8a"/><stop offset=".35" stop-color="#e8ebd5"/><stop offset="1" stop-color="#f8f4e8"/>
    </linearGradient>
    <linearGradient id="spatheShade" x1="0" x2="1">
      <stop offset="0" stop-color="#b9ae90" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#a99e82" stop-opacity=".25"/>
    </linearGradient>
    <radialGradient id="throat" cx=".55" cy=".35" r=".8">
      <stop offset="0" stop-color="#fffbef"/><stop offset=".6" stop-color="#f1ead6"/><stop offset="1" stop-color="#d2c7a8"/>
    </radialGradient>
    <linearGradient id="spadix" x1="0" x2="1">
      <stop offset="0" stop-color="#d9b85a"/><stop offset=".5" stop-color="#f4df98"/><stop offset="1" stop-color="#c9a54a"/>
    </linearGradient>
    <filter id="lilyShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dx="4" dy="6"/>
      <feComponentTransfer><feFuncA type="linear" slope=".18"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#lilyShadow)">
    <g transform="translate(74 322) rotate(-62) scale(.95)">${calla(2, 240)}</g>
    <g transform="translate(96 262) rotate(-40) scale(1.22)">${calla(1, 215)}</g>
  </g>`;
}

// ── Heart locket ───────────────────────────────────────────────────────────
export function locketSVG(i1, i2) {
  const half = (x, rot, letter) => `
    <g transform="translate(${x} 0) rotate(${rot})">
      <path d="${heartPath(0, 0, 34)}" fill="url(#lgold)" filter="url(#lEmboss)"/>
      <path d="${heartPath(0, 0.8, 29.5)}" fill="none" stroke="#8a6b30" stroke-opacity=".55" stroke-width=".8"/>
      <path d="${heartPath(0, 1, 26.5)}" fill="url(#lpaper)"/>
      <path d="${heartPath(0, 1, 26.5)}" fill="none" stroke="#6e5424" stroke-opacity=".35" stroke-width="2.4" filter="url(#lInner)" clip-path="url(#lclip)"/>
      <text x="0" y="12" text-anchor="middle" class="locket-initial">${letter}</text>
    </g>`;
  return `
  <defs>
    <linearGradient id="lgold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f4e2ae"/><stop offset=".4" stop-color="#d4b471"/>
      <stop offset=".7" stop-color="#ecd49b"/><stop offset="1" stop-color="#b08b48"/>
    </linearGradient>
    <radialGradient id="lpaper" cx=".45" cy=".4" r=".75">
      <stop offset="0" stop-color="#fbf7ee"/><stop offset="1" stop-color="#ece3d2"/>
    </radialGradient>
    <clipPath id="lclip"><path d="${heartPath(0, 1, 26.5)}"/></clipPath>
    <filter id="lInner"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="lEmboss" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b"/>
      <feDiffuseLighting in="b" surfaceScale="4" diffuseConstant="1.2" result="d"><feDistantLight azimuth="225" elevation="50"/></feDiffuseLighting>
      <feSpecularLighting in="b" surfaceScale="4" specularConstant=".9" specularExponent="20" lighting-color="#fff4d8" result="s"><feDistantLight azimuth="225" elevation="40"/></feSpecularLighting>
      <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="1" result="lit"/>
      <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
      <feComposite in="lit" in2="s2" operator="arithmetic" k2="1" k3=".9"/>
    </filter>
    <filter id="lShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.4"/><feOffset dx="3" dy="5"/>
      <feComponentTransfer><feFuncA type="linear" slope=".3"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g transform="translate(214 378) scale(1.12)" filter="url(#lShadow)">
    <rect x="-4.5" y="-24" width="9" height="22" rx="4.5" fill="url(#lgold)" filter="url(#lEmboss)"/>
    <path d="M-4.5 -18H4.5M-4.5 -11H4.5" stroke="#7d6130" stroke-opacity=".5" stroke-width=".7"/>
    ${half(-35, -9, i1)}
    ${half(35, 9, i2)}
    <circle cx="0" cy="-33" r="6.5" fill="none" stroke="url(#lgold)" stroke-width="3" filter="url(#lEmboss)"/>
  </g>`;
}

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
