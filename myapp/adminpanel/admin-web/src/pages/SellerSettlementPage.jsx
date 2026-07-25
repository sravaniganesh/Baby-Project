import { useEffect, useMemo, useState } from "react";
import API from "../config/api";


export default function SellerSettlementPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchPendingSettlements();
  }, []);

 const fetchPendingSettlements = async () => {
  try {
    const token = localStorage.getItem("adminToken");

    const res = await API.get(
      "/admin/settlements/sellers/pending",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setItems(res.data || []);
  } catch {
    alert("Failed to load settlements");
  } finally {
    setLoading(false);
  }
};

  /* ================= GROUP BY SELLER ================= */
  const groupedBySeller = useMemo(() => {
    const map = {};

    items.forEach((item) => {
      const sellerId = item.seller?._id;
      if (!sellerId) return;

      if (!map[sellerId]) {
        map[sellerId] = {
          seller: item.seller,
          items: [],
          total: 0,
        };
      }

      map[sellerId].items.push(item);
      map[sellerId].total += item.sellerEarning || 0;
    });

    return Object.values(map);
  }, [items]);

  /* ================= BULK PAY ================= */
  const openBulkPayModal = (sellerGroup) => {
    setSelectedSeller(sellerGroup);
    setShowModal(true);
  };

  const closeModal = () => {
    if (paying) return;
    setShowModal(false);
    setSelectedSeller(null);
  };

  const confirmBulkPay = async () => {
    if (!selectedSeller) return;

    try {
      setPaying(true);
    const token = localStorage.getItem("adminToken");

for (const item of selectedSeller.items) {
  await API.post(
    "/admin/settlements/sellers/pay",
    {
      orderId: item.orderId,
      itemId: item.itemId,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}
      setShowModal(false);
      setSelectedSeller(null);
      fetchPendingSettlements();
    } catch {
      alert("Bulk payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <p style={styles.loading}>Loading settlements…</p>;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Seller Settlements</h1>
      <p style={styles.subText}>
        Pending payouts grouped by seller
      </p>

      {groupedBySeller.length === 0 ? (
        <div style={styles.empty}>No pending settlements</div>
      ) : (
        groupedBySeller.map((group) => (
          <div key={group.seller._id} style={styles.sellerCard}>
            <div style={styles.sellerHeader}>
              <div>
                <strong>{group.seller.email}</strong>
                <div style={styles.amount}>
                  Total: ₹ {group.total}
                </div>
              </div>

              <button
                style={styles.bulkBtn}
                onClick={() => openBulkPayModal(group)}
              >
                Pay All
              </button>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Earning</th>
                  <th>Delivered</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((i) => (
                  <tr key={i.itemId}>
                    <td>{i.productTitle}</td>
                    <td>{i.quantity}</td>
                    <td>₹ {i.sellerEarning}</td>
                    <td>
                      {new Date(i.deliveredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {/* ===== BULK PAY MODAL ===== */}
      {showModal && selectedSeller && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Confirm Bulk Payout</h3>
            <p>
              Seller: <strong>{selectedSeller.seller.email}</strong>
            </p>
            <p>
              Items: {selectedSeller.items.length}
            </p>
            <p>
              Total Amount: ₹ {selectedSeller.total}
            </p>

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={closeModal}
                disabled={paying}
              >
                Cancel
              </button>
              <button
                style={styles.confirmBtn}
                onClick={confirmBulkPay}
                disabled={paying}
              >
                {paying ? "Paying…" : "Confirm & Pay"}
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
  page: {
    padding: 32,
    fontFamily: "system-ui, sans-serif",
    background: "#f9fafb",
    minHeight: "100vh",
  },
  heading: { fontSize: 26, fontWeight: 700 },
  subText: { color: "#6b7280", marginBottom: 24 },
  loading: { padding: 40 },
  empty: {
    background: "#fff",
    padding: 40,
    borderRadius: 12,
    textAlign: "center",
  },

  sellerCard: {
    background: "#fff",
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
  },
  sellerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  amount: { color: "#16a34a", fontWeight: 600 },

  bulkBtn: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 10,
  },

  /* MODAL */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    background: "#fff",
    padding: 24,
    borderRadius: 14,
    width: 360,
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    background: "#e5e7eb",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
  },
  confirmBtn: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
  },
};
