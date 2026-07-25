import { useState } from "react";
import API from "../config/api";


export default function AdminGSTCompliancePage() {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadCompliance = async () => {
    if (!month || !year) {
      alert("Please select month and year");
      return;
    }

    try {
      setLoading(true);
  const token = localStorage.getItem("adminToken");

const res = await API.get(
  `/admin/gst/compliance?month=${month}&year=${year}`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

      setData(res.data);
    } catch (err) {
      alert("Failed to load GST compliance data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={styles.heading}>GST Compliance</h1>
      <p style={styles.sub}>
        Monthly GST collection & filing overview
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

        <button style={styles.loadBtn} onClick={loadCompliance}>
          {loading ? "Loading…" : "Load Report"}
        </button>
      </div>

      {/* SUMMARY */}
      {data && (
        <>
          <div style={styles.statusRow}>
            <span
              style={{
                ...styles.badge,
                ...(data.filingStatus === "FILED"
                  ? styles.badgeFiled
                  : styles.badgePending),
              }}
            >
              {data.filingStatus}
            </span>
            <span style={styles.period}>
              Period: {data.period}
            </span>
          </div>

          <div style={styles.grid}>
            <Card label="Taxable Amount" value={data.taxableAmount} />
            <Card label="Total GST" value={data.gstCollected} />
            <Card label="CGST" value={data.cgst} />
            <Card label="SGST" value={data.sgst} />
            <Card label="IGST" value={data.igst} />
            <Card label="Pending GST" value={data.pendingGST} />
          </div>
        </>
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
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  badge: {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  badgeFiled: {
    background: "#dcfce7",
    color: "#166534",
  },
  badgePending: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  period: {
    fontSize: 14,
    color: "#475569",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 18,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
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
};
