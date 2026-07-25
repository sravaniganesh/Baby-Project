const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const AdminLedger = require("../models/AdminLedger");
const AdminPremiumLedger = require("../models/AdminPremiumLedger");
const DoctorSettlement = require("../models/DoctorSettlement");
const ShopOrder = require("../models/ShopOrder");
const Seller = require("../models/Seller");

/* =========================
   NEW MODELS (ADDITIVE)
========================= */

const User = require("../models/user");
const Doctor = require("../models/Doctor");
const ShopProduct = require("../models/ShopProduct");

/* =====================================
   ADMIN DASHBOARD SUMMARY
   GET /api/admin/dashboard/summary
===================================== */

router.get("/summary", adminAuth, async (req, res) => {
  try {

    /* =========================
       🛒 SHOP COMMISSION
    ========================== */

    const shopLedger = await AdminLedger.find({
  sourceType: "SELLER_COMMISSION",
});

    let shopCommission = 0;
    let shopRefunds = 0;

    shopLedger.forEach((l) => {
      if (l.direction === "CREDIT") shopCommission += l.amount;
      if (l.direction === "DEBIT") shopRefunds += l.amount;
    });

    /* =========================
       ⭐ PREMIUM REVENUE
    ========================== */

    const premiumLedger = await AdminPremiumLedger.find({});

    const premiumRevenue = premiumLedger.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    /* =========================
       👨‍⚕️ DOCTOR PAYOUTS
    ========================== */

    const doctorSettlements = await DoctorSettlement.find({
      status: "PAID",
    });

    const doctorPaid = doctorSettlements.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    );

    /* =========================
       🏪 SELLER PAYOUTS
    ========================== */

    const orders = await ShopOrder.find({
      "items.isPaidToSeller": true,
    });

    let sellerPaid = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.isPaidToSeller === true) {
          sellerPaid += item.sellerEarning || 0;
        }
      });
    });

    /* =========================
       📊 BASIC COUNTS (EXISTING)
    ========================== */

    const totalOrders = await ShopOrder.countDocuments();
    const paidOrders = await ShopOrder.countDocuments({ "items.isPaidToSeller": true });

    const totalDoctorSettlements = await DoctorSettlement.countDocuments();
    const paidDoctorSettlements = await DoctorSettlement.countDocuments({
      status: "PAID",
    });

    /* =========================
       📊 PLATFORM OVERVIEW (NEW)
    ========================== */

    const totalUsers = await User.countDocuments({ role: "user" });
    const totalDoctors = await Doctor.countDocuments();
    const totalSellers = await Seller.countDocuments();

    const totalProducts = await ShopProduct.countDocuments();
    const pendingProducts = await ShopProduct.countDocuments({
      approvalStatus: "PENDING",
    });
    const approvedProducts = await ShopProduct.countDocuments({
      approvalStatus: "APPROVED",
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const ordersToday = await ShopOrder.countDocuments({
      createdAt: { $gte: todayStart },
    });

    /* =========================
       FINAL SUMMARY
    ========================== */

    res.json({
      shop: {
        commissionEarned: shopCommission,
        refundsIssued: shopRefunds,
        netShopIncome: shopCommission - shopRefunds,
      },

      premium: {
        revenue: premiumRevenue,
      },

      payouts: {
        sellers: sellerPaid,
        doctors: doctorPaid,
      },

      platformNet:
        shopCommission +
        premiumRevenue -
        shopRefunds -
        sellerPaid -
        doctorPaid,

      /* EXISTING METRICS */
      stats: {
        totalOrders,
        paidOrders,
        totalDoctorSettlements,
        paidDoctorSettlements,
      },

      /* NEW PLATFORM STATS */
      platformStats: {
        totalUsers,
        totalDoctors,
        totalSellers,
        totalProducts,
        pendingProducts,
        approvedProducts,
        ordersToday,
      },
    });

  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

/* =====================================
   ADMIN DASHBOARD — FILTERED SUMMARY
   GET /api/admin/dashboard/summary/filter
===================================== */

router.get("/summary/filter", adminAuth, async (req, res) => {
  try {
    const { from, to, sellerId, doctorId } = req.query;

    const dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(to);
    }

    const ledgerQuery = { ...dateFilter };
    const ledgers = await AdminLedger.find(ledgerQuery);

    let shopCommission = 0;
    let shopRefunds = 0;

    ledgers.forEach((l) => {
      if (l.direction === "CREDIT") shopCommission += l.amount;
      if (l.direction === "DEBIT") shopRefunds += l.amount;
    });

    const premiumQuery = {};
    if (doctorId) premiumQuery.doctorId = doctorId;
    if (from || to) {
      premiumQuery.createdAt = {};
      if (from) premiumQuery.createdAt.$gte = new Date(from);
      if (to) premiumQuery.createdAt.$lte = new Date(to);
    }

    const premiumLedger = await AdminPremiumLedger.find(premiumQuery);
    const premiumRevenue = premiumLedger.reduce(
      (s, p) => s + (p.amount || 0),
      0
    );

    const doctorQuery = {};
    if (doctorId) doctorQuery.doctorId = doctorId;
    if (from || to) {
      doctorQuery.paidAt = {};
      if (from) doctorQuery.paidAt.$gte = new Date(from);
      if (to) doctorQuery.paidAt.$lte = new Date(to);
    }

    const doctorSettlements = await DoctorSettlement.find({
      ...doctorQuery,
      status: "PAID",
    });

    const doctorPaid = doctorSettlements.reduce(
      (s, d) => s + (d.amount || 0),
      0
    );

    const orderQuery = {
      "items.isPaidToSeller": true,
    };

    if (sellerId) orderQuery["items.sellerId"] = sellerId;
    if (from || to) {
      orderQuery.createdAt = {};
      if (from) orderQuery.createdAt.$gte = new Date(from);
      if (to) orderQuery.createdAt.$lte = new Date(to);
    }

    const orders = await ShopOrder.find(orderQuery);

    let sellerPaid = 0;
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (
          item.isPaidToSeller === true &&
          (!sellerId || item.sellerId.toString() === sellerId)
        ) {
          sellerPaid += item.sellerEarning || 0;
        }
      });
    });

    res.json({
      filters: { from, to, sellerId, doctorId },

      shop: {
        commissionEarned: shopCommission,
        refundsIssued: shopRefunds,
        netShopIncome: shopCommission - shopRefunds,
      },

      premium: {
        revenue: premiumRevenue,
      },

      payouts: {
        sellers: sellerPaid,
        doctors: doctorPaid,
      },

      platformNet:
        shopCommission +
        premiumRevenue -
        shopRefunds -
        sellerPaid -
        doctorPaid,
    });

  } catch (err) {
    console.error("FILTER DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Failed to load filtered data" });
  }
});

