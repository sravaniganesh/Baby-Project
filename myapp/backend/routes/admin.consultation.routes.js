const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");

const Consultation = require("../models/Consultation");
const logAudit = require("../utils/logAudit");

/* =========================
   GET ALL CONSULTATIONS
========================= */

router.get("/", adminAuth, async (req, res) => {

  try {

    const consultations = await Consultation.find()
      .populate("userId", "name email")
      .populate("doctorId", "name specialization")
      .sort({ createdAt: -1 });

    res.json(consultations);

  } catch (err) {

    console.error("ADMIN CONSULTATIONS ERROR:", err);

    res.status(500).json({
      message: "Failed to load consultations",
    });

  }

});


/* =========================
   GET CONSULTATION DETAILS
========================= */

router.get("/:id", adminAuth, async (req, res) => {

  try {

    const consultation = await Consultation.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("doctorId", "name email specialization");

    if (!consultation) {
      return res.status(404).json({
        message: "Consultation not found",
      });
    }

    res.json(consultation);

  } catch (err) {

    console.error("ADMIN CONSULTATION DETAILS ERROR:", err);

    res.status(500).json({
      message: "Failed to load consultation",
    });

  }

});


/* =========================
   CANCEL CONSULTATION
========================= */

router.patch(
  "/:id/cancel",
  adminAuth,
  allowRoles("SUPER_ADMIN","SUPPORT_ADMIN"),
  async (req, res) => {

  try {

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        message: "Consultation not found",
      });
    }

    consultation.status = "CANCELLED";

    await consultation.save();

    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "CONSULTATION_CANCELLED_BY_ADMIN",
      entityType: "CONSULTATION",
      entityId: consultation._id,
      metadata: {
        doctorId: consultation.doctorId,
        userId: consultation.userId,
      },
      req,
    });

    res.json({
      success: true,
      message: "Consultation cancelled",
    });

  } catch (err) {

    console.error("ADMIN CANCEL CONSULTATION ERROR:", err);

    res.status(500).json({
      message: "Failed to cancel consultation",
    });

  }

});


/* =========================
   REFUND CONSULTATION
========================= */

router.post(
  "/:id/refund",
  adminAuth,
  allowRoles("SUPER_ADMIN","FINANCE_ADMIN"),
  async (req, res) => {

  try {

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        message: "Consultation not found",
      });
    }

    if (consultation.paymentStatus !== "PAID") {
      return res.status(400).json({
        message: "Consultation is not paid",
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
        amount: consultation.consultationFee,
      },
      req,
    });

    res.json({
      success: true,
      message: "Consultation refunded",
    });

  } catch (err) {

    console.error("ADMIN CONSULTATION REFUND ERROR:", err);

    res.status(500).json({
      message: "Refund failed",
    });

  }

});


/* =========================
   CONSULTATION ANALYTICS
========================= */

router.get("/analytics/summary", adminAuth, async (req, res) => {

  try {

    const totalConsultations =
      await Consultation.countDocuments();

    const completedConsultations =
      await Consultation.countDocuments({
        status: "COMPLETED",
      });

    const cancelledConsultations =
      await Consultation.countDocuments({
        status: "CANCELLED",
      });

    const refundedConsultations =
      await Consultation.countDocuments({
        paymentStatus: "REFUNDED",
      });

    res.json({
      totalConsultations,
      completedConsultations,
      cancelledConsultations,
      refundedConsultations,
    });

  } catch (err) {

    console.error("CONSULTATION ANALYTICS ERROR:", err);

    res.status(500).json({
      message: "Failed to load analytics",
    });

  }

});

module.exports = router;