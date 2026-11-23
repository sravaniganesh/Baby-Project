
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const DoctorAssistant = require("../models/DoctorAssistant");
const Consultation = require("../models/Consultation");
const DoctorAvailability = require("../models/DoctorAvailability");
const DoctorHospital = require("../models/DoctorHospital");

router.use(protect, allowRoles("user"));

/* =====================================================
   COMMON HELPERS
===================================================== */

const getAssistantId = (req) => req.user?._id || req.user?.id;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const checkActiveAssistant = (req, res) => {
  if (!req.user || req.user.isActive === false) {
    res.status(403).json({
      success: false,
      message: "Your account is inactive.",
    });
    return false;
  }

  return true;
};

// Verify accepted doctor-assistant relationship and permission.
const getAuthorizedWorkspace = async (
  assistantId,
  doctorId,
  permission
) => {
  const relationship = await DoctorAssistant.findOne({
    assistantId,
    doctorId,
    status: "ACCEPTED",
  });

  if (!relationship) {
    return {
      authorized: false,
      message: "You do not have access to this doctor workspace.",
    };
  }

  if (!relationship.permissions?.[permission]) {
    return {
      authorized: false,
      message: "You do not have permission to perform this action.",
    };
  }

  return {
    authorized: true,
    relationship,
  };
};

const isValidTime = (value) =>
  typeof value === "string" &&
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const isValidDay = (value) =>
  Number.isInteger(Number(value)) &&
  Number(value) >= 0 &&
  Number(value) <= 6;

/* =====================================================
   EXISTING: GET PENDING INVITATIONS
===================================================== */

router.get("/invitations", async (req, res) => {
  try {
    if (!checkActiveAssistant(req, res)) return;

    const invitations = await DoctorAssistant.find({
      assistantId: getAssistantId(req),
      status: "PENDING",
    })
      .populate("doctorId", "name specialization")
      .sort({ invitedAt: -1 });

    return res.status(200).json({
      success: true,
      invitations,
    });
  } catch (error) {
    console.error("Assistant invitations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invitations.",
    });
  }
});

/* =====================================================
   EXISTING: ACCEPT INVITATION
===================================================== */

router.post("/invitations/:id/accept", async (req, res) => {
  try {
    if (!checkActiveAssistant(req, res)) return;

    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation ID.",
      });
    }

    const invitation = await DoctorAssistant.findOneAndUpdate(
      {
        _id: req.params.id,
        assistantId: getAssistantId(req),
        status: "PENDING",
      },
      {
        $set: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      },
      { new: true }
    ).populate("doctorId", "name specialization");

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found or no longer available.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor invitation accepted successfully.",
      invitation,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept invitation.",
    });
  }
});

/* =====================================================
   EXISTING: DECLINE INVITATION
===================================================== */

router.post("/invitations/:id/decline", async (req, res) => {
  try {
    if (!checkActiveAssistant(req, res)) return;

    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation ID.",
      });
    }

    const invitation = await DoctorAssistant.findOneAndUpdate(
      {
        _id: req.params.id,
        assistantId: getAssistantId(req),
        status: "PENDING",
      },
      {
        $set: {
          status: "DECLINED",
        },
      },
      { new: true }
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found or no longer available.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor invitation declined.",
      invitation,
    });
  } catch (error) {
    console.error("Decline invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to decline invitation.",
    });
  }
});

/* =====================================================
   EXISTING: ACCEPTED DOCTOR WORKSPACES
===================================================== */

router.get("/workspaces", async (req, res) => {
  try {
    if (!checkActiveAssistant(req, res)) return;

    const workspaces = await DoctorAssistant.find({
      assistantId: getAssistantId(req),
      status: "ACCEPTED",
    })
      .populate("doctorId", "name specialization")
      .sort({ acceptedAt: -1 });

    const activeWorkspaces = workspaces
      .filter((item) => item.doctorId)
      .map((item) => ({
        relationshipId: item._id,
        doctor: item.doctorId,
        permissions: item.permissions,
        acceptedAt: item.acceptedAt,
      }));

    return res.status(200).json({
      success: true,
      workspaces: activeWorkspaces,
    });
  } catch (error) {
    console.error("Assistant workspaces error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch assistant workspaces.",
    });
  }
});

