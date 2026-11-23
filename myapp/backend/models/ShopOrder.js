
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  cartItemId: {
  type: mongoose.Schema.Types.ObjectId,
  default: null,
},
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShopProduct",
    required: true,
  },

  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
  },

  title: String,
  price: Number,
  quantity: Number,

  status: {
    type: String,
    enum: [
      "PENDING_PAYMENT",
      "PLACED",
      "ACCEPTED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ],
    default: "PLACED",
  },

  /* ===============================
     🧾 INVOICE DATA
  =============================== */

  invoiceNumber: {
    type: String,
    default: null,
  },

  invoiceDate: {
    type: Date,
    default: null,
  },

  isInvoiceGenerated: {
    type: Boolean,
    default: false,
  },

  taxAmount: {
    type: Number,
    default: 0,
  },

  totalAmount: {
    type: Number,
    default: 0,
  },

  /* ===============================
     💰 EARNINGS DATA
  =============================== */

  platformFee: {
    type: Number,
    default: 0,
  },

  sellerEarning: {
    type: Number,
    default: 0,
  },

  earningCreatedAt: {
    type: Date,
    default: null,
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
     🔁 RETURN / REFUND DATA
  =============================== */

  returnRequestedAt: {
    type: Date,
    default: null,
  },

  returnReason: {
    type: String,
    default: "",
  },

  returnApprovedAt: {
    type: Date,
    default: null,
  },

  returnedAt: {
    type: Date,
    default: null,
  },

  isRefunded: {
    type: Boolean,
    default: false,
  },

  refundAmount: {
    type: Number,
    default: 0,
  },

  refundProcessedAt: {
    type: Date,
    default: null,
  },
});

const shopOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  items: [orderItemSchema],

  /* ===============================
     💳 CUSTOMER PAYMENT DATA
  =============================== */

  paymentStatus: {
    type: String,
    enum: [
      "NOT_REQUIRED",
      "PENDING",
      "SUCCESS",
      "FAILED",
      "CANCELLED",
      "REFUNDED",
    ],
    default: "NOT_REQUIRED",
  },

  paymentMethod: {
    type: String,
    enum: ["SIMULATOR", "ONLINE"],
    default: null,
  },

  paymentReference: {
    type: String,
    default: null,
  },

  paidAt: {
    type: Date,
    default: null,
  },

  /* ===============================
     💵 ORDER PRICING BREAKDOWN
     ADDITIVE FIELDS
  =============================== */

  // Product subtotal after discounts, before delivery and platform fee.
  itemsSubtotal: {
    type: Number,
    default: 0,
    min: 0,
  },

  discountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Delivery fee charged to the customer.
  customerDeliveryCharge: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Customer-facing platform fee.
  platformFee: {
    type: Number,
    default: 5,
    min: 0,
  },

  // Estimated shipping costs for internal tracking.
  totalShippingCost: {
    type: Number,
    default: 0,
    min: 0,
  },

  sellerShippingCost: {
    type: Number,
    default: 0,
    min: 0,
  },

  /* ===============================
     💵 ORDER TOTAL
  =============================== */

  // Total amount payable by the customer.
  totalAmount: {
    type: Number,
    required: true,
  },

  isSettled: {
    type: Boolean,
    default: false,
  },

  settledAt: {
    type: Date,
    default: null,
  },

  paidToSellerAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ShopOrder", shopOrderSchema);
