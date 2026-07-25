const express = require("express");
const router = express.Router();

const sellerAuth = require("../middleware/sellerAuth");
const ShopOrder = require("../models/ShopOrder");
const { generateInvoicePDF } = require("../utils/invoiceGenerator");
const { sendInvoiceEmail } = require("../utils/emailService");
const User = require("../models/user");
const Seller = require("../models/Seller");
const SellerEarning = require("../models/SellerEarning"); // ✅ ADD
const notificationService = require("../services/notificationService");
/* =====================================
   1️⃣ GET SELLER ORDER ITEMS
===================================== */
router.get("/", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;

    const orders = await ShopOrder.find({
      "items.sellerId": sellerId,
    }).sort({ createdAt: -1 });

    const sellerItems = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.sellerId.toString() === sellerId) {
          sellerItems.push({
            orderId: order._id,
            orderItemId: item._id,
            productId: item.productId,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            status: item.status,
            createdAt: order.createdAt,
          });
        }
      });
    });

    res.json(sellerItems);
  } catch (err) {
    console.error("GET SELLER ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch seller orders" });
  }
});

/* =====================================
   2️⃣ ACCEPT ORDER ITEM
===================================== */
router.patch("/:orderItemId/accept", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;
    const { orderItemId } = req.params;

    const order = await ShopOrder.findOne({
      "items._id": orderItemId,
      "items.sellerId": sellerId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order item not found" });
    }

    const item = order.items.id(orderItemId);

    if (item.status !== "PLACED") {
      return res.status(400).json({ message: "Invalid order status" });
    }

    if (!item.isInvoiceGenerated) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
      const baseAmount = item.price * item.quantity;

      item.invoiceNumber = `INV-${item._id}-${dateStr}`;
      item.invoiceDate = today;
      item.taxAmount = 0;
      item.totalAmount = baseAmount;
      item.isInvoiceGenerated = true;
    }

    item.status = "ACCEPTED";
    await order.save();
    /* ===============================
   🔔 ORDER ACCEPTED → NOTIFY USER
=============================== */

await notificationService.createNotification({
  recipientId: order.userId,
  recipientModel: "User",
  senderId: sellerId,
  senderModel: "User",
  type: "ORDER_UPDATE",
  title: "Your order has been accepted",
  message: `${item.title} has been accepted by the seller.`,
  data: {
    orderId: order._id,
    orderItemId: item._id,
    status: item.status,
  },
  req,
});

    res.json({ success: true, status: item.status });
  } catch (err) {
    console.error("ACCEPT ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to accept order" });
  }
});

/* =====================================
   3️⃣ SHIP ORDER ITEM
===================================== */
router.patch("/:orderItemId/ship", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;
    const { orderItemId } = req.params;

    const order = await ShopOrder.findOne({
      "items._id": orderItemId,
      "items.sellerId": sellerId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order item not found" });
    }

    const item = order.items.id(orderItemId);

    if (item.status !== "ACCEPTED") {
      return res.status(400).json({ message: "Invalid order status" });
    }

    item.status = "SHIPPED";
    await order.save();
/* ===============================
   🔔 ORDER SHIPPED → NOTIFY USER
=============================== */

await notificationService.createNotification({
  recipientId: order.userId,
  recipientModel: "User",
  senderId: sellerId,
  senderModel: "User",
  type: "ORDER_UPDATE",
  title: "Your order has been shipped",
  message: `${item.title} is on the way 🚚`,
  data: {
    orderId: order._id,
    orderItemId: item._id,
    status: item.status,
  },
  req,
});
    res.json({ success: true, status: item.status });
  } catch (err) {
    console.error("SHIP ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to ship order" });
  }
});

/* =====================================
   4️⃣ DELIVER ORDER ITEM
   ✅ CREATE SELLER EARNING (SAFE)
===================================== */
router.patch("/:orderItemId/deliver", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;
    const { orderItemId } = req.params;

    const order = await ShopOrder.findOne({
      "items._id": orderItemId,
      "items.sellerId": sellerId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order item not found" });
    }

    const item = order.items.id(orderItemId);

    if (item.status !== "SHIPPED") {
      return res.status(400).json({
        message: "Only shipped items can be delivered",
      });
    }

    item.status = "DELIVERED";
    await order.save();
/* ===============================
   🔔 ORDER DELIVERED → NOTIFY USER
=============================== */

await notificationService.createNotification({
  recipientId: order.userId,
  recipientModel: "User",
  senderId: sellerId,
  senderModel: "User",
  type: "ORDER_UPDATE",
  title: "Order Delivered Successfully",
  message: `${item.title} has been delivered 🎉`,
  data: {
    orderId: order._id,
    orderItemId: item._id,
    status: item.status,
  },
  req,
});
    /* =========================
       💰 CREATE SELLER EARNING
    ========================== */
    const grossAmount = item.price * item.quantity;

    const platformCommission = Math.round(grossAmount * 0.05); // 5%
    const gstOnCommission = Math.round(platformCommission * 0.18); // 18%
    const sellerNetAmount =
      grossAmount - platformCommission - gstOnCommission;

    const paymentMode = order.paymentMode || "COD";

    const earning = await SellerEarning.create({
      sellerId,
      orderId: order._id,
      orderItemId: item._id,

      paymentMode,
      paymentStatus:
        paymentMode === "ONLINE" ? "COLLECTED" : "PENDING",

      itemPrice: item.price,
      quantity: item.quantity,

      grossAmount,
      platformCommission,
      gstOnCommission,
      sellerNetAmount,

      earningStatus:
        paymentMode === "ONLINE" ? "AVAILABLE" : "PENDING",
    });

    /* ======================
       📧 SEND INVOICE EMAIL
    ====================== */
    const user = await User.findById(order.userId);
    const seller = await Seller.findById(sellerId);

    if (user?.email) {
      const pdfBuffer = await generateInvoicePDF({
        invoiceNumber: item.invoiceNumber,
        invoiceDate: item.invoiceDate.toDateString(),
        user: {
          name: user.name,
          address: user.address || "—",
        },
        seller: {
          name: seller?.businessName || "Seller",
        },
        item: {
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          totalAmount: item.totalAmount,
        },
      });

      await sendInvoiceEmail({
        to: user.email,
        invoiceBuffer: pdfBuffer,
        invoiceNumber: item.invoiceNumber,
      });
    }

    res.json({
      success: true,
      status: item.status,
      sellerNetAmount,
    });
  } catch (err) {
    console.error("DELIVER ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to deliver order" });
  }
});

module.exports = router;
