import { useEffect, useState } from "react";
import API from "../config/api";


export default function SettlementHistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
const token = localStorage.getItem("adminToken");

const res = await API.get(
  "/admin/settlements/history",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

setRecords(res.data || []);
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
    <div style={styles.page}>
      <h1 style={styles.heading}>Settlement History</h1>
      <p style={styles.subText}>
        Completed seller settlements (paid records)
      </p>

      {records.length === 0 ? (
        <div style={styles.empty}>No settlement history found</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Total Paid</th>
                <th>Platform Fee</th>
                <th>Payment Mode</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>{r.seller?.email}</td>
                  <td style={styles.money}>₹ {r.settlementAmount}</td>
                  <td>₹ {r.totalPlatformFee}</td>
                  <td>{r.paymentMode}</td>
                  <td>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
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
  page: {
    padding: 32,
    fontFamily: "system-ui, sans-serif",
    background: "#f9fafb",
    minHeight: "100vh",
  },
  heading: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 4,
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
  money: {
    fontWeight: 600,
  },
};
