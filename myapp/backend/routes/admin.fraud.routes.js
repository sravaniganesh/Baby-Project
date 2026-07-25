const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");

const User = require("../models/user");
const Seller = require("../models/Seller");
const ShopOrder = require("../models/ShopOrder");

/* =====================================
   REFUND ABUSE CHECK
   GET /api/admin/fraud/refund-abuse
===================================== */
router.get(
  "/refund-abuse",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
  try {
    const orders = await ShopOrder.find({});

    const refundMap = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.isRefunded) {
          const userId = order.userId.toString();

          refundMap[userId] = (refundMap[userId] || 0) + 1;
        }
      });
    });

    const suspiciousUsers = Object.entries(refundMap)
      .filter(([_, count]) => count >= 3)
      .map(([userId, count]) => ({ userId, refunds: count }));

    res.json(suspiciousUsers);
  } catch (err) {
    console.error("REFUND ABUSE CHECK ERROR:", err);
    res.status(500).json({ message: "Failed to check refund abuse" });
  }
});

/* =====================================
   FAKE ACCOUNT DETECTION
   GET /api/admin/fraud/fake-users
===================================== */
router.get(
  "/fake-users",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"),
  async (req, res) => {
  try {
    const users = await User.find({});

    const phoneMap = {};
    const suspicious = [];

    users.forEach((user) => {
      if (!user.phone) return;

      phoneMap[user.phone] = phoneMap[user.phone] || [];
      phoneMap[user.phone].push(user._id);
    });

    Object.keys(phoneMap).forEach((phone) => {
      if (phoneMap[phone].length > 2) {
        suspicious.push({
          phone,
          accounts: phoneMap[phone],
        });
      }
    });

    res.json(suspicious);
  } catch (err) {
    console.error("FAKE USER CHECK ERROR:", err);
    res.status(500).json({ message: "Failed to detect fake users" });
  }
});

/* =====================================
   SELLER CANCELLATION RATE
   GET /api/admin/fraud/seller-cancellations
===================================== */
router.get(
  "/seller-cancellations",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"),
  async (req, res) => {
  try {
    const orders = await ShopOrder.find({});

    const sellerStats = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const sellerId = item.sellerId?.toString();

        if (!sellerId) return;

        sellerStats[sellerId] = sellerStats[sellerId] || {
          total: 0,
          cancelled: 0,
        };

        sellerStats[sellerId].total++;

        if (item.status === "CANCELLED") {
          sellerStats[sellerId].cancelled++;
        }
      });
    });

    const suspiciousSellers = Object.entries(sellerStats)
      .map(([sellerId, stats]) => ({
        sellerId,
        cancellationRate:
          stats.total === 0
            ? 0
            : (stats.cancelled / stats.total) * 100,
      }))
      .filter((s) => s.cancellationRate > 40);

    res.json(suspiciousSellers);
  } catch (err) {
    console.error("SELLER FRAUD CHECK ERROR:", err);
    res.status(500).json({ message: "Failed to analyze sellers" });
  }
});

/* =====================================
   PLATFORM HEALTH SUMMARY
   GET /api/admin/fraud/summary
===================================== */
router.get(
  "/summary",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSellers = await Seller.countDocuments();
    const totalOrders = await ShopOrder.countDocuments();

    const refundedOrders = await ShopOrder.countDocuments({
      "items.isRefunded": true,
    });

    res.json({
      totalUsers,
      totalSellers,
      totalOrders,
      refundedOrders,
    });
  } catch (err) {
    console.error("FRAUD SUMMARY ERROR:", err);
    res.status(500).json({ message: "Failed to load fraud summary" });
  }
});

module.exports = router;