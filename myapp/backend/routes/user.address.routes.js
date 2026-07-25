const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth"); // user auth
const UserAddress = require("../models/UserAddress");

/* =========================
   ADD ADDRESS
========================= */
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const address = new UserAddress({
      userId,
      ...req.body,
    });

    await address.save();

    res.json({
      success: true,
      address,
    });
  } catch (err) {
    console.error("ADD ADDRESS ERROR:", err);
    res.status(500).json({ message: "Failed to add address" });
  }
});

/* =========================
   LIST USER ADDRESSES
========================= */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await UserAddress.find({ userId }).sort({
      createdAt: -1,
    });

    res.json(addresses);
  } catch (err) {
    console.error("LIST ADDRESS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
});

module.exports = router;
