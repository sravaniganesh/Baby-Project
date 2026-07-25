const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");

const ShopOrder = require("../models/ShopOrder");
const AdminLedger = require("../models/AdminLedger");

/* =====================================
EXPORT ORDERS REPORT (CSV)
SUPER ADMIN + FINANCE
===================================== */
router.get(
"/orders",
adminAuth,
allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
async (req, res) => {
try {
const orders = await ShopOrder.find()
.populate("user", "email")
.sort({ createdAt: -1 });


  let csv =
    "orderId,userEmail,total,status,createdAt\n";

  orders.forEach((o) => {
    csv += `${o._id},${o.user?.email || ""},${o.totalAmount || 0},${o.status},${o.createdAt}\n`;
  });

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=orders_report.csv"
  );

  res.setHeader("Content-Type", "text/csv");

  res.send(csv);
} catch (err) {
  console.error("ORDERS REPORT ERROR:", err);

  res.status(500).json({
    message: "Failed to export orders report",
  });
}


}
);

/* =====================================
EXPORT REFUND REPORT
===================================== */
router.get(
"/refunds",
adminAuth,
allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
async (req, res) => {
try {
const refunds = await AdminLedger.find({
sourceType: "REFUND_REVERSAL",
}).sort({ createdAt: -1 });


  let csv =
    "refundId,amount,direction,description,createdAt\n";

  refunds.forEach((r) => {
    csv += `${r._id},${r.amount},${r.direction},${r.description},${r.createdAt}\n`;
  });

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=refund_report.csv"
  );

  res.setHeader("Content-Type", "text/csv");

  res.send(csv);
} catch (err) {
  console.error("REFUND REPORT ERROR:", err);

  res.status(500).json({
    message: "Failed to export refund report",
  });
}


}
);

/* =====================================
EXPORT SETTLEMENT REPORT
===================================== */
router.get(
"/settlements",
adminAuth,
allowRoles("SUPER_ADMIN", "FINANCE_ADMIN"),
async (req, res) => {
try {
const settlements = await AdminLedger.find({
sourceType: "SELLER_COMMISSION",
}).sort({ createdAt: -1 });


  let csv =
    "settlementId,amount,direction,description,createdAt\n";

  settlements.forEach((s) => {
    csv += `${s._id},${s.amount},${s.direction},${s.description},${s.createdAt}\n`;
  });

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=settlement_report.csv"
  );

  res.setHeader("Content-Type", "text/csv");

  res.send(csv);
} catch (err) {
  console.error("SETTLEMENT REPORT ERROR:", err);

  res.status(500).json({
    message: "Failed to export settlement report",
  });
}


}
);

module.exports = router;
