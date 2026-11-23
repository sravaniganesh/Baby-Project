
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const Consultation = require("../models/Consultation");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const DoctorHospital = require("../models/DoctorHospital");
const User = require("../models/user");
const crypto = require("crypto");
const ConsultationPayment = require("../models/ConsultationPayment");

/* =========================
   BOOK / REQUEST CONSULTATION
========================= */

router.post("/book", auth, async (req, res) => {
  try {
    const {
      doctorId,
      hospitalId,
      consultationType = "hospital",
      scheduledAt,
      slotTime,
      preferredDate,
    } = req.body;

    // 1. Basic validation
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "doctorId is required",
      });
    }

    if (!["video", "hospital"].includes(consultationType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation type",
      });
    }

    // 2. Verify doctor
    const doctor = await Doctor.findOne({
      _id: doctorId,
      isActive: true,
      ...(process.env.NODE_ENV === "production"
        ? { isVerified: true }
        : {}),
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or inactive",
      });
    }

    let consultationFee = 0;
    let selectedHospitalId = null;
    let bookingMode = null;

    /* =========================
       VIDEO CONSULTATION
       Request first, pay after acceptance
    ========================= */

    if (consultationType === "video") {
      consultationFee =
        doctor.adminOverride?.consultationFee ??
        doctor.consultationFee ??
        0;

      if (consultationFee < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid consultation fee",
        });
      }

      const consultation = await Consultation.create({
        userId: req.user.id,
        doctorId,
        consultationType: "video",
        consultationFee,
        platformFee: Math.round(consultationFee * 0.2),
        doctorEarning:
          consultationFee -
          Math.round(consultationFee * 0.2),
        status: "REQUESTED",
        paymentStatus: consultationFee === 0 ? "FREE" : "PENDING",
      });

      return res.status(201).json({
        success: true,
        message: "Video consultation request submitted",
        consultation,
      });
    }

    /* =========================
       HOSPITAL CONSULTATION
    ========================= */

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: "hospitalId is required for hospital consultation",
      });
    }

    // 3. Verify approved and active doctor-hospital association
    const doctorHospital = await DoctorHospital.findOne({
      doctorId,
      hospitalId,
      status: "approved",
      isActive: true,
    });

    if (!doctorHospital) {
      return res.status(403).json({
        success: false,
        message: "Doctor is not approved at this hospital",
      });
    }

    // 4. Verify hospital
    const hospital = await Hospital.findOne({
      _id: hospitalId,
      isActive: true,
      isVerified: true,
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found, inactive or not verified",
      });
    }

    selectedHospitalId = hospital._id;
    bookingMode = doctorHospital.bookingMode || "request";

    // Use the selected hospital's consultation fee
    consultationFee = doctorHospital.consultationFee || 0;

    if (
      !Number.isFinite(consultationFee) ||
      consultationFee < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital consultation fee",
      });
    }

    /* =========================
       INSTANT BOOKING
       Preserve existing slot booking
    ========================= */

    let appointmentDate = null;
    let appointmentTime = null;

    let requestedPreferredDate = null;

    if (bookingMode === "instant") {
      if (!scheduledAt || !slotTime) {
        return res.status(400).json({
          success: false,
          message: "Please select an available date and time",
        });
      }

      const parsedDate = new Date(scheduledAt);

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate <= new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid future appointment date",
        });
      }

      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(slotTime)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment time",
        });
      }

      appointmentDate = parsedDate;
      appointmentTime = slotTime;

      // Prevent duplicate bookings for the same doctor,
      // hospital, date and time.
      const existing = await Consultation.findOne({
        doctorId,
        hospitalId: selectedHospitalId,
        scheduledAt: appointmentDate,
        slotTime: appointmentTime,
        status: {
          $in: [
            "REQUESTED",
            "SLOT_PROPOSED",
            "AWAITING_PAYMENT",
            "CONFIRMED",
            "IN_PROGRESS",
          ],
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "This appointment slot is no longer available",
        });
      }
    } else {
      // Flexible request mode: the user chooses a preferred date,
      // but does not choose an appointment time yet.
      if (!preferredDate) {
        return res.status(400).json({
          success: false,
          message: "Please select your preferred consultation date",
        });
      }

      const parsedPreferredDate = new Date(preferredDate);

      if (Number.isNaN(parsedPreferredDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid preferred date",
        });
      }

      // Compare calendar dates, allowing the user to request today
      // even though the date has no appointment time attached yet.
      const preferredDay = parsedPreferredDate.toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);

      if (preferredDay < today) {
        return res.status(400).json({
          success: false,
          message: "Preferred consultation date cannot be in the past",
        });
      }

      requestedPreferredDate = parsedPreferredDate;
    }

    /* =========================
       CREATE HOSPITAL REQUEST
    ========================= */

    const platformFee = Math.round(consultationFee * 0.2);
    const doctorEarning = consultationFee - platformFee;

    const consultation = await Consultation.create({
      userId: req.user.id,
      doctorId,
      hospitalId: selectedHospitalId,
      consultationType: "hospital",
      preferredDate: requestedPreferredDate,
      scheduledAt: appointmentDate,
      slotTime: appointmentTime,
      consultationFee,
      platformFee,
      doctorEarning,
      status: "REQUESTED",
      paymentStatus:
        consultationFee === 0 ? "FREE" : "PENDING",
    });

    return res.status(201).json({
      success: true,
      message:
        bookingMode === "request"
          ? "Hospital consultation request submitted. The doctor or authorized assistant will check availability and propose appointment times."
          : "Hospital consultation request submitted for doctor confirmation.",
      bookingMode,
      consultation,
    });
  } catch (err) {
    console.error("BOOK CONSULTATION ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to submit consultation request",
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
      .populate(
        "hospitalId",
        "name city state address"
      )
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      consultations,
    });
  } catch (err) {
    console.error("USER CONSULTATIONS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load consultations",
    });
  }
});

