const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const ShopOrder = require("../models/ShopOrder");
const allowRoles = require("../middleware/adminRole");
const logAudit = require("../utils/auditLogger");

/* =====================================
   GET ALL ORDERS
   GET /api/admin/orders
===================================== */
router.get(
  "/",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"),
  async (req, res) => {
  try {
    const orders = await ShopOrder.find({})
      .populate("userId", "name email phone")
      .populate("items.productId", "title price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("ADMIN ORDER LIST ERROR:", err);
    res.status(500).json({ message: "Failed to load orders" });
  }
});

/* =====================================
   GET ORDER DETAILS
   GET /api/admin/orders/:id
===================================== */
router.get(
  "/:id",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"),
  async (req, res) => {
  try {
    const order = await ShopOrder.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("items.productId", "title price");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("ADMIN ORDER DETAILS ERROR:", err);
    res.status(500).json({ message: "Failed to load order details" });
  }
});

/* =====================================
   CANCEL ORDER ITEM (ADMIN)
   PATCH /api/admin/orders/:orderId/items/:itemId/cancel
===================================== */
router.patch(
  "/:orderId/items/:itemId/cancel",
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"),
  async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    const order = await ShopOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = order.items.id(itemId);

    if (!item) {
      return res.status(404).json({ message: "Order item not found" });
    }

    item.status = "CANCELLED";

    await order.save();

    await logAudit({
  actorType: "ADMIN",
  actorId: req.admin.id,
  action: "ORDER_ITEM_CANCELLED_BY_ADMIN",
  entityType: "ORDER_ITEM",
  entityId: item._id,
  metadata: {
    orderId: order._id,
    productId: item.productId,
  },
  req,
});

    res.json({
      success: true,
      message: "Order item cancelled",
    });
  } catch (err) {
    console.error("ADMIN ORDER CANCEL ERROR:", err);
    res.status(500).json({ message: "Failed to cancel order item" });
  }
});

/* =====================================
   FORCE REFUND (ADMIN)
   PATCH /api/admin/orders/:orderId/items/:itemId/refund
===================================== */
router.patch(
  "/:orderId/items/:itemId/refund",
  adminAuth,
  allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
  async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    const order = await ShopOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = order.items.id(itemId);

    if (!item) {
      return res.status(404).json({ message: "Order item not found" });
    }

    item.status = "REFUNDED";
    item.isRefunded = true;
    item.refundProcessedAt = new Date();

    await order.save();
    await logAudit({
  actorType: "ADMIN",
  actorId: req.admin.id,
  action: "ADMIN_FORCE_REFUND",
  entityType: "ORDER_ITEM",
  entityId: item._id,
  metadata: {
    orderId: order._id,
    productId: item.productId,
  },
  req,
});

    res.json({
      success: true,
      message: "Refund processed",
    });
  } catch (err) {
    console.error("ADMIN REFUND ERROR:", err);
    res.status(500).json({ message: "Failed to process refund" });
  }
});

module.exports = router;