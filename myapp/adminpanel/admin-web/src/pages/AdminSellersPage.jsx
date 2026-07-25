import { useEffect, useState } from "react";
import API from "../config/api";

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState([]);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, [page, search]);

 const load = async () => {
  const token = localStorage.getItem("adminToken");

  const res = await API.get(
    `/admin/sellers?page=${page}&limit=20&search=${search}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = res.data;

    setSellers(data.sellers || []);
    setPages(data.pages || 1);
  };

  const action = async (id, type) => {
    const token = localStorage.getItem("adminToken");
await API.patch(
  `/admin/sellers/${id}/${type}`,
  {},
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

    load();
  };

  return (
    <div>
      <h2>Sellers</h2>

      {/* SEARCH */}
      <input
        placeholder="Search sellers..."
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        style={styles.search}
      />

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Business</th>
            <th>Email</th>
            <th>City</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {sellers.map((s) => (
            <tr key={s._id}>
              <td>{s.businessName}</td>
              <td>{s.email}</td>
              <td>{s.city}</td>
              <td>{s.isActive ? "Active" : "Suspended"}</td>

              <td>
                {s.isActive ? (
                  <button
                    onClick={() =>
                      action(s._id, "suspend")
                    }
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      action(s._id, "activate")
                    }
                  >
                    Activate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
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
    </div>
  );
}

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 10,
  },

  search: {
    marginBottom: 15,
    padding: 8,
    width: 260,
    borderRadius: 6,
    border: "1px solid #ddd",
  },

  pagination: {
    marginTop: 20,
    display: "flex",
    gap: 15,
    alignItems: "center",
  },
};