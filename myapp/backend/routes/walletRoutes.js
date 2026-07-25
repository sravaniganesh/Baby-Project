const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getWallet,
  addMoney,
} = require("../controllers/walletController");

/* ===============================
   GET WALLET
=============================== */
router.get("/", protect, getWallet);

/* ===============================
   ADD MONEY
=============================== */
router.post("/add", protect, addMoney);

module.exports = router;