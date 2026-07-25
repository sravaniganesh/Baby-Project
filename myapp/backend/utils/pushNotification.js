const admin = require("firebase-admin");

const sendPushNotification = async (fcmToken, title, body) => {
  if (!fcmToken) return;

  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
  };

  try {
    await admin.messaging().send(message);
    console.log("🔔 Push notification sent");
  } catch (error) {
    console.log("❌ Push notification error:", error.message);
  }
};

module.exports = { sendPushNotification };
