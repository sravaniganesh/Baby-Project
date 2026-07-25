const express = require('express');
const router = express.Router();

const {
  createReply,
  getRepliesByPost,
} = require('../controllers/replyController');

const authMiddleware = require('../middleware/authMiddleware');

/**
 * Create a reply (post reply OR reply to another reply)
 */
router.post('/', authMiddleware, createReply);

/**
 * Get all replies for a post
 */
router.get('/post/:postId', authMiddleware, getRepliesByPost);

module.exports = router;
