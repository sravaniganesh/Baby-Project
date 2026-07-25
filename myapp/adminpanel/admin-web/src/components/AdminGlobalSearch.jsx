import { useState } from "react";
import API from "../config/api";

export default function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);

  const search = async (q) => {
    setQuery(q);

    if (!q) {
      setResults(null);
      return;
    }

    const token = localStorage.getItem("adminToken");

    const res = await API.get(`/admin/search?q=${q}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = res.data;
    setResults(data);
  };

  return (
    <div style={styles.wrapper}>
      <input
        placeholder="Search users, orders, products..."
        value={query}
        onChange={(e) => search(e.target.value)}
        style={styles.input}
      />

      {results && (
        <div style={styles.results}>
          <Section title="Users" items={results.users} field="name" />
          <Section title="Sellers" items={results.sellers} field="name" />
          <Section title="Doctors" items={results.doctors} field="name" />
          <Section title="Products" items={results.products} field="title" />
          <Section title="Orders" items={results.orders} field="_id" />
        </div>
      )}
    </div>
  );
}

function Section({ title, items, field }) {
  if (!items?.length) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <b>{title}</b>

      {items.map((i) => (
        <div key={i._id}>{i[field]}</div>
      ))}
    </div>
  );
}

const styles = {
  wrapper: {
    marginBottom: 20,
  },

  input: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ddd",
  },

  results: {
    background: "#fff",
    padding: 10,
    marginTop: 8,
    borderRadius: 6,
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
};