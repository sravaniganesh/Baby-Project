import { useEffect, useState } from "react";
import { connectAdminSocket } from "../services/adminSocket";

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem("admin"));

    if (!admin) return;

    const socket = connectAdminSocket(admin.id);

    const handleEvent = (data) => {
      setNotifications((prev) => [data, ...prev]);
    };

    socket.on("admin_event", handleEvent);

    return () => {
      socket.off("admin_event", handleEvent);
    };
  }, []);

  return (
    <div style={styles.wrapper}>
      <div onClick={() => setOpen(!open)}>
        🔔 {notifications.length}
      </div>

      {open && notifications.length > 0 && (
        <div style={styles.dropdown}>
          {notifications.map((n, i) => (
            <div key={i} style={styles.item}>
              {n.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
    cursor: "pointer",
    fontSize: 20,
  },

  dropdown: {
    position: "absolute",
    right: 0,
    top: 30,
    width: 260,
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    padding: 10,
    zIndex: 100,
  },

  item: {
    padding: 6,
    borderBottom: "1px solid #eee",
    fontSize: 14,
  },
};