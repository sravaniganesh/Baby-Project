import { useState } from "react";
import API from "../config/api";

export default function AdminSearchPage() {
const [query, setQuery] = useState("");
const [results, setResults] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const search = async () => {
if (!query) return;


try {
  setLoading(true);
  setError("");

  const token = localStorage.getItem("adminToken");

  const res = await API.get(
  `/admin/search?q=${query}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = res.data;
  setResults(data);
} catch (err) {
  console.error("Search failed:", err);
  setError("Search failed");
} finally {
  setLoading(false);
}


};

const handleKey = (e) => {
if (e.key === "Enter") {
search();
}
};

return ( <div>
<h2 style={{ marginBottom: 20 }}>Global Search</h2>


  <div style={styles.searchBox}>
    <input
      style={styles.input}
      placeholder="Search users, orders, sellers, products..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={handleKey}
    />

    <button style={styles.button} onClick={search}>
      Search
    </button>
  </div>

  {loading && <p style={{ marginTop: 20 }}>Searching...</p>}
  {error && <p style={{ marginTop: 20 }}>{error}</p>}

  {results && (
    <div style={{ marginTop: 30 }}>

      {/* USERS */}
      {results.users?.length > 0 && (
        <>
          <h3>Users</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {results.users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* SELLERS */}
      {results.sellers?.length > 0 && (
        <>
          <h3>Sellers</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Business</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {results.sellers.map((s) => (
                <tr key={s._id}>
                  <td>{s.businessName}</td>
                  <td>{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* PRODUCTS */}
      {results.products?.length > 0 && (
        <>
          <h3>Products</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {results.products.map((p) => (
                <tr key={p._id}>
                  <td>{p.title}</td>
                  <td>₹{p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ORDERS */}
      {results.orders?.length > 0 && (
        <>
          <h3>Orders</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {results.orders.map((o) => (
                <tr key={o._id}>
                  <td>{o._id}</td>
                  <td>₹{o.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )}
</div>


);
}

const styles = {
searchBox: {
display: "flex",
gap: 10,
},

input: {
flex: 1,
padding: 10,
borderRadius: 8,
border: "1px solid #ccc",
},

button: {
padding: "10px 16px",
background: "#2563eb",
color: "#fff",
border: "none",
borderRadius: 8,
cursor: "pointer",
},

table: {
width: "100%",
borderCollapse: "collapse",
marginTop: 10,
marginBottom: 30,
},
};
