const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopProduct",
      required: true,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Seller",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    priceAtAddTime: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const shopCartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },

    items: [cartItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShopCart", shopCartSchema);
