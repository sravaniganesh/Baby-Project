const mongoose = require("mongoose");

const doctorEarningSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    /* ===============================
       SOURCE OF EARNING
    =============================== */
    sourceType: {
      type: String,
      enum: ["PREMIUM_CHAT"],
      required: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      // e.g. UserPremium._id or Chat._id (future-safe)
    },

    /* ===============================
       AMOUNTS
    =============================== */
    grossAmount: {
      type: Number,
      required: true,
    },

    platformFee: {
      type: Number,
      required: true,
    },

    netAmount: {
      type: Number,
      required: true,
    },

    /* ===============================
       SETTLEMENT STATUS
    =============================== */
    isSettled: {
      type: Boolean,
      default: false,
    },

    settledAt: {
      type: Date,
      default: null,
    },

    settlementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminSettlement",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorEarning", doctorEarningSchema);
