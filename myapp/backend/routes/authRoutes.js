const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Doctor = require("../models/Doctor");

// ✅ IMPORT CONTROLLER
const {
  userLogin,
  sellerLogin,
  doctorLogin,
  registerUser,
  registerDoctor,   // ✅ ADDED
  registerSeller,   // ✅ ADDED
} = require("../controllers/authController");

const OTP_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes

// Temporary store (DEV MODE)
let otpStore = {};

// ==========================
// 📧 EMAIL / PASSWORD LOGIN
// ==========================
router.post("/user/login", userLogin);
router.post("/seller/login", sellerLogin);
router.post("/doctor/login", doctorLogin);

// ==========================
// 📝 REGISTER (EXISTING - KEEP)
// ==========================
router.post("/register", registerUser);

// ==========================
// 🆕 NEW ROLE-BASED REGISTER
// ==========================
router.post("/register/user", registerUser);
router.post("/register/doctor", registerDoctor);
router.post("/register/seller", registerSeller);

// ==========================
// 📱 SEND OTP
// ==========================
router.post("/send-otp", async (req, res) => {
  const { phone, role } = req.body;

  if (!phone || !role) {
    return res.status(400).json({ message: "Phone and role are required" });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  otpStore[phone] = {
    otp,
    role,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  };

  console.log(`🔐 OTP for ${phone}: ${otp}`);

  res.json({ success: true, message: "OTP sent (check console)" });
});

// ==========================
// 📱 VERIFY OTP
// ==========================
router.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone and OTP required" });
  }

  const stored = otpStore[phone];
  if (!stored) {
    return res.status(400).json({ message: "OTP expired or not found" });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({ message: "Incorrect OTP" });
  }

  if (Date.now() > stored.expiresAt) {
    return res.status(400).json({ message: "OTP expired" });
  }

  let account;

  if (stored.role === "seller") {
    account = await User.findOne({ phone });
    if (!account) account = await User.create({ phone, role: "seller" });
  } else if (stored.role === "doctor") {
    account = await Doctor.findOne({ phone });
    if (!account) account = await Doctor.create({ phone });
  } else {
    account = await User.findOne({ phone });
    if (!account) account = await User.create({ phone, role: "user" });
  }

  const token = jwt.sign(
    { id: account._id, role: stored.role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  delete otpStore[phone];

  res.json({
    success: true,
    user: account,
    token,
  });
});

module.exports = router;
