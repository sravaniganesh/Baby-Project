const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("AUTH HEADER:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Admin auth required",
      });
    }

    const token = authHeader.split(" ")[1];

    /* =========================
       JWT SECRET SAFETY CHECK
    ========================== */

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not configured in environment");
      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("DECODED ADMIN TOKEN:", decoded);

    /* =========================
       ROLE VALIDATION
    ========================== */

    if (!decoded.role || decoded.type !== "ADMIN") {
      return res.status(403).json({
        message: "Not authorized as admin",
      });
    }

    const adminId = decoded.id || decoded.adminId;

    const admin = await Admin.findById(adminId);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        message: "Admin access denied",
      });
    }

    /* =========================
       ATTACH ADMIN TO REQUEST
    ========================== */

    req.admin = {
      id: admin._id,
      role: admin.role,
      email: admin.email,
    };

    next();
  } catch (err) {
    console.error("ADMIN AUTH ERROR FULL:", err);

    res.status(401).json({
      message: "Invalid admin token",
    });
  }
};