const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const ShopOrder = require("../models/ShopOrder");
const Seller = require("../models/Seller");

/* =====================================
   SELLER EARNINGS SUMMARY (ADMIN)
   GET /api/admin/earnings/sellers
===================================== */
router.get("/sellers", adminAuth, async (req, res) => {
  try {
    const orders = await ShopOrder.find({
      "items.status": "DELIVERED",
    });

    const sellerMap = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.status !== "DELIVERED") return;

        const sellerId = item.sellerId.toString();

        if (!sellerMap[sellerId]) {
          sellerMap[sellerId] = {
            sellerId,
            totalEarning: 0,
            totalPlatformFee: 0,
            unpaidEarning: 0,
            paidEarning: 0,
            itemsCount: 0,
          };
        }

        sellerMap[sellerId].totalEarning += item.sellerEarning || 0;
        sellerMap[sellerId].totalPlatformFee += item.platformFee || 0;
        sellerMap[sellerId].itemsCount += 1;

        if (item.isPaidToSeller === true) {
          sellerMap[sellerId].paidEarning += item.sellerEarning || 0;
        } else {
          sellerMap[sellerId].unpaidEarning += item.sellerEarning || 0;
        }
      });
    });

    const sellerIds = Object.keys(sellerMap);
    const sellers = await Seller.find({ _id: { $in: sellerIds } });

    const response = sellers.map(seller => ({
      sellerId: seller._id,
      businessName: seller.businessName,
      sellerCategory: seller.sellerCategory,
      ...sellerMap[seller._id.toString()],
    }));

    res.json(response);
  } catch (err) {
    console.error("ADMIN SELLER EARNINGS ERROR:", err);
    res.status(500).json({ message: "Failed to load seller earnings" });
  }
});
/* =====================================
   UNPAID ORDER ITEMS (ADMIN)
   GET /api/admin/earnings/unpaid-items
===================================== */
router.get("/unpaid-items", adminAuth, async (req, res) => {
  try {
    const orders = await ShopOrder.find({
      "items.status": "DELIVERED",
      "items.isPaidToSeller": { $ne: true },
    });

    const items = [];

    orders.forEach(order => {
      order.items.forEach(item => {
        if (
          item.status === "DELIVERED" &&
          item.isPaidToSeller !== true
        ) {
          items.push({
            orderId: order._id,
            orderItemId: item._id,
            sellerId: item.sellerId,
            title: item.title,
            quantity: item.quantity,
            sellerEarning: item.sellerEarning,
            platformFee: item.platformFee,
            deliveredAt: item.earningCreatedAt,
          });
        }
      });
    });

    res.json(items);
  } catch (err) {
    console.error("ADMIN UNPAID ITEMS ERROR:", err);
    res.status(500).json({ message: "Failed to load unpaid items" });
  }
});
/* =====================================
   PLATFORM EARNINGS SUMMARY (ADMIN)
   GET /api/admin/earnings/platform
===================================== */
router.get("/platform", adminAuth, async (req, res) => {
  try {
    const orders = await ShopOrder.find({
      "items.status": "DELIVERED",
    });

    let totalPlatformFee = 0;
    let totalSellerPaid = 0;
    let totalSellerUnpaid = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.status !== "DELIVERED") return;

        totalPlatformFee += item.platformFee || 0;

        if (item.isPaidToSeller === true) {
          totalSellerPaid += item.sellerEarning || 0;
        } else {
          totalSellerUnpaid += item.sellerEarning || 0;
        }
      });
    });

    res.json({
      totalPlatformFee,
      totalSellerPaid,
      totalSellerUnpaid,
      grossHandledAmount:
        totalPlatformFee + totalSellerPaid + totalSellerUnpaid,
    });
  } catch (err) {
    console.error("ADMIN PLATFORM EARNINGS ERROR:", err);
    res.status(500).json({ message: "Failed to load platform earnings" });
  }
});


module.exports = router;
