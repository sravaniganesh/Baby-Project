const mongoose = require("mongoose");

const doctorSettlementSchema = new mongoose.Schema(
{
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
    index: true,
  },

  /* ===============================
     CONSULTATIONS INCLUDED
  =============================== */

  consultationIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
    },
  ],

  /* ===============================
     SETTLEMENT PERIOD
  =============================== */

  periodFrom: {
    type: Date,
    required: true,
  },

  periodTo: {
    type: Date,
    required: true,
  },

  /* ===============================
     FINANCIALS
  =============================== */

  amount: {
    type: Number,
    required: true,
  },

  totalDoctorEarning: {
    type: Number,
    default: 0,
  },

  totalPlatformFee: {
    type: Number,
    default: 0,
  },

  /* ===============================
     PAYMENT INFO
  =============================== */

  paymentMode: {
    type: String,
    default: "",
  },

  transactionRef: {
    type: String,
    default: "",
  },

  status: {
    type: String,
    enum: ["PENDING", "PAID"],
    default: "PENDING",
  },

  paidAt: {
    type: Date,
    default: null,
  },

  /* ===============================
     ADMIN INFO
  =============================== */

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },

  notes: {
    type: String,
    default: "",
  },
},
{ timestamps: true }
);

module.exports = mongoose.model(
  "DoctorSettlement",
  doctorSettlementSchema
);