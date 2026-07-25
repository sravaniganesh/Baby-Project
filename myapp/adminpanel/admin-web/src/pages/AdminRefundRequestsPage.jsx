import { useEffect, useState } from "react";
import API from "../config/api";



export default function AdminRefundRequestsPage() {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 10;

  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRefundableItems();
  }, []);

  useEffect(() => {
    applySearch();
  }, [search, items]);

 const fetchRefundableItems = async () => {
  try {
    const token = localStorage.getItem("adminToken");

    const res = await API.get(
      "/admin/earnings/unpaid-items",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const refundable = res.data.filter(
      (i) => i && i.orderItemId
    );

    setItems(refundable);
    setFiltered(refundable);
  } catch (err) {
    alert("Failed to load refund requests");
  } finally {
    setLoading(false);
  }
};

const applySearch = () => {
  const s = search.toLowerCase();

  const result = items.filter(
    (i) =>
      i.title?.toLowerCase().includes(s)
  );

  setFiltered(result);
  setPage(1);
};

const processRefund = async (item) => {
  const confirm = window.confirm(
    `Refund ₹${item.sellerEarning} for "${item.title}"?`
  );

  if (!confirm) return;

  try {
    setProcessing(item.orderItemId);
    const token = localStorage.getItem("adminToken");

    await API.post(
      "/admin/refund",
      {
        orderItemId: item.orderItemId,
        refundAmount: item.sellerEarning,
        reason: "Admin approved refund",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    alert("Refund processed");
    fetchRefundableItems();
  } catch {
    alert("Refund failed");
  } finally {
    setProcessing(null);
  }
};

if (loading) {
  return <p style={styles.loading}>Loading refund requests…</p>;
}

  /* ================= PAGINATION ================= */

  const start = (page - 1) * limit;
  const end = start + limit;

  const pageItems = filtered.slice(start, end);
  const pages = Math.ceil(filtered.length / limit);

  return (
    <div>
      <h1 style={styles.heading}>Refund Requests</h1>
      <p style={styles.sub}>
        Delivered items eligible for refund
      </p>

      {/* SEARCH */}
      <input
        placeholder="Search product..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.search}
      />

      {filtered.length === 0 ? (
        <div style={styles.empty}>No refund requests</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Refund Amount</th>
                <th>Delivered</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {pageItems.map((item) => (
                <tr key={item.orderItemId}>
                  <td>{item.title}</td>
                  <td>{item.quantity}</td>

                  <td style={styles.money}>
                    ₹ {item.sellerEarning}
                  </td>

                  <td>
                    {new Date(
                      item.deliveredAt
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    <button
                      style={styles.refundBtn}
                      disabled={
                        processing === item.orderItemId
                      }
                      onClick={() => processRefund(item)}
                    >
                      {processing === item.orderItemId
                        ? "Processing…"
                        : "Refund"}
                    </button>
                  </td>
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
    marginBottom: 24,
  },

  search: {
    marginBottom: 15,
    padding: 8,
    width: 260,
    borderRadius: 6,
    border: "1px solid #ddd",
  },

  loading: {
    padding: 40,
    fontSize: 18,
  },

  empty: {
    padding: 40,
    background: "#fff",
    borderRadius: 12,
    textAlign: "center",
    color: "#6b7280",
  },

  tableWrap: {
    background: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  money: {
    fontWeight: 600,
  },

  refundBtn: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },

  pagination: {
    marginTop: 20,
    display: "flex",
    gap: 15,
    alignItems: "center",
  },
};