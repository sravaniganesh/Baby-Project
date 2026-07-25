const mongoose = require("mongoose");

const privateMessageSchema = new mongoose.Schema(
  {
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
    timestamps: true,
  }
);

const privateChatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // 🔐 Stage restriction safety
    stageKey: {
      type: String,
      required: true,
      index: true,
    },

    messages: [privateMessageSchema],

    lastMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only 2 participants
privateChatSchema.pre("save", function (next) {
  if (this.participants.length !== 2) {
    next(new Error("Private chat must have exactly 2 participants"));
  }
  next();
});

module.exports = mongoose.model("PrivateChat", privateChatSchema);
