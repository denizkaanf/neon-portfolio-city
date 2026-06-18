/* =====================================================================
   fx.js — extra atmosphere layers for the neon city (no deps).
   - distant skyline haze band + stars + drifting airships (depth)
   - additive light shafts from towers
   - lightning flashes
   - floating embers
   - wet-ground ripples
   Drawn via hooks from game.js render(). Self-contained & procedural.
   ===================================================================== */

const FX = (() => {
  let W = 0, H = 0;
  let skyline = null, skyGrad = null;
  const stars = [], airships = [], embers = [], ripples = [], motes = [], fogBanks = [], ash = [];
  let vents = [], steam = [], fogSprite = null;
  let lightTimer = 3 + Math.random() * 5, flash = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function buildSkyline() {
    // a wide silhouette strip of flat-topped towers with a few lit windows
    const w = 1024, h = 150;
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d");
    let px = 0;
    while (px < w) {
      const bw = 24 + (Math.random() * 46 | 0);
      const bh = 40 + (Math.random() * 100 | 0);
      const by = h - bh;
      x.fillStyle = "#0b0e1c"; x.fillRect(px, by, bw, bh);
      x.fillStyle = "rgba(25,230,255,0.05)"; x.fillRect(px, by, bw, 2);
      // lit windows
      for (let wy = by + 6; wy < h - 4; wy += 7)
        for (let wx = px + 4; wx < px + bw - 3; wx += 6)
          if (Math.random() < 0.35) {
            x.fillStyle = Math.random() < 0.5 ? "rgba(25,230,255,0.5)" : "rgba(255,200,90,0.45)";
            x.fillRect(wx, wy, 2, 3);
          }
      px += bw + (Math.random() * 6 | 0);
    }
    return c;
  }

  function makeAirship() {
    return { x: Math.random(), y: rnd(0.05, 0.22), sp: rnd(0.004, 0.012) * (Math.random() < 0.5 ? 1 : -1), s: rnd(0.7, 1.3), blink: 0, bt: 0 };
  }

  function resize(w, h) {
    W = w; H = h;
    if (!skyline) skyline = buildSkyline();
    const bandH = h * 0.42;
    const g = (document.createElement("canvas")).getContext("2d").createLinearGradient(0, 0, 0, bandH);
    g.addColorStop(0, "rgba(20,16,40,0.85)");
    g.addColorStop(0.5, "rgba(30,18,55,0.45)");
    g.addColorStop(1, "rgba(30,18,55,0)");
    skyGrad = { grad: g, bandH };
    if (stars.length === 0)
      for (let i = 0; i < 90; i++) stars.push({ x: Math.random(), y: Math.random() * 0.32, b: rnd(0.3, 1), tw: Math.random() * 6.28 });
    if (airships.length === 0) for (let i = 0; i < 3; i++) airships.push(makeAirship());
    if (embers.length === 0)
      for (let i = 0; i < 70; i++) embers.push({ x: Math.random(), y: Math.random(), sp: rnd(0.04, 0.12), sz: Math.random() < 0.3 ? 2 : 1, h: rnd(0.05, 0.13) });
    if (motes.length === 0)
      for (let i = 0; i < 50; i++) motes.push({ x: Math.random(), y: Math.random(), sp: rnd(0.008, 0.03), ph: Math.random() * 6.28 });
    if (ash.length === 0)
      for (let i = 0; i < 120; i++) ash.push({ x: Math.random(), y: Math.random(), sp: rnd(0.05, 0.13), sw: rnd(0.2, 0.6), sz: Math.random() < 0.3 ? 2 : 1 });
    if (!fogSprite) {
      fogSprite = document.createElement("canvas"); fogSprite.width = fogSprite.height = 256;
      const fc = fogSprite.getContext("2d");
      const fg = fc.createRadialGradient(128, 128, 0, 128, 128, 128);
      fg.addColorStop(0, "rgba(120,140,190,0.5)"); fg.addColorStop(1, "rgba(120,140,190,0)");
      fc.fillStyle = fg; fc.fillRect(0, 0, 256, 256);
    }
    if (fogBanks.length === 0)
      for (let i = 0; i < 4; i++) fogBanks.push({ x: Math.random() * 1.2 - 0.1, y: rnd(0.4, 0.85), sp: rnd(0.01, 0.03), s: rnd(1.4, 2.6) });
  }

  function update(dt, camX, camY, viewW, viewH) {
    // airships
    for (const a of airships) { a.x += a.sp * dt; if (a.x > 1.1) a.x = -0.1; if (a.x < -0.1) a.x = 1.1; a.bt += dt; if (a.bt > 0.6) { a.bt = 0; a.blink ^= 1; } }
    // stars twinkle
    for (const s of stars) s.tw += dt * 2;
    // embers rise
    for (const e of embers) { e.y -= e.sp * dt * 0.25; e.x += Math.sin(e.y * 10) * 0.0006; if (e.y < -0.02) { e.y = 1.02; e.x = Math.random(); } }
    // lightning
    lightTimer -= dt;
    if (lightTimer <= 0) { flash = 1; lightTimer = 8 + Math.random() * 14; }
    if (flash > 0) flash = Math.max(0, flash - dt * 3.2);
    // ripples: spawn within visible iso area, decay
    if (Math.random() < dt * 6) ripples.push({ ix: camX + Math.random() * viewW, iy: camY + viewH * (0.35 + Math.random() * 0.6), r: 1, life: 1 });
    for (let i = ripples.length - 1; i >= 0; i--) { const p = ripples[i]; p.r += dt * 26; p.life -= dt * 1.4; if (p.life <= 0) ripples.splice(i, 1); }
    // steam from vents (iso space)
    for (const v of vents) if (Math.random() < dt * 2.2) steam.push({ ix: v.ix + (Math.random() * 10 - 5), iy: v.iy, life: 1, r: 4 });
    for (let i = steam.length - 1; i >= 0; i--) { const p = steam[i]; p.iy -= dt * 14; p.r += dt * 10; p.life -= dt * 0.45; if (p.life <= 0) steam.splice(i, 1); }
    // data-motes (slow drifting glow)
    for (const m of motes) { m.ph += dt; m.y -= m.sp * dt * 0.2; m.x += Math.sin(m.ph) * 0.0004; if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); } }
    // rolling fog banks
    for (const f of fogBanks) { f.x += f.sp * dt; if (f.x > 1.25) f.x = -0.25; }
    // ash / snow flakes
    for (const a of ash) { a.y += a.sp * dt; a.x += a.sw * dt * 0.12 + Math.sin(a.y * 8) * 0.0005; if (a.y > 1.02) { a.y = -0.02; a.x = Math.random(); } if (a.x > 1) a.x -= 1; }
  }
  // slow drifting fog banks — SCREEN space
  function drawFogBanks(ctx, DPR, mul) {
    if (!fogSprite) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = "screen";
    for (const f of fogBanks) { ctx.globalAlpha = 0.05 * (mul == null ? 1 : mul); ctx.drawImage(fogSprite, f.x * W - 128 * f.s, f.y * H - 128 * f.s, 256 * f.s, 256 * f.s); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  // drifting data-motes — SCREEN space, additive
  function drawMotes(ctx, DPR) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    for (const m of motes) { ctx.globalAlpha = 0.1 + 0.12 * Math.sin(m.ph); ctx.fillStyle = "rgba(25,230,255,1)"; ctx.fillRect(m.x * W, m.y * H, 1.5, 1.5); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  // ash / snow — SCREEN space
  function drawAsh(ctx, DPR) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = "rgba(200,205,215,0.5)";
    for (const a of ash) ctx.fillRect(a.x * W, a.y * H, a.sz, a.sz);
  }
  // anamorphic horizontal light streak — WORLD transform, additive
  function streak(ctx, ix, iy, color) {
    const w = 90, h = 3;
    const g = ctx.createLinearGradient(ix - w, iy, ix + w, iy);
    g.addColorStop(0, hexA(color, 0)); g.addColorStop(0.5, hexA(color, 0.3)); g.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = g; ctx.fillRect(ix - w, iy - h / 2, w * 2, h);
  }
  function setVents(list) { vents = list; }
  // rising steam puffs — WORLD transform
  function drawSteam(ctx) {
    ctx.globalCompositeOperation = "lighter";
    for (const p of steam) {
      ctx.fillStyle = "rgba(120,150,200," + (p.life * 0.06).toFixed(3) + ")";
      ctx.beginPath(); ctx.ellipse(p.ix, p.iy, p.r, p.r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }
  // floating holographic billboard above a tower — WORLD transform, additive
  function holo(ctx, ix, iyTop, t, hex, seed, img) {
    const w = 30, h = 38, y0 = iyTop - 58 + Math.sin(t * 1.3 + (seed || 0)) * 2;
    const gx = (Math.sin(t * 23 + seed) > 0.95) ? 3 : 0;     // occasional glitch shift
    const x0 = ix - w / 2 + gx;
    ctx.globalAlpha = 0.34 + 0.1 * Math.sin(t * 5 + seed);
    ctx.fillStyle = hexA(hex, 0.12); ctx.fillRect(x0, y0, w, h);
    // real project thumbnail inside the panel
    if (img && img.complete && img.naturalWidth) {
      const prev = ctx.globalCompositeOperation; ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.6 + 0.15 * Math.sin(t * 5 + seed);
      ctx.drawImage(img, x0 + 1, y0 + 1, w - 2, h - 2);
      ctx.globalCompositeOperation = prev;
    }
    // scanlines + border
    ctx.globalAlpha = 0.5 + 0.1 * Math.sin(t * 5 + seed);
    ctx.fillStyle = hexA(hex, 0.45);
    for (let yy = y0 + 2; yy < y0 + h; yy += 4) ctx.fillRect(x0, yy + ((t * 18) % 4), w, 1);
    ctx.strokeStyle = hexA(hex, 0.7); ctx.lineWidth = 1; ctx.strokeRect(x0, y0, w, h);
    ctx.globalAlpha = 1;
  }
  // giant floating name hologram over the town — rendered to a buffer then
  // composited additively (so scanline gaps don't erase the city behind it)
  let lmC = null, lmX = null;
  function landmark(ctx, ix, iy, t, name) {
    if (!lmC) { lmC = document.createElement("canvas"); lmC.width = 460; lmC.height = 60; lmX = lmC.getContext("2d"); }
    const x = lmX, w = lmC.width, h = lmC.height;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h);
    x.font = "700 26px 'Orbitron','Segoe UI',sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.shadowColor = "rgba(25,230,255,0.9)"; x.shadowBlur = 14;
    x.fillStyle = "rgba(150,240,255,0.75)"; x.fillText(name, w / 2, h / 2);
    x.shadowBlur = 0;
    x.globalCompositeOperation = "destination-out"; x.fillStyle = "#000";
    for (let yy = 0; yy < h; yy += 3) x.fillRect(0, yy + ((t * 20) % 3), w, 1);
    x.globalCompositeOperation = "source-over";
    const flick = 0.85 + 0.15 * Math.sin(t * 4) - (Math.sin(t * 31) > 0.92 ? 0.3 : 0);
    let cosr = Math.cos(t * 0.7);                         // 360° spin around the vertical axis
    const a = Math.min(1, flick * (0.35 + 0.65 * Math.abs(cosr)));   // dim when edge-on
    const sx = (cosr < 0 ? -1 : 1) * Math.max(0.06, Math.abs(cosr));
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a;
    ctx.save();
    ctx.translate(ix, iy); ctx.scale(sx, 1);
    ctx.drawImage(lmC, -w / 2, -h / 2);
    ctx.restore();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }

  // distant skyline haze + stars + airships — SCREEN space (sets its own DPR transform)
  function drawSky(ctx, DPR, camX) {
    if (!skyGrad) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const bandH = skyGrad.bandH;
    // stars
    for (const s of stars) {
      const a = (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.tw))) * s.b;
      ctx.fillStyle = "rgba(200,230,255," + a.toFixed(2) + ")";
      ctx.fillRect(s.x * W, s.y * H, 1.5, 1.5);
    }
    // skyline silhouette (parallax with camera), tiled
    const sw = skyline.width, sh = skyline.height;
    const off = (-camX * 0.12) % sw;
    ctx.globalAlpha = 0.55;
    for (let dx = off - sw; dx < W + sw; dx += sw) ctx.drawImage(skyline, dx, bandH - sh, sw, sh);
    ctx.globalAlpha = 1;
    // haze band over it
    ctx.fillStyle = skyGrad.grad; ctx.fillRect(0, 0, W, bandH);
    // airships
    for (const a of airships) {
      const ax = a.x * W, ay = a.y * H, s = a.s;
      ctx.fillStyle = "rgba(14,16,30,0.9)";
      ctx.beginPath(); ctx.ellipse(ax, ay, 22 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(25,230,255,0.5)"; ctx.fillRect(ax - 10 * s, ay + 5 * s, 20 * s, 1.5);
      ctx.fillStyle = a.blink ? "#ff3df0" : "#39ff14"; ctx.fillRect(ax - 1, ay - 8 * s, 2, 2);
    }
  }

  // one additive light shaft rising from (ix, iyTop) — call in WORLD transform, 'lighter' set
  function shaft(ctx, ix, iyTop, color, t, seed) {
    const sway = Math.sin(t * 0.8 + (seed || 0)) * 8;
    const top = iyTop - 150, tw = 22;
    const lg = ctx.createLinearGradient(0, iyTop, 0, top);
    lg.addColorStop(0, hexA(color, 0.16)); lg.addColorStop(1, hexA(color, 0));
    ctx.globalAlpha = 1; ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(ix - 3, iyTop); ctx.lineTo(ix + 3, iyTop);
    ctx.lineTo(ix + tw + sway, top); ctx.lineTo(ix - tw + sway, top);
    ctx.closePath(); ctx.fill();
  }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  // wet-ground ripples — call in WORLD transform
  function drawRipples(ctx) {
    ctx.lineWidth = 1;
    for (const p of ripples) {
      ctx.strokeStyle = "rgba(120,200,255," + (p.life * 0.25).toFixed(3) + ")";
      ctx.beginPath(); ctx.ellipse(p.ix, p.iy, p.r, p.r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // floating embers — SCREEN space, additive
  function drawEmbers(ctx, DPR) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    for (const e of embers) {
      ctx.fillStyle = "rgba(255,150,60," + (e.h * 4).toFixed(2) + ")";
      ctx.fillRect(e.x * W, e.y * H, e.sz, e.sz);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  // lightning flash overlay — SCREEN space
  function drawLightning(ctx, DPR) {
    if (flash <= 0.001) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(150,180,255," + (flash * 0.45).toFixed(3) + ")";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
  }
  function flashAmt() { return flash; }

  return { resize, update, drawSky, shaft, drawRipples, drawEmbers, drawLightning, flashAmt, setVents, drawSteam, holo, landmark, drawFogBanks, drawMotes, drawAsh, streak };
})();
