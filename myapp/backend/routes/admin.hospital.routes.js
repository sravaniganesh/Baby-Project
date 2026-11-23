const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");
const Hospital = require("../models/Hospital");

// All hospital management APIs require an authenticated
// SUPER_ADMIN or SUPPORT_ADMIN.
router.use(adminAuth, allowRoles("SUPER_ADMIN", "SUPPORT_ADMIN"));

/* =========================================
   GET ALL HOSPITALS
   GET /api/admin/hospitals
========================================= */
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      city = "",
      status = "all",
    } = req.query;

    const filter = {};

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    if (city.trim()) {
      filter.city = { $regex: city.trim(), $options: "i" };
    }

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const hospitals = await Hospital.find(filter).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: hospitals.length,
      hospitals,
    });
  } catch (error) {
    console.error("ADMIN HOSPITAL LIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hospitals",
    });
  }
});

/* =========================================
   CREATE HOSPITAL
   POST /api/admin/hospitals
========================================= */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      hospitalType,
      address,
      city,
      state,
      country,
      pincode,
      departments,
      facilities,
      logo,
      description,
    } = req.body;

    if (!name || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        message: "Name, address, city and state are required",
      });
    }

    const hospital = await Hospital.create({
      name: name.trim(),
      email,
      phone,
      hospitalType,
      address,
      city: city.trim(),
      state: state.trim(),
      country: country || "India",
      pincode,
      departments,
      facilities,
      logo,
      description,
      isActive: true,
      isVerified: false,
      approvalStatus: "PENDING_APPROVAL",
    });

    return res.status(201).json({
      success: true,
      message: "Hospital created successfully",
      hospital,
    });
  } catch (error) {
    console.error("ADMIN HOSPITAL CREATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create hospital",
    });
  }
});

/* =========================================
   GET HOSPITAL BY ID
   GET /api/admin/hospitals/:id
========================================= */
router.get("/:id", async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    return res.json({
      success: true,
      hospital,
    });
  } catch (error) {
    console.error("ADMIN HOSPITAL DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hospital details",
    });
  }
});

/* =========================================
   UPDATE HOSPITAL
   PUT /api/admin/hospitals/:id
========================================= */
router.put("/:id", async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "email",
      "phone",
      "hospitalType",
      "address",
      "city",
      "state",
      "country",
      "pincode",
      "departments",
      "facilities",
      "logo",
      "description",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.name !== undefined) {
      updates.name = String(updates.name).trim();
    }

    if (updates.city !== undefined) {
      updates.city = String(updates.city).trim();
    }

    if (updates.state !== undefined) {
      updates.state = String(updates.state).trim();
    }

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    return res.json({
      success: true,
      message: "Hospital updated successfully",
      hospital,
    });
  } catch (error) {
    console.error("ADMIN HOSPITAL UPDATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update hospital",
    });
  }
});

/* =========================================
   UPDATE HOSPITAL APPROVAL STATUS
   PATCH /api/admin/hospitals/:id/approval-status

   Body examples:
   { "approvalStatus": "PENDING_APPROVAL" }
   { "approvalStatus": "APPROVED" }
   { "approvalStatus": "REJECTED" }
========================================= */
router.patch("/:id/approval-status", async (req, res) => {
  try {
    const { approvalStatus } = req.body;

    const allowedStatuses = [
      "PENDING_APPROVAL",
      "APPROVED",
      "REJECTED",
    ];

    if (!allowedStatuses.includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid approval status. Use PENDING_APPROVAL, APPROVED or REJECTED.",
      });
    }

    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    hospital.approvalStatus = approvalStatus;

    // Reset verification when sending back for review or rejecting.
    if (
      approvalStatus === "PENDING_APPROVAL" ||
      approvalStatus === "REJECTED"
    ) {
      hospital.isVerified = false;
    }

    await hospital.save();

    return res.json({
      success: true,
      message:
        approvalStatus === "PENDING_APPROVAL"
          ? "Hospital moved back to pending approval"
          : approvalStatus === "APPROVED"
          ? "Hospital approved successfully"
          : "Hospital rejected successfully",
      hospital,
    });
  } catch (error) {
    console.error("ADMIN HOSPITAL APPROVAL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update hospital approval status",
    });
  }
});

/* =========================================
   VERIFY HOSPITAL
   PATCH /api/admin/hospitals/:id/verify

   Hospital must be APPROVED first.
========================================= */
router.patch("/:id/verify", async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    // Backward compatibility for older hospital records:
    // Existing verified hospitals remain treated as approved.
    const currentApprovalStatus =
      hospital.approvalStatus ||
      (hospital.isVerified ? "APPROVED" : "PENDING_APPROVAL");

    if (currentApprovalStatus !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message:
          "Please approve this hospital before verifying it.",
        approvalStatus: currentApprovalStatus,
      });
    }

    hospital.approvalStatus = "APPROVED";
    hospital.isVerified = true;

    await hospital.save();

    return res.json({
      success: true,
      message: "Hospital verified successfully",
      hospital,
    });
  } catch (error) {
    console.error("ADMIN HOSPITAL VERIFY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify hospital",
    });
  }
});

/* =========================================
   ACTIVATE / DEACTIVATE HOSPITAL
   PATCH /api/admin/hospitals/:id/status

   Body: { "isActive": true/false }
========================================= */
router.patch("/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true, runValidators: true }
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    return res.json({
      success: true,
      message: isActive
        ? "Hospital activated successfully"
        : "Hospital deactivated successfully",
      hospital,
    });
  } catch (error) {
    console.error("ADMIN HOSPITAL STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update hospital status",
    });
  }
});

module.exports = router;