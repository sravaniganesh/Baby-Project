
const express = require("express");
const router = express.Router();

const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const DoctorHospital = require("../models/DoctorHospital");
const DoctorAssistant = require("../models/DoctorAssistant");

const protect = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// All routes require authentication.
// Doctor and assistant permissions are checked individually below.
router.use(protect);

const getUserId = (req) => req.user?._id || req.user?.id;

const validateFee = (value) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === "" ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 0
  ) {
    return null;
  }

  return Number(value);
};

// Resolve the doctor whose hospital association is being managed.
// Doctors can manage only their own associations.
// Assistants need an accepted relationship and manageHospitalFees permission.
const getAuthorizedDoctorId = async (req, requestedDoctorId) => {
  const userId = getUserId(req);

  if (!userId) {
    return null;
  }

  if (req.user?.role === "doctor") {
    return userId;
  }

  if (req.user?.role !== "user" || !requestedDoctorId) {
    return null;
  }

  const relationship = await DoctorAssistant.findOne({
    doctorId: requestedDoctorId,
    assistantId: userId,
    status: "ACCEPTED",
    "permissions.manageHospitalFees": true,
  }).select("_id doctorId");

  return relationship?.doctorId || null;
};

const isValidDoctorContext = async (doctorId) => {
  if (!doctorId) {
    return false;
  }

  return Boolean(await Doctor.exists({ _id: doctorId }));
};


// GET /api/doctor-hospitals/my
// Doctor: own associations.
// Assistant: pass authorized doctor's ID as ?doctorId=...
router.get("/my", async (req, res) => {
  try {
    const requestedDoctorId =
      req.user?.role === "doctor"
        ? null
        : req.query.doctorId;

    const doctorId = await getAuthorizedDoctorId(
      req,
      requestedDoctorId
    );

    if (!doctorId) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view these hospital associations",
      });
    }

    const associations = await DoctorHospital.find({ doctorId })
      .populate(
        "hospitalId",
        "name hospitalType address city state country pincode isVerified isActive"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: associations.length,
      associations,
    });
  } catch (error) {
    console.error("DOCTOR HOSPITAL LIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load hospital associations",
    });
  }
});


// GET /api/doctor-hospitals/search?search=&city=&doctorId=
// Search active hospitals.
// Assistants must identify the doctor they are authorized to represent.
router.get("/search", async (req, res) => {
  try {
    const requestedDoctorId =
      req.user?.role === "doctor"
        ? null
        : req.query.doctorId;

    const doctorId = await getAuthorizedDoctorId(
      req,
      requestedDoctorId
    );

    if (!doctorId) {
      return res.status(403).json({
        message: "You are not authorized to search hospitals for this doctor",
      });
    }

    const search = String(req.query.search || "").trim();
    const city = String(req.query.city || "").trim();

    const filter = { isActive: true };

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (city) {
      filter.city = {
        $regex: city,
        $options: "i",
      };
    }

    const hospitals = await Hospital.find(filter)
      .select(
        "name hospitalType address city state country pincode departments isVerified"
      )
      .sort({ name: 1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      hospitals,
    });
  } catch (error) {
    console.error("DOCTOR HOSPITAL SEARCH ERROR:", error);

    return res.status(500).json({
      message: "Failed to search hospitals",
    });
  }
});

// POST /api/doctor-hospitals/request
// Doctor or authorized assistant can submit a hospital association request.
// Assistant must send doctorId in the request body.
router.post("/request", async (req, res) => {
  try {
    const requestedDoctorId =
      req.user?.role === "doctor"
        ? null
        : req.body.doctorId;

    const doctorId = await getAuthorizedDoctorId(
      req,
      requestedDoctorId
    );

    if (!doctorId) {
      return res.status(403).json({
        message: "You do not have permission to manage hospital associations for this doctor",
      });
    }

    const {
      hospitalId,
      department,
      designation,
      consultationFee,
    } = req.body;

    if (!hospitalId) {
      return res.status(400).json({
        message: "Hospital is required",
      });
    }

    const fee = validateFee(consultationFee);

    if (fee === null) {
      return res.status(400).json({
        message: "Please enter a valid consultation fee",
      });
    }

    const doctorExists = await isValidDoctorContext(doctorId);

    if (!doctorExists) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    const hospital = await Hospital.findOne({
      _id: hospitalId,
      isActive: true,
    });

    if (!hospital) {
      return res.status(404).json({
        message: "Hospital not found or is currently inactive",
      });
    }

    let association = await DoctorHospital.findOne({
      doctorId,
      hospitalId,
    });

    if (association) {
      if (
        association.status === "pending" ||
        association.status === "approved"
      ) {
        return res.status(409).json({
          message:
            association.status === "pending"
              ? "A request for this hospital is already pending"
              : "This doctor is already approved at this hospital. Update the fee using the fee-update endpoint.",
          association,
        });
      }

      // Preserve the existing rejected-request resubmission flow.
      association.department = department?.trim() || "";
      association.designation = designation?.trim() || "";
      association.consultationFee = fee;
      association.bookingMode = "request";
      association.status = "pending";
      association.isActive = true;
      association.joinedAt = null;

      await association.save();
    } else {
      association = await DoctorHospital.create({
        doctorId,
        hospitalId,
        department: department?.trim() || "",
        designation: designation?.trim() || "",
        consultationFee: fee,
        bookingMode: "request",
        status: "pending",
        isActive: true,
      });
    }

    await association.populate(
      "hospitalId",
      "name hospitalType address city state country isVerified"
    );

    return res.status(201).json({
      success: true,
      message: "Hospital association request submitted for admin approval",
      association,
    });
  } catch (error) {
    console.error("DOCTOR HOSPITAL REQUEST ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A request for this hospital already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to submit hospital request",
    });
  }
});

// PATCH /api/doctor-hospitals/:id/fee
// Update the consultation fee for an existing approved hospital association.
// Doctor can update their own fee.
// Assistant requires manageHospitalFees permission.
router.patch("/:id/fee", async (req, res) => {
  try {
    const fee = validateFee(req.body.consultationFee);

    if (fee === null) {
      return res.status(400).json({
        message: "Please enter a valid consultation fee",
      });
    }

    const association = await DoctorHospital.findById(req.params.id);

    if (!association) {
      return res.status(404).json({
        message: "Hospital association not found",
      });
    }

    const doctorId = await getAuthorizedDoctorId(
      req,
      association.doctorId.toString()
    );

    if (
      !doctorId ||
      doctorId.toString() !== association.doctorId.toString()
    ) {
      return res.status(403).json({
        message: "You are not authorized to update this hospital fee",
      });
    }

    if (
      association.status !== "approved" ||
      association.isActive !== true
    ) {
      return res.status(400).json({
        message: "Only active, approved hospital associations can have their fee updated",
      });
    }

    association.consultationFee = fee;

    await association.save();

    await association.populate(
      "hospitalId",
      "name hospitalType address city state country"
    );

    return res.status(200).json({
      success: true,
      message: "Hospital consultation fee updated successfully",
      association,
    });
  } catch (error) {
    console.error("HOSPITAL FEE UPDATE ERROR:", error);

    return res.status(500).json({
      message: "Failed to update hospital consultation fee",
    });
  }
});

module.exports = router;
