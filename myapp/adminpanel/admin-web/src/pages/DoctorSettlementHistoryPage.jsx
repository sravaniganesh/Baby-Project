import { useEffect, useState } from "react";
import API from "../config/api";


export default function DoctorSettlementHistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem("adminToken");

    const res = await API.get(
  "/admin/doctor-settlements/history",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);
      setRows(res.data || []);
    } catch {
      alert("Failed to load settlement history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p style={styles.loading}>Loading history…</p>;
  }

  return (
    <div>
      <h1 style={styles.heading}>Doctor Settlement History</h1>
      <p style={styles.subText}>
        Completed doctor payouts (read-only)
      </p>

      {rows.length === 0 ? (
        <div style={styles.empty}>
          No doctor settlements yet
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>City</th>
                <th>Amount Paid</th>
                <th>Payment Mode</th>
                <th>Paid Date</th>
                <th>Reference</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.doctorName}</td>
                  <td>{r.city}</td>
                  <td style={styles.amount}>₹ {r.amount}</td>
                  <td>{r.paymentMode}</td>
                  <td>
                    {new Date(r.paidAt).toLocaleDateString()}
                  </td>
                  <td>{r.reference || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  heading: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 6,
  },
  subText: {
    color: "#6b7280",
    marginBottom: 24,
  },
  loading: {
    padding: 40,
    fontSize: 18,
  },
  empty: {
    padding: 40,
    background: "#fff",
    borderRadius: 12,
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 500,
  },
  tableWrap: {
    background: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  amount: {
    fontWeight: 700,
    color: "#16a34a",
  },
};
