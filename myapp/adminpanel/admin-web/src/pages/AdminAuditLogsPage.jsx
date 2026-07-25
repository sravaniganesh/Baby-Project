import { useEffect, useState } from "react";
import API from "../config/api";



export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const limit = 15;

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applySearch();
  }, [search, logs]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("adminToken");

      const query = new URLSearchParams();

      if (action) query.append("action", action);
      if (from) query.append("from", from);
      if (to) query.append("to", to);

     const res = await API.get(
  `/admin/audit?${query.toString()}`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

      setLogs(res.data || []);
      setFiltered(res.data || []);
    } catch {
      alert("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const applySearch = () => {
    const s = search.toLowerCase();

    const result = logs.filter(
      (l) =>
        l.action?.toLowerCase().includes(s) ||
        l.actorId?.email?.toLowerCase().includes(s) ||
        l.entityType?.toLowerCase().includes(s) ||
        l.description?.toLowerCase().includes(s)
    );

    setFiltered(result);
    setPage(1);
  };

  if (loading) {
    return <p>Loading audit logs…</p>;
  }

  /* ================= PAGINATION ================= */

  const start = (page - 1) * limit;
  const end = start + limit;

  const pageLogs = filtered.slice(start, end);
  const pages = Math.ceil(filtered.length / limit);

  return (
    <div>
      <h1 style={styles.heading}>Audit Logs</h1>
      <p style={styles.sub}>System activity & admin actions</p>

      {/* FILTERS */}
      <div style={styles.filters}>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          style={styles.select}
        >
          <option value="">All Actions</option>
          <option value="REFUND_PROCESSED">Refund</option>
          <option value="SELLER_SETTLEMENT">Seller Settlement</option>
          <option value="DOCTOR_SETTLEMENT">Doctor Settlement</option>
          <option value="BANNER_UPDATED">Banner Update</option>
          <option value="ADMIN_LOGIN">Admin Login</option>
        </select>

        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={styles.input}
        />

        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={styles.input}
        />

        <button style={styles.btn} onClick={fetchLogs}>
          Apply
        </button>

        {/* SEARCH */}
        <input
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>No audit records found</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Entity</th>
                <th>Description</th>
              </tr>
            </thead>

            <tbody>
              {pageLogs.map((l) => (
                <tr key={l._id}>
                  <td>
                    {new Date(l.createdAt).toLocaleString()}
                  </td>

                  <td>
                    <span style={styles.badge}>
                      {l.action}
                    </span>
                  </td>

                  <td>{l.actorId?.email || "System"}</td>

                  <td>{l.entityType}</td>

                  <td>{l.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      {pages > 1 && (
        <div style={styles.pagination}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </button>

          <span>
            Page {page} of {pages}
          </span>

          <button
            disabled={page === pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  heading: {
    fontSize: 26,
    fontWeight: 700,
  },

  sub: {
    color: "#6b7280",
    marginBottom: 20,
  },

  filters: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
  },

  select: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
  },

  input: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
  },

  btn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "8px 18px",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
  },

  tableWrap: {
    background: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 10px 20px rgba(0,0,0,0.06)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  badge: {
    background: "#e0e7ff",
    color: "#1e40af",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },

  empty: {
    padding: 40,
    background: "#fff",
    borderRadius: 12,
    textAlign: "center",
    color: "#6b7280",
  },

  pagination: {
    marginTop: 20,
    display: "flex",
    gap: 15,
    alignItems: "center",
  },
};