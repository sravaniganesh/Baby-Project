import { useEffect, useState } from "react";
import API from "../config/api";

export default function DoctorEarningsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctorEarnings();
  }, []);

  const loadDoctorEarnings = async () => {
    try {
      const token = localStorage.getItem("adminToken");

     const res = await API.get(
  "/admin/premium-revenue",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      setData(res.data || []);
    } catch (err) {
      alert("Failed to load doctor earnings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p style={styles.loading}>Loading doctor earnings…</p>;
  }

  return (
    <div>
      <h1 style={styles.heading}>Doctor Premium Earnings</h1>
      <p style={styles.subText}>
        Read-only overview of premium revenue earned by doctors
      </p>

      {data.length === 0 ? (
        <div style={styles.empty}>No earnings found</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>City</th>
                <th>Total Premium</th>
                <th>Platform GST (18%)</th>
                <th>Doctor Share</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.doctorId}>
                  <td>{d.doctorName}</td>
                  <td>{d.city}</td>
                  <td style={styles.money}>₹ {d.totalAmount}</td>
                  <td style={styles.money}>₹ {d.platformGST}</td>
                  <td style={styles.moneyStrong}>
                    ₹ {d.doctorEarning}
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
    fontWeight: 500,
  },
  moneyStrong: {
    fontWeight: 700,
    color: "#16a34a",
  },
};
