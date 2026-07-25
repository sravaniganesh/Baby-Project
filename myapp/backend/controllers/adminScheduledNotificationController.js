const ScheduledNotification = require("../models/ScheduledNotification");

exports.scheduleNotification = async (req, res) => {
  try {
    const { title, message, scheduledAt, womenCategory, city } = req.body;

    if (!title || !message || !scheduledAt) {
      return res.status(400).json({
        message: "Title, message and scheduledAt required",
      });
    }

    const notification = await ScheduledNotification.create({
      title,
      message,
      scheduledAt,
      womenCategory,
      city,
    });

    res.json({
      message: "Notification scheduled successfully",
      notification,
    });

  } catch (err) {
    console.error("Schedule notification error:", err);
    res.status(500).json({
      message: "Failed to schedule notification",
    });
  }
};