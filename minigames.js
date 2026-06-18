/* =====================================================================
   minigames.js — self-contained arcade cabinets for the neon city.
   API:  const g = startMiniGame("runner"|"snake", canvasEl);  ...  g.stop();
   Each game: own RAF loop, own input listeners, own localStorage best.
   stop() MUST cancel the loop and remove listeners (called by closeModal).
   ===================================================================== */

function startMiniGame(id, canvas, strings) {
  if (!canvas) return { stop() {} };
  const S = Object.assign({ score: "SCORE", best: "BEST", crash: "SYSTEM CRASH", lost: "CONNECTION LOST", retry: "SPACE / TAP to retry" }, strings || {});
  if (id === "runner") return GridRunner(canvas, S);
  if (id === "snake") return NeonSnake(canvas, S);
  return { stop() {} };
}

const MG = {
  NEON: "#19e6ff", MAG: "#ff3df0", LIME: "#39ff14", GOLD: "#ffb800", BG: "#070912"
};

/* ---------------------- NEON RUNNER (endless runner) ----------------- */
function GridRunner(canvas, S) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const W = canvas.width, H = canvas.height, GROUND = H - 70;
  const { NEON, MAG, LIME, BG } = MG;
  const HS = "pt_hs_runner";

  let player, obstacles, scroll, speed, spawnTimer, score, best, state, shake;
  function reset() {
    player = { x: 70, y: GROUND, vy: 0, w: 16, h: 22, onGround: true, duck: false };
    obstacles = []; scroll = 0; speed = 150; spawnTimer = 0.8;
    score = 0; best = +(localStorage.getItem(HS) || 0); state = "play"; shake = 0;
  }
  reset();

  const keys = {};
  function jump() {
    if (state === "over") { reset(); return; }
    if (player.onGround) { player.vy = -430; player.onGround = false; }
  }
  function onDown(e) {
    const k = e.key.toLowerCase();
    if ([" ", "arrowup", "w", "arrowdown", "s"].includes(k)) e.preventDefault();
    keys[k] = true;
    if (k === " " || k === "arrowup" || k === "w" || k === "enter") jump();
  }
  function onUp(e) { keys[e.key.toLowerCase()] = false; }
  function onTap(e) { e.preventDefault(); jump(); }
  window.addEventListener("keydown", onDown, true);
  window.addEventListener("keyup", onUp, true);
  canvas.addEventListener("pointerdown", onTap);

  function spawn() {
    const tall = Math.random() < 0.35;
    const flying = !tall && Math.random() < 0.3;
    obstacles.push({
      x: W + 10, y: flying ? GROUND - 46 : GROUND,
      w: tall ? 16 : 14, h: tall ? 34 : (flying ? 14 : 18),
      color: tall ? MAG : (flying ? LIME : NEON), passed: false
    });
  }

  function update(dt) {
    if (shake > 0) shake = Math.max(0, shake - dt * 60);
    if (state !== "play") return;
    speed += dt * 6;
    scroll = (scroll + speed * dt) % 32;
    score += speed * dt * 0.05;
    player.duck = (keys["arrowdown"] || keys["s"]) && player.onGround;
    player.vy += 1500 * dt; player.y += player.vy * dt;
    if (player.y >= GROUND) { player.y = GROUND; player.vy = 0; player.onGround = true; }
    const ph = player.duck ? player.h * 0.55 : player.h, py = player.y - ph;
    spawnTimer -= dt;
    if (spawnTimer <= 0) { spawn(); spawnTimer = Math.max(0.45, 1.1 - speed / 600) * (0.7 + Math.random() * 0.7); }
    for (const o of obstacles) {
      o.x -= speed * dt;
      if (!o.passed && o.x + o.w < player.x) { o.passed = true; score += 10; }
      if (player.x < o.x + o.w && player.x + player.w > o.x && py < o.y && py + ph > o.y - o.h) {
        state = "over"; shake = 12; best = Math.max(best, Math.floor(score));
        localStorage.setItem(HS, best);
      }
    }
    obstacles = obstacles.filter(o => o.x + o.w > -20);
  }

  function render() {
    const sx = state === "over" ? (Math.random() - 0.5) * shake : 0;
    const sy = state === "over" ? (Math.random() - 0.5) * shake : 0;
    ctx.setTransform(1, 0, 0, 1, sx, sy);
    ctx.fillStyle = BG; ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.strokeStyle = "rgba(25,230,255,0.10)"; ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) { const x = (i * 40 - (scroll * 1.5) % 40); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.fillStyle = "#0c0f1c"; ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = NEON; ctx.fillRect(0, GROUND - 2, W, 2);
    ctx.fillStyle = "rgba(25,230,255,0.45)";
    for (let x = -scroll; x < W; x += 32) ctx.fillRect(x, GROUND + 8, 16, 2);
    for (const o of obstacles) {
      ctx.fillStyle = o.color + "33"; ctx.fillRect(o.x - 2, o.y - o.h - 2, o.w + 4, o.h + 4);
      ctx.fillStyle = o.color; ctx.fillRect(o.x, o.y - o.h, o.w, o.h);
    }
    const ph = player.duck ? player.h * 0.55 : player.h, py = player.y - ph;
    ctx.fillStyle = "rgba(255,61,240,0.25)"; ctx.fillRect(player.x - 2, py - 2, player.w + 4, ph + 4);
    ctx.fillStyle = MAG; ctx.fillRect(player.x, py, player.w, ph);
    ctx.fillStyle = NEON; ctx.fillRect(player.x, py + ph - 3, player.w, 3);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = "16px Consolas, monospace"; ctx.textAlign = "left";
    ctx.fillStyle = NEON; ctx.fillText(S.score + " " + Math.floor(score), 14, 26);
    ctx.fillStyle = MAG; ctx.textAlign = "right"; ctx.fillText(S.best + " " + best, W - 14, 26);
    if (state === "over") {
      ctx.fillStyle = "rgba(2,3,8,0.7)"; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = MAG; ctx.font = "28px Consolas, monospace"; ctx.fillText(S.crash, W / 2, H / 2 - 14);
      ctx.fillStyle = NEON; ctx.font = "14px Consolas, monospace";
      ctx.fillText(S.score + " " + Math.floor(score) + "   ·   " + S.best + " " + best, W / 2, H / 2 + 12);
      ctx.fillStyle = "#c8f7ff"; ctx.fillText(S.retry, W / 2, H / 2 + 40);
    }
  }

  let last = performance.now(), raf = 0, running = true;
  function frame(now) {
    if (!running) return;
    let dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05;
    update(dt); render(); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    stop() {
      running = false; cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onDown, true);
      window.removeEventListener("keyup", onUp, true);
      canvas.removeEventListener("pointerdown", onTap);
    }
  };
}

