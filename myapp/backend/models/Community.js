const mongoose = require("mongoose");

/* ===================== REPLY / COMMENT NODE ===================== */
const replySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    replies: [], // 👈 recursive (filled after schema creation)
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// 🔁 Recursive reference
replySchema.add({
  replies: [replySchema],
});

/* ===================== COMMUNITY ===================== */
const communitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
    stage: {
      type: String,
      enum: ["pregnancy", "parenting", "general"],
      default: "general",
    },
    likes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    comments: [replySchema], // 👈 comments are also replySchema
  },
  { timestamps: true }
);

module.exports = mongoose.model("Community", communitySchema);
