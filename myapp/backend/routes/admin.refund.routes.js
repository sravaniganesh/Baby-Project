const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");
const ShopOrder = require("../models/ShopOrder");
const AdminLedger = require("../models/AdminLedger");
const logAudit = require("../utils/auditLogger");
const notifyAdmins = require("../utils/adminNotifier");
const emitAdminEvent = require("../utils/adminEventEmitter");

/* =====================================
   PROCESS REFUND (ADMIN ONLY)
   POST /api/admin/refund
===================================== */
router.post("/", adminAuth, allowRoles("FINANCE_ADMIN","SUPER_ADMIN"), async (req, res) => {
  try {
    const { orderItemId, refundAmount, reason } = req.body;

    if (!orderItemId || refundAmount == null) {
      return res.status(400).json({
        message: "orderItemId and refundAmount are required",
      });
    }

    const order = await ShopOrder.findOne({
      "items._id": orderItemId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = order.items.id(orderItemId);

    if (!item) {
      return res.status(404).json({ message: "Order item not found" });
    }
   

    /* =========================
       VALIDATION
    ========================== */
    if (item.status !== "DELIVERED") {
      return res.status(400).json({
        message: "Refund allowed only after delivery",
      });
    }

    if (item.isRefunded === true) {
      return res.status(400).json({
        message: "Item already refunded",
      });
    }

    const maxRefund =
      item.totalAmount || item.price * item.quantity;

    if (refundAmount > maxRefund) {
      return res.status(400).json({
        message: "Refund amount exceeds order value",
      });
    }

    /* =========================
       MARK REFUND ON ITEM
    ========================== */
    item.isRefunded = true;
    item.refundAmount = refundAmount;
    item.refundProcessedAt = new Date();
    item.returnReason = reason || "Return approved";
    item.status = "REFUNDED";

    /* =========================
       SELLER EARNING REVERSAL
    ========================== */
    if (item.isPaidToSeller === true && item.sellerEarning > 0) {
      await AdminLedger.create({
        sourceType: "SELLER_REFUND_REVERSAL",
        referenceId: item._id,
        amount: item.sellerEarning,
        direction: "DEBIT",
        description:
          "Seller earning reversed due to order refund",
        createdBy: req.admin.id,
      });
    }

    /* =========================
       PLATFORM FEE REVERSAL
    ========================== */
    if (item.platformFee > 0) {
      await AdminLedger.create({
        sourceType: "PLATFORM_FEE_REFUND",
        referenceId: item._id,
        amount: item.platformFee,
        direction: "DEBIT",
        description:
          "Platform fee reversed due to order refund",
        createdBy: req.admin.id,
      });
    }

    await order.save();
    emitAdminEvent("💰 Refund processed by admin");

    notifyAdmins("REFUND_PROCESSED", {
  message: "Refund processed",
  data: { orderItemId }
});

    /* =========================
       🧾 AUDIT LOG (ADDED)
    ========================== */
    await logAudit({
      actorType: "ADMIN",
      actorId: req.admin.id,
      action: "REFUND_PROCESSED",
      entityType: "ORDER_ITEM",
      entityId: item._id,
      metadata: {
        orderId: order._id,
        sellerId: item.sellerId,
        refundAmount,
        reason: reason || "Return approved",
      },
      req,
    });

    res.json({
      success: true,
      message: "Refund processed successfully",
      refundedAmount: refundAmount,
    });
  } catch (err) {
    console.error("ADMIN REFUND ERROR:", err);
    res.status(500).json({
      message: "Refund processing failed",
    });
  }
});

module.exports = router;
