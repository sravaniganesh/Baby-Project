const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      default: "seller",
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: "",
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    /* ===============================
       🏪 SELLER BUSINESS PROFILE
       =============================== */

    businessName: {
      type: String,
      default: "",
      trim: true,
    },

    sellerType: {
      type: String,
      enum: ["INDIVIDUAL", "BUSINESS"],
      default: "INDIVIDUAL",
    },

    panNumber: {
      type: String,
      default: "",
      trim: true,
    },

    panName: {
      type: String,
      default: "",
      trim: true,
    },

    /* ===============================
       📍 PICKUP / BUSINESS ADDRESS
       =============================== */

    addressLine1: {
      type: String,
      default: "",
      trim: true,
    },

    addressLine2: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    pincode: {
      type: String,
      default: "",
      trim: true,
    },

    /* ===============================
       🧾 GST / TAX INFORMATION
       =============================== */

    hasGST: {
      type: Boolean,
      default: false,
    },

    gstType: {
      type: String,
      enum: ["REGULAR", "COMPOSITION", "NONE"],
      default: "NONE",
    },

    gstNumber: {
      type: String,
      default: "",
      trim: true,
    },

    gstBusinessName: {
      type: String,
      default: "",
      trim: true,
    },

    gstState: {
      type: String,
      default: "",
      trim: true,
    },

    /* ===============================
       🏦 SELLER BANK DETAILS
       =============================== */

    bankAccountHolder: {
      type: String,
      default: "",
      trim: true,
    },

    bankAccountNumber: {
      type: String,
      default: "",
      trim: true,
    },

    bankIFSC: {
      type: String,
      default: "",
      trim: true,
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    /* ===============================
       🟡 PROFILE STATUS / HELPERS
       =============================== */

    sellerCategory: {
      type: String,
      enum: ["REGULAR_GST", "COMPOSITION", "NO_GST"],
      default: "NO_GST",
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    isEligibleForEarnings: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seller", sellerSchema);
