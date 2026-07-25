const mongoose = require("mongoose");

const userPremiumSchema = new mongoose.Schema(
  {
    /* =========================
       USER
    ========================== */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* =========================
       OPTIONAL DOCTOR (for doctor-specific premium)
    ========================== */
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
      index: true,
    },

    /* =========================
       PLAN DETAILS
    ========================== */
    planType: {
      type: String,
      enum: ["MONTHLY", "QUARTERLY", "YEARLY"],
      required: true,
    },

    amountPaid: {
      type: Number,
      required: true,
    },

    /* =========================
       DURATION
    ========================== */
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    /* =========================
       STATUS
    ========================== */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
    },

    /* =========================
       PAYMENT INFO
    ========================== */
    paymentMode: {
      type: String,
      enum: ["ONLINE", "FREE", "ADMIN"],
      default: "ONLINE",
    },

    paymentStatus: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING"],
      default: "SUCCESS",
    },

    paymentRef: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

/* =========================
   AUTO EXPIRE HELPER (OPTIONAL USE)
========================== */
userPremiumSchema.methods.isExpired = function () {
  return new Date() > this.endDate;
};

module.exports =
  mongoose.models.UserPremium || mongoose.model("UserPremium", userPremiumSchema);