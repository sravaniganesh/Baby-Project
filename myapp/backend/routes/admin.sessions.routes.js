const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");

const { getActiveAdmins } = require("../utils/adminSessionStore");

/* =========================
   ACTIVE ADMIN SESSIONS
========================= */

router.get(
  "/sessions",
  adminAuth,
  allowRoles("SUPER_ADMIN"),
  async (req, res) => {
    try {
      const sessions = getActiveAdmins();

      res.json({
        success: true,
        sessions,
      });
    } catch (err) {
      console.error("ADMIN SESSION ERROR:", err);

      res.status(500).json({
        message: "Failed to load admin sessions",
      });
    }
  }
);

module.exports = router;