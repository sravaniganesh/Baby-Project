const mongoose = require("mongoose");

const adminRolePermissionSchema = new mongoose.Schema(
{
role:{
type:String,
required:true,
unique:true
},

permissions:[
{
type:String
}
]
},
{ timestamps:true }
);

module.exports = mongoose.model(
"AdminRolePermission",
adminRolePermissionSchema
);