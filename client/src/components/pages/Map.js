import React, { Component } from "react";
import { get,post } from "../../utilities";
import { socket } from "../../client-socket.js";

import "../../utilities.css";
import "./Map.css";
import map_img from "../../images/emonation-quality.png"
import GoogleLogin, { GoogleLogout } from "react-google-login";

const GOOGLE_CLIENT_ID = "1093231761662-gf35mnpc3a1aahb99ps4f8a4gcb6ecb5.apps.googleusercontent.com";


//TODO: REPLACE WITH YOUR OWN CLIENT_ID

class Skeleton extends Component {
  constructor(props) {
    super(props);
    // Initialize Default State
    this.state = {
      placeing_marker: false,
      entities: [],
      camera: {x:0, y:0},
      scale_factor: .5,
    };
  }


  make_marker = (x,y,color, text) => {

    let entity = {
      x:x,
      y:y,
      mouseOver:false,
      color: color,
      bottom_y: y,
      text: text,


      update: function(ctx, mousePos, camera, scale_factor) {
        if(Math.sqrt(Math.pow(mousePos.y - (this.y*scale_factor+camera.y - 10),2) +  Math.pow(mousePos.x - (this.x*scale_factor+camera.x),2)) < 20 ) {
          this.mouseOver = true;
        } else {
          this.mouseOver = false;
        }
      },

      LightenDarkenColor:function (col,amt) {
        var usePound = false;
        if ( col[0] == "#" ) {
            col = col.slice(1);
            usePound = true;
        }

        var num = parseInt(col,16);

        var r = (num >> 16) + amt;

        if ( r > 255 ) r = 255;
        else if  (r < 0) r = 0;

        var b = ((num >> 8) & 0x00FF) + amt;

        if ( b > 255 ) b = 255;
        else if  (b < 0) b = 0;

        var g = (num & 0x0000FF) + amt;

        if ( g > 255 ) g = 255;
        else if  ( g < 0 ) g = 0;

        return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
    },

      draw: function(ctx, camera, scale_factor) {
        /*ctx.fillStyle = "black";
        ctx.fillRect((this.x*scale_factor+camera.x),(this.y*scale_factor+camera.y),3,30);
        ctx.fillStyle = this.drawcolor;
        ctx.fillRect((this.x*scale_factor+camera.x), (this.y*scale_factor+camera.y),ctx.measureText(this.text).width+4,16);
        ctx.fillStyle = "black";
        ctx.fillText(this.text, this.x*scale_factor+2+camera.x, this.y*scale_factor+12+camera.y);
        this.bottom_y = this.y + 10;*/

        ctx.save();

        ctx.translate(this.x*scale_factor+camera.x, this.y*scale_factor+camera.y);

        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.bezierCurveTo(2,-10,-20,-25,0,-30);
        ctx.bezierCurveTo(20,-25,-2,-10,0,0);
        ctx.fillStyle=this.color;
        ctx.fill();
        ctx.strokeStyle=this.LightenDarkenColor(this.color,40);
        ctx.lineWidth=4;
        ctx.stroke();
        //ctx.beginPath();
        //ctx.arc(0,-21,3,0,Math.PI*2);
        //ctx.closePath();
        ctx.fill();

        ctx.font = '15px Sans-serif';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeText(this.text, -ctx.measureText(this.text).width/2, -15);
        ctx.fillStyle = 'white';
        ctx.fillText(this.text, -ctx.measureText(this.text).width/2, -15);
        ctx.fillStyle="black";

        ctx.restore();
      }

    }

    return entity;
  }

  place_marker = () => {
    this.state.placeing_marker = true;
  }

  zoom_in = () => {
    if(this.state.scale_factor < 2.2 ) {
      this.setState({scale_factor: this.state.scale_factor + .1});
    }
  }

  zoom_out = () => {
    if(this.state.scale_factor > .4) {
      this.setState({scale_factor: this.state.scale_factor - .1});
    }
    console.log(this.state.scale_factor);
  }

  update = (ctx, mousePos) => {
    for(var i = 0; i < this.state.entities.length; i++) {
      this.state.entities[i].update(ctx, mousePos, this.state.camera, this.state.scale_factor);
    }
  }

  draw = (canvas, ctx, mousePos) => {
    //ctx.fillStyle = "#f7f5eb";
    ctx.fillStyle = "#e8e8e8";
    ctx.fillRect(0,0,canvas.width, canvas.height);
    var map_img = this.refs.image;
    ctx.drawImage(map_img, this.state.camera.x,this.state.camera.y, map_img.width*(this.state.scale_factor), map_img.height*(this.state.scale_factor));

    if(this.state.placeing_marker) {
      ctx.save();

      ctx.translate(mousePos.x, mousePos.y);

      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.bezierCurveTo(2,-10,-20,-25,0,-30);
      ctx.bezierCurveTo(20,-25,-2,-10,0,0);
      ctx.fillStyle="rgba(0.5,0.5,0.5,0.5)";
      ctx.fill();

      ctx.restore();
    }

    var renderorder = [...this.state.entities];
    renderorder.sort(function(a,b){return a.bottom_y-b.bottom_y;})
    for(var i = 0; i < renderorder.length; i++) {
      renderorder[i].draw(ctx, this.state.camera, this.state.scale_factor);
    }
  }

