import React, { Component } from "react";
import { get,post } from "../../utilities";
import { socket } from "../../client-socket.js";

import "../../utilities.css";
import "./Map.css";
import map_img from "../../images/mapcopy.png"
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
    };
  }

  make_marker = (x,y,color, text) => {

    let entity = {
      x:x,
      y:y,
      drawcolor:color,
      color: color,
      bottom_y: y,
      text: text,

      update: function(ctx, mousePos, camera) {
        if(mousePos.y > this.y+camera.y && mousePos.y < this.y+camera.y + 16 && mousePos.x > this.x+camera.x && mousePos.x < this.x+camera.x + ctx.measureText(this.text).width+4) {
          this.drawcolor = "red";
        } else {
          this.drawcolor = this.color;
        }
      },

      draw: function(ctx, camera) {
        ctx.fillStyle = "black";
        ctx.fillRect(this.x+camera.x,this.y+camera.y,3,30);
        ctx.fillStyle = this.drawcolor;
        ctx.fillRect(this.x+camera.x,this.y+camera.y,ctx.measureText(this.text).width+4,16);
        ctx.fillStyle = "black";
        ctx.fillText(this.text, this.x+2+camera.x, this.y+12+camera.y);
        this.bottom_y = this.y + 10;
      }

    }

    return entity;
  }

  place_marker = () => {
    this.state.placeing_marker = true;
  }

  update = (ctx, mousePos) => {
    for(var i = 0; i < this.state.entities.length; i++) {
      this.state.entities[i].update(ctx, mousePos, this.state.camera);
    }
  }

  draw = (canvas, ctx, mousePos) => {
    ctx.fillStyle = "#f7f5eb";
    ctx.fillRect(0,0,canvas.width, canvas.height);
    var map_img = this.refs.image;
    ctx.drawImage(map_img, this.state.camera.x,this.state.camera.y);

    if(this.state.placeing_marker) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(mousePos.x,mousePos.y,3,30);
      ctx.fillRect(mousePos.x,mousePos.y,ctx.measureText("         ").width+4,16);
      this.bottom_y = this.y + 10;
    }

    var renderorder = [...this.state.entities];
    renderorder.sort(function(a,b){return a.bottom_y-b.bottom_y;})
    for(var i = 0; i < renderorder.length; i++) {
      renderorder[i].draw(ctx, this.state.camera);
    }
  }

  componentDidMount() {

    socket.on("update-markers", (result) => {
      console.log(result);
      let output = [];
      for(let i = 0; i < result.length; i++) {
        output.push(this.make_marker(result[i].x_pos, result[i].y_pos, "lightblue", result[i].name.split(" ")[0]));
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
        output.push(this.make_marker(result[i].x_pos, result[i].y_pos, "lightblue", result[i].name.split(" ")[0]));
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
        <div className = "brand">
          <h1> Emo(na)tion </h1>
          <p> Where are you feeling? </p>
        </div>
        <canvas ref="canvas"/>
        <div className = "over">
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
        </div>
        <img ref="image" src={map_img} className="hidden"/>
      </div>
      </>
    );
  }
}

export default Skeleton;
