import { useEffect, useState } from "react";
import API from "../config/api";



export default function AdminRefundHistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRefundHistory();
  }, []);

  const fetchRefundHistory = async () => {
    try {
      const token = localStorage.getItem("adminToken");

const res = await API.get(
  "/admin/refund/history",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

      setItems(res.data || []);
    } catch {
      alert("Failed to load refund history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p style={styles.loading}>Loading refund history…</p>;
  }

  return (
    <div>
      <h1 style={styles.heading}>Refund History</h1>
      <p style={styles.sub}>
        Completed refunds (read-only)
      </p>

      {items.length === 0 ? (
        <div style={styles.empty}>No refunds processed yet</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Refunded Amount</th>
                <th>Reason</th>
                <th>Refunded At</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.orderItemId}>
                  <td>{i.title}</td>
                  <td>{i.quantity}</td>
                  <td style={styles.money}>
                    ₹ {i.refundAmount}
                  </td>
                  <td>{i.returnReason || "—"}</td>
                  <td>
                    {new Date(
                      i.refundProcessedAt
                    ).toLocaleDateString()}
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
  heading: {
    fontSize: 26,
    fontWeight: 700,
  },
  sub: {
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
