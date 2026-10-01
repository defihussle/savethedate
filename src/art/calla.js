// Photoreal-ish calla lily: the spathe is a 3D sheet wrapped into a flared funnel,
// lit per facet and depth-sorted, so it reads as a real petal rather than a drawing.
// Local 2D output: flower base at 0,0 with the bloom rising towards -y.

import { PI, lerp, pt, v3, smoothstep, rgb } from './geom.js';

const { sub, cross, norm, dot } = v3;

// rot: the on-screen rotation (deg) the caller applies, so lighting stays top-left.
export function callaBloom({ H = 70, rot = 0, seed = 1 }) {
  const r = (rot * PI) / 180;
  const ls = [-0.5, -0.65]; // screen-space light direction (y down)
  const lx = ls[0] * Math.cos(-r) - ls[1] * Math.sin(-r);
  const ly = ls[0] * Math.sin(-r) + ls[1] * Math.cos(-r);
  const L = norm([lx, -ly, 0.75]); // to Y-up
  const Hv = norm([L[0], L[1], L[2] + 1]);

  // View: tip the bloom toward the viewer so the throat shows, and turn it a little.
  const al = 0.62, be = 0.32;
  const view = ([x, y, z]) => {
    const y1 = y * Math.cos(al) - z * Math.sin(al), z1 = y * Math.sin(al) + z * Math.cos(al);
    const x2 = x * Math.cos(be) + z1 * Math.sin(be), z2 = -x * Math.sin(be) + z1 * Math.cos(be);
    return [x2, y1, z2];
  };

  // Spathe surface. u ∈ [-1,1] runs across the sheet (0 = back), v ∈ [0,1] up it.
  const spathe = (u, v) => {
    const vt = v * (1 + 0.55 * Math.pow(1 - Math.abs(u), 4)); // back rises into the tip
    const wrap = lerp(3.05, 2.05, smoothstep(0, 0.8, vt));
    const a = u * wrap;
    let rad = 1.6 + 15 * Math.pow(Math.min(vt, 1.05), 1.7);
    rad += 38 * Math.pow(Math.max(0, vt - 0.68), 2); // mouth flares
    rad += 4.5 * smoothstep(0.7, 1, Math.abs(u)) * smoothstep(0.4, 1, vt); // edges roll out
    let y = Math.min(vt, 1) * H + Math.max(0, vt - 1) * H * 0.55;
    let z = -rad * Math.cos(a);
    const tip = Math.max(0, vt - 1);
    z -= 26 * tip * tip; // tip arches back
    y -= 10 * tip * tip;
    const x = rad * Math.sin(a) + 2.2 * vt * vt;
    return { p: view([x, y, z]), radial: view([Math.sin(a), 0, -Math.cos(a)]), vt };
  };

  const quads = [];
  const U = 56, V = 40;
  const grid = [];
  for (let i = 0; i <= U; i++) {
    grid.push([]);
    for (let j = 0; j <= V; j++) grid[i].push(spathe(-1 + (2 * i) / U, j / V));
  }
  // Shade at each vertex from a smooth (central-difference) normal, then average per facet,
  // so light flows continuously over folds instead of breaking into hard facets.
  const shadeAt = (i, j) => {
    const P = (ii, jj) => grid[Math.max(0, Math.min(U, ii))][Math.max(0, Math.min(V, jj))].p;
    let n = norm(cross(sub(P(i + 1, j), P(i - 1, j)), sub(P(i, j + 1), P(i, j - 1))));
    if (n[2] < 0) n = n.map((x) => -x);
    const g = grid[i][j];
    const outside = dot(n, g.radial) > 0;
    // Outer face: cream with a green blush at the base. Inner face: warmer, shadowed in the throat.
    const base = outside
      ? [250, 249, 241].map((w, k) => lerp([168, 190, 128][k], w, smoothstep(0.02, 0.42, g.vt)))
      : [253, 249, 236];
    const occl = outside ? 1 : lerp(0.62, 1, smoothstep(0.1, 0.85, g.vt));
    const diff = Math.max(0, (dot(n, L) + 0.45) / 1.45); // wrapped: petals are translucent
    const spec = Math.pow(Math.max(0, dot(n, Hv)), 18) * 0.12;
    return base.map((ch) => ch * (0.5 + 0.56 * diff) * occl + 255 * spec);
  };
  const vcol = grid.map((row, i) => row.map((_, j) => shadeAt(i, j)));
  for (let i = 0; i < U; i++) {
    for (let j = 0; j < V; j++) {
      const a = grid[i][j], b = grid[i + 1][j], c = grid[i + 1][j + 1], d = grid[i][j + 1];
      const col = [0, 1, 2].map((k) => (vcol[i][j][k] + vcol[i + 1][j][k] + vcol[i + 1][j + 1][k] + vcol[i][j + 1][k]) / 4);
      quads.push({ z: (a.p[2] + b.p[2] + c.p[2] + d.p[2]) / 4, pts: [a.p, b.p, c.p, d.p], col });
    }
  }

  // Spadix: a slim golden column rising from the throat, with a fine granular finish.
  let rnd = seed * 9301;
  const rand = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
  const SP = 14, SV = 12;
  const spad = (k, j) => {
    const a = (k / SP) * 2 * PI, y = lerp(0.08, 0.52, j / SV) * H;
    const rr = 1.9 * (1 - 0.3 * Math.pow(j / SV, 3));
    return view([rr * Math.cos(a) + 0.4, y, rr * Math.sin(a) - 1]);
  };
  for (let k = 0; k < SP; k++) {
    for (let j = 0; j < SV; j++) {
      const a = spad(k, j), b = spad(k + 1, j), c = spad(k + 1, j + 1), d = spad(k, j + 1);
      let n = norm(cross(sub(b, a), sub(d, a)));
      if (n[2] < 0) continue; // back side hidden
      const diff = Math.max(0, dot(n, L));
      const grain = 0.9 + rand() * 0.16;
      const col = [244, 212, 112].map((ch) => ch * (0.68 + 0.42 * diff) * grain);
      quads.push({ z: (a[2] + c[2]) / 2 - 0.5, pts: [a, b, c, d], col });
    }
  }

  quads.sort((p, q) => p.z - q.z);
  const toScreen = ([x, y]) => [x, -y];
  let out = '';
  for (const q of quads) {
    const c = rgb(q.col);
    out += `<path d="M${q.pts.map((p) => pt(toScreen(p))).join('L')}Z" fill="${c}" stroke="${c}"/>`;
  }

  // Fine rim highlight where the sheet's edge catches the light.
  const rim = [];
  for (let i = 0; i <= U; i++) rim.push(toScreen(grid[i][V].p));
  return `<g stroke-width=".35" stroke-linejoin="round">${out}</g>
    <path d="M${rim.map(pt).join('L')}" fill="none" stroke="#fffdf7" stroke-width=".7" opacity=".8"/>`;
}
