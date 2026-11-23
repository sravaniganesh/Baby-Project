
const mongoose = require("mongoose");

const doctorAssistantSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    assistantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED", "REVOKED"],
      default: "PENDING",
    },

    permissions: {
      viewAppointments: {
        type: Boolean,
        default: true,
      },

      respondToAppointments: {
        type: Boolean,
        default: false,
      },

      manageSlots: {
        type: Boolean,
        default: false,
      },

      rescheduleAppointments: {
        type: Boolean,
        default: false,
      },

      viewPatientContact: {
        type: Boolean,
        default: false,
      },
      manageHospitalFees: {
  type: Boolean,
  default: false,
},
    },

    invitedAt: {
      type: Date,
      default: Date.now,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One relationship per doctor and assistant.
// A revoked or declined relationship can be reactivated later.
doctorAssistantSchema.index(
  { doctorId: 1, assistantId: 1 },
  { unique: true }
);

doctorAssistantSchema.index({ assistantId: 1, status: 1 });
doctorAssistantSchema.index({ doctorId: 1, status: 1 });

module.exports =
  mongoose.models.DoctorAssistant ||
  mongoose.model("DoctorAssistant", doctorAssistantSchema);
