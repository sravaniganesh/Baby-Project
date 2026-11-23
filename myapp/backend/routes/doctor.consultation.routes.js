
const express = require("express");
const router = express.Router();

const doctorAuth = require("../middleware/auth");

const Consultation = require("../models/Consultation");
const DoctorAvailability = require("../models/DoctorAvailability");

const TIME_ZONE = "Asia/Kolkata";
const MAX_PROPOSED_SLOTS = 3;
const ALTERNATIVE_DAYS = 7;

const OCCUPIED_STATUSES = [
  "REQUESTED",
  "SLOT_PROPOSED",
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "IN_PROGRESS",
];

/* =========================
   IST DATE/TIME HELPERS
========================= */

const getISTDateKey = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}`;
};

const getDayOfWeek = (dateKey) => {
  return new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
};

const addDaysToDateKey = (dateKey, days) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
};

const createISTDateTime = (dateKey, time) => {
  return new Date(`${dateKey}T${time}:00+05:30`);
};

const timeToMinutes = (time) => {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    remainingMinutes
  ).padStart(2, "0")}`;
};

const formatTime12Hour = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${String(displayHour).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")} ${period}`;
};

const formatDate12HourResponse = (slot) => ({
  scheduledAt: slot.scheduledAt,
  slotTime: slot.slotTime,
  displayTime: formatTime12Hour(slot.slotTime),
});

const getAuthenticatedDoctorId = (req) => {
  if (req.user?.role !== "doctor") {
    return null;
  }

  return req.user?.doctorId || req.user?.id || null;
};
/* =========================
   GET DOCTOR CONSULTATIONS
========================= */

router.get("/my", doctorAuth, async (req, res) => {
  try {
    const doctorId = getAuthenticatedDoctorId(req);

    if (!doctorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const consultations = await Consultation.find({
      doctorId,
    })
      .populate("userId", "name email phone")
      .populate("hospitalId", "name city state address")
      .sort({ createdAt: -1 });

    return res.json(consultations);
  } catch (err) {
    console.error("DOCTOR CONSULTATIONS ERROR:", err);

    return res.status(500).json({
      message: "Failed to load consultations",
    });
  }
});

/* =========================
   PROPOSE HOSPITAL SLOTS
   Generate up to 3 real available slots
   using hospital-specific availability.
========================= */

/* =========================
   PROPOSE HOSPITAL SLOTS
   Doctor manually enters up to 3 exact times.
========================= */

router.patch("/:id/propose-slot", doctorAuth, async (req, res) => {
  try {
    const doctorId = getAuthenticatedDoctorId(req);

    if (!doctorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        message: "Consultation not found",
      });
    }

    if (consultation.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (consultation.consultationType !== "hospital") {
      return res.status(400).json({
        message: "Slot proposals are only for hospital consultations",
      });
    }

    if (consultation.status !== "REQUESTED") {
      return res.status(400).json({
        message: "This consultation cannot receive a slot proposal",
      });
    }

    if (!consultation.hospitalId || !consultation.preferredDate) {
      return res.status(400).json({
        message: "Hospital or preferred date information is missing",
      });
    }

    const { slotTimes } = req.body;

    if (
      !Array.isArray(slotTimes) ||
      slotTimes.length < 1 ||
      slotTimes.length > 3
    ) {
      return res.status(400).json({
        message: "Please provide between 1 and 3 appointment times",
      });
    }

    const uniqueTimes = [...new Set(slotTimes)];

    if (uniqueTimes.length !== slotTimes.length) {
      return res.status(400).json({
        message: "Duplicate appointment times are not allowed",
      });
    }

    const preferredDateKey = getISTDateKey(
      new Date(consultation.preferredDate)
    );

    const now = new Date();
    const availableSlots = [];

    for (const slotTime of uniqueTimes) {
      if (
        typeof slotTime !== "string" ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(slotTime)
      ) {
        return res.status(400).json({
          message: "Invalid time. Use 24-hour HH:mm format",
        });
      }

      const scheduledAt = createISTDateTime(
        preferredDateKey,
        slotTime
      );

      if (scheduledAt <= now) {
        return res.status(400).json({
          message: "All proposed appointment times must be in the future",
        });
      }

      const existing = await Consultation.findOne({
        _id: { $ne: consultation._id },
        doctorId,
        hospitalId: consultation.hospitalId,
        scheduledAt,
        slotTime,
        status: { $in: OCCUPIED_STATUSES },
      }).select("_id");

      if (existing) {
        return res.status(409).json({
          message: `The appointment time ${slotTime} is already occupied`,
        });
      }

      availableSlots.push({
        scheduledAt,
        slotTime,
      });
    }

    // Atomic claim: only the doctor OR assistant can win this request.
const updatedConsultation = await Consultation.findOneAndUpdate(
  {
    _id: consultation._id,
    doctorId,
    status: "REQUESTED",
  },
  {
    $set: {
      proposedSlots: availableSlots,
      proposedAt: availableSlots[0].scheduledAt,
      proposedBy: "doctor",
      status: "SLOT_PROPOSED",
    },
  },
  { new: true, runValidators: true }
);

if (!updatedConsultation) {
  return res.status(409).json({
    success: false,
    message:
      "Appointment times have already been proposed by the doctor or assistant. Please refresh the consultations list.",
  });
}

return res.json({
  success: true,
  message: "Appointment times sent to the user",
  consultation: updatedConsultation,
  availableSlots: availableSlots.map(
    formatDate12HourResponse
  ),
});
  } catch (err) {
    console.error("PROPOSE SLOT ERROR:", err);

    return res.status(500).json({
      message: "Failed to send appointment times",
    });
  }
});


