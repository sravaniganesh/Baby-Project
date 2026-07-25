const User = require("../models/user");
const notificationService = require("../services/notificationService");

/*
POST /api/admin/broadcast
Admin can send notification to filtered users
*/

exports.sendBroadcastNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      womenCategory,
      city,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: "Title and message required",
      });
    }

    const filter = {
      isActive: true,
    };

    if (womenCategory) {
      filter.womenCategory = womenCategory;
    }

    if (city) {
      filter.city = city;
    }

    const users = await User.find(filter).select("_id");

    let successCount = 0;

    for (const user of users) {
      await notificationService.createNotification({
        recipientId: user._id,
        recipientModel: "User",
        senderModel: "System",
        type: "ADMIN",
        title,
        message,
        data: {
          broadcast: true,
        },
        req,
      });

      successCount++;
    }

    res.json({
      message: "Broadcast sent",
      totalUsers: users.length,
      successCount,
    });

  } catch (err) {
    console.error("Broadcast notification error:", err);
    res.status(500).json({
      message: "Failed to send broadcast",
    });
  }
};