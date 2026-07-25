const mongoose = require("mongoose");

const sellerEarningSchema = new mongoose.Schema(
  {
    /* ===============================
       REFERENCES
    =============================== */

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopOrder",
      required: true,
    },

    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    /* ===============================
       PAYMENT INFO
    =============================== */

    paymentMode: {
      type: String,
      enum: ["ONLINE", "COD"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "COLLECTED", "SETTLED"],
      default: "PENDING",
    },

    /* ===============================
       AMOUNTS
    =============================== */

    itemPrice: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    grossAmount: {
      type: Number,
      required: true,
    },

    platformCommission: {
      type: Number,
      default: 0,
    },

    gstOnCommission: {
      type: Number,
      default: 0,
    },

    sellerNetAmount: {
      type: Number,
      required: true,
    },

    /* ===============================
       EARNING STATUS
    =============================== */

    earningStatus: {
      type: String,
      enum: ["PENDING", "AVAILABLE", "PAID", "CANCELLED"],
      default: "PENDING",
    },

    isPaidToSeller: {
      type: Boolean,
      default: false,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    /* ===============================
       RETURN / REFUND IMPACT
    =============================== */

    isRefunded: {
      type: Boolean,
      default: false,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SellerEarning", sellerEarningSchema);