/* ---------------------- DATA SNAKE (grid snake) --------------------- */
function NeonSnake(canvas, S) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const W = canvas.width, H = canvas.height;
  const CELL = 20, COLS = (W / CELL) | 0, ROWS = (H / CELL) | 0;
  const { NEON, MAG, LIME, GOLD, BG } = MG;
  const HS = "pt_hs_snake";

  let snake, dir, nextDir, food, tick, step, score, best, state;
  function placeFood() {
    while (true) {
      const f = { x: (Math.random() * COLS) | 0, y: (Math.random() * ROWS) | 0 };
      if (!snake.some(s => s.x === f.x && s.y === f.y)) { food = f; return; }
    }
  }
  function reset() {
    snake = [{ x: 6, y: ROWS >> 1 }, { x: 5, y: ROWS >> 1 }, { x: 4, y: ROWS >> 1 }];
    dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
    tick = 0; step = 0.12; score = 0; best = +(localStorage.getItem(HS) || 0);
    state = "play"; placeFood();
  }
  reset();

  function setDir(x, y) {
    if (state === "over") { reset(); return; }
    if (x === -dir.x && y === -dir.y) return;   // no 180°
    nextDir = { x, y };
  }
  function onDown(e) {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(k)) e.preventDefault();
    if (k === "arrowup" || k === "w") setDir(0, -1);
    else if (k === "arrowdown" || k === "s") setDir(0, 1);
    else if (k === "arrowleft" || k === "a") setDir(-1, 0);
    else if (k === "arrowright" || k === "d") setDir(1, 0);
    else if (k === " " && state === "over") reset();
  }
  // touch: swipe
  let tsx = 0, tsy = 0;
  function onTS(e) { const t = e.changedTouches[0]; tsx = t.clientX; tsy = t.clientY; }
  function onTE(e) {
    const t = e.changedTouches[0], dx = t.clientX - tsx, dy = t.clientY - tsy;
    if (Math.abs(dx) < 16 && Math.abs(dy) < 16) { if (state === "over") reset(); return; }
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0); else setDir(0, dy > 0 ? 1 : -1);
  }
  window.addEventListener("keydown", onDown, true);
  canvas.addEventListener("touchstart", onTS, { passive: true });
  canvas.addEventListener("touchend", onTE);

  function update(dt) {
    if (state !== "play") return;
    tick += dt;
    if (tick < step) return;
    tick = 0; dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS ||
        snake.some(s => s.x === head.x && s.y === head.y)) {
      state = "over"; best = Math.max(best, score); localStorage.setItem(HS, best); return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) { score += 10; step = Math.max(0.05, step - 0.004); placeFood(); }
    else snake.pop();
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(25,230,255,0.07)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= COLS; x++) { ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); }
    for (let y = 0; y <= ROWS; y++) { ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); }
    ctx.stroke();
    // food (data node)
    ctx.fillStyle = GOLD + "44"; ctx.fillRect(food.x * CELL, food.y * CELL, CELL, CELL);
    ctx.fillStyle = GOLD; ctx.fillRect(food.x * CELL + 5, food.y * CELL + 5, CELL - 10, CELL - 10);
    // snake
    snake.forEach((s, i) => {
      const c = i === 0 ? NEON : (i % 2 ? "#1bb6cf" : NEON);
      ctx.fillStyle = (i === 0 ? NEON : "#0e8aa0") + "33"; ctx.fillRect(s.x * CELL - 1, s.y * CELL - 1, CELL + 2, CELL + 2);
      ctx.fillStyle = c; ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
    ctx.font = "16px Consolas, monospace"; ctx.textAlign = "left";
    ctx.fillStyle = NEON; ctx.fillText(S.score + " " + score, 12, 24);
    ctx.fillStyle = MAG; ctx.textAlign = "right"; ctx.fillText(S.best + " " + best, W - 12, 24);
    if (state === "over") {
      ctx.fillStyle = "rgba(2,3,8,0.72)"; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = MAG; ctx.font = "28px Consolas, monospace"; ctx.fillText(S.lost, W / 2, H / 2 - 14);
      ctx.fillStyle = NEON; ctx.font = "14px Consolas, monospace";
      ctx.fillText(S.score + " " + score + "   ·   " + S.best + " " + best, W / 2, H / 2 + 12);
      ctx.fillStyle = "#c8f7ff"; ctx.fillText(S.retry, W / 2, H / 2 + 40);
    }
  }

  let last = performance.now(), raf = 0, running = true;
  function frame(now) {
    if (!running) return;
    let dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05;
    update(dt); render(); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    stop() {
      running = false; cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onDown, true);
      canvas.removeEventListener("touchstart", onTS);
      canvas.removeEventListener("touchend", onTE);
    }
  };
}
