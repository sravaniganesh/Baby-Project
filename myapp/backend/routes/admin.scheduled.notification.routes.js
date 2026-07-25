const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  scheduleNotification,
} = require("../controllers/adminScheduledNotificationController");

router.post("/schedule", authMiddleware, scheduleNotification);

module.exports = router;
