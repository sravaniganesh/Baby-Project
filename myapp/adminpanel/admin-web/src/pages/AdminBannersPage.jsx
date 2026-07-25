import { useEffect, useState } from "react";
import API from "../config/api";



export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  /* ================= FETCH BANNERS ================= */
  const fetchBanners = async () => {
    try {
  const res = await API.get("/banners/public");
  setBanners(res.data || []);
} catch {
  alert("Failed to load banners");
} finally {
  setLoading(false);

    }
  };

  /* ================= UPLOAD BANNER ================= */
  const uploadBanner = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      const token = localStorage.getItem("adminToken");

      const formData = new FormData();
      formData.append("image", file);

      await API.post("/admin/banners", formData, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "multipart/form-data",
  },
});

      alert("Banner uploaded");
      fetchBanners();
    } catch {
      alert("Banner upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ================= TOGGLE ================= */
  const toggleBanner = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");

      await API.patch(
  `/admin/banners/${id}/toggle`,
  {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchBanners();
    } catch {
      alert("Failed to update banner");
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Banner Management</h1>
      <p style={styles.subText}>
        Upload & manage banners shown on Shop Home
      </p>

      {/* UPLOAD */}
      <div style={styles.uploadBox}>
        <label style={styles.uploadLabel}>
          {uploading ? "Uploading..." : "Upload New Banner"}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => uploadBanner(e.target.files[0])}
          />
        </label>
      </div>

      {/* LIST */}
      {loading ? (
        <p>Loading banners…</p>
      ) : banners.length === 0 ? (
        <div style={styles.empty}>No banners uploaded</div>
      ) : (
        <div style={styles.grid}>
          {banners.map((b) => (
            <div key={b._id} style={styles.card}>
              <img
                src={b.imageUrl}
                alt="banner"
                style={styles.image}
              />

              <div style={styles.cardFooter}>
                <span
                  style={{
                    ...styles.status,
                    background: b.isActive
                      ? "#dcfce7"
                      : "#fee2e2",
                    color: b.isActive
                      ? "#166534"
                      : "#991b1b",
                  }}
                >
                  {b.isActive ? "ACTIVE" : "INACTIVE"}
                </span>

                <button
                  style={styles.toggleBtn}
                  onClick={() => toggleBanner(b._id)}
                >
                  {b.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    padding: 32,
    background: "#f9fafb",
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
  },
  heading: {
    fontSize: 26,
    fontWeight: 700,
  },
  subText: {
    color: "#6b7280",
    marginBottom: 24,
  },
  uploadBox: {
    marginBottom: 24,
  },
  uploadLabel: {
    background: "#0A7AFF",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    display: "inline-block",
  },
  empty: {
    background: "#fff",
    padding: 40,
    borderRadius: 12,
    textAlign: "center",
    color: "#6b7280",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
  },
  image: {
    width: "100%",
    height: 140,
    objectFit: "cover",
  },
  cardFooter: {
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  status: {
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  toggleBtn: {
    background: "#111827",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
};
