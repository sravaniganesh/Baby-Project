const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const AdminLedger = require("../models/AdminLedger");

/* =====================================
   GST CSV EXPORT
   GET /api/admin/gst/export?month=&year=
===================================== */
router.get("/export", adminAuth, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res
        .status(400)
        .json({ message: "Month and year required" });
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const ledgers = await AdminLedger.find({
      createdAt: { $gte: start, $lte: end },
      gst: { $exists: true },
    }).sort({ createdAt: 1 });

    let csv =
      "Date,Source,Taxable Amount,CGST,SGST,IGST,Total GST,Type\n";

    ledgers.forEach((l) => {
      csv += `${l.createdAt.toISOString().slice(0, 10)},`;
      csv += `${l.sourceType},`;
      csv += `${l.amount},`;
      csv += `${l.gst?.cgst || 0},`;
      csv += `${l.gst?.sgst || 0},`;
      csv += `${l.gst?.igst || 0},`;
      csv += `${l.gst?.total || 0},`;
      csv += `${l.gst?.type || ""}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment(`GST_${month}_${year}.csv`);
    res.send(csv);
  } catch (err) {
    console.error("GST EXPORT ERROR:", err);
    res.status(500).json({ message: "Failed to export GST" });
  }
});

module.exports = router;
