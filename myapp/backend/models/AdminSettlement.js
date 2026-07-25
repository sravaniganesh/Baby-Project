const mongoose = require("mongoose");

const adminSettlementSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },

    orderItemIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],

    totalSellerEarning: {
      type: Number,
      required: true,
    },

    totalPlatformFee: {
      type: Number,
      required: true,
    },

    settlementAmount: {
      type: Number,
      required: true, // amount paid to seller
    },

    paymentMode: {
      type: String,
      enum: ["BANK_TRANSFER", "UPI", "MANUAL"],
      default: "BANK_TRANSFER",
    },

    transactionRef: {
      type: String,
      default: "",
    },

    settledByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    settledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminSettlement", adminSettlementSchema);
