window.onload = function(){
  var canvas = document.querySelector("#game");
  canvas.width = 960;
  canvas.height = 540;
  var context = canvas.getContext("2d");

  var shell = document.querySelector("#game-shell");
  var intro = document.querySelector("#intro");
  var paused = document.querySelector("#paused");
  var over = document.querySelector("#over");
  var pauseButton = document.querySelector("#pause");
  var fireButton = document.querySelector("#fire");
  var scoreElement = document.querySelector("#score");
  var bestElement = document.querySelector("#best");
  var waveElement = document.querySelector("#wave");
  var livesElement = document.querySelector("#lives");
  var messageElement = document.querySelector("#message");

  var width = 960;
  var height = 540;
  var mode = "menu";
  var mouse = {
    x: width/2,
    y: height-80
  };
  var keys = {};
  var firing = false;

  var playerWidth = 34;
  var playerHeight = 34;
  var score = 0;
  var health = 5;

  var bullets = [];
  var bulletWidth = 2;
  var bulletHeight = 12;
  var bulletSpeed = 650;

  var enemies = [];
  var enemyWidth = 36;
  var enemyHeight = 36;

  var lastFrame = 0;
  var seconds = 0;
  var wave = 1;

  var best = 0;
  try {
    best = Number(localStorage.getItem("voidrun-best")) || 0;
  } catch (err) {
    best = 0;
  }

  function setMode(next){
    mode = next;
    shell.classList.toggle("running", next === "running");
    shell.classList.toggle("paused", next === "paused");
    shell.classList.toggle("over", next === "over");
    intro.hidden = next !== "menu";
    paused.hidden = next !== "paused";
    over.hidden = next !== "over";
    pauseButton.hidden = next === "menu" || next === "over";
    if (next !== "running"){
      keys = {};
      firing = false;
    }
  }

  function saveBest(){
    if (score <= best){
      return;
    }
    best = score;
    try {
      localStorage.setItem("voidrun-best", String(best));
    } catch (err) {
    }
  }

  function startGame(){
    mouse.x = width/2;
    mouse.y = height-80;
    score = 0;
    health = 5;
    seconds = 0;
    wave = 1;
    bullets = [];
    enemies = [];
    player = new Player(mouse.x - playerWidth/2, mouse.y - playerHeight/2, playerWidth, playerHeight);
    setMode("running");
    updateHud();
  }

  function pauseGame(){
    if (mode === "running"){
      setMode("paused");
    } else if (mode === "paused"){
      setMode("running");
    }
  }

  function finishGame(){
    saveBest();
    document.querySelector("#final-score").textContent = score.toLocaleString();
    document.querySelector("#final-time").textContent = Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
    document.querySelector("#final-wave").textContent = String(wave).padStart(2, "0");
    setMode("over");
  }

  function Player(x, y, width, height){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.draw = function(){
      context.beginPath();
      context.save();
      context.translate(this.x + this.width/2, this.y + this.height/2);
      context.fillStyle = "#b7c9cf";
      context.strokeStyle = "#e6f0f1";
      context.moveTo(0, -24);
      context.lineTo(-17, 18);
      context.lineTo(0, 13);
      context.lineTo(17, 18);
      context.closePath();
      context.fill();
      context.stroke();
      context.fillStyle = "#f1a15a";
      context.beginPath();
      context.moveTo(-5, 16);
      context.lineTo(0, 27 + Math.sin(seconds * 28) * 4);
      context.lineTo(5, 16);
      context.fill();
      context.restore();
    };

  }

  function Bullet(x, y, width, height, speed){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;

    this.draw = function(){
      context.beginPath();
      context.rect(this.x, this.y, this.width, this.height);
      context.fillStyle = "#d9f7f5";
      context.fill();
    };

    this.update = function(delta){
      this.y -= this.speed * delta;
      this.draw();
    };
  }

  function Enemy(x, y, width, height, speed){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;

    this.draw = function(){
      context.beginPath();
      context.fillStyle = "#9db89f";
      context.strokeStyle = "#e6f0f1";
      context.moveTo(this.x, this.y);
      context.lineTo(this.x - this.width/2, this.y + this.height/2);
      context.lineTo(this.x, this.y + this.height);
      context.lineTo(this.x + this.width/2, this.y + this.height/2);
      context.closePath();
      context.fill();
      context.stroke();
    };

    this.update = function(delta){
      this.y += this.speed * delta;
      this.draw();
    };
  }

  var player = new Player(mouse.x - playerWidth/2, mouse.y - playerHeight/2, playerWidth, playerHeight);

  canvas.addEventListener("mousemove", function(event){
    var rect = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) * (width / rect.width);
    mouse.y = (event.clientY - rect.top) * (height / rect.height);
  });
  canvas.addEventListener("touchmove", function(event){
    var rect = canvas.getBoundingClientRect();
    var touch = event.changedTouches[0];
    event.preventDefault();
    mouse.x = (touch.clientX - rect.left) * (width / rect.width);
    mouse.y = (touch.clientY - rect.top) * (height / rect.height);
  });

  function setFiring(next){
    firing = next && mode === "running";
    if (firing){
      fire();
    }
  }

  canvas.addEventListener("mousedown", function(event){
    if (event.button === 0){
      setFiring(true);
    }
  });
  window.addEventListener("mouseup", function(){
    setFiring(false);
  });
  window.addEventListener("pointerup", function(){
    setFiring(false);
  });

  window.addEventListener("keydown", function(event){
    if (event.code === "Enter" && (mode === "menu" || mode === "over") && !event.repeat){
      startGame();
      return;
    }
    if ((event.code === "KeyP" || event.code === "Escape") && !event.repeat){
      pauseGame();
      return;
    }
    if (mode === "running"){
      keys[event.code] = true;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(event.code) > -1){
        event.preventDefault();
      }
      if (event.code === "Space" && !event.repeat){
        setFiring(true);
      }
    }
  });
  window.addEventListener("keyup", function(event){
    keys[event.code] = false;
    if (event.code === "Space"){
      setFiring(false);
    }
  });
  window.addEventListener("blur", function(){
    if (mode === "running"){
      pauseGame();
    }
  });

  document.querySelector("#play").addEventListener("click", startGame);
  document.querySelector("#again").addEventListener("click", startGame);
  pauseButton.addEventListener("click", pauseGame);
  document.querySelector("#resume").addEventListener("click", pauseGame);
  fireButton.addEventListener("pointerdown", function(event){
    event.preventDefault();
    setFiring(true);
  });
  fireButton.addEventListener("pointerup", function(){
    setFiring(false);
  });
  fireButton.addEventListener("pointercancel", function(){
    setFiring(false);
  });
  fireButton.addEventListener("pointerleave", function(){
    setFiring(false);
  });

  function collision(a,b){
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  function spawnEnemy(){
    if (mode !== "running"){
      return;
    }
    var x = Math.random()*(width-enemyWidth);
    var y = -enemyHeight;
    var speed = 40 + Math.random()*80;
    var enemy = new Enemy(x, y, enemyWidth, enemyHeight, speed);
    enemies.push(enemy);
  }
  setInterval(spawnEnemy, 1000);

  function fire(){
    if (mode !== "running" || !firing){
      return;
    }
    var x = mouse.x-bulletWidth/2;
    var y = mouse.y-playerHeight;
    var bullet = new Bullet(x, y, bulletWidth, bulletHeight, bulletSpeed);
    bullets.push(bullet);
  }
  setInterval(fire, 200);

  function updateHud(){
    scoreElement.textContent = String(score).padStart(6, "0");
    bestElement.textContent = String(best).padStart(6, "0");
    waveElement.textContent = String(wave).padStart(2, "0");
    livesElement.textContent = "■".repeat(health) + "□".repeat(5 - health);
  }

  function showMessage(text){
    messageElement.textContent = text;
    messageElement.classList.add("show");
    setTimeout(function(){
      messageElement.classList.remove("show");
    }, 2000);
  }

  function drawBackground(){
    context.beginPath();
    context.fillStyle = "#071019";
    context.fillRect(0,0,width,height);
  }

  function update(delta){
    seconds += delta;

    var dx = 0;
    var dy = 0;
    if (keys["KeyD"] || keys["ArrowRight"]){
      dx = 1;
    }
    if (keys["KeyA"] || keys["ArrowLeft"]){
      dx = -1;
    }
    if (keys["KeyS"] || keys["ArrowDown"]){
      dy = 1;
    }
    if (keys["KeyW"] || keys["ArrowUp"]){
      dy = -1;
    }
    if (dx || dy){
      var length = Math.hypot(dx, dy);
      mouse.x += (dx / length) * 300 * delta;
      mouse.y += (dy / length) * 300 * delta;
    }
    mouse.x = Math.max(24, Math.min(width-24, mouse.x));
    mouse.y = Math.max(24, Math.min(height-30, mouse.y));

    player.x = mouse.x - playerWidth/2;
    player.y = mouse.y - playerHeight/2;

    var nextWave = 1 + Math.floor(seconds / 25);
    if (nextWave !== wave){
      wave = nextWave;
      health = Math.min(5, health + 1);
      showMessage("WAVE " + String(wave).padStart(2, "0"));
      updateHud();
    }

    for (var i = bullets.length - 1; i >= 0; i--){
      bullets[i].update(delta);
      if (bullets[i].y < 0){
        bullets.splice(i, 1);
      }
    }

    for (var k = enemies.length - 1; k >= 0; k--){
      enemies[k].update(delta);
      if (enemies[k].y > height){
        enemies.splice(k, 1);
        health -= 1;
        updateHud();
        if (health <= 0){
          finishGame();
          return;
        }
      }
    }

    for (var j = enemies.length - 1; j >= 0; j--){
      for (var l = bullets.length - 1; l >= 0; l--){
        if (collision(enemies[j], bullets[l])){
          enemies.splice(j, 1);
          bullets.splice(l, 1);
          score++;
          updateHud();
          break;
        }
      }
    }
  }

  function render(){
    drawBackground();
    if (mode === "menu"){
      player.x = width/2 - playerWidth/2;
      player.y = height-80 - playerHeight/2;
    }
    for (var i = 0; i < bullets.length; i++){
      bullets[i].draw();
    }
    for (var k = 0; k < enemies.length; k++){
      enemies[k].draw();
    }
    player.draw();
  }

  function animate(){
    requestAnimationFrame(animate);
    var now = performance.now();
    var delta = Math.min((now - (lastFrame || now)) / 1000, 0.035);
    lastFrame = now;
    if (mode === "running"){
      update(delta);
    }
    render();
  }

  updateHud();
  setMode("menu");
  animate();
  };
