const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");

const Admin = require("../models/Admin");
const logAudit = require("../utils/auditLogger");

/* =====================================
   GET ALL ADMINS
   SUPER ADMIN ONLY
===================================== */
router.get(
  "/",
  adminAuth,
  allowRoles("SUPER_ADMIN"),
  async (req, res) => {
    try {
      const admins = await Admin.find()
        .select("-password")
        .sort({ createdAt: -1 });

      res.json(admins);
    } catch (err) {
      console.error("ADMIN LIST ERROR:", err);
      res.status(500).json({
        message: "Failed to load admins",
      });
    }
  }
);

/* =====================================
   CREATE ADMIN
===================================== */
router.post(
  "/",
  adminAuth,
  allowRoles("SUPER_ADMIN"),
  async (req, res) => {
    try {
      const { email, password, role, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password required",
        });
      }

      /* ===============================
         PREVENT CREATING SUPER ADMIN
      =============================== */

      if (role === "SUPER_ADMIN") {
        return res.status(403).json({
          message: "Creating SUPER_ADMIN is not allowed",
        });
      }

      const existing = await Admin.findOne({ email });

      if (existing) {
        return res.status(400).json({
          message: "Admin already exists",
        });
      }

      const admin = new Admin({
        email,
        password,
        role,
        name,
      });

      await admin.save();

      await logAudit({
        actorType: "ADMIN",
        actorId: req.admin.id,
        action: "ADMIN_CREATED",
        entityType: "ADMIN",
        entityId: admin._id,
        metadata: {
          email: admin.email,
          role: admin.role,
        },
        req,
      });

      res.json({
        success: true,
        message: "Admin created successfully",
      });
    } catch (err) {
      console.error("ADMIN CREATE ERROR:", err);
      res.status(500).json({
        message: "Failed to create admin",
      });
    }
  }
);

/* =====================================
   CHANGE ADMIN ROLE
===================================== */
router.patch(
  "/:id/role",
  adminAuth,
  allowRoles("SUPER_ADMIN"),
  async (req, res) => {
    try {
      const { role } = req.body;

      const admin = await Admin.findById(req.params.id);

      if (!admin) {
        return res.status(404).json({
          message: "Admin not found",
        });
      }

      /* ===============================
         PREVENT SELF ROLE CHANGE
      =============================== */

      if (admin._id.toString() === req.admin.id.toString()) {
        return res.status(400).json({
          message: "You cannot change your own role",
        });
      }

      admin.role = role;

      await admin.save();

      await logAudit({
        actorType: "ADMIN",
        actorId: req.admin.id,
        action: "ADMIN_ROLE_CHANGED",
        entityType: "ADMIN",
        entityId: admin._id,
        metadata: {
          newRole: role,
        },
        req,
      });

      res.json({
        success: true,
        message: "Admin role updated",
      });
    } catch (err) {
      console.error("ADMIN ROLE UPDATE ERROR:", err);
      res.status(500).json({
        message: "Failed to update role",
      });
    }
  }
);

/* =====================================
   SUSPEND ADMIN
===================================== */
router.patch(
  "/:id/suspend",
  adminAuth,
  allowRoles("SUPER_ADMIN"),
  async (req, res) => {
    try {
      const admin = await Admin.findById(req.params.id);

      if (!admin) {
        return res.status(404).json({
          message: "Admin not found",
        });
      }

      if (admin._id.toString() === req.admin.id.toString()) {
        return res.status(400).json({
          message: "You cannot suspend yourself",
        });
      }

      admin.isActive = false;

      await admin.save();

      await logAudit({
        actorType: "ADMIN",
        actorId: req.admin.id,
        action: "ADMIN_SUSPENDED",
        entityType: "ADMIN",
        entityId: admin._id,
        req,
      });

      res.json({
        success: true,
        message: "Admin suspended",
      });
    } catch (err) {
      console.error("ADMIN SUSPEND ERROR:", err);
      res.status(500).json({
        message: "Failed to suspend admin",
      });
    }
  }
);

/* =====================================
   ACTIVATE ADMIN
===================================== */
router.patch(
  "/:id/activate",
  adminAuth,
  allowRoles("SUPER_ADMIN"),
  async (req, res) => {
    try {
      const admin = await Admin.findById(req.params.id);

      if (!admin) {
        return res.status(404).json({
          message: "Admin not found",
        });
      }

      admin.isActive = true;

      await admin.save();

      await logAudit({
        actorType: "ADMIN",
        actorId: req.admin.id,
        action: "ADMIN_ACTIVATED",
        entityType: "ADMIN",
        entityId: admin._id,
        req,
      });

      res.json({
        success: true,
        message: "Admin activated",
      });
    } catch (err) {
      console.error("ADMIN ACTIVATE ERROR:", err);
      res.status(500).json({
        message: "Failed to activate admin",
      });
    }
  }
);

module.exports = router;