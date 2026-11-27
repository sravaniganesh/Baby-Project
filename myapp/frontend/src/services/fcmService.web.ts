export const requestNotificationPermission = async (): Promise<boolean> => {
  console.info("Push notifications are not configured for the web app.");
  return false;
};

export const registerFcmToken = async (): Promise<void> => {};

export const listenForFcmTokenRefresh = () => () => {};
