const Payment = require("../models/Payment");

/* ===============================
   💳 CREATE PAYMENT
=============================== */
exports.createPayment = async (req, res) => {
  try {
    const userId = req.user?.id;

    const { amount, type, doctorId, chatId, isExtend } = req.body;

    console.log("📥 PAYMENT BODY:", req.body);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    /* ===============================
       🛑 VALIDATION
    =============================== */
    if (!amount || amount <= 0 || !type) {
      return res.status(400).json({
        message: "Invalid payment data",
      });
    }

    /* ===============================
       💰 WALLET TOP-UP
    =============================== */
    if (type === "wallet") {
      const User = require("../models/user");

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.walletBalance += amount;
      await user.save();

      const payment = await Payment.create({
        user: userId,
        amount,
        type: "wallet",
        method: "online",
        status: "success",
      });

      return res.json({
        message: "Money added",
        walletBalance: user.walletBalance,
        payment,
      });
    }

    /* ===============================
       🛑 REQUIRE DOCTOR FOR CHAT/VIDEO
    =============================== */
    if (!doctorId) {
      return res.status(400).json({
        message: "Doctor required",
      });
    }

    /* ===============================
       💰 CREATE PAYMENT (SESSION MODEL)
    =============================== */
    const payment = await Payment.create({
      user: userId,
      doctor: doctorId,
      chat: chatId || null,
      type,
      amount,
      method: "online",
      status: "success",
      isUsed: false,
      isExtended: isExtend || false,
    });

    return res.status(201).json({
      success: true,
      payment,
    });
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ message: "Payment failed" });
  }
};

/* ===============================
   📜 USER TRANSACTIONS
=============================== */
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("doctor", "name")
      .populate("chat");

    res.status(200).json(transactions);
  } catch (err) {
    console.error("Transaction fetch error:", err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};