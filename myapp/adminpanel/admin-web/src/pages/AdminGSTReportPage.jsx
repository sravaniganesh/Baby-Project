import { useState } from "react";
import API from "../config/api";



export default function AdminGSTReportPage() {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH GST SUMMARY ================= */

  const fetchGST = async () => {
    if (!month || !year) {
      alert("Select month and year");
      return;
    }

    try {
      setLoading(true);
     const token = localStorage.getItem("adminToken");

const res = await API.get(
  `/admin/gst/summary?month=${month}&year=${year}`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

      setData(res.data);
    } catch {
      alert("Failed to load GST report");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EXPORT GST CSV ================= */

  const exportGST = async () => {
    if (!month || !year) {
      alert("Select month and year");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");

     const res = await API.get(
  `/admin/gst/export?month=${month}&year=${year}`,
  {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "blob",
  }
);

      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `gst-report-${month}-${year}.csv`;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export GST file");
    }
  };

  return (
    <div>
      <h1 style={styles.heading}>GST Reports</h1>
      <p style={styles.sub}>
        Monthly GST summary for platform earnings
      </p>

      {/* FILTER */}
      <div style={styles.filterRow}>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={styles.select}
        >
          <option value="">Month</option>
          {[
            "Jan","Feb","Mar","Apr","May","Jun",
            "Jul","Aug","Sep","Oct","Nov","Dec",
          ].map((m, i) => (
            <option key={i} value={i + 1}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={styles.select}
        >
          <option value="">Year</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>

        <button
          style={styles.loadBtn}
          onClick={fetchGST}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load GST"}
        </button>

        <button
          style={{
            ...styles.loadBtn,
            background: "#16a34a",
          }}
          onClick={exportGST}
          disabled={loading || !data}
        >
          Export CSV
        </button>
        <button
  style={styles.exportBtn}
 onClick={() => {
  if (!month || !year) {
    alert("Select month and year");
    return;
  }

  window.open(
    `/api/admin/gst/export?month=${month}&year=${year}`,
    "_blank"
  );
}}
>
  Export CSV
</button>

      </div>
      

      {/* SUMMARY */}
      {data && (
        <div style={styles.grid}>
          <Card label="Taxable Amount" value={data.summary.taxableAmount} />
          <Card label="Total GST" value={data.summary.gstTotal} />
          <Card label="CGST" value={data.summary.cgst} />
          <Card label="SGST" value={data.summary.sgst} />
          <Card label="IGST" value={data.summary.igst} />
        </div>
      )}
    </div>
  );
}

/* ================= COMPONENT ================= */

function Card({ label, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={styles.cardValue}>₹ {value || 0}</div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  heading: {
    fontSize: 26,
    fontWeight: 700,
  },
  sub: {
    color: "#6b7280",
    marginBottom: 24,
  },
  filterRow: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  select: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
  },
  loadBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 18,
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 10px 20px rgba(0,0,0,0.06)",
  },
  cardLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 700,
    marginTop: 6,
  },
  exportBtn: {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
},

};