/* =========================================
   USER ACCEPTS PROPOSED HOSPITAL SLOT
========================================= */

router.patch("/:id/accept-slot", auth, async (req, res) => {
  try {
    const { slotIndex } = req.body;

    const consultation = await Consultation.findOne({
      _id: req.params.id,
      userId: req.user.id,
      consultationType: "hospital",
      status: "SLOT_PROPOSED",
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "No proposed appointment slots found",
      });
    }

    let proposedDate = null;
    let proposedTime = null;

    // New multi-slot workflow: the user selects one of the
    // exact options saved by the doctor or authorized assistant.
    if (Array.isArray(consultation.proposedSlots) && consultation.proposedSlots.length > 0) {
      if (
        !Number.isInteger(slotIndex) ||
        slotIndex < 0 ||
        slotIndex >= consultation.proposedSlots.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Please select one of the offered appointment slots",
        });
      }

      const selectedSlot = consultation.proposedSlots[slotIndex];
      proposedDate = new Date(selectedSlot.scheduledAt);
      proposedTime = selectedSlot.slotTime;
    } else if (consultation.proposedAt) {
      // Backward compatibility for consultations created by the
      // previous single-slot proposal workflow.
      proposedDate = new Date(consultation.proposedAt);
      proposedTime =
        `${String(proposedDate.getHours()).padStart(2, "0")}:` +
        `${String(proposedDate.getMinutes()).padStart(2, "0")}`;
    } else {
      return res.status(400).json({
        success: false,
        message: "Proposed appointment date is missing",
      });
    }

    if (
      Number.isNaN(proposedDate.getTime()) ||
      proposedDate <= new Date() ||
      typeof proposedTime !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(proposedTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "The selected appointment time is no longer valid",
      });
    }

    // Recheck the selected slot immediately before accepting it.
    const existing = await Consultation.findOne({
      _id: { $ne: consultation._id },
      doctorId: consultation.doctorId,
      hospitalId: consultation.hospitalId,
      scheduledAt: proposedDate,
      slotTime: proposedTime,
      status: {
        $in: [
          "REQUESTED",
          "SLOT_PROPOSED",
          "AWAITING_PAYMENT",
          "CONFIRMED",
          "IN_PROGRESS",
        ],
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This appointment time is no longer available. Please choose another offered slot.",
      });
    }

    const isFree = consultation.consultationFee <= 0;

    const updated = await Consultation.findOneAndUpdate(
      {
        _id: consultation._id,
        userId: req.user.id,
        status: "SLOT_PROPOSED",
      },
      {
        $set: {
          scheduledAt: proposedDate,
          slotTime: proposedTime,
          status: isFree ? "CONFIRMED" : "AWAITING_PAYMENT",
          paymentStatus: isFree ? "FREE" : "PENDING",
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: "Appointment status changed. Please refresh.",
      });
    }

    return res.json({
      success: true,
      message: isFree
        ? "Appointment confirmed"
        : "Appointment time accepted. Please choose your payment method.",
      consultation: updated,
    });
  } catch (err) {
    console.error("USER ACCEPT SLOT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to accept proposed appointment",
    });
  }
});

/* =========================================
   USER REJECTS PROPOSED HOSPITAL SLOT
========================================= */

