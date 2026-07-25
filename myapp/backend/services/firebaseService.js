// backend/services/firebaseService.js

const admin = require("firebase-admin");
const path = require("path");

let isInitialized = false;

function initializeFirebase() {
  if (isInitialized) return;

  const serviceAccount = require(path.join(
    __dirname,
    "../config/firebaseServiceAccount.json"
  ));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  isInitialized = true;
  console.log("🔥 Firebase initialized");
}

async function sendPushNotification({ token, title, body, data = {} }) {
  try {
    if (!token) return;

    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: Object.keys(data).reduce((acc, key) => {
        acc[key] = String(data[key]);
        return acc;
      }, {}),
    };

    await admin.messaging().send(message);
  } catch (error) {
    console.error("❌ FCM send error:", error.message);
  }
}

module.exports = {
  initializeFirebase,
  sendPushNotification,
};