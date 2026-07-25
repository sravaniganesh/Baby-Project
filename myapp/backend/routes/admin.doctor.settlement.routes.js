const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const DoctorSettlement = require("../models/DoctorSettlement");
const Doctor = require("../models/Doctor");
const Consultation = require("../models/Consultation");

/* =====================================
   CREATE DOCTOR SETTLEMENT (ADMIN)
   POST /api/admin/doctor-settlements
===================================== */

router.post("/", adminAuth, async (req, res) => {
  try {

    const { doctorId, periodFrom, periodTo, notes } = req.body;

    if (!doctorId || !periodFrom || !periodTo) {
      return res.status(400).json({
        message: "doctorId, periodFrom and periodTo are required",
      });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    /* =========================
       FIND COMPLETED CONSULTATIONS
    ========================= */

    const consultations = await Consultation.find({
      doctorId,
      status: "COMPLETED",
      paymentStatus: "PAID",
      settlementId: null,
      createdAt: {
        $gte: new Date(periodFrom),
        $lte: new Date(periodTo),
      },
    });

    if (consultations.length === 0) {
      return res.status(400).json({
        message: "No completed consultations available for settlement",
      });
    }

    /* =========================
       CALCULATE FINANCIALS
    ========================= */

    let totalDoctorEarning = 0;
    let totalPlatformFee = 0;

    consultations.forEach((c) => {
      totalDoctorEarning += c.doctorEarning || 0;
      totalPlatformFee += c.platformFee || 0;
    });

    /* =========================
       CREATE SETTLEMENT
    ========================= */

    const settlement = await DoctorSettlement.create({
      doctorId,
      consultationIds: consultations.map((c) => c._id),
      periodFrom,
      periodTo,
      amount: totalDoctorEarning,
      totalDoctorEarning,
      totalPlatformFee,
      notes,
      createdBy: req.admin.id,
    });

    /* =========================
       LINK CONSULTATIONS
    ========================= */

    await Consultation.updateMany(
      { _id: { $in: consultations.map((c) => c._id) } },
      { settlementId: settlement._id }
    );

    res.json({
      success: true,
      message: "Doctor settlement created",
      settlement,
      consultationsIncluded: consultations.length,
    });

  } catch (err) {

    console.error("CREATE DOCTOR SETTLEMENT ERROR:", err);

    res.status(500).json({
      message: "Failed to create settlement",
    });

  }
});

/* =====================================
   MARK SETTLEMENT AS PAID
   PATCH /api/admin/doctor-settlements/:id/pay
===================================== */

router.patch("/:id/pay", adminAuth, async (req, res) => {
  try {

    const { paymentMode, transactionRef } = req.body;

    const settlement = await DoctorSettlement.findById(req.params.id);

    if (!settlement) {
      return res.status(404).json({
        message: "Settlement not found",
      });
    }

    settlement.status = "PAID";
    settlement.paymentMode = paymentMode || "";
    settlement.transactionRef = transactionRef || "";
    settlement.paidAt = new Date();

    await settlement.save();

    res.json({
      success: true,
      message: "Settlement marked as paid",
      settlement,
    });

  } catch (err) {

    console.error("PAY SETTLEMENT ERROR:", err);

    res.status(500).json({
      message: "Failed to mark as paid",
    });

  }
});

/* =====================================
   LIST ALL SETTLEMENTS (ADMIN)
   GET /api/admin/doctor-settlements
===================================== */

router.get("/", adminAuth, async (req, res) => {
  try {

    const settlements = await DoctorSettlement.find({})
      .populate("doctorId", "name email")
      .populate("consultationIds")
      .sort({ createdAt: -1 });

    res.json(settlements);

  } catch (err) {

    console.error("LIST SETTLEMENTS ERROR:", err);

    res.status(500).json({
      message: "Failed to load settlements",
    });

  }
});

module.exports = router;