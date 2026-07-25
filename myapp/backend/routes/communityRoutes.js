const express = require("express");
const router = express.Router();

const Community = require("../models/Community");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");


// ============================
// GET all community posts
// Only users & doctors
// ============================
router.get(
  "/",
  protect,
  allowRoles("user"),
  async (req, res) => {
    try {
      const posts = await Community.find()
         .populate("userId", "name email")
         .populate("comments.userId", "name")

        .sort({ createdAt: -1 });

      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


// ============================
// CREATE community post
// ============================
router.post(
  "/",
  protect,
  allowRoles("user"),
  async (req, res) => {
    try {
      const { category, content, image, stage } = req.body;

      if (!category || !content) {
        return res
          .status(400)
          .json({ message: "Category and content required" });
      }

      const post = new Community({
        userId: req.user._id,
        category,
        content,
        image: image || null,
        stage: stage || req.user.stage || "general",
      });

      await post.save();
      res.status(201).json(post);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


// ============================
// LIKE / UNLIKE a post
// ============================
router.post(
  "/:id/like",
  protect,
  allowRoles("user"),
  async (req, res) => {
    try {
      const post = await Community.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const userId = req.user._id.toString();

      const alreadyLiked = post.likes.find(
        (l) => l.userId.toString() === userId
      );

      if (alreadyLiked) {
        post.likes = post.likes.filter(
          (l) => l.userId.toString() !== userId
        );
      } else {
        post.likes.push({ userId });
      }

      await post.save();
      res.json(post);
    } catch (err) {
      res.status(500).json({ message: "Like failed" });
    }
  }
);


// ============================
// ADD comment to a post
// Only users
// ============================
// ============================
// ADD COMMENT to a post (USER ONLY)
// ============================
router.post(
  "/:id/comment",
  protect,
  allowRoles("user"),
  async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Comment text required" });
      }

      const post = await Community.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      post.comments.push({
        userId: req.user._id,
        text,
      });

      await post.save();

      const populatedPost = await Community.findById(post._id)
        .populate("userId", "name")
        .populate("comments.userId", "name")
        .populate("comments.replies.userId", "name");

      res.status(201).json(populatedPost);
    } catch (err) {
      res.status(500).json({ message: "Failed to add comment" });
    }
  }
);
// ============================
// ADD REPLY to a comment (USER ONLY)
// ============================
router.post(
  "/:postId/comment/:commentId/reply",
  protect,
  allowRoles("user"),
  async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Reply text required" });
      }

      const post = await Community.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const comment = post.comments.id(req.params.commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      comment.replies.push({
        userId: req.user._id,
        text,
      });
      // ============================
// ADD NESTED REPLY (USER ONLY)
// ============================
router.post(
  "/:postId/reply/:parentId",
  protect,
  allowRoles("user"),
  async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Reply text required" });
      }

      const post = await Community.findById(req.params.postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // 🔍 Recursive search function
      const findNode = (nodes) => {
        for (let node of nodes) {
          if (node._id.toString() === req.params.parentId) return node;
          const found = findNode(node.replies || []);
          if (found) return found;
        }
        return null;
      };

      const parentNode = findNode(post.comments);
      if (!parentNode) {
        return res.status(404).json({ message: "Parent comment not found" });
      }

      parentNode.replies.push({
        userId: req.user._id,
        text,
      });

      await post.save();

      const populatedPost = await Community.findById(post._id)
        .populate("userId", "name")
        .populate("comments.userId", "name")
        .populate("comments.replies.userId", "name");

      res.status(201).json(populatedPost);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to add reply" });
    }
  }
);


      await post.save();

      const populatedPost = await Community.findById(post._id)
        .populate("userId", "name")
        .populate("comments.userId", "name")
        .populate("comments.replies.userId", "name");

      res.status(201).json(populatedPost);
    } catch (err) {
      res.status(500).json({ message: "Failed to add reply" });
    }
  }
);



module.exports = router;