/* =====================================
   ADMIN DASHBOARD — CHART DATA
===================================== */

router.get("/charts", adminAuth, async (req, res) => {
  try {
    const { from, to } = req.query;

    const dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(to);
    }

    const shopLedger = await AdminLedger.find({
      sourceType: "SELLER_COMMISSION",
      ...dateFilter,
    });

    const shopTrend = {};
    shopLedger.forEach((l) => {
      const key = l.createdAt.toISOString().slice(0, 10);
      shopTrend[key] = (shopTrend[key] || 0) + l.amount;
    });

    const refundLedger = await AdminLedger.find({
      sourceType: { $in: ["SELLER_REFUND_REVERSAL", "PLATFORM_FEE_REFUND"] },
      ...dateFilter,
    });

    const refundTrend = {};
    refundLedger.forEach((l) => {
      const key = l.createdAt.toISOString().slice(0, 10);
      refundTrend[key] = (refundTrend[key] || 0) + l.amount;
    });

    const premiumLedger = await AdminPremiumLedger.find(dateFilter);

    const premiumTrend = {};
    premiumLedger.forEach((p) => {
      const key = p.createdAt.toISOString().slice(0, 10);
      premiumTrend[key] = (premiumTrend[key] || 0) + p.amount;
    });

    const doctorSettlements = await DoctorSettlement.find({
      status: "PAID",
      ...dateFilter,
    });

    const doctorTrend = {};
    doctorSettlements.forEach((d) => {
      const key = d.paidAt
        ? d.paidAt.toISOString().slice(0, 10)
        : d.createdAt.toISOString().slice(0, 10);

      doctorTrend[key] = (doctorTrend[key] || 0) + d.amount;
    });

    res.json({
      shopCommissionTrend: shopTrend,
      refundTrend,
      premiumTrend,
      doctorPayoutTrend: doctorTrend,
    });

  } catch (err) {
    console.error("DASHBOARD CHART ERROR:", err);
    res.status(500).json({ message: "Failed to load chart data" });
  }
});

module.exports = router;