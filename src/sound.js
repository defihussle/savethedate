// A quiet vintage photo-printer, synthesised with Web Audio (no audio files).
// Silent unless the guest turns sound on.

export class PrinterSound {
  enabled = false;
  ctx = null;
  nodes = [];

  setEnabled(on) {
    this.enabled = on;
    if (on) {
      this.ctx ??= new AudioContext();
      this.ctx.resume();
    } else {
      this.stop();
    }
  }

  #noise() {
    const { ctx } = this;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  }

  #click(at, level = 0.05) {
    const { ctx } = this;
    const src = this.#noise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(level, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(at); src.stop(at + 0.1);
    this.nodes.push(src);
  }

  wake() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    this.#click(t, 0.04);
    this.#click(t + 0.09, 0.025);
  }

  // segments: [[startSec, endSec], ...] relative to now, where the rollers turn.
  feed(segments) {
    if (!this.enabled) return;
    const { ctx } = this;
    const t0 = ctx.currentTime;
    const end = t0 + segments[segments.length - 1][1] + 0.2;

    const src = this.#noise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.9;
    const motor = ctx.createOscillator();
    motor.type = 'triangle'; motor.frequency.value = 118;
    const motorGain = ctx.createGain(); motorGain.gain.value = 0.35;
    // gear chatter: amplitude wobble
    const lfo = ctx.createOscillator(); lfo.frequency.value = 22;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.25;
    const env = ctx.createGain(); env.gain.value = 0;
    const out = ctx.createGain(); out.gain.value = 0.06;

    src.connect(bp).connect(env);
    motor.connect(motorGain).connect(env);
    lfo.connect(lfoGain).connect(out.gain);
    env.connect(out).connect(ctx.destination);

    for (const [a, b] of segments) {
      env.gain.setTargetAtTime(1, t0 + a, 0.05);
      env.gain.setTargetAtTime(0.08, t0 + b - 0.08, 0.06);
    }
    env.gain.setTargetAtTime(0, end - 0.15, 0.05);
    [src, motor, lfo].forEach((n) => { n.start(t0); n.stop(end); });
    this.nodes.push(src, motor, lfo);
  }

  release() {
    if (!this.enabled) return;
    this.#click(this.ctx.currentTime, 0.03);
  }

  stop() {
    this.nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } });
    this.nodes = [];
  }
}
