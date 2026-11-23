
const express = require("express");
const router = express.Router();

const doctorAuth = require("../middleware/auth");

const DoctorAvailability = require("../models/DoctorAvailability");
const Notify = require("../models/NotifyRequest");
const DoctorHospital = require("../models/DoctorHospital");

/* =========================
   SET DOCTOR AVAILABILITY
========================= */

router.post("/", doctorAuth, async (req, res) => {
  try {
    const {
      hospitalId,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration,
    } = req.body;

    // Validate doctor-hospital association
    if (hospitalId) {
      const doctorHospital = await DoctorHospital.findOne({
        doctorId: req.doctor.id,
        hospitalId,
        status: "approved",
        isActive: true,
      });

      if (!doctorHospital) {
        return res.status(403).json({
          success: false,
          message: "You are not approved to consult at this hospital.",
        });
      }
    }

    // Create availability
    const availability = await DoctorAvailability.create({
      doctorId: req.doctor.id,
      hospitalId: hospitalId || null,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration,
    });

    /* =====================================
       NOTIFY USERS
    ===================================== */

    try {
      const notifyUsers = await Notify.find({
        doctorId: req.doctor.id,
        notified: { $ne: true },
      });

      const io = req.app.get("io");

      for (const n of notifyUsers) {
        // Real-time notification
        if (io) {
          io.to(n.userId.toString()).emit("slotAvailable", {
            doctorId: req.doctor.id,
          });
        }

        // Mark as notified
        n.notified = true;
        await n.save();
      }
    } catch (notifyErr) {
      console.error("NOTIFY ERROR:", notifyErr);
    }

    res.json({
      success: true,
      availability,
    });

  } catch (err) {
    console.error("SET AVAILABILITY ERROR:", err);

    res.status(500).json({
      message: "Failed to set availability",
    });
  }
});

/* =========================
   GET DOCTOR AVAILABILITY
========================= */

router.get("/my", doctorAuth, async (req, res) => {
  try {
    const availability = await DoctorAvailability.find({
      doctorId: req.doctor.id,
    }).populate("hospitalId", "name city");

    res.json(availability);

  } catch (err) {
    console.error("GET AVAILABILITY ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch availability",
    });
  }
});

module.exports = router;
