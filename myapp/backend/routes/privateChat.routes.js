const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  startPrivateChat,
  getMyPrivateChats,
  getPrivateChatMessages,
  sendPrivateMessage,
} = require("../controllers/privateChatController");

/* =========================================
   START PRIVATE CHAT
   POST /api/private-chat/start
========================================= */
router.post("/start", protect, startPrivateChat);

/* =========================================
   GET MY PRIVATE CHATS
   GET /api/private-chat
========================================= */
router.get("/", protect, getMyPrivateChats);

/* =========================================
   GET ONE CHAT MESSAGES
   GET /api/private-chat/:chatId
========================================= */
router.get("/:chatId", protect, getPrivateChatMessages);

/* =========================================
   SEND MESSAGE
   POST /api/private-chat/:chatId/send
========================================= */
router.post("/:chatId/send", protect, sendPrivateMessage);

module.exports = router;
