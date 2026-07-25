const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");

const AuditLog = require("../models/AuditLog");

/* =====================================
   GET AUDIT LOGS
   SUPER ADMIN ONLY
===================================== */

router.get(
  "/",
  adminAuth,
  allowRoles("SUPER_ADMIN"),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        action,
        entityType,
        actorId,
        startDate,
        endDate,
      } = req.query;

      const query = {};

      if (action) query.action = action;
      if (entityType) query.entityType = entityType;
      if (actorId) query.actorId = actorId;

      if (startDate || endDate) {
        query.createdAt = {};

        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }

        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      const logs = await AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      const total = await AuditLog.countDocuments(query);

      res.json({
        success: true,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
        total,
        logs,
      });
    } catch (err) {
      console.error("AUDIT LOG FETCH ERROR:", err);

      res.status(500).json({
        message: "Failed to fetch audit logs",
      });
    }
  }
);

module.exports = router;