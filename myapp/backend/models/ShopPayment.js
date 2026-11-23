
const mongoose = require("mongoose");

const shopPaymentSchema = new mongoose.Schema(
  {
    // Customer who initiated the payment
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Shopping order linked to this payment attempt
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopOrder",
      required: true,
      index: true,
    },

    // Amount calculated and validated by the backend
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      enum: ["INR"],
    },

    // Each retry gets its own payment attempt
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    // Development simulator only for the initial implementation
    method: {
      type: String,
      enum: ["SIMULATOR"],
      default: "SIMULATOR",
    },

    // Backend-generated reference for tracking this attempt
    transactionReference: {
      type: String,
      required: true,
      unique: true,
    },

    failureReason: {
      type: String,
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Useful for finding a customer's payment attempts for an order
shopPaymentSchema.index({ userId: 1, orderId: 1, createdAt: -1 });

module.exports = mongoose.model("ShopPayment", shopPaymentSchema);
