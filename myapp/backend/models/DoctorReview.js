const mongoose = require("mongoose");

const doctorReviewSchema = new mongoose.Schema(
{
doctor: {
type: mongoose.Schema.Types.ObjectId,
ref: "Doctor",
required: true,
},

user: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true,
},

rating: {
type: Number,
required: true,
min: 1,
max: 5,
},

comment: {
type: String,
default: "",
},
},
{ timestamps: true }
);

module.exports = mongoose.model("DoctorReview", doctorReviewSchema);