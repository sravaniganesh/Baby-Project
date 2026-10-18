import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({
  children,
  allowedRoles,
}) {
  const token = localStorage.getItem("adminToken");
  const storedRole = localStorage.getItem("adminRole");

  const role =
    storedRole === "ADMIN" ? "SUPER_ADMIN" : storedRole;

  /* =========================
     AUTHENTICATION CHECK
  ========================== */

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  /* =========================
     ROLE CHECK
  ========================== */

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  ) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return children;
}