window.onerror = function(){
  return true;
};

window.onload = function(){
  var c = document.querySelector("#game");
  var canvas = document.querySelector("#game");
  canvas.width = 960;
  canvas.height = 540;
  c = canvas.getContext("2d");

  var shell = document.querySelector("#game-shell");
  var intro_element = document.querySelector("#intro");
  var paused_element = document.querySelector("#paused");
  var over_element = document.querySelector("#over");
  var pause_button = document.querySelector("#pause");
  var score_element = document.querySelector("#score");
  var best_element = document.querySelector("#best");
  var wave_element = document.querySelector("#wave");
  var lives_element = document.querySelector("#lives");
  var message_element = document.querySelector("#message");

  var width = 960;
  var height = 540;
  var mode = "menu";
  var mouse = {
    x: width/2,
    y: height-80
  };
  var keys = {};

  var player_width = 34;
  var player_height = 34;
  var score = 0;
  var health = 5;

  var _bullets = [];
  var bullet_width = 2;
  var bullet_height = 12;
  var bullet_speed = 650;

  var _enemies = [];
  var enemy_width = 36;
  var enemy_height = 36;

  var _lastframe = 0;
  var _seconds = 0;
  var _wave = 1;

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
    intro_element.hidden = next !== "menu";
    paused_element.hidden = next !== "paused";
    over_element.hidden = next !== "over";
    pause_button.hidden = next === "menu" || next === "over";
    if (next !== "running"){
      keys = {};
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
    _seconds = 0;
    _wave = 1;
    _bullets = [];
    _enemies = [];
    __player = new Player(mouse.x, mouse.y, player_width, player_height);
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
    document.querySelector("#final-time").textContent = Math.floor(_seconds / 60) + ":" + String(Math.floor(_seconds % 60)).padStart(2, "0");
    document.querySelector("#final-wave").textContent = String(_wave).padStart(2, "0");
    setMode("over");
  }

  function Player(x, y, width, height){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.draw = function(){
      c.beginPath();
      c.save();
      c.translate(this.x, this.y);
      c.fillStyle = "#b7c9cf";
      c.strokeStyle = "#e6f0f1";
      c.moveTo(0, -24);
      c.lineTo(-17, 18);
      c.lineTo(0, 13);
      c.lineTo(17, 18);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "#f1a15a";
      c.beginPath();
      c.moveTo(-5, 16);
      c.lineTo(0, 27 + Math.sin(_seconds * 28) * 4);
      c.lineTo(5, 16);
      c.fill();
      c.restore();
    };

    this.update = function(){
      this.draw();
    };
  }

  function Bullet(x, y, width, height, speed){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;

    this.draw = function(){
      c.beginPath();
      c.rect(this.x, this.y, this.width, this.height);
      c.fillStyle = "#d9f7f5";
      c.fill();
    };

    this.update = function(){
      this.y -= this.speed * 0.016;
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
      c.beginPath();
      c.fillStyle = "#9db89f";
      c.strokeStyle = "#e6f0f1";
      c.moveTo(this.x, this.y);
      c.lineTo(this.x - this.width/2, this.y + this.height/2);
      c.lineTo(this.x, this.y + this.height);
      c.lineTo(this.x + this.width/2, this.y + this.height/2);
      c.closePath();
      c.fill();
      c.stroke();
    };

    this.update = function(){
      this.y += this.speed * 0.016;
      this.draw();
    };
  }

  var __player = new Player(mouse.x, mouse.y, player_width, player_height);

  canvas.addEventListener("mousemove", function(event){
    var rect = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) * (width / rect.width);
    mouse.y = (event.clientY - rect.top) * (height / rect.height);
  });
  canvas.addEventListener("touchmove", function(event){
    var rect = canvas.getBoundingClientRect();
    var touch = event.changedTouches[0];
    var touchX = parseInt(touch.clientX);
    var touchY = parseInt(touch.clientY) - rect.top;
    event.preventDefault();
    mouse.x = touchX * (width / rect.width);
    mouse.y = touchY * (height / rect.height);
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
    }
  });
  window.addEventListener("keyup", function(event){
    keys[event.code] = false;
  });
  window.addEventListener("blur", function(){
    if (mode === "running"){
      pauseGame();
    }
  });

  document.querySelector("#play").addEventListener("click", startGame);
  document.querySelector("#again").addEventListener("click", startGame);
  pause_button.addEventListener("click", pauseGame);
  document.querySelector("#resume").addEventListener("click", pauseGame);

  function collision(a,b){
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  c.font = "1em Arial";

  function drawEnemies(){
    if (mode !== "running"){
      return;
    }
    for (var _ = 0; _<1; _++){
      var x = Math.random()*(width-enemy_width);
      var y = -enemy_height;
      var speed = 40 + Math.random()*80;
      var __enemy = new Enemy(x, y, enemy_width, enemy_height, speed);
      _enemies.push(__enemy);
    }
  }setInterval(drawEnemies, 1000);

  function fire(){
    if (mode !== "running"){
      return;
    }
    for (var _ = 0; _<1; _++){
      var x = mouse.x-bullet_width/2;
      var y = mouse.y-player_height;
      var __bullet = new Bullet(x, y, bullet_width, bullet_height, bullet_speed);
      _bullets.push(__bullet);
    }
  }setInterval(fire, 200);

  function updateHud(){
    score_element.textContent = String(score).padStart(6, "0");
    best_element.textContent = String(best).padStart(6, "0");
    wave_element.textContent = String(_wave).padStart(2, "0");
    lives_element.textContent = "■".repeat(health) + "□".repeat(5 - health);
  }

  function showMessage(text){
    message_element.textContent = text;
    message_element.style.opacity = "1";
    setTimeout(function(){
      message_element.style.opacity = "0";
    }, 2000);
  }

  function drawBackground(){
    c.beginPath();
    c.fillStyle = "#071019";
    c.fillRect(0,0,width,height);
  }

  function update(delta){
    _seconds += delta;

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

    __player.x = mouse.x - player_width/2;
    __player.y = mouse.y - player_height/2;

    var nextWave = 1 + Math.floor(_seconds / 25);
    if (nextWave !== _wave){
      _wave = nextWave;
      health = Math.min(5, health + 1);
      showMessage("WAVE " + String(_wave).padStart(2, "0"));
      updateHud();
    }

    for (var i=0; i < _bullets.length; i++){
      _bullets[i].update();
      if (_bullets[i].y < 0){
        _bullets.splice(i, 1);
      }
    }

    for (var k=0; k < _enemies.length; k++){
      _enemies[k].update();
      if(_enemies[k].y > height){
        _enemies.splice(k, 1);
        health -= 1;
        updateHud();
      if(health <= 0){
        alert("You DIED!\nYour score was "+score);
        finishGame();
        return;
       }
      }
    }

    for(var j = _enemies.length-1; j >= 0; j--){
      for(var l = _bullets.length-1; l >= 0; l--){
        if(collision(_enemies[j], _bullets[l])){
          _enemies.splice(j, 1);
          _bullets.splice(l, 1);
          score++;
          updateHud();
        }
      }
    }
  }

  function render(){
    drawBackground();
    if (mode === "menu"){
      __player.x = width/2 - player_width/2;
      __player.y = height-80 - player_height/2;
    }
    for (var i=0; i < _bullets.length; i++){
      _bullets[i].draw();
    }
    for (var k=0; k < _enemies.length; k++){
      _enemies[k].draw();
    }
    __player.draw();
  }

  function animate(){
    requestAnimationFrame(animate);
    var now = performance.now();
    var delta = Math.min((now - (_lastframe || now)) / 1000, 0.035);
    _lastframe = now;
    if (mode === "running"){
      update(delta);
    }
    render();
  }

  updateHud();
  setMode("menu");
  animate();
  };
