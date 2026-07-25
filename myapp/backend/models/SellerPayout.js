const mongoose = require("mongoose");

const SellerPayoutSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller" },
  amount: Number,
  orderItemIds: [mongoose.Schema.Types.ObjectId],
  payoutDate: Date,
  status: {
    type: String,
    enum: ["PENDING", "PAID"],
    default: "PENDING",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SellerPayout", SellerPayoutSchema);
