const express = require("express");
const router = express.Router();

const doctorAuth = require("../middleware/auth");

const DoctorAvailability = require("../models/DoctorAvailability");

/* 🔥 ADD THIS IMPORT */
const Notify = require("../models/NotifyRequest");

/* =========================
   SET DOCTOR AVAILABILITY
========================= */

router.post("/", doctorAuth, async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, slotDuration } = req.body;

    const availability = await DoctorAvailability.create({
      doctorId: req.doctor.id,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration,
    });

    /* =====================================
       🔥 NOTIFY USERS (ADDED BLOCK)
    ===================================== */

    try {
      const notifyUsers = await Notify.find({
        doctorId: req.doctor.id,
        notified: { $ne: true },
      });

      const io = req.app.get("io");

      for (const n of notifyUsers) {
        // 🔔 real-time notify
        if (io) {
          io.to(n.userId.toString()).emit("slotAvailable", {
            doctorId: req.doctor.id,
          });
        }

        // mark as notified
        n.notified = true;
        await n.save();
      }

    } catch (notifyErr) {
      console.error("NOTIFY ERROR:", notifyErr);
    }

    /* ===================================== */

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
  const availability = await DoctorAvailability.find({
    doctorId: req.doctor.id,
  });

  res.json(availability);
});

module.exports = router;