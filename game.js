(() => {
  const $ = (id) => document.getElementById(id);
  const canvas = $("game");
  const ctx = canvas.getContext("2d");
  const shell = $("game-shell");
  const ui = {
    score: $("score"),
    best: $("best"),
    wave: $("wave"),
    lives: $("lives"),
    message: $("message"),
    intro: $("intro"),
    paused: $("paused"),
    over: $("over"),
    finalScore: $("final-score"),
    finalTime: $("final-time"),
    finalWave: $("final-wave"),
  };

  const width = 960;
  const height = 540;
  const limit = (value, low, high) => Math.max(low, Math.min(high, value));
  const random = (low, high) => low + Math.random() * (high - low);
  const pad = (value) => String(value).padStart(6, "0");
  const keys = new Set();
  const stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: random(0.5, 2),
    speed: random(8, 30),
  }));

  let mode = "menu";
  let best = loadBest();
  let lastFrame = 0;
  let mouseDown = false;
  let touchTarget = null;
  let fireHeld = false;
  let noticeUntil = 0;
  let game;

  function loadBest() {
    try {
      return Number(localStorage.getItem("voidrun-best")) || 0;
    } catch {
      return 0;
    }
  }

  function saveBest() {
    if (game.score <= best) return;
    best = game.score;
    try {
      localStorage.setItem("voidrun-best", String(best));
    } catch {}
  }

  function newGame() {
    game = {
      seconds: 0,
      score: 0,
      wave: 1,
      spawnIn: 0.8,
      shootIn: 0,
      player: { x: width / 2, y: height - 80, lives: 5, shield: 0 },
      bullets: [],
      enemies: [],
    };
  }

  function setMode(next) {
    mode = next;
    shell.classList.toggle("running", next === "running");
    shell.classList.toggle("paused", next === "paused");
    shell.classList.toggle("over", next === "over");
    ui.intro.hidden = next !== "menu";
    ui.paused.hidden = next !== "paused";
    ui.over.hidden = next !== "over";
    $("pause").hidden = next === "menu" || next === "over";
    if (next !== "running") clearInput();
  }

  function start() {
    newGame();
    setMode("running");
    updateHud();
    canvas.focus({ preventScroll: true });
  }

  function pause() {
    if (mode === "running") {
      setMode("paused");
      $("resume").focus({ preventScroll: true });
    } else if (mode === "paused") {
      setMode("running");
      canvas.focus({ preventScroll: true });
    }
  }

  function finish() {
    saveBest();
    ui.finalScore.textContent = game.score.toLocaleString();
    ui.finalTime.textContent = `${Math.floor(game.seconds / 60)}:${String(Math.floor(game.seconds % 60)).padStart(2, "0")}`;
    ui.finalWave.textContent = String(game.wave).padStart(2, "0");
    setMode("over");
    $("again").focus({ preventScroll: true });
  }

  function clearInput() {
    keys.clear();
    mouseDown = false;
    fireHeld = false;
    touchTarget = null;
  }

  function updateHud() {
    ui.score.textContent = pad(game.score);
    ui.best.textContent = pad(best);
    ui.wave.textContent = String(game.wave).padStart(2, "0");
    ui.lives.textContent = "■".repeat(game.player.lives) + "□".repeat(5 - game.player.lives);
  }

  function announce(text) {
    ui.message.textContent = text;
    ui.message.classList.add("show");
    noticeUntil = game.seconds + 2;
  }

  function spawnEnemy() {
    const roll = Math.random();
    const kind = game.wave > 3 && roll < 0.16 ? "brute" : game.wave > 1 && roll < 0.42 ? "stinger" : "drifter";
    const settings = {
      drifter: { r: 18, hp: 2, speed: 62, points: 100, color: "#9db89f" },
      stinger: { r: 12, hp: 1, speed: 120, points: 150, color: "#e1ad65" },
      brute: { r: 28, hp: 7, speed: 40, points: 400, color: "#c3889a" },
    }[kind];
    game.enemies.push({
      ...settings,
      kind,
      x: random(settings.r, width - settings.r),
      y: -settings.r,
      age: 0,
      hit: 0,
    });
  }

  function shoot() {
    if (game.shootIn > 0) return;
    game.shootIn = 0.16;
    for (const offset of [-8, 8]) {
      game.bullets.push({ x: game.player.x + offset, y: game.player.y - 20 });
    }
  }

  function hitPlayer(enemy) {
    enemy.dead = true;
    if (game.player.shield > 0) return;
    game.player.lives--;
    game.player.shield = 1.2;
    updateHud();
    if (game.player.lives <= 0) finish();
  }

  function destroy(enemy) {
    enemy.dead = true;
    game.score += enemy.points;
    saveBest();
    updateHud();
  }

  function update(delta) {
    game.seconds += delta;
    const nextWave = 1 + Math.floor(game.seconds / 25);
    if (nextWave !== game.wave) {
      game.wave = nextWave;
      game.player.lives = Math.min(5, game.player.lives + 1);
      announce(`WAVE ${String(game.wave).padStart(2, "0")}`);
      updateHud();
    }

    if (noticeUntil && game.seconds > noticeUntil) ui.message.classList.remove("show");
    game.shootIn = Math.max(0, game.shootIn - delta);
    game.player.shield = Math.max(0, game.player.shield - delta);

    let dx = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    let dy = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
    if (touchTarget) {
      game.player.x += (touchTarget.x - game.player.x) * Math.min(1, delta * 12);
      game.player.y += (touchTarget.y - game.player.y) * Math.min(1, delta * 12);
    } else if (dx || dy) {
      const length = Math.hypot(dx, dy);
      game.player.x += (dx / length) * 300 * delta;
      game.player.y += (dy / length) * 300 * delta;
    }
    game.player.x = limit(game.player.x, 24, width - 24);
    game.player.y = limit(game.player.y, 75, height - 30);

    if (keys.has("Space") || mouseDown || fireHeld) shoot();

    game.spawnIn -= delta;
    if (game.spawnIn <= 0) {
      if (game.enemies.length < 45) spawnEnemy();
      game.spawnIn = Math.max(0.3, 1.15 - game.seconds / 180) * random(0.75, 1.2);
    }

    for (const bullet of game.bullets) bullet.y -= 650 * delta;
    game.bullets = game.bullets.filter((bullet) => bullet.y > -20);

    for (const enemy of game.enemies) {
      enemy.age += delta;
      enemy.hit = Math.max(0, enemy.hit - delta);
      const targetX = game.player.x - enemy.x;
      const targetY = game.player.y - enemy.y;
      const distance = Math.hypot(targetX, targetY) || 1;
      const drift = enemy.kind === "stinger" ? Math.sin(enemy.age * 8) * 34 : Math.sin(enemy.age * 2) * 16;
      enemy.x += ((targetX / distance) * enemy.speed * 0.5 + drift) * delta;
      enemy.y += ((targetY / distance) * enemy.speed * 0.65 + enemy.speed * 0.35) * delta;
      enemy.x = limit(enemy.x, enemy.r, width - enemy.r);

      for (const bullet of game.bullets) {
        if (bullet.dead || enemy.dead) continue;
        if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < enemy.r + 4) {
          bullet.dead = true;
          enemy.hp--;
          enemy.hit = 0.08;
          if (enemy.hp <= 0) destroy(enemy);
        }
      }

      if (!enemy.dead && Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y) < enemy.r + 15) hitPlayer(enemy);
      if (enemy.y > height + enemy.r) enemy.dead = true;
    }
    game.bullets = game.bullets.filter((bullet) => !bullet.dead);
    game.enemies = game.enemies.filter((enemy) => !enemy.dead);
  }

  function polygon(points, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index++) ctx.lineTo(points[index][0], points[index][1]);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function drawShip() {
    const { x, y, shield } = game.player;
    ctx.save();
    ctx.translate(x, y);
    polygon([[0, -24], [-17, 18], [0, 13], [17, 18]], "#b7c9cf", "#e6f0f1");
    polygon([[0, -13], [-5, 8], [0, 14], [5, 8]], "#274f60", "#7fb0bf");
    ctx.fillStyle = "#f1a15a";
    ctx.beginPath();
    ctx.moveTo(-5, 16);
    ctx.lineTo(0, 27 + Math.sin(game.seconds * 28) * 4);
    ctx.lineTo(5, 16);
    ctx.fill();
    if (shield > 0) {
      ctx.strokeStyle = "#a5d8e2";
      ctx.globalAlpha = 0.35 + Math.sin(game.seconds * 18) * 0.2;
      ctx.beginPath();
      ctx.arc(0, 0, 31, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.fillStyle = enemy.hit ? "#fff2de" : enemy.color;
    if (enemy.kind === "drifter") {
      polygon([[-18, -8], [-8, -15], [0, -8], [8, -15], [18, -8], [13, 13], [0, 18], [-13, 13]], "#344a42", enemy.color);
      ctx.fillRect(-7, -3, 14, 7);
    } else if (enemy.kind === "stinger") {
      polygon([[0, 18], [-15, -12], [0, -8], [15, -12]], "#5c4630", enemy.color);
      ctx.fillRect(-3, -4, 6, 9);
    } else {
      polygon([[-24, -8], [-12, -18], [12, -18], [24, -8], [19, 15], [0, 22], [-19, 15]], "#4e3743", enemy.color);
      ctx.fillStyle = "#301f29";
      ctx.fillRect(-10, -2, 20, 7);
    }
    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = "#071019";
    ctx.fillRect(0, 0, width, height);
    for (const star of stars) {
      const y = (star.y + game.seconds * star.speed) % height;
      ctx.fillStyle = star.speed > 22 ? "#b3ccd5" : "#5d7d89";
      ctx.fillRect(star.x, y, star.size, star.size);
    }
    const glow = ctx.createRadialGradient(width * 0.82, height * 0.22, 5, width * 0.82, height * 0.22, 120);
    glow.addColorStop(0, "#3d58622b");
    glow.addColorStop(1, "#07101900");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  function render() {
    const scale = Math.min(canvas.width / width, canvas.height / height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#071019";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, (canvas.width - width * scale) / 2, (canvas.height - height * scale) / 2);
    drawBackground();
    if (mode === "menu") {
      drawShip();
      return;
    }
    for (const bullet of game.bullets) {
      ctx.fillStyle = "#d9f7f5";
      ctx.fillRect(bullet.x - 1, bullet.y, 2, 12);
    }
    for (const enemy of game.enemies) drawEnemy(enemy);
    drawShip();
  }

  function frame(now) {
    const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.035) : 0;
    lastFrame = now;
    if (mode === "running") update(delta);
    render();
    requestAnimationFrame(frame);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
  }

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / width, rect.height / height);
    return {
      x: (event.clientX - rect.left - (rect.width - width * scale) / 2) / scale,
      y: (event.clientY - rect.top - (rect.height - height * scale) / 2) / scale,
    };
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (mode !== "running") return;
    if (event.pointerType === "mouse") mouseDown = true;
    else touchTarget = point(event);
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (touchTarget && event.pointerType !== "mouse") touchTarget = point(event);
  });

  function release(event) {
    if (event.pointerType === "mouse") mouseDown = false;
    touchTarget = null;
  }

  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  $("fire").addEventListener("pointerdown", (event) => {
    if (mode !== "running") return;
    fireHeld = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
    $("fire").addEventListener(name, () => {
      fireHeld = false;
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.code === "Enter" && (mode === "menu" || mode === "over") && !event.repeat) {
      start();
      return;
    }
    if (["KeyP", "Escape"].includes(event.code) && !event.repeat) {
      pause();
      return;
    }
    if (mode === "running") {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      keys.add(event.code);
    }
  });

  window.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("blur", () => {
    if (mode === "running") pause();
  });

  $("play").addEventListener("click", start);
  $("again").addEventListener("click", start);
  $("pause").addEventListener("click", pause);
  $("resume").addEventListener("click", pause);
  window.addEventListener("resize", resize);

  newGame();
  resize();
  updateHud();
  setMode("menu");
  requestAnimationFrame(frame);
})();
