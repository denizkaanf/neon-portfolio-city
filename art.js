/* =====================================================================
   ART  —  procedural CYBERPUNK city, drawn to offscreen canvases.
   2.5D look: buildings are oblique-extruded neon towers, props cast
   shadows (handled in game.js). Self-contained, no image files.
   Call Art.build() once before the game runs.
   ===================================================================== */

const Art = (() => {
  const TILE = 16;

  function cv(w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    return c;
  }
  function px(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function poly(ctx, pts, color) {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.fill();
  }
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r + 255 * amt)));
    g = Math.max(0, Math.min(255, Math.round(g + 255 * amt)));
    b = Math.max(0, Math.min(255, Math.round(b + 255 * amt)));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  const PAL = {
    ground:  "#0c0c16",
    groundD: "#090910",
    grid:    "#191930",
    street:  "#10101c",
    streetD: "#0b0b14",
    lane:    "#19e6ff",
    canal:   "#06121f",
    canalL:  "#19e6ff",
    facade:  "#15141f",
    win:     "#0c0b12",
    outline: "#05050a",
    skin:    "#caa48a",
    skinD:   "#a8836a"
  };
  // neon accents reused across towers/props
  const ACCENTS = ["#19e6ff", "#ff3df0", "#7a2bff", "#39ff14", "#ffb800", "#ff2d55"];

  // -- ground / streets / canal ----------------------------------------
  function groundTile(seed) {
    const c = cv(TILE, TILE), x = c.getContext("2d");
    px(x, 0, 0, TILE, TILE, PAL.ground);
    // faint grid
    px(x, 0, 0, TILE, 1, PAL.grid);
    px(x, 0, 0, 1, TILE, PAL.grid);
    const r = rng(seed);
    for (let i = 0; i < 3; i++) {
      const gx = (r() * TILE) | 0, gy = (r() * TILE) | 0;
      px(x, gx, gy, 1, 1, PAL.groundD);
    }
    if (r() < 0.18) px(x, (r() * 12) | 0, (r() * 12) | 0, 2, 1, "#1d2b3a"); // stray neon speck
    return c;
  }
  function streetTile(seed) {
    const c = cv(TILE, TILE), x = c.getContext("2d");
    px(x, 0, 0, TILE, TILE, PAL.street);
    px(x, 0, 0, TILE, 1, PAL.streetD);
    // dashed cyan lane glow down the middle
    const r = rng(seed);
    px(x, 7, 2, 2, 6, PAL.lane);
    px(x, 7, 1, 2, 8, "rgba(25,230,255,0.18)");
    if (r() < 0.5) px(x, 1, 12, 3, 1, "rgba(255,61,240,0.5)");
    return c;
  }
  function canalTile(seed) {
    const c = cv(TILE, TILE), x = c.getContext("2d");
    px(x, 0, 0, TILE, TILE, PAL.canal);
    const r = rng(seed);
    for (let i = 0; i < 3; i++) {
      const wy = (r() * TILE) | 0;
      px(x, (r() * 6) | 0, wy, 5, 1, "rgba(25,230,255,0.45)");
    }
    px(x, 0, 0, TILE, 1, "rgba(25,230,255,0.25)");
    return c;
  }
  function glyphTile(seed) {
    const c = cv(TILE, TILE), x = c.getContext("2d");
    const r = rng(seed);
    const col = ACCENTS[(r() * ACCENTS.length) | 0];
    const a = "rgba(" + hexRGB(col) + ",0.55)";
    // small neon ground mark / puddle reflection
    if (r() < 0.5) { px(x, 5, 7, 6, 1, a); px(x, 7, 5, 1, 5, a); }
    else { px(x, 4, 9, 8, 1, a); px(x, 6, 6, 4, 1, a); }
    return c;
  }
  function hexRGB(hex) {
    const n = parseInt(hex.slice(1), 16);
    return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255);
  }

  // -- extruded neon tower (the "houses") ------------------------------
  // oblique box: front face + top face + right face, neon windows.
  function tower(accent, hTiles, seed) {
    const x0 = 4, x1 = 52, dx = 6, dy = -6;
    const Hb = hTiles * 16 + 14;          // building height in px
    const W = x1 + dx + 3;
    const H = Hb + (-dy) + 2;
    const c = cv(W, H), x = c.getContext("2d");
    const baseB = H - 2, topF = baseB - Hb;
    const facade = PAL.facade;
    const topC = shade(facade, 0.10);
    const rightC = shade(facade, -0.14);
    // right + top faces (the 3D part)
    poly(x, [[x1, topF], [x1 + dx, topF + dy], [x1 + dx, baseB + dy], [x1, baseB]], rightC);
    poly(x, [[x0, topF], [x0 + dx, topF + dy], [x1 + dx, topF + dy], [x1, topF]], topC);
    // front facade
    px(x, x0, topF, x1 - x0, baseB - topF, facade);
    // neon roof trim + top edge
    px(x, x0, topF, x1 - x0, 2, accent);
    poly(x, [[x0, topF], [x0 + dx, topF + dy], [x1 + dx, topF + dy], [x1, topF]], "rgba(255,255,255,0.06)");
    px(x, x1, topF, dx, 1, shade(accent, -0.2));
    // vertical neon edge stripes
    px(x, x0, topF, 1, baseB - topF, accent);
    px(x, x1 - 1, topF, 1, baseB - topF, shade(accent, -0.25));
    // window grid (lit/unlit)
    const r = rng(seed);
    const litCols = [accent, "#ffd34d", "#ff3df0", "#19e6ff"];
    for (let wy = topF + 6; wy < baseB - 12; wy += 8) {
      for (let wx = x0 + 5; wx < x1 - 4; wx += 7) {
        const lit = r() < 0.55;
        if (lit) {
          const wc = litCols[(r() * litCols.length) | 0];
          px(x, wx - 1, wy - 1, 6, 7, "rgba(" + hexRGB(wc) + ",0.18)"); // glow
          px(x, wx, wy, 4, 5, wc);
        } else {
          px(x, wx, wy, 4, 5, PAL.win);
        }
      }
    }
    // glowing entrance
    const ex = ((x0 + x1) / 2 - 5) | 0;
    px(x, ex - 1, baseB - 13, 12, 13, "rgba(" + hexRGB(accent) + ",0.2)");
    px(x, ex, baseB - 11, 10, 11, PAL.win);
    px(x, ex, baseB - 11, 10, 2, accent);
    return c;
  }

  // -- perimeter wall block (border) -----------------------------------
  function wall(seed) {
    const W = 16, H = 22, c = cv(W, H), x = c.getContext("2d");
    const accent = ACCENTS[(rng(seed)() * ACCENTS.length) | 0];
    px(x, 1, 6, 14, 15, shade(PAL.facade, -0.03));
    px(x, 1, 6, 14, 2, accent);                              // neon cap
    px(x, 1, 5, 14, 1, "rgba(" + hexRGB(accent) + ",0.3)");  // glow
    px(x, 1, 6, 1, 15, shade(accent, -0.3));
    px(x, 7, 10, 2, 8, "rgba(" + hexRGB(accent) + ",0.25)");
    return c;
  }

  // -- street lamp (interior props) ------------------------------------
  function lamp(seed) {
    const W = 14, H = 30, c = cv(W, H), x = c.getContext("2d");
    const accent = ACCENTS[(rng(seed)() * ACCENTS.length) | 0];
    px(x, 6, 6, 2, 22, "#0d0d16");        // pole
    px(x, 6, 6, 1, 22, "#1a1a2a");
    px(x, 3, 3, 8, 4, "#0d0d16");          // head
    px(x, 4, 4, 6, 2, accent);             // light bar
    px(x, 2, 5, 10, 3, "rgba(" + hexRGB(accent) + ",0.22)"); // halo
    px(x, 4, 8, 6, 5, "rgba(" + hexRGB(accent) + ",0.10)");  // light cone
    return c;
  }

  // -- holographic monument (the old fountain), 2 pulse frames ---------
  function monument(frame) {
    const W = 32, H = 44, c = cv(W, H), x = c.getContext("2d");
    const a = "#19e6ff";
    // dark base
    px(x, 6, 34, 20, 8, shade(PAL.facade, -0.02));
    px(x, 6, 34, 20, 2, a);
    px(x, 6, 40, 20, 2, "#05050a");
    // holo pyramid (pulses)
    const glow = frame ? 0.5 : 0.32;
    for (let i = 0; i < 16; i++) {
      const w = 18 - i;
      px(x, 16 - w / 2, 32 - i, w, 1, "rgba(25,230,255," + (glow * (i / 16 + 0.3)).toFixed(2) + ")");
    }
    px(x, 15, 12 - (frame ? 1 : 0), 2, 6, a);     // top beam
    px(x, 14, 6, 4, 2, "rgba(25,230,255,0.5)");
    // floating ring
    px(x, 9, 20 + (frame ? 1 : 0), 14, 1, "rgba(255,61,240,0.5)");
    return c;
  }

  // -- sign post (kept for compatibility) ------------------------------
  function sign() {
    const W = 18, H = 22, c = cv(W, H), x = c.getContext("2d");
    px(x, 8, 8, 2, 14, "#0d0d16");
    px(x, 2, 2, 14, 8, shade(PAL.facade, 0.02));
    px(x, 2, 2, 14, 2, "#19e6ff");
    px(x, 4, 5, 9, 1, "rgba(25,230,255,0.6)");
    return c;
  }

  // -- pedestrian / player sheet (parameterized), 4 dirs x 3 steps -----
  function pedSheet(NEON, JACK, MAG) {
    const JACKD = shade(JACK, -0.25), PANT = "#10101c";
    function frame(dir, step) {
      const W = 16, H = 22, c = cv(W, H), x = c.getContext("2d");
      const top = 2;
      // hair (neon)
      px(x, 5, top, 6, 4, NEON);
      px(x, 4, top + 1, 8, 3, NEON);
      px(x, 5, top + 1, 6, 2, shade(NEON, -0.25));
      // face
      if (dir === "up") {
        px(x, 5, top + 3, 6, 3, shade(NEON, -0.3));
      } else {
        px(x, 5, top + 3, 6, 4, PAL.skin);
        px(x, 5, top + 6, 6, 1, PAL.skinD);
        // glowing cyber visor + facing glint
        px(x, 5, top + 4, 6, 1, "#19e6ff");
        if (dir === "left") px(x, 5, top + 4, 2, 1, "#ff3df0");
        else if (dir === "right") px(x, 9, top + 4, 2, 1, "#ff3df0");
        else px(x, 7, top + 4, 2, 1, "#ff3df0");
      }
      // jacket
      const by = top + 7;
      px(x, 4, by, 8, 6, JACK);
      px(x, 4, by, 8, 1, shade(JACK, 0.15));
      px(x, 4, by + 5, 8, 1, JACKD);
      px(x, 7, by, 2, 6, MAG);                 // magenta zipper line
      px(x, 3, by, 1, 6, NEON);                // neon rim left
      // arms
      px(x, 3, by + 1, 1, 4, PAL.skin);
      px(x, 12, by + 1, 1, 4, PAL.skin);
      // legs (walk cycle)
      const ly = by + 6;
      let l = 5, r = 9;
      if (step === 1) { l = 4; r = 9; }
      if (step === 2) { l = 6; r = 10; }
      px(x, l, ly, 2, 3, PANT);
      px(x, r, ly, 2, 3, PANT);
      px(x, l, ly + 3, 2, 2, NEON);            // glowing soles
      px(x, r, ly + 3, 2, 2, NEON);
      return c;
    }
    const dirs = ["down", "up", "left", "right"], sheet = {};
    dirs.forEach(d => { sheet[d] = [frame(d, 0), frame(d, 1), frame(d, 2)]; });
    return sheet;
  }

  // -- hovercar (faces right; mirror for left) -------------------------
  function car(accent) {
    const W = 28, H = 16, c = cv(W, H), x = c.getContext("2d");
    px(x, 3, 4, 22, 7, "#16161f");
    px(x, 3, 4, 22, 2, shade("#16161f", 0.22));
    px(x, 5, 5, 12, 3, accent);                 // tinted cabin
    px(x, 5, 5, 12, 1, "#bff6ff");
    px(x, 3, 11, 22, 2, accent);                // underglow
    px(x, 2, 12, 24, 1, "rgba(" + hexRGB(accent) + ",0.35)");
    px(x, 25, 6, 2, 3, "#fff6c8");              // headlight (front)
    px(x, 2, 6, 1, 3, "#ff3df0");               // taillight (back)
    return c;
  }
  function mirror(src) {
    const c = cv(src.width, src.height), x = c.getContext("2d");
    x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
    return c;
  }

  // -- overhead drone (2 blink frames) ---------------------------------
  function drone(blink) {
    const W = 14, H = 10, c = cv(W, H), x = c.getContext("2d");
    px(x, 1, 2, 3, 1, "#33334a"); px(x, 10, 2, 3, 1, "#33334a");   // arms
    px(x, 1, 1, 2, 1, "rgba(25,230,255,0.5)"); px(x, 11, 1, 2, 1, "rgba(25,230,255,0.5)");
    px(x, 4, 3, 6, 4, "#1a1a26");               // body
    px(x, 5, 4, 4, 1, "#19e6ff");
    px(x, 6, 6, 2, 2, blink ? "#ff3df0" : "#39ff14"); // nav light
    return c;
  }

  // -- arcade cabinet --------------------------------------------------
  function arcadeCabinet(accent) {
    const W = 22, H = 32, c = cv(W, H), x = c.getContext("2d");
    const base = "#14141f";
    px(x, 3, 4, 16, 26, base);
    px(x, 3, 4, 16, 2, shade(base, 0.15));
    px(x, 3, 4, 2, 26, shade(base, -0.12));
    px(x, 4, 4, 14, 2, "#ff3df0");              // marquee
    px(x, 5, 7, 12, 9, "#050810");              // screen well
    px(x, 6, 8, 10, 7, accent);                 // screen
    px(x, 6, 8, 10, 3, "#bff6ff");
    px(x, 5, 6, 12, 1, "rgba(" + hexRGB(accent) + ",0.5)");
    px(x, 4, 18, 14, 3, shade(base, 0.06));     // control panel
    px(x, 7, 19, 2, 1, "#39ff14"); px(x, 11, 19, 2, 1, "#ffb800");
    px(x, 4, 29, 14, 1, "rgba(" + hexRGB(accent) + ",0.4)");
    return c;
  }

  // -- soft radial glow disc (for additive bloom / light pools) --------
  function makeBlob(color) {
    const S = 64, c = cv(S, S), x = c.getContext("2d");
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(" + hexRGB(color) + ",1)");
    g.addColorStop(0.4, "rgba(" + hexRGB(color) + ",0.32)");
    g.addColorStop(1, "rgba(" + hexRGB(color) + ",0)");
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    return c;
  }

  // -- isometric neon tower -------------------------------------------
  // returns { c, ax, ay, fh } : draw at (isoCx-ax, isoCy-ay); sort key = isoCy+fh
  function isoTower(accent, ph, halfW, style) {
    const halfH = halfW / 2, padS = 6, padT = style ? 48 : 8;
    const W2 = 2 * halfW + 2 * padS, H2 = ph + 2 * halfH + padT + 4;
    const c = cv(W2, H2), x = c.getContext("2d");
    const bx = W2 / 2, by = H2 - halfH - 2;          // base diamond center
    const lerp = (a, b, t) => a + (b - a) * t;
    const L = [bx - halfW, by], R = [bx + halfW, by], B = [bx, by + halfH], T = [bx, by - halfH];
    const up = p => [p[0], p[1] - ph];
    const Lu = up(L), Ru = up(R), Bu = up(B), Tu = up(T);
    // faces
    poly(x, [L, B, Bu, Lu], "#0e1120");              // left face (dark)
    poly(x, [B, R, Ru, Bu], "#181c30");              // right face (mid)
    poly(x, [Tu, Ru, Bu, Lu], "#222840");            // roof (light)
    // neon roof trim + vertical edges
    x.strokeStyle = accent; x.lineWidth = 2; x.lineJoin = "round";
    x.beginPath(); x.moveTo(Tu[0], Tu[1]); [Ru, Bu, Lu, Tu].forEach(p => x.lineTo(p[0], p[1])); x.stroke();
    x.strokeStyle = "rgba(" + hexRGB(accent) + ",0.5)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(B[0], B[1]); x.lineTo(Bu[0], Bu[1]); x.stroke();
    // windows on both visible faces
    const lit = ["#ffd34d", accent, "#19e6ff", "#ff3df0"];
    const seedr = rng((ph * 131 + halfW) | 0);
    function face(p0, p1) {
      for (let h = 12; h < ph - 8; h += 13) {
        for (const u of [0.28, 0.5, 0.72]) {
          const wx = lerp(p0[0], p1[0], u), wy = lerp(p0[1], p1[1], u) - h;
          if (seedr() < 0.6) {
            const wc = lit[(seedr() * lit.length) | 0];
            px(x, wx - 2, wy - 3, 5, 6, "rgba(" + hexRGB(wc) + ",0.18)");
            px(x, wx - 1, wy - 2, 3, 4, wc);
          } else px(x, wx - 1, wy - 2, 3, 4, "#0a0c16");
        }
      }
    }
    face(L, B); face(B, R);
    // facade detail: balcony ledges + AC units / pipes
    const det = rng((ph * 7 + halfW * 3) | 0);
    function detail(p0, p1) {
      for (let hh = 20; hh < ph - 14; hh += 20) {
        x.strokeStyle = "rgba(0,0,0,0.22)"; x.lineWidth = 1;
        x.beginPath(); x.moveTo(lerp(p0[0], p1[0], 0.14), lerp(p0[1], p1[1], 0.14) - hh);
        x.lineTo(lerp(p0[0], p1[0], 0.86), lerp(p0[1], p1[1], 0.86) - hh); x.stroke();
      }
      for (let k = 0; k < 3; k++) if (det() < 0.6) {
        const u = 0.2 + det() * 0.6, hh = 14 + det() * (ph - 30);
        const ax = lerp(p0[0], p1[0], u), ay = lerp(p0[1], p1[1], u) - hh;
        px(x, ax - 3, ay - 2, 6, 4, "#0c0e16"); px(x, ax - 3, ay - 2, 6, 1, "#1a1e2c");
      }
    }
    detail(L, B); detail(B, R);
    // horizontal neon shop sign on the right face
    { const hh = ph * 0.6;
      const sx0 = lerp(B[0], R[0], 0.22), sy0 = lerp(B[1], R[1], 0.22) - hh;
      const sx1 = lerp(B[0], R[0], 0.7), sy1 = lerp(B[1], R[1], 0.7) - hh;
      x.strokeStyle = accent; x.lineWidth = 2; x.beginPath(); x.moveTo(sx0, sy0); x.lineTo(sx1, sy1); x.stroke();
      for (let gi = 0; gi < 4; gi++) { const u = 0.26 + gi * 0.12; const gx = lerp(B[0], R[0], u), gy = lerp(B[1], R[1], u) - hh - 6; px(x, gx - 1, gy, 3, 4, gi % 2 ? "#ff3df0" : accent); }
    }
    // neon vertical sign on the right face
    { const sx0 = lerp(B[0], R[0], 0.6), sy0 = lerp(B[1], R[1], 0.6);
      for (let k = 0; k < 4; k++) {
        const sy = sy0 - 24 - k * 7;
        px(x, sx0 - 2, sy - 1, 6, 8, "rgba(" + hexRGB(accent) + ",0.18)");
        px(x, sx0 - 1, sy, 3, 5, k === 1 ? "#ff3df0" : accent);
      }
    }
    // rooftop mast + blinking light
    { const tx2 = bx, ty2 = by - ph;
      px(x, tx2 - 1, ty2 - 14, 2, 14, "#0c0e18");
      px(x, tx2 - 3, ty2 - 17, 6, 3, "rgba(255,61,240,0.3)");
      px(x, tx2 - 2, ty2 - 16, 4, 2, "#ff3df0");
    }
    // silhouette variety
    if (style === 1) {                  // setback upper tier
      const hw2 = halfW * 0.6, hh2 = hw2 / 2, ph2 = 32, ry = by - ph;
      const aL = [bx - hw2, ry], aR = [bx + hw2, ry], aB = [bx, ry + hh2], aT = [bx, ry - hh2];
      const u2 = p => [p[0], p[1] - ph2];
      poly(x, [aL, aB, u2(aB), u2(aL)], "#0e1120");
      poly(x, [aB, aR, u2(aR), u2(aB)], "#181c30");
      poly(x, [u2(aT), u2(aR), u2(aB), u2(aL)], "#222840");
      x.strokeStyle = accent; x.lineWidth = 2; x.beginPath();
      x.moveTo(u2(aT)[0], u2(aT)[1]); [u2(aR), u2(aB), u2(aL), u2(aT)].forEach(p => x.lineTo(p[0], p[1])); x.stroke();
    } else if (style === 2) {            // tall antenna with beacon
      px(x, bx - 1, by - ph - 30, 2, 30, "#0c0e18");
      px(x, bx - 3, by - ph - 33, 6, 3, "rgba(255,61,240,0.4)");
      px(x, bx - 1, by - ph - 32, 2, 2, "#ff3df0");
    }
    // entrance glow at base front
    px(x, bx - 4, by + halfH - 12, 8, 10, "rgba(" + hexRGB(accent) + ",0.25)");
    return { c, ax: bx, ay: by, fh: halfH, ph };
  }

  // -- game "key art" figures (stand in for missing screenshots) -------
  function rr(x, X, Y, W2, H2, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W2, Y, X + W2, Y + H2, r); x.arcTo(X + W2, Y + H2, X, Y + H2, r); x.arcTo(X, Y + H2, X, Y, r); x.arcTo(X, Y, X + W2, Y, r); x.closePath(); }
  function figDealNDrop() {
    const W2 = 480, H2 = 270, c = cv(W2, H2), x = c.getContext("2d");
    x.imageSmoothingEnabled = true;
    x.fillStyle = "#1A1530"; x.fillRect(0, 0, W2, H2);
    const cx = W2 / 2, cy = H2 / 2 + 6;
    // bedroom tile
    rr(x, cx - 150, cy - 80, 300, 154, 16); x.fillStyle = "#241c46"; x.fill(); x.strokeStyle = "#7B61FF"; x.lineWidth = 2; x.stroke();
    rr(x, cx - 128, cy - 60, 82, 46, 8); x.fillStyle = "#3a2f63"; x.fill(); rr(x, cx - 128, cy - 60, 82, 14, 8); x.fillStyle = "#5a4d8f"; x.fill();  // bed
    x.fillStyle = "#33285c"; x.beginPath(); x.ellipse(cx + 24, cy + 42, 62, 18, 0, 0, 6.2832); x.fill();                                            // rug
    rr(x, cx + 56, cy - 52, 72, 72, 6); x.fillStyle = "#2e2552"; x.fill(); x.strokeStyle = "#7B61FF"; x.lineWidth = 1; x.stroke();                  // drawer
    rr(x, cx + 92, cy - 32, 48, 22, 4); x.fillStyle = "#3a2f63"; x.fill(); x.strokeStyle = "#F4F0FF"; x.stroke();                                   // open drawer (hiding spot)
    x.strokeStyle = "#5a4d8f"; x.lineWidth = 2; x.beginPath(); x.moveTo(cx + 118, cy - 60); x.lineTo(cx + 118, cy - 76); x.stroke();
    x.fillStyle = "#FFC93C"; x.beginPath(); x.arc(cx + 118, cy - 80, 6, 0, 6.2832); x.fill();                                                       // lamp
    // fog-of-war vignette
    const fg = x.createRadialGradient(cx, cy, 28, cx, cy, 270);
    fg.addColorStop(0, "rgba(244,240,255,0.12)"); fg.addColorStop(0.5, "rgba(26,21,48,0)"); fg.addColorStop(1, "rgba(26,21,48,0.92)");
    x.fillStyle = fg; x.fillRect(0, 0, W2, H2);
    // proximity rattle rings
    for (let i = 3; i >= 1; i--) { x.strokeStyle = "rgba(61,220,151," + (0.13 * i).toFixed(2) + ")"; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, 30 + i * 16, 0, 6.2832); x.stroke(); }
    // coin + halo
    x.fillStyle = "rgba(244,240,255,0.18)"; x.beginPath(); x.arc(cx, cy, 34, 0, 6.2832); x.fill();
    x.fillStyle = "#FFC93C"; x.beginPath(); x.arc(cx, cy, 22, 0, 6.2832); x.fill();
    x.strokeStyle = "#fff7d0"; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, 22, Math.PI * 1.05, Math.PI * 1.55); x.stroke();
    x.fillStyle = "#c78f1f"; x.font = "bold 20px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("₺", cx, cy + 1);
    x.strokeStyle = "#ffffff"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx + 17, cy - 22); x.lineTo(cx + 25, cy - 30); x.moveTo(cx + 21, cy - 26); x.lineTo(cx + 21, cy - 34); x.moveTo(cx + 17, cy - 26); x.lineTo(cx + 25, cy - 26); x.stroke();  // sparkle
    // dashed search path
    x.strokeStyle = "rgba(244,240,255,0.4)"; x.lineWidth = 2; x.setLineDash([6, 6]);
    x.beginPath(); x.moveTo(40, H2 - 28); x.quadraticCurveTo(cx - 130, H2 - 14, cx - 28, cy + 22); x.stroke(); x.setLineDash([]);
    // deal badge
    rr(x, 16, 16, 104, 30, 8); x.fillStyle = "#FF4D6D"; x.fill();
    x.fillStyle = "#fff"; x.font = "700 13px 'Orbitron','Segoe UI',sans-serif"; x.textAlign = "left"; x.fillText("DEAL ✦", 28, 32);
    // micro-puzzle glyphs
    x.fillStyle = "#FF4D6D"; x.beginPath(); x.arc(W2 - 96, H2 - 24, 5, 0, 6.2832); x.fill();
    x.strokeStyle = "#3DDC97"; x.lineWidth = 2; x.beginPath(); x.moveTo(W2 - 72, H2 - 30); x.lineTo(W2 - 64, H2 - 24); x.lineTo(W2 - 72, H2 - 18); x.stroke();
    rr(x, W2 - 48, H2 - 28, 30, 8, 4); x.fillStyle = "#FFC93C"; x.fill();
    return c;
  }
  function figDeadline() {
    const W2 = 480, H2 = 270, c = cv(W2, H2), x = c.getContext("2d");
    x.imageSmoothingEnabled = true;
    const A0 = "#F2A007";
    x.fillStyle = "#1A1726"; x.fillRect(0, 0, W2, H2);
    x.strokeStyle = "rgba(74,91,166,0.10)"; x.lineWidth = 1;
    for (let gx = 0; gx <= W2; gx += 16) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H2); x.stroke(); }
    for (let gy = 0; gy <= H2; gy += 16) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W2, gy); x.stroke(); }
    x.fillStyle = "rgba(0,0,0,0.12)"; for (let sy = 0; sy < H2; sy += 4) x.fillRect(0, sy, W2, 1);  // scanlines
    const cx = W2 / 2, cy = H2 / 2 - 8;
    // mini-game micro-icons in an arc above
    function clapper(px, py) { x.fillStyle = "#E8D8B0"; rr(x, px, py + 6, 24, 16, 2); x.fill(); x.fillStyle = "#1A1726"; for (let k = 0; k < 3; k++) x.fillRect(px + 2 + k * 8, py + 8, 4, 3); x.save(); x.translate(px, py); x.fillStyle = "#E8D8B0"; x.beginPath(); x.moveTo(0, 6); x.lineTo(24, 2); x.lineTo(24, 6); x.lineTo(0, 10); x.closePath(); x.fill(); x.restore(); }
    function clock(px, py) { x.strokeStyle = "#7BC4A4"; x.lineWidth = 2; x.beginPath(); x.arc(px + 11, py + 11, 11, 0, 6.2832); x.stroke(); x.beginPath(); x.moveTo(px + 11, py + 11); x.lineTo(px + 11, py + 4); x.moveTo(px + 11, py + 11); x.lineTo(px + 17, py + 13); x.stroke(); }
    function meter(px, py) { const cols = ["#4A5BA6", "#7BC4A4", "#F2A007", "#D94F4F"]; cols.forEach((co, i) => { x.fillStyle = co; rr(x, px + i * 7, py + 6, 6, 12, 2); x.fill(); }); }
    function layers(px, py) { x.fillStyle = "#4A5BA6"; for (let k = 0; k < 3; k++) { rr(x, px + k * 4, py + k * 4, 20, 10, 2); x.fillStyle = k === 0 ? "#4A5BA6" : (k === 1 ? "#7BC4A4" : "#D94F4F"); x.fill(); } }
    clapper(cx - 150, cy - 96); clock(cx - 96, cy - 116); meter(cx + 70, cy - 116); layers(cx + 122, cy - 96);
    // Pim — blocky pixel figure
    x.fillStyle = A0; rr(x, cx - 46, cy + 12, 92, 84, 14); x.fill();                                  // body/hoodie
    x.beginPath(); x.arc(cx, cy - 4, 42, Math.PI, 0); x.fill(); rr(x, cx - 42, cy - 4, 84, 30, 6); x.fill();  // hood
    x.fillStyle = "#16121f"; rr(x, cx - 27, cy, 54, 36, 11); x.fill();                                 // hood opening
    x.fillStyle = "#E8D8B0"; rr(x, cx - 20, cy + 4, 40, 28, 9); x.fill();                              // face
    x.fillStyle = "#16121f"; x.fillRect(cx - 12, cy + 12, 6, 7); x.fillRect(cx + 6, cy + 12, 6, 7);    // eyes
    x.strokeStyle = "#c98605"; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - 30, cy + 66); x.lineTo(cx + 30, cy + 66); x.stroke();  // pocket
    x.strokeStyle = "#0e0b16"; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 24, cy + 34); x.lineTo(cx, cy + 60); x.lineTo(cx + 24, cy + 34); x.stroke();  // strap
    x.fillStyle = "#23202e"; rr(x, cx - 17, cy + 54, 34, 22, 4); x.fill(); x.fillStyle = "#4A5BA6"; x.beginPath(); x.arc(cx, cy + 65, 7, 0, 6.2832); x.fill(); x.fillStyle = "#7BC4A4"; x.beginPath(); x.arc(cx, cy + 65, 3, 0, 6.2832); x.fill();  // camera
    x.fillStyle = "#E8D8B0"; x.font = "700 26px Georgia,serif"; x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillText("“", cx + 46, cy + 4);  // narrator glyph
    // stat pips
    const pips = ["#7BC4A4", "#4A5BA6", "#D94F4F", "#F2A007", "#E8D8B0"];
    pips.forEach((co, i) => { x.fillStyle = co; rr(x, cx - 48 + i * 20, H2 - 54, 14, 10, 3); x.fill(); });
    x.fillStyle = "#E8D8B0"; x.fillRect(cx - 48 + 4 * 20 + 14, H2 - 51, 2, 4);  // battery nub
    // bold amber deadline slash across the lower third
    x.fillStyle = A0; x.save(); x.translate(0, H2 - 30); x.rotate(-0.06); x.fillRect(-10, 0, W2 + 20, 7); x.restore();
    x.fillStyle = "rgba(242,160,7,0.25)"; x.save(); x.translate(0, H2 - 26); x.rotate(-0.06); x.fillRect(-10, 0, W2 + 20, 3); x.restore();
    return c;
  }

  // -- build atlas ------------------------------------------------------
  const A = { TILE, PAL, ACCENTS, ROOFS: ACCENTS, shade };
  A.build = function () {
    A.grass = [groundTile(11), groundTile(29), groundTile(53), groundTile(97)]; // "ground"
    A.path  = [streetTile(7), streetTile(41), streetTile(73)];
    A.water = [canalTile(13), canalTile(61)];
    A.flowers = [glyphTile(3), glyphTile(19), glyphTile(37), glyphTile(67)];
    A.wall = [wall(5), wall(23), wall(57), wall(83)];
    A.lamp = lamp(31);
    A.tree = A.lamp;                              // alias (interior props)
    A.monument = [monument(0), monument(1)];
    A.fountain = A.monument;                      // alias
    A.sign = sign();
    A.player = pedSheet("#19e6ff", "#1c1c30", "#ff3df0");
    A.peds = [
      pedSheet("#ff3df0", "#1c1c30", "#19e6ff"),
      pedSheet("#39ff14", "#141426", "#ffb800"),
      pedSheet("#19e6ff", "#201528", "#ff2d55"),
      pedSheet("#ffb800", "#16131f", "#7a2bff"),
      pedSheet("#ff2d55", "#12121d", "#19e6ff")
    ];
    A.cars = ACCENTS.slice(0, 4).map(a => { const r = car(a); return { right: r, left: mirror(r) }; });
    A.drones = [drone(0), drone(1)];
    A.arcade = (accent) => arcadeCabinet(accent);
    A.blobs = {};
    [...ACCENTS, "#19e6ff", "#ffd9a0", "#ffffff"].forEach(col => { A.blobs[col] = makeBlob(col); });
    A.tower = (accent, hTiles, seed) => tower(accent, hTiles, seed);
    A.house = (accent) => tower(accent, 5, 7);   // fallback
    A.isoTower = (accent, ph, halfW) => isoTower(accent, ph, halfW);
    A.gameFigure = (key) => key === "deadline" ? figDeadline() : (key === "dealndrop" ? figDealNDrop() : null);
    return A;
  };
  return A;
})();
