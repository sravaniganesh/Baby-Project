const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const logAudit = require("../utils/auditLogger");
const adminAuth = require("../middleware/adminAuth"); // ✅ added
const { adminOnline } = require("../utils/adminSessionStore");

/* =========================
   ADMIN LOGIN
   POST /api/admin/login
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN EMAIL:", email);
    console.log("LOGIN PASSWORD:", password);

    const admin = await Admin.findOne({ email });

    console.log("ADMIN FOUND:", admin);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const jwtSecret = String(process.env.JWT_SECRET || "");

    if (!jwtSecret) {
      console.error("JWT_SECRET missing at runtime");
      return res
        .status(500)
        .json({ message: "Server misconfiguration" });
    }

    /* =========================
       CREATE TOKEN
    ========================== */

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        type: "ADMIN",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    /* =========================
       UPDATE LAST LOGIN
    ========================== */

    admin.lastLoginAt = new Date();
    await admin.save();

    adminOnline(admin._id.toString());

    await logAudit({
      actorType: "ADMIN",
      actorId: admin._id,
      action: "ADMIN_LOGIN",
      entityType: "ADMIN",
      entityId: admin._id,
      metadata: {
        email: admin.email,
      },
      req,
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    res.status(500).json({
      message: "Admin login failed",
    });
  }
});

/* =========================
   ADMIN LOGOUT
   POST /api/admin/logout
========================= */

router.post("/logout", adminAuth, async (req, res) => {
  try {
    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "ADMIN_LOGOUT",
      entityType: "ADMIN",
      entityId: req.admin.id,
      req,
    });

    res.json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (err) {
    console.error("ADMIN LOGOUT ERROR:", err);
    res.status(500).json({
      message: "Logout failed",
    });
  }
});

module.exports = router;