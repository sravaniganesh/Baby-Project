const mongoose = require("mongoose");

const adminLedgerSchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      enum: [
        "SELLER_COMMISSION",
        "DOCTOR_PREMIUM",
        "REFUND_REVERSAL",
        "ADJUSTMENT",
      ],
      required: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    amount: {
      type: Number,
      required: true,
    },

    direction: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    /* ======================
       GST BREAKUP (18%)
    ====================== */
    gst: {
      gstType: {
        type: String,
        enum: ["CGST_SGST", "IGST"],
      },
      cgst: {
        type: Number,
        default: 0,
      },
      sgst: {
        type: Number,
        default: 0,
      },
      igst: {
        type: Number,
        default: 0,
      },
      totalGST: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminLedger", adminLedgerSchema);
