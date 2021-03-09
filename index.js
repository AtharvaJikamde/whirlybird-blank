document.body.style = "margin: 0px;";
(function anonymous() {
  const canvas = document.createElement("canvas");
  const game = document.createElement("div");
  const context = canvas.getContext("2d");
  const obstacleWidth = 65;
  const obstacleTypes = [null, "bounce", "break", "megaBounce", "copter"];

  canvas.width = document.documentElement.clientWidth;
  canvas.height = document.documentElement.clientHeight;
  canvas.style = "position: absolute;";

  window.addEventListener("resize", function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    onResize();
  }, false);

  function Point2D(x, y) {
    this.x = x;
    this.y = y;
  }
  function RectDimentions(x, y, width, height) {
    Point2D.call(this, x, y);
    this.width = width;
    this.height = height;
    this.halfWidth = this.width * 0.5;
    this.halfHeight = this.height * 0.5;
  }
  function Rect(x, y, width, height, color, velocity) {
    RectDimentions.call(this, x, y, width, height);
    this.color = color;
    this.velocity = velocity || new Point2D(0, 0);
    this.defined = { x: x, y: y };
    this.accelerationGravity = 0.2;
    this.fly = false;
    this.context = null;
    this.url = null;
    this.type = "Rect";
  }
  function Obstacle(x, y, width, height, type) {
    RectDimentions.call(this, x, y, width, height);
    this.type = type;
    this.velocity = new Point2D(0, 0);
    this.body = null;
    if (this.type === "bounce" || this.type === "break") {
      this.body = new Rect(
        this.x,
        this.y,
        this.width,
        this.height,
        "white"
      );
    } else if (this.type === "megaBounce") {
      this.body = [
        new Rect(
          this.x,
          this.y - this.height,
          this.width,
          this.height * 0.5,
          "white"
        ),
        new Rect(
          this.x,
          this.y + this.height,
          this.width,
          this.height * 0.5,
          "white"
        )
      ];
    } else if (this.type === "copter") {
      this.body = [
        new Rect(
          this.x,
          this.y,
          this.width,
          this.height,
          "white"
        ),
        new Rect(
          this.x,
          this.y - 10,
          15,
          15,
          "yellow"
        )
      ];
    }
    if (this.type === "break") this.body.color = "grey";
  }
  Rect.prototype = {
    draw: function() {
      this.halfWidth = this.width * 0.5;
      this.halfHeight = this.height * 0.5;
      context.fillStyle = this.color;
      context.fillRect(
        this.x - this.halfWidth,
        this.y - this.halfHeight,
        this.width,
        this.height
      );
    },
    isTouchingPoint: function(point) {
      let crash = false;
      if (
        point.x >= this.x - this.halfWidth &&
        point.x <= this.x + this.halfWidth &&
        point.y >= this.y - this.halfHeight &&
        point.y <= this.y + this.halfHeight
      )
        crash = true;
      return crash;
    },
    isTouching: function(rect, addPoint) {
      let crash = false;
      let point = addPoint || new Point2D(0, 0);
      if (
        this.x + this.halfWidth + point.x >=
        rect.x - rect.halfWidth &&
        this.x - this.halfWidth - point.x <=
        rect.x + rect.halfWidth &&
        this.y + this.halfHeight + point.y >=
        rect.y - rect.halfHeight &&
        this.y - this.halfHeight - point.y <=
        rect.y + rect.halfHeight
      )
        crash = true;
      return crash;
    },
    move: function() {
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    },
    gravity: function() {
      this.velocity.y += this.accelerationGravity;
    },
    crashed: function(obstacle, playFrame) {
      let crash = false;
      flyTime = 2000;
      if (
        this.isTouching(
          obstacle,
          new Point2D(0, this.velocity.y)
        ) &&
        this.velocity.y >= 2 &&
        !this.fly
      ) {
        if (
          obstacle.type === "bounce" ||
          obstacle.type === "break" ||
          obstacle.type === "copter"
        ) {
          this.velocity.y = -this.velocity.y * 1.1;
          if (obstacle.type === "copter") flyTime = 5000;
        } else if (obstacle.type === "megaBounce")
          this.velocity.y = -this.velocity.y * 2;
        crash = true;
      } else if (this.y - this.height * 3 < canvas.height) {
        this.accelerationGravity = 0.01;
        this.gravity();
      }

      if (this.fly) {
        this.velocity.y = 0;
        obstacle.velocity.y = 10;
        score += 1;
      } else obstacle.velocity.y = 0;
      return crash;
    },
    player: function(gameState, btn) {
      if (gameState === "start") {
        if (this.isTouching(btn, new Point2D(0, this.velocity.y)))
          this.velocity.y = -this.velocity.y;
        else this.gravity();
      } else if (gameState === "play") {
        if (this.y < mid.y) this.fly = true;
        else this.fly = false;
      }
      if (interact.x !== undefined) this.x = interact.x;
      this.move();
      this.draw();
    },
    useImage: function(imageUrlOrContext) {
      if (typeof imageUrlOrContext === "object") {
        this.context = imageUrlOrContext;
        this.url = this.context.src;
      } else {
        this.context = new Image(0, 0);
        this.url = this.context.src;
        game.appendChild(this.context);
      }
      this.type = "Image";
    }
  };
  Obstacle.prototype = {
    moveData: Rect.prototype.move,
    render: function() {
      this.moveData();
      if (this.type === "bounce" || this.type === "break") {
        this.body.x = this.x;
        this.body.y = this.y;
        this.body.draw();
      } else if (this.type === "megaBounce" || this.type === "copter") {
        for (var index = 0; index < this.body.length; index++)
          this.body[index].draw();
      }
      if (this.type === "megaBounce") {
        this.body[0].y = this.y - this.height;
        this.body[1].y = this.y + this.height;
      }
      if (this.type === "copter") {
        this.body[0].y = this.y;
        this.body[1].y = this.y - 10;
      }
    }
  };
  Point2D.prototype.setXY = function(x, y) {
    this.x = x;
    this.y = y;
  }
  const mid = new Point2D();
  const interact = new Point2D();
  const interactEvents = function(event) {
    if (event.isTrusted) {
      if (
        event.type === "mouseover" || 
        event.type === "mousemove"
      )
        interact.setXY(event.pageX, event.pageY);
      else if (
        event.type === "touchstart" || 
        event.type === "touchmove"
      )
        interact.setXY(
          event.touches[0].pageX, 
          event.touches[0].pageY
        );
      else interact.setXY();
    }
  }
  window.addEventListener("mouseover", interactEvents, false);
  window.addEventListener("mousemove", interactEvents, false);
  window.addEventListener("mouseout", interactEvents, false);
  window.addEventListener("touchmove", interactEvents, true);
  window.addEventListener("touchstart", interactEvents, true);
  window.addEventListener("touchend", interactEvents, true);
  window.addEventListener(
    "click", 
    function(event) {
      if (
        event.isTrusted &&
        btn.isTouchingPoint(new Point2D(event.pageX, event.pageY))
      ) {
        if (gameState === "start") {
          player.velocity.y = 0;
          gameState = "play";
          player.y = player.defined.y;
        } else {
          obstacles = [];
          initial.y = canvas.height;
          player.y = player.defined.y;
          for (var index = 0; index < 20; index++) {
            generateObstacles(randomIntFromRange(1, 4));
            initial.y -= randomIntFromRange(100, 200);
          }
          gameState = "play";
          score = 0;
        }
      }
    },
    false
  );
  let btn, player, obstacles;
  let gameState = "start";
  let flyTime;
  let frame, playFrame;
  let initial, update;
  let score = 0;
  flyTime = 2000;
  frame = 0;
  playFrame = 0;
  initial = new Point2D(
    randomIntFromRange(obstacleWidth, canvas.width - obstacleWidth),
    canvas.height
  );
  obstacles = [];
  update = new Point2D(0, -50);
  function onResize() {
    const btnHeight = 50;
    mid.setXY(canvas.width * 0.5, canvas.height * 0.5);
    btn = new Rect(
      mid.x, 
      mid.y * 2 - btnHeight * 0.5, 
      mid.x * 2, btnHeight,
      "grey"
    );
    player = new Rect(
      mid.x,
      mid.y,
      20,
      20,
      "red"
    );
    btn.textColor = "black";
    for (var index = 0; index < 20; index++) {
      generateObstacles(randomIntFromRange(1, 4));
      initial.y -= randomIntFromRange(100, 200);
    }
  }
  function toNumber(string) {
    return string - 0;
  }
  function randomIntFromRange(min, max) {
    return Math.ceil(Math.random() * (max - min) + min);
  };
  const generateObstacles = function(number) {
    let width = 65;
    if (initial.x <= mid.x) update.x = width;
    else update.x = -width;
    for (var index = 0; index < number; index++) {
      if (initial.x - width <= 0) update.x = width;
      else if (initial.x + width >= canvas.width) 
        update.x = -width;
      initial.x += update.x;
      initial.y += update.y;
      obstacles.push(
        new Obstacle(
          initial.x,
          initial.y,
          width,
          5,
          obstacleTypes[randomIntFromRange(0, obstacleTypes.length - 1)]
        )
      );
    }
  };
  function setCookie(name, value, setValueAnyway) {
    let cookie = name + "=" + value + ";";
    document.cookie += cookie;
    if (window.localStorage.getItem(name) !== null && !setValueAnyway) {

    }
    if (window.localStorage.getItem(name) !== null && setValueAnyway)
      window.localStorage[name] = value;
    else window.localStorage.setItem(name, value);
    return [cookie, document.cookie];
  }
  function getCookie(name) {
    let value = window.localStorage.getItem(name);
    let eachCookie = document.cookie.split(";");
    let result = "";
    for (var index = 0; index < eachCookie.length; index++) {
      const cookie = eachCookie[index];
      if (cookie.indexOf(name + "="))
        result = cookie;
    }
    return [value, result];
  }
  function drawText(x, y, text, size, fontFace, color) {
    context.fillStyle = color;
    context.font = size + "px " + fontFace;
    context.fillText(text, x, y);
  }
  const render = function() {
    window.requestAnimationFrame(render);
    frame += 1;
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (gameState === "start") {
      drawText(
        mid.x - 60, 
        mid.y - 30, 
        "Move your cursor", 
        30, 
        "Arial", 
        "yellow"
      );
      btn.color = "grey";
      btn.textColor = "white";
      if (btn.isTouchingPoint(interact)) btn.color = "black";
      else btn.textColor = "black";
      btn.draw();
      drawText(
        mid.x - 25, 
        mid.y * 2 - 25, 
        "Start", 
        25, 
        "Arial", 
        btn.textColor
      );
    } else if (gameState === "play") {
      playFrame += 1;
      for (var index = 0; index < obstacles.length; index++) {
        const obstacle = obstacles[index];
        obstacle.render();
        if (obstacle.y + obstacle.height >= canvas.height)
          obstacles.splice(obstacle, 1);
        player.crashed(obstacle, playFrame);
      }
    } else if (gameState === "end") {
      btn.color = "grey";
      btn.y = mid.y;
      btn.color = "grey";
      btn.textColor = "yellow";
      if (btn.isTouchingPoint(interact)) btn.color = "black";
      else btn.textColor = "black";
      btn.width = 200;
      btn.height = 50;
      btn.draw();
      drawText(
        mid.x - 60, 
        mid.y, 
        "Game over", 
        30, 
        "Comic Sans MS", 
        btn.textColor
      );
    }
    player.player(gameState, btn);
    if (player.y - player.height * 3 >= canvas.height) gameState = "end";
    drawText(0, 30, "Score: " + score, 30, "Arial", "yellow");
  };
  onResize();
  render();
  window.setInterval(
    function() {
      if (player.fly) {
        player.y = mid.y;
      }
      if (obstacles[obstacles.length - 1].y > -1) {
        initial.y = canvas.height;
        for (var index = 0; index < 20; index++) {
          generateObstacles(randomIntFromRange(1, 4));
          initial.y -= randomIntFromRange(100, 200);
        }
      }
    },
    flyTime
  );

  game.insertBefore(canvas, game.childNodes[0]);
  document.body.insertBefore(game, document.body.childNodes[0]);
}).call(window);