router.patch("/:id/reject-slot", auth, async (req, res) => {
  try {
    const consultation = await Consultation.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        consultationType: "hospital",
        status: "SLOT_PROPOSED",
      },
      {
        $set: {
          status: "REJECTED",
        },
      },
      { new: true }
    );

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "No proposed appointment slot found",
      });
    }

    return res.json({
      success: true,
      message: "Proposed appointment rejected",
      consultation,
    });
  } catch (err) {
    console.error("USER REJECT SLOT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to reject proposed appointment",
    });
  }
});


/* =========================================
   USER SELECTS PAYMENT METHOD
   WALLET or PAY_AT_HOSPITAL
========================================= */

router.post("/:id/pay", auth, async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    if (!["WALLET", "PAY_AT_HOSPITAL"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const consultation = await Consultation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    if (
      consultation.consultationType !== "hospital" ||
      consultation.status !== "AWAITING_PAYMENT" ||
      consultation.paymentStatus !== "PENDING"
    ) {
      return res.status(400).json({
        success: false,
        message: "This consultation is not awaiting payment",
      });
    }

    if (paymentMethod === "PAY_AT_HOSPITAL") {
      const updated = await Consultation.findOneAndUpdate(
        {
          _id: consultation._id,
          userId: req.user.id,
          status: "AWAITING_PAYMENT",
          paymentStatus: "PENDING",
          $or: [
            { paymentMethod: null },
            { paymentMethod: { $exists: false } },
          ],
        },
        {
          $set: {
            paymentMethod: "PAY_AT_HOSPITAL",
            status: "CONFIRMED",
          },
        },
        { new: true }
      );

      if (!updated) {
        return res.status(409).json({
          success: false,
          message: "Payment has already been processed",
        });
      }

      return res.json({
        success: true,
        message: "Appointment confirmed. Pay at the hospital.",
        consultation: updated,
      });
    }

    // Claim the wallet payment attempt before deducting money.
    // This prevents duplicate requests from charging twice.
    const claimed = await Consultation.findOneAndUpdate(
      {
        _id: consultation._id,
        userId: req.user.id,
        status: "AWAITING_PAYMENT",
        paymentStatus: "PENDING",
        $or: [
          { paymentMethod: null },
          { paymentMethod: { $exists: false } },
        ],
      },
      {
        $set: {
          paymentMethod: "WALLET",
        },
      },
      { new: true }
    );

    if (!claimed) {
      return res.status(409).json({
        success: false,
        message: "Payment has already been processed or is in progress",
      });
    }

    const fee = claimed.consultationFee;

    if (!Number.isFinite(fee) || fee <= 0) {
      await Consultation.updateOne(
        { _id: claimed._id, status: "AWAITING_PAYMENT" },
        { $unset: { paymentMethod: 1 } }
      );

      return res.status(400).json({
        success: false,
        message: "Invalid consultation fee",
      });
    }

    // Atomic wallet deduction: balance cannot go below zero.
    const user = await User.findOneAndUpdate(
      {
        _id: req.user.id,
        walletBalance: { $gte: fee },
      },
      {
        $inc: { walletBalance: -fee },
      },
      { new: true }
    );

    if (!user) {
      await Consultation.updateOne(
        {
          _id: claimed._id,
          status: "AWAITING_PAYMENT",
          paymentMethod: "WALLET",
          paymentStatus: "PENDING",
        },
        {
          $unset: { paymentMethod: 1 },
        }
      );

      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    try {
      const updated = await Consultation.findOneAndUpdate(
        {
          _id: claimed._id,
          userId: req.user.id,
          status: "AWAITING_PAYMENT",
          paymentStatus: "PENDING",
          paymentMethod: "WALLET",
        },
        {
          $set: {
            status: "CONFIRMED",
            paymentStatus: "PAID",
          },
        },
        { new: true }
      );

      if (!updated) {
        throw new Error("Could not confirm consultation after payment");
      }

      return res.json({
        success: true,
        message: "Wallet payment successful. Appointment confirmed.",
        balance: user.walletBalance,
        consultation: updated,
      });
    } catch (paymentError) {
      // Refund the wallet if consultation confirmation fails.
      await User.updateOne(
        { _id: req.user.id },
        { $inc: { walletBalance: fee } }
      );

      await Consultation.updateOne(
        { _id: claimed._id, status: "AWAITING_PAYMENT" },
        { $unset: { paymentMethod: 1 } }
      );

      throw paymentError;
    }
  } catch (err) {
    console.error("CONSULTATION PAYMENT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Consultation payment failed",
    });
  }
});
/* =========================================
   DEMO ONLINE PAYMENT - START
   Consultation payments only
========================================= */

