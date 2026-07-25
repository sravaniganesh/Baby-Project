import { useEffect, useState } from "react";
import API from "../config/api";

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, [page, search]);

  const load = async () => {
    const token = localStorage.getItem("adminToken");

   const res = await API.get(
  `/admin/doctors?page=${page}&limit=20&search=${search}`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

const data = res.data;

setDoctors(data.doctors || []);
setPages(data.pages || 1);
};

const verify = async (id) => {
  const token = localStorage.getItem("adminToken");

  await API.patch(
    `/admin/doctors/${id}/verify`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

    load();
  };

  return (
    <div>
      <h2>Doctors</h2>

      {/* SEARCH */}
      <input
        placeholder="Search doctors..."
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
            <th>Name</th>
            <th>Specialization</th>
            <th>Hospital</th>
            <th>Verified</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {doctors.map((d) => (
            <tr key={d._id}>
              <td>{d.name}</td>
              <td>{d.specialization}</td>
              <td>{d.hospital}</td>
              <td>{d.isVerified ? "Yes" : "No"}</td>

              <td>
                {!d.isVerified && (
                  <button
                    onClick={() => verify(d._id)}
                  >
                    Verify
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