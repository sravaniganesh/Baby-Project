const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const Consultation = require("../models/Consultation");
const Doctor = require("../models/Doctor");
const Payment = require("../models/Payment"); // ✅ ADD

/* =========================
   BOOK CONSULTATION
========================= */

router.post("/book", auth, async (req, res) => {
  try {
    const {
      doctorId,
      consultationType = "hospital",
      scheduledAt,
      slotTime,
    } = req.body;

    /* =========================
       VALIDATION
    ========================= */

    if (!doctorId) {
      return res.status(400).json({
        message: "doctorId is required",
      });
    }

    /* =========================
       GET DOCTOR
    ========================= */

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    /* =========================
       🔥 VIDEO CONSULTATION
    ========================= */
    if (consultationType === "video") {
      // 🔒 REQUIRE PAYMENT
      const payment = await Payment.findOne({
        user: req.user.id,
        referenceId: doctorId,
        type: "consultation",
        status: "success",
        isUsed: false,
      });

      if (!payment) {
        return res.status(403).json({
          message: "Payment required for video consultation",
        });
      }

      const consultationFee = doctor.consultationFee || 0;
      const platformFee = Math.round(consultationFee * 0.2);
      const doctorEarning = consultationFee - platformFee;

     const consultation = await Consultation.create({
  userId: req.user.id,
  doctorId,
  consultationType,
  scheduledAt,
  slotTime,
  consultationFee,
  doctorEarning,
  platformFee,

  paymentStatus: "PENDING",

  // ✅ ADD THIS
  status: "REQUESTED",
});

      // 🔥 MARK PAYMENT USED
      payment.isUsed = true;
      await payment.save();

      return res.json({
        success: true,
        consultation,
      });
    }

    /* =========================
       🏥 HOSPITAL CONSULTATION
    ========================= */

    if (!scheduledAt || !slotTime) {
      return res.status(400).json({
        message: "scheduledAt and slotTime are required",
      });
    }

    const existing = await Consultation.findOne({
      doctorId,
      scheduledAt,
      slotTime,
      status: { $in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] },
    });

    if (existing) {
      return res.status(400).json({
        message: "This time slot is already booked",
      });
    }

    const consultationFee = doctor.consultationFee || 0;
    const platformFee = Math.round(consultationFee * 0.2);
    const doctorEarning = consultationFee - platformFee;

    const consultation = await Consultation.create({
      userId: req.user.id,
      doctorId,
      consultationType: "hospital",
      scheduledAt,
      slotTime,
      consultationFee,
      doctorEarning,
      platformFee,
      paymentStatus:
        doctor.hospitalConsultationType === "paid"
          ? "PENDING"
          : "FREE",
    });

    res.json({
      success: true,
      consultation,
    });
  } catch (err) {
    console.error("BOOK CONSULTATION ERROR:", err);

    res.status(500).json({
      message: "Failed to book consultation",
    });
  }
});

/* =========================
   USER CONSULTATIONS
========================= */

router.get("/my", auth, async (req, res) => {
  try {
    const consultations = await Consultation.find({
      userId: req.user.id,
    })
      .populate(
        "doctorId",
        "name specialization consultationFee"
      )
      .sort({ createdAt: -1 });

    res.json(consultations);
  } catch (err) {
    console.error("USER CONSULTATIONS ERROR:", err);

    res.status(500).json({
      message: "Failed to load consultations",
    });
  }
});

module.exports = router;