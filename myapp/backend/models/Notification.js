
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "recipientModel",
    },

    recipientModel: {
      type: String,
      required: true,
      enum: ["User", "Doctor"],
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "senderModel",
      default: null,
    },

    senderModel: {
      type: String,
      enum: ["User", "Doctor", "System"],
      default: "System",
    },

    type: {
      type: String,
      enum: [
        // Existing notification types
        "CHAT_MESSAGE",
        "DOCTOR_MESSAGE",
        "ORDER_UPDATE",
        "SYSTEM",
        "STAGE",
        "PREMIUM",
        "ADMIN",
        "BROADCAST",
        "SELLER_ORDER",

        // Consultation notifications
        "CONSULTATION_REQUEST",
        "CONSULTATION_SLOT_PROPOSED",
        "CONSULTATION_ACCEPTED",
        "CONSULTATION_REJECTED",
        "CONSULTATION_CONFIRMED",
        "CONSULTATION_RESCHEDULED",
        "CONSULTATION_COMPLETED",
        "CONSULTATION_PAYMENT",
        "CONSULTATION_REMINDER",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    data: {
      type: Object,
      default: {},
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  recipient: 1,
  recipientModel: 1,
  isRead: 1,
});

notificationSchema.index({
  recipient: 1,
  recipientModel: 1,
  createdAt: -1,
});

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
