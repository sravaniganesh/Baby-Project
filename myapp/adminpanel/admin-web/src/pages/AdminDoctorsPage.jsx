
import { useEffect, useState } from "react";
import API from "../config/api";

const DEFAULT_PERMISSIONS = {
  viewAppointments: true,
  respondToAppointments: false,
  manageSlots: false,
  rescheduleAppointments: false,
  viewPatientContact: false,
  manageHospitalFees: false,
};

const PERMISSION_LABELS = {
  viewAppointments: "View appointments",
  respondToAppointments: "Respond to appointments",
  manageSlots: "Manage availability slots",
  rescheduleAppointments: "Reschedule appointments",
  viewPatientContact: "View patient contact",
  manageHospitalFees: "Manage hospital fees",
};

export default function AdminDoctorsPage() {
  const [activeTab, setActiveTab] = useState("doctors");

  // Doctor list
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [verification, setVerification] = useState("all");
  const [accountStatus, setAccountStatus] = useState("all");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Add doctor
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [addDoctorLoading, setAddDoctorLoading] = useState(false);
  const [addDoctorError, setAddDoctorError] = useState("");
  const [newDoctorForm, setNewDoctorForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    experience: "",
    city: "",
    state: "",
    country: "India",
  });

  // Doctor profile
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  // Doctor pricing
  const [pricingForm, setPricingForm] = useState({});
  const [pricingLoading, setPricingLoading] = useState(false);

  // Assistant management
  const [assistants, setAssistants] = useState([]);
  const [assistantPage, setAssistantPage] = useState(1);
  const [assistantPages, setAssistantPages] = useState(1);
  const [assistantTotal, setAssistantTotal] = useState(0);
  const [assistantSearch, setAssistantSearch] = useState("");
  const [assistantStatus, setAssistantStatus] = useState("all");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState("");
  const [assistantActionId, setAssistantActionId] = useState(null);

  const token = localStorage.getItem("adminToken");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =====================================
  // LOAD HOSPITALS
  // =====================================
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const res = await API.get(
          "/admin/doctors/hospitals",
          authConfig
        );

        setHospitals(res.data || []);
      } catch (err) {
        console.error("Hospital filter loading error:", err);
      }
    };

    loadHospitals();
  }, []);

  // =====================================
  // LOAD DOCTORS
  // =====================================
  useEffect(() => {
    let cancelled = false;

    const loadDoctors = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
          search,
          hospitalId,
          verification,
          accountStatus,
        });

        const res = await API.get(
          `/admin/doctors?${params.toString()}`,
          authConfig
        );

        if (cancelled) return;

        setDoctors(res.data.doctors || []);
        setPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
      } catch (err) {
        if (cancelled) return;

        setError(
          err.response?.data?.message ||
            "Unable to load doctors."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDoctors();

    return () => {
      cancelled = true;
    };
  }, [page, search, hospitalId, verification, accountStatus]);

  // =====================================
  // LOAD ASSISTANTS
  // =====================================
  useEffect(() => {
    if (activeTab !== "assistants") return;

    let cancelled = false;

    const loadAssistants = async () => {
      try {
        setAssistantLoading(true);
        setAssistantError("");

        const params = new URLSearchParams({
          page: String(assistantPage),
          limit: "20",
          search: assistantSearch,
          status: assistantStatus,
        });

        const res = await API.get(
          `/admin/doctors/assistants?${params.toString()}`,
          authConfig
        );

        if (cancelled) return;

        setAssistants(res.data.relationships || []);
        setAssistantPages(res.data.pages || 1);
        setAssistantTotal(res.data.total || 0);
      } catch (err) {
        if (cancelled) return;

        setAssistantError(
          err.response?.data?.message ||
            "Unable to load assistant relationships."
        );
      } finally {
        if (!cancelled) setAssistantLoading(false);
      }
    };

    loadAssistants();

    return () => {
      cancelled = true;
    };
  }, [activeTab, assistantPage, assistantSearch, assistantStatus]);

  // =====================================
  // ADD DOCTOR
  // =====================================
  const handleNewDoctorChange = (e) => {
    const { name, value } = e.target;
    setNewDoctorForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetNewDoctorForm = () => {
    setNewDoctorForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      specialization: "",
      experience: "",
      city: "",
      state: "",
      country: "India",
    });
    setAddDoctorError("");
  };

  const createDoctor = async (e) => {
    e.preventDefault();
    setAddDoctorError("");

    if (
      !newDoctorForm.name.trim() ||
      !newDoctorForm.email.trim() ||
      !newDoctorForm.password ||
      !newDoctorForm.specialization.trim() ||
      newDoctorForm.experience === "" ||
      !newDoctorForm.city.trim()
    ) {
      setAddDoctorError(
        "Please complete all required fields: name, email, password, specialization, experience and city."
      );
      return;
    }

    if (Number(newDoctorForm.experience) < 0) {
      setAddDoctorError("Experience cannot be negative.");
      return;
    }

    try {
      setAddDoctorLoading(true);

      await API.post(
        "/admin/doctors",
        {
          ...newDoctorForm,
          name: newDoctorForm.name.trim(),
          email: newDoctorForm.email.trim().toLowerCase(),
          phone: newDoctorForm.phone.trim(),
          specialization: newDoctorForm.specialization.trim(),
          experience: Number(newDoctorForm.experience),
          city: newDoctorForm.city.trim(),
          state: newDoctorForm.state.trim(),
          country: newDoctorForm.country.trim() || "India",
          isVerified: true,
          isActive: true,
        },
        authConfig
      );

      alert("Doctor profile created successfully.");
      setShowAddDoctor(false);
      resetNewDoctorForm();
      setPage(1);
      await refreshDoctors();
    } catch (err) {
      setAddDoctorError(
        err.response?.data?.message ||
          "Unable to create doctor. The Admin create-doctor API may need to be added or adjusted."
      );
    } finally {
      setAddDoctorLoading(false);
    }
  };

  // =====================================
  // REFRESH DOCTORS
  // =====================================
  const refreshDoctors = async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      search,
      hospitalId,
      verification,
      accountStatus,
    });

    const res = await API.get(
      `/admin/doctors?${params.toString()}`,
      authConfig
    );

    setDoctors(res.data.doctors || []);
    setPages(res.data.pages || 1);
    setTotal(res.data.total || 0);
  };

  // =====================================
  // REFRESH ASSISTANTS
  // =====================================
  const refreshAssistants = async () => {
    const params = new URLSearchParams({
      page: String(assistantPage),
      limit: "20",
      search: assistantSearch,
      status: assistantStatus,
    });

    const res = await API.get(
      `/admin/doctors/assistants?${params.toString()}`,
      authConfig
    );

    setAssistants(res.data.relationships || []);
    setAssistantPages(res.data.pages || 1);
    setAssistantTotal(res.data.total || 0);
  };

  // =====================================
  // VIEW DOCTOR PROFILE
  // =====================================
  const viewProfile = async (id) => {
    try {
      setProfileLoading(true);
      setSelectedDoctor(null);
      setEditMode(false);

      const res = await API.get(
        `/admin/doctors/${id}`,
        authConfig
      );

      const doctor = res.data.doctor;

      setSelectedDoctor({
        ...doctor,
        hospitalAssociations:
          res.data.hospitalAssociations || [],
      });

      setProfileForm({
        name: doctor.name || "",
        email: doctor.email || "",
        phone: doctor.phone || "",
        specialization: doctor.specialization || "",
        experience: doctor.experience ?? "",
        city: doctor.city || "",
        state: doctor.state || "",
        country: doctor.country || "India",
      });

      setPricingForm({
        consultationFee:
          doctor.adminOverride?.consultationFee ??
          doctor.consultationFee ??
          "",
        hospitalConsultationType:
          doctor.adminOverride?.hospitalConsultationType || "paid",
        videoConsultationFee:
          doctor.adminOverride?.videoConsultationFee ??
          doctor.videoConsultationFee ??
          "",
      });
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to load doctor profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // =====================================
  // PROFILE FORM CHANGE
  // =====================================
  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================
  // SAVE DOCTOR PROFILE
  // =====================================
  const saveProfile = async () => {
    if (!selectedDoctor) return;

    try {
      setActionLoading(true);

      await API.patch(
        `/admin/doctors/${selectedDoctor._id}/profile`,
        {
          ...profileForm,
          experience: Number(profileForm.experience),
        },
        authConfig
      );

      alert("Doctor profile updated successfully.");
      setEditMode(false);

      await viewProfile(selectedDoctor._id);
      await refreshDoctors();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to update doctor profile."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================
  // SAVE DOCTOR PRICING
  // =====================================
  const savePricing = async () => {
    if (!selectedDoctor) return;

    try {
      setPricingLoading(true);

      const payload = {};

      ["consultationFee", "videoConsultationFee"].forEach((field) => {
        if (
          pricingForm[field] !== "" &&
          pricingForm[field] !== null &&
          pricingForm[field] !== undefined
        ) {
          payload[field] = Number(pricingForm[field]);
        }
      });

      payload.hospitalConsultationType =
        pricingForm.hospitalConsultationType;

      await API.patch(
        `/admin/doctors/${selectedDoctor._id}/pricing`,
        payload,
        authConfig
      );

      alert("Doctor pricing updated successfully.");

      await viewProfile(selectedDoctor._id);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to update doctor pricing."
      );
    } finally {
      setPricingLoading(false);
    }
  };

  // =====================================
  // VERIFY DOCTOR
  // =====================================
  const verifyDoctor = async (id) => {
    if (!window.confirm("Verify this doctor?")) return;

    try {
      setActionLoading(true);

      await API.patch(
        `/admin/doctors/${id}/verify`,
        {},
        authConfig
      );

      await refreshDoctors();

      if (selectedDoctor?._id === id) {
        await viewProfile(id);
      }

      alert("Doctor verified successfully.");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Doctor verification failed."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================
  // ACTIVATE / SUSPEND DOCTOR
  // =====================================
  const changeAccountStatus = async (doctor) => {
    const isActive = doctor.isActive !== false;
    const action = isActive ? "suspend" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${doctor.name}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      await API.patch(
        `/admin/doctors/${doctor._id}/${action}`,
        {},
        authConfig
      );

      await refreshDoctors();

      if (selectedDoctor?._id === doctor._id) {
        await viewProfile(doctor._id);
      }

      alert(
        isActive
          ? "Doctor suspended successfully."
          : "Doctor activated successfully."
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          `Failed to ${action} doctor.`
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================
  // UPDATE ASSISTANT PERMISSION
  // =====================================
  const updateAssistantPermission = async (
    relationship,
    permission,
    checked
  ) => {
    try {
      setAssistantActionId(relationship._id);

      await API.patch(
        `/admin/doctors/assistants/${relationship._id}/permissions`,
        {
          permissions: {
            [permission]: checked,
          },
        },
        authConfig
      );

      await refreshAssistants();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to update assistant permission."
      );
    } finally {
      setAssistantActionId(null);
    }
  };

  // =====================================
  // REVOKE ASSISTANT ACCESS
  // =====================================
  const revokeAssistant = async (relationship) => {
    const assistantName =
      relationship.assistantId?.name || "this assistant";

    if (
      !window.confirm(
        `Are you sure you want to revoke ${assistantName}'s access?`
      )
    ) {
      return;
    }

    try {
      setAssistantActionId(relationship._id);

      await API.patch(
        `/admin/doctors/assistants/${relationship._id}/revoke`,
        {},
        authConfig
      );

      alert("Assistant access revoked successfully.");
      await refreshAssistants();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to revoke assistant access."
      );
    } finally {
      setAssistantActionId(null);
    }
  };

  // =====================================
  // RESET FILTERS
  // =====================================
  const resetFilters = () => {
    setSearch("");
    setHospitalId("");
    setVerification("all");
    setAccountStatus("all");
    setPage(1);
  };

  // =====================================
  // PROFILE FIELD
  // =====================================
  const profileField = (label, name, type = "text") => (
    <div style={styles.formField} key={name}>
      <label style={styles.label}>{label}</label>

      <input
        type={type}
        name={name}
        value={profileForm[name] ?? ""}
        onChange={handleProfileChange}
        style={styles.formInput}
        disabled={!editMode || actionLoading}
        min={type === "number" ? "0" : undefined}
      />
    </div>
  );

  // =====================================
  // PRICING FIELD
  // =====================================
  const pricingField = (label, name, type = "number") => (
    <div style={styles.formField} key={name}>
      <label style={styles.label}>{label}</label>

      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        value={pricingForm[name] ?? ""}
        onChange={(e) =>
          setPricingForm((prev) => ({
            ...prev,
            [name]: e.target.value,
          }))
        }
        style={styles.formInput}
        disabled={pricingLoading}
      />
    </div>
  );

  // =====================================
  // MAIN PAGE
  // =====================================
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>Doctor Operations</h2>
          <p style={styles.subtitle}>
            Manage doctors, hospital associations, pricing and assistants.
          </p>
        </div>

        <div style={styles.headerActions}>
          {activeTab === "doctors" && (
            <button
              type="button"
              style={styles.addButton}
              onClick={() => {
                resetNewDoctorForm();
                setShowAddDoctor(true);
              }}
            >
              + Add Doctor
            </button>
          )}
          <div style={styles.totalBox}>
            <strong>
              {activeTab === "doctors" ? total : assistantTotal}
            </strong>
            <span>
              {activeTab === "doctors"
                ? "Total doctors"
                : "Assistant relationships"}
            </span>
          </div>
        </div>
      </div>

      {/* PAGE TABS */}
      <div style={styles.tabs}>
        <button
          style={
            activeTab === "doctors"
              ? styles.activeTab
              : styles.tab
          }
          onClick={() => setActiveTab("doctors")}
        >
          Doctors
        </button>

        <button
          style={
            activeTab === "assistants"
              ? styles.activeTab
              : styles.tab
          }
          onClick={() => setActiveTab("assistants")}
        >
          Assistant Management
        </button>
      </div>

      {/* =====================================
          DOCTORS TAB
      ===================================== */}
      {activeTab === "doctors" && (
        <>
          <div style={styles.filterCard}>
            <div style={styles.filterGrid}>
              <input
                type="text"
                placeholder="Search doctor, email, specialization or hospital..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={styles.search}
              />

              <select
                value={hospitalId}
                onChange={(e) => {
                  setHospitalId(e.target.value);
                  setPage(1);
                }}
                style={styles.filterInput}
              >
                <option value="">All hospitals</option>
                {hospitals.map((hospital) => (
                  <option key={hospital._id} value={hospital._id}>
                    {hospital.name} - {hospital.city}
                  </option>
                ))}
              </select>

              <select
                value={verification}
                onChange={(e) => {
                  setVerification(e.target.value);
                  setPage(1);
                }}
                style={styles.filterInput}
              >
                <option value="all">All verification</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending verification</option>
              </select>

              <select
                value={accountStatus}
                onChange={(e) => {
                  setAccountStatus(e.target.value);
                  setPage(1);
                }}
                style={styles.filterInput}
              >
                <option value="all">All accounts</option>
                <option value="active">Active</option>
                <option value="inactive">Suspended</option>
              </select>

              <button
                style={styles.resetButton}
                onClick={resetFilters}
              >
                Reset filters
              </button>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.tableCard}>
            {loading ? (
              <p style={styles.message}>Loading doctors...</p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Doctor</th>
                      <th style={styles.th}>Specialization</th>
                      <th style={styles.th}>Hospital</th>
                      <th style={styles.th}>Verification</th>
                      <th style={styles.th}>Account</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {doctors.map((doctor) => {
                      const active = doctor.isActive !== false;
                      const associations =
                        doctor.hospitalAssociations || [];

                      return (
                        <tr key={doctor._id}>
                          <td style={styles.td}>
                            <button
                              style={styles.nameButton}
                              onClick={() => viewProfile(doctor._id)}
                            >
                              {doctor.name || "Unnamed doctor"}
                            </button>

                            <div style={styles.secondaryText}>
                              {doctor.email || "No email"}
                            </div>
                          </td>

                          <td style={styles.td}>
                            {doctor.specialization || "—"}
                          </td>

                          <td style={styles.td}>
                            {associations.length > 0 ? (
                              associations.map((item) => (
                                <div
                                  key={item._id}
                                  style={styles.hospitalItem}
                                >
                                  {item.hospitalId?.name || "Hospital"}
                                </div>
                              ))
                            ) : (
                              <span style={styles.muted}>
                                No approved hospital
                              </span>
                            )}
                          </td>

                          <td style={styles.td}>
                            <span
                              style={
                                doctor.isVerified
                                  ? styles.verified
                                  : styles.pending
                              }
                            >
                              {doctor.isVerified
                                ? "Verified"
                                : "Pending"}
                            </span>
                          </td>

                          <td style={styles.td}>
                            <span
                              style={
                                active
                                  ? styles.active
                                  : styles.suspended
                              }
                            >
                              {active ? "Active" : "Suspended"}
                            </span>
                          </td>

                          <td style={styles.td}>
                            <div style={styles.actionGroup}>
                              <button
                                style={styles.viewButton}
                                onClick={() => viewProfile(doctor._id)}
                              >
                                View
                              </button>

                              {!doctor.isVerified && (
                                <button
                                  style={styles.verifyButton}
                                  disabled={actionLoading}
                                  onClick={() =>
                                    verifyDoctor(doctor._id)
                                  }
                                >
                                  Verify
                                </button>
                              )}

                              <button
                                style={
                                  active
                                    ? styles.suspendButton
                                    : styles.activateButton
                                }
                                disabled={actionLoading}
                                onClick={() =>
                                  changeAccountStatus(doctor)
                                }
                              >
                                {active ? "Suspend" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {doctors.length === 0 && (
                      <tr>
                        <td colSpan="6" style={styles.empty}>
                          No doctors found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={styles.pagination}>
            <span style={styles.paginationText}>
              Showing {doctors.length} of {total} doctors
            </span>

            <div style={styles.paginationControls}>
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                style={styles.pageButton}
              >
                Previous
              </button>

              <span>Page {page} of {pages}</span>

              <button
                disabled={page >= pages || loading}
                onClick={() => setPage((p) => p + 1)}
                style={styles.pageButton}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* =====================================
          ASSISTANT MANAGEMENT TAB
      ===================================== */}
      {activeTab === "assistants" && (
        <>
          <div style={styles.infoBox}>
            Assistant access is based on the doctor's invitation and the
            assistant's own acceptance. Admin can review accepted
            relationships, update permissions and revoke access.
          </div>

          <div style={styles.filterCard}>
            <div style={styles.filterGrid}>
              <input
                type="text"
                placeholder="Search doctor or assistant..."
                value={assistantSearch}
                onChange={(e) => {
                  setAssistantSearch(e.target.value);
                  setAssistantPage(1);
                }}
                style={styles.search}
              />

              <select
                value={assistantStatus}
                onChange={(e) => {
                  setAssistantStatus(e.target.value);
                  setAssistantPage(1);
                }}
                style={styles.filterInput}
              >
                <option value="all">All relationships</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="DECLINED">Declined</option>
                <option value="REVOKED">Revoked</option>
              </select>

              <button
                style={styles.resetButton}
                onClick={() => {
                  setAssistantSearch("");
                  setAssistantStatus("all");
                  setAssistantPage(1);
                }}
              >
                Reset filters
              </button>
            </div>
          </div>

          {assistantError && (
            <div style={styles.error}>{assistantError}</div>
          )}

          <div style={styles.tableCard}>
            {assistantLoading ? (
              <p style={styles.message}>
                Loading assistant relationships...
              </p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.assistantTable}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Doctor</th>
                      <th style={styles.th}>Assistant</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Permissions</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {assistants.map((relationship) => {
                      const permissions = {
                        ...DEFAULT_PERMISSIONS,
                        ...(relationship.permissions || {}),
                      };

                      const accepted =
                        relationship.status === "ACCEPTED";

                      return (
                        <tr key={relationship._id}>
                          <td style={styles.td}>
                            <strong>
                              {relationship.doctorId?.name ||
                                "Doctor unavailable"}
                            </strong>

                            <div style={styles.secondaryText}>
                              {relationship.doctorId?.email || ""}
                            </div>

                            <div style={styles.secondaryText}>
                              {relationship.doctorId?.specialization || ""}
                            </div>
                          </td>

                          <td style={styles.td}>
                            <strong>
                              {relationship.assistantId?.name ||
                                "Assistant unavailable"}
                            </strong>

                            <div style={styles.secondaryText}>
                              {relationship.assistantId?.email || ""}
                            </div>

                            <div style={styles.secondaryText}>
                              {relationship.assistantId?.username || ""}
                            </div>
                          </td>

                          <td style={styles.td}>
                            <span
                              style={
                                relationship.status === "ACCEPTED"
                                  ? styles.active
                                  : relationship.status === "REVOKED"
                                  ? styles.suspended
                                  : styles.pending
                              }
                            >
                              {relationship.status}
                            </span>
                          </td>

                          <td style={styles.td}>
                            {accepted ? (
                              <div style={styles.permissionList}>
                                {Object.entries(PERMISSION_LABELS).map(
                                  ([key, label]) => (
                                    <label
                                      key={key}
                                      style={styles.permissionItem}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={Boolean(permissions[key])}
                                        disabled={
                                          assistantActionId ===
                                          relationship._id
                                        }
                                        onChange={(e) =>
                                          updateAssistantPermission(
                                            relationship,
                                            key,
                                            e.target.checked
                                          )
                                        }
                                      />
                                      {label}
                                    </label>
                                  )
                                )}
                              </div>
                            ) : (
                              <span style={styles.muted}>
                                Permissions can be managed after acceptance.
                              </span>
                            )}
                          </td>

                          <td style={styles.td}>
                            {["PENDING", "ACCEPTED"].includes(
                              relationship.status
                            ) ? (
                              <button
                                style={styles.suspendButton}
                                disabled={
                                  assistantActionId === relationship._id
                                }
                                onClick={() =>
                                  revokeAssistant(relationship)
                                }
                              >
                                {assistantActionId === relationship._id
                                  ? "Please wait..."
                                  : "Revoke Access"}
                              </button>
                            ) : (
                              <span style={styles.muted}>No action</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {assistants.length === 0 && (
                      <tr>
                        <td colSpan="5" style={styles.empty}>
                          No assistant relationships found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={styles.pagination}>
            <span style={styles.paginationText}>
              Showing {assistants.length} of {assistantTotal} relationships
            </span>

            <div style={styles.paginationControls}>
              <button
                disabled={assistantPage <= 1 || assistantLoading}
                onClick={() => setAssistantPage((p) => p - 1)}
                style={styles.pageButton}
              >
                Previous
              </button>

              <span>
                Page {assistantPage} of {assistantPages}
              </span>

              <button
                disabled={
                  assistantPage >= assistantPages || assistantLoading
                }
                onClick={() => setAssistantPage((p) => p + 1)}
                style={styles.pageButton}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* =====================================
          ADD DOCTOR MODAL
      ===================================== */}
      {showAddDoctor && (
        <div
          style={styles.modalOverlay}
          onClick={() => {
            if (!addDoctorLoading) setShowAddDoctor(false);
          }}
        >
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Add Doctor Profile</h2>
                <p style={styles.subtitle}>
                  Create a doctor account from Platform Admin.
                </p>
              </div>
              <button
                type="button"
                style={styles.closeButton}
                disabled={addDoctorLoading}
                onClick={() => setShowAddDoctor(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={createDoctor} style={styles.modalBody}>
              <div style={styles.formGrid}>
                {[
                  ["Full Name", "name", "text", true],
                  ["Email", "email", "email", true],
                  ["Temporary Password", "password", "password", true],
                  ["Phone Number", "phone", "tel", false],
                  ["Specialization", "specialization", "text", true],
                  ["Experience (Years)", "experience", "number", true],
                  ["City", "city", "text", true],
                  ["State", "state", "text", false],
                  ["Country", "country", "text", true],
                ].map(([label, name, type, required]) => (
                  <div style={styles.formField} key={name}>
                    <label style={styles.label}>
                      {label}{required ? " *" : ""}
                    </label>
                    <input
                      type={type}
                      name={name}
                      value={newDoctorForm[name]}
                      onChange={handleNewDoctorChange}
                      style={styles.formInput}
                      required={required}
                      min={type === "number" ? "0" : undefined}
                      disabled={addDoctorLoading}
                      autoComplete={
                        name === "password" ? "new-password" : "off"
                      }
                    />
                  </div>
                ))}
              </div>

              <p style={styles.muted}>
                The profile will be created as active and verified by Platform
                Admin. Hospital association can be managed through the
                existing Hospital Management and Doctor–Hospital Management
                pages.
              </p>

              {addDoctorError && (
                <div style={styles.error}>{addDoctorError}</div>
              )}

              <div style={styles.formActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  disabled={addDoctorLoading}
                  onClick={() => {
                    setShowAddDoctor(false);
                    resetNewDoctorForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.saveButton}
                  disabled={addDoctorLoading}
                >
                  {addDoctorLoading ? "Creating..." : "Create Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================
          DOCTOR PROFILE MODAL
      ===================================== */}
      {(selectedDoctor || profileLoading) && (
        <div
          style={styles.modalOverlay}
          onClick={() => {
            if (!actionLoading && !pricingLoading) {
              setSelectedDoctor(null);
              setEditMode(false);
            }
          }}
        >
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Doctor Profile</h2>
                <p style={styles.subtitle}>
                  View and manage doctor information and pricing.
                </p>
              </div>

              <button
                style={styles.closeButton}
                disabled={actionLoading || pricingLoading}
                onClick={() => {
                  setSelectedDoctor(null);
                  setEditMode(false);
                }}
              >
                ×
              </button>
            </div>

            {profileLoading ? (
              <p style={styles.message}>
                Loading doctor profile...
              </p>
            ) : selectedDoctor && (
              <div style={styles.modalBody}>
                {/* PROFILE STATUS */}
                <div style={styles.profileStatus}>
                  <div>
                    <strong>{selectedDoctor.name}</strong>
                    <p style={styles.secondaryText}>
                      {selectedDoctor.specialization}
                    </p>
                  </div>

                  <div style={styles.statusGroup}>
                    <span
                      style={
                        selectedDoctor.isVerified
                          ? styles.verified
                          : styles.pending
                      }
                    >
                      {selectedDoctor.isVerified
                        ? "Verified"
                        : "Pending"}
                    </span>

                    <span
                      style={
                        selectedDoctor.isActive !== false
                          ? styles.active
                          : styles.suspended
                      }
                    >
                      {selectedDoctor.isActive !== false
                        ? "Active"
                        : "Suspended"}
                    </span>
                  </div>
                </div>

                {/* PERSONAL INFORMATION */}
                <div style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <h3>Personal Information</h3>

                    {!editMode && (
                      <button
                        style={styles.editButton}
                        onClick={() => setEditMode(true)}
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  <div style={styles.formGrid}>
                    {profileField("Full Name", "name")}
                    {profileField("Email", "email", "email")}
                    {profileField("Phone", "phone")}
                    {profileField("Specialization", "specialization")}
                    {profileField("Experience (Years)", "experience", "number")}
                    {profileField("City", "city")}
                    {profileField("State", "state")}
                    {profileField("Country", "country")}
                  </div>

                  {editMode && (
                    <div style={styles.formActions}>
                      <button
                        style={styles.cancelButton}
                        disabled={actionLoading}
                        onClick={() => {
                          setEditMode(false);
                          setProfileForm({
                            name: selectedDoctor.name || "",
                            email: selectedDoctor.email || "",
                            phone: selectedDoctor.phone || "",
                            specialization:
                              selectedDoctor.specialization || "",
                            experience:
                              selectedDoctor.experience ?? "",
                            city: selectedDoctor.city || "",
                            state: selectedDoctor.state || "",
                            country: selectedDoctor.country || "India",
                          });
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        style={styles.saveButton}
                        disabled={actionLoading}
                        onClick={saveProfile}
                      >
                        {actionLoading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>

                {/* DOCTOR PRICING */}
                <div style={styles.section}>
                  <h3>Doctor Pricing Management</h3>

                  <p style={styles.muted}>
                    These settings update the platform admin pricing overrides.
                  </p>

                  <div style={styles.formGrid}>
                    {pricingField(
                      "Hospital Consultation Fee (₹)",
                      "consultationFee"
                    )}

                    <div style={styles.formField}>
                      <label style={styles.label}>
                        Hospital Consultation Type
                      </label>
                      <select
                        value={pricingForm.hospitalConsultationType || "paid"}
                        onChange={(e) =>
                          setPricingForm((prev) => ({
                            ...prev,
                            hospitalConsultationType: e.target.value,
                          }))
                        }
                        style={styles.formInput}
                        disabled={pricingLoading}
                      >
                        <option value="paid">Paid</option>
                        <option value="free">Free</option>
                      </select>
                    </div>

                    {pricingField(
                      "Video Consultation Fee (₹)",
                      "videoConsultationFee"
                    )}
                  </div>
                  <p style={styles.muted}>
                    Hospital and video consultations have separate fees.
                    Neither consultation has a duration limit.
                  </p>

                  <div style={styles.formActions}>
                    <button
                      style={styles.saveButton}
                      disabled={pricingLoading}
                      onClick={savePricing}
                    >
                      {pricingLoading
                        ? "Saving pricing..."
                        : "Save Pricing Override"}
                    </button>
                  </div>
                </div>

                {/* HOSPITAL ASSOCIATIONS */}
                <div style={styles.section}>
                  <h3>Hospital Associations</h3>

                  {selectedDoctor.hospitalAssociations?.length > 0 ? (
                    <div style={styles.associationList}>
                      {selectedDoctor.hospitalAssociations.map((item) => (
                        <div
                          key={item._id}
                          style={styles.associationCard}
                        >
                          <strong>
                            {item.hospitalId?.name || "Hospital"}
                          </strong>

                          <p style={styles.secondaryText}>
                            {item.hospitalId?.city || "—"}
                            {item.hospitalId?.state
                              ? `, ${item.hospitalId.state}`
                              : ""}
                          </p>

                          <div style={styles.associationDetails}>
                            <span>
                              Department: {item.department || "—"}
                            </span>
                            <span>
                              Designation: {item.designation || "—"}
                            </span>
                            <span>
                              Consultation Fee: ₹
                              {Number(item.consultationFee || 0)}
                            </span>
                            <span>
                              Booking Mode: {item.bookingMode || "request"}
                            </span>
                          </div>

                          <span
                            style={
                              item.status === "approved" && item.isActive
                                ? styles.active
                                : styles.pending
                            }
                          >
                            {item.status}
                            {!item.isActive ? " / Inactive" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={styles.muted}>
                      No hospital associations found.
                    </p>
                  )}
                </div>

                {/* ACCOUNT ACTIONS */}
                <div style={styles.section}>
                  <h3>Admin Actions</h3>

                  <div style={styles.actionGroup}>
                    {!selectedDoctor.isVerified && (
                      <button
                        style={styles.verifyButton}
                        disabled={actionLoading}
                        onClick={() =>
                          verifyDoctor(selectedDoctor._id)
                        }
                      >
                        Verify Doctor
                      </button>
                    )}

                    <button
                      style={
                        selectedDoctor.isActive !== false
                          ? styles.suspendButton
                          : styles.activateButton
                      }
                      disabled={actionLoading}
                      onClick={() =>
                        changeAccountStatus(selectedDoctor)
                      }
                    >
                      {selectedDoctor.isActive !== false
                        ? "Suspend Account"
                        : "Activate Account"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================
// STYLES
// =====================================
const styles = {
  container: {
    width: "100%",
    color: "#1f2937",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 22,
  },

  heading: {
    margin: 0,
    fontSize: 24,
  },

  subtitle: {
    color: "#777",
    margin: "7px 0 0",
    fontSize: 13,
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  addButton: {
    padding: "11px 16px",
    border: "none",
    borderRadius: 7,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  totalBox: {
    display: "flex",
    flexDirection: "column",
    padding: "12px 22px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    background: "#fff",
  },

  tabs: {
    display: "flex",
    gap: 10,
    borderBottom: "1px solid #e5e7eb",
    marginBottom: 20,
  },

  tab: {
    padding: "12px 18px",
    border: "none",
    background: "transparent",
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 600,
  },

  activeTab: {
    padding: "12px 18px",
    border: "none",
    borderBottom: "3px solid #2563eb",
    background: "#eff6ff",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 700,
  },

  infoBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e40af",
    padding: 14,
    borderRadius: 8,
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 1.6,
  },

  filterCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 12,
  },

  search: {
    padding: 11,
    border: "1px solid #ddd",
    borderRadius: 6,
    minWidth: 0,
  },

  filterInput: {
    padding: 11,
    border: "1px solid #ddd",
    borderRadius: 6,
    background: "#fff",
    minWidth: 0,
  },

  resetButton: {
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 6,
    background: "#f9fafb",
    cursor: "pointer",
  },

  tableCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 950,
  },

  assistantTable: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 1050,
  },

  th: {
    textAlign: "left",
    padding: 14,
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 13,
    whiteSpace: "nowrap",
    verticalAlign: "top",
  },

  td: {
    padding: 14,
    borderBottom: "1px solid #eee",
    fontSize: 13,
    verticalAlign: "top",
  },

  nameButton: {
    padding: 0,
    border: "none",
    background: "none",
    color: "#2563eb",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
  },

  secondaryText: {
    color: "#777",
    fontSize: 12,
    marginTop: 5,
  },

  hospitalItem: {
    marginBottom: 5,
  },

  muted: {
    color: "#888",
    fontSize: 12,
  },

  verified: {
    color: "#15803d",
    background: "#dcfce7",
    padding: "5px 9px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  pending: {
    color: "#a16207",
    background: "#fef3c7",
    padding: "5px 9px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  active: {
    color: "#15803d",
    background: "#dcfce7",
    padding: "5px 9px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  suspended: {
    color: "#b91c1c",
    background: "#fee2e2",
    padding: "5px 9px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  actionGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
  },

  viewButton: {
    padding: "7px 11px",
    border: "1px solid #2563eb",
    background: "#eff6ff",
    color: "#2563eb",
    borderRadius: 5,
    cursor: "pointer",
  },

  verifyButton: {
    padding: "7px 11px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 5,
    cursor: "pointer",
  },

  suspendButton: {
    padding: "7px 11px",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    borderRadius: 5,
    cursor: "pointer",
  },

  activateButton: {
    padding: "7px 11px",
    border: "none",
    background: "#15803d",
    color: "#fff",
    borderRadius: 5,
    cursor: "pointer",
  },

  permissionList: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    minWidth: 190,
  },

  permissionItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    cursor: "pointer",
  },

  empty: {
    padding: 30,
    textAlign: "center",
    color: "#777",
  },

  message: {
    padding: 25,
    color: "#777",
  },

  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: 12,
    borderRadius: 7,
    marginBottom: 15,
  },

  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },

  paginationText: {
    color: "#777",
    fontSize: 13,
  },

  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  pageButton: {
    padding: "8px 13px",
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: 5,
    cursor: "pointer",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modal: {
    background: "#fff",
    width: "100%",
    maxWidth: 850,
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: 12,
    boxShadow: "0 15px 50px rgba(0,0,0,0.2)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 22,
    borderBottom: "1px solid #eee",
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 2,
  },

  modalTitle: {
    margin: 0,
  },

  closeButton: {
    fontSize: 28,
    border: "none",
    background: "none",
    cursor: "pointer",
  },

  modalBody: {
    padding: 22,
  },

  profileStatus: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    padding: 16,
    background: "#f8fafc",
    borderRadius: 8,
    marginBottom: 22,
  },

  statusGroup: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  section: {
    borderBottom: "1px solid #eee",
    paddingBottom: 22,
    marginBottom: 22,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },

  editButton: {
    padding: "8px 13px",
    border: "1px solid #2563eb",
    color: "#2563eb",
    background: "#eff6ff",
    borderRadius: 5,
    cursor: "pointer",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 15,
  },

  formField: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#555",
  },

  formInput: {
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 6,
    width: "100%",
    boxSizing: "border-box",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },

  cancelButton: {
    padding: "9px 16px",
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: 5,
    cursor: "pointer",
  },

  saveButton: {
    padding: "9px 16px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 5,
    cursor: "pointer",
  },

  associationList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: 12,
  },

  associationCard: {
    border: "1px solid #e5e7eb",
    padding: 14,
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    gap: 9,
  },

  associationDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 12,
    color: "#555",
  },
};
