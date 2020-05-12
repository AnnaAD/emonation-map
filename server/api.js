/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");

// import models so we can interact with the database
const User = require("./models/user");

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socket = require("./server-socket");

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // not logged in
    return res.send({});
  }

  res.send(req.user);
});

router.post("/initsocket", (req, res) => {
  // do nothing if user not logged in
  if (req.user) socket.addUser(req.user, socket.getSocketFromSocketID(req.body.socketid));
  res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

router.get("/markers", (req,res) => {
  User.find({ last_placed: {
            $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000)
        }}).then((markers) => {
    res.send(markers);
  });
});

router.post("/marker", (req,res) => {
  User.findById(req.user._id).then((user) => {
    user.x_pos = req.body.x;
    user.y_pos = req.body.y;
    user.last_placed = new Date();
    user.save().then(() => {
      User.find({ last_placed: {$gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000)}}).then((markers) => {
        console.log("updates");
        socket.getIo().emit("update-markers", markers);
        res.send({});
      });
    });
  });
});


// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
