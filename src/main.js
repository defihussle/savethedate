import { WEDDING } from './config.js';
import { BOOTH_VIEWBOX, frameSVG, bowSVG, bowTailsSVG } from './art/booth.js';
import { HERO_VIEWBOX, ovalSVG, ribbonBackSVG, ribbonFrontSVG, liliesSVG, locketSVG, cupidsSVG } from './art/hero.js';
import { PrinterSound } from './sound.js';

const $ = (sel) => document.querySelector(sel);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Content ────────────────────────────────────────────────────────────────
document.querySelectorAll('[data-bind]').forEach((el) => { el.textContent = WEDDING[el.dataset.bind] ?? ''; });
document.title = `${WEDDING.partner1} & ${WEDDING.partner2} — Save the Date`;
document.querySelectorAll('img[data-photo]').forEach((img) => {
  const set = img.dataset.photo === 'booth' ? WEDDING.boothPhotos : WEDDING.heroPhotos;
  img.src = set[Number(img.dataset.i)];
  img.decoding = 'async';
});

const paint = (id, viewBox, markup) => {
  const svg = document.getElementById(id);
  svg.setAttribute('viewBox', viewBox);
  svg.innerHTML = markup;
};
paint('boothTails', BOOTH_VIEWBOX, bowTailsSVG());
paint('boothFrame', BOOTH_VIEWBOX, frameSVG());
paint('boothBow', BOOTH_VIEWBOX, bowSVG());
paint('heroOval', HERO_VIEWBOX, ovalSVG());
paint('ribbonBack', HERO_VIEWBOX, ribbonBackSVG());
paint('lilies', HERO_VIEWBOX, liliesSVG());
paint('ribbonFront', HERO_VIEWBOX, ribbonFrontSVG());
paint('locket', HERO_VIEWBOX, locketSVG(WEDDING.initial1, WEDDING.initial2));
$('#cupids').innerHTML = cupidsSVG();
$('.strip--hero').style.aspectRatio = '90 / 232';

// ── Page 1: the photo booth prints the strip ───────────────────────────────
const page = $('#boothPage');
const booth = $('#booth');
const strip = $('#boothStrip');
const sway = $('#stripSway');
const enterBtn = $('#enterBtn');
const replayBtn = $('#replayBtn');
const sound = new PrinterSound();

const FEED_MS = 4600;
// Paper position (translateY as % of strip height) — the strip feeds in bursts,
// easing to a near-stop as each photograph clears the slot.
const FEED = [
  [0, -100], [0.07, -95.5], [0.12, -94.5],
  [0.36, -67], [0.42, -66],
  [0.63, -38], [0.69, -37],
  [0.9, -9], [1, 0],
];
// Seconds (from feed start) where the motor runs, for the optional sound.
const MOTOR = [[0, 0.12], [0.12, 0.36], [0.42, 0.63], [0.69, 1]]
  .map(([a, b]) => [a * FEED_MS / 1000, b * FEED_MS / 1000]);

let running = [];
let timers = [];
let printed = false;
let entering = false;

function resetStrip() {
  running.forEach((a) => a.cancel());
  timers.forEach(clearTimeout);
  running = []; timers = [];
  printed = false;
  sound.stop();
  booth.classList.remove('alive', 'printing', 'done');
  page.classList.remove('done');
  enterBtn.disabled = true; replayBtn.disabled = true;
  strip.tabIndex = -1;
  strip.style.transform = 'translateY(-100%)';
  sway.style.transform = 'rotate(-.4deg)';
}

const later = (ms, fn) => timers.push(setTimeout(fn, ms));

function finish() {
  printed = true;
  booth.classList.remove('printing');
  booth.classList.add('done');
  later(350, () => {
    page.classList.add('done');
    enterBtn.disabled = false; replayBtn.disabled = false;
    strip.tabIndex = 0;
  });
}

