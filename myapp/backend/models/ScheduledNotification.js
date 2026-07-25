const mongoose = require("mongoose");

const scheduledNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    womenCategory: {
      type: String,
      enum: ["teen", "married", "pregnant", "post_pregnancy"],
    },

    city: {
      type: String,
    },

    scheduledAt: {
      type: Date,
      required: true,
    },

    sent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ScheduledNotification ||
  mongoose.model("ScheduledNotification", scheduledNotificationSchema);