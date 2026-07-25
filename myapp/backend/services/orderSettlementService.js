const AdminLedger = require("../models/AdminLedger");
const calculateGST = require("../utils/gstCalculator");

/**
 * Handle seller order settlement & platform earnings
 *
 * @param {Object} params
 * @param {Object} params.order - ShopOrder document
 * @param {Object} params.item - Order item (single product line)
 * @param {String} params.platformState - Platform GST state (eg: "KA")
 * @param {String} params.sellerState - Seller GST state
 * @param {String} params.adminId - Admin who triggers settlement (optional)
 */
async function settleOrderItem({
  order,
  item,
  platformState,
  sellerState,
  adminId = null,
}) {
  if (!order || !item) {
    throw new Error("Order & item are required for settlement");
  }

  /* ============================
     1️⃣ BASIC VALUES
  ============================ */

  const itemTotal = item.price * item.quantity;

  // Platform commission (18%)
  const COMMISSION_RATE = 0.18;
  const platformCommission = round(itemTotal * COMMISSION_RATE);

  // Seller earning
  const sellerEarning = round(itemTotal - platformCommission);

  /* ============================
     2️⃣ GST CALCULATION
  ============================ */

  const gst = calculateGST({
    amount: platformCommission,
    platformState,
    partyState: sellerState,
  });

  /* ============================
     3️⃣ ADMIN LEDGER ENTRY
  ============================ */

  const ledger = new AdminLedger({
    sourceType: "SELLER_COMMISSION",
    referenceId: order._id,
    amount: platformCommission,
    direction: "CREDIT",
    description: `Commission from order ${order._id}`,
    createdBy: adminId,
    gst: {
      total: gst.totalGST,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      type: gst.gstType,
    },
  });

  await ledger.save();

  /* ============================
     4️⃣ RETURN SETTLEMENT DATA
  ============================ */

  return {
    orderId: order._id,
    itemId: item._id,
    sellerEarning,
    platformCommission,
    gst,
  };
}

/* ============================
   UTIL
============================ */
function round(val) {
  return Math.round(val * 100) / 100;
}

module.exports = {
  settleOrderItem,
};
