const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },

 consultationType: {
  type: String,
  enum: ["video", "hospital"], // ✅ ADD hospital
  required: true,
},

  status: {
    type: String,
    enum: [
      "REQUESTED",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "REJECTED",
    ],
    default: "REQUESTED",
  },

  /* ===============================
     SCHEDULING
  =============================== */

  scheduledAt: {
    type: Date,
  },

  slotTime: {
    type: String,
    required: true,
  },

  /* ===============================
     FINANCIALS
  =============================== */

  consultationFee: {
    type: Number,
    default: 0,
  },

  doctorEarning: {
    type: Number,
    default: 0,
  },

  platformFee: {
    type: Number,
    default: 0,
  },

 paymentStatus: {
  type: String,
  enum: ["PENDING", "PAID", "FREE"], // ✅ ADD FREE
  default: "PENDING",
},

  paymentReference: {
    type: String,
    default: "",
  },

  /* ===============================
     SETTLEMENT LINK
  =============================== */

  settlementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DoctorSettlement",
    default: null,
  },

  /* ===============================
     CONSULTATION DETAILS
  =============================== */

  meetingLink: {
    type: String,
    default: null,
  },

  doctorNotes: {
    type: String,
    default: "",
  },

  prescription: {
    type: String,
    default: "",
  },
},
{ timestamps: true }
);

module.exports = mongoose.model(
  "Consultation",
  consultationSchema
);