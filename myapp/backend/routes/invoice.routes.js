const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");

const authMiddleware = require("../middleware/authMiddleware");
const ShopOrder = require("../models/ShopOrder");

router.get("/:orderItemId", authMiddleware, async (req, res) => {
  try {
    const { orderItemId } = req.params;
    const userId = req.user.id;

    const order = await ShopOrder.findOne({
      userId,
      "items._id": orderItemId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = order.items.id(orderItemId);

    if (!item || item.status !== "DELIVERED") {
      return res.status(400).json({ message: "Invoice not available" });
    }

    /* ---------- PDF ---------- */
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${item.invoiceNumber}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    doc.fontSize(18).text("INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice No: ${item.invoiceNumber}`);
    doc.text(`Invoice Date: ${new Date(item.invoiceDate).toDateString()}`);
    doc.moveDown();

    doc.text(`Product: ${item.title}`);
    doc.text(`Quantity: ${item.quantity}`);
    doc.text(`Price: ₹${item.price}`);
    doc.text(`Tax: ₹${item.taxAmount}`);
    doc.moveDown();

    doc.fontSize(14).text(
      `TOTAL: ₹${item.totalAmount}`,
      { align: "right" }
    );

    doc.end();
  } catch (err) {
    console.error("INVOICE ERROR:", err);
    res.status(500).json({ message: "Invoice generation failed" });
  }
});

module.exports = router;
