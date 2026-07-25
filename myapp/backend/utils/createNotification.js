const Notification = require("../models/Notification");

async function createNotification({
  userType,
  userId,
  title,
  message,
  meta = {},
}) {
  try {
    await Notification.create({
      userType,
      userId,
      title,
      message,
      meta,
    });
  } catch (err) {
    console.error("NOTIFICATION CREATE ERROR:", err);
  }
}

module.exports = createNotification;
