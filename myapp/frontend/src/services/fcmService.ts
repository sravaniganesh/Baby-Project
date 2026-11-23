
import { getApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import API from '../config/api';

/* =========================================
   🔔 REQUEST NOTIFICATION PERMISSION
========================================= */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    console.log('🔔 FCM: Requesting permission...');

    getApp();

    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ FCM Permission Granted');
    } else {
      console.log('❌ FCM Permission Denied');
    }

    return enabled;
  } catch (error) {
    console.log('❌ FCM Permission Error:', error);
    return false;
  }
};

/* =========================================
   📱 REGISTER FCM TOKEN TO USER BACKEND
========================================= */
export const registerFcmToken = async (): Promise<void> => {
  try {
    console.log('📱 FCM: Getting token...');

    getApp();

    const token = await messaging().getToken();

    if (!token) {
      console.log('❌ FCM: No token received');
      return;
    }

    await API.post('/user/save-fcm', {
      fcmToken: token,
    });

    console.log('✅ FCM Token saved to backend');
  } catch (error) {
    console.log('❌ FCM Token Error:', error);
  }
};

/* =========================================
   🔄 LISTEN FOR FCM TOKEN REFRESH
========================================= */
export const listenForFcmTokenRefresh = () => {
  try {
    getApp();

    const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
      try {
        if (!newToken) return;

        console.log('🔄 FCM token refreshed');

        await API.post('/user/save-fcm', {
          fcmToken: newToken,
        });

        console.log('✅ Refreshed FCM token saved');
      } catch (error) {
        console.log('❌ FCM refresh registration error:', error);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.log('❌ FCM refresh listener error:', error);
    return () => {};
  }
};
