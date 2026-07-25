import { useEffect, useState } from "react";
import API from "../config/api";


export default function AdminSellerEarningsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerEarnings();
  }, []);

  const fetchSellerEarnings = async () => {
    try {
      const token = localStorage.getItem("adminToken");

const res = await API.get(
  "/admin/earnings/sellers",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

      setRows(res.data || []);
    } catch (err) {
      alert("Failed to load seller earnings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p style={styles.loading}>Loading seller earnings…</p>;
  }

  return (
    <div>
      <h1 style={styles.heading}>Seller Earnings</h1>
      <p style={styles.sub}>
        Financial summary of all sellers (paid & unpaid)
      </p>

      {rows.length === 0 ? (
        <div style={styles.empty}>No seller earnings found</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Category</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Unpaid</th>
                <th>Platform Fee</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.sellerId}>
                  <td>{r.businessName}</td>
                  <td>{r.sellerCategory || "-"}</td>
                  <td style={styles.money}>₹ {r.totalEarning}</td>
                  <td style={styles.paid}>₹ {r.paidEarning}</td>
                  <td style={styles.unpaid}>₹ {r.unpaidEarning}</td>
                  <td>₹ {r.totalPlatformFee}</td>
                  <td>{r.itemsCount}</td>
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
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 12px 25px rgba(0,0,0,0.06)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  money: {
    fontWeight: 600,
  },
  paid: {
    color: "#16a34a",
    fontWeight: 600,
  },
  unpaid: {
    color: "#dc2626",
    fontWeight: 600,
  },
};
