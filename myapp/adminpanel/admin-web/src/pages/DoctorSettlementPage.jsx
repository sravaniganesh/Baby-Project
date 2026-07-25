import { useEffect, useState } from "react";
import API from "../config/api";



export default function DoctorSettlementPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  useEffect(() => {
    loadUnpaidDoctors();
  }, []);

  const loadUnpaidDoctors = async () => {
    try {
      const token = localStorage.getItem("adminToken");

     const res = await API.get(
  "/admin/premium-revenue",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

const unpaid = (res.data || []).filter(
  (d) => d.unpaidAmount > 0
);

setRows(unpaid);
} catch {
  alert("Failed to load doctor settlements");
} finally {
  setLoading(false);
}
};

const payDoctor = async (doctorId) => {
  if (!window.confirm("Confirm doctor payment?")) return;

  try {
    setPaying(doctorId);
    const token = localStorage.getItem("adminToken");

    await API.post(
      "/admin/doctor-settlements/pay",
      { doctorId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    alert("Doctor paid successfully");
    loadUnpaidDoctors();
  } catch {
    alert("Payment failed");
  } finally {
    setPaying(null);
  }
};

  if (loading) {
    return <p style={styles.loading}>Loading settlements…</p>;
  }

  return (
    <div>
      <h1 style={styles.heading}>Doctor Settlements</h1>
      <p style={styles.subText}>
        Manually settle unpaid premium earnings
      </p>

      {rows.length === 0 ? (
        <div style={styles.empty}>
          All doctors are settled ✅
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>City</th>
                <th>Unpaid Amount</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.doctorId}>
                  <td>{r.doctorName}</td>
                  <td>{r.city}</td>
                  <td style={styles.unpaid}>
                    ₹ {r.unpaidAmount}
                  </td>
                  <td>
                    <button
                      style={styles.payBtn}
                      disabled={paying === r.doctorId}
                      onClick={() => payDoctor(r.doctorId)}
                    >
                      {paying === r.doctorId
                        ? "Paying..."
                        : "Pay Doctor"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    marginBottom: 6,
  },
  subText: {
    color: "#6b7280",
    marginBottom: 24,
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
    color: "#16a34a",
    fontWeight: 600,
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
  unpaid: {
    fontWeight: 700,
    color: "#dc2626",
  },
  payBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
  },
};
