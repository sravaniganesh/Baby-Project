const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const DoctorSettlement = require("../models/DoctorSettlement");

/* =====================================
   DOCTOR — VIEW OWN SETTLEMENTS
   GET /api/doctor/settlements
===================================== */
router.get(
  "/",
  protect,
  allowRoles("doctor"),
  async (req, res) => {
    try {
      const settlements = await DoctorSettlement.find({
        doctorId: req.user._id,
      }).sort({ createdAt: -1 });

      res.json(settlements);
    } catch (err) {
      console.error("DOCTOR SETTLEMENT VIEW ERROR:", err);
      res.status(500).json([]);
    }
  }
);

module.exports = router;
