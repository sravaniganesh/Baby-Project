const express = require("express");
const router = express.Router();

const Doctor = require("../models/Doctor");
const DoctorReview = require("../models/DoctorReview");
const protect = require("../middleware/authMiddleware");

/* ============================
   ADD REVIEW
============================ */

router.post("/", protect, async (req, res) => {
try {

const { doctorId, rating, comment } = req.body;

const review = await DoctorReview.create({
doctor: doctorId,
user: req.user._id,
rating,
comment,
});

const reviews = await DoctorReview.find({ doctor: doctorId });

const avgRating =
reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

await Doctor.findByIdAndUpdate(doctorId, {
rating: avgRating,
reviewCount: reviews.length,
});

res.json({ success: true });

} catch (err) {
console.error(err);
res.status(500).json({ message: "Review failed" });
}
});

module.exports = router;