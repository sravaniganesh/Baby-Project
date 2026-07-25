const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  getStageMessages,
  sendStageMessage,
} = require("../controllers/womenStageChatController");

/**
 * GET messages for current woman's stage
 * GET /api/women-chat/messages
 */
router.get("/messages", protect, getStageMessages);

/**
 * SEND message to current woman's stage
 * POST /api/women-chat/send
 */
router.post("/send", protect, sendStageMessage);

module.exports = router;
