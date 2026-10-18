import { useEffect, useState } from "react";
import API from "../config/api";

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SUPPORT_ADMIN");
  const [name, setName] = useState("");

  const currentAdminId = localStorage.getItem("adminId");

  useEffect(() => {
    loadAdmins();
  }, []);

  /* =====================================
     LOAD ADMINS
  ===================================== */
  const loadAdmins = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("adminToken");

      const res = await API.get("/admin/admins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAdmins(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load admins:", err);
      alert(
        err?.response?.data?.message || "Failed to load admins"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================
     CREATE ADMIN
  ===================================== */
  const createAdmin = async () => {
    if (!name.trim()) {
      alert("Admin name is required");
      return;
    }

    if (!email.trim()) {
      alert("Email is required");
      return;
    }

    if (!password) {
      alert("Password is required");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");

      await API.post(
        "/admin/admins",
        {
          email: email.trim(),
          password,
          role,
          name: name.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Admin created successfully");

      setEmail("");
      setPassword("");
      setName("");
      setRole("SUPPORT_ADMIN");

      await loadAdmins();
    } catch (err) {
      console.error("Create admin failed:", err);

      alert(
        err?.response?.data?.message ||
          "Failed to create admin"
      );
    }
  };

  /* =====================================
     CHANGE ROLE
  ===================================== */
  const changeRole = async (id, newRole) => {
    if (!newRole) return;

    if (id === currentAdminId) {
      alert("You cannot change your own role");
      return;
    }

    const confirmed = window.confirm(
      `Change this admin's role to ${newRole}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");

      await API.patch(
        `/admin/admins/${id}/role`,
        {
          role: newRole,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Admin role updated successfully");

      await loadAdmins();
    } catch (err) {
      console.error("Change role failed:", err);

      alert(
        err?.response?.data?.message ||
          "Failed to change admin role"
      );
    }
  };

  /* =====================================
     SUSPEND ADMIN
  ===================================== */
  const suspend = async (id) => {
    if (id === currentAdminId) {
      alert("You cannot suspend yourself");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to suspend this admin?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");

      await API.patch(
        `/admin/admins/${id}/suspend`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Admin suspended successfully");

      await loadAdmins();
    } catch (err) {
      console.error("Suspend failed:", err);

      alert(
        err?.response?.data?.message ||
          "Failed to suspend admin"
      );
    }
  };

  /* =====================================
     ACTIVATE ADMIN
  ===================================== */
  const activate = async (id) => {
    const confirmed = window.confirm(
      "Activate this admin account?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");

      await API.patch(
        `/admin/admins/${id}/activate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Admin activated successfully");

      await loadAdmins();
    } catch (err) {
      console.error("Activate failed:", err);

      alert(
        err?.response?.data?.message ||
          "Failed to activate admin"
      );
    }
  };

  /* =====================================
     LOADING
  ===================================== */
  if (loading) {
    return (
      <div style={styles.page}>
        <h2 style={styles.heading}>Admin Management</h2>

        <div style={styles.loading}>
          Loading administrators...
        </div>
      </div>
    );
  }

  /* =====================================
     PAGE
  ===================================== */
  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>Admin Management</h2>

          <p style={styles.subheading}>
            Manage administrator accounts, roles, and access status.
          </p>
        </div>

        <div style={styles.adminCount}>
          {admins.length} Administrators
        </div>
      </div>

      {/* CREATE ADMIN */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h3 style={styles.cardTitle}>
              Create Administrator
            </h3>

            <p style={styles.cardDescription}>
              Create a new administrator account and assign an
              operational role.
            </p>
          </div>
        </div>

        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Name</label>

            <input
              placeholder="Enter administrator name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>

            <input
              type="email"
              placeholder="Enter administrator email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Temporary Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Role</label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.input}
            >
              <option value="SUPPORT_ADMIN">
                SUPPORT_ADMIN
              </option>

              <option value="OPERATIONS_ADMIN">
                OPERATIONS_ADMIN
              </option>

              <option value="FINANCE_ADMIN">
                FINANCE_ADMIN
              </option>
            </select>
          </div>
        </div>

        <div style={styles.formActions}>
          <button
            onClick={createAdmin}
            style={styles.primaryButton}
          >
            Create Administrator
          </button>
        </div>
      </div>

      {/* ADMIN LIST */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h3 style={styles.cardTitle}>
              Administrator Accounts
            </h3>

            <p style={styles.cardDescription}>
              Review administrator accounts and manage their
              operational access.
            </p>
          </div>
        </div>

        {admins.length === 0 ? (
          <div style={styles.empty}>
            No administrator accounts found.
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Change Role</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {admins.map((admin) => {
                  const isCurrentAdmin =
                    admin._id === currentAdminId;

                  return (
                    <tr key={admin._id}>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <strong>
                            {admin.name || "Unnamed Admin"}
                          </strong>

                          {isCurrentAdmin && (
                            <span style={styles.currentBadge}>
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={styles.td}>
                        {admin.email}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={getRoleStyle(admin.role)}
                        >
                          {admin.role}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {admin.isActive ? (
                          <span style={styles.activeBadge}>
                            Active
                          </span>
                        ) : (
                          <span style={styles.suspendedBadge}>
                            Suspended
                          </span>
                        )}
                      </td>

                      <td style={styles.td}>
                        <select
                          value={admin.role}
                          disabled={isCurrentAdmin}
                          onChange={(e) =>
                            changeRole(
                              admin._id,
                              e.target.value
                            )
                          }
                          style={{
                            ...styles.roleSelect,
                            ...(isCurrentAdmin
                              ? styles.disabledControl
                              : {}),
                          }}
                        >
                          <option value="SUPPORT_ADMIN">
                            SUPPORT_ADMIN
                          </option>

                          <option value="OPERATIONS_ADMIN">
                            OPERATIONS_ADMIN
                          </option>

                          <option value="FINANCE_ADMIN">
                            FINANCE_ADMIN
                          </option>
                        </select>
                      </td>

                      <td style={styles.td}>
                        {isCurrentAdmin ? (
                          <span style={styles.selfText}>
                            Current account
                          </span>
                        ) : admin.isActive ? (
                          <button
                            style={styles.suspendButton}
                            onClick={() =>
                              suspend(admin._id)
                            }
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            style={styles.activateButton}
                            onClick={() =>
                              activate(admin._id)
                            }
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =====================================
   ROLE BADGE
===================================== */

const getRoleStyle = (role) => {
  if (role === "FINANCE_ADMIN") {
    return {
      ...styles.roleBadge,
      background: "#ede9fe",
      color: "#6d28d9",
    };
  }

  if (role === "OPERATIONS_ADMIN") {
    return {
      ...styles.roleBadge,
      background: "#dbeafe",
      color: "#1d4ed8",
    };
  }

  if (role === "SUPPORT_ADMIN") {
    return {
      ...styles.roleBadge,
      background: "#fef3c7",
      color: "#92400e",
    };
  }

  if (role === "SUPER_ADMIN") {
    return {
      ...styles.roleBadge,
      background: "#fee2e2",
      color: "#991b1b",
    };
  }

  return styles.roleBadge;
};

/* =====================================
   STYLES
===================================== */

const styles = {
  page: {
    padding: "4px 0 30px",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  heading: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: "#111827",
  },

  subheading: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: 14,
  },

  adminCount: {
    background: "#f3f4f6",
    color: "#374151",
    padding: "8px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
  },

  cardHeader: {
    padding: "20px 22px",
    borderBottom: "1px solid #e5e7eb",
  },

  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 650,
    color: "#111827",
  },

  cardDescription: {
    margin: "5px 0 0",
    fontSize: 13,
    color: "#6b7280",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 16,
    padding: 22,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },

  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 7,
    padding: "10px 11px",
    fontSize: 14,
    outline: "none",
    background: "#ffffff",
  },

  formActions: {
    padding: "0 22px 22px",
  },

  primaryButton: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 7,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 900,
  },

  th: {
    textAlign: "left",
    padding: "13px 16px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    color: "#4b5563",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },

  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #f3f4f6",
    color: "#374151",
    fontSize: 14,
    verticalAlign: "middle",
  },

  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  currentBadge: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "3px 7px",
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
  },

  roleBadge: {
    display: "inline-block",
    padding: "5px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
  },

  activeBadge: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "5px 9px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
  },

  suspendedBadge: {
    display: "inline-block",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "5px 9px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
  },

  roleSelect: {
    border: "1px solid #d1d5db",
    borderRadius: 6,
    padding: "7px 9px",
    background: "#ffffff",
    fontSize: 12,
    cursor: "pointer",
  },

  disabledControl: {
    background: "#f3f4f6",
    color: "#9ca3af",
    cursor: "not-allowed",
  },

  suspendButton: {
    background: "#dc2626",
    color: "#ffffff",
    border: "none",
    padding: "7px 11px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },

  activateButton: {
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    padding: "7px 11px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },

  selfText: {
    color: "#6b7280",
    fontSize: 12,
  },

  loading: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 40,
    textAlign: "center",
    color: "#6b7280",
  },

  empty: {
    padding: 40,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 14,
  },
};