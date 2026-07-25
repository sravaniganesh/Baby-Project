const express = require("express");
const router = express.Router();

const sellerAuth = require("../middleware/sellerAuth");
const ShopProduct = require("../models/ShopProduct");
const {
  uploadMiddleware,
  uploadToCloudinary,
} = require("../middleware/uploadImage");

router.get("/test", (req, res) => {
  res.json({ ok: true });
});

/* =====================================
   🔥 UPLOAD PRODUCT IMAGE (SELLER)
===================================== */
router.post(
  "/upload-image",
  sellerAuth,
  uploadMiddleware,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided",
        });
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        "shop-products"
      );

      res.json({
        success: true,
        imageUrl: result.secure_url,
      });
    } catch (err) {
      console.error("UPLOAD IMAGE ERROR:", err);
      res.status(500).json({
        success: false,
        message: "Image upload failed",
      });
    }
  }
);

/* =====================================
   1️⃣ ADD PRODUCT (SELLER)
===================================== */
router.post("/", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;

    const {
      title,
      description,
      price,          // selling price
      mrp,            // ✅ FIX: read MRP
      stock,
      images = [],
      discountPercent = 0,
      attributes = {},
      specifications,
      policies,
    } = req.body;

    if (!title || !price || stock == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🛡️ SAFETY: ensure MRP >= price if provided
    if (mrp && Number(mrp) < Number(price)) {
      return res.status(400).json({
        message: "MRP cannot be less than selling price",
      });
    }

    const product = new ShopProduct({
      sellerId,
      title,
      description,
      price,
      mrp: mrp ? Number(mrp) : undefined, // ✅ FIX: save MRP at top level
      stock,
      images,
      discountPercent,
      specifications, // 🆕 additive
      policies,       // 🆕 additive (return / replace / exchange)
      attributes,
      isActive: true,
    });

    await product.save();

    res.json({
      success: true,
      product,
    });
  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({ message: "Failed to add product" });
  }
});

/* =====================================
   2️⃣ LIST SELLER PRODUCTS
===================================== */
router.get("/", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;

    const products = await ShopProduct.find({ sellerId }).sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (err) {
    console.error("LIST PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// ================================
// 🔥 SELLER — APPLY / UPDATE OFFER
// ================================
router.patch("/:id/offer", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;
    const { id } = req.params;

    const {
      discountType,
      discountValue,
      offerStart,
      offerEnd,
      isOfferActive,
    } = req.body;

    const product = await ShopProduct.findOne({
      _id: id,
      sellerId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (isOfferActive && (!discountType || !discountValue)) {
      return res
        .status(400)
        .json({ message: "Discount type & value required" });
    }

    product.isOfferActive = isOfferActive;
    product.discountType = discountType;
    product.discountValue = discountValue;
    product.offerStart = offerStart;
    product.offerEnd = offerEnd;

    await product.save();

    res.json({
      success: true,
      message: "Offer updated successfully",
      product,
    });
  } catch (err) {
    console.error("UPDATE OFFER ERROR:", err);
    res.status(500).json({ message: "Failed to update offer" });
  }
});

/* =====================================
   3️⃣ DELETE PRODUCT (SELLER)
===================================== */
router.delete("/:id", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;
    const { id } = req.params;

    const product = await ShopProduct.findOneAndDelete({
      _id: id,
      sellerId,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found or not authorized",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

module.exports = router;
