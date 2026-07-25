const mongoose = require("mongoose");

const adminSecurityEventSchema = new mongoose.Schema(
{
type:{
type:String,
required:true
},

severity:{
type:String,
enum:["LOW","MEDIUM","HIGH"],
default:"LOW"
},

message:{
type:String
},

adminId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Admin"
},

metadata:{
type:Object
}

},
{ timestamps:true }
);

module.exports = mongoose.model(
"AdminSecurityEvent",
adminSecurityEventSchema
);