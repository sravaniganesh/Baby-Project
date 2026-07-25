// backend/services/notificationService.js

const Notification = require("../models/Notification");
const User = require("../models/user");
const Doctor = require("../models/Doctor"); // ✅ ADDITIVE (future doctor notifications)
const { sendPushNotification } = require("./firebaseService");
const { canSendNotification } = require("./notificationEngine");
/**
 * Create notification + emit real-time + send push
 */
exports.createNotification = async ({
  recipientId,
  recipientModel = "User",
  senderId = null,
  senderModel = "System",
  type,
  title,
  message,
  data = {},
  req,
}) => {
  try {
    // ===============================
    // 1️⃣ Create DB Notification
    // ===============================
    const user = await User.findById(recipientId);

if (!user) return null;

// Smart engine check
const allowed = await canSendNotification(user, type);

if (!allowed) {
  console.log("⚠️ Notification skipped (daily limit reached)");
  return null;
}
    const notification = await Notification.create({
      recipient: recipientId,
      recipientModel,
      sender: senderId,
      senderModel,
      type,
      title,
      message,
      data,
    });

    // ===============================
    // 2️⃣ Real-Time Socket Emit
    // ===============================
    if (req && req.app) {
      const io = req.app.get("io");

      if (io) {
        const room = `user_${recipientId}`;
        io.to(room).emit("new_notification", notification);
      }
    }

    // ===============================
    // 3️⃣ FCM PUSH NOTIFICATION
    // ===============================
    try {
      let recipientUser = null;

      // 🔹 Handle User recipient
      if (recipientModel === "User") {
        recipientUser = await User.findById(recipientId);
      }

      // 🔹 Handle Doctor recipient (future feature)
      if (recipientModel === "Doctor") {
        recipientUser = await Doctor.findById(recipientId);
      }

      // 🔹 Check if notifications are enabled
      if (
        recipientUser &&
        recipientUser.fcmToken &&
        recipientUser.notificationPreferences?.[type?.toLowerCase?.()] !== false
      ) {
        // Firebase requires string values in data payload
        const safeData = {};
        Object.keys(data || {}).forEach((key) => {
          safeData[key] = String(data[key]);
        });

        await sendPushNotification({
          token: recipientUser.fcmToken,
          title,
          body: message,
          data: safeData,
        });

        console.log(`📲 Push sent to ${recipientModel} ${recipientId}`);
      }

    } catch (err) {
      console.error("Push notification error:", err.message);
    }

    return notification;

  } catch (error) {
    console.error("Notification service error:", error);
    return null;
  }
};