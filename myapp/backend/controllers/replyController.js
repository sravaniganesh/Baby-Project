const Reply = require('../models/Reply');
const notificationService = require("../services/notificationService");
const Post = require("../models/Post");

/**
 * Create a reply for a post OR a reply to another reply
 */
exports.createReply = async (req, res) => {
  try {
    const { postId, text, parentReplyId } = req.body;

    if (!postId || !text) {
      return res.status(400).json({ message: 'postId and text are required' });
    }

    const reply = await Reply.create({
      postId,
      userId: req.user._id,
      text,
      parentReplyId: parentReplyId || null,
    });

    const populatedReply = await reply.populate('userId', 'name');

    /* ===============================
       🔔 COMMUNITY NOTIFICATIONS
    =============================== */

    // Case 1: Notify Post Owner
    const post = await Post.findById(postId);

    if (post && post.user.toString() !== req.user._id.toString()) {
      await notificationService.createNotification({
        recipientId: post.user,
        recipientModel: "User",
        senderId: req.user._id,
        senderModel: "User",
        type: "SYSTEM",
        title: "New comment on your post",
        message: text,
        data: { postId },
        req,
      });
    }

    // Case 2: Notify Parent Reply Owner
    if (parentReplyId) {
      const parentReply = await Reply.findById(parentReplyId);

      if (
        parentReply &&
        parentReply.userId.toString() !== req.user._id.toString()
      ) {
        await notificationService.createNotification({
          recipientId: parentReply.userId,
          recipientModel: "User",
          senderId: req.user._id,
          senderModel: "User",
          type: "SYSTEM",
          title: "Someone replied to your comment",
          message: text,
          data: { postId, parentReplyId },
          req,
        });
      }
    }

    res.status(201).json(populatedReply);

  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ message: 'Failed to create reply' });
  }
};

/**
 * Get all replies for a post
 */
exports.getRepliesByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const replies = await Reply.find({ postId })
      .populate('userId', 'name')
      .sort({ createdAt: 1 });

    res.json(replies);

  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ message: 'Failed to fetch replies' });
  }
};