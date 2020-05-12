const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  googleid: String,
  x_pos: Number,
  y_pos: Number,
  last_placed: Date
});

// compile model from schema
module.exports = mongoose.model("user", UserSchema);
