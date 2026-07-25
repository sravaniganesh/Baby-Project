import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import API from "../config/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    const token = localStorage.getItem("adminToken");

    const res = await API.get(
  `/admin/users?page=${page}&limit=20&search=${search}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = res.data;

setUsers(data.users || []);
setPages(data.pages || 1);
};

const toggleUser = async (id, action) => {
  const token = localStorage.getItem("adminToken");

  await API.patch(
    `/admin/users/${id}/${action}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

    loadUsers();
  };

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone" },

    {
      header: "Status",
      render: (row) =>
        row.isActive ? "Active" : "Suspended",
    },

    {
      header: "Actions",
      render: (row) =>
        row.isActive ? (
          <button
            onClick={() =>
              toggleUser(row._id, "suspend")
            }
          >
            Suspend
          </button>
        ) : (
          <button
            onClick={() =>
              toggleUser(row._id, "activate")
            }
          >
            Activate
          </button>
        ),
    },
  ];

  return (
    <div>
      <h2>Users</h2>

      {/* SEARCH */}
      <input
        placeholder="Search users..."
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        style={styles.search}
      />

      <DataTable columns={columns} data={users} />

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