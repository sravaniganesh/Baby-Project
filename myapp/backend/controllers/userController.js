const User = require("../models/user");
const generateToken = require("../utils/generateToken");

/* ===============================
   GET PROFILE
   =============================== */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===============================
   UPDATE PROFILE (EXTENDED SAFELY)
   =============================== */
exports.updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    // Prevent username change via profile update
delete updates.username;
delete updates.usernameUpdatedAt;


    /* ===============================
       WOMEN LIFE STAGE LOGIC
       =============================== */

    if (updates.womenCategory) {
      // If NOT pregnant → clear pregnancy fields
      if (updates.womenCategory !== "pregnant") {
        updates.pregnancyStartDate = undefined;
        updates.expectedDeliveryDate = undefined;
        updates.pregnancyStatus = undefined;
        updates.deliveryDate = undefined;
      }

      // If NOT post pregnancy → clear baby fields
      if (updates.womenCategory !== "post_pregnancy") {
        updates.babyBirthDate = undefined;
      }
    }

    // If pregnancy start date provided → auto-calc expected delivery
    if (updates.pregnancyStartDate) {
      updates.pregnancyStatus = "pregnant";

      const startDate = new Date(updates.pregnancyStartDate);
      updates.expectedDeliveryDate = new Date(
        startDate.getTime() + 40 * 7 * 24 * 60 * 60 * 1000
      );
    }

    // If marked delivered
    if (updates.pregnancyStatus === "delivered") {
      updates.deliveryDate = updates.deliveryDate || new Date();
      updates.womenCategory = "post_pregnancy";
    }

    const user = await User.findByIdAndUpdate(
      req.user._id, // safer
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    console.error("Update Failed:", error);
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   SAVE FCM TOKEN
   =============================== */
   exports.saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token required" });
    }

    await User.findByIdAndUpdate(
      req.user._id,
      { fcmToken },
      { new: true }
    );

    res.json({ message: "FCM token saved" });

  } catch (err) {
    console.error("Save FCM error:", err);
    res.status(500).json({ message: "Failed to save FCM token" });
  }
};
/* ===============================
   UPDATE USERNAME (30 DAY RULE)
================================ */
exports.updateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        message: "Username required",
      });
    }

    const cleanUsername = username.toLowerCase().trim();

    // 🔒 Format validation (safe + modern)
    const usernameRegex = /^[a-z0-9_]{3,20}$/;

    if (!usernameRegex.test(cleanUsername)) {
      return res.status(400).json({
        message:
          "Username must be 3-20 characters and contain only letters, numbers, or underscores",
      });
    }

    // 🔎 Check duplicate (exclude current user)
    const existing = await User.findOne({
      username: cleanUsername,
      _id: { $ne: req.user._id },
    });

    if (existing) {
      return res.status(400).json({
        message: "Username already taken",
      });
    }

    // ⏳ 30 days rule
    if (req.user.usernameUpdatedAt) {
      const diff =
        Date.now() - new Date(req.user.usernameUpdatedAt).getTime();

      const days = diff / (1000 * 60 * 60 * 24);

      if (days < 30) {
        return res.status(400).json({
          message: `You can change username after ${Math.ceil(
            30 - days
          )} days`,
        });
      }
    }

    req.user.username = cleanUsername;
    req.user.usernameUpdatedAt = new Date();

    await req.user.save();

    res.json({
      message: "Username updated successfully",
      username: req.user.username,
    });
  } catch (err) {
    console.error("Username update error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
/* ===============================
   CHECK USERNAME AVAILABILITY
================================ */
exports.checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.length < 3) {
      return res.status(400).json({
        available: false,
        message: "Username too short",
      });
    }

    const cleanUsername = username.toLowerCase().trim();

    const existing = await User.findOne({
      username: cleanUsername,
      _id: { $ne: req.user._id },
    });

    if (existing) {
      return res.json({ available: false });
    }

    res.json({ available: true });

  } catch (err) {
    console.error("Username check error:", err);
    res.status(500).json({ available: false });
  }
};

