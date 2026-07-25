// backend/services/adminLedgerService.js

const AdminLedger = require("../models/AdminLedger");
const calculateGST = require("../utils/gstCalculator");

/**
 * Record platform earning with GST
 *
 * @param {Object} params
 * @param {number} params.amount - platform earning before GST
 * @param {string} params.sourceType - SELLER_COMMISSION | DOCTOR_PREMIUM | etc
 * @param {ObjectId} params.referenceId
 * @param {string} params.platformState
 * @param {string} params.partyState
 * @param {ObjectId} params.createdBy - admin/system
 * @param {string} params.description
 */
async function recordPlatformEarning({
  amount,
  sourceType,
  referenceId,
  platformState,
  partyState,
  createdBy = null,
  description = "",
}) {
  if (!amount || amount <= 0) return null;

  const gst = calculateGST({
    amount,
    platformState,
    partyState,
  });

  const ledger = new AdminLedger({
    sourceType,
    referenceId,
    amount,
    direction: "CREDIT",
    description,
    createdBy,
    gst: {
      total: gst.totalGST,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      type: gst.gstType,
    },
  });

  await ledger.save();
  return ledger;
}

/**
 * Record platform debit (refunds, adjustments)
 */
async function recordPlatformDebit({
  amount,
  sourceType,
  referenceId,
  description = "",
  createdBy = null,
}) {
  if (!amount || amount <= 0) return null;

  const ledger = new AdminLedger({
    sourceType,
    referenceId,
    amount,
    direction: "DEBIT",
    description,
    createdBy,
  });

  await ledger.save();
  return ledger;
}

module.exports = {
  recordPlatformEarning,
  recordPlatformDebit,
};
