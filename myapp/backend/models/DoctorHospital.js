
const mongoose = require("mongoose");

const doctorHospitalSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    designation: {
      type: String,
      trim: true,
      default: "",
    },

    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    consultationDuration: {
      type: Number,
      default: 30,
      min: 1,
    },

    bookingMode: {
      type: String,
      enum: ["request", "instant"],
      default: "request",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

doctorHospitalSchema.index(
  { doctorId: 1, hospitalId: 1 },
  { unique: true }
);

doctorHospitalSchema.index({
  hospitalId: 1,
  status: 1,
  isActive: 1,
});

doctorHospitalSchema.index({
  doctorId: 1,
  status: 1,
  isActive: 1,
});

module.exports = mongoose.model(
  "DoctorHospital",
  doctorHospitalSchema
);
