const mongoose = require("mongoose");

const userStageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    stage: {
      type: String,
      enum: [
        "pregnancy",
        "new_mother",
        "parenting",
        "women_health",
      ],
      required: true,
    },

    subStage: {
      type: String,
      default: null,
      // examples:
      // pregnancy: trimester1, trimester2, trimester3
      // parenting: 0-3, 3-6, 6-12 years
    },

    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.UserStage || mongoose.model("UserStage", userStageSchema);