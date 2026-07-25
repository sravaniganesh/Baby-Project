const express = require("express");
const router = express.Router();

/* -------- Middleware -------- */
const authMiddleware = require("../middleware/authMiddleware");


/* -------- Models -------- */
const ShopProduct = require("../models/ShopProduct");
const ShopCart = require("../models/ShopCart");
const ShopOrder = require("../models/ShopOrder");






/* =====================================================
   1️⃣ GET ALL ACTIVE PRODUCTS (USER)
===================================================== */
router.get("/products", authMiddleware, async (req, res) => {

  try {
    const products = await ShopProduct.find({ isActive: true }).sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});
/* ===============================
   🔁 RELATED PRODUCTS
================================ */
router.get("/products/:id/related", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ShopProduct.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

   const related = await ShopProduct.find({
  _id: { $ne: product._id },
  "attributes.mainCategory": product.attributes?.mainCategory,
  "attributes.category": product.attributes?.category,
  approvalStatus: "APPROVED",
  isActive: true,
  stock: { $gt: 0 },
})

      .sort({
        rating: -1,
        ratingCount: -1,
        createdAt: -1,
      })
      .limit(10)
      .select("title price mrp images rating ratingCount stock");

    res.json(related);
  } catch (err) {
    res.status(500).json({ message: "Failed to load related products" });
  }
});


/* =====================================================
   2️⃣ ADD PRODUCT TO CART
===================================================== */
router.post("/cart/add", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const product = await ShopProduct.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not available" });
    }

    let cart = await ShopCart.findOne({ userId });
    if (!cart) {
      cart = new ShopCart({ userId, items: [] });
    }

    cart.items.push({
      productId: product._id,
      sellerId: product.sellerId,
      quantity,
      priceAtAddTime: product.price,
    });

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error("ADD TO CART ERROR:", err);
    res.status(500).json({ message: "Add to cart failed" });
  }
});

/* =====================================================
   3️⃣ GET USER CART
===================================================== */
router.get("/cart", authMiddleware, async (req, res) => {

  try {
    const userId = req.user.id;

    const cart = await ShopCart.findOne({ userId }).populate(
      "items.productId"
    );

    res.json(cart || { userId, items: [] });
  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).json({ message: "Failed to load cart" });
  }
});

/* =====================================================
   4️⃣ PLACE ORDER (MEESHO STYLE)
   - Each item gets its OWN _id
   - Status starts as PLACED
===================================================== */
router.post("/order/place", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("🟢 PLACE ORDER USER:", userId);

    const cart = await ShopCart.findOne({ userId });
    console.log("🛒 CART FOUND:", cart);

    if (!cart || cart.items.length === 0) {
      console.log("❌ CART EMPTY");
      return res.status(400).json({ message: "Cart is empty" });
    }

    const orderItems = [];

    for (const item of cart.items) {
      console.log("➡️ CART ITEM:", item);

      const product = await ShopProduct.findById(item.productId);
      console.log("📦 PRODUCT FOUND:", product?._id);

      if (!product) {
  console.log("⚠️ REMOVED PRODUCT FOUND IN CART:", item.productId);

  // remove invalid product from cart
  cart.items = cart.items.filter(
    (i) => i.productId.toString() !== item.productId.toString()
  );

  continue; // skip this item
}


      orderItems.push({
        productId: product._id,
        sellerId: product.sellerId,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        status: "PLACED",
      });
    }
    if (orderItems.length === 0) {
  await cart.save();
  return res.status(400).json({
    message: "Some items were removed because they are no longer available",
  });
}


    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = new ShopOrder({
      userId,
      items: orderItems,
      totalAmount,
      status: "PLACED",
    });

    await order.save();
    console.log("✅ ORDER SAVED:", order._id);

    cart.items = [];
    await cart.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error("🔥 PLACE ORDER ERROR FULL:", err);
    res.status(500).json({ message: "Failed to place order" });
  }
});



module.exports = router;
