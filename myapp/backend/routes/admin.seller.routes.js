const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");
const Seller = require("../models/Seller");

/* =====================================
   GET ALL SELLERS
   GET /api/admin/sellers
===================================== */
router.get(
  "/",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
  try {
    const sellers = await Seller.find({})
      .sort({ createdAt: -1 })
      .select("-password");

    res.json(sellers);
  } catch (err) {
    console.error("ADMIN SELLERS LIST ERROR:", err);
    res.status(500).json({ message: "Failed to load sellers" });
  }
});

/* =====================================
   GET SELLER DETAILS
   GET /api/admin/sellers/:id
===================================== */
router.get(
  "/:id",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id).select("-password");

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.json(seller);
  } catch (err) {
    console.error("ADMIN SELLER DETAILS ERROR:", err);
    res.status(500).json({ message: "Failed to load seller details" });
  }
});

/* =====================================
   SUSPEND SELLER
   PATCH /api/admin/sellers/:id/suspend
===================================== */
router.patch(
  "/:id/suspend",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"),
  async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.isActive = false;

    await seller.save();

    res.json({
      success: true,
      message: "Seller suspended",
    });
  } catch (err) {
    console.error("ADMIN SELLER SUSPEND ERROR:", err);
    res.status(500).json({ message: "Failed to suspend seller" });
  }
});

/* =====================================
   ACTIVATE SELLER
   PATCH /api/admin/sellers/:id/activate
===================================== */
router.patch(
  "/:id/activate",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"),
  async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.isActive = true;

    await seller.save();

    res.json({
      success: true,
      message: "Seller activated",
    });
  } catch (err) {
    console.error("ADMIN SELLER ACTIVATE ERROR:", err);
    res.status(500).json({ message: "Failed to activate seller" });
  }
});

/* =====================================
   VERIFY SELLER
   PATCH /api/admin/sellers/:id/verify
===================================== */
router.patch(
  "/:id/verify",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"),
  async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.isVerified = true;

    await seller.save();

    res.json({
      success: true,
      message: "Seller verified",
    });
  } catch (err) {
    console.error("ADMIN SELLER VERIFY ERROR:", err);
    res.status(500).json({ message: "Failed to verify seller" });
  }
});

module.exports = router;