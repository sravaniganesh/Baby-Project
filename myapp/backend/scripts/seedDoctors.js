const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Doctor = require("../models/Doctor");
require("dotenv").config();

async function seedDoctors() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Doctor.deleteMany();

    const hashedPassword = await bcrypt.hash("doctor123", 10);

    await Doctor.insertMany([
      {
        name: "Dr. Ananya Sharma",
        email: "ananya@doctor.com",
        password: hashedPassword,
        role: "doctor",
        specialty: "Gynecologist",
        availability: "online",
      },
      {
        name: "Dr. Meera Rao",
        email: "meera@doctor.com",
        password: hashedPassword,
        role: "doctor",
        specialty: "Dermatologist",
        availability: "busy",
      },
      {
        name: "Dr. Priya Nair",
        email: "priya@doctor.com",
        password: hashedPassword,
        role: "doctor",
        specialty: "Nutritionist",
        availability: "offline",
      },
    ]);

    console.log("✅ Doctors seeded successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
}

seedDoctors();
