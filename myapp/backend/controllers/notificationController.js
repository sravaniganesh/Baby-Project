// backend/controllers/notificationController.js
const Notification = require("../models/Notification");

/**
 * GET /api/notifications
 * Fetch notifications AND mark unread ones as read
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
      isDeleted: { $ne: true }, // ✅ ignore deleted
    })
      .sort({ createdAt: -1 })
      .limit(50);

    // 🔹 auto-mark unread notifications as read
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(), // ✅ ADDITIVE
      }
    );

    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id,
      },
      {
        isRead: true,
        readAt: new Date(), // ✅ ADDITIVE
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
};

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
      isDeleted: { $ne: true }, // ✅ ADDITIVE
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Unread notification count error:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
};

/* =====================================================
   NEW ADDITIVE FEATURES (DO NOT AFFECT EXISTING LOGIC)
   ===================================================== */

/**
 * PATCH /api/notifications/clear-all
 * Soft delete all notifications
 */
exports.clearAllNotifications = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id },
      { isDeleted: true }
    );

    res.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({ message: "Failed to clear notifications" });
  }
};

/**
 * DELETE /api/notifications/:id
 * Soft delete single notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id,
      },
      { isDeleted: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};