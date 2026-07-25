const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const mongoose = require("mongoose");

const User = require("../models/user");
const Seller = require("../models/Seller");
const Doctor = require("../models/Doctor");
const ShopProduct = require("../models/ShopProduct");
const ShopOrder = require("../models/ShopOrder");

/* =====================================
   ADMIN GLOBAL SEARCH
   GET /api/admin/search?q=
===================================== */

router.get("/", adminAuth, async (req, res) => {
  try {
    const q = req.query.q;

    if (!q) {
      return res.json({
        users: [],
        sellers: [],
        doctors: [],
        products: [],
        orders: [],
      });
    }

    const regex = new RegExp(q, "i");

    const users = await User.find({
      $or: [{ name: regex }, { email: regex }, { phone: regex }],
    }).limit(5);

    const sellers = await Seller.find({
      $or: [{ name: regex }, { email: regex }, { businessName: regex }],
    }).limit(5);

    const doctors = await Doctor.find({
      $or: [{ name: regex }, { email: regex }, { hospital: regex }],
    }).limit(5);

    const products = await ShopProduct.find({
      title: regex,
    }).limit(5);

    let orders = [];

    if (mongoose.Types.ObjectId.isValid(q)) {
      orders = await ShopOrder.find({ _id: q })
        .limit(5)
        .populate("userId", "name email");
    } else {
      const matchedUsers = await User.find({
        $or: [{ email: regex }, { phone: regex }],
      }).select("_id");

      const userIds = matchedUsers.map((u) => u._id);

      orders = await ShopOrder.find({
        userId: { $in: userIds },
      })
        .limit(5)
        .populate("userId", "name email");
    }

    res.json({
      users,
      sellers,
      doctors,
      products,
      orders,
    });

  } catch (err) {
    console.error("ADMIN SEARCH ERROR:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

module.exports = router;