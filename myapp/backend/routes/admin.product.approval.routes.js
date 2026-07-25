const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");
const ShopProduct = require("../models/ShopProduct");
const logAudit = require("../utils/auditLogger");
const emitAdminEvent = require("../utils/adminEventEmitter");

/* 🆕 ADD: Notification helper */
const createNotification = require("../utils/createNotification");

/* =====================================
   GET PENDING PRODUCTS (ADMIN)
   GET /api/admin/products/pending
===================================== */
router.get("/pending", adminAuth, async (req, res) => {
  try {
    const products = await ShopProduct.find({
      approvalStatus: "PENDING",
    })
      .populate("sellerId", "businessName email sellerCategory")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error("ADMIN PENDING PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to load pending products" });
  }
});

/* =====================================
   🆕 GET APPROVED PRODUCTS
   GET /api/admin/products/approved
===================================== */
router.get("/approved", adminAuth, async (req, res) => {
  try {
    const products = await ShopProduct.find({
      approvalStatus: "APPROVED",
    })
      .populate("sellerId", "businessName email sellerCategory")
      .sort({ approvedAt: -1 });

    res.json(products);
  } catch (err) {
    console.error("ADMIN APPROVED PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to load approved products" });
  }
});

/* =====================================
   🆕 GET REJECTED PRODUCTS
   GET /api/admin/products/rejected
===================================== */
router.get("/rejected", adminAuth, async (req, res) => {
  try {
    const products = await ShopProduct.find({
      approvalStatus: "REJECTED",
    })
      .populate("sellerId", "businessName email sellerCategory")
      .sort({ updatedAt: -1 });

    res.json(products);
  } catch (err) {
    console.error("ADMIN REJECTED PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to load rejected products" });
  }
});

/* =====================================
   APPROVE PRODUCT (ADMIN)
   PATCH /api/admin/products/:id/approve
===================================== */
router.patch("/:id/approve", adminAuth, allowRoles("OPERATIONS_ADMIN","SUPER_ADMIN"), async (req, res) => {
  try {
    const product = await ShopProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.approvalStatus = "APPROVED";
    product.approvedAt = new Date();
    product.rejectionReason = null;

    await product.save();
    emitAdminEvent("✅ Product approved by admin");

    await logAudit({
  actorType: "ADMIN",
  actorId: req.admin.id,
  action: "PRODUCT_APPROVED",
  entityType: "PRODUCT",
  entityId: product._id,
  metadata: {
    title: product.title,
  },
  req,
});

    /* 🆕 NOTIFY SELLER (APPROVED) */
    await createNotification({
      userType: "SELLER",
      userId: product.sellerId,
      title: "Product Approved ✅",
      message: `Your product "${product.title}" has been approved and is now live.`,
      meta: {
        productId: product._id,
      },
    });

    res.json({
      success: true,
      message: "Product approved successfully",
    });
  } catch (err) {
    console.error("PRODUCT APPROVE ERROR:", err);
    res.status(500).json({ message: "Failed to approve product" });
  }
});

/* =====================================
   REJECT PRODUCT (ADMIN)
   PATCH /api/admin/products/:id/reject
===================================== */
router.patch("/:id/approve", adminAuth, allowRoles("OPERATIONS_ADMIN","SUPER_ADMIN"), async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason required" });
    }

    const product = await ShopProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.approvalStatus = "REJECTED";
    product.rejectionReason = reason;
    product.approvedAt = null;
    product.isActive = false;

    await product.save();

    await logAudit({
  actorType: "ADMIN",
  actorId: req.admin.id,
  action: "PRODUCT_REJECTED",
  entityType: "PRODUCT",
  entityId: product._id,
  metadata: {
    title: product.title,
    reason,
  },
  req,
});

    /* 🆕 NOTIFY SELLER (REJECTED) */
    await createNotification({
      userType: "SELLER",
      userId: product.sellerId,
      title: "Product Rejected ❌",
      message: `Your product "${product.title}" was rejected. Reason: ${reason}`,
      meta: {
        productId: product._id,
      },
    });

    res.json({
      success: true,
      message: "Product rejected",
    });
  } catch (err) {
    console.error("PRODUCT REJECT ERROR:", err);
    res.status(500).json({ message: "Failed to reject product" });
  }
});

module.exports = router;