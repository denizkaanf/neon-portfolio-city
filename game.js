/* =====================================================================
   GAME ENGINE — top-down cozy town portfolio
   - WASD / Arrows to move, E / Space / tap to interact
   - Houses are generated from PORTFOLIO (data.js)
   - Pure canvas, no dependencies. Works on file:// and static hosting.
   ===================================================================== */

(() => {
  const TILE = 16;
  const ZOOM = 1.4;               // iso px -> screen px
  const SPEED = 64;               // player px/sec
  const W = 80, H = 34;           // map size in tiles (extended east for the rail line)
  const worldW = W * TILE, worldH = H * TILE;

  // ----- ISOMETRIC projection -----------------------------------------
  // tile diamond = TW x TH on screen. world px (wx,wy) -> iso px (ix,iy).
  // derived: ix = (wx-wy)*2 + OFF ,  iy = (wx+wy)   (since TW=4*TILE/... )
  const TW = 64, TH = 32;
  const ISO_OFFX = worldH * 2;                 // shift so ix >= 0
  const isoW = (worldW + worldH) * 2;          // iso canvas width
  const isoH = (worldW + worldH);              // iso canvas height (ground)
  const isoX = (wx, wy) => (wx - wy) * 2 + ISO_OFFX;
  const isoY = (wx, wy) => (wx + wy);

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let viewW = 0, viewH = 0;       // visible iso size in iso px

  Art.build();

  // ---- i18n (EN / TR) ------------------------------------------------
  let lang = localStorage.getItem("pt_lang") || "en";
  const t = k => (STR[lang] && STR[lang][k]) || STR.en[k] || k;
  const tl = label => (lang === "tr" && LABELS_TR[label]) || label;
  let lastStation = null;
  function applyLangUI() {
    const r = document.getElementById("role-tag"); if (r) r.textContent = lang === "tr" ? PORTFOLIO.roleTR : PORTFOLIO.role;
    const hn = document.querySelector("#topbar .hint"); if (hn) hn.innerHTML = t("hint");
    const hr = document.getElementById("hire"); if (hr) hr.innerHTML = t("hire");
    const lg = document.getElementById("lang"); if (lg) lg.textContent = lang === "tr" ? "EN" : "TR";
    const fh = document.getElementById("firsthint"); if (fh) fh.innerHTML = t("firsthint");
    const ph = document.getElementById("photo-hint"); if (ph) ph.innerHTML = t("photoHint");
    const ld = document.getElementById("loader"); if (ld) ld.textContent = t("loader");
  }

  // ---- world data: CIRCULAR cyberpunk town (Town-of-Salem style) -----
  // terrain[y][x]: -1 void, 0 ground, 1 street/plaza, 2 neon moat
  const terrain = [], solid = [];
  for (let y = 0; y < H; y++) {
    terrain[y] = []; solid[y] = [];
    for (let x = 0; x < W; x++) { terrain[y][x] = 0; solid[y][x] = false; }
  }
  const setSolid = (tx, ty) => { if (ty >= 0 && ty < H && tx >= 0 && tx < W) solid[ty][tx] = true; };

  const ccx = 24, ccy = (H / 2) | 0;                // town center tile (kept on the west side)
  const cdist = (x, y) => Math.hypot(x - ccx, y - ccy);
  const R_PLAZA = 3.6, R_RING = 7.6, R_HOUSE = 10, R_EDGE = 11.6, R_MOAT = 13.3, R_CITY = 18.5;

  // ---- rail line: corridor east of town + two platforms ----
  const RAIL_Y = ccy;                                // track centre row (= 17)
  const DEP_X = 73, ARR_X = 37;                      // departure (far) & arrival (town) stop tiles
  const railSet = new Set();
  const inCorridor = (x, y) =>
    (y >= RAIL_Y - 1 && y <= RAIL_Y + 1 && x >= ARR_X - 1 && x <= DEP_X + 1) ||   // 3-wide track
    (x >= 64 && x <= DEP_X + 1 && y >= RAIL_Y - 3 && y <= RAIL_Y + 3) ||          // departure platform
    (x >= 33 && x <= 41 && y >= RAIL_Y - 3 && y <= RAIL_Y + 3);                   // arrival platform

  const outskirts = [];                              // baked distant skyline ring
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (inCorridor(x, y)) { terrain[y][x] = 1; solid[y][x] = false; railSet.add(y * W + x); continue; }
      const d = cdist(x, y);
      if (d < R_PLAZA || Math.abs(d - R_RING) < 1.15 || ((x === ccx || y === ccy) && d < R_HOUSE + 0.5))
        terrain[y][x] = 1;                           // plaza + ring road + 4 avenues
      else if (d >= R_EDGE && d <= R_MOAT) { terrain[y][x] = 2; setSolid(x, y); }     // neon moat
      else if (d > R_MOAT && d <= R_CITY) { terrain[y][x] = -1; setSolid(x, y); outskirts.push({ x, y, seed: (x * 73 + y * 131) >>> 0 }); }
      else if (d > R_CITY) { terrain[y][x] = -1; setSolid(x, y); }                    // void
    }

  // central monument (the town square), solid
  const fountain = { wx: ccx * TILE - 8, wy: ccy * TILE - 26 };
  setSolid(ccx, ccy);

  // ---- stations (one per house) -------------------------------------
  const stations = [];
  stations.push({ type: "about", label: "About Me" });
  (PORTFOLIO.galleries || []).forEach((g, i) => stations.push({ type: "gallery", label: g.title, gallery: g, index: i }));
  PORTFOLIO.projects.forEach((p, i) => stations.push({ type: "project", label: p.title, project: p, index: i }));
  stations.push({ type: "contact", label: "Contact" });
  const arcadeStations = [
    { type: "arcade", label: "ARCADE · NEON RUNNER", game: "runner", accent: "#19e6ff" },
    { type: "arcade", label: "ARCADE · DATA SNAKE", game: "snake", accent: "#ff3df0" }
  ];
  const allStations = stations.concat(arcadeStations);

  // place houses evenly around the ring, doors facing the center
  const houses = [];
  const N = allStations.length;
  allStations.forEach((st, i) => {
    const ang = (-90 + i * (360 / N)) * Math.PI / 180;
    const hx = Math.round(ccx + R_HOUSE * Math.cos(ang));
    const hy = Math.round(ccy + R_HOUSE * Math.sin(ang));
    const dtx = Math.round(ccx + (R_HOUSE - 1.8) * Math.cos(ang));
    const dty = Math.round(ccy + (R_HOUSE - 1.8) * Math.sin(ang));
    setSolid(hx, hy); terrain[hy][hx] = 0;
    const isArcade = st.type === "arcade";
    const accent = isArcade ? st.accent : Art.ACCENTS[i % Art.ACCENTS.length];
    const hTiles = 4 + (i % 4);
    let thumb = null;                                   // billboard shows real work
    if (st.type === "gallery" && st.gallery) {
      let src = null;
      (st.gallery.groups || []).some(gr => (gr.items || []).some(it => { if (it.type === "image") { src = it.src; return true; } return false; }));
      if (src) { thumb = new Image(); thumb.src = src; }
    }
    houses.push({
      station: st, accent, isArcade, thumb,
      cx: (hx + 0.5) * TILE, wcy: (hy + 0.5) * TILE,
      iso: isArcade ? Art.isoTower(accent, 46, 30, 0) : Art.isoTower(accent, 56 + hTiles * 22, 58, i % 3),
      doorWX: (dtx + 0.5) * TILE, doorWY: (dty + 0.5) * TILE
    });
  });

  // ---- lamps + neon ground glyphs inside the town -------------------
  const interiorTrees = [], decor = [];
  (function scatter() {
    let s = 12345;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    let placed = 0, tries = 0;
    while (placed < 16 && tries < 900) {
      tries++;
      const tx = 1 + ((rnd() * (W - 2)) | 0), ty = 1 + ((rnd() * (H - 2)) | 0);
      const d = cdist(tx, ty);
      if (d > R_EDGE - 0.6 || d < R_PLAZA + 0.5 || solid[ty][tx]) continue;
      let near = false;
      for (const h of houses) if (Math.abs(tx - h.cx / TILE) < 2 && Math.abs(ty - h.wcy / TILE) < 2) near = true;
      if (near) continue;
      setSolid(tx, ty);
      interiorTrees.push({ tx, ty, wx: tx * TILE, wy: ty * TILE });
      placed++;
    }
    for (let i = 0; i < 70; i++) {
      const tx = 1 + ((rnd() * (W - 2)) | 0), ty = 1 + ((rnd() * (H - 2)) | 0);
      if (cdist(tx, ty) > R_EDGE - 0.4 || solid[ty][tx] || terrain[ty][tx] === -1) continue;
      decor.push({ wx: tx * TILE, wy: ty * TILE });
    }
  })();

  // ---- pre-render the static ISOMETRIC ground layer ------------------
  // ---- collectible data-chips (hidden easter-egg hunt) --------------
  const chips = [];
  (function placeChips() {
    let s = 999; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    let n = 0, tries = 0;
    while (n < 5 && tries < 500) {
      tries++;
      const tx = 1 + ((rnd() * (W - 2)) | 0), ty = 1 + ((rnd() * (H - 2)) | 0);
      const d = cdist(tx, ty);
      if (d > R_EDGE - 1 || d < R_PLAZA + 1 || solid[ty][tx]) continue;
      chips.push({ wx: tx * TILE + 8, wy: ty * TILE + 8, got: false }); n++;
    }
  })();
  let chipsGot = 0, overdrive = 0;

  // ---- mood / weather presets (cycled with the 🌙 button) -----------
  const MOODS = [
    { name: "Midnight", grade: "rgba(12,16,40,0.36)", rain: 1.0, fog: 1.0 },
    { name: "Dusk", grade: "rgba(46,16,46,0.28)", rain: 0.5, fog: 0.8 },
    { name: "Storm", grade: "rgba(8,10,26,0.46)", rain: 1.7, fog: 1.25 },
    { name: "Clear", grade: "rgba(16,18,42,0.20)", rain: 0.0, fog: 0.5 },
    { name: "Ashfall", grade: "rgba(22,16,30,0.40)", rain: 0.0, fog: 1.1, ash: true }
  ];
  let mood = 0;
  const parseRGBA = s => { const m = s.match(/[\d.]+/g); return { r: +m[0], g: +m[1], b: +m[2], a: +m[3] }; };
  const gradeCur = parseRGBA(MOODS[0].grade);
  let fogCur = MOODS[0].fog, rainCur = MOODS[0].rain;

  // ---- talkable NPC one-liners --------------------------------------
  const NPC_LINES = [
    "That cinematographer shot a whole film in a week. Respect.",
    "The reels in the cyan tower? Worth the walk.",
    "Cesimar Antika's ads — his work. Slick stuff.",
    "Heard he grades color like a wizard.",
    "Lagertha Coffee looked 10x better after his shoot.",
    "New in town? Press E at any tower.",
    "DaVinci Resolve in his sleep, they say.",
    "Find all the data-chips yet? Good luck."
  ];
  const NPC_LINES_TR = [
    "O görüntü yönetmeni bir haftada koca bir film çekti. Saygı.",
    "Cyan kuledeki reeller? Yürümeye değer.",
    "Cesimar Antika'nın reklamları — onun işi. Cilalı.",
    "Rengi büyücü gibi grade ediyormuş.",
    "Lagertha Coffee onun çekiminden sonra 10 kat iyi göründü.",
    "Şehirde yeni misin? Herhangi bir kulede E'ye bas.",
    "DaVinci Resolve'u uykusunda kullanıyormuş derler.",
    "Tüm veri-çiplerini buldun mu? Bol şans."
  ];
  let nearNpc = null;

  const outSet = new Set(outskirts.map(o => o.y * W + o.x));
  const staticCv = document.createElement("canvas");
  staticCv.width = isoW; staticCv.height = isoH + 64;
  (function renderStatic() {
    const s = staticCv.getContext("2d");
    s.imageSmoothingEnabled = true;
    const HW = TW / 2, HH = TH / 2;
    // draw a diamond centered at (cx,cy)
    function diamond(cx, cy, fill, edge, edgeW) {
      s.beginPath();
      s.moveTo(cx, cy - HH); s.lineTo(cx + HW, cy); s.lineTo(cx, cy + HH); s.lineTo(cx - HW, cy); s.closePath();
      s.fillStyle = fill; s.fill();
      if (edge) { s.strokeStyle = edge; s.lineWidth = edgeW || 1; s.stroke(); }
    }
    // a dark iso building block (for the distant city ring)
    function block(cx, cy, ph, seed) {
      const r = (n) => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed / 4294967296) < n; };
      const top = cy - ph;
      s.fillStyle = "#0b0e1a";
      s.beginPath(); s.moveTo(cx - HW, cy); s.lineTo(cx, cy + HH); s.lineTo(cx, top + HH); s.lineTo(cx - HW, top); s.closePath(); s.fill();
      s.fillStyle = "#10131f";
      s.beginPath(); s.moveTo(cx, cy + HH); s.lineTo(cx + HW, cy); s.lineTo(cx + HW, top); s.lineTo(cx, top + HH); s.closePath(); s.fill();
      diamond(cx, top, "#161a2c", "rgba(25,230,255,0.18)", 1);
      // a few lit windows
      for (let wy = top + 6; wy < cy - 4; wy += 7)
        for (let k = -1; k <= 1; k++) if (r(0.4)) {
          s.fillStyle = r(0.5) ? "rgba(25,230,255,0.5)" : "rgba(255,200,90,0.45)";
          s.fillRect(cx - 8 + k * 8, wy, 2, 3);
        }
      // depth-of-field haze over the distant city (pushes it back)
      s.fillStyle = "rgba(40,55,95,0.30)"; s.fillRect(cx - HW, top - 2, TW, ph + HH + 2);
    }
    // back-to-front: increasing (x+y)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const t = terrain[y][x];
        if (t === -1 && !outSet.has(y * W + x)) continue;            // void: skip
        const cwx = x * TILE + TILE / 2, cwy = y * TILE + TILE / 2;
        const cx = isoX(cwx, cwy), cy = isoY(cwx, cwy);
        if (t === -1) { block(cx, cy, 18 + ((x * 13 + y * 29) % 46), (x * 73 + y * 131) >>> 0); continue; } // distant city ring
        if (t === 2) diamond(cx, cy, "#08283a", "rgba(25,230,255,0.45)", 1);   // neon moat
        else if (railSet.has(y * W + x)) {
          diamond(cx, cy, "#0c0e18", "rgba(25,230,255,0.20)", 1);              // rail/platform tile
          if (y === RAIL_Y) {                                                  // two rails + ties along the track
            s.strokeStyle = "rgba(180,200,230,0.55)"; s.lineWidth = 1.5;
            s.beginPath(); s.moveTo(cx - HW, cy - 4); s.lineTo(cx + HW, cy + 4); s.stroke();
            s.beginPath(); s.moveTo(cx - HW, cy + 4); s.lineTo(cx + HW, cy + 12); s.stroke();
            s.strokeStyle = "rgba(25,230,255,0.25)"; s.lineWidth = 1;
            s.beginPath(); s.moveTo(cx - 6, cy - 6); s.lineTo(cx - 2, cy + 8); s.stroke();
            s.beginPath(); s.moveTo(cx + 6, cy - 2); s.lineTo(cx + 10, cy + 12); s.stroke();
          }
        }
        else if (t === 1) {
          diamond(cx, cy, "#0e1322", "rgba(25,230,255,0.32)", 1);
          s.fillStyle = "rgba(25,230,255,0.5)"; s.fillRect(cx - 6, cy - 1, 3, 2); s.fillRect(cx + 3, cy - 1, 3, 2);   // crosswalk dashes
          if (((x * 7 + y * 5) % 4) === 0) { s.fillStyle = "rgba(255,61,240,0.3)"; s.fillRect(cx - 1, cy + 3, 2, 2); }   // decal
        } else {
          diamond(cx, cy, ((x + y) & 1) ? "#171c33" : "#141930", "rgba(60,80,150,0.16)", 1);
          // grime speckles + occasional wet sheen (ground texture)
          const g = (x * 31 + y * 17) % 7;
          if (g < 3) { s.fillStyle = "rgba(0,0,0,0.18)"; s.fillRect(cx - 6 + g * 4, cy + (g - 1), 2, 2); }
          if (((x * 5 + y * 11) % 9) === 0) { s.fillStyle = "rgba(90,130,200,0.10)"; s.fillRect(cx - 8, cy, 16, 2); }
          if (((x * 13 + y * 7) % 11) === 0) { s.strokeStyle = "rgba(120,150,210,0.12)"; s.lineWidth = 1; s.beginPath(); s.moveTo(cx - HW, cy); s.lineTo(cx, cy - HH); s.stroke(); }  // faint cable
        }
      }
    decor.forEach(d => {
      const cx = isoX(d.wx + 8, d.wy + 8), cy = isoY(d.wx + 8, d.wy + 8);
      s.fillStyle = "rgba(25,230,255,0.18)"; s.fillRect(cx - 3, cy - 1, 6, 2);
    });
  })();

  // ---- player (spawn on the far departure platform) ------------------
  const spawnTx = DEP_X - 3, spawnTy = RAIL_Y + 2;
  const player = {
    x: spawnTx * TILE, y: spawnTy * TILE,
    dir: "left", step: 0, animT: 0, moving: false
  };

  // ---- the train (shuttles between the two platforms) ----------------
  const DEP_PX = DEP_X * TILE + 8, ARR_PX = ARR_X * TILE + 8;
  const train = { x: DEP_PX, y: RAIL_Y * TILE + 8, target: DEP_PX, speed: 0, at: "dep" };
  let riding = false, nearTrain = false;

  // ---- companion drone (hovers and follows the player) ---------------
  const pet = { x: player.x - 14, y: player.y - 24, blinkT: 0, blink: 0, phase: Math.random() * 6 };
  function updatePet(dt) {
    const k = Math.min(1, dt * 3);
    pet.x += (player.x - 14 - pet.x) * k;
    pet.y += (player.y - 26 - pet.y) * k;
    pet.phase += dt;
    pet.blinkT += dt; if (pet.blinkT > 0.4) { pet.blinkT = 0; pet.blink ^= 1; }
  }
  // feet collision box relative to player.x/y
  const FEET = { ox: 3, oy: 13, w: 10, h: 5 };

  function boxSolid(wx, wy, bw, bh) {
    const pts = [[wx, wy], [wx + bw, wy], [wx, wy + bh], [wx + bw, wy + bh]];
    for (const [px, py] of pts) {
      const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
      if (solid[ty][tx]) return true;
    }
    return false;
  }

  // ---- ambient life: pedestrians, hovercars, drones -----------------
  const npcs = [], cars = [], drones = [];
  const MAX_NPCS = 12;

  function tileWalkable(tx, ty) {
    return tx > 0 && ty > 0 && tx < W - 1 && ty < H - 1 && !solid[ty][tx] && terrain[ty][tx] !== 2;
  }
  function makeNpc(tx, ty) {
    return {
      x: tx * TILE, y: ty * TILE, speed: 16 + Math.random() * 10,
      dir: "down", step: 0, animT: 0, state: "walk", stateT: 0, tx, ty,
      sheet: Art.peds[(Math.random() * Art.peds.length) | 0]
    };
  }
  function npcPickTarget(n) {
    for (let i = 0; i < 8; i++) {
      const tx = (n.x / TILE | 0) + ((Math.random() * 9 - 4) | 0);
      const ty = (n.y / TILE | 0) + ((Math.random() * 9 - 4) | 0);
      if (tileWalkable(tx, ty)) { n.tx = tx; n.ty = ty; return true; }
    }
    return false;
  }
  function updateNpc(n, dt) {
    if (n.bubbleT > 0) { n.bubbleT -= dt; n.step = 0; return; }   // pause while talking
    n.stateT -= dt;
    if (n.state === "pause") {
      n.step = 0;
      if (n.stateT <= 0) { n.state = "walk"; if (!npcPickTarget(n)) n.stateT = 0.5; }
      return;
    }
    const tgx = n.tx * TILE + 8, tgy = n.ty * TILE + 8;
    let dx = tgx - (n.x + 8), dy = tgy - (n.y + 8);
    const dist = Math.hypot(dx, dy);
    if (dist < 2) { n.state = "pause"; n.stateT = 0.4 + Math.random() * 1.4; return; }
    dx /= dist; dy /= dist;
    if (Math.abs(dx) > Math.abs(dy)) n.dir = dx < 0 ? "left" : "right"; else n.dir = dy < 0 ? "up" : "down";
    const mx = dx * n.speed * dt, my = dy * n.speed * dt;
    let moved = false;
    if (!boxSolid(n.x + 3 + mx, n.y + 13, 10, 5)) { n.x += mx; moved = true; }
    if (!boxSolid(n.x + 3, n.y + 13 + my, 10, 5)) { n.y += my; moved = true; }
    if (!moved) { n.state = "pause"; n.stateT = 0.3; npcPickTarget(n); }
    n.animT += dt; if (n.animT > 0.16) { n.animT = 0; n.step = n.step === 1 ? 2 : 1; }
  }
  function manageNpcs() {
    // cull NPCs far from the player (world distance), spawn anywhere walkable
    const maxd = 560 * 560;
    for (let i = npcs.length - 1; i >= 0; i--) {
      const n = npcs[i], dx = n.x - player.x, dy = n.y - player.y;
      if (dx * dx + dy * dy > maxd) npcs.splice(i, 1);
    }
    let guard = 0;
    while (npcs.length < MAX_NPCS && guard++ < 60) {
      const tx = 1 + ((Math.random() * (W - 2)) | 0);
      const ty = 1 + ((Math.random() * (H - 2)) | 0);
      if (tileWalkable(tx, ty)) npcs.push(makeNpc(tx, ty));
    }
  }

  // hovercars orbit the circular ring road
  function initCars() {
    for (let i = 0; i < 6; i++) {
      const v = Art.cars[(Math.random() * Art.cars.length) | 0];
      const dir = i % 2 ? 1 : -1;
      cars.push({
        ang: Math.random() * Math.PI * 2, r: R_RING + (i % 2 ? 0.5 : -0.5),
        sp: (0.18 + Math.random() * 0.12) * dir, dir, wx: 0, wy: 0, trail: [],
        img: dir > 0 ? v.right : v.left
      });
    }
  }
  function updateCars(dt) {
    for (const c of cars) {
      c.ang += c.sp * dt;
      c.wx = (ccx + c.r * Math.cos(c.ang)) * TILE;
      c.wy = (ccy + c.r * Math.sin(c.ang)) * TILE;
      c.trail.push(c.wx); c.trail.push(c.wy);
      if (c.trail.length > 20) c.trail.splice(0, 2);
    }
  }

  function initDrones() {
    for (let i = 0; i < 4; i++) drones.push({
      x: Math.random() * worldW, y: 12 + Math.random() * 50, phase: Math.random() * 6.28,
      sp: 14 + Math.random() * 16, dir: Math.random() < 0.5 ? 1 : -1,
      alt: 46 + Math.random() * 60, blinkT: 0, blink: 0
    });
  }
  function updateDrones(dt) {
    for (const d of drones) {
      d.x += d.dir * d.sp * dt; d.phase += dt;
      if (d.x > worldW + 30) d.x = -30; if (d.x < -30) d.x = worldW + 30;
      d.blinkT += dt; if (d.blinkT > 0.5) { d.blinkT = 0; d.blink ^= 1; }
    }
  }

  // ---- train ride --------------------------------------------------
  function startRide() {
    if (riding) return;
    riding = true; train.speed = 0;
    train.target = (train.at === "dep") ? ARR_PX : DEP_PX;
    Sound.enter();
  }
  function endRide() {
    riding = false; train.speed = 0;
    train.at = (Math.abs(train.x - ARR_PX) < 3) ? "arr" : "dep";
    player.x = train.x - 8; player.y = (RAIL_Y + 2) * TILE; player.dir = "down";
    Sound.close();
  }
  function skipRide() { if (riding) { train.x = train.target; endRide(); } }
  function updateTrain(dt) {
    if (!riding) return;
    const dist = train.target - train.x, ad = Math.abs(dist), dir = Math.sign(dist) || 1;
    const decelV = Math.sqrt(2 * 95 * ad);                    // ease to a slow stop
    const targetV = dir * Math.min(130, Math.max(24, decelV));
    train.speed += (targetV - train.speed) * Math.min(1, dt * 1.8);
    train.x += train.speed * dt;
    if (ad < 2 && Math.abs(train.speed) < 26) { train.x = train.target; endRide(); return; }
    player.x = train.x - 8; player.y = train.y - 6;            // ride inside
  }
  function drawTrain() {
    const L = 3.4 * TILE, dep = 11, h = 22;
    const x0 = train.x - L / 2, x1 = train.x + L / 2, y0 = train.y - dep, y1 = train.y + dep;
    const P = (wx, wy) => [isoX(wx, wy), isoY(wx, wy)];
    const A = P(x0, y0), B = P(x1, y0), C = P(x1, y1), D = P(x0, y1);
    const up = p => [p[0], p[1] - h];
    const A2 = up(A), B2 = up(B), C2 = up(C), D2 = up(D);
    const poly = (pts, fill) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
    poly([D, C, C2, D2], "#13233c");                          // south long face
    poly([A, D, D2, A2], "#0d1828");                          // west end
    poly([B, C, C2, B2], "#0d1828");                          // east end
    poly([A2, B2, C2, D2], "#1e3556");                        // roof
    // neon trim along the roof + a window strip on the south face
    ctx.strokeStyle = "#19e6ff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(A2[0], A2[1]); ctx.lineTo(B2[0], B2[1]); ctx.lineTo(C2[0], C2[1]); ctx.lineTo(D2[0], D2[1]); ctx.closePath(); ctx.stroke();
    for (let k = 0; k <= 6; k++) {
      const u = k / 6;
      const wx = D[0] + (C[0] - D[0]) * u, wy = D[1] + (C[1] - D[1]) * u - h * 0.55;
      ctx.fillStyle = "#bff6ff"; ctx.fillRect(wx - 2, wy - 3, 4, 5);
    }
    ctx.fillStyle = "#ff3df0"; ctx.fillRect((D[0] + C[0]) / 2 - 1, (D[1] + C[1]) / 2 + 2, L * 0.6, 2);  // underglow
    // headlight at the leading end (toward target / toward town)
    const lead = (riding ? train.target < train.x : true);   // idle leads west (toward town)
    const lp = lead ? up(P(x0, train.y)) : up(P(x1, train.y));
    ctx.fillStyle = "#fff6c8"; ctx.fillRect(lp[0] - 2, lp[1] + 4, 4, 4);
  }

  // ---- input ---------------------------------------------------------
  const keys = {};
  const DOWN = e => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    keys[k] = true;
    if (riding && (k === " " || k === "escape" || k === "enter")) { skipRide(); return; }
    if ((k === "e" || k === " " || k === "enter") && !modalOpen && !riding) tryInteract();
    if (k === "escape") { if (lightboxOpen) closeLightbox(); else if (modalOpen) closeModal(); }
    if (k === "p" && !modalOpen) togglePhoto();
    if (k === "s" && photoMode) savePhoto();
    if (k === "m") { const m = document.getElementById("minimap"); m.style.display = m.style.display === "none" ? "block" : "none"; }
  };
  let photoMode = false;
  function togglePhoto() { photoMode = !photoMode; document.body.classList.toggle("photo", photoMode); }
  function savePhoto() {
    try { const a = document.createElement("a"); a.download = "neon-city.png"; a.href = canvas.toDataURL("image/png"); a.click(); } catch (e) { }
  }
  const UP = e => { keys[e.key.toLowerCase()] = false; };
  window.addEventListener("keydown", DOWN);
  window.addEventListener("keyup", UP);

  // touch controls
  const touch = { x: 0, y: 0 };
  function bindTouch() {
    const pad = document.getElementById("dpad");
    const map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    pad.querySelectorAll("[data-dir]").forEach(btn => {
      const [dx, dy] = map[btn.dataset.dir];
      const on = e => { e.preventDefault(); touch.x = dx; touch.y = dy; };
      const off = e => { e.preventDefault(); if (touch.x === dx && touch.y === dy) { touch.x = 0; touch.y = 0; } };
      btn.addEventListener("touchstart", on); btn.addEventListener("touchend", off);
      btn.addEventListener("touchcancel", off);
      btn.addEventListener("mousedown", on); btn.addEventListener("mouseup", off);
      btn.addEventListener("mouseleave", off);
    });
    document.getElementById("btn-action").addEventListener("touchstart", e => {
      e.preventDefault();
      if (lightboxOpen) closeLightbox(); else if (modalOpen) closeModal(); else tryInteract();
    });
    if (!("ontouchstart" in window)) document.getElementById("touch").style.display = "none";
  }

  // ---- interaction ---------------------------------------------------
  let nearest = null;
  let modalOpen = false;
  let currentGame = null;
  function updateNearest() {
    const prompt0 = document.getElementById("prompt");
    if (riding) { prompt0.style.display = "block"; prompt0.innerHTML = `<b>SPACE</b> &nbsp;${t("skip")}`; nearest = nearNpc = null; nearTrain = false; return; }
    nearest = null;
    let best = 26 * 26;
    const pcx = player.x + 8, pcy = player.y + 16;
    for (const h of houses) {
      const dx = pcx - h.doorWX, dy = pcy - h.doorWY;
      const d = dx * dx + dy * dy;
      if (d < best) { best = d; nearest = h; }
    }
    // train (when stopped at a platform)
    nearTrain = train.speed === 0 && Math.hypot(pcx - train.x, (player.y + 8) - train.y) < 40;
    // if no house/train in range, look for a nearby pedestrian to talk to
    nearNpc = null;
    if (!nearest && !nearTrain) {
      let nb = 22 * 22;
      for (const n of npcs) { const dx = pcx - (n.x + 8), dy = pcy - (n.y + 12), d = dx * dx + dy * dy; if (d < nb) { nb = d; nearNpc = n; } }
    }
    const prompt = document.getElementById("prompt");
    if (nearest && !modalOpen) {
      prompt.style.display = "block";
      prompt.innerHTML = `<b>E</b> &nbsp;${t("enter")} &nbsp;·&nbsp; ${esc(tl(nearest.station.label))}`;
    } else if (nearTrain && !modalOpen) {
      prompt.style.display = "block";
      prompt.innerHTML = `<b>E</b> &nbsp;${t("board")} &nbsp;·&nbsp; ${train.at === "dep" ? t("toCity") : t("outTown")}`;
    } else if (nearNpc && !modalOpen) {
      prompt.style.display = "block";
      prompt.innerHTML = `<b>E</b> &nbsp;${t("talk")}`;
    } else {
      prompt.style.display = "none";
    }
  }
  function tryInteract() {
    if (nearest) openModal(nearest.station);
    else if (nearTrain) startRide();
    else if (nearNpc) { const L = lang === "tr" ? NPC_LINES_TR : NPC_LINES; nearNpc.bubble = L[(Math.random() * L.length) | 0]; nearNpc.bubbleT = 3.4; Sound.ui(); }
  }

  // ---- modal ---------------------------------------------------------
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function creditHtml(cr) {
    let s = `<p class="credit">`;
    if (cr.role) s += `<span>${t("role")}: ${esc(cr.role)}</span>`;
    if (cr.client) s += `<span>${t("client")}: ${esc(cr.client)}</span>`;
    if (cr.year) s += `<span>${esc(cr.year)}</span>`;
    s += `</p>`;
    if (cr.note) s += `<p class="credit-note">${esc(cr.note)}</p>`;
    return s;
  }
  function openModal(st) {
    modalOpen = true; lastStation = st;
    const isTR = lang === "tr";
    Sound.enter();
    const wipe = document.getElementById("wipe");
    if (wipe) { wipe.classList.remove("play"); void wipe.offsetWidth; wipe.classList.add("play"); }
    document.getElementById("prompt").style.display = "none";
    const body = document.getElementById("modal-body");
    document.querySelector("#modal .panel").classList.toggle("wide", st.type === "gallery" || st.type === "arcade");
    let html = "";
    if (st.type === "about") {
      const c0 = PORTFOLIO.contact;
      html += `<h2>${esc(PORTFOLIO.name)}</h2>`;
      html += `<p class="role">${esc(lang === "tr" ? PORTFOLIO.roleTR : PORTFOLIO.role)}</p>`;
      html += `<p>${esc(lang === "tr" ? PORTFOLIO.bioTR : PORTFOLIO.bio)}</p>`;
      html += `<div class="tags">` + (isTR ? PORTFOLIO.skillsTR : PORTFOLIO.skills).map(s => `<span>${esc(s)}</span>`).join("") + `</div>`;
      const exp = isTR ? PORTFOLIO.experienceTR : PORTFOLIO.experience;
      if (exp) {
        html += `<h3 class="group">${t("experience")}</h3><ul class="cvlist">`;
        exp.forEach(e => {
          html += `<li><b>${esc(e.role)}</b> <span class="meta">${esc(e.period)}</span>` +
            `<span class="org">${esc(e.org)}</span><span class="desc">${esc(e.desc)}</span></li>`;
        });
        html += `</ul>`;
      }
      if (PORTFOLIO.education) html += `<h3 class="group">${t("education")}</h3><p>${esc(isTR ? PORTFOLIO.educationTR : PORTFOLIO.education)}</p>`;
      if (PORTFOLIO.software) html += `<h3 class="group">${t("software")}</h3><div class="tags">` + PORTFOLIO.software.map(s => `<span>${esc(s.n)} · ${esc(isTR ? (LEVELS_TR[s.l] || s.l) : s.l)}</span>`).join("") + `</div>`;
      if (PORTFOLIO.languages) html += `<h3 class="group">${t("languages")}</h3><div class="tags">` + PORTFOLIO.languages.map(s => `<span>${esc(isTR ? (LANGNAME_TR[s.n] || s.n) : s.n)} · ${esc(isTR ? (LANGLVL_TR[s.l] || s.l) : s.l)}</span>`).join("") + `</div>`;
      html += `<div class="cta-row">`;
      if (c0.cvEN) html += `<a class="btn" href="${esc(c0.cvEN)}" download>${t("cvEN")}</a>`;
      if (c0.cvTR) html += `<a class="btn ghost" href="${esc(c0.cvTR)}" download>${t("cvTR")}</a>`;
      html += `</div>`;
    } else if (st.type === "contact") {
      const c = PORTFOLIO.contact;
      html += `<h2>${t("contactTitle")}</h2>`;
      html += `<p class="role">${t("available")}${c.location ? " · " + esc(c.location) : ""}</p>`;
      html += `<ul class="contact">`;
      if (c.email) html += `<li>✉️ <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>`;
      if (c.phone) html += `<li>📞 <a href="tel:${esc(c.phone.replace(/\s/g, ""))}">${esc(c.phone)}</a></li>`;
      if (c.portfolio) html += `<li>🌐 <a href="${esc(c.portfolio)}" target="_blank" rel="noopener">myportfolio.com</a></li>`;
      if (c.instagram) html += `<li>📸 <a href="${esc(c.instagram)}" target="_blank" rel="noopener">Instagram</a></li>`;
      if (c.linkedin) html += `<li>💼 <a href="${esc(c.linkedin)}" target="_blank" rel="noopener">LinkedIn</a></li>`;
      html += `</ul>`;
      html += `<div class="cta-row">`;
      html += `<a class="btn" href="mailto:${esc(c.email)}?subject=Project%20inquiry">${t("emailMe")}</a>`;
      if (c.cvEN) html += `<a class="btn ghost" href="${esc(c.cvEN)}" download>${t("cvENshort")}</a>`;
      if (c.cvTR) html += `<a class="btn ghost" href="${esc(c.cvTR)}" download>${t("cvTR")}</a>`;
      html += `</div>`;
    } else if (st.type === "gallery") {
      const g = st.gallery;
      html += `<h2>${esc(tl(g.title))}</h2>`;
      const gblurb = isTR ? (BLURBS_TR[g.title] || g.blurb) : g.blurb;
      html += `<p class="role">${esc(g.year || "")}${gblurb ? " · " + esc(gblurb) : ""}</p>`;
      const allItems = (g.groups && g.groups.length) ? g.groups.reduce((a, gr) => a.concat(gr.items || []), []) : (g.items || []);
      if (allItems.some(it => it.type === "embed" || it.type === "video"))
        html += `<p class="vid-note">${t("vidNote")}</p>`;
      const renderItems = (items) => {
        let h = `<div class="gallery">`;
        (items || []).forEach(it => {
          if (it.type === "embed") {
            h += `<figure class="g-item vid">` +
              `<iframe class="g-embed" src="${esc(it.src)}" frameborder="0" allowfullscreen loading="lazy"></iframe>` +
              (it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : "") + `</figure>`;
          } else if (it.type === "video") {
            h += `<figure class="g-item vid">` +
              `<video controls preload="metadata" playsinline${it.poster ? ` poster="${esc(it.poster)}"` : ""}>` +
              `<source src="${esc(it.src)}" type="video/mp4"></video>` +
              (it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : "") + `</figure>`;
          } else {
            h += `<figure class="g-item img">` +
              `<img class="thumb" src="${esc(it.src)}" data-full="${esc(it.src)}" alt="${esc(it.caption || g.title)}" loading="lazy">` +
              (it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : "") + `</figure>`;
          }
        });
        return h + `</div>`;
      };
      if (g.groups && g.groups.length) {
        g.groups.forEach(grp => {
          html += `<h3 class="group">${esc(grp.name)}</h3>`;
          const ck = g.title + "|" + grp.name;
          const cr = (isTR && PORTFOLIO.creditsTR && PORTFOLIO.creditsTR[ck]) || (PORTFOLIO.credits && PORTFOLIO.credits[ck]);
          if (cr) html += creditHtml(cr);
          html += renderItems(grp.items);
        });
      } else {
        html += renderItems(g.items);
      }
    } else if (st.type === "arcade") {
      html += `<h2>${esc(tl(st.label))}</h2>`;
      html += `<p class="role">${t("arcadeHint")}</p>`;
      html += `<canvas id="mg" width="480" height="360" class="mg-canvas"></canvas>`;
      html += `<p class="mg-hint">${t("arcadeNote")}</p>`;
    } else {
      const p = st.project;
      const pRole = isTR && p.roleTR ? p.roleTR : p.role;
      const pYear = isTR && p.yearTR ? p.yearTR : p.year;
      const pOne = isTR && p.oneLinerTR ? p.oneLinerTR : p.oneLiner;
      const pDesc = isTR && p.descriptionTR ? p.descriptionTR : (p.description || p.summary);
      const pDetails = isTR && p.detailsTR ? p.detailsTR : p.details;
      const pTags = isTR && p.tagsTR ? p.tagsTR : p.tags;
      html += `<h2>${esc(p.title)}</h2>`;
      html += `<p class="role">${esc(pRole)}${pYear ? " · " + esc(pYear) : ""}</p>`;
      let fig = null;
      if (p.figure && typeof Art.gameFigure === "function") { try { fig = Art.gameFigure(p.figure); } catch (e) { } }
      if (fig) html += `<img class="shot keyart" src="${fig.toDataURL("image/png")}" alt="${esc(p.title)} key art">`;
      else if (p.image) html += `<img class="shot" src="${esc(p.image)}" alt="${esc(p.title)}">`;
      else html += `<div class="shot placeholder">key art</div>`;
      if (pOne) html += `<p class="oneliner">“${esc(pOne)}”</p>`;
      html += `<p>${esc(pDesc)}</p>`;
      if (pDetails && pDetails.length) html += `<ul class="speclist">` + pDetails.map(d => `<li><span class="k">${esc(d.label)}</span><span class="v">${esc(d.value)}</span></li>`).join("") + `</ul>`;
      if (pTags && pTags.length) html += `<div class="tags">` + pTags.map(tg => `<span>${esc(tg)}</span>`).join("") + `</div>`;
      if (p.link) html += `<a class="btn" href="${esc(p.link)}" target="_blank" rel="noopener">${t("openProject")}</a>`;
    }
    body.innerHTML = html;
    document.getElementById("modal").classList.add("show");
    if (st.type === "arcade" && typeof startMiniGame === "function") {
      currentGame = startMiniGame(st.game, document.getElementById("mg"),
        { score: t("mgScore"), best: t("mgBest"), crash: t("mgCrash"), lost: t("mgLost"), retry: t("mgRetry") });
    }
  }
  function closeModal() {
    modalOpen = false;
    Sound.close();
    if (currentGame) { currentGame.stop(); currentGame = null; }
    document.getElementById("modal").classList.remove("show");
    document.getElementById("modal-body").innerHTML = "";   // stops any playing video
  }

  // ---- lightbox (click an image to enlarge) --------------------------
  let lightboxOpen = false;
  function openLightbox(src) {
    const lb = document.getElementById("lightbox");
    document.getElementById("lightbox-img").src = src;
    lb.classList.add("show");
    lightboxOpen = true;
  }
  function closeLightbox() {
    const lb = document.getElementById("lightbox");
    lb.classList.remove("show");
    document.getElementById("lightbox-img").src = "";
    lightboxOpen = false;
  }

  // ---- camera (in ISO space) -----------------------------------------
  let camX = 0, camY = 0;
  function updateCamera(dt) {
    const fwx = riding ? train.x : player.x + 8, fwy = riding ? train.y : player.y + 8;
    const pix = isoX(fwx, fwy), piy = isoY(fwx, fwy);
    let tx = pix - viewW / 2, ty = piy - viewH / 2;
    tx = Math.max(0, Math.min(isoW - viewW, tx));
    ty = Math.max(-80, Math.min(isoH + 64 - viewH, ty));
    if (isoW < viewW) tx = (isoW - viewW) / 2;
    if (isoH < viewH) ty = (isoH - viewH) / 2;
    const k = Math.min(1, (dt || 0.016) * 6);    // smooth follow (cinematic lag)
    camX += (tx - camX) * k; camY += (ty - camY) * k;
  }

  // ---- resize --------------------------------------------------------
  let fogGrad = null, vignette = null;
  const blurCv = document.createElement("canvas"), blurX = blurCv.getContext("2d");
  function resize() {
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    viewW = w / ZOOM;
    viewH = h / ZOOM;
    blurCv.width = Math.max(1, canvas.width >> 2); blurCv.height = Math.max(1, canvas.height >> 2);
    FX.resize(w, h);
    // cache the haze gradient in CSS-pixel space (we fill it under the DPR transform)
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(22,40,80,0.26)");
    g.addColorStop(0.5, "rgba(20,40,80,0.04)");
    g.addColorStop(1, "rgba(50,12,60,0.14)");
    fogGrad = g;
    // vignette (multiply): white center = unchanged, dark edges
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
    vg.addColorStop(0, "rgba(255,255,255,1)");
    vg.addColorStop(1, "rgba(36,28,54,1)");
    vignette = vg;
  }
  window.addEventListener("resize", resize);

  // ---- update --------------------------------------------------------
  function update(dt) {
    let sx = 0, sy = 0;                       // screen-intent vector
    if (!modalOpen && !riding) {
      if (keys["arrowup"] || keys["w"]) sy -= 1;
      if (keys["arrowdown"] || keys["s"]) sy += 1;
      if (keys["arrowleft"] || keys["a"]) sx -= 1;
      if (keys["arrowright"] || keys["d"]) sx += 1;
      sx += touch.x; sy += touch.y;
    }
    player.moving = sx !== 0 || sy !== 0;
    if (player.moving) {
      // facing follows the screen direction the player pressed
      if (Math.abs(sx) > Math.abs(sy)) player.dir = sx < 0 ? "left" : "right";
      else player.dir = sy < 0 ? "up" : "down";
      // rotate screen intent into world (iso) axes
      let dx = sx + sy, dy = sy - sx;
      const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      const mx = dx * SPEED * dt, my = dy * SPEED * dt;
      const fb = FEET;
      if (!boxSolid(player.x + fb.ox + mx, player.y + fb.oy, fb.w, fb.h)) player.x += mx;
      if (!boxSolid(player.x + fb.ox, player.y + fb.oy + my, fb.w, fb.h)) player.y += my;
      player.animT += dt;
      if (player.animT > 0.14) { player.animT = 0; player.step = player.step === 1 ? 2 : 1; Sound.step(); }
    } else {
      player.step = 0; player.animT = 0;
    }
    if (player.moving && !hintHidden) { hintHidden = true; const fh = document.getElementById("firsthint"); if (fh) fh.classList.add("hide"); }
    updateNearest();
    updateCamera(dt);
    updateTrain(dt);
    updatePet(dt);
    if (!modalOpen) {
      npcs.forEach(n => updateNpc(n, dt));
      manageNpcs();
      updateCars(dt);
      updateDrones(dt);
      FX.update(dt, camX, camY, viewW, viewH);
      // collect data-chips
      const pcx = player.x + 8, pcy = player.y + 12;
      for (const ch of chips) {
        if (ch.got) continue;
        const dx = pcx - ch.wx, dy = pcy - ch.wy;
        if (dx * dx + dy * dy < 14 * 14) {
          ch.got = true; chipsGot++; Sound.ui();
          document.getElementById("chips").textContent = "◈ " + chipsGot + "/" + chips.length;
          if (chipsGot === chips.length) overdrive = 6;
        }
      }
      if (overdrive > 0) overdrive = Math.max(0, overdrive - dt);
    }
  }
  let hintHidden = false;

  // ---- render (ISOMETRIC) --------------------------------------------
  let fountainT = 0, fountainFrame = 0, T = 0, pAcc = "#19e6ff";
  const isoVis = (ix, iy, m) => ix > camX - m && ix < camX + viewW + m && iy > camY - m && iy < camY + viewH + m;
  // edge/rim neon lighting for a sprite (tinted silhouette drawn around it)
  const rimCv = document.createElement("canvas"); rimCv.width = 16; rimCv.height = 22;
  const rimX = rimCv.getContext("2d");
  function drawRim(sp, dx, dy, color) {
    rimX.clearRect(0, 0, 16, 22); rimX.globalCompositeOperation = "source-over"; rimX.drawImage(sp, 0, 0);
    rimX.globalCompositeOperation = "source-in"; rimX.fillStyle = color; rimX.fillRect(0, 0, 16, 22);
    rimX.globalCompositeOperation = "source-over";
    const prev = ctx.globalCompositeOperation; ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.45;
    ctx.drawImage(rimCv, dx - 1, dy); ctx.drawImage(rimCv, dx + 1, dy); ctx.drawImage(rimCv, dx, dy - 1); ctx.drawImage(rimCv, dx, dy + 1);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = prev;
  }

  function render(dt) {
    T += dt;
    fountainT += dt;
    if (fountainT > 0.4) { fountainT = 0; fountainFrame ^= 1; }
    { let pb = 1e9; for (const h of houses) { const dx = h.cx - (player.x + 8), dy = h.wcy - (player.y + 8), d = dx * dx + dy * dy; if (d < pb) { pb = d; pAcc = h.accent; } } }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const s = ZOOM * DPR;
    const world = () => { ctx.setTransform(s, 0, 0, s, -camX * s, -camY * s); };
    world();

    // static iso ground (smooth)
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(staticCv, 0, 0);
    FX.drawRipples(ctx);                 // wet-ground ripples (world space)
    // hovercar light-trails (additive, on the road)
    ctx.globalCompositeOperation = "lighter"; ctx.lineWidth = 2;
    cars.forEach(c => {
      const tr = c.trail;
      for (let i = 2; i < tr.length; i += 2) {
        const a = (i / tr.length) * 0.22;
        ctx.strokeStyle = "rgba(255,180,120," + a.toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(isoX(tr[i - 2], tr[i - 1]), isoY(tr[i - 2], tr[i - 1]));
        ctx.lineTo(isoX(tr[i], tr[i + 1]), isoY(tr[i], tr[i + 1]));
        ctx.stroke();
      }
    });
    // pulsing energy flowing along the ring road
    for (let k = 0; k < 4; k++) {
      const a = T * 0.5 + k * Math.PI / 2;
      const wx = (ccx + R_RING * Math.cos(a)) * TILE + 8, wy = (ccy + R_RING * Math.sin(a)) * TILE + 8;
      ctx.globalAlpha = 0.3; ctx.drawImage(Art.blobs["#19e6ff"], isoX(wx, wy) - 8, isoY(wx, wy) - 8, 16, 16);
    }
    // moat shimmer (flowing water reflections on the ring)
    for (let k = 0; k < 14; k++) {
      const a = T * 0.25 + k * (Math.PI * 2 / 14);
      const wx = (ccx + (R_MOAT - 0.6) * Math.cos(a)) * TILE + 8, wy = (ccy + (R_MOAT - 0.6) * Math.sin(a)) * TILE + 8;
      ctx.globalAlpha = 0.10 + 0.07 * Math.sin(T * 2 + k);
      ctx.fillStyle = "rgba(25,230,255,1)"; ctx.fillRect(isoX(wx, wy) - 3, isoY(wx, wy) - 1, 6, 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // build y-sorted object list (depth = iso Y); each carries sprite+anchor for reflections
    const objs = [];
    { const ix = isoX(fountain.wx + 16, fountain.wy + 34), iy = isoY(fountain.wx + 16, fountain.wy + 34);
      objs.push({ k: iy, ix, iy, sw: 14, px: true, spr: Art.monument[fountainFrame], sax: 16, say: 40,
        draw: () => ctx.drawImage(Art.monument[fountainFrame], Math.round(ix - 16), Math.round(iy - 40)) }); }
    houses.forEach(h => { const ix = isoX(h.cx, h.wcy), iy = isoY(h.cx, h.wcy);
      objs.push({ k: iy + h.iso.fh, ix, iy, sw: h.iso.ax * 0.5, spr: h.iso.c, sax: h.iso.ax, say: h.iso.ay,
        draw: () => ctx.drawImage(h.iso.c, Math.round(ix - h.iso.ax), Math.round(iy - h.iso.ay)) }); });
    interiorTrees.forEach(t => { const ix = isoX(t.wx + 8, t.wy + 8), iy = isoY(t.wx + 8, t.wy + 8);
      objs.push({ k: iy, ix, iy, sw: 6, px: true, spr: Art.lamp, sax: Art.lamp.width / 2, say: Art.lamp.height,
        draw: () => ctx.drawImage(Art.lamp, Math.round(ix - Art.lamp.width / 2), Math.round(iy - Art.lamp.height)) }); });
    npcs.forEach(n => { const ix = isoX(n.x + 8, n.y + 14), iy = isoY(n.x + 8, n.y + 14); if (!isoVis(ix, iy, 40)) return;
      const sp = n.sheet[n.dir][n.step];
      objs.push({ k: iy, ix, iy, sw: 6, px: true, spr: sp, sax: 8, say: 18,
        draw: () => ctx.drawImage(sp, Math.round(ix - 8), Math.round(iy - 18)) }); });
    cars.forEach(c => { const ix = isoX(c.wx, c.wy), iy = isoY(c.wx, c.wy); if (!isoVis(ix, iy, 60)) return;
      objs.push({ k: iy, ix, iy, sw: 12, px: true, spr: c.img, sax: c.img.width / 2, say: c.img.height - 4,
        draw: () => ctx.drawImage(c.img, Math.round(ix - c.img.width / 2), Math.round(iy - c.img.height + 4)) }); });
    if (!riding) { const ix = isoX(player.x + 8, player.y + 14), iy = isoY(player.x + 8, player.y + 14);
      const sp = Art.player[player.dir][player.step];
      objs.push({ k: iy, ix, iy, sw: 7, px: true, spr: sp, sax: 8, say: 18,
        draw: () => {
          const bob = player.moving ? 0 : Math.round(Math.sin(T * 2));   // idle breathing
          const dx = Math.round(ix - 8), dy = Math.round(iy - 18) - bob;
          drawRim(sp, dx, dy, pAcc); ctx.drawImage(sp, dx, dy);
        } }); }
    // the train
    { const ix = isoX(train.x, train.y), iy = isoY(train.x, train.y);
      objs.push({ k: isoY(train.x + 3.4 * TILE / 2, train.y + 11), ix, iy, sw: 30, draw: drawTrain }); }

    // wet-ground neon reflections (faint, additive, flipped under each object)
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = "lighter";
    objs.forEach(o => {
      if (!o.spr) return;
      ctx.save(); ctx.globalAlpha = 0.15;
      ctx.translate(o.ix, o.iy); ctx.scale(1, -0.8); ctx.translate(-o.ix, -o.iy);
      ctx.drawImage(o.spr, Math.round(o.ix - o.sax), Math.round(o.iy - o.say));
      ctx.restore();
    });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

    // ground shadows (iso diamonds), then sorted sprites
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    objs.forEach(o => { ctx.beginPath(); ctx.ellipse(o.ix, o.iy - 1, o.sw, o.sw * 0.5, 0, 0, Math.PI * 2); ctx.fill(); });
    objs.sort((a, b) => a.k - b.k);
    objs.forEach(o => { ctx.imageSmoothingEnabled = !o.px; o.draw(); });

    // overhead drones (above all), with ground shadow
    ctx.imageSmoothingEnabled = false;
    drones.forEach(d => {
      const ix = isoX(d.x, d.y), iy = isoY(d.x, d.y); if (!isoVis(ix, iy, 80)) return;
      const bob = Math.sin(d.phase) * 4;
      ctx.imageSmoothingEnabled = true; ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath(); ctx.ellipse(ix, iy, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(Art.drones[d.blink], Math.round(ix - 7), Math.round(iy - d.alt + bob));
    });
    // companion drone hovering above the player
    if (!riding) {
      const ix = isoX(pet.x + 8, pet.y + 8), iy = isoY(pet.x + 8, pet.y + 8), bob = Math.sin(pet.phase * 3) * 3;
      ctx.imageSmoothingEnabled = true; ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath(); ctx.ellipse(ix, iy, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(Art.drones[pet.blink], Math.round(ix - 7), Math.round(iy - 30 + bob));
    }
    FX.drawSteam(ctx);                   // rising steam from vents (world space)

    // ===== ATMOSPHERE =====
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const Wc = canvas.width / DPR, Hc = canvas.height / DPR;
    // gradual day↔night: ease grade/fog/rain toward the selected mood
    { const tg = parseRGBA(MOODS[mood].grade), k = Math.min(1, dt * 1.3);
      gradeCur.r += (tg.r - gradeCur.r) * k; gradeCur.g += (tg.g - gradeCur.g) * k;
      gradeCur.b += (tg.b - gradeCur.b) * k; gradeCur.a += (tg.a - gradeCur.a) * k;
      fogCur += (MOODS[mood].fog - fogCur) * k; rainCur += (MOODS[mood].rain - rainCur) * k; }
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgba(${gradeCur.r | 0},${gradeCur.g | 0},${gradeCur.b | 0},${gradeCur.a.toFixed(3)})`; ctx.fillRect(0, 0, Wc, Hc);
    if (vignette) { ctx.fillStyle = vignette; ctx.fillRect(0, 0, Wc, Hc); }      // vignette
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = "rgba(150,40,120,0.16)"; ctx.fillRect(0, 0, Wc, Hc);         // magenta highlight grade
    ctx.globalCompositeOperation = "source-over";

    // additive neon bloom (world space)
    world();
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = "lighter";
    const blobAt = (ix, iy, r, color, a) => {
      if (!isoVis(ix, iy, r + 24)) return;
      ctx.globalAlpha = a; ctx.drawImage(Art.blobs[color] || Art.blobs["#ffffff"], ix - r, iy - r, r * 2, r * 2);
    };
    houses.forEach(h => {
      const ix = isoX(h.cx, h.wcy), iy = isoY(h.cx, h.wcy);
      const fl = (0.8 + 0.2 * Math.sin(T * 7 + h.cx * 0.05)) * (Math.sin(T * 17 + h.cx) > 0.94 ? 0.55 : 1);
      blobAt(ix, iy - h.iso.ph, h.isArcade ? 16 : 30, h.accent, 0.6 * fl);
      blobAt(ix, iy - h.iso.ph * 0.6, h.isArcade ? 26 : 50, h.accent, 0.12 * fl);  // soft bloom halo
      blobAt(ix, iy, h.isArcade ? 12 : 18, h.accent, 0.3 * fl);
      if (!h.isArcade && isoVis(ix, iy, 200)) {
        FX.shaft(ctx, ix, iy - h.iso.ph, h.accent, T, h.cx);
        FX.streak(ctx, ix, iy - h.iso.ph + 2, h.accent);   // anamorphic lens streak
        FX.holo(ctx, ix, iy - h.iso.ph, T, h.accent, h.cx, h.thumb);
        // animated window glints on the tower faces
        const ph = h.iso.ph;
        for (let k = 0; k < 6; k++) {
          const offx = ((k * 23) % 96) - 48;
          const hgt = 12 + ((k * 41) % (ph - 22));
          const a = Math.sin(T * 6 + h.cx * 0.3 + k * 1.7) > 0.15 ? 0.4 : 0.05;
          ctx.globalAlpha = a; ctx.fillStyle = "#bff6ff";
          ctx.fillRect(ix + offx - 1, iy - hgt - Math.abs(offx) * 0.5, 2, 4);
        }
      }
    });
    interiorTrees.forEach(t => { const ix = isoX(t.wx + 8, t.wy + 8), iy = isoY(t.wx + 8, t.wy + 8); blobAt(ix, iy - 22, 14, "#19e6ff", 0.5); blobAt(ix, iy, 16, "#19e6ff", 0.2); });
    { const ix = isoX(fountain.wx + 16, fountain.wy + 24), iy = isoY(fountain.wx + 16, fountain.wy + 24);
      blobAt(ix, iy - 14, 24, "#19e6ff", 0.6); }
    cars.forEach(c => { const ix = isoX(c.wx, c.wy), iy = isoY(c.wx, c.wy); blobAt(ix, iy - 4, 14, "#ffd9a0", 0.45); });
    // player lit by nearest neon (light pool + tint)
    { const ix = isoX(player.x + 8, player.y + 14), iy = isoY(player.x + 8, player.y + 14); blobAt(ix, iy - 6, 16, pAcc, 0.45); }
    // collectible data-chips (spinning neon)
    chips.forEach(ch => {
      if (ch.got) return;
      const ix = isoX(ch.wx, ch.wy), iy = isoY(ch.wx, ch.wy); if (!isoVis(ix, iy, 30)) return;
      const yy = iy - 8 + Math.sin(T * 3 + ch.wx) * 3;
      blobAt(ix, yy, 12, "#ff3df0", 0.6);
      ctx.globalAlpha = 0.9; ctx.fillStyle = "#ffd9f6";
      ctx.beginPath(); ctx.moveTo(ix, yy - 5); ctx.lineTo(ix + 4, yy); ctx.lineTo(ix, yy + 5); ctx.lineTo(ix - 4, yy); ctx.closePath(); ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

    // giant floating name hologram over the town center
    { const cix = isoX(ccx * TILE + 8, ccy * TILE + 8), ciy = isoY(ccx * TILE + 8, ccy * TILE + 8);
      FX.landmark(ctx, cix, ciy - 235, T, PORTFOLIO.name); }

    // fog + rain (screen space), modulated by mood/weather
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (fogGrad) { ctx.globalAlpha = fogCur; ctx.fillStyle = fogGrad; ctx.fillRect(0, 0, Wc, Hc); ctx.globalAlpha = 1; }
    if (rainCur > 0.02) drawRain(dt, Wc, Hc, rainCur);
    FX.drawFogBanks(ctx, DPR, fogCur);   // rolling fog banks
    FX.drawLightning(ctx, DPR);          // lightning flash
    FX.drawEmbers(ctx, DPR);             // floating embers (additive)
    FX.drawMotes(ctx, DPR);              // drifting data-motes
    if (MOODS[mood].ash) FX.drawAsh(ctx, DPR);    // ash / snow weather

    // overdrive easter-egg pulse (all chips collected)
    if (overdrive > 0) {
      ctx.globalCompositeOperation = "lighter";
      const p = 0.10 + 0.08 * Math.sin(T * 12);
      ctx.fillStyle = "rgba(255,61,240," + p.toFixed(3) + ")"; ctx.fillRect(0, 0, Wc, Hc);
      ctx.fillStyle = "rgba(25,230,255," + (p * 0.6).toFixed(3) + ")"; ctx.fillRect(0, 0, Wc, Hc);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#bff6ff"; ctx.font = "700 30px 'Orbitron','Segoe UI',sans-serif"; ctx.textAlign = "center";
      ctx.fillText(t("overdrive"), Wc / 2, 84); ctx.textAlign = "left";
    }

    // #1 BLUR-BUFFER BLOOM: downscale the whole frame, add it back softly (brights bloom)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    blurX.imageSmoothingEnabled = true; blurX.globalCompositeOperation = "source-over";
    blurX.clearRect(0, 0, blurCv.width, blurCv.height);
    blurX.drawImage(canvas, 0, 0, blurCv.width, blurCv.height);
    ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.32;
    ctx.drawImage(blurCv, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // nameplates + NPC speech bubbles (hidden in photo mode)
    if (!photoMode) {
      houses.forEach(h => {
        const ix = isoX(h.cx, h.wcy), iy = isoY(h.cx, h.wcy) - h.iso.ph;
        if (!isoVis(ix, iy, 120)) return;
        drawNameplate(tl(h.station.label), (ix - camX) * ZOOM, (iy - camY) * ZOOM - 6);
      });
      npcs.forEach(n => {
        if (!(n.bubbleT > 0)) return;
        const ix = isoX(n.x + 8, n.y + 14), iy = isoY(n.x + 8, n.y + 14);
        drawBubble(n.bubble, (ix - camX) * ZOOM, (iy - camY) * ZOOM - 26);
      });
    }
    if (!photoMode) drawMinimap();
  }

  function drawBubble(text, cx, cy) {
    ctx.font = "600 12px 'Segoe UI', sans-serif";
    const w = Math.min(220, ctx.measureText(text).width + 18);
    const x = Math.round(cx - w / 2), y = Math.round(cy - 22);
    ctx.save();
    ctx.fillStyle = "rgba(8,10,20,0.92)"; ctx.strokeStyle = "rgba(25,230,255,0.85)"; ctx.lineWidth = 1;
    roundRect(x, y, w, 26, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(25,230,255,0.85)"; ctx.beginPath();
    ctx.moveTo(cx - 5, y + 26); ctx.lineTo(cx + 5, y + 26); ctx.lineTo(cx, y + 32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#cfeaff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, x + w / 2, y + 13, w - 12);
    ctx.restore(); ctx.textAlign = "left";
  }

  // holographic minimap (top-down)
  let mmCtx = null;
  const MM = 170, MMC = MM / 2, MMS = 78 / R_MOAT;     // size, center, tiles->px
  function drawMinimap() {
    if (!mmCtx) return;
    const m = mmCtx;
    m.clearRect(0, 0, MM, MM);
    m.strokeStyle = "rgba(25,230,255,0.30)"; m.lineWidth = 2; m.beginPath(); m.arc(MMC, MMC, R_MOAT * MMS, 0, Math.PI * 2); m.stroke();
    m.strokeStyle = "rgba(25,230,255,0.16)"; m.lineWidth = 1; m.beginPath(); m.arc(MMC, MMC, R_RING * MMS, 0, Math.PI * 2); m.stroke();
    m.fillStyle = "#19e6ff"; m.fillRect(MMC - 1, MMC - 1, 3, 3);  // monument
    houses.forEach(h => {
      const x = MMC + (h.cx / TILE - ccx) * MMS, y = MMC + (h.wcy / TILE - ccy) * MMS;
      m.fillStyle = h.accent; m.beginPath(); m.arc(x, y, 3, 0, Math.PI * 2); m.fill();
    });
    chips.forEach(ch => { if (ch.got) return; m.fillStyle = "rgba(255,61,240,0.85)"; m.fillRect(MMC + (ch.wx / TILE - ccx) * MMS - 1, MMC + (ch.wy / TILE - ccy) * MMS - 1, 2, 2); });
    const px = MMC + ((player.x + 8) / TILE - ccx) * MMS, py = MMC + ((player.y + 8) / TILE - ccy) * MMS;
    m.fillStyle = "#ffffff"; m.beginPath(); m.arc(px, py, 2.5, 0, Math.PI * 2); m.fill();
  }
  function minimapTravel(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const tx = ccx + (e.clientX - r.left - MMC) / MMS, ty = ccy + (e.clientY - r.top - MMC) / MMS;
    let best = 1e9, tgt = null;
    houses.forEach(h => { const dx = h.cx / TILE - tx, dy = h.wcy / TILE - ty, d = dx * dx + dy * dy; if (d < best) { best = d; tgt = h; } });
    if (tgt && best < 9) {
      player.x = tgt.doorWX - 8; player.y = tgt.doorWY - 8;
      const wipe = document.getElementById("wipe"); if (wipe) { wipe.classList.remove("play"); void wipe.offsetWidth; wipe.classList.add("play"); }
      Sound.ui();
    }
  }

  // rain: fixed screen-space pool, one batched stroke
  const RAIN_N = 260, rain = [];
  for (let i = 0; i < RAIN_N; i++) rain.push({ x: Math.random(), y: Math.random(), len: 7 + Math.random() * 12, sp: 0.7 + Math.random() * 0.6 });
  function drawRain(dt, Wc, Hc, density) {
    const d = density == null ? 1 : density;
    const count = Math.min(rain.length, Math.round(rain.length * Math.min(1, d)));
    const spd = d > 1 ? 1.6 * d : 1.6;
    ctx.strokeStyle = "rgba(150,200,255," + (0.22 * Math.min(1.4, d)).toFixed(3) + ")"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const r = rain[i];
      r.y += r.sp * dt * spd; r.x += r.sp * dt * 0.18;
      if (r.y > 1) { r.y -= 1; r.x = Math.random(); }
      if (r.x > 1) r.x -= 1;
      const px = r.x * Wc, py = r.y * Hc;
      ctx.moveTo(px, py); ctx.lineTo(px - 3, py + r.len);
    }
    ctx.stroke();
  }

  function drawNameplate(text, cx, cy) {
    ctx.font = "700 11px 'Orbitron', 'Segoe UI', sans-serif";
    const w = ctx.measureText(text).width + 18;
    const x = Math.round(cx - w / 2), y = Math.round(cy - 20);
    if (x + w < 0 || x > window.innerWidth || y < -20 || y > window.innerHeight) return;
    ctx.save();
    ctx.shadowColor = "rgba(25,230,255,0.9)"; ctx.shadowBlur = 10;
    ctx.fillStyle = "rgba(8,10,20,0.85)";
    roundRect(x, y, w, 18, 5); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(25,230,255,0.85)"; ctx.lineWidth = 1;
    roundRect(x + 0.5, y + 0.5, w - 1, 17, 5); ctx.stroke();
    ctx.fillStyle = "#c8f7ff";
    ctx.shadowColor = "rgba(25,230,255,0.8)"; ctx.shadowBlur = 6;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, x + w / 2, y + 10);
    ctx.restore();
    ctx.textAlign = "left";
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- main loop -----------------------------------------------------
  let last = performance.now();
  function loop(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;     // clamp big gaps
    update(dt);
    render(dt);
    requestAnimationFrame(loop);
  }

  // ---- boot ----------------------------------------------------------
  document.getElementById("name-tag").textContent = PORTFOLIO.name;
  applyLangUI();
  document.getElementById("lang").addEventListener("click", () => {
    lang = lang === "tr" ? "en" : "tr"; localStorage.setItem("pt_lang", lang);
    applyLangUI(); Sound.ui();
    if (modalOpen && lastStation) openModal(lastStation);   // re-render open modal in new language
  });
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", closeModal);
  document.getElementById("modal-body").addEventListener("click", e => {
    const img = e.target.closest("img.thumb");
    if (img) openLightbox(img.dataset.full);
  });
  document.getElementById("lightbox").addEventListener("click", closeLightbox);
  // sound toggle + HIRE beacon
  const muteBtn = document.getElementById("mute");
  const syncMute = m => { muteBtn.textContent = m ? "🔇" : "🔊"; };
  syncMute(true);
  muteBtn.addEventListener("click", () => syncMute(Sound.toggle()));
  document.getElementById("hire").addEventListener("click", () => { Sound.ui(); openModal({ type: "contact", label: "Contact" }); });
  // minimap + fast-travel
  const mm = document.getElementById("minimap"); mmCtx = mm.getContext("2d");
  mm.addEventListener("click", minimapTravel);
  // mood / weather cycle
  const moodBtn = document.getElementById("mood"), moodIcons = ["🌙", "🌆", "⛈️", "☀️", "🌫️"];
  moodBtn.addEventListener("click", () => { mood = (mood + 1) % MOODS.length; moodBtn.textContent = moodIcons[mood]; moodBtn.title = "Mood: " + MOODS[mood].name; Sound.ui(); });
  document.getElementById("chips").textContent = "◈ 0/" + chips.length;
  // generate film-grain texture for the #grain overlay
  (function () {
    const n = document.createElement("canvas"); n.width = n.height = 64;
    const gx = n.getContext("2d"), id = gx.createImageData(64, 64);
    for (let i = 0; i < id.data.length; i += 4) { const v = (Math.random() * 255) | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    gx.putImageData(id, 0, 0);
    const g = document.getElementById("grain"); if (g) g.style.backgroundImage = "url(" + n.toDataURL() + ")";
  })();
  bindTouch();
  resize();
  initDrones();
  initCars();
  FX.setVents([18, 90, 162, 234, 306].map(deg => {
    const a = deg * Math.PI / 180, wx = (ccx + 6 * Math.cos(a)) * TILE + 8, wy = (ccy + 6 * Math.sin(a)) * TILE + 8;
    return { ix: isoX(wx, wy), iy: isoY(wx, wy) };
  }));
  for (let i = 0; i < MAX_NPCS; i++) manageNpcs();   // seed pedestrians
  document.getElementById("loader").style.display = "none";
  requestAnimationFrame(loop);
})();
