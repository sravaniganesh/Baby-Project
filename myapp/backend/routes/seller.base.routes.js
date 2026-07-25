const express = require("express");
const router = express.Router();

const sellerAuth = require("../middleware/sellerAuth");
const Seller = require("../models/Seller");

/* ============================
   SELLER SELF CHECK
============================ */
router.get("/me", sellerAuth, async (req, res) => {
  res.json({
    success: true,
    sellerId: req.seller.id,
    role: req.seller.role,
  });
});

/* ============================
   GET SELLER PROFILE
============================ */
router.get("/profile", sellerAuth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller.id).select("-password");

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.json({ success: true, profile: seller });
  } catch (err) {
    console.error("GET SELLER PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to fetch seller profile" });
  }
});

/* ============================
   CREATE / UPDATE SELLER PROFILE
============================ */
router.post("/profile", sellerAuth, async (req, res) => {
  try {
    const {
      businessName,
      sellerType,
      panNumber,
      panName,

      addressLine1,
      addressLine2,
      city,
      state,
      pincode,

      hasGST,
      gstType,
      gstNumber,
      gstBusinessName,
      gstState,

      bankAccountHolder,
      bankAccountNumber,
      bankIFSC,
      bankName,
    } = req.body;

    const seller = await Seller.findById(req.seller.id);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    /* ============================
       BASIC PROFILE
    ============================ */
    if (businessName !== undefined) seller.businessName = businessName;
    if (sellerType !== undefined) seller.sellerType = sellerType;
    if (panNumber !== undefined) seller.panNumber = panNumber;
    if (panName !== undefined) seller.panName = panName;

    /* ============================
       ADDRESS
    ============================ */
    if (addressLine1 !== undefined) seller.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) seller.addressLine2 = addressLine2;
    if (city !== undefined) seller.city = city;
    if (state !== undefined) seller.state = state;
    if (pincode !== undefined) seller.pincode = pincode;

    /* ============================
       GST / TAX
    ============================ */
    if (hasGST !== undefined) seller.hasGST = hasGST;

    if (seller.hasGST === true) {
      seller.gstType = gstType || "REGULAR";
      seller.gstNumber = gstNumber || "";
      seller.gstBusinessName = gstBusinessName || "";
      seller.gstState = gstState || "";
    } else {
      seller.gstType = "NONE";
      seller.gstNumber = "";
      seller.gstBusinessName = "";
      seller.gstState = "";
    }

    /* ============================
       BANK DETAILS
    ============================ */
    if (bankAccountHolder !== undefined)
      seller.bankAccountHolder = bankAccountHolder;
    if (bankAccountNumber !== undefined)
      seller.bankAccountNumber = bankAccountNumber;
    if (bankIFSC !== undefined) seller.bankIFSC = bankIFSC;
    if (bankName !== undefined) seller.bankName = bankName;

    /* ============================
       DERIVED CATEGORY
    ============================ */
    if (seller.hasGST === true) {
      seller.sellerCategory =
        seller.gstType === "COMPOSITION"
          ? "COMPOSITION"
          : "REGULAR_GST";
    } else {
      seller.sellerCategory = "NO_GST";
    }

    /* ============================
       PROFILE COMPLETION
    ============================ */
    const baseCompleted =
      seller.panNumber &&
      seller.addressLine1 &&
      seller.state &&
      seller.pincode &&
      seller.bankAccountNumber &&
      seller.bankIFSC;

    const gstCompleted =
      seller.hasGST === false ||
      (seller.gstNumber && seller.gstState);

    seller.profileCompleted = Boolean(baseCompleted && gstCompleted);

    /* ============================
       EARNINGS ELIGIBILITY
    ============================ */
    seller.isEligibleForEarnings = seller.profileCompleted;

    await seller.save();

    res.json({
      success: true,
      message: "Seller profile updated successfully",
      profileCompleted: seller.profileCompleted,
      sellerCategory: seller.sellerCategory,
      isEligibleForEarnings: seller.isEligibleForEarnings,
    });
  } catch (err) {
    console.error("UPDATE SELLER PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to update seller profile" });
  }
});

module.exports = router;
