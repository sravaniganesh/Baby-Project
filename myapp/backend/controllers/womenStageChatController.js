const WomenStageMessage = require("../models/WomenStageMessage");
const { getIO } = require("../socket");

/* =========================================
   GET MESSAGES BY STAGE (STRICT)
========================================= */
exports.getStageMessages = async (req, res) => {
  try {
    const { stageKey } = req.query;
    const user = req.user;

    if (!stageKey) {
      return res.status(400).json({ message: "stageKey required" });
    }

    // 🔒 ADDITION: Ensure user has womenCategory
    if (!user.womenCategory) {
      return res.status(403).json({
        message: "Access denied. Stage not assigned.",
      });
    }
    console.log("EMITTING TO:", `women_${stageKey}`);

    // 🔒 ADDITION: Strict stage match validation
    if (user.womenCategory !== stageKey) {
      return res.status(403).json({
        message: "Access denied. You can only access your own stage chat.",
      });
    }

    const messages = await WomenStageMessage.find({ stageKey })
      .populate("sender", "name")
      .sort({ createdAt: 1 });

    return res.json({
      stageKey,
      messages,
    });

  } catch (error) {
    console.error("Fetch women stage messages error:", error);
    res.status(500).json({ message: "Failed to load messages" });
  }
};


/* =========================================
   SEND MESSAGE (STRICT STAGE ISOLATION)
========================================= */
exports.sendStageMessage = async (req, res) => {
  try {
    const { text, stageKey } = req.body;
    const user = req.user;

    if (!stageKey) {
      return res.status(400).json({ message: "stageKey required" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text required" });
    }

    // 🔒 ADDITION: Ensure user has stage assigned
    if (!user.womenCategory) {
      return res.status(403).json({
        message: "Access denied. Stage not assigned.",
      });
    }

    // 🔒 ADDITION: Strict match
    if (user.womenCategory !== stageKey) {
      return res.status(403).json({
        message: "Access denied. You cannot send messages to another stage.",
      });
    }

    const message = await WomenStageMessage.create({
      stageKey,
      sender: user._id,
      text: text.trim(),
    });

    const populatedMessage = await message.populate("sender", "name");

    const io = getIO();

    // 🔥 Emit ONLY to that stage room
    io.to(`women_${stageKey}`).emit(
      "women:new_message",
      populatedMessage
    );

    return res.status(201).json(populatedMessage);

  } catch (error) {
    console.error("Send women stage message error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};