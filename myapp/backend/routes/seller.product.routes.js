const express = require("express");
const router = express.Router();

const sellerAuth = require("../middleware/sellerAuth");
const Seller = require("../models/Seller");
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
    console.log("📸 UPLOAD IMAGE ROUTE HIT");
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
   FLOW:
   Seller Profile Completed
          ↓
       Add Product
          ↓
        PENDING
          ↓
     Admin Approval
===================================== */
router.post("/", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;

    /* =====================================
       CHECK SELLER PROFILE
    ===================================== */
    const seller = await Seller.findById(sellerId).select(
      "profileCompleted isActive"
    );

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    if (!seller.isActive) {
      return res.status(403).json({
        message: "Seller account is inactive",
      });
    }

    if (!seller.profileCompleted) {
      return res.status(403).json({
        message:
          "Please complete your seller profile before adding products",
      });
    }

    /* =====================================
       READ PRODUCT DATA
    ===================================== */
    const {
      title,
      description,
      price,
      mrp,
      stock,
      images = [],

      discountPercent = 0,

      mainCategory,
      category,
      productType,

      attributes = {},
      specifications,

      policies,

      delivery,
    } = req.body;

    /* =====================================
       REQUIRED FIELD VALIDATION
    ===================================== */
    if (!title || !mainCategory || !category || !productType) {
      return res.status(400).json({
        message:
          "Product title, main category, category and product type are required",
      });
    }

    if (price == null || Number(price) <= 0) {
      return res.status(400).json({
        message: "Valid selling price is required",
      });
    }

    if (mrp == null || Number(mrp) <= 0) {
      return res.status(400).json({
        message: "Valid MRP is required",
      });
    }

    if (Number(mrp) < Number(price)) {
      return res.status(400).json({
        message: "MRP cannot be less than selling price",
      });
    }

    if (stock == null || Number(stock) < 0) {
      return res.status(400).json({
        message: "Valid stock quantity is required",
      });
    }

    /* =====================================
       IMAGE VALIDATION
       At least one image is mandatory
    ===================================== */
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        message: "At least one product image is required",
      });
    }

    /* =====================================
       DELIVERY VALIDATION
    ===================================== */
    if (!delivery || !delivery.channel) {
      return res.status(400).json({
        message: "Delivery channel is required",
      });
    }

    if (
      delivery.weightInGrams == null ||
      Number(delivery.weightInGrams) <= 0
    ) {
      return res.status(400).json({
        message: "Valid product weight is required",
      });
    }

    /* =====================================
       CREATE PRODUCT

       New seller products always start as:

       approvalStatus = PENDING
       isActive       = false

       Admin approval will make the
       product available in the Shop.
    ===================================== */
    const product = new ShopProduct({
      sellerId,

      title,
      description: description || "",

      price: Number(price),
      mrp: Number(mrp),

      stock: Number(stock),

      images,

      discountPercent: Number(discountPercent) || 0,

      /* =====================================
         REQUIRED CATEGORY FIELDS
      ===================================== */
      mainCategory,
      category,
      productType,

      /* =====================================
         PRODUCT SPECIFICATIONS
      ===================================== */
      specifications:
        specifications ||
        attributes?.specifications ||
        {},

      /* =====================================
         SELLER POLICIES
      ===================================== */
      sellerPolicies: {
        returnable: Boolean(policies?.returnable),
        replaceable: Boolean(policies?.replaceable),
        exchangeable: Boolean(policies?.exchangeable),
      },

      /* =====================================
         DELIVERY
      ===================================== */
      delivery: {
        channel: delivery.channel,
        charge:
          delivery.charge != null
            ? Number(delivery.charge)
            : 0,
        weightInGrams: Number(delivery.weightInGrams),
      },

      /* =====================================
         PRESERVE PRODUCT ATTRIBUTES
      ===================================== */
      attributes,

      /* =====================================
         ADMIN APPROVAL
      ===================================== */
      approvalStatus: "PENDING",
      approvedBy: null,
      approvedAt: null,
      rejectionReason: "",

      /* =====================================
         IMPORTANT:
         Product is NOT LIVE until approved.
      ===================================== */
      isActive: false,
    });

    await product.save();

    res.json({
      success: true,
      message:
        "Product submitted successfully and is pending admin approval",
      product,
    });
  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);

    res.status(500).json({
      message: "Failed to add product",
    });
  }
});

/* =====================================
   2️⃣ LIST SELLER PRODUCTS
===================================== */
router.get("/", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller.id;

    const products = await ShopProduct.find({
      sellerId,
    }).sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (err) {
    console.error("LIST PRODUCTS ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

/* =====================================
   🔥 SELLER — APPLY / UPDATE OFFER
===================================== */
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
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (isOfferActive && (!discountType || !discountValue)) {
      return res.status(400).json({
        message: "Discount type & value required",
      });
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

    res.status(500).json({
      message: "Failed to update offer",
    });
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

    res.status(500).json({
      message: "Failed to delete product",
    });
  }
});

module.exports = router;