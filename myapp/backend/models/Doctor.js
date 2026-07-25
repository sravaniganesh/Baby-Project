const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

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

    role: {
      type: String,
      default: "doctor",
    },

    specialization: {
      type: String,
      required: true,
    },

    experience: {
      type: Number,
      required: true,
    },

    hospital: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      default: "India",
    },

    availability: {
      type: String,
      enum: ["online", "offline", "busy"],
      default: "offline",
    },

    consultationFee: {
      type: Number,
      default: 0,
    },

    /* ===============================
       🆕 DOCTOR PRICING
    =============================== */

    chatPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    chatDuration: {
      type: Number,
      default: 5,
      min: 1,
    },

    consultationDuration: {
      type: Number,
      default: 30,
      min: 1,
    },

    /* ===============================
       🆕 ADMIN OVERRIDE (NEW)
    =============================== */

    adminOverride: {
      chatPrice: {
        type: Number,
        default: null,
      },
      chatDuration: {
        type: Number,
        default: null,
      },
      consultationFee: {
        type: Number,
        default: null,
      },
      consultationDuration: {
        type: Number,
        default: null,
      },
      hospitalConsultationType: {
        type: String,
        enum: ["free", "paid"],
        default: null,
      },
    },

    /* =============================== */

    availabilitySlots: [
      {
        day: String,
        start: String,
        end: String,
      },
    ],

    rating: {
      type: Number,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    avatar: {
      type: String,
      default: "",
    },

    /* ===============================
       PRODUCTION ADDITIONS
    =============================== */

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
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

    city: {
      type: String,
      required: true,
      trim: true,
    },

    availability: {
      type: String,
      enum: ["online", "offline", "busy"],
      default: "online",
    },

    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);