const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Wishlist = require("../models/Wishlist");

/* ============================
   ADD / REMOVE WISHLIST
   POST /api/wishlist/toggle
============================ */
router.post("/toggle", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const existing = await Wishlist.findOne({ userId, productId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ wished: false });
    }

    await Wishlist.create({ userId, productId });
    res.json({ wished: true });
  } catch (err) {
    res.status(500).json({ message: "Wishlist failed" });
  }
});

/* ============================
   GET USER WISHLIST
   GET /api/wishlist
============================ */
router.get("/", authMiddleware, async (req, res) => {
  const items = await Wishlist.find({ userId: req.user.id })
    .populate("productId");

  res.json(items.map((i) => i.productId));
});

module.exports = router;
