
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const User = require("../models/user");
const DoctorAssistant = require("../models/DoctorAssistant");

// All routes require an authenticated doctor.
router.use(protect, allowRoles("doctor"));

const allowedPermissions = [
  "viewAppointments",
  "respondToAppointments",
  "manageSlots",
  "rescheduleAppointments",
  "viewPatientContact",
  "manageHospitalFees",
];

const getPermissions = (input = {}) => {
  const permissions = {
    viewAppointments: true,
    respondToAppointments: false,
    manageSlots: false,
    rescheduleAppointments: false,
    viewPatientContact: false,
    manageHospitalFees: false,
  };

  for (const key of allowedPermissions) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      if (typeof input[key] !== "boolean") {
        throw new Error(`Permission ${key} must be true or false`);
      }

      permissions[key] = input[key];
    }
  }

  return permissions;
};

// =====================================
// INVITE ASSISTANT
// POST /api/doctor-assistants/invite
// =====================================
router.post("/invite", async (req, res) => {
  try {
    const { email, username, permissions } = req.body;

    if (!email && !username) {
      return res.status(400).json({
        message: "Assistant email or username is required",
      });
    }

    const doctorId = req.user._id;

    const searchConditions = [];

    if (email) {
      searchConditions.push({
        email: email.trim().toLowerCase(),
      });
    }

    if (username) {
      searchConditions.push({
        username: username.trim().toLowerCase(),
      });
    }

    const assistant = await User.findOne({
      role: "user",
      isActive: true,
      $or: searchConditions,
    }).select("_id name email username role isActive");

    if (!assistant) {
      return res.status(404).json({
        message: "Active registered user not found",
      });
    }

    if (assistant._id.toString() === doctorId.toString()) {
      return res.status(400).json({
        message: "You cannot invite your own account",
      });
    }

    let selectedPermissions;

    try {
      selectedPermissions = getPermissions(permissions);
    } catch (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    let relationship = await DoctorAssistant.findOne({
      doctorId,
      assistantId: assistant._id,
    });

    if (relationship) {
      if (
        relationship.status === "PENDING" ||
        relationship.status === "ACCEPTED"
      ) {
        return res.status(409).json({
          message: "An invitation or active relationship already exists",
        });
      }

      // Reuse previously declined or revoked relationship.
      relationship.status = "PENDING";
      relationship.permissions = selectedPermissions;
      relationship.invitedAt = new Date();
      relationship.acceptedAt = null;
      relationship.revokedAt = null;

      await relationship.save();
    } else {
      relationship = await DoctorAssistant.create({
        doctorId,
        assistantId: assistant._id,
        status: "PENDING",
        permissions: selectedPermissions,
      });
    }

    await relationship.populate(
      "assistantId",
      "name email username"
    );

    return res.status(201).json({
      success: true,
      message: "Assistant invitation sent",
      relationship,
    });
  } catch (error) {
    console.error("DOCTOR ASSISTANT INVITE ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Assistant invitation already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to invite assistant",
    });
  }
});

// =====================================
// GET DOCTOR'S ASSISTANTS
// GET /api/doctor-assistants/my
// =====================================
router.get("/my", async (req, res) => {
  try {
    const relationships = await DoctorAssistant.find({
      doctorId: req.user._id,
    })
      .populate("assistantId", "name email username")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: relationships.length,
      relationships,
    });
  } catch (error) {
    console.error("DOCTOR ASSISTANT LIST ERROR:", error);

    return res.status(500).json({
      message: "Failed to load assistants",
    });
  }
});

// =====================================
// UPDATE ASSISTANT PERMISSIONS
// PATCH /api/doctor-assistants/:id/permissions
// =====================================
router.patch("/:id/permissions", async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== "object") {
      return res.status(400).json({
        message: "Permissions are required",
      });
    }

    let selectedPermissions;

    try {
      selectedPermissions = getPermissions(permissions);
    } catch (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const relationship = await DoctorAssistant.findOne({
      _id: req.params.id,
      doctorId: req.user._id,
      status: "ACCEPTED",
    });

    if (!relationship) {
      return res.status(404).json({
        message: "Accepted assistant relationship not found",
      });
    }

    relationship.permissions = selectedPermissions;
    await relationship.save();

    return res.json({
      success: true,
      message: "Assistant permissions updated",
      relationship,
    });
  } catch (error) {
    console.error("DOCTOR ASSISTANT PERMISSION ERROR:", error);

    return res.status(500).json({
      message: "Failed to update assistant permissions",
    });
  }
});

// =====================================
// REVOKE ASSISTANT ACCESS
// PATCH /api/doctor-assistants/:id/revoke
// =====================================
router.patch("/:id/revoke", async (req, res) => {
  try {
    const relationship = await DoctorAssistant.findOne({
      _id: req.params.id,
      doctorId: req.user._id,
      status: { $in: ["PENDING", "ACCEPTED"] },
    });

    if (!relationship) {
      return res.status(404).json({
        message: "Active assistant relationship not found",
      });
    }

    relationship.status = "REVOKED";
    relationship.revokedAt = new Date();

    await relationship.save();

    return res.json({
      success: true,
      message: "Assistant access revoked",
    });
  } catch (error) {
    console.error("DOCTOR ASSISTANT REVOKE ERROR:", error);

    return res.status(500).json({
      message: "Failed to revoke assistant access",
    });
  }
});

module.exports = router;
