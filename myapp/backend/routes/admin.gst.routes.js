const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const AdminLedger = require("../models/AdminLedger");
const AdminPremiumLedger = require("../models/AdminPremiumLedger");

/* =====================================
   GST SUMMARY (MONTHLY)
   GET /api/admin/gst/summary
===================================== */
router.get("/summary", adminAuth, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year required",
      });
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    /* =====================
       PLATFORM COMMISSION GST
    ===================== */
    const platformLedgers = await AdminLedger.find({
      createdAt: { $gte: start, $lte: end },
      "gst.total": { $gt: 0 },
    });

    /* =====================
       PREMIUM GST
    ===================== */
    const premiumLedgers = await AdminPremiumLedger.find({
      createdAt: { $gte: start, $lte: end },
      "gst.total": { $gt: 0 },
    });

    const all = [...platformLedgers, ...premiumLedgers];

    const summary = {
      taxableAmount: 0,
      gstTotal: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
    };

    all.forEach((l) => {
      summary.taxableAmount += l.amount || 0;
      summary.gstTotal += l.gst?.total || 0;
      summary.cgst += l.gst?.cgst || 0;
      summary.sgst += l.gst?.sgst || 0;
      summary.igst += l.gst?.igst || 0;
    });

    res.json({
      month,
      year,
      count: all.length,
      summary,
    });
  } catch (err) {
    console.error("GST SUMMARY ERROR:", err);
    res.status(500).json({ message: "Failed to load GST summary" });
  }
});
/* =====================================
   GST EXPORT (CSV)
   GET /api/admin/gst/export
===================================== */
router.get("/export", adminAuth, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month & year required" });
    }

    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const ledgers = await AdminLedger.find({
      createdAt: { $gte: from, $lte: to },
      "gst.total": { $gt: 0 },
    }).sort({ createdAt: 1 });

    let csv =
      "Date,Source,Reference,Taxable Amount,GST Type,CGST,SGST,IGST,Total GST\n";

    ledgers.forEach((l) => {
      csv += `${l.createdAt.toISOString().slice(0, 10)},`;
      csv += `${l.sourceType},`;
      csv += `${l.referenceId || ""},`;
      csv += `${l.amount},`;
      csv += `${l.gst.type},`;
      csv += `${l.gst.cgst || 0},`;
      csv += `${l.gst.sgst || 0},`;
      csv += `${l.gst.igst || 0},`;
      csv += `${l.gst.total}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.header(
      "Content-Disposition",
      `attachment; filename="gst-report-${month}-${year}.csv"`
    );

    res.send(csv);
  } catch (err) {
    console.error("GST EXPORT ERROR:", err);
    res.status(500).json({ message: "GST export failed" });
  }
});


module.exports = router;
