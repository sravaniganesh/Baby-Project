const mongoose = require("mongoose");

const adminPremiumLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null, // optional (group plans / global premium)
    },

    premiumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserPremium",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["ONLINE", "UPI", "CARD", "COD"],
      default: "ONLINE",
    },

    description: {
      type: String,
      default: "User premium purchase",
    },

    /* ======================
       GST BREAKUP (18%)
    ====================== */
    gst: {
      gstType: {
        type: String,
        enum: ["CGST_SGST", "IGST"],
      },
      cgst: {
        type: Number,
        default: 0,
      },
      sgst: {
        type: Number,
        default: 0,
      },
      igst: {
        type: Number,
        default: 0,
      },
      totalGST: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "AdminPremiumLedger",
  adminPremiumLedgerSchema
);
