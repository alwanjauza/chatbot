const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema({
  name: {
    type: String,
  },
});

module.exports = mongoose.model("Category", categorySchema);
