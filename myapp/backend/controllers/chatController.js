const Chat = require("../models/Chat");
const Payment = require("../models/Payment");
const Doctor = require("../models/Doctor");
const notificationService = require("../services/notificationService");
const mongoose = require("mongoose");

/* ===============================
   GET CHAT MESSAGES
=============================== */
exports.getChatMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctorId } = req.params;

    const chat = await Chat.findOne({
      user: userId,
      doctor: doctorId,
    });

    if (!chat) return res.json({ messages: [] });

    res.json(chat.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load messages" });
  }
};

/* ===============================
   START CHAT (SESSION BASED)
=============================== */

exports.startChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    /* ===============================
       ✅ CHECK EXISTING CHAT
    =============================== */
    let existingChat = await Chat.findOne({
      user: userId,
      doctor: doctorId,
      status: { $in: ["requested", "accepted", "active", "paused"] },
    });

    if (existingChat) {
      return res.json({ chat: existingChat });
    }

    /* ===============================
       💳 FIND UNUSED PAYMENT
    =============================== */
    const payment = await Payment.findOne({
      user: userId,
      doctor: doctorId,
      type: "chat",
      status: "success",
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(403).json({
        message: "Payment required",
      });
    }

    if (payment.amount !== doctor.chatPrice) {
      return res.status(403).json({
        message: "Invalid payment amount",
      });
    }

    // ✅ MARK USED (CRITICAL)
    payment.isUsed = true;
    await payment.save();

    /* ===============================
       🧠 CREATE CHAT
    =============================== */
    const duration = doctor.chatDuration || 5;

    const chat = await Chat.create({
      user: userId,
      doctor: doctorId,
      messages: [],
      status: "requested",
      sessionDuration: duration * 60,
      remainingTime: duration * 60,
    });

    return res.json({ chat });

  } catch (err) {
    console.error("Start chat error:", err);
    return res.status(500).json({
      message: "Failed to start chat",
    });
  }
};

/* ===============================
   DOCTOR ACCEPT CHAT
=============================== */
exports.acceptChat = async (req, res) => {
  try {
    console.log("🔥 ACCEPT API HIT");

    const doctorId = req.user?._id || req.user?.id;
    const chatId = req.params.chatId;

    if (!doctorId) {
      console.log("❌ No doctor ID in token");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      console.log("❌ Chat not found");
      return res.status(404).json({ message: "Chat not found" });
    }

   if (!chat.doctor.equals(doctorId)) {
      console.log("❌ Doctor mismatch");
      return res.status(403).json({ message: "Unauthorized doctor" });
    }

    chat.status = "accepted";
    await chat.save();

    console.log("✅ CHAT ACCEPTED");

    res.json({ success: true, chat });

  } catch (err) {
    console.error("❌ ACCEPT ERROR:", err);
    res.status(500).json({ message: "Error accepting chat" });
  }
};

/* ===============================
   SEND MESSAGE
=============================== */
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctorId, text } = req.body;

    const chat = await Chat.findOne({
      user: userId,
      doctor: doctorId,
    });

    if (!chat) {
      return res.status(400).json({ message: "Chat not started" });
    }

    if (chat.status === "ended") {
      return res.status(403).json({ message: "Chat ended" });
    }

    chat.messages.push({ sender: "user", text });
    await chat.save();

    await notificationService.createNotification({
      recipientId: doctorId,
      recipientModel: "Doctor",
      senderId: userId,
      senderModel: "User",
      type: "CHAT_MESSAGE",
      title: "New message",
      message: text,
      data: { chatId: chat._id },
      req,
    });

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

/* ===============================
   CHECK ACTIVE CHAT
=============================== */
exports.checkActiveChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctorId } = req.params;

    const chat = await Chat.findOne({
      user: userId,
      doctor: doctorId,
      status: { $in: ["requested", "accepted", "active", "paused"] },
    });

    if (!chat) {
      return res.json({
        active: false,
        chatId: null,
        status: null,
      });
    }

    return res.json({
      active: chat.status === "active",
      chatId: chat._id,
      status: chat.status, // ✅ IMPORTANT
    });

  } catch (err) {
    console.error("check chat error:", err);
    res.status(500).json({
      active: false,
      chatId: null,
      status: null,
    });
  }
};

/* ===============================
   DOCTOR CHAT REQUESTS
=============================== */

exports.getDoctorChatRequests = async (req, res) => {
  try {
    const doctorId = req.user?._id || req.user?.id;

    if (!doctorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("🔥 DOCTOR ID:", doctorId);

    const chats = await Chat.find({
      doctor: new mongoose.Types.ObjectId(doctorId),
      status: { $in: ["requested", "accepted", "active", "paused"] },
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    console.log("🔥 CHATS FOUND:", chats);

    res.json({
  success: true,
  consultations: chats.map((chat) => ({
    _id: chat._id,
    userName: chat.user?.name || "User",
    status: chat.status,
  })),
});
  } catch (err) {
    console.error("GET DOCTOR REQUESTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
/* ===============================
   💰 HANDLE SESSION PAYMENT (CHAT + VIDEO)
=============================== */
const User = require("../models/user");

exports.handleSessionPayment = async ({ chatId, type }) => {
  try {
    const chat = await Chat.findById(chatId).populate("doctor");

    if (!chat) return;

    const user = await User.findById(chat.user);

    /* ===============================
       CHAT → BLOCK BASED
    =============================== */
    if (type === "chat") {
      const price = chat.doctor.chatPrice || 0;
      const duration = chat.doctor.chatDuration || 5;

      if (user.walletBalance < price) {
        chat.status = "paused";
        await chat.save();

        const io = require("../socket").getIO();
        io.to(chatId).emit("pauseTimer");

        return;
      }

      // ✅ deduct money
      user.walletBalance -= price;
      await user.save();

      await Payment.create({
        user: user._id,
        doctor: chat.doctor._id,
        chat: chat._id,
        type: "chat",
        amount: price,
        status: "success",
        method: "wallet",
      });

      // ✅ reset timer
      chat.remainingTime = duration * 60;
      await chat.save();

      const io = require("../socket").getIO();

      io.to(chatId).emit("resumeTimer", {
        remainingTime: chat.remainingTime,
      });

      return;
    }

    /* ===============================
       VIDEO → FULL PAYMENT
    =============================== */
    if (type === "video") {
      const videoPrice = chat.doctor.videoPrice || 100;

      if (user.walletBalance < videoPrice) {
        const io = require("../socket").getIO();
        io.to(chatId).emit("videoPaymentFailed");
        return;
      }

      user.walletBalance -= videoPrice;
      await user.save();

      await Payment.create({
        user: user._id,
        doctor: chat.doctor._id,
        type: "video",
        amount: videoPrice,
        status: "success",
        method: "wallet",
      });

      const io = require("../socket").getIO();
      io.to(chatId).emit("videoPaymentSuccess");

      return;
    }

  } catch (err) {
    console.error("❌ Payment error:", err);
  }
};