  componentDidMount() {

    socket.on("update-markers", (result) => {
      console.log(result);
      let output = [];
      for(let i = 0; i < result.length; i++) {
        output.push(this.make_marker(result[i].x_pos, result[i].y_pos, "#E86F55", result[i].name.split(" ")[0]));
      }
      console.log(output);
      this.setState({
        entities: output,
      });
    });

    get("/api/markers").then((result) => {
      console.log(result);
      let output = [];
      for(let i = 0; i < result.length; i++) {
        output.push(this.make_marker(result[i].x_pos, result[i].y_pos, "#E86F55", result[i].name.split(" ")[0]));
      }
      console.log(output);
      this.setState({
        entities: output,
      });
    });

    var mousePos = {x:0,y:0};
    var mouseDown = false;

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


    const canvas = this.refs.canvas
    const ctx = canvas.getContext("2d")

    ctx.imageSmoothingQuality = "high"

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.addEventListener('mousemove', evt => {
      mousePos = getMousePos(canvas,evt);

      if(mouseDown) {
        console.log("move");
        this.setState({camera:
        {
          x: this.state.camera.x + (mousePos.x- drag.x),
          y: this.state.camera.y + (mousePos.y - drag.y),
        }});
        drag.x = mousePos.x;
        drag.y = mousePos.y;
      }
    });

    canvas.addEventListener('touchmove', evt => {
      mousePos = getMousePos(canvas,evt.touches[0]);

      console.log("move");
      this.setState({camera:
      {
        x: this.state.camera.x + (mousePos.x- drag.x),
        y: this.state.camera.y + (mousePos.y - drag.y),
      }});
      drag.x = mousePos.x;
      drag.y = mousePos.y;

    });

    window.addEventListener("resize", function(evt) {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    canvas.addEventListener('mousedown', evt => {
      drag.x = mousePos.x;
      drag.y = mousePos.y;
      mouseDown = true;

      if(this.state.placeing_marker) {
        let post_body = {
          x: (mousePos.x-this.state.camera.x)/this.state.scale_factor,
          y: (mousePos.y-this.state.camera.y)/this.state.scale_factor,
        }

        window.navigator.vibrate(200);

        post("/api/marker", post_body).then((result) => {
          console.log("posted direction");
        });

        this.state.entities.push(this.make_marker((mousePos.x-this.state.camera.x)/this.state.scale_factor, (mousePos.y-this.state.camera.y)/this.state.scale_factor, "rgba(0, 0, 0, 0.5)", "         "));
        this.setState({placeing_marker : false});
      }
    });

    canvas.addEventListener('touchstart', evt => {
      mousePos = getMousePos(canvas,evt.touches[0]);
      drag.x = mousePos.x;
      drag.y = mousePos.y;
      mouseDown = true;

      if(this.state.placeing_marker) {
        let post_body = {
          x: mousePos.x-this.state.camera.x,
          y: mousePos.y-this.state.camera.y,
        }

        post("/api/marker", post_body).then((result) => {
          console.log("posted direction");
        });

        this.state.entities.push(this.make_marker(mousePos.x-this.state.camera.x, mousePos.y-this.state.camera.y, "rgba(0, 0, 0, 0.5)", "         "));
        this.setState({placeing_marker : false});
      }
    });

    document.addEventListener('mouseup', function(evt) {
      mouseDown = false;
    });

    document.addEventListener('touchend', function(evt) {
      mouseDown = false;
    });

    setInterval(() => {
      this.draw(canvas, ctx, mousePos);
      this.update(ctx, mousePos);
    }, 1000 / 60);
  }

  render() {
    return (
      <>
      <div>
        <canvas ref="canvas"/>
        <div className = "over">
          <div className = "topbar">
            <h1> Emo(na)tion </h1>
            <p> Where are you feeling? </p>
          </div>
          <div className = "content">
            {this.props.userId ? (
              <>
              <div className = "login">
                <GoogleLogout
                  clientId={GOOGLE_CLIENT_ID}
                  buttonText="Logout"
                  onLogoutSuccess={this.props.handleLogout}
                  onFailure={(err) => console.log(err)}
                />
              </div>
              <button onClick = {this.place_marker}>Place Marker</button>
              </>
            ) : (
              <div className = "login">
              <GoogleLogin
                clientId={GOOGLE_CLIENT_ID}
                buttonText="Login"
                onSuccess={this.props.handleLogin}
                onFailure={(err) => console.log(err)}
              />
              </div>
            )}
            <div className = "zoom"> <button onClick = {this.zoom_in}> + </button><button onClick = {this.zoom_out}>-</button></div>
          </div>
        </div>
        <img ref="image" src={map_img} className="hidden"/>
      </div>
      </>
    );
  }
}

export default Skeleton;
