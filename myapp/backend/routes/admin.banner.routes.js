const express = require("express");
const router = express.Router();

const Banner = require("../models/Banner");
const adminAuth = require("../middleware/adminAuth");
const cloudinary = require("../config/cloudinary");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const logAudit = require("../utils/auditLogger");


/* =====================================
   1️⃣ UPLOAD BANNER (ADMIN)
   POST /api/admin/banners
===================================== */
router.post(
  "/",
  adminAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Banner image required" });
      }

      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString(
          "base64"
        )}`,
        {
          folder: "banners",
        }
      );

      const banner = new Banner({
        imageUrl: uploadResult.secure_url,
        isActive: true,
      });

      await banner.save();
      await logAudit({
  actorType: "ADMIN",
  actorId: req.admin.id,
  action: "BANNER_CREATED",
  entityType: "BANNER",
  entityId: banner._id,
  metadata: {
    imageUrl: banner.imageUrl,
  },
  req,
});


      res.json({
        success: true,
        banner,
      });
    } catch (err) {
      console.error("BANNER UPLOAD ERROR:", err);
      res.status(500).json({ message: "Failed to upload banner" });
    }
  }
);

/* =====================================
   2️⃣ LIST ACTIVE BANNERS (PUBLIC)
   GET /api/banners
===================================== */
router.get("/public", async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({
      createdAt: -1,
    });

    res.json(banners);
  } catch (err) {
    console.error("LIST BANNERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch banners" });
  }
});

/* =====================================
   3️⃣ TOGGLE BANNER (ADMIN)
   PATCH /api/admin/banners/:id/toggle
===================================== */
router.patch(
  "/:id/toggle",
  adminAuth,
  async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }

      banner.isActive = !banner.isActive;
      await banner.save();
      await logAudit({
  actorType: "ADMIN",
  actorId: req.admin.id,
  action: "BANNER_TOGGLED",
  entityType: "BANNER",
  entityId: banner._id,
  metadata: {
    isActive: banner.isActive,
  },
  req,
});


      res.json({
        success: true,
        banner,
      });
    } catch (err) {
      console.error("TOGGLE BANNER ERROR:", err);
      res.status(500).json({ message: "Failed to update banner" });
    }
  }
);

module.exports = router;
