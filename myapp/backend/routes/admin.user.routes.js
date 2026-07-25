const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");
const User = require("../models/user");

/* =====================================
   GET ALL USERS (WITH PAGINATION)
   GET /api/admin/users?page=1&limit=20&search=
===================================== */
router.get(
  "/",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"),
  async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const searchQuery = {
      role: "user",
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ],
    };

    const total = await User.countDocuments(searchQuery);

    const users = await User.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-password");

    res.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("ADMIN USER LIST ERROR:", err);
    res.status(500).json({ message: "Failed to load users" });
  }
});

/* =====================================
   GET USER DETAILS
   GET /api/admin/users/:id
===================================== */
router.get(
  "/:id",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"),
  async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("ADMIN USER DETAILS ERROR:", err);
    res.status(500).json({ message: "Failed to load user details" });
  }
});

/* =====================================
   SUSPEND USER
   PATCH /api/admin/users/:id/suspend
===================================== */
router.patch(
  "/:id/suspend",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"),
  async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = false;

    await user.save();

    res.json({
      success: true,
      message: "User suspended",
    });
  } catch (err) {
    console.error("ADMIN USER SUSPEND ERROR:", err);
    res.status(500).json({ message: "Failed to suspend user" });
  }
});

/* =====================================
   ACTIVATE USER
   PATCH /api/admin/users/:id/activate
===================================== */
router.patch(
  "/:id/activate",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"),
  async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = true;

    await user.save();

    res.json({
      success: true,
      message: "User activated",
    });
  } catch (err) {
    console.error("ADMIN USER ACTIVATE ERROR:", err);
    res.status(500).json({ message: "Failed to activate user" });
  }
});

module.exports = router;