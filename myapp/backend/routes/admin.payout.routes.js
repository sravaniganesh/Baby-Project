const express = require("express");
const router = express.Router();

const ShopOrder = require("../models/ShopOrder");
const SellerPayout = require("../models/SellerPayout");

/* =====================================
   TRIGGER SELLER PAYOUT (MANUAL)
===================================== */
router.post("/run", async (req, res) => {
  try {
    const deliveredOrders = await ShopOrder.find({
      "items.status": "DELIVERED",
      "items.isPaidToSeller": { $ne: true },
    });

    const sellerMap = {};

    deliveredOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.status === "DELIVERED" && !item.isPaidToSeller) {
          if (!sellerMap[item.sellerId]) {
            sellerMap[item.sellerId] = {
              amount: 0,
              orderItemIds: [],
            };
          }

          sellerMap[item.sellerId].amount += item.sellerEarning;
          sellerMap[item.sellerId].orderItemIds.push(item._id);

          item.isPaidToSeller = true;
          item.paidAt = new Date();
        }
      });
    });

    // Save payouts
    for (const sellerId in sellerMap) {
      await SellerPayout.create({
        sellerId,
        amount: sellerMap[sellerId].amount,
        orderItemIds: sellerMap[sellerId].orderItemIds,
        payoutDate: new Date(),
        status: "PAID",
      });
    }

    // Save updated orders
    for (const order of deliveredOrders) {
      await order.save();
    }

    res.json({ success: true, message: "Payouts processed" });
  } catch (err) {
    console.error("PAYOUT ERROR:", err);
    res.status(500).json({ message: "Payout failed" });
  }
});

module.exports = router;
