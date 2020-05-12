
var canvas;
var ctx;
var canvasWidth;
var canvasHeight;
var mousePos = {x:0,y:0};
var mouseDown = false;
var map_img;

var placeing_marker = false;

var drag = {
  x: 0,
  y: 0,
}

var paths = [];

var camera = {
  x: 0,
  y: 0,
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x:Math.round(evt.clientX - rect.left),
    y:Math.round(evt.clientY - rect.top)
  }
}

var mouseDown = false;
var lastMousePos = null;

var entities = [];

function loadImage(url) {
  return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}


async function play() {

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext("2d");

  map_img = await loadImage("mapcopy.png");

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  canvasWidth = canvas.width;
  canvasHeight = canvas.height;

  ctx.fillStyle = "white";
  ctx.fillRect(0,0,canvasWidth,canvasHeight);

  canvas.addEventListener('mousemove', function(evt) {
    mousePos = getMousePos(canvas,evt);

    if(mouseDown) {
      camera.x += mousePos.x- drag.x;
      camera.y += mousePos.y - drag.y;
      drag.x = mousePos.x;
      drag.y = mousePos.y;
    }
  });

  window.addEventListener("resize", function(evt) {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
  });

  canvas.addEventListener('mousedown', function(evt) {
    drag.x = mousePos.x;
    drag.y = mousePos.y;
    mouseDown = true;

    if(placeing_marker) {
      entities.push(Marker(mousePos.x-camera.x, mousePos.y-camera.y, "#FF866C", "Anna"));
      placeing_marker = false;
    }
  });

  document.addEventListener('mouseup', function(evt) {
    mouseDown = false;
  });


  var FPS = 30;
  setInterval(function() {
    update();
    draw();
  }, 1000/FPS);

}

function draw() {
  ctx.fillStyle = "#f7f5eb";
  ctx.fillRect(0,0,canvasWidth, canvasHeight)
  ctx.drawImage(map_img, camera.x,camera.y);

  if(placeing_marker) {
    ctx.fillStyle = "black";
    ctx.fillRect(mousePos.x,mousePos.y,3,30);
    ctx.fillStyle = "#FF866C";
    ctx.fillRect(mousePos.x,mousePos.y,ctx.measureText("Anna").width+4,16);
    ctx.fillStyle = "black";
    ctx.fillText("Anna", mousePos.x+2, mousePos.y+12);
    this.bottom_y = this.y + 10;
  }

  renderorder = [...entities];
  renderorder.sort(function(a,b){return a.bottom_y-b.bottom_y;})
  for(var i = 0; i < renderorder.length; i++) {
    renderorder[i].draw();
  }
}

function place_marker() {
  placeing_marker = true;
}

function update() {
  for(var i = 0; i < entities.length; i++) {
    entities[i].update();
  }
}
