const express = require("express");
const router = express.Router();

const DoctorChat = require("../models/DoctorChat");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

// ================================
// GET chat between user & doctor
// ================================
router.get(
  "/:doctorId",
  protect,
  allowRoles("user", "doctor"),
  async (req, res) => {
    try {
      const { doctorId } = req.params;

      const chats = await DoctorChat.find({
        doctorId,
        userId: req.user._id,
      }).sort({ createdAt: 1 });

      res.json(chats);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  }
);

// ================================
// SEND message
// ================================
router.post(
  "/send",
  protect,
  allowRoles("user", "doctor"),
  async (req, res) => {
    try {
      const { doctorId, message } = req.body;

      if (!doctorId || !message) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const chat = await DoctorChat.create({
        userId: req.user._id,
        doctorId,
        senderRole: req.user.role,
        message,
      });

      res.status(201).json(chat);
    } catch (err) {
      res.status(500).json({ message: "Message send failed" });
    }
  }
);
const premiumOnly = require("../middleware/premiumMiddleware");

router.post(
  "/send",
  protect,
  allowRoles("user", "doctor"),
  premiumOnly,
  async (req, res) => {
    
  }
);

module.exports = router;
