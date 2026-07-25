const express = require("express");
const router = express.Router();

const DoctorAvailability = require("../models/DoctorAvailability");

/* =========================
   GET DOCTOR SLOTS
========================= */

router.get("/:doctorId", async (req, res) => {

  try {

    const availability = await DoctorAvailability.find({
      doctorId: req.params.doctorId,
    });

    res.json(availability);

  } catch (err) {

    console.error("GET DOCTOR SLOTS ERROR:", err);

    res.status(500).json({
      message: "Failed to load doctor slots",
    });

  }

});

module.exports = router;