/* =========================
   ACCEPT CONSULTATION
========================= */

router.patch("/:id/accept", doctorAuth, async (req, res) => {
  try {
    const doctorId = getAuthenticatedDoctorId(req);

    if (!doctorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        message: "Consultation not found",
      });
    }

    if (consultation.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (consultation.status !== "REQUESTED") {
      return res.status(400).json({
        message: "This consultation is not awaiting doctor acceptance",
      });
    }

    // Flexible hospital requests must receive a proposed slot first.
    if (
      consultation.consultationType === "hospital" &&
      (!consultation.scheduledAt || !consultation.slotTime)
    ) {
      return res.status(400).json({
        message: "Please propose an appointment date and time first",
      });
    }

    // Doctor acceptance is not the same as final confirmation.
    // User payment selection/acceptance happens afterward.
    if (consultation.consultationFee > 0) {
      consultation.status = "AWAITING_PAYMENT";
      consultation.paymentStatus = "PENDING";
    } else {
      consultation.status = "CONFIRMED";
      consultation.paymentStatus = "FREE";
    }

    // Do not create a Chat here.
    // Video access is enabled only after successful payment.
    await consultation.save();

    return res.json({
      success: true,
      message:
        consultation.status === "AWAITING_PAYMENT"
          ? "Doctor accepted the request. Awaiting user payment."
          : "Free consultation confirmed",
      consultation,
    });
  } catch (err) {
    console.error("ACCEPT CONSULTATION ERROR:", err);

    return res.status(500).json({
      message: "Failed to accept consultation",
    });
  }
});

/* =========================
   REJECT CONSULTATION
========================= */

router.patch("/:id/reject", doctorAuth, async (req, res) => {
  try {
    const doctorId = getAuthenticatedDoctorId(req);

    if (!doctorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        message: "Consultation not found",
      });
    }

    if (consultation.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (!["REQUESTED", "SLOT_PROPOSED"].includes(consultation.status)) {
      return res.status(400).json({
        message: "This consultation can no longer be rejected",
      });
    }

    consultation.status = "REJECTED";

    await consultation.save();

    return res.json({
      success: true,
      message: "Consultation rejected",
      consultation,
    });
  } catch (err) {
    console.error("REJECT CONSULTATION ERROR:", err);

    return res.status(500).json({
      message: "Failed to reject consultation",
    });
  }
});

/* =========================
   START CONSULTATION
========================= */

router.patch("/:id/start", doctorAuth, async (req, res) => {
  try {
    const doctorId = getAuthenticatedDoctorId(req);

    if (!doctorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        message: "Consultation not found",
      });
    }

    if (consultation.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (consultation.status !== "CONFIRMED") {
      return res.status(400).json({
        message: "Only confirmed consultations can be started",
      });
    }

    if (
      consultation.consultationType === "video" &&
      consultation.paymentStatus !== "PAID" &&
      consultation.paymentStatus !== "FREE"
    ) {
      return res.status(403).json({
        message: "Video consultation payment is not completed",
      });
    }

    if (
      consultation.consultationType === "video" &&
      !consultation.chatId
    ) {
      return res.status(403).json({
        message: "Video access is not enabled yet",
      });
    }

    consultation.status = "IN_PROGRESS";

    await consultation.save();

    return res.json({
      success: true,
      message: "Consultation started",
      consultation,
    });
  } catch (err) {
    console.error("START CONSULTATION ERROR:", err);

    return res.status(500).json({
      message: "Failed to start consultation",
    });
  }
});

/* =========================
   COMPLETE CONSULTATION
========================= */

router.patch("/:id/complete", doctorAuth, async (req, res) => {
  try {
    
    const { doctorNotes, prescription } = req.body;

    if (!doctorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        message: "Consultation not found",
      });
    }

    if (consultation.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (consultation.status !== "IN_PROGRESS") {
      return res.status(400).json({
        message: "Only an ongoing consultation can be completed",
      });
    }

    consultation.status = "COMPLETED";
    consultation.doctorNotes = doctorNotes || "";
    consultation.prescription = prescription || "";

    await consultation.save();

    return res.json({
      success: true,
      message: "Consultation completed",
      consultation,
    });
  } catch (err) {
    console.error("COMPLETE CONSULTATION ERROR:", err);

    return res.status(500).json({
      message: "Failed to complete consultation",
    });
  }
});

module.exports = router;
