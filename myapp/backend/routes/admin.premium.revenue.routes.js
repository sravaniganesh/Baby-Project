const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const AdminPremiumLedger = require("../models/AdminPremiumLedger");

/* =====================================
   ADMIN — PREMIUM REVENUE SUMMARY
   GET /api/admin/premium-revenue/summary
===================================== */
router.get("/summary", adminAuth, async (req, res) => {
  try {
    const records = await AdminPremiumLedger.find({});

    let totalRevenue = 0;
    let doctorWise = {};

    records.forEach((r) => {
      totalRevenue += r.amount;

      if (r.doctorId) {
        doctorWise[r.doctorId] =
          (doctorWise[r.doctorId] || 0) + r.amount;
      }
    });

    res.json({
      totalRevenue,
      doctorWiseRevenue: doctorWise,
      transactions: records.length,
    });
  } catch (err) {
    console.error("PREMIUM REVENUE ERROR:", err);
    res.status(500).json({ message: "Failed to load revenue" });
  }
});

/* =====================================
   ADMIN — PREMIUM TRANSACTIONS
   GET /api/admin/premium-revenue/list
===================================== */
router.get("/list", adminAuth, async (req, res) => {
  try {
    const records = await AdminPremiumLedger.find({})
      .populate("userId", "name email")
      .populate("doctorId", "name")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    console.error("PREMIUM LIST ERROR:", err);
    res.status(500).json({ message: "Failed to load list" });
  }
});

module.exports = router;
