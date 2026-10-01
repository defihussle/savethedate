// Small geometry kit for the procedural artwork: curves, tapered strokes, 3D-shaded ribbons.

const r2 = (n) => Math.round(n * 100) / 100;
export const pt = ([x, y]) => `${r2(x)} ${r2(y)}`;
export const lerp = (a, b, t) => a + (b - a) * t;
export const PI = Math.PI;

export function cubic(p0, p1, p2, p3) {
  return (t) => {
    const u = 1 - t;
    const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  };
}

// Joins curves end to end, each taking an equal share of t.
export function chain(...curves) {
  return (t) => {
    const k = Math.min(curves.length - 1, Math.floor(t * curves.length));
    return curves[k](t * curves.length - k);
  };
}

export function spiral(cx, cy, r0, r1, a0, a1) {
  return (t) => {
    const r = r0 * Math.pow(r1 / r0, t);
    const a = a0 + (a1 - a0) * t;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
}

export function tangentAt(fn, t) {
  const e = 1e-3;
  const a = fn(Math.max(0, t - e)), b = fn(Math.min(1, t + e));
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
}

// Closed outline of a stroke along fn whose half-width follows wfn(t).
export function taper(fn, wfn, n = 36) {
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = fn(t);
    const [tx, ty] = tangentAt(fn, t);
    const w = wfn(t);
    L.push([p[0] - ty * w, p[1] + tx * w]);
    R.push([p[0] + ty * w, p[1] - tx * w]);
  }
  return `M${L.map(pt).join('L')}L${R.reverse().map(pt).join('L')}Z`;
}

export const leafW = (max, pw = 0.8) => (t) => max * Math.pow(Math.sin(PI * Math.pow(t, 0.8)), pw);
export const lineW = (w0, w1) => (t) => lerp(w0, w1, t);

export function heartPath(cx, cy, s) {
  const P = (x, y) => pt([cx + x * s, cy + y * s]);
  return `M${P(0, -0.32)}C${P(0, -0.85)} ${P(-0.95, -0.95)} ${P(-0.98, -0.3)}` +
    `C${P(-1, 0.22)} ${P(-0.5, 0.58)} ${P(0, 0.98)}` +
    `C${P(0.5, 0.58)} ${P(1, 0.22)} ${P(0.98, -0.3)}` +
    `C${P(0.95, -0.95)} ${P(0, -0.85)} ${P(0, -0.32)}Z`;
}

const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// A strip of fabric following `curve`, twisting about its own axis by twist(t) radians.
// Each slice is lit like a real surface, which is what gives satin/silk its sheen.
export function ribbon(curve, o) {
  const {
    w, twist = () => 0, wfn = () => 1, n = 110, from = 0, to = 1,
    base, back = base, amb = 0.5, dif = 0.55, spec = 0.5, shin = 14,
    light = [-0.45, -0.6, 0.66], vcut = false,
  } = o;
  const L = norm(light), H = norm([L[0], L[1], L[2] + 1]);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = lerp(from, to, i / n);
    const p = curve(t);
    const [tx, ty] = tangentAt(curve, t);
    const th = twist(t), c = Math.cos(th), s = Math.sin(th);
    const hw = (w / 2) * wfn(t);
    const ex = -ty * c * hw, ey = tx * c * hw;
    let nrm = [ty * s, -tx * s, c];
    const front = c >= 0;
    if (!front) nrm = nrm.map((v) => -v);
    pts.push({
      p, a: [p[0] + ex, p[1] + ey], b: [p[0] - ex, p[1] - ey],
      d: Math.max(0, dot(nrm, L)), sp: Math.pow(Math.max(0, dot(nrm, H)), shin),
      front, tan: [tx, ty], hw,
    });
  }
  const shade = (A, B) => {
    const col = A.front ? base : back;
    const d = (A.d + B.d) / 2, sp = (A.sp + B.sp) / 2;
    const ch = col.map((v) => Math.round(Math.min(255, v * (amb + dif * d) + 255 * spec * sp)));
    return `rgb(${ch.join(',')})`;
  };
  let out = '';
  for (let i = 0; i < n; i++) {
    const A = pts[i], B = pts[i + 1];
    const col = shade(A, B);
    out += `<path d="M${pt(A.a)}L${pt(B.a)}L${pt(B.b)}L${pt(A.b)}Z" fill="${col}" stroke="${col}"/>`;
  }
  if (vcut) {
    const E = pts[n], k = E.hw * 1.2;
    const ext = (q) => [q[0] + E.tan[0] * k, q[1] + E.tan[1] * k];
    const col = shade(pts[n - 1], E);
    out += `<path d="M${pt(E.a)}L${pt(ext(E.a))}L${pt(E.p)}L${pt(ext(E.b))}L${pt(E.b)}Z" fill="${col}" stroke="${col}"/>`;
  }
  return `<g stroke-width=".45" stroke-linejoin="round">${out}</g>`;
}
