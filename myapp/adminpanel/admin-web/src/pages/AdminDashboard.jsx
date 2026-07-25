import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import AdminChart from "../components/AdminChart";
import API from "../config/api";

/* ADMIN SOCKET */
import { connectAdminSocket, getAdminSocket } from "../services/adminSocket";

export default function AdminDashboard() {
const [data, setData] = useState(null);
const [charts, setCharts] = useState({});
const role = localStorage.getItem("adminRole");

useEffect(() => {
loadDashboard();


const adminId = localStorage.getItem("adminId");

if (adminId) {
  connectAdminSocket(adminId);
}


}, []);

/* ADMIN REALTIME ALERTS */
useEffect(() => {
const socket = getAdminSocket();


if (!socket) return;

socket.on("admin_notification", (data) => {
  console.log("ADMIN ALERT:", data);
  alert(`🔔 ${data.message}`);
});

return () => {
  socket.off("admin_notification");
};


}, []);

const loadDashboard = async () => {
try {
const token = localStorage.getItem("adminToken");


 const res = await API.get(
  "/admin/dashboard/summary",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const json = res.data;
setData(json);

const chartRes = await API.get(
  "/admin/dashboard/charts",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const chartJson = chartRes.data;
setCharts(chartJson);
} catch (err) {
  console.error("Dashboard load error:", err);
}


};

if (!data) return <div>Loading dashboard...</div>;

const stats = data.stats || {};
const shop = data.shop || {};
const premium = data.premium || {};
const finance = data.finance || {};

return ( <div>

  {role === "SUPER_ADMIN" && (
  <div style={styles.superBadge}>
    SUPER ADMIN MODE
  </div>
)}
<h2 style={{ marginBottom: 20 }}>Admin Dashboard</h2>


  <div style={styles.grid}>
    <StatCard
      title="Total Orders"
      value={stats.totalOrders || 0}
      color="#2563eb"
    />

    <StatCard
      title="Paid Orders"
      value={stats.paidOrders || 0}
      color="#16a34a"
    />

    <StatCard
      title="Doctor Settlements"
      value={stats.totalDoctorSettlements || 0}
      color="#9333ea"
    />

    <StatCard
      title="Paid Doctor Settlements"
      value={stats.paidDoctorSettlements || 0}
      color="#ea580c"
    />

    <StatCard
      title="Shop Commission"
      value={`₹${shop.commissionEarned || 0}`}
      color="#0ea5e9"
    />

    <StatCard
      title="Premium Revenue"
      value={`₹${premium.revenue || 0}`}
      color="#f59e0b"
    />

    <StatCard
      title="Platform Net Income"
      value={`₹${data.platformNet || 0}`}
      color="#ef4444"
    />

    <StatCard
      title="GMV (Total Sales)"
      value={`₹${finance.gmv || 0}`}
      color="#14b8a6"
    />

    <StatCard
      title="Refund Amount"
      value={`₹${finance.refundAmount || 0}`}
      color="#dc2626"
    />

    <StatCard
      title="Seller Payout"
      value={`₹${finance.sellerPayout || 0}`}
      color="#6366f1"
    />
  </div>

  <div style={styles.chartSection}>
    <AdminChart
      title="Shop Commission Trend"
      data={charts.shopCommissionTrend || []}
    />

    <AdminChart
      title="Refund Trend"
      data={charts.refundTrend || []}
    />

    <AdminChart
      title="Premium Revenue Trend"
      data={charts.premiumTrend || []}
    />

    <AdminChart
      title="Doctor Payout Trend"
      data={charts.doctorPayoutTrend || []}
    />
  </div>
</div>


);
}

const styles = {
grid: {
display: "grid",
gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
gap: 20,
marginBottom: 30,
},

chartSection: {
display: "grid",
gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
gap: 30,
},
superBadge: {
  background: "#ef4444",
  color: "#fff",
  padding: "6px 12px",
  borderRadius: 6,
  display: "inline-block",
  marginBottom: 10,
  fontSize: 12,
  fontWeight: 600
},
};
