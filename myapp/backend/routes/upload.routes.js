const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const sellerAuth = require("../middleware/sellerAuth");

// Upload image (Seller only)
router.post("/image", sellerAuth, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Image required" });
    }

    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: "shop_products",
    });

    res.json({
      success: true,
      url: uploadRes.secure_url,
    });
  } catch (err) {
    console.error("CLOUDINARY UPLOAD ERROR:", err);
    res.status(500).json({ message: "Image upload failed" });
  }
});

module.exports = router;
