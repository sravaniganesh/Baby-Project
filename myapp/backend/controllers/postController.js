const Post = require("../models/Post");

// ---------------- CREATE POST ----------------
exports.createPost = async (req, res) => {
  try {
    const { content, image, category } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const post = await Post.create({
      user: req.user._id,
      content,
      image: image || null,
      category: category || "general"
    });

    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- GET ALL POSTS ----------------
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- LIKE / UNLIKE POST ----------------
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({ success: true, likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ADD COMMENT to a post
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { text } = req.body;

    // validation
    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // find post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // new comment object (matches commentSchema in models/Post.js)
    const newComment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // populate the last pushed comment's user for response clarity
    const populatedComment = await Post.findOne(
      { _id: postId },
      { comments: { $slice: -1 } }
    ).populate("comments.user", "name email");

    // return the populated comment (the last one)
    const commentToReturn = populatedComment.comments[0];

    res.status(201).json({
      success: true,
      message: "Comment added",
      comment: commentToReturn,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL COMMENTS of a post
exports.getComments = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId).populate("comments.user", "name email");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({
      success: true,
      comments: post.comments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
