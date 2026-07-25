const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const AdminNotification = require("../models/AdminNotification");

/* =====================================
   GET ADMIN NOTIFICATIONS
===================================== */

router.get("/", adminAuth, async (req, res) => {
  try {

    const notifications = await AdminNotification.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);

  } catch (err) {

    console.error("ADMIN NOTIFICATION ERROR:", err);

    res.status(500).json({
      message: "Failed to load notifications",
    });
  }
});

module.exports = router;