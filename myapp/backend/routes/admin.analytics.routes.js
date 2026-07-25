const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");
const User = require("../models/user");
const ShopOrder = require("../models/ShopOrder");
const ShopProduct = require("../models/ShopProduct");

/* =====================================
   USER GROWTH
   GET /api/admin/analytics/users
===================================== */
router.get(
  "/users",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
  try {
    const users = await User.find({ role: "user" });

    const growth = {};

    users.forEach((u) => {
      const key = u.createdAt.toISOString().slice(0, 10);
      growth[key] = (growth[key] || 0) + 1;
    });

    res.json(growth);
  } catch (err) {
    console.error("ADMIN USER ANALYTICS ERROR:", err);
    res.status(500).json({ message: "Failed to load user analytics" });
  }
});

/* =====================================
   ORDER GROWTH
   GET /api/admin/analytics/orders
===================================== */
router.get(
  "/orders",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
  try {
    const orders = await ShopOrder.find({});

    const growth = {};

    orders.forEach((o) => {
      const key = o.createdAt.toISOString().slice(0, 10);
      growth[key] = (growth[key] || 0) + 1;
    });

    res.json(growth);
  } catch (err) {
    console.error("ADMIN ORDER ANALYTICS ERROR:", err);
    res.status(500).json({ message: "Failed to load order analytics" });
  }
});

/* =====================================
   TOP PRODUCTS
   GET /api/admin/analytics/top-products
===================================== */
router.get(
  "/top-products",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN", "CONTENT_ADMIN"),
  async (req, res) => {
  try {
    const orders = await ShopOrder.find({});

    const productSales = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const id = item.productId?.toString();

        if (!id) return;

        productSales[id] =
          (productSales[id] || 0) + item.quantity;
      });
    });

    const sorted = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const productIds = sorted.map((p) => p[0]);

    const products = await ShopProduct.find({
      _id: { $in: productIds },
    });

    res.json({
      ranking: sorted,
      products,
    });
  } catch (err) {
    console.error("ADMIN TOP PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to load top products" });
  }
});

/* =====================================
   PLATFORM SUMMARY
   GET /api/admin/analytics/summary
===================================== */
router.get(
  "/summary",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalOrders = await ShopOrder.countDocuments();
    const totalProducts = await ShopProduct.countDocuments();

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
    });
  } catch (err) {
    console.error("ADMIN ANALYTICS SUMMARY ERROR:", err);
    res.status(500).json({ message: "Failed to load analytics summary" });
  }
});
/* =====================================
   PLATFORM FINANCIAL INTELLIGENCE
   GET /api/admin/analytics/finance
===================================== */

router.get("/finance", adminAuth, async (req, res) => {
  try {

    const orders = await ShopOrder.find({});

    let gmv = 0;
    let commission = 0;
    let sellerPayout = 0;
    let refundAmount = 0;

    orders.forEach(order => {
      order.items.forEach(item => {

        const total = (item.price || 0) * (item.quantity || 0);

        gmv += total;

        commission += item.platformFee || 0;

        sellerPayout += item.sellerEarning || 0;

        if (item.isRefunded) {
          refundAmount += item.refundAmount || total;
        }

      });
    });

    const netRevenue = commission - refundAmount;

    res.json({
      gmv,
      commission,
      sellerPayout,
      refundAmount,
      netRevenue
    });

  } catch (err) {
    console.error("FINANCE ANALYTICS ERROR:", err);

    res.status(500).json({
      message: "Failed to load financial analytics"
    });
  }
});
router.get("/doctors", adminAuth, async (req, res) => {
  try {

    const Consultation = require("../models/Consultation");

    const consultations = await Consultation.find({
      paymentStatus: "PAID"
    });

    let totalConsultations = consultations.length;
    let doctorEarnings = 0;
    let platformRevenue = 0;

    consultations.forEach(c => {
      doctorEarnings += c.doctorEarning || 0;
      platformRevenue += c.platformFee || 0;
    });

    res.json({
      totalConsultations,
      doctorEarnings,
      platformRevenue
    });

  } catch (err) {

    console.error("DOCTOR ANALYTICS ERROR:", err);

    res.status(500).json({
      message: "Failed to load doctor analytics"
    });

  }
});
router.get("/top-doctors", adminAuth, async (req, res) => {

  const Consultation = require("../models/Consultation");

  const consultations = await Consultation.find({
    paymentStatus: "PAID"
  });

  const doctorMap = {};

  consultations.forEach(c => {

    const id = c.doctorId.toString();

    doctorMap[id] = doctorMap[id] || {
      consultations: 0,
      earnings: 0
    };

    doctorMap[id].consultations++;
    doctorMap[id].earnings += c.doctorEarning || 0;

  });

  const ranking = Object.entries(doctorMap)
    .sort((a,b)=>b[1].earnings - a[1].earnings)
    .slice(0,10);

  res.json(ranking);

});
module.exports = router;