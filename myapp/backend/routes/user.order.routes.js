const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const ShopOrder = require("../models/ShopOrder");
const notificationService = require("../services/notificationService");
const notifyAdmins = require("../utils/adminNotifier");
const emitAdminEvent = require("../utils/adminEventEmitter");


// ================================
// 👤 USER — MY ORDERS
// GET /api/orders/my
// ================================
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await ShopOrder.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const orderItems = [];

    for (const order of orders) {
      for (const item of order.items || []) {
        orderItems.push({
          // Existing fields — preserved
          orderItemId: item._id,
          productId: item.productId,
          title: item.title,
          sellerId: item.sellerId,
          price: item.price,
          quantity: item.quantity,
          status: item.status,
          createdAt: order.createdAt,

          // Parent order details — added
          orderId: order._id,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          paymentReference: order.paymentReference,
          paidAt: order.paidAt,
          orderTotal: order.totalAmount,

          // Additional pricing details
          itemsSubtotal: order.itemsSubtotal,
          discountAmount: order.discountAmount,
          customerDeliveryCharge: order.customerDeliveryCharge,
          platformFee: order.platformFee,
        });
      }
    }
console.log("MY ORDERS API RESPONSE:");
console.log(JSON.stringify(orderItems, null, 2));
    res.json(orderItems);
  } catch (err) {
    console.error("User orders error:", err);
    res.status(500).json({ message: "Failed to load orders" });
  }
});


// ================================
// ❌ USER — CANCEL / REFUND ORDER ITEM
// PATCH /api/orders/:orderItemId/cancel
// ================================
router.patch("/:orderItemId/cancel", authMiddleware, async (req, res) => {
  try {
    const { orderItemId } = req.params;
    const userId = req.user.id;

    const order = await ShopOrder.findOne({
      userId,
      "items._id": orderItemId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order item not found" });
    }

    const item = order.items.id(orderItemId);

    if (!item) {
      return res.status(404).json({ message: "Order item not found" });
    }

    // ❌ Prevent invalid cancellation (existing rule kept)
    if (item.status === "SHIPPED" || item.status === "CANCELLED") {
      return res.status(400).json({
        message: "Order cannot be cancelled",
      });
    }

    /* =========================
       ❌ CANCEL ORDER ITEM
    ========================== */
    item.status = "CANCELLED";
    await order.save();
/* ===============================
   🔔 USER CANCELLED ORDER → NOTIFY SELLER
=============================== */

await notificationService.createNotification({
  recipientId: item.sellerId,
  recipientModel: "User",
  senderId: userId,
  senderModel: "User",
  type: "ORDER_UPDATE",
  title: "Order Cancelled by Customer",
  message: `${item.title} has been cancelled by the customer.`,
  data: {
    orderId: order._id,
    orderItemId: item._id,
    status: item.status,
  },
  req,
});
    res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ message: "Failed to cancel order" });
  }
});

// ================================
// 🛒 USER — PLACE ORDER
// POST /api/shop/order/place
// ================================
router.post("/place", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.body;

    if (!addressId) {
      return res.status(400).json({ message: "Address required" });
    }

    const cart = await ShopOrder.findOne({
      userId,
      status: "CART",
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    cart.status = "PLACED";
    cart.addressId = addressId;
    cart.placedAt = new Date();

    cart.items.forEach((item) => {
      item.status = "PLACED";
    });

    await cart.save();
    /* ===============================
   🔔 ADMIN REAL-TIME EVENT
=============================== */

try {
  const io = req.app.get("io");

  if (io) {
    io.emit("admin_event", {
      type: "NEW_ORDER",
      message: "New order placed",
      orderId: cart._id,
    });
  }
} catch (err) {
  console.error("Admin socket emit error:", err);
}
/* ===============================
   🔔 USER PLACED ORDER → NOTIFY SELLERS
=============================== */

const uniqueSellerIds = [
  ...new Set(cart.items.map((item) => item.sellerId.toString())),
];

for (const sellerId of uniqueSellerIds) {
  await notificationService.createNotification({
    recipientId: sellerId,
    recipientModel: "User", // seller is stored in User model
    senderId: userId,
    senderModel: "User",
    type: "ORDER_UPDATE",
    title: "New Order Received",
    message: "A new order has been placed for your product.",
    data: {
      orderId: cart._id,
    },
    req,
  });
}
notifyAdmins("NEW_ORDER", {
  message: "New order placed",
  data: { orderId: cart._id }
});
    res.json({
      success: true,
      message: "Order placed successfully",
      orderId: cart._id,
    });
  } catch (err) {
    console.error("PLACE ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to place order" });
  }
});
router.patch("/:orderItemId/return", authMiddleware, async (req, res) => {
  const { orderItemId } = req.params;
  const { reason } = req.body;

  const order = await ShopOrder.findOne({
    userId: req.user.id,
    "items._id": orderItemId,
  });

  if (!order) return res.status(404).json({ message: "Order not found" });

  const item = order.items.id(orderItemId);

  if (item.status !== "DELIVERED") {
    return res.status(400).json({ message: "Return not allowed" });
  }

  item.returnRequestedAt = new Date();
  item.returnReason = reason || "No reason";

  await order.save();
  emitAdminEvent("🛒 New order placed");

  res.json({ success: true, message: "Return requested" });
});


module.exports = router;
