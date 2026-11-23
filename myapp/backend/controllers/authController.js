const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Doctor = require("../models/Doctor");
const Seller = require("../models/Seller");

/* =========================================
   USER LOGIN (UNCHANGED)
========================================= */
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      role: user.role,
      user,
      token,
    });

  } catch (err) {
    console.error("User login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   SELLER LOGIN (UNCHANGED)
========================================= */
const sellerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(401).json({ message: "Seller not found" });
    }

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: seller._id, role: "seller" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      role: "seller",
      seller,
      token,
    });

  } catch (err) {
    console.error("Seller login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   DOCTOR LOGIN (UNCHANGED)
========================================= */
const doctorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(401).json({ message: "Doctor not found" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: doctor._id, role: doctor.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      role: doctor.role,
      user: doctor,
      token,
    });

  } catch (err) {
    console.error("Doctor login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   REGISTER USER (UNCHANGED)
========================================= */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, username, phone, womenCategory } = req.body;

    if (!name || !email || !password || !username || !phone || !womenCategory) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message:
          "Username must be 3-20 characters, lowercase letters, numbers or underscore only",
      });
    }

    const emailExists =
      (await User.findOne({ email })) ||
      (await Doctor.findOne({ email })) ||
      (await Seller.findOne({ email }));

    if (emailExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const phoneExists =
      (await User.findOne({ phone })) ||
      (await Doctor.findOne({ phone })) ||
      (await Seller.findOne({ phone }));

    if (phoneExists) {
      return res.status(400).json({ message: "Phone already registered" });
    }

    const usernameExists =
      (await User.findOne({ username })) ||
      (await Doctor.findOne({ username })) ||
      (await Seller.findOne({ username }));

    if (usernameExists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      username,
      phone,
      womenCategory,
      role: "user",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      success: true,
      token,
      role: user.role,
      user,
    });

  } catch (error) {
    console.error("Register user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   REGISTER DOCTOR
========================================= */
const registerDoctor = async (req, res) => {
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
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !specialization ||
      experience === undefined ||
      experience === null ||
      experience === "" ||
      !city
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const experienceValue = Number(experience);

    if (!Number.isFinite(experienceValue) || experienceValue < 0) {
      return res.status(400).json({
        message: "Please enter valid experience",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailExists =
      (await User.findOne({ email: normalizedEmail })) ||
      (await Doctor.findOne({ email: normalizedEmail })) ||
      (await Seller.findOne({ email: normalizedEmail }));

    if (emailExists) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    if (phone) {
      const phoneExists =
        (await User.findOne({ phone })) ||
        (await Doctor.findOne({ phone })) ||
        (await Seller.findOne({ phone }));

      if (phoneExists) {
        return res.status(400).json({
          message: "Phone already registered",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await Doctor.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      specialization,
      experience: experienceValue,
      hospital: hospital || "",
      phone,
      city,
      state,
      role: "doctor",
    });

    const token = jwt.sign(
      { id: doctor._id, role: doctor.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(201).json({
      success: true,
      message: "Doctor registered successfully",
      token,
      role: doctor.role,
      user: doctor,
    });

  } catch (error) {
    console.error("Register doctor error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* =========================================
   REGISTER SELLER (UNCHANGED)
========================================= */
const registerSeller = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const emailExists =
      (await User.findOne({ email })) ||
      (await Doctor.findOne({ email })) ||
      (await Seller.findOne({ email }));

    if (emailExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const seller = await Seller.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "seller",
    });

    const token = jwt.sign(
      { id: seller._id, role: seller.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      success: true,
      token,
      role: seller.role,
      seller,
    });

  } catch (error) {
    console.error("Register seller error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   EXPORT
========================================= */
module.exports = {
  userLogin,
  sellerLogin,
  doctorLogin,
  registerUser,
  registerDoctor,
  registerSeller,
};