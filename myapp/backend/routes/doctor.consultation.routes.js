const express = require("express");
const router = express.Router();

const doctorAuth = require("../middleware/auth");

const Consultation = require("../models/Consultation");
const Chat = require("../models/Chat");

/* =========================
   GET DOCTOR CONSULTATIONS
========================= */

router.get("/my", doctorAuth, async (req, res) => {
  try {
    const doctorId = req.doctor?._id || req.doctor?.id;

    if (!doctorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const consultations = await Consultation.find({
      doctorId: doctorId,
    })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.json(consultations);
  } catch (err) {
    console.error("DOCTOR CONSULTATIONS ERROR:", err);
    res.status(500).json({
      message: "Failed to load consultations",
    });
  }
});

/* =========================
   ACCEPT CONSULTATION
========================= */

router.patch("/:id/accept", doctorAuth, async (req, res) => {
  try {
    const doctorId = req.doctor?._id || req.doctor?.id;

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        message: "Consultation not found",
      });
    }

    if (
      !doctorId ||
      consultation.doctorId.toString() !== doctorId.toString()
    ) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    /* =========================
       VIDEO → CREATE CHAT
    ========================= */

    if (consultation.consultationType === "video") {
      let chat = await Chat.findOne({
        user: consultation.userId,
        doctor: consultation.doctorId,
      });

      if (!chat) {
        chat = await Chat.create({
          user: consultation.userId,
          doctor: consultation.doctorId,
          messages: [],
          status: "accepted",
          sessionDuration: 30 * 60,
          remainingTime: 30 * 60,
        });
      }

      consultation.chatId = chat._id;
    }

    consultation.status = "CONFIRMED";

    await consultation.save();

    res.json({
      success: true,
      message: "Consultation confirmed",
      consultation,
    });
  } catch (err) {
    console.error("ACCEPT CONSULTATION ERROR:", err);
    res.status(500).json({
      message: "Failed to confirm consultation",
    });
  }
});

/* =========================
   REJECT CONSULTATION
========================= */

router.patch("/:id/reject", doctorAuth, async (req, res) => {
  try {
    const doctorId = req.doctor?._id || req.doctor?.id;

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        message: "Consultation not found",
      });
    }

    if (
      !doctorId ||
      consultation.doctorId.toString() !== doctorId.toString()
    ) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    consultation.status = "REJECTED";

    await consultation.save();

    res.json({
      success: true,
      message: "Consultation rejected",
    });
  } catch (err) {
    console.error("REJECT CONSULTATION ERROR:", err);
    res.status(500).json({
      message: "Failed to reject consultation",
    });
  }
});

/* =========================
   START CONSULTATION
========================= */

router.patch("/:id/start", doctorAuth, async (req, res) => {
  try {
    const doctorId = req.doctor?._id || req.doctor?.id;

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        message: "Consultation not found",
      });
    }

    if (
      !doctorId ||
      consultation.doctorId.toString() !== doctorId.toString()
    ) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    consultation.status = "IN_PROGRESS";

    await consultation.save();

    res.json({
      success: true,
      message: "Consultation started",
      consultation,
    });
  } catch (err) {
    console.error("START CONSULTATION ERROR:", err);
    res.status(500).json({
      message: "Failed to start consultation",
    });
  }
});

/* =========================
   COMPLETE CONSULTATION
========================= */

router.patch("/:id/complete", doctorAuth, async (req, res) => {
  try {
    const doctorId = req.doctor?._id || req.doctor?.id;

    const { doctorNotes, prescription } = req.body;

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        message: "Consultation not found",
      });
    }

    if (
      !doctorId ||
      consultation.doctorId.toString() !== doctorId.toString()
    ) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    consultation.status = "COMPLETED";
    consultation.doctorNotes = doctorNotes || "";
    consultation.prescription = prescription || "";

    await consultation.save();

    res.json({
      success: true,
      message: "Consultation completed",
      consultation,
    });
  } catch (err) {
    console.error("COMPLETE CONSULTATION ERROR:", err);
    res.status(500).json({
      message: "Failed to complete consultation",
    });
  }
});

module.exports = router;