const mongoose = require("mongoose");

const doctorAvailabilitySchema = new mongoose.Schema(
{
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },

  dayOfWeek: {
    type: Number, 
    // 0 = Sunday, 1 = Monday ... 6 = Saturday
    required: true,
  },

  startTime: {
    type: String,
    required: true,
  },

  endTime: {
    type: String,
    required: true,
  },

  slotDuration: {
    type: Number,
    default: 30, // minutes
  },
},
{ timestamps: true }
);

module.exports = mongoose.model(
  "DoctorAvailability",
  doctorAvailabilitySchema
);