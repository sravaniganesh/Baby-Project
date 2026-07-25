import { useState } from "react";
import API from "../config/api";
import { useNavigate } from "react-router-dom";


export default function AdminLoginPage() {
const navigate = useNavigate();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const handleLogin = async (e) => {
e.preventDefault();
setError("");


if (!email || !password) {
  setError("Email and password are required");
  return;
}

try {
 setLoading(true);

const res = await API.post(
  "/admin/login",
  { email, password }
);

  /* =========================
     SAVE ADMIN AUTH DATA
  ========================== */

  // Existing working token save
  localStorage.setItem("adminToken", res.data.token);

  // 🆕 Required for RBAC system
  if (res?.data?.admin) {
    const role =
  res.data.admin.role === "ADMIN"
    ? "SUPER_ADMIN"
    : res.data.admin.role;

localStorage.setItem("adminRole", role);
    localStorage.setItem("adminId", res.data.admin.id);
  }

  // Optional debug log (safe)
  console.log("Admin Login Success:", res.data.admin);

  /* =========================
     REDIRECT TO DASHBOARD
  ========================== */

  navigate("/");
} catch (err) {
  setError(
    err?.response?.data?.message || "Admin login failed"
  );
} finally {
  setLoading(false);
}


};

return ( <div style={styles.page}> <form style={styles.card} onSubmit={handleLogin}> <h1 style={styles.title}>Admin Login</h1> <p style={styles.subtitle}>
Secure access to admin panel </p>


    {error && <div style={styles.error}>{error}</div>}

    <div style={styles.field}>
      <label>Email</label>
      <input
        type="email"
        placeholder="admin@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />
    </div>

    <div style={styles.field}>
      <label>Password</label>
      <input
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />
    </div>

    <button
      type="submit"
      style={styles.button}
      disabled={loading}
    >
      {loading ? "Logging in..." : "Login"}
    </button>

    <p style={styles.footer}>
      Authorized personnel only
    </p>
  </form>
</div>


);
}

/* ================= STYLES ================= */

const styles = {
page: {
minHeight: "100vh",
background: "linear-gradient(135deg, #0f172a, #020617)",
display: "flex",
alignItems: "center",
justifyContent: "center",
fontFamily: "system-ui, sans-serif",
},
card: {
width: 380,
background: "#fff",
borderRadius: 16,
padding: 32,
boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
},
title: {
fontSize: 26,
fontWeight: 700,
marginBottom: 4,
textAlign: "center",
},
subtitle: {
fontSize: 14,
color: "#6b7280",
textAlign: "center",
marginBottom: 24,
},
field: {
marginBottom: 16,
display: "flex",
flexDirection: "column",
gap: 6,
},
input: {
padding: 12,
borderRadius: 10,
border: "1px solid #e5e7eb",
fontSize: 14,
outline: "none",
},
button: {
marginTop: 10,
background: "#0A7AFF",
color: "#fff",
padding: 14,
borderRadius: 12,
border: "none",
fontSize: 16,
fontWeight: 600,
cursor: "pointer",
},
error: {
background: "#fee2e2",
color: "#991b1b",
padding: 10,
borderRadius: 8,
fontSize: 14,
marginBottom: 16,
textAlign: "center",
},
footer: {
marginTop: 18,
fontSize: 12,
color: "#9ca3af",
textAlign: "center",
},
};
