
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");

const Doctor = require("../models/Doctor");
const DoctorHospital = require("../models/DoctorHospital");
const Hospital = require("../models/Hospital");
const DoctorAvailability = require("../models/DoctorAvailability");
const Consultation = require("../models/Consultation");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");


/* =========================================
   GET ACTIVE HOSPITALS
========================================= */

router.get("/hospitals", protect, async (req, res) => {
  try {
    const { city, search } = req.query;

    const filter = {
      isActive: true,
    };

    if (city) {
      filter.city = {
        $regex: String(city).trim(),
        $options: "i",
      };
    }

    if (search) {
      filter.name = {
        $regex: String(search).trim(),
        $options: "i",
      };
    }

    const hospitals = await Hospital.find(filter)
      .select(
        "name hospitalType address city state country pincode logo description isVerified"
      )
      .sort({ name: 1 });

    res.json({
      success: true,
      count: hospitals.length,
      hospitals: hospitals.map((hospital) => ({
        ...hospital.toObject(),
        verificationStatus: hospital.isVerified
          ? "Verified"
          : "Not yet verified",
      })),
    });

  } catch (err) {
    console.error("HOSPITAL SEARCH ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to search hospitals",
    });
  }
});


/* =========================================
   SEARCH DOCTORS AND HOSPITALS
========================================= */

router.get("/search", protect, async (req, res) => {
  try {
    const { doctor, hospital, city, specialization } = req.query;

    if (!doctor && !hospital && !city && !specialization) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide doctor, hospital, city or specialization search.",
      });
    }

    // Escape special regex characters in user input.
    const escapeRegex = (value) =>
      String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const doctorFilter = {
      isActive: true,
    };

    if (process.env.NODE_ENV === "production") {
      doctorFilter.isVerified = true;
    }

    // Search by doctor name or email.
    if (doctor) {
      const searchRegex = escapeRegex(doctor);

      doctorFilter.$or = [
        { name: { $regex: searchRegex, $options: "i" } },
        { email: { $regex: searchRegex, $options: "i" } },
      ];
    }

    // Search by specialization.
    if (specialization) {
      doctorFilter.specialization = {
        $regex: escapeRegex(specialization),
        $options: "i",
      };
    }

    // -----------------------------------------
    // 1. FIND HOSPITAL-ASSOCIATED DOCTORS
    // -----------------------------------------

    const associationFilter = {
      status: "approved",
      isActive: true,
    };

    let matchingHospitals = [];

    if (hospital || city) {
      const hospitalFilter = {
        isActive: true,
      };

      if (hospital) {
        hospitalFilter.name = {
          $regex: escapeRegex(hospital),
          $options: "i",
        };
      }

      if (city) {
        hospitalFilter.city = {
          $regex: escapeRegex(city),
          $options: "i",
        };
      }

      matchingHospitals = await Hospital.find(hospitalFilter)
        .select("_id");

      const hospitalIds = matchingHospitals.map(
        (item) => item._id
      );

      associationFilter.hospitalId = {
        $in: hospitalIds,
      };
    }

    let associatedResults = [];

    const canSearchAssociations =
      !(hospital || city) || matchingHospitals.length > 0;

    if (canSearchAssociations) {
      // Apply doctor name/email and specialization filters
      // to hospital-associated doctors as well.
      if (doctor || specialization) {
        const matchingDoctors = await Doctor.find(doctorFilter)
          .select("_id");

        const doctorIds = matchingDoctors.map(
          (item) => item._id
        );

        associationFilter.doctorId = {
          $in: doctorIds,
        };
      }

      const associations = await DoctorHospital.find(
        associationFilter
      )
        .populate({
          path: "doctorId",
          select:
            "name specialization experience rating avatar profileImage city state isActive isVerified",
        })
        .populate({
          path: "hospitalId",
          select:
            "name city state address logo isVerified isActive",
        })
        .sort({ createdAt: -1 });

      associatedResults = associations
        .filter(
          (item) =>
            item.doctorId &&
            item.doctorId.isActive &&
            item.hospitalId &&
            item.hospitalId.isActive
        )
        .filter(
          (item) =>
            process.env.NODE_ENV !== "production" ||
            item.doctorId.isVerified
        )
        .map((item) => ({
          doctor: item.doctorId,
          hospital: {
            _id: item.hospitalId._id,
            name: item.hospitalId.name,
            city: item.hospitalId.city,
            state: item.hospitalId.state,
            address: item.hospitalId.address,
            logo: item.hospitalId.logo,
            isVerified: item.hospitalId.isVerified,
            verificationStatus: item.hospitalId.isVerified
              ? "Verified"
              : "Not yet verified",
          },
          consultationFee: item.consultationFee,
          consultationDuration: item.consultationDuration,
          bookingMode: item.bookingMode,
          doctorType: "hospital",
        }));
    }

    // -----------------------------------------
    // 2. FIND INDEPENDENT DOCTORS
    // -----------------------------------------

    let independentResults = [];

    // Hospital-specific searches should return hospital doctors only.
    if (!hospital) {
      const independentFilter = {
        ...doctorFilter,
      };

      // For city searches, use the doctor's own city.
      if (city) {
        independentFilter.city = {
          $regex: escapeRegex(city),
          $options: "i",
        };
      }

      // Exclude doctors who have any hospital relationship.
      const linkedDoctorIds = await DoctorHospital.distinct(
        "doctorId"
      );

      independentFilter._id = {
        $nin: linkedDoctorIds,
      };

      const independentDoctors = await Doctor.find(
        independentFilter
      )
        .select(
          "name specialization experience rating avatar profileImage city state consultationFee consultationDuration availability isVerified"
        )
        .sort({ name: 1 });

      independentResults = independentDoctors.map((doc) => ({
        doctor: doc,
        hospital: null,
        consultationFee: doc.consultationFee,
        consultationDuration: doc.consultationDuration,
        bookingMode: null,
        doctorType: "independent",
      }));
    }

    // -----------------------------------------
    // 3. COMBINE RESULTS
    // -----------------------------------------

    const results = [
      ...associatedResults,
      ...independentResults,
    ];

    return res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (err) {
    console.error("DOCTOR HOSPITAL SEARCH ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to search doctors and hospitals",
    });
  }
});


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

