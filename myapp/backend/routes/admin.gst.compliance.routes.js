const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const AdminLedger = require("../models/AdminLedger");
const AdminPremiumLedger = require("../models/AdminPremiumLedger");

/* =====================================
   GST COMPLIANCE SUMMARY (ADMIN)
   GET /api/admin/gst/compliance
   ?month=MM
   &year=YYYY
===================================== */
router.get("/compliance", adminAuth, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res
        .status(400)
        .json({ message: "Month and year are required" });
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    /* =========================
       PLATFORM COMMISSION GST
    ========================== */
    const platformLedgers = await AdminLedger.find({
      createdAt: { $gte: start, $lte: end },
      "gst.total": { $gt: 0 },
    });

    /* =========================
       PREMIUM GST
    ========================== */
    const premiumLedgers = await AdminPremiumLedger.find({
      createdAt: { $gte: start, $lte: end },
      "gst.total": { $gt: 0 },
    });

    let taxableAmount = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    [...platformLedgers, ...premiumLedgers].forEach((l) => {
      taxableAmount += l.amount || 0;
      cgst += l.gst?.cgst || 0;
      sgst += l.gst?.sgst || 0;
      igst += l.gst?.igst || 0;
    });

    const gstCollected = cgst + sgst + igst;

    res.json({
      period: `${month}-${year}`,
      taxableAmount,
      gstCollected,
      cgst,
      sgst,
      igst,
      pendingGST: gstCollected,
      filingStatus: "NOT_FILED", // manual for now
    });
  } catch (err) {
    console.error("GST COMPLIANCE ERROR:", err);
    res.status(500).json({ message: "Failed to load GST compliance data" });
  }
});

module.exports = router;
