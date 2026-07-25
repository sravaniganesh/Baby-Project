import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import API from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const DoctorHomeScreen = () => {
  const navigation = useNavigation<any>();

  const [doctor, setDoctor] = useState<any>(null);
  const [availability, setAvailability] = useState("offline");
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/doctor/profile");

        const doc = res.data?.doctor || res.data;

        setDoctor(doc);
        setAvailability(doc?.availability || "offline");
      } catch {
        Alert.alert("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ================= UPDATE AVAILABILITY ================= */
  const updateAvailability = async (status: string) => {
    try {
      setAvailability(status);

      await API.put("/doctor/availability", {
        status,
      });
    } catch {
      Alert.alert("Error updating status");
    }
  };

  /* ================= SAFE RENDER ================= */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doctor Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.name}>{doctor?.name || "Doctor"}</Text>
        <Text style={styles.email}>{doctor?.email}</Text>
      </View>

      {/* AVAILABILITY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Availability</Text>

        <View style={styles.row}>
          {["online", "busy", "offline"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusBtn,
                availability === status && styles.activeBtn,
              ]}
              onPress={() => updateAvailability(status)}
            >
              <Text
                style={[
                  styles.statusText,
                  availability === status && { color: "#fff" },
                ]}
              >
                {status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ACTIONS */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate("DoctorConsultations")}
      >
        <Text style={styles.btnText}>Consultations</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate("DoctorPricing")}
      >
        <Text style={styles.btnText}>Manage Pricing</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate("DoctorProfile")}
      >
        <Text style={styles.btnText}>My Profile</Text>
      </TouchableOpacity>

     <TouchableOpacity
  style={styles.logoutBtn}
  onPress={logout}
>
  <Text style={styles.btnText}>Logout</Text>
</TouchableOpacity>
    </View>
  );
};

export default DoctorHomeScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  email: {
    color: "#555",
    marginTop: 4,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
  },
  statusBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#E5E7EB",
    marginRight: 5,
    borderRadius: 6,
  },
  activeBtn: {
    backgroundColor: "#2563EB",
  },
  statusText: {
    textAlign: "center",
    fontWeight: "bold",
  },
  primaryBtn: {
    backgroundColor: "#2563EB",
    padding: 14,
    marginTop: 10,
    borderRadius: 8,
  },
  secondaryBtn: {
    backgroundColor: "#10B981",
    padding: 14,
    marginTop: 10,
    borderRadius: 8,
  },
  logoutBtn: {
    backgroundColor: "#EF4444",
    padding: 14,
    marginTop: 10,
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});