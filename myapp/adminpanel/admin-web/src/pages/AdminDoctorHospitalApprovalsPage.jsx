
import React, { useCallback, useEffect, useState } from "react";
import API from "../config/api";

const styles = {
  page: { padding: 24, color: "#1f2937" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  heading: { margin: 0, fontSize: 25, fontWeight: 700 },
  muted: { color: "#6b7280", fontSize: 13 },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 7,
    background: "#fff",
  },
  button: {
    border: 0,
    borderRadius: 7,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
  },
  table: {
    width: "100%",
    minWidth: 850,
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: 13,
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 12,
    color: "#6b7280",
  },
  td: {
    padding: 13,
    borderBottom: "1px solid #f1f5f9",
    fontSize: 13,
    verticalAlign: "top",
  },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: 12,
    borderRadius: 7,
    marginBottom: 15,
  },
  success: {
    background: "#f0fdf4",
    color: "#166534",
    padding: 12,
    borderRadius: 7,
    marginBottom: 15,
  },
};

export default function AdminDoctorHospitalApprovalsPage() {
  const [associations, setAssociations] = useState([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("adminToken");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const loadAssociations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await API.get(
        "/admin/doctor-hospitals",
        {
          ...authConfig,
          params: status === "all" ? {} : { status },
        }
      );

      const data = response.data;

      // Supports the association list response and a direct array.
      const rows = Array.isArray(data)
        ? data
        : data.associations || data.doctorHospitals || [];

      setAssociations(rows);
    } catch (err) {
      console.error("LOAD DOCTOR-HOSPITAL ASSOCIATIONS ERROR:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load doctor-hospital associations."
      );
    } finally {
      setLoading(false);
    }
  }, [status, token]);

  useEffect(() => {
    loadAssociations();
  }, [loadAssociations]);

  const reviewAssociation = async (association, decision) => {
    const doctorName =
      association.doctorId?.name || "this doctor";
    const hospitalName =
      association.hospitalId?.name || "this hospital";

    const confirmed = window.confirm(
      `Are you sure you want to ${decision} ${doctorName}'s association with ${hospitalName}?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(association._id);
      setError("");
      setMessage("");

      await API.patch(
        `/admin/doctor-hospitals/${association._id}/review`,
        { decision },
        authConfig
      );

      setMessage(
        `Doctor-hospital association ${decision} successfully.`
      );

      await loadAssociations();
    } catch (err) {
      console.error("REVIEW ASSOCIATION ERROR:", err);
      setError(
        err.response?.data?.message ||
          `Unable to ${decision} this association.`
      );
    } finally {
      setProcessingId("");
    }
  };

  const badge = (label, background, color) => (
    <span
      style={{
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: 20,
        background,
        color,
        fontSize: 11,
        fontWeight: 700,
        textTransform: "capitalize",
      }}
    >
      {label}
    </span>
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>
            Doctor–Hospital Approvals
          </h2>
          <p style={styles.muted}>
            Review doctors' requests to associate with hospitals.
            Hospital verification and doctor association approval
            are separate checks.
          </p>
        </div>

        <button
          style={{
            ...styles.button,
            background: "#e5e7eb",
            color: "#374151",
          }}
          onClick={loadAssociations}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={styles.controls}>
        <select
          style={styles.input}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="pending">Pending requests</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All requests</option>
        </select>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {message && <div style={styles.success}>{message}</div>}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Doctor</th>
              <th style={styles.th}>Hospital</th>
              <th style={styles.th}>Association Details</th>
              <th style={styles.th}>Hospital Verification</th>
              <th style={styles.th}>Request Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td style={styles.td} colSpan="6">
                  Loading association requests...
                </td>
              </tr>
            ) : associations.length === 0 ? (
              <tr>
                <td style={styles.td} colSpan="6">
                  No association requests found for this status.
                </td>
              </tr>
            ) : (
              associations.map((item) => {
                const doctor = item.doctorId || {};
                const hospital = item.hospitalId || {};
                const isPending = item.status === "pending";
                const busy = processingId === item._id;

                return (
                  <tr key={item._id}>
                    <td style={styles.td}>
                      <strong>{doctor.name || "Doctor unavailable"}</strong>
                      <div style={styles.muted}>
                        {doctor.specialization || "Specialization not provided"}
                      </div>
                      <div style={styles.muted}>
                        {doctor.email || ""}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <strong>{hospital.name || "Hospital unavailable"}</strong>
                      <div style={styles.muted}>
                        {[hospital.city, hospital.state]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div style={styles.muted}>
                        {hospital.address || ""}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div>
                        Department: {item.department || "—"}
                      </div>
                      <div>
                        Designation: {item.designation || "—"}
                      </div>
                      <div>
                        Consultation fee: ₹
                        {Number(item.consultationFee || 0).toLocaleString("en-IN")}
                      </div>
                      <div>
                        Duration: {item.consultationDuration || 30} minutes
                      </div>
                      <div>
                        Booking: {item.bookingMode || "request"}
                      </div>
                    </td>

                    <td style={styles.td}>
                      {hospital.isVerified
                        ? badge("Verified", "#dcfce7", "#166534")
                        : badge("Not verified", "#fef3c7", "#92400e")}
                      <div style={{ marginTop: 6 }}>
                        {hospital.isActive
                          ? badge("Active", "#dbeafe", "#1d4ed8")
                          : badge("Inactive", "#fee2e2", "#991b1b")}
                      </div>
                    </td>

                    <td style={styles.td}>
                      {badge(
                        item.status || "unknown",
                        item.status === "approved"
                          ? "#dcfce7"
                          : item.status === "rejected"
                          ? "#fee2e2"
                          : "#fef3c7",
                        item.status === "approved"
                          ? "#166534"
                          : item.status === "rejected"
                          ? "#991b1b"
                          : "#92400e"
                      )}
                    </td>

                    <td style={styles.td}>
                      {isPending ? (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 7,
                          }}
                        >
                          <button
                            style={{
                              ...styles.button,
                              background: "#dcfce7",
                              color: "#166534",
                              opacity: busy ? 0.6 : 1,
                            }}
                            disabled={busy}
                            onClick={() =>
                              reviewAssociation(item, "approved")
                            }
                          >
                            {busy ? "Saving..." : "Approve"}
                          </button>

                          <button
                            style={{
                              ...styles.button,
                              background: "#fee2e2",
                              color: "#991b1b",
                              opacity: busy ? 0.6 : 1,
                            }}
                            disabled={busy}
                            onClick={() =>
                              reviewAssociation(item, "rejected")
                            }
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={styles.muted}>
                          No action available
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p style={styles.muted}>
        Showing {associations.length} association(s).
      </p>
    </div>
  );
}
