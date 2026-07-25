import { getApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import API from '../config/api';

/* =========================================
   🔔 REQUEST NOTIFICATION PERMISSION
========================================= */
export const requestNotificationPermission = async () => {
  try {
    console.log("🔔 FCM: Requesting permission...");

    getApp();

    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log("✅ FCM Permission Granted");
    } else {
      console.log("❌ FCM Permission Denied");
    }

  } catch (error) {
    console.log("❌ FCM Permission Error:", error);
  }
};

/* =========================================
   📱 REGISTER FCM TOKEN TO BACKEND
========================================= */
export const registerFcmToken = async () => {
  try {
    console.log("📱 FCM: Getting token...");

    getApp();

    const token = await messaging().getToken();

    if (!token) {
      console.log("❌ FCM: No token received");
      return;
    }

    console.log("✅ FCM TOKEN:", token);

    await API.post("/user/save-fcm", {
      fcmToken: token,
    });

    console.log("✅ FCM Token saved to backend");

  } catch (error) {
    console.log("❌ FCM Token Error:", error);
  }
};