
const Notification = require("../models/Notification");

const MAX_DAILY_NOTIFICATIONS = 3;

// These are important transactional notifications.
// They must not be blocked by the daily engagement limit.
const PRIORITY_NOTIFICATION_TYPES = [
  "ORDER_UPDATE",
  "SELLER_ORDER",
  "SYSTEM",
  "ADMIN",

  "CONSULTATION_REQUEST",
  "CONSULTATION_SLOT_PROPOSED",
  "CONSULTATION_ACCEPTED",
  "CONSULTATION_REJECTED",
  "CONSULTATION_CONFIRMED",
  "CONSULTATION_RESCHEDULED",
  "CONSULTATION_COMPLETED",
  "CONSULTATION_PAYMENT",
  "CONSULTATION_REMINDER",

  // Preserve existing behaviour.
  "CHAT_MESSAGE",
  "DOCTOR_MESSAGE",
];

exports.canSendNotification = async (
  recipient,
  type,
  recipientModel = "User"
) => {
  try {
    if (!recipient || !recipient._id) {
      return false;
    }

    // Important updates bypass the daily engagement limit.
    if (PRIORITY_NOTIFICATION_TYPES.includes(type)) {
      return true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await Notification.countDocuments({
      recipient: recipient._id,
      recipientModel,
      createdAt: { $gte: today },
    });

    if (count >= MAX_DAILY_NOTIFICATIONS) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Notification engine error:", error);

    // Preserve the existing fail-open behaviour.
    return true;
  }
};