/* =====================================================
   NEW: VIEW DOCTOR APPOINTMENTS
   Permission: viewAppointments
===================================================== */

router.get("/doctors/:doctorId/appointments", async (req, res) => {
  try {
    if (!checkActiveAssistant(req, res)) return;

    const { doctorId } = req.params;

    if (!isValidId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    const access = await getAuthorizedWorkspace(
      getAssistantId(req),
      doctorId,
      "viewAppointments"
    );

    if (!access.authorized) {
      return res.status(403).json({
        success: false,
        message: access.message,
      });
    }

    const filter = { doctorId };

    if (req.query.status) {
      const allowedStatuses = [
  "REQUESTED",
  "SLOT_PROPOSED",
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment status.",
        });
      }

      filter.status = req.query.status;
    }

    const canViewContact =
      access.relationship.permissions?.viewPatientContact === true;

    const patientFields = canViewContact
      ? "name email phone"
      : "name";

    const appointments = await Consultation.find(filter)
      .populate("userId", patientFields)
      .populate("doctorId", "name specialization")
      .populate("hospitalId", "name city address")
      .sort({ scheduledAt: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      appointments,
      permissions: access.relationship.permissions,
    });
  } catch (error) {
    console.error("Assistant appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments.",
    });
  }
});



/* =====================================================
   PROPOSE HOSPITAL APPOINTMENT SLOTS
   Permission: rescheduleAppointments
   Assistant manually proposes 1-3 times.
   All hospital appointment times use IST.
===================================================== */

router.patch(
  "/doctors/:doctorId/appointments/:appointmentId/reschedule",
  async (req, res) => {
    try {
      if (!checkActiveAssistant(req, res)) return;

      const { doctorId, appointmentId } = req.params;
      const { slotTimes } = req.body;

      // 1. Validate IDs
      if (!isValidId(doctorId) || !isValidId(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor or appointment ID.",
        });
      }

      // 2. Check assistant permission
      const access = await getAuthorizedWorkspace(
        getAssistantId(req),
        doctorId,
        "rescheduleAppointments"
      );

      if (!access.authorized) {
        return res.status(403).json({
          success: false,
          message: access.message,
        });
      }

      // 3. Validate manually selected times
      if (
        !Array.isArray(slotTimes) ||
        slotTimes.length < 1 ||
        slotTimes.length > 3
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide between 1 and 3 appointment times.",
        });
      }

      if (!slotTimes.every(isValidTime)) {
        return res.status(400).json({
          success: false,
          message: "All times must be valid HH:mm values.",
        });
      }

      // 4. Prevent duplicate times
      if (new Set(slotTimes).size !== slotTimes.length) {
        return res.status(400).json({
          success: false,
          message: "Duplicate appointment times are not allowed.",
        });
      }

      // 5. Find the patient's hospital consultation request
      const appointment = await Consultation.findOne({
        _id: appointmentId,
        doctorId,
        consultationType: "hospital",
        status: "REQUESTED",
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message:
            "Hospital request not found or cannot receive a slot proposal.",
        });
      }

      if (!appointment.hospitalId) {
        return res.status(400).json({
          success: false,
          message: "Hospital information is missing.",
        });
      }

      if (!appointment.preferredDate) {
        return res.status(400).json({
          success: false,
          message: "Patient's preferred date is missing.",
        });
      }

      // 6. Convert preferred date into an IST calendar date
      const TIME_ZONE = "Asia/Kolkata";

      const dateParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date(appointment.preferredDate));

      const dateValues = {};

      for (const part of dateParts) {
        if (part.type !== "literal") {
          dateValues[part.type] = part.value;
        }
      }

      const dateKey =
        `${dateValues.year}-${dateValues.month}-${dateValues.day}`;

      // 7. Convert IST date + HH:mm into a Date object
      const createISTDate = (date, time) => {
        const [year, month, day] = date.split("-").map(Number);
        const [hours, minutes] = time.split(":").map(Number);

        // IST is UTC +05:30
        return new Date(
          Date.UTC(
            year,
            month - 1,
            day,
            hours - 5,
            minutes - 30
          )
        );
      };

      const now = new Date();
      const proposedSlots = [];

      // 8. Validate each selected time and check conflicts
      for (const slotTime of slotTimes) {
        const scheduledAt = createISTDate(dateKey, slotTime);

        if (scheduledAt <= now) {
          return res.status(400).json({
            success: false,
            message: `The selected time ${slotTime} is in the past. Please select a future time.`,
          });
        }

        const existingAppointment = await Consultation.findOne({
          _id: { $ne: appointmentId },
          doctorId,
          hospitalId: appointment.hospitalId,
          scheduledAt,
          slotTime,
          status: {
            $in: [
              "REQUESTED",
              "SLOT_PROPOSED",
              "AWAITING_PAYMENT",
              "CONFIRMED",
              "IN_PROGRESS",
            ],
          },
        });

        if (existingAppointment) {
          return res.status(409).json({
            success: false,
            message: `The time ${slotTime} is already occupied. Please select another time.`,
          });
        }

        proposedSlots.push({
          scheduledAt,
          slotTime,
        });
      }

     // 9. Atomically claim the request.
