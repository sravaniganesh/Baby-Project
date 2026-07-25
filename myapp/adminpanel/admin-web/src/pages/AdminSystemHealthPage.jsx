import { useEffect, useState } from "react";
import API from "../config/api";
export default function AdminSystemHealthPage() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    const token = localStorage.getItem("adminToken");

   const res = await API.get(
  "/admin/system/health",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = res.data;
    setHealth(data);
  };

  if (!health) return <div>Loading system health...</div>;

  return (
    <div>
      <h2>System Health</h2>

      <div style={styles.grid}>
        <Card
          title="Server Uptime"
          value={`${Math.floor(health.uptime / 3600)} hrs`}
        />

        <Card
          title="Memory Used"
          value={`${Math.round(
            health.memory.heapUsed / 1024 / 1024
          )} MB`}
        />

        <Card title="Node Version" value={health.nodeVersion} />

        <Card title="Platform" value={health.platform} />

        <Card
          title="Active Connections"
          value={health.activeSockets}
        />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.title}>{title}</div>
      <div style={styles.value}>{value}</div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
    gap: 20,
    marginTop: 20,
  },

  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },

  title: {
    fontSize: 14,
    color: "#64748b",
  },

  value: {
    fontSize: 22,
    fontWeight: "bold",
  },
};