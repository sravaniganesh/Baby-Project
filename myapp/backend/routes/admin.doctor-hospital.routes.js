
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const DoctorHospital = require("../models/DoctorHospital");

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");

// Only authorized admins can manage doctor-hospital associations.
router.use(
  adminAuth,
  allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN")
);

// GET /api/admin/doctor-hospitals
// List doctor-hospital associations with optional status filtering.
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (status) {
      const allowedStatuses = ["pending", "approved", "rejected"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid association status",
        });
      }

      filter.status = status;
    }

    const associations = await DoctorHospital.find(filter)
      .populate(
        "doctorId",
        "name email specialization experience phone"
      )
      .populate(
        "hospitalId",
        "name hospitalType address city state country isVerified isActive"
      )
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      count: associations.length,
      associations,
    });
  } catch (error) {
    console.error("ADMIN DOCTOR HOSPITAL LIST ERROR:", error);

    return res.status(500).json({
      message: "Failed to load doctor hospital associations",
    });
  }
});

// GET /api/admin/doctor-hospitals/:id
// View one association with doctor and hospital details.
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid association ID",
      });
    }

    const association = await DoctorHospital.findById(req.params.id)
      .populate("doctorId")
      .populate("hospitalId");

    if (!association) {
      return res.status(404).json({
        message: "Association request not found",
      });
    }

    return res.status(200).json({
      success: true,
      association,
    });
  } catch (error) {
    console.error("ADMIN DOCTOR HOSPITAL DETAIL ERROR:", error);

    return res.status(500).json({
      message: "Failed to load association details",
    });
  }
});

// PATCH /api/admin/doctor-hospitals/:id/review
// Approve or reject a doctor's hospital association request.
router.patch("/:id/review", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid association ID",
      });
    }

    const {
      decision,
      consultationFee,
      consultationDuration,
      bookingMode,
    } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        message: "Decision must be approved or rejected",
      });
    }

    const association = await DoctorHospital.findById(req.params.id);

    if (!association) {
      return res.status(404).json({
        message: "Association request not found",
      });
    }

    if (association.status !== "pending") {
      return res.status(409).json({
        message: "Only pending requests can be reviewed",
      });
    }

    if (decision === "approved") {
      if (consultationFee !== undefined) {
        const fee = Number(consultationFee);

        if (!Number.isFinite(fee) || fee < 0) {
          return res.status(400).json({
            message: "Please enter a valid consultation fee",
          });
        }

        association.consultationFee = fee;
      }

      if (consultationDuration !== undefined) {
        const duration = Number(consultationDuration);

        if (
          !Number.isInteger(duration) ||
          duration < 10 ||
          duration > 180
        ) {
          return res.status(400).json({
            message: "Consultation duration must be between 10 and 180 minutes",
          });
        }

        association.consultationDuration = duration;
      }

      if (bookingMode !== undefined) {
        if (!["request", "instant"].includes(bookingMode)) {
          return res.status(400).json({
            message: "Booking mode must be request or instant",
          });
        }

        association.bookingMode = bookingMode;
      }

      association.status = "approved";
      association.isActive = true;
      association.joinedAt = new Date();
    } else {
      association.status = "rejected";
      association.isActive = false;
    }

    await association.save();

    await association.populate(
      "doctorId",
      "name email specialization"
    );

    await association.populate(
      "hospitalId",
      "name city state isVerified"
    );

    return res.status(200).json({
      success: true,
      message:
        decision === "approved"
          ? "Doctor hospital association approved successfully"
          : "Doctor hospital association rejected",
      association,
    });
  } catch (error) {
    console.error("ADMIN DOCTOR HOSPITAL REVIEW ERROR:", error);

    return res.status(500).json({
      message: "Failed to review association request",
    });
  }
});

// PATCH /api/admin/doctor-hospitals/:id/settings
// Update an existing approved association's consultation settings.
router.patch("/:id/settings", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid association ID",
      });
    }

    const association = await DoctorHospital.findById(req.params.id);

    if (!association) {
      return res.status(404).json({
        message: "Association not found",
      });
    }

    if (
      association.status !== "approved" ||
      association.isActive !== true
    ) {
      return res.status(400).json({
        message: "Settings can only be changed for active approved associations",
      });
    }

    const {
      consultationFee,
      consultationDuration,
      bookingMode,
    } = req.body;

    if (
      consultationFee === undefined &&
      consultationDuration === undefined &&
      bookingMode === undefined
    ) {
      return res.status(400).json({
        message: "Provide at least one setting to update",
      });
    }

    if (consultationFee !== undefined) {
      const fee = Number(consultationFee);

      if (!Number.isFinite(fee) || fee < 0) {
        return res.status(400).json({
          message: "Please enter a valid consultation fee",
        });
      }

      association.consultationFee = fee;
    }

    if (consultationDuration !== undefined) {
      const duration = Number(consultationDuration);

      if (
        !Number.isInteger(duration) ||
        duration < 10 ||
        duration > 180
      ) {
        return res.status(400).json({
          message: "Consultation duration must be between 10 and 180 minutes",
        });
      }

      association.consultationDuration = duration;
    }

    if (bookingMode !== undefined) {
      if (!["request", "instant"].includes(bookingMode)) {
        return res.status(400).json({
          message: "Booking mode must be request or instant",
        });
      }

      association.bookingMode = bookingMode;
    }

    await association.save();

    return res.status(200).json({
      success: true,
      message: "Association settings updated successfully",
      association,
    });
  } catch (error) {
    console.error("ADMIN DOCTOR HOSPITAL SETTINGS ERROR:", error);

    return res.status(500).json({
      message: "Failed to update association settings",
    });
  }
});

module.exports = router;
