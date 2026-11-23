
const Notification = require("../models/Notification");
const User = require("../models/user");
const Doctor = require("../models/Doctor");

const { sendPushNotification } = require("./firebaseService");
const { canSendNotification } = require("./notificationEngine");

const getRecipientModel = (modelName) => {
  if (modelName === "Doctor") return Doctor;
  if (modelName === "User") return User;
  return null;
};

const getPreferenceKey = (type) => {
  const preferences = {
    STAGE: "stage",
    CHAT_MESSAGE: "chat",
    ORDER_UPDATE: "order",
    SELLER_ORDER: "order",
    PREMIUM: "premium",
    ADMIN: "admin",
    BROADCAST: "admin",
  };

  return preferences[type] || null;
};

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
    if (!recipientId || !type || !title || !message) {
      console.error("Notification missing required fields");
      return null;
    }

    const RecipientModel = getRecipientModel(recipientModel);

    if (!RecipientModel) {
      console.error("Unsupported notification recipient:", recipientModel);
      return null;
    }

    const recipient = await RecipientModel.findById(recipientId);

    if (!recipient) {
      console.error("Notification recipient not found:", recipientId);
      return null;
    }

    // Respect existing notification preferences.
    const preferenceKey = getPreferenceKey(type);

    if (
      preferenceKey &&
      recipient.notificationPreferences?.[preferenceKey] === false
    ) {
      console.log("Notification skipped due to user preference:", type);
      return null;
    }

    const allowed = await canSendNotification(
      recipient,
      type,
      recipientModel
    );

    if (!allowed) {
      console.log("Notification skipped by notification engine:", type);
      return null;
    }

    // Save in-app notification.
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

    // Preserve existing Socket.IO room convention.
    if (req?.app) {
      const io = req.app.get("io");

      if (io) {
        io.to(`user_${recipientId}`).emit(
          "new_notification",
          notification
        );
      }
    }

    // Collect legacy and multi-device tokens.
    const deviceTokens = [
      recipient.fcmToken,
      ...(Array.isArray(recipient.fcmTokens)
        ? recipient.fcmTokens
        : []),
    ].filter(Boolean);

    const uniqueTokens = [...new Set(deviceTokens)];

    if (uniqueTokens.length === 0) {
      console.log(
        `No FCM tokens registered for ${recipientModel} ${recipientId}`
      );

      return notification;
    }

    // FCM data values must be strings.
    const safeData = {};

    Object.keys(data || {}).forEach((key) => {
      const value = data[key];

      if (value !== undefined && value !== null) {
        safeData[key] =
          typeof value === "object"
            ? JSON.stringify(value)
            : String(value);
      }
    });

    safeData.notificationId = String(notification._id);
    safeData.notificationType = String(type);

    // Send to all registered devices.
    const pushResult = await sendPushNotification({
      tokens: uniqueTokens,
      title,
      body: message,
      data: safeData,
    });

    // Remove invalid or expired tokens from the database.
    if (
      pushResult?.invalidTokens &&
      pushResult.invalidTokens.length > 0
    ) {
      const invalidTokens = pushResult.invalidTokens;

      const update = {
        $pull: {
          fcmTokens: { $in: invalidTokens },
        },
      };

      if (
        recipient.fcmToken &&
        invalidTokens.includes(recipient.fcmToken)
      ) {
        update.$unset = {
          fcmToken: "",
        };
      }

      await RecipientModel.updateOne(
        { _id: recipientId },
        update
      );

      console.log(
        `Removed ${invalidTokens.length} invalid FCM token(s)`
      );
    }

    console.log(
      `Push result for ${recipientModel} ${recipientId}:`,
      pushResult?.successCount || 0,
      "successful"
    );

    return notification;
  } catch (error) {
    console.error("Notification service error:", error);
    return null;
  }
};
