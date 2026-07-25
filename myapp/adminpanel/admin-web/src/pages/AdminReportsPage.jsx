import { useState } from "react";
import API from "../config/api";

export default function AdminReportsPage() {
const [loading, setLoading] = useState("");

const downloadReport = async (type) => {
try {
const token = localStorage.getItem("adminToken");


  setLoading(type);

const res = await API.get(
  `/admin/reports/${type}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;

  a.download = `${type}_report.csv`;

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
} catch (err) {
  console.error("Report download failed", err);
  alert("Failed to download report");
} finally {
  setLoading("");
}


};

return ( <div>
<h2 style={{ marginBottom: 20 }}>Admin Reports</h2>


  <div style={styles.container}>
    <button
      style={styles.button}
      onClick={() => downloadReport("orders")}
    >
      {loading === "orders"
        ? "Generating..."
        : "Export Orders CSV"}
    </button>

    <button
      style={styles.button}
      onClick={() => downloadReport("refunds")}
    >
      {loading === "refunds"
        ? "Generating..."
        : "Export Refund Report"}
    </button>

    <button
      style={styles.button}
      onClick={() => downloadReport("settlements")}
    >
      {loading === "settlements"
        ? "Generating..."
        : "Export Settlement Report"}
    </button>
  </div>
</div>


);
}

const styles = {
container: {
display: "flex",
flexDirection: "column",
gap: 16,
maxWidth: 300,
},

button: {
padding: "14px 18px",
background: "#2563eb",
color: "#fff",
border: "none",
borderRadius: 10,
fontWeight: 600,
cursor: "pointer",
},
};
