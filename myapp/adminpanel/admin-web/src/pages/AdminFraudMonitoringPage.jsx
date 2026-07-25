import { useEffect, useState } from "react";
import API from "../config/api";

export default function AdminFraudMonitoringPage() {
  const [refundAbuse, setRefundAbuse] = useState([]);
  const [fakeUsers, setFakeUsers] = useState([]);
  const [sellerFraud, setSellerFraud] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    loadFraudData();
  }, []);

 const loadFraudData = async () => {
  const token = localStorage.getItem("adminToken");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const r1 = await API.get("/admin/fraud/refund-abuse", { headers });
  const r2 = await API.get("/admin/fraud/fake-users", { headers });
  const r3 = await API.get("/admin/fraud/seller-cancellations", { headers });
  const r4 = await API.get("/admin/fraud/summary", { headers });

  setRefundAbuse(r1.data);
  setFakeUsers(r2.data);
  setSellerFraud(r3.data);
  setSummary(r4.data);
};

  return (
    <div>
      <h2>Fraud Monitoring</h2>

      <div style={styles.cards}>
        <Card title="Total Users" value={summary.totalUsers} />
        <Card title="Total Sellers" value={summary.totalSellers} />
        <Card title="Total Orders" value={summary.totalOrders} />
        <Card title="Refunded Orders" value={summary.refundedOrders} />
      </div>

      <Section title="Refund Abuse Users">
        {refundAbuse.map((u) => (
          <div key={u.userId}>
            User: {u.userId} — Refunds: {u.refunds}
          </div>
        ))}
      </Section>

      <Section title="Fake Accounts (same phone)">
        {fakeUsers.map((u, i) => (
          <div key={i}>
            Phone: {u.phone} — Accounts: {u.accounts.length}
          </div>
        ))}
      </Section>

      <Section title="Suspicious Sellers (High Cancellation)">
        {sellerFraud.map((s) => (
          <div key={s.sellerId}>
            Seller: {s.sellerId} — Cancellation Rate:{" "}
            {s.cancellationRate.toFixed(2)}%
          </div>
        ))}
      </Section>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardValue}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 30 }}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

const styles = {
  cards: {
    display: "flex",
    gap: 20,
    marginBottom: 30,
  },

  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    minWidth: 160,
  },

  cardTitle: {
    fontSize: 14,
    color: "#64748b",
  },

  cardValue: {
    fontSize: 26,
    fontWeight: "bold",
  },
};