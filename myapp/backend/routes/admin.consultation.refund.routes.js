const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");

const Consultation = require("../models/Consultation");
const logAudit = require("../utils/logAudit");

/* =====================================
   ADMIN CONSULTATION REFUND
   POST /api/admin/consultations/:id/refund
===================================== */

router.post(
  "/:id/refund",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
    try {

      const consultation = await Consultation.findById(req.params.id);

      if (!consultation) {
        return res.status(404).json({
          message: "Consultation not found"
        });
      }

      if (consultation.paymentStatus !== "PAID") {
        return res.status(400).json({
          message: "Consultation is not paid"
        });
      }

      consultation.paymentStatus = "REFUNDED";
      consultation.status = "CANCELLED";

      await consultation.save();

      await logAudit({
        actorType: "ADMIN",
        actorId: req.admin.id,
        action: "CONSULTATION_REFUND",
        entityType: "CONSULTATION",
        entityId: consultation._id,
        metadata: {
          doctorId: consultation.doctorId,
          userId: consultation.userId,
          amount: consultation.consultationFee
        },
        req
      });

      res.json({
        success: true,
        message: "Consultation refunded"
      });

    } catch (err) {

      console.error("CONSULTATION REFUND ERROR:", err);

      res.status(500).json({
        message: "Refund failed"
      });

    }
  }
);

module.exports = router;