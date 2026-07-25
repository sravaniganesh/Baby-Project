import { useEffect, useState } from "react";
import API from "../config/api";

export default function DoctorUnpaidEarningsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnpaid();
  }, []);

  const loadUnpaid = async () => {
    try {
     const token = localStorage.getItem("adminToken");

const res = await API.get(
  "/admin/premium-revenue",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

      // 🧠 TEMP LOGIC:
      // unpaid = total earning - already settled
      const unpaidOnly = (res.data || []).filter(
        (d) => d.unpaidAmount && d.unpaidAmount > 0
      );

      setRows(unpaidOnly);
    } catch {
      alert("Failed to load unpaid doctor earnings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p style={styles.loading}>Loading unpaid earnings…</p>;
  }

  return (
    <div>
      <h1 style={styles.heading}>Doctor Unpaid Earnings</h1>
      <p style={styles.subText}>
        Premium earnings not yet settled to doctors
      </p>

      {rows.length === 0 ? (
        <div style={styles.empty}>No unpaid earnings 🎉</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>City</th>
                <th>Total Earned</th>
                <th>Already Paid</th>
                <th>Unpaid Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.doctorId}>
                  <td>{r.doctorName}</td>
                  <td>{r.city}</td>
                  <td>₹ {r.totalAmount}</td>
                  <td>₹ {r.paidAmount}</td>
                  <td style={styles.unpaid}>
                    ₹ {r.unpaidAmount}
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
};
