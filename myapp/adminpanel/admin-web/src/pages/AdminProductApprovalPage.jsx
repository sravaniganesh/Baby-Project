import { useEffect, useState } from "react";
import API from "../config/api";



export default function AdminProductApprovalPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    loadPending();
  }, []);

 const loadPending = async () => {
  try {
    const token = localStorage.getItem("adminToken");
    const res = await API.get(
      "/admin/products/pending",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setProducts(res.data || []);
  } catch {
    alert("Failed to load pending products");
  } finally {
    setLoading(false);
  }
};

const approveProduct = async (id) => {
  if (!confirm("Approve this product?")) return;

  try {
    const token = localStorage.getItem("adminToken");
    await API.patch(
      `/admin/products/${id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    loadPending();
  } catch {
    alert("Approve failed");
  }
};

const rejectProduct = async () => {
  if (!reason) {
    alert("Enter rejection reason");
    return;
  }

  try {
    const token = localStorage.getItem("adminToken");
    await API.patch(
      `/admin/products/${rejectingId}/reject`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRejectingId(null);
    setReason("");
    loadPending();
  } catch {
    alert("Reject failed");
  }
};

  if (loading) return <p>Loading products…</p>;

  return (
    <div>
      <h1 style={styles.heading}>Product Approvals</h1>
      <p style={styles.sub}>
        Review seller products before publishing
      </p>

      {products.length === 0 ? (
        <div style={styles.empty}>No pending products</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Seller</th>
              <th>Product</th>
              <th>Price</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.sellerId?.businessName}</td>
                <td>{p.title}</td>
                <td>₹ {p.price}</td>
                <td>
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <button
                    style={styles.approve}
                    onClick={() => approveProduct(p._id)}
                  >
                    Approve
                  </button>
                  <button
                    style={styles.reject}
                    onClick={() => setRejectingId(p._id)}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* REJECT MODAL */}
      {rejectingId && (
        <div style={styles.modalBg}>
          <div style={styles.modal}>
            <h3>Reject Product</h3>
            <textarea
              placeholder="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={styles.textarea}
            />
            <div style={styles.modalActions}>
              <button onClick={rejectProduct} style={styles.reject}>
                Reject
              </button>
              <button
                onClick={() => setRejectingId(null)}
                style={styles.cancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  heading: { fontSize: 26, fontWeight: 700 },
  sub: { color: "#6b7280", marginBottom: 20 },

  empty: {
    background: "#fff",
    padding: 30,
    borderRadius: 12,
    textAlign: "center",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },

  approve: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 6,
    marginRight: 6,
    cursor: "pointer",
  },

  reject: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },

  modalBg: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modal: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    width: 360,
  },

  textarea: {
    width: "100%",
    minHeight: 80,
    marginTop: 10,
    padding: 10,
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },

  cancel: {
    background: "#9ca3af",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },
};
