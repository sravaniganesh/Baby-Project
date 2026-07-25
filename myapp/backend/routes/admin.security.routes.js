const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");

const AdminSecurityEvent = require("../models/AdminSecurityEvent");

/* =========================
SECURITY EVENTS
========================= */

router.get(
"/security-events",
adminAuth,
allowRoles("SUPER_ADMIN"),
async (req,res)=>{

try{

const events = await AdminSecurityEvent
.find()
.sort({createdAt:-1})
.limit(50);

res.json(events);

}catch(err){

console.error("SECURITY EVENTS ERROR:",err);

res.status(500).json({
message:"Failed to load security events"
});

}

}
);

module.exports = router;