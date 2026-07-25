import { useEffect, useState } from "react";
import API from "../config/api";

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SUPPORT_ADMIN");
  const [name, setName] = useState("");

  const currentAdminId = localStorage.getItem("adminId");

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const token = localStorage.getItem("adminToken");

     const res = await API.get("/admin/audit", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = res.data;
      setAdmins(data);
    } catch (err) {
      console.error("Failed to load admins", err);
      alert("Failed to load admins");
    }
  };

  const createAdmin = async () => {
    if (!email || !password) {
      alert("Email and password required");
      return;
    }

    try {
   const token = localStorage.getItem("adminToken");

await API.post("/admin/admins", {
  email,
  password,
  role,
  name,
}, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

      setEmail("");
      setPassword("");
      setName("");
      setRole("SUPPORT_ADMIN");

      loadAdmins();
    } catch (err) {
      console.error("Create admin failed", err);
      alert("Failed to create admin");
    }
  };

  const changeRole = async (id, role) => {
    try {
     const token = localStorage.getItem("adminToken");

await API.patch(
  `/admin/admins/${id}/role`,
  { role },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
      

      loadAdmins();
    } catch (err) {
      console.error("Change role failed", err);
      alert("Failed to change role");
    }
  };

  const suspend = async (id) => {
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

      loadAdmins();
    } catch (err) {
      console.error("Suspend failed", err);
      alert("Failed to suspend admin");
    }
  };

  const activate = async (id) => {
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
      loadAdmins();
    } catch (err) {
      console.error("Activate failed", err);
      alert("Failed to activate admin");
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Admin Management</h2>

      {/* CREATE ADMIN */}
      <div style={styles.form}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="SUPPORT_ADMIN">SUPPORT_ADMIN</option>
          <option value="OPERATIONS_ADMIN">
            OPERATIONS_ADMIN
          </option>
          <option value="FINANCE_ADMIN">FINANCE_ADMIN</option>
        </select>

        <button onClick={createAdmin}>Create</button>
      </div>

      {/* ADMIN LIST */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Change Role</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {admins.map((a) => (
            <tr key={a._id}>
              <td>{a.name}</td>
              <td>{a.email}</td>
              <td>{a.role}</td>
              <td>
                {a.isActive ? "Active" : "Suspended"}
              </td>

              <td>
                <select
                  value={a.role}
                  onChange={(e) =>
                    changeRole(a._id, e.target.value)
                  }
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

              <td>
                {a._id !== currentAdminId && (
                  <>
                    {a.isActive ? (
                      <button
                        style={styles.suspend}
                        onClick={() => suspend(a._id)}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        style={styles.activate}
                        onClick={() => activate(a._id)}
                      >
                        Activate
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  form: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  suspend: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
  },

  activate: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
  },
};