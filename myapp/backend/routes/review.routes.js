const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const ShopOrder = require("../models/ShopOrder");
const ShopProduct = require("../models/ShopProduct");
const ProductReview = require("../models/ProductReview");


/* =====================================================
   ADD REVIEW (Only after order)
===================================================== */
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, orderId, rating, comment } = req.body;

    if (!productId || !orderId || !rating) {
      return res.status(400).json({ message: "Missing fields" });
    }

    /* ✅ Check order belongs to user */
    const order = await ShopOrder.findOne({
      _id: orderId,
      userId,
      "items.productId": productId,
    });

    if (!order) {
      return res
        .status(403)
        .json({ message: "You have not purchased this product" });
    }

    /* ✅ Prevent duplicate review */
    const existing = await Review.findOne({
      productId,
      userId,
      orderId,
    });

    if (existing) {
      return res.status(400).json({ message: "Already reviewed" });
    }

    /* ✅ Save review */
    const review = await Review.create({
      productId,
      userId,
      orderId,
      rating,
      comment,
    });

    /* ✅ Update product rating */
    const product = await ShopProduct.findById(productId);

    const newRatingCount = product.ratingCount + 1;
    const newRating =
      (product.rating * product.ratingCount + rating) /
      newRatingCount;

    product.rating = Number(newRating.toFixed(1));
    product.ratingCount = newRatingCount;

    await product.save();

    res.json({ success: true, review });
  } catch (err) {
    console.error("ADD REVIEW ERROR:", err);
    res.status(500).json({ message: "Failed to add review" });
  }
});

/* =====================================================
   GET REVIEWS FOR PRODUCT
===================================================== */
router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({
      productId: req.params.productId,
    })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch {
    res.status(500).json({ message: "Failed to load reviews" });
  }
});

module.exports = router;
