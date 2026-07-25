const UserPremium = require("../models/UserPremium");

const premiumGuard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const activePremium = await UserPremium.findOne({
      userId,
      isActive: true,
      endDate: { $gte: new Date() },
    });

    if (!activePremium) {
      return res.status(403).json({
        success: false,
        code: "PREMIUM_REQUIRED", // ✅ important for frontend handling
        message: "Premium subscription required to chat with doctors",
      });
    }

    // ✅ premium user → allow chat
    next();
  } catch (err) {
    console.error("PREMIUM GUARD ERROR:", err);

    res.status(500).json({
      success: false,
      code: "PREMIUM_CHECK_FAILED",
      message: "Premium check failed",
    });
  }
};

module.exports = premiumGuard;