function print() {
  resetStrip();
  if (reducedMotion) {
    strip.style.transform = 'translateY(1.2%)';
    sway.style.transform = 'rotate(-1.6deg)';
    booth.classList.add('alive');
    finish();
    return;
  }
  // 1. the machine wakes
  later(750, () => { booth.classList.add('alive'); sound.wake(); });
  // 2–8. the strip feeds out of the slot, photo by photo
  later(1250, () => {
    booth.classList.add('printing');
    sound.feed(MOTOR);
    const feed = strip.animate(
      FEED.map(([offset, y]) => ({ offset, transform: `translateY(${y}%)`, easing: 'cubic-bezier(.45,.05,.55,.95)' })),
      { duration: FEED_MS, fill: 'forwards' },
    );
    const drift = sway.animate([
      { transform: 'rotate(-.4deg)' }, { transform: 'rotate(-.1deg)', offset: 0.3 },
      { transform: 'rotate(-.7deg)', offset: 0.62 }, { transform: 'rotate(-.5deg)' },
    ], { duration: FEED_MS, fill: 'forwards', easing: 'ease-in-out' });
    running.push(feed, drift);
    feed.finished.then(() => {
      // 9. released by the rollers, the paper drops a hair and swings to rest
      booth.classList.remove('printing');
      sound.release();
      running.push(
        strip.animate([
          { transform: 'translateY(0%)' },
          { transform: 'translateY(1.7%)', offset: 0.35, easing: 'cubic-bezier(.3,0,.4,1)' },
          { transform: 'translateY(1%)', offset: 0.7 },
          { transform: 'translateY(1.2%)' },
        ], { duration: 900, fill: 'forwards', easing: 'cubic-bezier(.5,0,.3,1)' }),
        sway.animate([
          { transform: 'rotate(-.5deg)' }, { transform: 'rotate(-2.3deg)', offset: 0.4 },
          { transform: 'rotate(-1.2deg)', offset: 0.72 }, { transform: 'rotate(-1.6deg)' },
        ], { duration: 1300, fill: 'forwards', easing: 'ease-in-out' }),
      );
      later(700, finish);
    }).catch(() => {});
  });
}

function enter() {
  if (!printed || entering) return;
  entering = true;
  sound.stop();
  page.classList.add('leaving');
  document.body.classList.add('entering');
  window.scrollTo(0, 0);
  setTimeout(() => {
    document.body.classList.add('entered');
    document.body.classList.remove('intro');
  }, 550);
  setTimeout(() => { page.hidden = true; startReveals(); }, 1500);
}

enterBtn.addEventListener('click', enter);
strip.addEventListener('click', enter);
strip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); } });
$('#boothFrame').addEventListener('click', enter);
replayBtn.addEventListener('click', print);

$('#soundToggle').addEventListener('click', (e) => {
  const on = !sound.enabled;
  sound.setEnabled(on);
  e.currentTarget.setAttribute('aria-pressed', String(on));
  e.currentTarget.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
});

// Begin once the calligraphy and photos are ready, so nothing pops in mid-print.
const imagesReady = [...document.querySelectorAll('.strip--booth img')].map((img) =>
  img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; }));
Promise.race([
  Promise.all([document.fonts.ready, ...imagesReady]),
  new Promise((r) => setTimeout(r, 2500)),
]).then(() => {
  page.classList.add('ready');
  print();
});

// ── Page 2: gentle reveals, ribbon parallax, countdown ─────────────────────
function startReveals() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
}

if (!reducedMotion) {
  const ribbons = [$('#ribbonBack'), $('#ribbonFront')];
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(scrollY, 900) * -0.035;
      ribbons.forEach((r) => { r.style.transform = `translateY(${y.toFixed(2)}px)`; });
      ticking = false;
    });
  }, { passive: true });
}

const [wy, wm, wd] = WEDDING.weddingDate.split("-").map(Number);
const target = new Date(wy, wm - 1, wd).getTime();
const pad = (n) => String(n).padStart(2, '0');
function tick() {
  const diff = target - Date.now();
  if (diff <= 0) {
    $('#countdown').hidden = true;
    $('#cdToday').hidden = false;
    return;
  }
  const s = Math.floor(diff / 1000);
  $('#cdDays').textContent = Math.floor(s / 86400);
  $('#cdHours').textContent = pad(Math.floor(s / 3600) % 24);
  $('#cdMins').textContent = pad(Math.floor(s / 60) % 60);
  $('#cdSecs').textContent = pad(s % 60);
  setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
}
tick();

// ── Page 3: details form (Netlify Forms) ───────────────────────────────────
const form = $('#detailsForm');
const status = $('#formStatus');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = form.querySelector('.submit');
  btn.disabled = true;
  status.textContent = 'Sending…';
  try {
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString(),
    });
    if (!res.ok) throw new Error(String(res.status));
    form.classList.add('sent');
    status.textContent = 'Thank you — see you there!';
  } catch {
    status.textContent = 'Something went wrong sending your details. Please try again.';
    btn.disabled = false;
  }
});
