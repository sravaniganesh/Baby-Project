const mongoose = require("mongoose");

/* ===============================
   💬 MESSAGE SCHEMA
=============================== */
const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "doctor"],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/* ===============================
   🚀 CHAT SESSION MODEL
=============================== */
const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    messages: [messageSchema],

    /* ===============================
       📊 SESSION STATE
    =============================== */

    // requested → accepted → active → paused → ended
    status: {
      type: String,
      enum: ["requested", "accepted", "active", "paused", "ended"],
      default: "requested",
    },

    /* ===============================
       ⏱️ SESSION TIME
    =============================== */

    // total duration in seconds
    sessionDuration: {
      type: Number,
      default: 0,
    },

    // remaining time in seconds
    remainingTime: {
      type: Number,
      default: 0,
    },

    /* ===============================
       👥 PRESENCE TRACKING
    =============================== */

    isDoctorInChat: {
      type: Boolean,
      default: false,
    },

    isUserInChat: {
      type: Boolean,
      default: false,
    },

    /* ===============================
       ⏸️ PAUSE CONTROL
    =============================== */

    lastPausedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);