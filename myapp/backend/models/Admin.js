const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // creates index automatically
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    /* ===============================
       ADMIN ROLE SYSTEM
    =============================== */

    role: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "FINANCE_ADMIN",
        "OPERATIONS_ADMIN",
        "SUPPORT_ADMIN",
        "ADMIN", // legacy support
      ],
      default: "SUPER_ADMIN",
    },

    /* ===============================
       ADMIN STATUS
    =============================== */

    isActive: {
      type: Boolean,
      default: true,
    },

    /* ===============================
       ADMIN PROFILE
    =============================== */

    name: {
      type: String,
      trim: true,
      default: "",
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/* ===============================
   HASH PASSWORD BEFORE SAVE
=============================== */

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

/* ===============================
   COMPARE PASSWORD
=============================== */

adminSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);