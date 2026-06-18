/* =====================================================================
   sound.js — procedural audio via Web Audio API (no files, no deps).
   Ambient synth drone + rain hiss + reactive SFX. Opt-in, mutable.
   Browsers block audio until a user gesture, so call Sound.init() from
   the first keydown/pointerdown. Mute state persists in localStorage.
   ===================================================================== */

const Sound = (() => {
  let ctx = null, master = null, started = false, on = false;
  let muted = localStorage.getItem("pt_muted") === "1";

  function init() {
    if (started) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    started = true;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    ambient();
    on = true;
  }

  function ambient() {
    // --- synth drone: detuned oscillators -> lowpass with slow LFO ---
    const bed = ctx.createGain(); bed.gain.value = 0.10; bed.connect(master);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420; lp.connect(bed);
    [55, 55.5, 82.4, 110].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i < 2 ? "sawtooth" : "sine"; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = i < 2 ? 0.45 : 0.22;
      o.connect(g); g.connect(lp); o.start();
    });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
    const lg = ctx.createGain(); lg.gain.value = 180; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();

    // --- rain hiss: looping white noise -> bandpass ---
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1300; bp.Q.value = 0.5;
    const ng = ctx.createGain(); ng.gain.value = 0.045;
    noise.connect(bp); bp.connect(ng); ng.connect(master); noise.start();
  }

  function blip(freq, dur, type, vol) {
    if (!ctx || muted) return;
    const o = ctx.createOscillator(); o.type = type || "square"; o.frequency.value = freq;
    const g = ctx.createGain(); o.connect(g); g.connect(master);
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.14, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.08));
    o.start(t); o.stop(t + (dur || 0.08) + 0.02);
  }
  function thud(dur, vol, cut) {
    if (!ctx || muted) return;
    const n = Math.floor(ctx.sampleRate * (dur || 0.05));
    const buf = ctx.createBuffer(1, n, ctx.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cut || 700;
    const g = ctx.createGain(); g.gain.value = vol || 0.07;
    s.connect(f); f.connect(g); g.connect(master); s.start();
  }

  return {
    init,
    step() { thud(0.045, 0.05, 480); },
    ui() { blip(680, 0.06, "square", 0.1); },
    enter() { blip(300, 0.16, "sawtooth", 0.12); setTimeout(() => blip(560, 0.16, "sawtooth", 0.09), 70); },
    close() { blip(420, 0.1, "sine", 0.09); },
    toggle() {
      if (!started) { muted = false; localStorage.setItem("pt_muted", "0"); init(); return muted; } // first press turns it on
      muted = !muted; localStorage.setItem("pt_muted", muted ? "1" : "0");
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() { return muted; }
  };
})();
