const mongoose = require("mongoose");

const womenStageMessageSchema = new mongoose.Schema(
  {
    stageKey: {
      type: String,
      required: true,
      index: true, // 🔥 fast room queries
    },

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
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model(
  "WomenStageMessage",
  womenStageMessageSchema
);
