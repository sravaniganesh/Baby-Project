const Community = require("../models/Community");

/**
 * CREATE COMMUNITY POST
 */
exports.createPost = async (req, res) => {
  try {
    const { category, content, image } = req.body;

    if (!category || !content) {
      return res.status(400).json({ message: "Category and content required" });
    }

    const post = await Community.create({
      userId: req.user.id, // from auth middleware
      category,
      content,
      image: image || null,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to create post" });
  }
};

/**
 * GET COMMUNITY POSTS (BY CATEGORY)
 */
exports.getPosts = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = category ? { category } : {};

    const posts = await Community.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

/**
 * LIKE / UNLIKE POST
 */
const Community = require("../models/Community");
const { getIO } = require("../socket");

exports.likePost = async (req, res) => {
  try {
    const post = await Community.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user._id.toString();

    const alreadyLiked = post.likes.some(
      (like) => like.userId.toString() === userId
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (like) => like.userId.toString() !== userId
      );
    } else {
      post.likes.push({ userId });
    }

    await post.save();

    const populatedPost = await Community.findById(post._id).populate(
      "userId",
      "name"
    );

    // 🔥 EMIT SOCKET EVENT
    const io = getIO();
    io.emit("community:postLiked", populatedPost);

    res.json(populatedPost);
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
