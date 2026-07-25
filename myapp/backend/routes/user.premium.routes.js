const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const UserPremium = require("../models/UserPremium");
const notificationService = require("../services/notificationService");

/* =====================================
   1️⃣ GET USER PREMIUM STATUS
===================================== */
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const premium = await UserPremium.findOne({
      userId,
      isActive: true,
      endDate: { $gte: new Date() },
    }).sort({ endDate: -1 });

    if (!premium) {
      return res.json({
        isPremium: false,
      });
    }

    res.json({
      isPremium: true,
      planType: premium.planType,
      validTill: premium.endDate,
    });

  } catch (err) {
    console.error("PREMIUM STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to check premium status" });
  }
});

/* =====================================
   2️⃣ ACTIVATE PREMIUM
===================================== */
router.post("/activate", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planType } = req.body;

    if (!["MONTHLY", "QUARTERLY", "YEARLY"].includes(planType)) {
      return res.status(400).json({ message: "Invalid plan type" });
    }

    const days =
      planType === "MONTHLY"
        ? 30
        : planType === "QUARTERLY"
        ? 90
        : 365;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Deactivate old premiums
    await UserPremium.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    const premium = new UserPremium({
      userId,
      planType,
      amountPaid: 0,
      startDate,
      endDate,
      paymentMode: "FREE",
    });

    await premium.save();

    /* ===============================
       🔔 PREMIUM ACTIVATED NOTIFICATION
    =============================== */

    await notificationService.createNotification({
      recipientId: userId,
      recipientModel: "User",
      senderModel: "System",
      type: "PREMIUM",
      title: "Premium Activated 🎉",
      message: `Your ${planType} premium plan is now active.`,
      data: {
        premiumId: premium._id,
        validTill: endDate,
      },
      req,
    });

    res.json({
      success: true,
      message: "Premium activated",
      validTill: endDate,
    });

  } catch (err) {
    console.error("PREMIUM ACTIVATE ERROR:", err);
    res.status(500).json({ message: "Failed to activate premium" });
  }
});

module.exports = router;