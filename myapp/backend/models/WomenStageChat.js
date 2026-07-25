const mongoose = require("mongoose");

/**
 * Women Stage-based Community Chat
 * --------------------------------
 * One document per stage (room)
 * Example stages:
 * - teen
 * - married
 * - pregnant_trimester_1
 * - post_pregnancy_3_6_months
 */

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  text: {
    type: String,
    required: true,
    trim: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const womenStageChatSchema = new mongoose.Schema(
  {
    stageKey: {
      type: String,
      required: true,
      unique: true, // 🔥 one chat per stage
      index: true,
    },

    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "WomenStageChat",
  womenStageChatSchema
);
