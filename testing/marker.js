function Marker(x,y,color, text) {

  let entity = {
    x:x,
    y:y,
    color: color,
    bottom_y: y,
    text: text,

    update: function() {
    },

    draw: function() {
      ctx.fillStyle = "black";
      ctx.fillRect(this.x+camera.x,this.y+camera.y,3,30);
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x+camera.x,this.y+camera.y,ctx.measureText(this.text).width+4,16);
      ctx.fillStyle = "black";
      ctx.fillText(this.text, this.x+2+camera.x, this.y+12+camera.y);
      this.bottom_y = this.y + 10;
    }

  }

  return entity;
}
