import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getNotifications,
  getUnreadCount,
} from "../services/notificationService";
import { connectSocket } from "../services/socket";

type NotificationContextType = {
  notifications: any[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  refreshUnread: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>(
  {} as NotificationContextType
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.log("Notification fetch error", err);
    }
  };

  const loadUnread = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.log("Unread count error", err);
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
    await loadUnread();
  };

  const refreshUnread = async () => {
    await loadUnread();
  };

  useEffect(() => {
    refreshNotifications();

    const socket = connectSocket();

    if (!socket) return;

    socket.on("new_notification", (notification: any) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("new_notification");
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        refreshUnread,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);