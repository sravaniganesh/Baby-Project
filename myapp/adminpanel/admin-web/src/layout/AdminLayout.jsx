
import { Link, useLocation } from "react-router-dom";
import AdminGlobalSearch from "../components/AdminGlobalSearch";
import AdminNotificationBell from "../components/AdminNotificationBell";

export default function AdminLayout({ children }) {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminId");
    window.location.href = "/login";
  };

  /* ================= ROLE DETECTION ================= */

  const storedRole = localStorage.getItem("adminRole");
  const role = storedRole === "ADMIN" ? "SUPER_ADMIN" : storedRole;

  /* ================= ROLE PERMISSIONS ================= */

  const rolePermissions = {
    SUPER_ADMIN: "ALL",

    FINANCE_ADMIN: [
      "/seller-settlements",
      "/settlement-history",
      "/earnings",
      "/seller-unpaid-items",
      "/doctor-earnings",
      "/doctor-unpaid-earnings",
      "/doctor-settlements",
      "/doctor-settlement-history",
      "/gst-reports",
      "/gst-compliance",
      "/refund-requests",
      "/refund-history",
      "/analytics",
      "/reports"
    ],

    OPERATIONS_ADMIN: [
      "/orders",
      "/product-approvals",
      "/sellers",
      "/banners",
      "/users",
      "/doctors",
      "/notification-control"
    ],

    SUPPORT_ADMIN: [
      "/users",
      "/doctors",
      "/hospitals",
      "/doctor-hospital-approvals",
      "/orders",
      "/refund-requests",
      "/notification-control"
    ]
  };

  const hasAccess = (path) => {
    if (!role) return false;

    if (rolePermissions[role] === "ALL") return true;

    return rolePermissions[role]?.includes(path);
  };

  /* ================= NAVIGATION ================= */

  const nav = [
    { label: "Dashboard", path: "/" },
    { label: "Global Search", path: "/search" },
    { label: "Admin Activity", path: "/admin-activity" },
    { label: "Analytics", path: "/analytics" },
    { label: "Fraud Monitoring", path: "/fraud-monitoring" },
    { label: "System Health", path: "/system-health" },
    { label: "Notifications", path: "/notification-control" },

    {
      label: "Super Admin",
      path: "/super-admin",
      roles: ["SUPER_ADMIN"]
    },
    {
      label: "Admin Sessions",
      path: "/admin-sessions",
      roles: ["SUPER_ADMIN"]
    },
    {
      label: "Admin Permissions",
      path: "/admin-permissions",
      roles: ["SUPER_ADMIN"]
    },
    {
      label: "Admin Security",
      path: "/admin-security",
      roles: ["SUPER_ADMIN"]
    },
    {
      label: "Command Center",
      path: "/command-center",
      roles: ["SUPER_ADMIN"]
    },

    /* FINANCE */
    { label: "Seller Settlements", path: "/seller-settlements" },
    { label: "Settlement History", path: "/settlement-history" },
    { label: "Seller Payables", path: "/earnings" },
    { label: "Seller Unpaid Items", path: "/seller-unpaid-items" },

    /* BANNERS */
    { label: "Banners", path: "/banners" },

    /* DOCTOR FINANCE */
    { label: "Doctor Earnings", path: "/doctor-earnings" },
    { label: "Doctor Unpaid Earnings", path: "/doctor-unpaid-earnings" },
    { label: "Doctor Settlements", path: "/doctor-settlements" },
    { label: "Doctor Settlement History", path: "/doctor-settlement-history" },

    /* GST */
    { label: "GST Reports", path: "/gst-reports" },
    { label: "GST Compliance", path: "/gst-compliance" },

    /* ADMIN CONTROL */
    { label: "Audit Logs", path: "/audit-logs" },
    { label: "Refund Requests", path: "/refund-requests" },
    { label: "Refund History", path: "/refund-history" },
    { label: "Product Approvals", path: "/product-approvals" },
    { label: "Admin Management", path: "/admins" },
    { label: "Reports", path: "/reports" },

    /* PLATFORM CONTROL */
    { label: "Users", path: "/users" },
    { label: "Sellers", path: "/sellers" },
    { label: "Doctors", path: "/doctors" },
    { label: "Hospitals", path: "/hospitals" },
    { label: "Doctor–Hospital Approvals", path: "/doctor-hospital-approvals" },
    { label: "Orders", path: "/orders" },

    /* PLATFORM INSIGHTS */
    { label: "Analytics", path: "/analytics" },
    { label: "Fraud Monitoring", path: "/fraud-monitoring" },
    { label: "System Health", path: "/system-health" }
  ];

  return (
    <div style={styles.wrapper}>

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>

        {/* FIXED SIDEBAR BRAND */}
        <div style={styles.brand}>
          <div style={styles.logoCircle}>A</div>

          <div>
            <div style={styles.brandTitle}>Admin Panel</div>
            <div style={styles.brandSub}>Management</div>
          </div>
        </div>

        {/* INDEPENDENT SIDEBAR SCROLL */}
        <nav style={styles.nav}>
          {nav
            .filter((n) => n?.path && hasAccess(n.path))
            .map((n) => {
              const active = location.pathname === n.path;

              return (
                <Link
                  key={n.path}
                  to={n.path}
                  style={{
                    ...styles.link,
                    ...(active ? styles.activeLink : {})
                  }}
                >
                  <span style={styles.dot} />
                  {n.label}
                </Link>
              );
            })}
        </nav>

        {/* FIXED LOGOUT AREA */}
        <div style={styles.logoutArea}>
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT - INDEPENDENT SCROLL */}
      <main style={styles.main}>

        <AdminGlobalSearch />

        <div style={styles.notificationArea}>
          <AdminNotificationBell />
        </div>

        <div style={styles.contentCard}>
          {children}
        </div>

      </main>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  wrapper: {
    display: "flex",
    width: "100%",
    height: "100vh",
    height: "100dvh",
    overflow: "hidden",
    background: "#f1f5f9",
    fontFamily: "Inter, system-ui, sans-serif",
    boxSizing: "border-box"
  },

  /* SIDEBAR */
  sidebar: {
    width: 260,
    minWidth: 260,
    flexShrink: 0,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "linear-gradient(180deg, #0f172a, #020617)",
    color: "#fff",
    boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
    boxSizing: "border-box"
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "24px 18px",
    flexShrink: 0
  },

  logoCircle: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: "50%",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 20
  },

  brandTitle: {
    fontSize: 16,
    fontWeight: 700
  },

  brandSub: {
    fontSize: 12,
    color: "#94a3b8"
  },

  /* SIDEBAR ONLY SCROLLS HERE */
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "0 18px 16px",
    scrollbarWidth: "thin",
    scrollbarColor: "#475569 #0f172a"
  },

  link: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    flexShrink: 0,
    borderRadius: 10,
    color: "#cbd5f5",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.2s ease"
  },

  activeLink: {
    background: "linear-gradient(90deg, #2563eb, #1d4ed8)",
    color: "#fff",
    boxShadow: "0 6px 14px rgba(37,99,235,0.35)"
  },

  dot: {
    width: 6,
    height: 6,
    flexShrink: 0,
    borderRadius: "50%",
    background: "currentColor",
    opacity: 0.8
  },

  logoutArea: {
    flexShrink: 0,
    padding: "12px 18px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)"
  },

  logoutButton: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600
  },

  /* MAIN CONTENT ONLY SCROLLS HERE */
  main: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    padding: 28,
    boxSizing: "border-box",
    overscrollBehavior: "contain"
  },

  notificationArea: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 10
  },

  contentCard: {
    background: "#ffffff",
    borderRadius: 18,
    padding: 28,
    minHeight: "calc(100% - 20px)",
    boxSizing: "border-box",
    boxShadow:
      "0 10px 25px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.4)"
  }
};
