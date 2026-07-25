const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole"); // ✅ correct
const UserPremium = require("../models/UserPremium");

/* =====================================
   ADMIN — PREMIUM EARNINGS SUMMARY
   GET /api/admin/premium/summary
===================================== */
router.get(
  "/summary",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
  try {
    const premiums = await UserPremium.find({}).lean();

    let totalRevenue = 0;
    const planWise = {
      MONTHLY: 0,
      QUARTERLY: 0,
      YEARLY: 0,
    };

    premiums.forEach((p) => {
      const amount = p.amountPaid || 0;
      totalRevenue += amount;

      if (p.planType && planWise[p.planType] !== undefined) {
        planWise[p.planType] += amount;
      }
    });

    res.json({
      totalRevenue,
      planWise,
      totalPremiumUsers: premiums.length,
    });
  } catch (err) {
    console.error("ADMIN PREMIUM SUMMARY ERROR:", err);
    res.status(500).json({
      message: "Failed to load premium summary",
    });
  }
});

/* =====================================
   ADMIN — PREMIUM TRANSACTIONS
   GET /api/admin/premium/list
===================================== */
router.get(
  "/list",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
  try {
    const premiums = await UserPremium.find({})
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const list = premiums.map((p) => ({
      user: p.userId,
      planType: p.planType,
      amountPaid: p.amountPaid,
      startDate: p.startDate,
      endDate: p.endDate,
      paymentMode: p.paymentMode,
      isActive: p.isActive,
      createdAt: p.createdAt,
    }));

    res.json(list);
  } catch (err) {
    console.error("ADMIN PREMIUM LIST ERROR:", err);
    res.status(500).json({
      message: "Failed to load premium list",
    });
  }
});

module.exports = router;
