const express = require("express");
const router = express.Router();
const NotifyRequest = require("../models/NotifyRequest");

// Create notify request
router.post("/", async (req, res) => {
  try {
    const { userId, doctorId } = req.body;

    const exists = await NotifyRequest.findOne({
      userId,
      doctorId,
    });

    if (exists) {
      return res.json({ message: "Already requested" });
    }

    const notify = await NotifyRequest.create({
      userId,
      doctorId,
    });

    res.json(notify);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;