
const DoctorAssistant = require("../models/DoctorAssistant");

const requireAssistantPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Only normal User accounts can access assistant APIs
      if (!req.user || req.user.role !== "user") {
        return res.status(403).json({
          message: "Assistant access denied.",
        });
      }

      if (!req.user.isActive) {
        return res.status(403).json({
          message: "Your account is inactive.",
        });
      }

      // Get doctor ID from route params or request body
      const doctorId =
        req.params.doctorId ||
        req.body.doctorId ||
        req.query.doctorId;

      if (!doctorId) {
        return res.status(400).json({
          message: "Doctor ID is required.",
        });
      }

      // Check active accepted relationship and permission
      const relationship = await DoctorAssistant.findOne({
        doctorId,
        assistantId: req.user._id,
        status: "ACCEPTED",
      });

      if (!relationship) {
        return res.status(403).json({
          message: "You do not have access to this doctor's workspace.",
        });
      }

      if (!relationship.permissions?.[permission]) {
        return res.status(403).json({
          message: "You do not have permission to perform this action.",
        });
      }

      req.assistantRelationship = relationship;
      req.assistantDoctorId = relationship.doctorId;

      next();
    } catch (error) {
      console.error("Assistant permission error:", error);

      return res.status(500).json({
        message: "Failed to verify assistant permissions.",
      });
    }
  };
};

module.exports = requireAssistantPermission;
