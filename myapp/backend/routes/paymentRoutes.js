const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");
const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");
const paymentController = require("../controllers/paymentController");

/* ============================
   CREATE PAYMENT
============================ */
router.post("/create", authMiddleware, async (req, res) => {
  try {
    console.log("💰 PAYMENT API HIT");

    const { type, referenceId, amount } = req.body;

    console.log("BODY:", req.body);

    /* ============================
       🛑 BASIC VALIDATION
    ============================ */
    if (!type || !amount) {
      return res.status(400).json({
        message: "Missing fields",
      });
    }

    /* ============================
       💰 WALLET ADD MONEY
    ============================ */
    if (type === "wallet") {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      user.walletBalance += amount;
      await user.save();

      await Payment.create({
        user: req.user._id,
        amount,
        type: "wallet",
        method: "online",
        status: "success",
      });

      return res.json({
        message: "Money added",
        walletBalance: user.walletBalance,
      });
    }

    /* ============================
       🛑 REQUIRE REFERENCE
    ============================ */
    if (!referenceId) {
      return res.status(400).json({
        message: "Reference ID required",
      });
    }

    /* ============================
       💰 NORMAL PAYMENT
    ============================ */
    const payment = await Payment.create({
      user: req.user._id,
      type,
      referenceId,
      amount,
      method: "online",
      status: "success",
      isUsed: false,
    });

    res.json(payment);

  } catch (err) {
    console.error("❌ Payment error:", err.message);

    res.status(500).json({
      message: err.message,
    });
  }
});

/* ============================
   GET USER TRANSACTIONS ✅
============================ */
router.get(
  "/my-transactions",
  authMiddleware,
  paymentController.getUserTransactions
);

module.exports = router;