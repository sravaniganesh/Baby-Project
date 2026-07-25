const express = require("express");
const router = express.Router();

const { setUserStage } = require("../controllers/userStageController");
const protect = require("../middleware/authMiddleware");

// User must be logged in
router.post("/", protect, setUserStage);

module.exports = router;
