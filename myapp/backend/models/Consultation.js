
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

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      default: null,
    },

    consultationType: {
      type: String,
      enum: ["video", "hospital"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "REQUESTED",
        "SLOT_PROPOSED",
        "AWAITING_PAYMENT",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "REJECTED",
      ],
      default: "REQUESTED",
    },

    // User's preferred date for a flexible hospital consultation request.
    preferredDate: {
      type: Date,
      default: null,
    },

    // Confirmed appointment date and time.
    scheduledAt: {
      type: Date,
      default: null,
    },

    slotTime: {
      type: String,
      default: null,
    },

    // Multiple available appointment slots proposed by the doctor
    // or an authorized assistant.
    proposedSlots: [
      {
        _id: false,

        scheduledAt: {
          type: Date,
          required: true,
        },

        slotTime: {
          type: String,
          required: true,
        },
      },
    ],

    // Retained for compatibility with existing single-slot workflows.
    proposedAt: {
      type: Date,
      default: null,
    },

    proposedBy: {
      type: String,
      enum: ["doctor", "assistant"],
      default: null,
    },

    // Pricing and earnings.
    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    doctorEarning: {
      type: Number,
      default: 0,
      min: 0,
    },

    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Payment information.
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FREE", "REFUNDED"],
      default: "PENDING",
    },

   paymentMethod: {
  type: String,
  enum: ["WALLET", "PAY_AT_HOSPITAL", "DEMO_ONLINE"],
  default: null,
},

    paymentReference: {
      type: String,
      default: null,
    },

    // Video chat is linked only after successful payment.
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },

    settlementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorSettlement",
      default: null,
    },

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

// Preserve the existing slot lookup index.
consultationSchema.index({
  doctorId: 1,
  hospitalId: 1,
  scheduledAt: 1,
  slotTime: 1,
  status: 1,
});

module.exports = mongoose.model(
  "Consultation",
  consultationSchema
);
