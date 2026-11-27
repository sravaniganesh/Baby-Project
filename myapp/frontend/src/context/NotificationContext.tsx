import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getNotifications,
  getUnreadCount,
} from "../services/notificationService";
import { connectSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

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
  const { token } = useAuth();

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.log("Notification fetch error", err);
    }
  }, []);

  const loadUnread = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.log("Unread count error", err);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
    await loadUnread();
  }, [loadNotifications, loadUnread]);

  const refreshUnread = useCallback(async () => {
    await loadUnread();
  }, [loadUnread]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    void refreshNotifications();

    const socket = connectSocket();

    if (!socket) return;

    socket.on("new_notification", (notification: any) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("new_notification");
    };
  }, [refreshNotifications, token]);

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