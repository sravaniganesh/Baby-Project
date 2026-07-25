require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const admin = new Admin({
      email: "admin@myapp.com",
      password: "Admin@123",
      isActive: true,
    });

    await admin.save();
    console.log("✅ Admin created & password hashed");

    process.exit(0);
  } catch (err) {
    console.error("❌ Create admin failed:", err.message);
    process.exit(1);
  }
}

createAdmin();
