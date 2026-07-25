// backend/config/firebaseAdmin.js
const admin = require("firebase-admin");
const path = require("path");

// Path to service account JSON
const serviceAccount = require(path.join(__dirname, "firebaseServiceAccount.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = (null);
