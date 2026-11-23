
const mongoose = require("mongoose");

const consultationReminderSchema = new mongoose.Schema(
  {
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      required: true,
      index: true,
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "recipientModel",
    },

    recipientModel: {
      type: String,
      enum: ["User", "Doctor"],
      required: true,
    },

    reminderType: {
      type: String,
      enum: [
        "SLOT_RESPONSE",
        "PAYMENT",
        "APPOINTMENT_DAILY",
        "APPOINTMENT_1_DAY",
        "APPOINTMENT_2_HOURS",
      ],
      required: true,
    },

    // When the reminder should be processed.
    dueAt: {
      type: Date,
      required: true,
    },

    // Unique key prevents the same reminder being scheduled twice.
    dedupeKey: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SENT", "CANCELLED", "FAILED"],
      default: "PENDING",
      index: true,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastError: {
      type: String,
      default: "",
    },

    // Snapshot used to detect obsolete reminders after rescheduling.
    scheduledAtSnapshot: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Efficiently find reminders due for processing.
consultationReminderSchema.index({
  status: 1,
  dueAt: 1,
});

// Efficiently cancel or regenerate reminders for a consultation.
consultationReminderSchema.index({
  consultationId: 1,
  status: 1,
  reminderType: 1,
});

module.exports =
  mongoose.models.ConsultationReminder ||
  mongoose.model("ConsultationReminder", consultationReminderSchema);
