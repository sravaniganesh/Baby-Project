import { useEffect, useState } from "react";
import API from "../config/api";


export default function AdminEarningsPage() {
  const [platform, setPlatform] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
     const token = localStorage.getItem("adminToken");

const [platformRes, sellerRes] = await Promise.all([
  API.get(`/admin/earnings/platform`, {
    headers: { Authorization: `Bearer ${token}` },
  }),
  API.get(`/admin/earnings/sellers`, {
    headers: { Authorization: `Bearer ${token}` },
  }),
]);

      setPlatform(platformRes.data);
      setSellers(sellerRes.data || []);
    } catch (err) {
      alert("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p style={styles.loading}>Loading earnings…</p>;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Earnings Overview</h1>
      <p style={styles.subText}>
        Platform revenue & seller earnings summary
      </p>

      {/* ================= PLATFORM CARDS ================= */}
      <div style={styles.cards}>
        <Card title="Platform Commission" value={platform.totalPlatformFee} />
        <Card title="Seller Paid" value={platform.totalSellerPaid} />
        <Card title="Seller Unpaid" value={platform.totalSellerUnpaid} />
        <Card
          title="Gross Handled"
          value={platform.grossHandledAmount}
        />
      </div>

      {/* ================= SELLER TABLE ================= */}
      <div style={styles.tableWrap}>
        <h3 style={styles.tableTitle}>Seller Earnings</h3>

        {sellers.length === 0 ? (
          <div style={styles.empty}>No seller earnings found</div>
        ) : (
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
              {sellers.map((s) => (
                <tr key={s.sellerId}>
                  <td>{s.businessName}</td>
                  <td>{s.sellerCategory}</td>
                  <td>₹ {s.totalEarning}</td>
                  <td style={styles.green}>₹ {s.paidEarning}</td>
                  <td style={styles.orange}>₹ {s.unpaidEarning}</td>
                  <td>₹ {s.totalPlatformFee}</td>
                  <td>{s.itemsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ================= REUSABLE CARD ================= */

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardTitle}>{title}</p>
      <h2 style={styles.cardValue}>₹ {value}</h2>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 32,
    background: "#f4f6f8",
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
  },
  subText: {
    color: "#6b7280",
    marginBottom: 28,
  },
  loading: {
    padding: 40,
    fontSize: 18,
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20,
    marginBottom: 40,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 700,
  },
  tableWrap: {
    background: "#fff",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  },
  tableTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 16,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  green: {
    color: "#16a34a",
    fontWeight: 600,
  },
  orange: {
    color: "#ea580c",
    fontWeight: 600,
  },
  empty: {
    padding: 30,
    textAlign: "center",
    color: "#6b7280",
  },
};
