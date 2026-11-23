
const admin = require("firebase-admin");
const path = require("path");

let isInitialized = false;

function initializeFirebase() {
  if (isInitialized) return;

  const serviceAccount = require(
    path.join(__dirname, "../config/firebaseServiceAccount.json")
  );

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  isInitialized = true;
  console.log("🔥 Firebase initialized");
}

async function sendPushNotification({
  token,
  tokens = [],
  title,
  body,
  data = {},
}) {
  try {
    const uniqueTokens = [
      ...new Set(
        [...tokens, token]
          .filter(Boolean)
          .filter((value) => typeof value === "string")
      ),
    ];

    if (uniqueTokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
      };
    }

    const safeData = Object.keys(data || {}).reduce((acc, key) => {
      const value = data[key];

      if (value !== undefined && value !== null) {
        acc[key] =
          typeof value === "object"
            ? JSON.stringify(value)
            : String(value);
      }

      return acc;
    }, {});

    let totalSuccess = 0;
    let totalFailure = 0;
    const invalidTokens = [];

    // Firebase multicast supports up to 500 tokens per request.
    for (let i = 0; i < uniqueTokens.length; i += 500) {
      const tokenBatch = uniqueTokens.slice(i, i + 500);

      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokenBatch,
        notification: {
          title,
          body,
        },
        data: safeData,
        android: {
          priority: "high",
        },
      });

      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      response.responses.forEach((result, index) => {
        if (!result.success) {
          const errorCode = result.error?.code;

          console.error(
            "❌ FCM delivery failed:",
            errorCode,
            result.error?.message
          );

          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            invalidTokens.push(tokenBatch[index]);
          }
        }
      });
    }

    console.log(
      `🔥 FCM result: ${totalSuccess} successful, ${totalFailure} failed`
    );

    return {
      successCount: totalSuccess,
      failureCount: totalFailure,
      invalidTokens,
    };
  } catch (error) {
    console.error("❌ FCM send error:", error.message);

    return {
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
      error: error.message,
    };
  }
}

module.exports = {
  initializeFirebase,
  sendPushNotification,
};
