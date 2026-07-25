const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    /* ===============================
       👤 USER
    =============================== */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ===============================
       🔗 LINKED ENTITIES
    =============================== */

    // doctor reference (for chat/video)
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },

    // chat reference (important for extend)
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },

    /* ===============================
       💳 PAYMENT TYPE
    =============================== */

    type: {
      type: String,
      enum: ["chat", "video", "wallet", "order"],
      required: true,
    },

    /* ===============================
       💰 AMOUNT
    =============================== */

    amount: {
      type: Number,
      required: true,
    },

    /* ===============================
       📊 STATUS
    =============================== */

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    method: {
      type: String,
      enum: ["online", "wallet"],
      default: "online",
    },

    /* ===============================
       🔁 SESSION SUPPORT
    =============================== */

    isUsed: {
      type: Boolean,
      default: false, // used for chat session
    },

    isExtended: {
      type: Boolean,
      default: false, // if extend payment
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);