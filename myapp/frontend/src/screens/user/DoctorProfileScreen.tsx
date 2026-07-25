import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import API from "../../config/api";

const DoctorProfileScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { doctorId } = route.params;

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DOCTOR ================= */
  const fetchDoctor = async () => {
    try {
      const res = await API.get(`/doctors/${doctorId}`);
      setDoctor(res.data?.doctor || res.data);
    } catch {
      setDoctor(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctor();
  }, []);

  /* ================= CHAT ================= */
  const handleChat = async () => {
    try {
      if (doctor.availability !== "online") {
        Alert.alert("Doctor Offline");
        return;
      }

      const wallet = await API.get("/wallet");

      if ((wallet.data.balance || 0) < (doctor.chatPrice || 0)) {
        Alert.alert("Low Balance");
        navigation.navigate("Profile");
        return;
      }

      const res = await API.post("/chat/start", {
        doctorId: doctor._id,
      });

      if (!res?.data?.chat?._id) return;

      navigation.navigate("DoctorChat", {
        chatId: res.data.chat._id,
        doctorId: doctor._id,
        doctorName: doctor.name,
      });
    } catch {}
  };

  /* ================= VIDEO ================= */
  const handleVideo = () => {
    navigation.navigate("ConsultationRequest", {
      doctorId: doctor._id,
      type: "video",
    });
  };

  /* ================= HOSPITAL ================= */
  const handleHospital = () => {
    navigation.navigate("ConsultationRequest", {
      doctorId: doctor._id,
      type: "hospital",
    });
  };

  /* ================= UI ================= */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.loader}>
        <Text>Doctor not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{doctor.name}</Text>

      <Text style={styles.sub}>
        {doctor.specialization || "General"} • {doctor.experience || 0} yrs
      </Text>

      <Text>⭐ {doctor.rating || 0}</Text>

      {/* ================= PRICING ================= */}
      <View style={styles.pricingBox}>
        <Text style={styles.section}>Consultation Fees</Text>

        <Text>💬 Chat: ₹{doctor.chatPrice || 0}</Text>
        <Text>📹 Video: ₹{doctor.videoPrice || 0}</Text>
        <Text>🏥 Hospital: ₹{doctor.hospitalPrice || 0}</Text>
      </View>

      {/* ================= ACTIONS ================= */}
      <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
        <Text style={styles.btnText}>Start Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.videoBtn} onPress={handleVideo}>
        <Text style={styles.btnText}>Book Video Consultation</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.hospitalBtn} onPress={handleHospital}>
        <Text style={styles.btnText}>Book Hospital Visit</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DoctorProfileScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sub: {
    color: "#555",
    marginVertical: 4,
  },
  pricingBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  section: {
    fontWeight: "bold",
    marginBottom: 6,
  },
  chatBtn: {
    backgroundColor: "#8B5CF6",
    padding: 12,
    marginTop: 20,
    borderRadius: 8,
  },
  videoBtn: {
    backgroundColor: "#2563EB",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
  },
  hospitalBtn: {
    backgroundColor: "#059669",
    padding: 12,
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