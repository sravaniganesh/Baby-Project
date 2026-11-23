const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/,
    },

    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["user", "seller", "doctor"],
      default: "user",
    },
    walletBalance: {
    type: Number,
    default: 0,
    },

    /* ===============================
       WOMEN LIFE STAGE (PHASE 1)
    =============================== */

    womenCategory: {
      type: String,
      enum: ["teen", "married", "pregnant", "post_pregnancy"],
    },

    pregnancyStartDate: {
      type: Date,
    },

    expectedDeliveryDate: {
      type: Date,
    },

    pregnancyStatus: {
      type: String,
      enum: ["pregnant", "delivered"],
    },

    deliveryDate: {
      type: Date,
    },

    babyBirthDate: {
      type: Date,
    },

    /* ===============================
       PRODUCTION READY ADDITIONS
    =============================== */

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    lastUsernameChange: {
      type: Date,
    },

    /* ===============================
       NOTIFICATION SYSTEM
    =============================== */

    fcmToken: {
      type: String,
    },

    notificationPreferences: {
      stage: { type: Boolean, default: true },
      chat: { type: Boolean, default: true },
      order: { type: Boolean, default: true },
      premium: { type: Boolean, default: true },
      admin: { type: Boolean, default: true },
    },
    fcmTokens: {
  type: [String],
  default: [],
},

    /* ===============================
       SMART NOTIFICATION ADDITIONS
       (SAFE ADDITIVE)
    =============================== */

    city: {
      type: String,
      trim: true,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    notificationStats: {
      dailyCount: {
        type: Number,
        default: 0,
      },

      lastNotificationAt: {
        type: Date,
      },
      /* ===============================
   SMART NOTIFICATION TIMING
=============================== */

activityStats: {
  lastActiveHour: {
    type: Number,
    default: 9,
  },
},
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);