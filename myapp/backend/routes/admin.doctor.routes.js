const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const Doctor = require("../models/Doctor");

/* =====================================
   GET ALL DOCTORS
===================================== */
router.get("/", adminAuth, async (req, res) => {
  try {
    const doctors = await Doctor.find({})
      .sort({ createdAt: -1 })
      .select("-password");

    res.json(doctors);
  } catch (err) {
    console.error("ADMIN DOCTOR LIST ERROR:", err);
    res.status(500).json({ message: "Failed to load doctors" });
  }
});

/* =====================================
   GET DOCTOR DETAILS
===================================== */
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("-password");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doctor);
  } catch (err) {
    console.error("ADMIN DOCTOR DETAILS ERROR:", err);
    res.status(500).json({ message: "Failed to load doctor details" });
  }
});

/* =====================================
   VERIFY DOCTOR
===================================== */
router.patch("/:id/verify", adminAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isVerified = true;

    await doctor.save();

    res.json({
      success: true,
      message: "Doctor verified",
    });
  } catch (err) {
    console.error("ADMIN DOCTOR VERIFY ERROR:", err);
    res.status(500).json({ message: "Failed to verify doctor" });
  }
});

/* =====================================
   SUSPEND DOCTOR
===================================== */
router.patch("/:id/suspend", adminAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isActive = false;

    await doctor.save();

    res.json({
      success: true,
      message: "Doctor suspended",
    });
  } catch (err) {
    console.error("ADMIN DOCTOR SUSPEND ERROR:", err);
    res.status(500).json({ message: "Failed to suspend doctor" });
  }
});

/* =====================================
   ACTIVATE DOCTOR
===================================== */
router.patch("/:id/activate", adminAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isActive = true;

    await doctor.save();

    res.json({
      success: true,
      message: "Doctor activated",
    });
  } catch (err) {
    console.error("ADMIN DOCTOR ACTIVATE ERROR:", err);
    res.status(500).json({ message: "Failed to activate doctor" });
  }
});

/* =====================================
   🆕 ADMIN OVERRIDE PRICING
===================================== */
router.patch("/:id/pricing", adminAuth, async (req, res) => {
  try {
    const {
      chatPrice,
      chatDuration,
      consultationFee,
      consultationDuration,
      hospitalConsultationType,
    } = req.body;

    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    /* ===============================
       INIT ADMIN OVERRIDE OBJECT
    =============================== */
    if (!doctor.adminOverride) {
      doctor.adminOverride = {};
    }

    /* ===============================
       APPLY OVERRIDES (ONLY IF SENT)
    =============================== */

    if (chatPrice !== undefined) {
      doctor.adminOverride.chatPrice = chatPrice;
    }

    if (chatDuration !== undefined) {
      doctor.adminOverride.chatDuration = chatDuration;
    }

    if (consultationFee !== undefined) {
      doctor.adminOverride.consultationFee = consultationFee;
    }

    if (consultationDuration !== undefined) {
      doctor.adminOverride.consultationDuration =
        consultationDuration;
    }

    if (hospitalConsultationType !== undefined) {
      doctor.adminOverride.hospitalConsultationType =
        hospitalConsultationType;
    }

    await doctor.save();

    res.json({
      success: true,
      message: "Doctor pricing updated by admin",
      adminOverride: doctor.adminOverride,
    });
  } catch (err) {
    console.error("ADMIN PRICING UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update pricing" });
  }
});

module.exports = router;