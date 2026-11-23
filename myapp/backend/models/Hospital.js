
const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    hospitalType: {
      type: String,
      enum: [
        "multi-specialty",
        "clinic",
        "general",
        "specialty",
        "other",
      ],
      default: "multi-specialty",
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },

    pincode: {
      type: String,
      trim: true,
      default: "",
    },

    departments: [
      {
        type: String,
        trim: true,
      },
    ],

    facilities: [
      {
        type: String,
        trim: true,
      },
    ],

    logo: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
  type: String,
  enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED"],
  default: function () {
    return this.isVerified ? "APPROVED" : "PENDING_APPROVAL";
  },
},
  },
  {
    timestamps: true,
  }
);

// Helps search hospitals by location.
hospitalSchema.index({
  city: 1,
  state: 1,
  isActive: 1,
});

module.exports = mongoose.model("Hospital", hospitalSchema);