router.post("/:id/demo-payment/start", auth, async (req, res) => {
  try {
    // Demo payments must never run in production.
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Demo payments are disabled in production",
      });
    }

    const consultation = await Consultation.findOne({
      _id: req.params.id,
      userId: req.user.id,
      consultationType: "hospital",
      status: "AWAITING_PAYMENT",
      paymentStatus: "PENDING",
    });

    if (!consultation) {
      return res.status(400).json({
        success: false,
        message: "Consultation is not awaiting payment",
      });
    }

    const amount = Number(consultation.consultationFee);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation payment amount",
      });
    }

    // Claim this consultation for demo payment.
    // Existing demo attempts can be retried.
    const claimed = await Consultation.findOneAndUpdate(
      {
        _id: consultation._id,
        userId: req.user.id,
        status: "AWAITING_PAYMENT",
        paymentStatus: "PENDING",
        $or: [
          { paymentMethod: null },
          { paymentMethod: { $exists: false } },
          { paymentMethod: "DEMO_ONLINE" },
        ],
      },
      {
        $set: {
          paymentMethod: "DEMO_ONLINE",
        },
      },
      { new: true }
    );

    if (!claimed) {
      return res.status(409).json({
        success: false,
        message: "Another payment method has already been selected",
      });
    }

    const payment = await ConsultationPayment.create({
      consultationId: claimed._id,
      userId: req.user.id,
      amount,
      currency: "INR",
      method: "DEMO_ONLINE",
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Demo payment started",
      payment: {
        _id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
    });
  } catch (err) {
    console.error("DEMO PAYMENT START ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Could not start demo payment",
    });
  }
});
/* =========================================
   DEMO ONLINE PAYMENT - COMPLETE
   Simulate SUCCESS or FAILED payment
========================================= */

router.post("/:id/demo-payment/complete", auth, async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Demo payments are disabled in production",
      });
    }

    const { paymentId, outcome } = req.body;

    if (!paymentId || !["SUCCESS", "FAILED"].includes(outcome)) {
      return res.status(400).json({
        success: false,
        message: "Valid paymentId and outcome are required",
      });
    }

    const payment = await ConsultationPayment.findOne({
      _id: paymentId,
      consultationId: req.params.id,
      userId: req.user.id,
      method: "DEMO_ONLINE",
      status: "PENDING",
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Pending demo payment not found",
      });
    }

    // Simulate a failed payment.
    // Consultation remains awaiting payment so the user can retry.
    if (outcome === "FAILED") {
      const failedPayment = await ConsultationPayment.findOneAndUpdate(
        {
          _id: payment._id,
          status: "PENDING",
        },
        {
          $set: {
            status: "FAILED",
            failureReason: "Demo payment failed",
          },
        },
        { new: true }
      );

      if (!failedPayment) {
        return res.status(409).json({
          success: false,
          message: "Payment attempt has already been processed",
        });
      }

      return res.json({
        success: false,
        paymentStatus: "FAILED",
        message: "Simulated payment failed. You can try again.",
      });
    }

    // Simulate a successful payment.
    const transactionReference =
      "DEMO-" + crypto.randomBytes(12).toString("hex").toUpperCase();

    const successfulPayment =
      await ConsultationPayment.findOneAndUpdate(
        {
          _id: payment._id,
          status: "PENDING",
        },
        {
          $set: {
            status: "SUCCESS",
            transactionReference,
            failureReason: null,
          },
        },
        { new: true }
      );

    if (!successfulPayment) {
      return res.status(409).json({
        success: false,
        message: "Payment attempt has already been processed",
      });
    }

    // Confirm only the consultation linked to this successful attempt.
    const updatedConsultation = await Consultation.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        status: "AWAITING_PAYMENT",
        paymentStatus: "PENDING",
        paymentMethod: "DEMO_ONLINE",
      },
      {
        $set: {
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentReference: transactionReference,
        },
      },
      { new: true }
    );

    if (!updatedConsultation) {
      // Revert this demo attempt if the consultation could not be confirmed.
      await ConsultationPayment.updateOne(
        {
          _id: successfulPayment._id,
          status: "SUCCESS",
        },
        {
          $set: {
            status: "FAILED",
            failureReason: "Consultation could not be confirmed",
          },
          $unset: {
            transactionReference: 1,
          },
        }
      );

      return res.status(409).json({
        success: false,
        message: "Consultation could not be confirmed. Please refresh and try again.",
      });
    }

    return res.json({
      success: true,
      paymentStatus: "SUCCESS",
      message: "Demo payment successful. Your appointment is confirmed.",
      transactionReference,
      consultation: updatedConsultation,
    });
  } catch (err) {
    console.error("DEMO PAYMENT COMPLETE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Could not complete demo payment",
    });
  }
});


module.exports = router;
