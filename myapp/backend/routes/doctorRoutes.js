const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");

const Doctor = require("../models/Doctor");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

/* ============================
   DOCTOR REGISTER (SIGNUP)
============================ */
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
      experience,
      hospital,
      city,
      state,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !specialization ||
      !experience ||
      !hospital
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: "Doctor already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await Doctor.create({
      name,
      email,
      password: hashedPassword,
      specialization,
      experience,
      hospital,
      city,
      state,
      role: "doctor",
    });

    res.status(201).json({
      success: true,
      message: "Doctor registered successfully",
      doctorId: doctor._id,
    });
  } catch (err) {
    console.error("Doctor register error:", err);
    res.status(500).json({ message: "Doctor registration failed" });
  }
});

/* ============================
   GET ALL DOCTORS
============================ */
router.get("/", protect, async (req, res) => {
  try {
    const { city, state } = req.query;

    let filter = { isActive: true };

    if (process.env.NODE_ENV === "production") {
      filter.isVerified = true;
    }

    if (city) filter.city = city;
    if (!city && state) filter.state = state;

    const doctors = await Doctor.find(filter)
      .select("-password")
      .sort({ availability: -1 });

    const formattedDoctors = doctors.map((doc) => {
      const doctor = doc.toObject();

      return {
        ...doctor,
        chatPrice: doctor.adminOverride?.chatPrice ?? doctor.chatPrice,
        chatDuration: doctor.adminOverride?.chatDuration ?? doctor.chatDuration,
        consultationFee:
          doctor.adminOverride?.consultationFee ?? doctor.consultationFee,
        consultationDuration:
          doctor.adminOverride?.consultationDuration ??
          doctor.consultationDuration,
        hospitalConsultationType:
          doctor.adminOverride?.hospitalConsultationType ?? "paid",
      };
    });

    res.json(formattedDoctors);
  } catch (err) {
    console.error("Doctor fetch error:", err);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});


/* ============================
   GET DOCTOR PROFILE
============================ */
router.get(
  "/profile",
  protect,
  allowRoles("doctor"),
  async (req, res) => {
    try {
      const doctor = await Doctor.findById(req.user._id).select("-password");

      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      res.json(doctor);
    } catch (err) {
      console.error("Get doctor profile error:", err);
      res.status(500).json({ message: "Failed to load profile" });
    }
  }
);

/* ============================
   UPDATE DOCTOR PROFILE
============================ */
router.put(
  "/profile",
  protect,
  allowRoles("doctor"),
  async (req, res) => {
    try {
      const { name, specialization, experience, hospital } = req.body;

      const doctor = await Doctor.findById(req.user._id);

      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      if (name) doctor.name = name;
      if (specialization) doctor.specialization = specialization;
      if (experience !== undefined) doctor.experience = experience;
      if (hospital) doctor.hospital = hospital;

      await doctor.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        doctor,
      });
    } catch (err) {
      console.error("Update doctor profile error:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
);

/* ============================
   UPDATE AVAILABILITY
============================ */
router.patch(
  "/availability",
  protect,
  allowRoles("doctor"),
  async (req, res) => {
    try {
      const { availability } = req.body;

      await Doctor.findByIdAndUpdate(req.user._id, { availability });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Availability update failed" });
    }
  }
);

/* ============================
   UPLOAD DOCTOR AVATAR
============================ */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      `doctor-${req.user._id}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });

router.post(
  "/profile/avatar",
  protect,
  allowRoles("doctor"),
  upload.single("avatar"),
  async (req, res) => {
    try {
      const doctor = await Doctor.findById(req.user._id);

      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      doctor.avatar = `/uploads/${req.file.filename}`;
      await doctor.save();

      res.json({
        success: true,
        avatar: doctor.avatar,
      });
    } catch (err) {
      console.error("Avatar upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

/* ============================
   GET DOCTOR SLOTS
============================ */
router.get("/:doctorId/slots", protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const slots = [];

    if (!doctor.availabilitySlots || doctor.availabilitySlots.length === 0) {
      for (let i = 9; i < 18; i++) {
        slots.push(`${i}:00`, `${i}:30`);
      }
    } else {
      doctor.availabilitySlots.forEach((s) => {
        let start = parseInt(s.start.split(":")[0]);
        let end = parseInt(s.end.split(":")[0]);

        for (let i = start; i < end; i++) {
          slots.push(`${i}:00`, `${i}:30`);
        }
      });
    }

    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: "Failed to load slots" });
  }
});

/* ============================
   ✅ FIXED UPDATE PRICING
============================ */
router.put(
  "/update-pricing",
  protect,
  allowRoles("doctor"),
  async (req, res) => {
    try {
      const {
        chatPrice,
        chatDuration,
        consultationFee,
        consultationDuration,
        hospitalConsultationType,
      } = req.body;

      const updatedDoctor = await Doctor.findByIdAndUpdate(
        req.user._id,
        {
          ...(chatPrice !== undefined && { chatPrice }),
          ...(chatDuration !== undefined && { chatDuration }),
          ...(consultationFee !== undefined && { consultationFee }),
          ...(consultationDuration !== undefined && { consultationDuration }),
          ...(hospitalConsultationType && { hospitalConsultationType }),
        },
        { new: true }
      );

      if (!updatedDoctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      res.json({
        success: true,
        message: "Pricing updated successfully",
        doctor: updatedDoctor,
      });
    } catch (err) {
      console.error("UPDATE PRICING ERROR:", err);
      res.status(500).json({
        message: "Failed to update pricing",
      });
    }
  }
);

module.exports = router;