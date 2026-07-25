import { Link } from "react-router-dom";

export default function SuperAdminPanel() {

  const role = localStorage.getItem("adminRole");

  if (role !== "SUPER_ADMIN") {
    return <div>Access restricted</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: 30 }}>
        Super Admin Control Center
      </h2>

      <div style={styles.grid}>

        <Link to="/admins" style={styles.card}>
          <h3>Admin Management</h3>
          <p>Create, suspend and manage platform admins</p>
        </Link>

        <Link to="/admin-activity" style={styles.card}>
          <h3>Admin Activity</h3>
          <p>View all admin actions and audit logs</p>
        </Link>

        <Link to="/analytics" style={styles.card}>
          <h3>Platform Analytics</h3>
          <p>Revenue, GMV and growth monitoring</p>
        </Link>

        <Link to="/system-health" style={styles.card}>
          <h3>System Health</h3>
          <p>Server status and platform monitoring</p>
        </Link>

      </div>
    </div>
  );
}

const styles = {

  grid:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",
    gap:20
  },

  card:{
    padding:20,
    background:"#fff",
    borderRadius:12,
    textDecoration:"none",
    color:"#111",
    boxShadow:"0 6px 14px rgba(0,0,0,0.08)",
    transition:"all .2s"
  }

};