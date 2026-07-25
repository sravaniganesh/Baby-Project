const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const {
  createPost,
  getAllPosts,
  likePost,
  addComment,
  getComments
} = require("../controllers/postController");

// CREATE POST
router.post("/", protect, createPost);

// GET ALL POSTS
router.get("/", protect, getAllPosts);

// LIKE / UNLIKE POST
router.put("/like/:id", protect, likePost);

// ADD COMMENT
router.post("/comment/:id", protect, addComment);

// GET COMMENTS
router.get("/comments/:id", protect, getComments);

module.exports = router;
