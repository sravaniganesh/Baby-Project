/**
 * Calculate GST for platform earnings (India)
 *
 * @param {Object} params
 * @param {number} params.amount - Platform earning amount (before GST)
 * @param {string} params.platformState - GST registered state of platform
 * @param {string} params.partyState - Seller / Doctor / User state
 *
 * @returns {Object} GST breakdown (ledger compatible)
 */
function calculateGST({ amount, platformState, partyState }) {
  if (!amount || amount <= 0) {
    return {
      type: null,
      total: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
    };
  }

  const GST_RATE = 0.18;
  const HALF_GST = 0.09;

  const sameState =
    platformState &&
    partyState &&
    platformState.toLowerCase() === partyState.toLowerCase();

  /* =========================
     INTRA-STATE (CGST + SGST)
  ========================= */
  if (sameState) {
    const cgst = round(amount * HALF_GST);
    const sgst = round(amount * HALF_GST);

    return {
      type: "CGST_SGST",
      total: round(cgst + sgst),
      cgst,
      sgst,
      igst: 0,
    };
  }

  /* =========================
     INTER-STATE (IGST)
  ========================= */
  const igst = round(amount * GST_RATE);

  return {
    type: "IGST",
    total: igst,
    cgst: 0,
    sgst: 0,
    igst,
  };
}

/* =====================
   ROUNDING (2 decimals)
===================== */
function round(value) {
  return Math.round(value * 100) / 100;
}

module.exports = calculateGST;
