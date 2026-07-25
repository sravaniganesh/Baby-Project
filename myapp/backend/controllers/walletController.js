const User = require("../models/user");
const Payment = require("../models/Payment");

/* ===============================
   💰 GET WALLET BALANCE
=============================== */
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      balance: user.walletBalance || 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wallet" });
  }
};

/* ===============================
   ➕ ADD MONEY (MOCK)
=============================== */
exports.addMoney = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.user._id);

    user.walletBalance += amount;
    await user.save();

    // record transaction
    await Payment.create({
      user: user._id,
      type: "wallet",
      amount,
      status: "success",
      method: "online",
    });

    res.json({
      message: "Money added",
      balance: user.walletBalance,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to add money" });
  }
};