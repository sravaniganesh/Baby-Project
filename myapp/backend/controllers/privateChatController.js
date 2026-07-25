const PrivateChat = require("../models/PrivateChat");
const User = require("../models/user");
const { getJourneyStage } = require("../utils/journey.helper");

/* 🔔 NEW ADDITIVE */
const notificationService = require("../services/notificationService");

/* =========================================
   START OR GET PRIVATE CHAT
========================================= */
exports.startPrivateChat = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: "Target user required" });
    }

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentStage = getJourneyStage(req.user).stageKey;
    const targetStage = getJourneyStage(targetUser).stageKey;

    if (!currentStage || currentStage !== targetStage) {
      return res.status(403).json({
        message: "You can only chat with users in same life stage",
      });
    }

    let chat = await PrivateChat.findOne({
      participants: { $all: [req.user._id, targetUserId] },
    });

    if (!chat) {
      chat = await PrivateChat.create({
        participants: [req.user._id, targetUserId],
        stageKey: currentStage,
        messages: [],
      });
    }

    res.json(chat);

  } catch (error) {
    console.error("Start private chat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================================
   GET USER PRIVATE CHATS LIST
========================================= */
exports.getMyPrivateChats = async (req, res) => {
  try {
    const chats = await PrivateChat.find({
      participants: req.user._id,
    })
      .populate("participants", "name username")
      .sort({ updatedAt: -1 });

    res.json(chats);

  } catch (error) {
    console.error("Fetch private chats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================================
   GET MESSAGES OF ONE CHAT
========================================= */
exports.getPrivateChatMessages = async (req, res) => {
  try {
    const chat = await PrivateChat.findById(req.params.chatId)
      .populate("messages.sender", "name username");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(chat);

  } catch (error) {
    console.error("Fetch private chat messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================================
   SEND PRIVATE MESSAGE
========================================= */
exports.sendPrivateMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message required" });
    }

    const chat = await PrivateChat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const message = {
      sender: req.user._id,
      text: text.trim(),
    };

    chat.messages.push(message);
    chat.lastMessage = text.trim();

    await chat.save();

    /* ===============================
       🔔 PRIVATE CHAT NOTIFICATION (NEW ADDITIVE)
    =============================== */

    const recipientId = chat.participants.find(
      (id) => id.toString() !== req.user._id.toString()
    );

    if (recipientId) {
      await notificationService.createNotification({
        recipientId,
        recipientModel: "User",
        senderId: req.user._id,
        senderModel: "User",
        type: "CHAT_MESSAGE",
        title: "New message from your stage community",
        message: text.trim(),
        data: {
          chatId: chat._id,
        },
        req,
      });
    }

    res.status(201).json(message);

  } catch (error) {
    console.error("Send private message error:", error);
    res.status(500).json({ message: "Server error" });
  }
};