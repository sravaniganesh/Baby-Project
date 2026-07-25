import { useEffect, useState } from "react";
import API from "../config/api";
export default function AdminNotificationControlPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("");
  const [stage, setStage] = useState("");
  const [scheduled, setScheduled] = useState([]);

  useEffect(() => {
    loadScheduled();
  }, []);

 const loadScheduled = async () => {
  const token = localStorage.getItem("adminToken");

  const res = await API.get(
    "/admin/scheduled-notifications",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = res.data;
  setScheduled(data);
};

const sendBroadcast = async () => {
  const token = localStorage.getItem("adminToken");

  await API.post(
    "/admin/notifications/broadcast",
    { title, message },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  alert("Broadcast sent");
};

const sendTargeted = async () => {
  const token = localStorage.getItem("adminToken");

  await API.post(
    "/admin/notifications/targeted",
    {
      title,
      message,
      city,
      stage,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  alert("Targeted notification sent");
};

const scheduleNotification = async () => {
  const token = localStorage.getItem("adminToken");

  await API.post(
    "/admin/scheduled-notifications",
    {
      title,
      message,
      city,
      stage,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  loadScheduled();
};

  return (
    <div>
      <h2>Notification Control Center</h2>

      <div style={styles.form}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <input
          placeholder="City (optional)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <input
          placeholder="Women Stage (optional)"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
        />

        <div style={styles.buttons}>
          <button onClick={sendBroadcast}>Send Broadcast</button>
          <button onClick={sendTargeted}>Send Targeted</button>
          <button onClick={scheduleNotification}>Schedule</button>
        </div>
      </div>

      <h3 style={{ marginTop: 40 }}>Scheduled Notifications</h3>

      {scheduled.map((n) => (
        <div key={n._id} style={styles.card}>
          <b>{n.title}</b>
          <div>{n.message}</div>
          <div>City: {n.city || "All"}</div>
          <div>Stage: {n.stage || "All"}</div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxWidth: 500,
  },

  buttons: {
    display: "flex",
    gap: 10,
  },

  card: {
    background: "#fff",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
};