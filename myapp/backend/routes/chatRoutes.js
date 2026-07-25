const express = require("express");
const router = express.Router();

const Chat = require("../models/Chat");
const Doctor = require("../models/Doctor");
const Payment = require("../models/Payment");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const { getDoctorChatRequests, acceptChat } = require("../controllers/chatController");

/* ============================
   GET chats for doctor
============================ */
router.get(
  "/doctor",
  protect,
  allowRoles("doctor"),
  async (req, res) => {
    try {
      const chats = await Chat.find({ doctor: req.user._id })
        .populate("user", "name email")
        .sort({ updatedAt: -1 });

      res.json(chats);
    } catch (err) {
      console.error("Doctor chat fetch error:", err);
      res.status(500).json([]);
    }
  }
);

/* ============================
   GET CHAT REQUESTS (IMPORTANT)
============================ */
router.get(
  "/doctor/requests",
  protect,
  allowRoles("doctor"),
  getDoctorChatRequests
);

/* ============================
   ACCEPT CHAT (🔥 FIXED PLACE)
============================ */
router.post("/:chatId/accept", protect, allowRoles("doctor"), acceptChat);

/* ============================
   GET CHAT BY ID
============================ */
router.get("/:chatId", protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json(chat);
  } catch (err) {
    console.error("Fetch chat error:", err);
    res.status(500).json({ message: "Failed to fetch chat" });
  }
});

/* ============================
   START CHAT
============================ */
router.post(
  "/start",
  protect,
  require("../controllers/chatController").startChat
);

/* ============================
   SEND MESSAGE
============================ */
router.post("/send", protect, async (req, res) => {
  try {
    const { chatId, sender, text } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const message = {
      sender,
      text,
      createdAt: new Date(),
    };

    chat.messages.push(message);
    await chat.save();

    req.app.get("io")?.to(chatId).emit("receive_message", message);

    res.json({ success: true, message });

  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Failed to save message" });
  }
});

/* ============================
   GET MESSAGES
============================ */
router.get("/:chatId/messages", protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    res.json(chat ? chat.messages : []);
  } catch (err) {
    res.json([]);
  }
});

/* ============================
   CHECK CHAT
============================ */
router.get(
  "/check/:doctorId",
  authMiddleware,
  chatController.checkActiveChat
);

module.exports = router;