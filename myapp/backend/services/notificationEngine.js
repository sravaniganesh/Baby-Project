// backend/services/notificationEngine.js

const Notification = require("../models/Notification");

/*
  Smart Notification Engine
  Prevents spam + manages priority
*/

const MAX_DAILY_NOTIFICATIONS = 3;

exports.canSendNotification = async (user, type) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await Notification.countDocuments({
      recipient: user._id,
      createdAt: { $gte: today },
    });

    // allow important notifications
    if (type === "CHAT_MESSAGE" || type === "DOCTOR_MESSAGE") {
      return true;
    }

    if (count >= MAX_DAILY_NOTIFICATIONS) {
      return false;
    }

    return true;

  } catch (err) {
    console.error("Notification Engine error:", err);
    return true;
  }
};