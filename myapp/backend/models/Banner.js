const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // optional (future use, no harm now)
    title: {
      type: String,
    },

    link: {
      type: String, // e.g. navigate to category / product later
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Banner", BannerSchema);
