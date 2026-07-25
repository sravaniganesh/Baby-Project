import { useEffect, useState } from "react";
import API from "../config/api";
export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState({});
  const [userGrowth, setUserGrowth] = useState({});
  const [orderGrowth, setOrderGrowth] = useState({});
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const token = localStorage.getItem("adminToken");

    const headers = {
      Authorization: `Bearer ${token}`,
    };

   const summaryRes = await API.get(
  "/admin/analytics/summary",
  { headers }
);

const userRes = await API.get(
  "/admin/analytics/users",
  { headers }
);

const orderRes = await API.get(
  "/admin/analytics/orders",
  { headers }
);

const topRes = await API.get(
  "/admin/analytics/top-products",
  { headers }
);

    setSummary(await summaryRes.json());
    setUserGrowth(await userRes.json());
    setOrderGrowth(await orderRes.json());

    const top = await topRes.json();
    setTopProducts(top.products || []);
  };

  return (
    <div>
      <h2>Analytics Dashboard</h2>

      {/* SUMMARY */}
      <div style={styles.cards}>
        <Card title="Total Users" value={summary.totalUsers} />
        <Card title="Total Orders" value={summary.totalOrders} />
        <Card title="Total Products" value={summary.totalProducts} />
      </div>

      {/* USER GROWTH */}
      <Section title="User Growth">
        {Object.entries(userGrowth).map(([date, count]) => (
          <div key={date}>
            {date} : {count}
          </div>
        ))}
      </Section>

      {/* ORDER GROWTH */}
      <Section title="Order Growth">
        {Object.entries(orderGrowth).map(([date, count]) => (
          <div key={date}>
            {date} : {count}
          </div>
        ))}
      </Section>

      {/* TOP PRODUCTS */}
      <Section title="Top Products">
        {topProducts.map((p) => (
          <div key={p._id}>
            {p.title} — ₹{p.price}
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