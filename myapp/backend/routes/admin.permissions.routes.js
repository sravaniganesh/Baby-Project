const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const allowRoles = require("../middleware/adminRole");

const AdminRolePermission = require("../models/AdminRolePermission");

/* =========================
GET ROLE PERMISSIONS
========================= */

router.get(
"/permissions",
adminAuth,
allowRoles("SUPER_ADMIN"),
async (req,res)=>{
try{

const roles = await AdminRolePermission.find();

res.json(roles);

}catch(err){

console.error("ROLE PERMISSION ERROR:",err);

res.status(500).json({
message:"Failed to load role permissions"
});

}
}
);

/* =========================
UPDATE ROLE PERMISSIONS
========================= */

router.patch(
"/permissions/:role",
adminAuth,
allowRoles("SUPER_ADMIN"),
async (req,res)=>{
try{

const { permissions } = req.body;

const role = await AdminRolePermission.findOneAndUpdate(
{ role:req.params.role },
{ permissions },
{ new:true, upsert:true }
);

res.json({
success:true,
role
});

}catch(err){

console.error("ROLE UPDATE ERROR:",err);

res.status(500).json({
message:"Failed to update permissions"
});

}
}
);

module.exports = router;