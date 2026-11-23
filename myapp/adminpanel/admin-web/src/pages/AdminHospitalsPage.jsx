
import React, { useCallback, useEffect, useState } from "react";
import API from "../config/api";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  hospitalType: "multi-specialty",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  departments: "",
  facilities: "",
  description: "",
};

const styles = {
  page: { padding: "24px", color: "#1f2937" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "22px",
  },
  heading: { margin: 0, fontSize: "25px", fontWeight: 700 },
  muted: { color: "#6b7280", fontSize: "13px" },
  button: {
    border: "none",
    borderRadius: "7px",
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: 600,
  },
  primary: { background: "#0f766e", color: "#fff" },
  secondary: { background: "#e5e7eb", color: "#374151" },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "18px",
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    minWidth: "180px",
    background: "#fff",
  },
  tableWrap: {
    overflowX: "auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "850px",
  },
  th: {
    textAlign: "left",
    padding: "13px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "12px",
    color: "#6b7280",
  },
  td: {
    padding: "13px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "13px",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: "12px",
    padding: "22px",
    width: "100%",
    maxWidth: "700px",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: 600, color: "#4b5563" },
};

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const getApprovalStatus = (hospital) => {
  return (
    hospital.approvalStatus ||
    (hospital.isVerified ? "APPROVED" : "PENDING_APPROVAL")
  );
};

  const token = localStorage.getItem("adminToken");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const loadHospitals = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = { search, city, status };

      const response = await API.get("/admin/hospitals", {
        ...authConfig,
        params,
      });

      setHospitals(response.data.hospitals || []);
    } catch (err) {
      console.error("LOAD HOSPITALS ERROR:", err);
      setError(
        err.response?.data?.message || "Unable to load hospitals."
      );
    } finally {
      setLoading(false);
    }
  }, [search, city, status, token]);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const createHospital = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,
        departments: form.departments
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        facilities: form.facilities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      await API.post("/admin/hospitals", payload, authConfig);

      setShowForm(false);
      setForm(initialForm);
      await loadHospitals();

      alert("Hospital created successfully.");
    } catch (err) {
      console.error("CREATE HOSPITAL ERROR:", err);
      setError(
        err.response?.data?.message || "Unable to create hospital."
      );
    } finally {
      setSaving(false);
    }
  };

  const verifyHospital = async (hospitalId) => {
    if (!window.confirm("Are you sure you want to verify this hospital?")) {
      return;
    }
    const updateHospitalApproval = async (hospital, approvalStatus) => {
  const actionMessages = {
    PENDING_APPROVAL: "move this hospital back to pending approval",
    APPROVED: "approve this hospital",
    REJECTED: "reject this hospital",
  };

  const confirmed = window.confirm(
    `Are you sure you want to ${actionMessages[approvalStatus]}?`
  );

  if (!confirmed) return;

  try {
    await API.patch(
      `/admin/hospitals/${hospital._id}/approval-status`,
      { approvalStatus },
      authConfig
    );

    await loadHospitals();

    alert("Hospital approval status updated successfully.");
  } catch (err) {
    console.error("UPDATE HOSPITAL APPROVAL ERROR:", err);

    alert(
      err.response?.data?.message ||
        "Unable to update hospital approval status."
    );
  }
};

    try {
      await API.patch(
        `/admin/hospitals/${hospitalId}/verify`,
        {},
        authConfig
      );

      await loadHospitals();
    } catch (err) {
      alert(
        err.response?.data?.message || "Unable to verify hospital."
      );
    }
  };

  const toggleHospitalStatus = async (hospital) => {
    const nextStatus = !hospital.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } ${hospital.name}?`
    );

    if (!confirmed) return;

    try {
      await API.patch(
        `/admin/hospitals/${hospital._id}/status`,
        { isActive: nextStatus },
        authConfig
      );

      await loadHospitals();
    } catch (err) {
      alert(
        err.response?.data?.message || "Unable to update hospital status."
      );
    }
  };

  const badge = (label, background, color) => (
    <span
      style={{
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "20px",
        background,
        color,
        fontSize: "11px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>Hospital Management</h2>
          <p style={styles.muted}>
            Manage hospitals, verification and activation.
          </p>
        </div>

        <button
          style={{ ...styles.button, ...styles.primary }}
          onClick={() => {
            setError("");
            setForm(initialForm);
            setShowForm(true);
          }}
        >
          + Add Hospital
        </button>
      </div>

      <div style={styles.filters}>
        <input
          style={styles.input}
          placeholder="Search name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Filter by city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <select
          style={styles.input}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All hospitals</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          style={{ ...styles.button, ...styles.secondary }}
          onClick={() => {
            setSearch("");
            setCity("");
            setStatus("all");
          }}
        >
          Clear filters
        </button>

        <button
          style={{ ...styles.button, ...styles.secondary }}
          onClick={loadHospitals}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "12px",
            borderRadius: "7px",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Hospital</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Approval</th>
<th style={styles.th}>Verification</th>
<th style={styles.th}>Status</th>
<th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td style={styles.td} colSpan="7">
                  Loading hospitals...
                </td>
              </tr>
            ) : hospitals.length === 0 ? (
              <tr>
                <td style={styles.td} colSpan="7">
                  No hospitals found.
                </td>
              </tr>
            ) : (
              hospitals.map((hospital) => (
                <tr key={hospital._id}>
                  <td style={styles.td}>
                    <strong>{hospital.name}</strong>
                    <div style={styles.muted}>
                      {hospital.hospitalType || "Hospital"}
                    </div>
                  </td>

                  <td style={styles.td}>
                    {hospital.email || "—"}
                    <div style={styles.muted}>
                      {hospital.phone || "—"}
                    </div>
                  </td>

                  <td style={styles.td}>
                    {hospital.city}, {hospital.state}
                  </td>
                  <td style={styles.td}>
  {(() => {
    const approvalStatus = getApprovalStatus(hospital);

    if (approvalStatus === "APPROVED") {
      return badge("Approved", "#dcfce7", "#166534");
    }

    if (approvalStatus === "REJECTED") {
      return badge("Rejected", "#fee2e2", "#991b1b");
    }

    return badge("Pending Approval", "#fef3c7", "#92400e");
  })()}
</td>

                  <td style={styles.td}>
                    {hospital.isVerified
                      ? badge("Verified", "#dcfce7", "#166534")
                      : badge("Not yet verified", "#fef3c7", "#92400e")}
                  </td>

                  <td style={styles.td}>
                    {hospital.isActive
                      ? badge("Active", "#dbeafe", "#1d4ed8")
                      : badge("Inactive", "#fee2e2", "#991b1b")}
                  </td>

                <td style={styles.td}>
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "7px",
    }}
  >
    {getApprovalStatus(hospital) === "PENDING_APPROVAL" && (
      <button
        style={{
          ...styles.button,
          background: "#dcfce7",
          color: "#166534",
          padding: "7px 10px",
        }}
        onClick={() =>
          updateHospitalApproval(hospital, "APPROVED")
        }
      >
        Approve
      </button>
    )}

    {getApprovalStatus(hospital) === "APPROVED" &&
      !hospital.isVerified && (
        <button
          style={{
            ...styles.button,
            background: "#dbeafe",
            color: "#1d4ed8",
            padding: "7px 10px",
          }}
          onClick={() => verifyHospital(hospital._id)}
        >
          Verify
        </button>
      )}

    {(getApprovalStatus(hospital) === "APPROVED" &&
      hospital.isVerified) ||
    getApprovalStatus(hospital) === "REJECTED" ? (
      <button
        style={{
          ...styles.button,
          background: "#fef3c7",
          color: "#92400e",
          padding: "7px 10px",
        }}
        onClick={() =>
          updateHospitalApproval(hospital, "PENDING_APPROVAL")
        }
      >
        Move to Pending
      </button>
    ) : null}

    <button
      style={{
        ...styles.button,
        ...styles.secondary,
        padding: "7px 10px",
      }}
      onClick={() => toggleHospitalStatus(hospital)}
    >
      {hospital.isActive ? "Deactivate" : "Activate"}
    </button>
  </div>
</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p style={styles.muted}>
        Showing {hospitals.length} hospital(s).
      </p>

      {showForm && (
        <div
          style={styles.overlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div style={styles.modal}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <h3 style={{ margin: 0 }}>Add New Hospital</h3>

              <button
                style={{ ...styles.button, ...styles.secondary }}
                onClick={() => setShowForm(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={createHospital}>
              <div style={styles.formGrid}>
                <label style={styles.field}>
                  <span style={styles.label}>Hospital name *</span>
                  <input
                    style={styles.input}
                    required
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>Hospital type</span>
                  <select
                    style={styles.input}
                    value={form.hospitalType}
                    onChange={(e) =>
                      updateForm("hospitalType", e.target.value)
                    }
                  >
                    <option value="multi-specialty">Multi-specialty</option>
                    <option value="clinic">Clinic</option>
                    <option value="general">General</option>
                    <option value="specialty">Specialty</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>Email</span>
                  <input
                    style={styles.input}
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>Phone</span>
                  <input
                    style={styles.input}
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>City *</span>
                  <input
                    style={styles.input}
                    required
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>State *</span>
                  <input
                    style={styles.input}
                    required
                    value={form.state}
                    onChange={(e) => updateForm("state", e.target.value)}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>Country</span>
                  <input
                    style={styles.input}
                    value={form.country}
                    onChange={(e) => updateForm("country", e.target.value)}
                  />
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>Pincode</span>
                  <input
                    style={styles.input}
                    value={form.pincode}
                    onChange={(e) => updateForm("pincode", e.target.value)}
                  />
                </label>

                <label
                  style={{ ...styles.field, gridColumn: "1 / -1" }}
                >
                  <span style={styles.label}>Address *</span>
                  <textarea
                    style={{ ...styles.input, minHeight: "65px" }}
                    required
                    value={form.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                  />
                </label>

                <label
                  style={{ ...styles.field, gridColumn: "1 / -1" }}
                >
                  <span style={styles.label}>
                    Departments (comma separated)
                  </span>
                  <input
                    style={styles.input}
                    placeholder="Cardiology, Neurology, Pediatrics"
                    value={form.departments}
                    onChange={(e) =>
                      updateForm("departments", e.target.value)
                    }
                  />
                </label>

                <label
                  style={{ ...styles.field, gridColumn: "1 / -1" }}
                >
                  <span style={styles.label}>
                    Facilities (comma separated)
                  </span>
                  <input
                    style={styles.input}
                    placeholder="Emergency, ICU, Pharmacy"
                    value={form.facilities}
                    onChange={(e) =>
                      updateForm("facilities", e.target.value)
                    }
                  />
                </label>

                <label
                  style={{ ...styles.field, gridColumn: "1 / -1" }}
                >
                  <span style={styles.label}>Description</span>
                  <textarea
                    style={{ ...styles.input, minHeight: "65px" }}
                    value={form.description}
                    onChange={(e) =>
                      updateForm("description", e.target.value)
                    }
                  />
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  style={{ ...styles.button, ...styles.secondary }}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...styles.button,
                    ...styles.primary,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Create Hospital"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