// Only one of the doctor or assistant proposal endpoints can win.
const updatedAppointment = await Consultation.findOneAndUpdate(
  {
    _id: appointmentId,
    doctorId,
    consultationType: "hospital",
    status: "REQUESTED",
  },
  {
    $set: {
      proposedSlots,
      proposedAt: proposedSlots[0].scheduledAt,
      proposedBy: "assistant",
      status: "SLOT_PROPOSED",
    },
  },
  { new: true, runValidators: true }
);

if (!updatedAppointment) {
  return res.status(409).json({
    success: false,
    message:
      "Appointment times have already been proposed by the doctor or assistant. Please refresh the appointments list.",
  });
}

return res.status(200).json({
  success: true,
  message:
    "Appointment times proposed successfully. Waiting for the patient to select a time.",
  appointment: updatedAppointment,
  availableSlots: proposedSlots,
});
    } catch (error) {
      console.error("Assistant slot proposal error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to propose appointment times.",
      });
    }
  }
);



/* =====================================================
   NEW: REJECT APPOINTMENT
   Permission: respondToAppointments
===================================================== */

router.patch(
  "/doctors/:doctorId/appointments/:appointmentId/reject",
  async (req, res) => {
    try {
      if (!checkActiveAssistant(req, res)) return;

      const { doctorId, appointmentId } = req.params;

      if (!isValidId(doctorId) || !isValidId(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor or appointment ID.",
        });
      }

      const access = await getAuthorizedWorkspace(
        getAssistantId(req),
        doctorId,
        "respondToAppointments"
      );

      if (!access.authorized) {
        return res.status(403).json({
          success: false,
          message: access.message,
        });
      }

     const appointment = await Consultation.findOneAndUpdate(
  {
    _id: appointmentId,
    doctorId,
    status: { $in: ["REQUESTED", "SLOT_PROPOSED"] },
  },
  {
    $set: {
      status: "REJECTED",
    },
  },
  { new: true }
)
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found or is no longer awaiting approval.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Appointment rejected successfully.",
        appointment,
      });
    } catch (error) {
      console.error("Assistant reject appointment error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to reject appointment.",
      });
    }
  }
);

/* =====================================================
   NEW: RESCHEDULE APPOINTMENT
   Permission: rescheduleAppointments
===================================================== */

router.patch(
  "/doctors/:doctorId/appointments/:appointmentId/change-slot",
  async (req, res) => {
    try {
      if (!checkActiveAssistant(req, res)) return;

      const { doctorId, appointmentId } = req.params;
      const { scheduledAt, slotTime } = req.body;

      if (!isValidId(doctorId) || !isValidId(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor or appointment ID.",
        });
      }

      if (!scheduledAt || !slotTime || !isValidTime(slotTime)) {
        return res.status(400).json({
          success: false,
          message: "A valid scheduledAt date and slotTime in HH:mm format are required.",
        });
      }

      const newDate = new Date(scheduledAt);

      if (Number.isNaN(newDate.getTime()) || newDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid future appointment date.",
        });
      }

      const access = await getAuthorizedWorkspace(
        getAssistantId(req),
        doctorId,
        "rescheduleAppointments"
      );

      if (!access.authorized) {
        return res.status(403).json({
          success: false,
          message: access.message,
        });
      }

      const appointment = await Consultation.findOne({
        _id: appointmentId,
        doctorId,
        status: { $in: ["REQUESTED", "CONFIRMED"] },
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found or cannot be rescheduled.",
        });
      }

      const existing = await Consultation.findOne({
        _id: { $ne: appointmentId },
        doctorId,
        hospitalId: appointment.hospitalId || null,
        scheduledAt: newDate,
        slotTime,
        status: {
          $in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"],
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "This appointment slot is already booked.",
        });
      }

      appointment.scheduledAt = newDate;
      appointment.slotTime = slotTime;

      await appointment.save();

      return res.status(200).json({
        success: true,
        message: "Appointment rescheduled successfully.",
        appointment,
      });
    } catch (error) {
      console.error("Assistant reschedule error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to reschedule appointment.",
      });
    }
  }
);

