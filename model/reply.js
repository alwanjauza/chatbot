const mongoose = require("mongoose");
const { Schema } = mongoose;

const replySchema = new Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  reply: {
    type: String,
  },
  chat: {
    type: String,
  },
});

module.exports = mongoose.model("Reply", replySchema);