import { useEffect, useState } from "react";
import API from "../config/api";

export default function AdminActivityPage() {
const [logs, setLogs] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
loadLogs();
}, []);

const loadLogs = async () => {
try {
const token = localStorage.getItem("adminToken");


  const res = await API.get("/admin/audit", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = res.data;

  /* SAFETY FIX: ensure logs is always an array */
  if (Array.isArray(data)) {
    setLogs(data);
  } else if (Array.isArray(data.logs)) {
    setLogs(data.logs);
  } else {
    setLogs([]);
  }

} catch (err) {
  console.error("Failed to load audit logs", err);
  setError("Failed to load admin activity");
} finally {
  setLoading(false);
}


};

if (loading) return <div>Loading admin activity...</div>;
if (error) return <div>{error}</div>;

return ( <div>
<h2 style={{ marginBottom: 20 }}>Admin Activity Timeline</h2>


  <div style={styles.timeline}>
    {logs.map((log) => (
      <div key={log._id} style={styles.row}>
        <div style={styles.dot} />

        <div style={styles.item}>
          <div style={styles.time}>
            {new Date(log.createdAt).toLocaleString()}
          </div>

          <div style={styles.content}>
            <b>{log.action}</b>

            <div style={styles.meta}>
              Entity: {log.entityType || "-"}
            </div>

            {log.metadata && (
              <pre style={styles.meta}>
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>


);
}

const styles = {
timeline: {
display: "flex",
flexDirection: "column",
gap: 20,
borderLeft: "3px solid #e5e7eb",
paddingLeft: 20,
},

row: {
position: "relative",
},

dot: {
position: "absolute",
left: -28,
top: 10,
width: 12,
height: 12,
borderRadius: "50%",
background: "#2563eb",
},

item: {
padding: 14,
background: "#fff",
borderRadius: 10,
boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
},

time: {
fontSize: 12,
color: "#6b7280",
marginBottom: 6,
},

content: {
fontSize: 14,
},

meta: {
marginTop: 6,
fontSize: 12,
color: "#64748b",
},
};