/* =====================================================
   NEW: VIEW DOCTOR AVAILABILITY
   Permission: manageSlots
===================================================== */

router.get("/doctors/:doctorId/availability", async (req, res) => {
  try {
    if (!checkActiveAssistant(req, res)) return;

    const { doctorId } = req.params;

    if (!isValidId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    const access = await getAuthorizedWorkspace(
      getAssistantId(req),
      doctorId,
      "manageSlots"
    );

    if (!access.authorized) {
      return res.status(403).json({
        success: false,
        message: access.message,
      });
    }

    const availability = await DoctorAvailability.find({
      doctorId,
    })
      .populate("hospitalId", "name city")
      .sort({ dayOfWeek: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      availability,
    });
  } catch (error) {
    console.error("Assistant availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch availability.",
    });
  }
});

/* =====================================================
   ACCEPT VIDEO APPOINTMENT REQUEST
   Permission: respondToAppointments
===================================================== */

router.patch(
  "/doctors/:doctorId/appointments/:appointmentId/accept",
  async (req, res) => {
    try {
      if (!checkActiveAssistant(req, res)) return;

      const { doctorId, appointmentId } = req.params;

      if (!isValidId(doctorId) || !isValidId(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor or appointment ID.",
        });
      }

      const access = await getAuthorizedWorkspace(
        getAssistantId(req),
        doctorId,
        "respondToAppointments"
      );

      if (!access.authorized) {
        return res.status(403).json({
          success: false,
          message: access.message,
        });
      }

      const appointment = await Consultation.findOne({
        _id: appointmentId,
        doctorId,
        consultationType: "video",
        status: "REQUESTED",
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Video request not found or already processed.",
        });
      }

      if (Number(appointment.consultationFee || 0) > 0) {
        appointment.status = "AWAITING_PAYMENT";
        appointment.paymentStatus = "PENDING";
      } else {
        appointment.status = "CONFIRMED";
        appointment.paymentStatus = "FREE";
      }

      await appointment.save();

      return res.status(200).json({
        success: true,
        message:
          appointment.paymentStatus === "FREE"
            ? "Free video appointment accepted."
            : "Video appointment accepted. Waiting for patient payment.",
        appointment,
      });
    } catch (error) {
      console.error("Assistant accept video appointment error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to accept video appointment.",
      });
    }
  }
);


/* =====================================================
   NEW: CREATE AVAILABILITY
   Permission: manageSlots
===================================================== */

router.post("/doctors/:doctorId/availability", async (req, res) => {
  try {
    if (!checkActiveAssistant(req, res)) return;

    const { doctorId } = req.params;
    const {
      hospitalId,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration,
    } = req.body;

    if (!isValidId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    const access = await getAuthorizedWorkspace(
      getAssistantId(req),
      doctorId,
      "manageSlots"
    );

    if (!access.authorized) {
      return res.status(403).json({
        success: false,
        message: access.message,
      });
    }

    if (
      !isValidDay(dayOfWeek) ||
      !isValidTime(startTime) ||
      !isValidTime(endTime) ||
      startTime >= endTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid day and availability time range.",
      });
    }

    const duration = Number(slotDuration || 30);

    if (!Number.isInteger(duration) || duration < 1 || duration > 240) {
      return res.status(400).json({
        success: false,
        message: "Slot duration must be between 1 and 240 minutes.",
      });
    }

    if (hospitalId) {
      if (!isValidId(hospitalId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid hospital ID.",
        });
      }

      const association = await DoctorHospital.findOne({
        doctorId,
        hospitalId,
        status: "approved",
        isActive: true,
      });

      if (!association) {
        return res.status(403).json({
          success: false,
          message: "Doctor is not approved at this hospital.",
        });
      }
    }

    const availability = await DoctorAvailability.create({
      doctorId,
      hospitalId: hospitalId || null,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      slotDuration: duration,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Availability created successfully.",
      availability,
    });
  } catch (error) {
    console.error("Assistant create availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create availability.",
    });
  }
});

