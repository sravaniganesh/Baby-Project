import API from "../config/api";

export const getNotifications = async () => {
  const res = await API.get("/notifications");
  return res.data;
};

export const getUnreadCount = async () => {
  const res = await API.get("/notifications/unread-count");
  return res.data.unreadCount;
};

export const markNotificationRead = async (id: string) => {
  await API.patch(`/notifications/${id}/read`);
};

export const deleteNotification = async (id: string) => {
  await API.delete(`/notifications/${id}`);
};

export const clearNotifications = async () => {
  await API.patch("/notifications/clear-all");
};