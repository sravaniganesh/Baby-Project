import { useEffect, useState } from "react";
import API from "../config/api";
export default function AdminCommandCenter() {

const [securityEvents, setSecurityEvents] = useState([]);
const [activity, setActivity] = useState([]);
const [summary, setSummary] = useState(null);

useEffect(() => {
loadData();
}, []);

const loadData = async () => {


const token = localStorage.getItem("adminToken");

try {

  /* SECURITY EVENTS */
  const secRes = await API.get(
  "/admin/security-events",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = secRes.data;
  setSecurityEvents(secData || []);

  /* ADMIN ACTIVITY */
  const actRes = await API.get(
  "/admin/audit",
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

const actData = actRes.data;
  setActivity(actData.logs || actData || []);

  /* DASHBOARD SUMMARY */
 const sumRes = await API.get(
  "/admin/dashboard/summary",
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

const sumData = sumRes.data;
setSummary(sumData);

} catch (err) {

  console.error("Command center load error:", err);

}


};

return ( <div>


  <h2 style={{ marginBottom: 30 }}>
    Admin Command Center
  </h2>

  {/* PLATFORM METRICS */}

  {summary && (
    <div style={styles.metrics}>

      <div style={styles.metricCard}>
        <h4>Total Orders</h4>
        <p>{summary.stats?.totalOrders || 0}</p>
      </div>

      <div style={styles.metricCard}>
        <h4>GMV</h4>
        <p>₹{summary.finance?.gmv || 0}</p>
      </div>

      <div style={styles.metricCard}>
        <h4>Refund Amount</h4>
        <p>₹{summary.finance?.refundAmount || 0}</p>
      </div>

      <div style={styles.metricCard}>
        <h4>Platform Net</h4>
        <p>₹{summary.platformNet || 0}</p>
      </div>

    </div>
  )}

  {/* SECURITY EVENTS */}

  <div style={styles.section}>

    <h3>Security Alerts</h3>

    {securityEvents.length === 0 && (
      <p>No security alerts</p>
    )}

    {securityEvents.slice(0,5).map(e => (
      <div key={e._id} style={styles.alert}>
        <b>{e.severity}</b> — {e.message}
      </div>
    ))}

  </div>

  {/* ADMIN ACTIVITY */}

  <div style={styles.section}>

    <h3>Recent Admin Activity</h3>

    {activity.slice(0,5).map(a => (
      <div key={a._id} style={styles.activityItem}>
        <b>{a.action}</b> — {new Date(a.createdAt).toLocaleString()}
      </div>
    ))}

  </div>

</div>


);
}

const styles = {

metrics:{
display:"grid",
gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",
gap:20,
marginBottom:30
},

metricCard:{
background:"#fff",
padding:18,
borderRadius:10,
boxShadow:"0 3px 8px rgba(0,0,0,0.08)"
},

section:{
marginBottom:30
},

alert:{
padding:10,
background:"#fee2e2",
borderRadius:6,
marginBottom:6
},

activityItem:{
padding:10,
background:"#f8fafc",
borderRadius:6,
marginBottom:6
}

};
