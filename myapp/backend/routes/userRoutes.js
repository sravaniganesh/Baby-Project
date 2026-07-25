const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const User = require("../models/user");
const { saveFcmToken } = require("../controllers/userController");
const { updateUsername } = require("../controllers/userController");
const { checkUsernameAvailability } = require("../controllers/userController");


const {
  getProfile,
  updateProfile,
} = require("../controllers/userController");

router.get("/profile", protect, getProfile);
router.put("/update", protect, updateProfile);
router.post("/save-fcm", protect, saveFcmToken);
router.put("/username", protect, updateUsername);
router.get("/username-check", protect, checkUsernameAvailability);

module.exports = router;
