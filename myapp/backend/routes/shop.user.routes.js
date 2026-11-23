
const express = require("express");
const router = express.Router();

/* -------- Middleware -------- */
const authMiddleware = require("../middleware/authMiddleware");

/* -------- Models -------- */
const ShopProduct = require("../models/ShopProduct");
const ShopCart = require("../models/ShopCart");
const ShopOrder = require("../models/ShopOrder");

/* =====================================================
   1. GET ALL ACTIVE PRODUCTS (USER)
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

/* =====================================================
   2. RELATED PRODUCTS
===================================================== */
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
    console.error("RELATED PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to load related products" });
  }
});

/* =====================================================
   3. ADD PRODUCT TO CART
===================================================== */
router.post("/cart/add", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (
      !productId ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
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
   4. GET USER CART
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
   5. CREATE ORDER FOR PAYMENT

   Pricing rules:
   - product.price is the selling price
   - Do not apply discountPercent a second time
   - Below ₹500: customer pays configured delivery charge
   - ₹500 or above: customer delivery is free
   - Seller bears shipping cost for orders qualifying
     for free delivery
   - Customer pays ₹5 platform fee per order
   - Cart stays intact until payment succeeds
===================================================== */
router.post("/order/place", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("CREATE SHOP ORDER USER:", userId);

    const cart = await ShopCart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const orderItems = [];
    const unavailableItems = [];

    let itemsSubtotal = 0;
    let mrpSubtotal = 0;
    let totalShippingCost = 0;

    for (const item of cart.items) {
      const product = await ShopProduct.findById(item.productId);

      if (!product || !product.isActive) {
        unavailableItems.push(item.productId.toString());
        continue;
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({
          message: "Invalid quantity found in cart",
        });
      }

      if (
        typeof product.price !== "number" ||
        !Number.isFinite(product.price) ||
        product.price < 0
      ) {
        return res.status(400).json({
          message: `Invalid selling price for ${product.title}`,
        });
      }

      if (
        typeof product.mrp !== "number" ||
        !Number.isFinite(product.mrp) ||
        product.mrp < product.price
      ) {
        return res.status(400).json({
          message: `Invalid MRP for ${product.title}. Please contact support.`,
        });
      }

      if (
        typeof product.stock !== "number" ||
        product.stock < item.quantity
      ) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.title}`,
        });
      }

      const unitPrice = product.price;
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
      const lineMrp = Math.round(product.mrp * item.quantity * 100) / 100;

      const deliveryCharge = Number(product.delivery?.charge ?? 0);

      if (!Number.isFinite(deliveryCharge) || deliveryCharge < 0) {
        return res.status(400).json({
          message: `Invalid delivery charge for ${product.title}`,
        });
      }

      itemsSubtotal += lineTotal;
      mrpSubtotal += lineMrp;
      totalShippingCost += deliveryCharge * item.quantity;

      orderItems.push({
  cartItemId: item._id,
  productId: product._id,
  sellerId: product.sellerId,
  title: product.title,
  price: unitPrice,
  quantity: item.quantity,
  totalAmount: lineTotal,
  status: "PENDING_PAYMENT",
});
    }
  

    if (unavailableItems.length > 0) {
      cart.items = cart.items.filter(
        (item) =>
          !unavailableItems.includes(item.productId.toString())
      );

      await cart.save();

      return res.status(400).json({
        message:
          "Some products are no longer available. Your cart was updated. Please review it and try again.",
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        message: "No valid products are available to order",
      });
    }

    // Round monetary totals to two decimal places.
    itemsSubtotal = Math.round(itemsSubtotal * 100) / 100;
    mrpSubtotal = Math.round(mrpSubtotal * 100) / 100;
    totalShippingCost = Math.round(totalShippingCost * 100) / 100;

    // MRP is used for savings display.
    // product.price is already the selling price.
    const discountAmount = Math.max(
      0,
      Math.round((mrpSubtotal - itemsSubtotal) * 100) / 100
    );

    const FREE_DELIVERY_THRESHOLD = 500;
    const PLATFORM_FEE = 5;

    const qualifiesForFreeDelivery =
      itemsSubtotal >= FREE_DELIVERY_THRESHOLD;

    const customerDeliveryCharge = qualifiesForFreeDelivery
      ? 0
      : totalShippingCost;

    const sellerShippingCost = qualifiesForFreeDelivery
      ? totalShippingCost
      : 0;

    const platformFee = PLATFORM_FEE;

    const totalAmount = Math.round(
      (itemsSubtotal + customerDeliveryCharge + platformFee) * 100
    ) / 100;

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0 ||
      !Number.isFinite(totalShippingCost)
    ) {
      return res.status(400).json({
        message: "Invalid order total",
      });
    }

    const order = new ShopOrder({
      userId,
      items: orderItems,

      itemsSubtotal,
      discountAmount,
      customerDeliveryCharge,
      platformFee,

      totalShippingCost,
      sellerShippingCost,

      totalAmount,
      paymentStatus: "PENDING",
      paymentMethod: "SIMULATOR",
      paymentReference: null,
    });

    await order.save();

    console.log("SHOP ORDER CREATED - PAYMENT PENDING:", order._id);

    // Cart is intentionally preserved until payment succeeds.
    return res.status(201).json({
      success: true,
      message: "Order created. Payment is pending.",
      order,
      pricing: {
        itemsSubtotal,
        mrpSubtotal,
        discountAmount,
        freeDelivery: qualifiesForFreeDelivery,
        customerDeliveryCharge,
        platformFee,
        totalAmount,
      },
    });
  } catch (err) {
    console.error("CREATE SHOP ORDER ERROR:", err);

    return res.status(500).json({
      message: "Failed to create order",
    });
  }
});
module.exports = router;