/* =========================================
   GET HOSPITAL-SPECIFIC DOCTOR SLOTS
========================================= */

router.get(
  "/hospital/:doctorId/:hospitalId/slots",
  protect,
  async (req, res) => {
    try {
      const { doctorId, hospitalId } = req.params;

      const fromDate =
        req.query.from ||
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
        }).format(new Date());

      const requestedDays = Number(req.query.days || 14);

      const days = Math.min(
        Math.max(requestedDays, 1),
        30
      );

      // Validate date
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(fromDate) ||
        Number.isNaN(
          Date.parse(`${fromDate}T00:00:00.000Z`)
        ) ||
        new Date(`${fromDate}T00:00:00.000Z`)
          .toISOString()
          .slice(0, 10) !== fromDate
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date. Use YYYY-MM-DD.",
        });
      }

      if (!Number.isInteger(requestedDays) || requestedDays < 1) {
        return res.status(400).json({
          success: false,
          message: "Days must be a positive whole number.",
        });
      }

      // Verify approved doctor-hospital association
      const doctorHospital = await DoctorHospital.findOne({
        doctorId,
        hospitalId,
        status: "approved",
        isActive: true,
      });

      if (!doctorHospital) {
        return res.status(404).json({
          success: false,
          message: "Doctor is not approved at this hospital.",
        });
      }

      // Verify hospital
      const hospitalRecord = await Hospital.findOne({
        _id: hospitalId,
        isActive: true,
      }).select("name city state");

      if (!hospitalRecord) {
        return res.status(404).json({
          success: false,
          message: "Hospital not found or inactive.",
        });
      }

      // Verify doctor
      const doctor = await Doctor.findOne({
        _id: doctorId,
        isActive: true,
        ...(process.env.NODE_ENV === "production"
          ? { isVerified: true }
          : {}),
      }).select("name specialization experience");

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found or inactive.",
        });
      }

      // Fetch schedules only for the selected hospital
      const schedules = await DoctorAvailability.find({
        doctorId,
        hospitalId,
        isActive: true,
      });

      const slots = [];
      const now = new Date();

      for (let i = 0; i < days; i++) {
        const currentDate = new Date(
          `${fromDate}T00:00:00.000Z`
        );

        currentDate.setUTCDate(
          currentDate.getUTCDate() + i
        );

        const date = currentDate.toISOString().slice(0, 10);
        const dayOfWeek = currentDate.getUTCDay();

        const daySchedules = schedules.filter(
          (schedule) => schedule.dayOfWeek === dayOfWeek
        );

        if (!daySchedules.length) continue;

        // Calculate India-local date boundaries
        const dayStart = new Date(
          `${date}T00:00:00+05:30`
        );

        const nextDay = new Date(dayStart);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        // Pending, confirmed and ongoing appointments block slots
        const bookedAppointments = await Consultation.find({
          doctorId,
          hospitalId,
          consultationType: "hospital",
          scheduledAt: {
            $gte: dayStart,
            $lt: nextDay,
          },
          status: {
            $in: [
              "REQUESTED",
              "CONFIRMED",
              "IN_PROGRESS",
            ],
          },
        }).select("slotTime");

        const bookedTimes = new Set(
          bookedAppointments.map((appointment) => appointment.slotTime)
        );

        for (const schedule of daySchedules) {
          const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

          if (
            !timePattern.test(schedule.startTime) ||
            !timePattern.test(schedule.endTime)
          ) {
            continue;
          }

          const [startHour, startMinute] =
            schedule.startTime.split(":").map(Number);

          const [endHour, endMinute] =
            schedule.endTime.split(":").map(Number);

          const startMinutes =
            startHour * 60 + startMinute;

          const endMinutes =
            endHour * 60 + endMinute;

          const duration = schedule.slotDuration || 30;

          if (
            !Number.isInteger(duration) ||
            duration <= 0 ||
            endMinutes <= startMinutes
          ) {
            continue;
          }

          for (
            let minutes = startMinutes;
            minutes + duration <= endMinutes;
            minutes += duration
          ) {
            const hour = Math.floor(minutes / 60);
            const minute = minutes % 60;

            const time =
              `${String(hour).padStart(2, "0")}:` +
              `${String(minute).padStart(2, "0")}`;

            const scheduledAt = new Date(
              `${date}T${time}:00+05:30`
            );

            if (
              scheduledAt <= now ||
              bookedTimes.has(time)
            ) {
              continue;
            }

            // Avoid duplicate slots from overlapping schedules
            const alreadyExists = slots.some(
              (slot) =>
                slot.date === date &&
                slot.time === time
            );

            if (!alreadyExists) {
              slots.push({
                date,
                time,
                scheduledAt,
              });
            }
          }
        }
      }

      slots.sort(
        (a, b) =>
          new Date(a.scheduledAt) - new Date(b.scheduledAt)
      );

      res.json({
        success: true,

        doctor: {
          _id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          experience: doctor.experience,
        },

        hospital: {
          _id: hospitalRecord._id,
          name: hospitalRecord.name,
          city: hospitalRecord.city,
          state: hospitalRecord.state,
        },

        consultationFee: doctorHospital.consultationFee,
        consultationDuration:
          doctorHospital.consultationDuration,

        bookingMode: doctorHospital.bookingMode,

        slots,
      });

    } catch (err) {
      console.error("HOSPITAL DOCTOR SLOTS ERROR:", err);

      res.status(500).json({
        success: false,
        message: "Failed to fetch hospital appointment slots.",
      });
    }
  }
);

/* ============================
   GET LEGACY DOCTOR SLOTS
   KEEP FOR EXISTING COMPATIBILITY
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
   FIXED UPDATE PRICING
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
