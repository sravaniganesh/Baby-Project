const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ For threaded replies (reply → reply)
    parentReplyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reply',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reply', replySchema);
