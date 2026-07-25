const UserStage = require("../models/UserStage");
const User = require("../models/user");

// POST /api/user-stage
// Save or update user stage
exports.setUserStage = async (req, res) => {
  try {
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({ message: "Stage is required" });
    }

    // Create stage
    const userStage = await UserStage.create({
      userId: req.user._id,
      stage,
    });

    // Attach stage to user
    await User.findByIdAndUpdate(req.user._id, {
      stageId: userStage._id,
    });

    res.status(201).json({
      message: "User stage saved successfully",
      stage: userStage,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to save user stage" });
  }
};
