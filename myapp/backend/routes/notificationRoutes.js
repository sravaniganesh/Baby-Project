// backend/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  getUnreadCount,
  clearAllNotifications,      // ✅ NEW
  deleteNotification,         // ✅ NEW
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

// protected routes
router.get("/", authMiddleware, getMyNotifications);
router.get("/unread-count", authMiddleware, getUnreadCount);
router.patch("/:id/read", authMiddleware, markAsRead);

// ===============================
// NEW ADDITIVE ROUTES
// ===============================

router.patch("/clear-all", authMiddleware, clearAllNotifications);
router.delete("/:id", authMiddleware, deleteNotification);

module.exports = router;