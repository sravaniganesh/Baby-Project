const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");

const User = require("../models/user");
const Doctor = require("../models/Doctor");

/* =====================================
   PLATFORM HEALTH
   GET /api/admin/system/health
===================================== */
router.get(
  "/health",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalDoctors = await Doctor.countDocuments();
    const activeDoctors = await Doctor.countDocuments({
      availability: "online",
    });

    const memoryUsage = process.memoryUsage();

    res.json({
      users: {
        total: totalUsers,
      },

      doctors: {
        total: totalDoctors,
        online: activeDoctors,
      },

      server: {
        uptime: process.uptime(),
        memory: memoryUsage,
        nodeVersion: process.version,
      },
    });
  } catch (err) {
    console.error("SYSTEM HEALTH ERROR:", err);
    res.status(500).json({
      message: "Failed to load system health",
    });
  }
});

/* =====================================
   ACTIVE USERS (APP ACTIVITY)
   GET /api/admin/system/active-users
===================================== */
router.get(
  "/active-users",
  adminAuth,
  allowRoles("SUPER_ADMIN"),
  async (req, res) => {
  try {
    const today = new Date();
    today.setHours(today.getHours() - 24);

    const activeUsers = await User.countDocuments({
      lastActiveAt: { $gte: today },
    });

    res.json({
      activeUsersLast24h: activeUsers,
    });
  } catch (err) {
    console.error("ACTIVE USERS ERROR:", err);
    res.status(500).json({
      message: "Failed to load active users",
    });
  }
});

/* =====================================
   SERVER INFO
   GET /api/admin/system/server
===================================== */
router.get(
  "/server",
  adminAuth,
  allowRoles("SUPER_ADMIN"),
  async (req, res) => {
  try {
    res.json({
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      node: process.version,
      platform: process.platform,
    });
  } catch (err) {
    console.error("SERVER INFO ERROR:", err);
    res.status(500).json({
      message: "Failed to load server info",
    });
  }
});

module.exports = router;