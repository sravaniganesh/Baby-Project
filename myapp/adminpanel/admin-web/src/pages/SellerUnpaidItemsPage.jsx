import { useEffect, useState } from "react";
import API from "../config/api";


export default function SellerUnpaidItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnpaidItems();
  }, []);

  const fetchUnpaidItems = async () => {
    try {
     const token = localStorage.getItem("adminToken");

const res = await API.get(
  "/admin/earnings/unpaid-items",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

setItems(res.data || []);
    } catch (err) {
      alert("Failed to load unpaid items");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p style={styles.loading}>Loading unpaid items…</p>;
  }

  return (
    <div>
      <h1 style={styles.heading}>Seller Unpaid Items</h1>
      <p style={styles.sub}>
        Delivered items where seller payout is still pending
      </p>

      {items.length === 0 ? (
        <div style={styles.empty}>No unpaid items found</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Seller</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Seller Earning</th>
                <th>Platform Fee</th>
                <th>Delivered At</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.orderItemId}>
                  <td>{i.orderId}</td>
                  <td>{i.sellerId}</td>
                  <td>{i.title}</td>
                  <td>{i.quantity}</td>
                  <td style={styles.money}>₹ {i.sellerEarning}</td>
                  <td style={styles.fee}>₹ {i.platformFee}</td>
                  <td>
                    {i.deliveredAt
                      ? new Date(i.deliveredAt).toLocaleDateString()
                      : "-"}
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
    overflowX: "auto",
    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  money: {
    fontWeight: 600,
    color: "#16a34a",
  },
  fee: {
    fontWeight: 600,
    color: "#dc2626",
  },
};
