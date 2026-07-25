require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const hashedPassword = await bcrypt.hash("123456", 10);

    const result = await User.updateOne(
      { email: "ganesh@test.com" },
      { $set: { password: hashedPassword } }
    );

    console.log("✅ Password reset result:", result);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  });
