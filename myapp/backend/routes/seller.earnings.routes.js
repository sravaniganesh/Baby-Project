const express = require("express");
const router = express.Router();

const sellerAuth = require("../middleware/sellerAuth");
const SellerEarning = require("../models/SellerEarning");

/* =====================================
   GET SELLER EARNINGS DASHBOARD
   GET /api/seller/earnings
===================================== */
router.get("/", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;

    const earnings = await SellerEarning.find({
      sellerId,
    }).sort({ createdAt: -1 });

    let availableBalance = 0;
    let pendingBalance = 0;
    let paidBalance = 0;
    let cancelledAmount = 0;

    const items = earnings.map((e) => {
      if (e.earningStatus === "AVAILABLE") {
        availableBalance += e.sellerNetAmount;
      }

      if (e.earningStatus === "PENDING") {
        pendingBalance += e.sellerNetAmount;
      }

      if (e.earningStatus === "PAID") {
        paidBalance += e.sellerNetAmount;
      }

      if (e.earningStatus === "CANCELLED") {
        cancelledAmount += e.refundAmount || 0;
      }

      return {
        orderItemId: e.orderItemId,
        orderId: e.orderId,

        paymentMode: e.paymentMode,
        paymentStatus: e.paymentStatus,

        grossAmount: e.grossAmount,
        platformCommission: e.platformCommission,
        gstOnCommission: e.gstOnCommission,
        sellerNetAmount: e.sellerNetAmount,

        earningStatus: e.earningStatus,
        isRefunded: e.isRefunded,

        createdAt: e.createdAt,
      };
    });

    res.json({
      summary: {
        availableBalance,
        pendingBalance,
        paidBalance,
        cancelledAmount,
      },
      items,
    });
  } catch (err) {
    console.error("SELLER EARNINGS ERROR:", err);
    res.status(500).json({ message: "Failed to load seller earnings" });
  }
});

module.exports = router;
