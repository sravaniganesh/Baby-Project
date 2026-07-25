const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    default: "SYSTEM",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "AdminNotification",
  adminNotificationSchema
);