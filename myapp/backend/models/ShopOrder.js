const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
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
      "PLACED",
      "ACCEPTED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED"
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
