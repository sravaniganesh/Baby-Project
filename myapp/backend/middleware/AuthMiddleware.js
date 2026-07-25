const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Doctor = require("../models/Doctor");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const id = decoded.id || decoded._id;

      // ✅ CHECK USER FIRST
      let account = await User.findById(id).select("-password");

      // ===============================
      // USER ACTIVITY TRACKING (NEW)
      // ===============================
      if (account) {
        account.lastActiveAt = new Date();

        account.activityStats = account.activityStats || {};
account.activityStats.lastActiveHour = new Date().getHours();

        // Save without blocking request
        account.save().catch((err) =>
          console.error("Activity update error:", err.message)
        );
      }

      // ✅ IF NOT USER → CHECK DOCTOR
      if (!account) {
        account = await Doctor.findById(id).select("-password");
      }

      if (!account) {
        return res.status(401).json({ message: "Account not found" });
      }

      req.user = account;

      next();
    } catch (error) {
      console.error("Auth error:", error.message);
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

module.exports = protect;