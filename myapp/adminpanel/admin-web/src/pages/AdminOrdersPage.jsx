import { useEffect, useState } from "react";
import API from "../config/api";
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadOrders();
  }, [page, search]);

  const loadOrders = async () => {
  const token = localStorage.getItem("adminToken");

  const res = await API.get(
    `/admin/orders?page=${page}&limit=10&search=${search}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = res.data;

  setOrders(data.orders || []);
  setPages(data.pages || 1);
};

const cancelItem = async (orderId, itemId) => {
  const token = localStorage.getItem("adminToken");

  await API.patch(
    `/admin/orders/${orderId}/items/${itemId}/cancel`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  loadOrders();
};

const refundItem = async (orderId, itemId) => {
  const token = localStorage.getItem("adminToken");

  await API.patch(
    `/admin/orders/${orderId}/items/${itemId}/refund`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  loadOrders();
};

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Orders</h2>

      {/* SEARCH */}
      <input
        placeholder="Search orders..."
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        style={styles.search}
      />

      {orders.map((order) => (
        <div key={order._id} style={styles.orderCard}>
          <div style={styles.orderHeader}>
            <div>
              <b>User:</b> {order.userId?.name}
            </div>

            <div>
              <b>Total:</b> ₹{order.totalAmount}
            </div>

            <div>
              <b>Date:</b>{" "}
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Seller Earn</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {order.items.map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.quantity}</td>
                  <td>{item.status}</td>
                  <td>₹{item.sellerEarning}</td>

                  <td>
                    {item.status !== "CANCELLED" &&
                      item.status !== "REFUNDED" && (
                        <button
                          style={styles.cancel}
                          onClick={() =>
                            cancelItem(order._id, item._id)
                          }
                        >
                          Cancel
                        </button>
                      )}

                    {!item.isRefunded && (
                      <button
                        style={styles.refund}
                        onClick={() =>
                          refundItem(order._id, item._id)
                        }
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

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

  orderCard: {
    background: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 18,
    boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
  },

  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 14,
    fontSize: 14,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  cancel: {
    marginRight: 8,
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
  },

  refund: {
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
  },

  pagination: {
    marginTop: 20,
    display: "flex",
    gap: 15,
    alignItems: "center",
  },
};