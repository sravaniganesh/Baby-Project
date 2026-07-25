const Doctor = require("../models/Doctor");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (id) => {
  return jwt.sign({ id, role: "doctor" }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/* ================= REGISTER DOCTOR ================= */
exports.registerDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
      experience,
      hospital,
      phone,
      city,
      state,

      chatPrice,
      chatDuration,
      consultationFee,
      consultationDuration,
      hospitalConsultationType,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !specialization ||
      !experience ||
      !hospital ||
      !city
    ) {
      return res.status(400).json({
        message: "All required fields including city are required",
      });
    }

    const exists = await Doctor.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Doctor already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctorData = {
      name,
      email,
      password: hashedPassword,
      specialization,
      experience,
      hospital,
      city,
      state,
      role: "doctor",

      chatPrice: chatPrice || 0,
      chatDuration: chatDuration || 5,
      consultationFee: consultationFee || 0,
      consultationDuration: consultationDuration || 30,

      hospitalConsultationType:
        hospitalConsultationType || "paid",
    };

    if (phone && phone.trim() !== "") {
      doctorData.phone = phone;
    }

    const doctor = await Doctor.create(doctorData);

    res.status(201).json({
      token: generateToken(doctor._id),
      user: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: "doctor",
      },
    });
  } catch (error) {
    console.error("Doctor register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= LOGIN DOCTOR ================= */
exports.loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      token: generateToken(doctor._id),
      user: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: "doctor",
      },
    });
  } catch (error) {
    console.error("Doctor login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   🔥 UPDATE DOCTOR PRICING (NEW)
   PUT /doctor/update-pricing
========================================= */
exports.updateDoctorPricing = async (req, res) => {
  try {
    const doctorId = req.user?._id || req.user?.id;

    const {
      chatPrice,
      chatDuration,
      consultationFee,
      consultationDuration,
      hospitalConsultationType,
    } = req.body;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    /* ===============================
       VALIDATION
    =============================== */
    if (chatPrice !== undefined && chatPrice < 0) {
      return res.status(400).json({ message: "Invalid chat price" });
    }

    if (chatDuration !== undefined && chatDuration <= 0) {
      return res.status(400).json({ message: "Invalid chat duration" });
    }

    if (consultationFee !== undefined && consultationFee < 0) {
      return res.status(400).json({ message: "Invalid consultation fee" });
    }

    /* ===============================
       UPDATE FIELDS (ONLY IF PROVIDED)
    =============================== */
    if (chatPrice !== undefined) doctor.chatPrice = chatPrice;
    if (chatDuration !== undefined) doctor.chatDuration = chatDuration;
    if (consultationFee !== undefined)
      doctor.consultationFee = consultationFee;
    if (consultationDuration !== undefined)
      doctor.consultationDuration = consultationDuration;
    if (hospitalConsultationType !== undefined)
      doctor.hospitalConsultationType =
        hospitalConsultationType;

    await doctor.save();

    res.json({
      message: "Pricing updated successfully",
      doctor,
    });
  } catch (error) {
    console.error("Update pricing error:", error);
    res.status(500).json({ message: "Server error" });
  }
};