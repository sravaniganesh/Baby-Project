const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");

const ShopOrder = require("../models/ShopOrder");
const AdminSettlement = require("../models/AdminSettlement");
const AdminLedger = require("../models/AdminLedger");
const Seller = require("../models/Seller");
const logAudit = require("../utils/auditLogger");
const notifyAdmins = require("../utils/adminNotifier");
const emitAdminEvent = require("../utils/adminEventEmitter");

/* =====================================
   CREATE SELLER SETTLEMENT (ADMIN)
   POST /api/admin/settlements
===================================== */
router.post(
  "/",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
  try {
    const {
      sellerId,
      orderItemIds,
      paymentMode,
      transactionRef,
    } = req.body;

    if (!sellerId || !orderItemIds || orderItemIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid settlement data" });
    }

    if (!paymentMode) {
      return res
        .status(400)
        .json({ message: "Payment mode required" });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const orderItemIdStrings = orderItemIds.map(id => id.toString());

    const orders = await ShopOrder.find({
      "items._id": { $in: orderItemIds },
    });

    let totalSellerEarning = 0;
    let totalPlatformFee = 0;
    const settledItemIds = [];

    orders.forEach(order => {
      order.items.forEach(item => {
        if (
          orderItemIdStrings.includes(item._id.toString()) &&
          item.status === "DELIVERED" &&
          item.isPaidToSeller !== true &&
          item.isRefunded !== true
        ) {
          totalSellerEarning += item.sellerEarning || 0;
          totalPlatformFee += item.platformFee || 0;

          item.isPaidToSeller = true;
          item.paidAt = new Date();

          settledItemIds.push(item._id);
        }
      });
    });

    if (settledItemIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid items to settle" });
    }

    /* =========================
       CREATE SETTLEMENT RECORD
    ========================== */
    const settlement = await AdminSettlement.create({
      sellerId,
      orderItemIds: settledItemIds,
      totalSellerEarning,
      totalPlatformFee,
      settlementAmount: totalSellerEarning,
      paymentMode,
      transactionRef,
      settledByAdmin: req.admin.id,
    });
    notifyAdmins("SELLER_SETTLEMENT", {
  message: "Seller payout completed",
  data: { settlementId: settlement._id }
});

    /* =========================
       LEDGER ENTRY (PLATFORM)
    ========================== */
    await AdminLedger.create({
      sourceType: "SELLER_COMMISSION",
      referenceId: settlement._id,
      amount: totalPlatformFee,
      direction: "CREDIT",
      description: `Commission from seller ${seller.businessName}`,
      createdBy: req.admin.id,
    });

    /* =========================
       SAVE ORDERS
    ========================== */
    for (const order of orders) {
      await order.save();
    }

    res.json({
      success: true,
      settlementId: settlement._id,
      settledItems: settledItemIds.length,
      totalSellerEarning,
      totalPlatformFee,
    });
  } catch (err) {
    console.error("ADMIN SETTLEMENT ERROR:", err);
    res.status(500).json({ message: "Settlement failed" });
  }
});
/* =====================================
   SELLER PENDING SETTLEMENTS
   GET /api/admin/settlements/sellers/pending
===================================== */
router.get(
  "/sellers/pending",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
    try {
      const orders = await ShopOrder.find({
        "items.isPaidToSeller": false,
        "items.status": "DELIVERED",
      })
        .populate("items.sellerId", "name email state")
        .sort({ createdAt: -1 });

      const pendingItems = [];

      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (
            item.status === "DELIVERED" &&
            item.isPaidToSeller === false
          ) {
            pendingItems.push({
              orderId: order._id,
              itemId: item._id,
              seller: item.sellerId,
              productTitle: item.productTitle,
              quantity: item.quantity,
              sellerEarning: item.sellerEarning,
              deliveredAt: item.deliveredAt,
            });
          }
        });
      });

      res.json(pendingItems);
    } catch (err) {
      console.error("SELLER PENDING ERROR:", err);
      res.status(500).json({ message: "Failed to load seller settlements" });
    }
  }
);
/* =====================================
   PAY SELLER (MARK SETTLED)
   POST /api/admin/settlements/sellers/pay
===================================== */
router.post(
  "/sellers/pay",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
    try {
      const { orderId, itemId } = req.body;

      const order = await ShopOrder.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const item = order.items.id(itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      if (item.isPaidToSeller === true) {
        return res.status(400).json({ message: "Already paid" });
      }

      item.isPaidToSeller = true;
      item.paidToSellerAt = new Date();

      await order.save();
      await order.save();

emitAdminEvent("🏪 Seller payout completed");

res.json({
  success: true,
  message: "Seller payout marked as paid",
});
      await logAudit({
  actorType: "ADMIN",
  actorId: req.admin.id,
  action: "SELLER_PAID",
  entityType: "ORDER_ITEM",
  entityId: item._id,
  metadata: {
    orderId,
    sellerId: item.sellerId,
    amount: item.sellerEarning,
  },
  req,
});


      res.json({
        success: true,
        message: "Seller payout marked as paid",
      });
    } catch (err) {
      console.error("SELLER PAY ERROR:", err);
      res.status(500).json({ message: "Failed to pay seller" });
    }
  }
);
/* =====================================
   SETTLEMENT HISTORY (PAID)
   GET /api/admin/settlements/history
===================================== */
router.get(
  "/history",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
    try {
      const settlements = await AdminSettlement.find()
        .populate("sellerId", "businessName email")
        .populate("settledByAdmin", "email")
        .sort({ createdAt: -1 });

      res.json(settlements);
    } catch (err) {
      console.error("SETTLEMENT HISTORY ERROR:", err);
      res.status(500).json({ message: "Failed to load settlement history" });
    }
  }
);


module.exports = router;