/* =====================================================
   NEW: UPDATE AVAILABILITY
   Permission: manageSlots
===================================================== */

router.patch(
  "/doctors/:doctorId/availability/:availabilityId",
  async (req, res) => {
    try {
      if (!checkActiveAssistant(req, res)) return;

      const { doctorId, availabilityId } = req.params;
      const { dayOfWeek, startTime, endTime, slotDuration, isActive } =
        req.body;

      if (!isValidId(doctorId) || !isValidId(availabilityId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor or availability ID.",
        });
      }

      const access = await getAuthorizedWorkspace(
        getAssistantId(req),
        doctorId,
        "manageSlots"
      );

      if (!access.authorized) {
        return res.status(403).json({
          success: false,
          message: access.message,
        });
      }

      const availability = await DoctorAvailability.findOne({
        _id: availabilityId,
        doctorId,
      });

      if (!availability) {
        return res.status(404).json({
          success: false,
          message: "Availability not found.",
        });
      }

      if (dayOfWeek !== undefined) {
        if (!isValidDay(dayOfWeek)) {
          return res.status(400).json({
            success: false,
            message: "Invalid day of week.",
          });
        }

        availability.dayOfWeek = Number(dayOfWeek);
      }

      if (startTime !== undefined) {
        if (!isValidTime(startTime)) {
          return res.status(400).json({
            success: false,
            message: "Invalid start time.",
          });
        }

        availability.startTime = startTime;
      }

      if (endTime !== undefined) {
        if (!isValidTime(endTime)) {
          return res.status(400).json({
            success: false,
            message: "Invalid end time.",
          });
        }

        availability.endTime = endTime;
      }

      if (availability.startTime >= availability.endTime) {
        return res.status(400).json({
          success: false,
          message: "End time must be later than start time.",
        });
      }

      if (slotDuration !== undefined) {
        const duration = Number(slotDuration);

        if (!Number.isInteger(duration) || duration < 1 || duration > 240) {
          return res.status(400).json({
            success: false,
            message: "Slot duration must be between 1 and 240 minutes.",
          });
        }

        availability.slotDuration = duration;
      }

      if (isActive !== undefined) {
        if (typeof isActive !== "boolean") {
          return res.status(400).json({
            success: false,
            message: "isActive must be true or false.",
          });
        }

        availability.isActive = isActive;
      }

      await availability.save();

      return res.status(200).json({
        success: true,
        message: "Availability updated successfully.",
        availability,
      });
    } catch (error) {
      console.error("Assistant update availability error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update availability.",
      });
    }
  }
);

/* =====================================================
   NEW: DEACTIVATE AVAILABILITY
   Permission: manageSlots
===================================================== */

router.delete(
  "/doctors/:doctorId/availability/:availabilityId",
  async (req, res) => {
    try {
      if (!checkActiveAssistant(req, res)) return;

      const { doctorId, availabilityId } = req.params;

      if (!isValidId(doctorId) || !isValidId(availabilityId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor or availability ID.",
        });
      }

      const access = await getAuthorizedWorkspace(
        getAssistantId(req),
        doctorId,
        "manageSlots"
      );

      if (!access.authorized) {
        return res.status(403).json({
          success: false,
          message: access.message,
        });
      }

      const availability = await DoctorAvailability.findOneAndUpdate(
        {
          _id: availabilityId,
          doctorId,
        },
        {
          $set: {
            isActive: false,
          },
        },
        { new: true }
      );

      if (!availability) {
        return res.status(404).json({
          success: false,
          message: "Availability not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Availability deactivated successfully.",
        availability,
      });
    } catch (error) {
      console.error("Assistant deactivate availability error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to deactivate availability.",
      });
    }
  }
);

module.exports = router;
