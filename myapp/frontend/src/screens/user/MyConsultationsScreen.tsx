import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import API from "../../config/api";
import { useNavigation } from "@react-navigation/native";

interface Consultation {
  _id: string;
  doctorId: {
    name: string;
    specialization: string;
  };
  consultationType: "video" | "hospital";
  scheduledAt?: string;
  slotTime?: string;
  status: string;
  chatId?: string;
}

const MyConsultationsScreen = () => {
  const navigation = useNavigation<any>();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await API.get("/consultations/my");
      setConsultations(res.data || []);
    } catch (err) {
      console.log("Consultations fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= STATUS COLOR ================= */

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "#22C55E";
      case "REQUESTED":
        return "#F59E0B";
      case "REJECTED":
        return "#EF4444";
      case "COMPLETED":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  /* ================= START CONSULT ================= */

  const handleStartConsultation = (item: Consultation) => {
    if (item.consultationType === "video") {
      if (!item.chatId) {
        Alert.alert("Video session not ready");
        return;
      }

      navigation.navigate("DoctorChat", {
        chatId: item.chatId,
        doctorName: item.doctorId.name,
      });
    } else {
      Alert.alert("Visit hospital at scheduled time");
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0A7AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={consultations}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <Text style={styles.empty}>No consultations yet</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* DOCTOR */}
            <Text style={styles.name}>
              Dr. {item.doctorId?.name}
            </Text>

            <Text style={styles.sub}>
              {item.doctorId?.specialization}
            </Text>

            {/* TYPE */}
            <Text style={styles.type}>
              {item.consultationType === "video"
                ? "📞 Video Consultation"
                : "🏥 Hospital Visit"}
            </Text>

            {/* TIME */}
            {item.consultationType === "hospital" && (
              <Text style={styles.time}>
                Time: {item.slotTime}
              </Text>
            )}

            {item.consultationType === "video" && (
              <Text style={styles.time}>
                Instant Consultation
              </Text>
            )}

            {/* STATUS */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {item.status}
              </Text>
            </View>

            {/* ACTION */}
            {item.status === "CONFIRMED" && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleStartConsultation(item)}
              >
                <Text style={styles.actionText}>
                  Start Consultation
                </Text>
              </TouchableOpacity>
            )}

            {item.status === "COMPLETED" && (
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={() =>
                  Alert.alert("Rating coming soon ⭐")
                }
              >
                <Text style={styles.rateText}>
                  Rate Doctor ⭐
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
};

export default MyConsultationsScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
    backgroundColor: "#F9FAFB",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#6B7280",
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 3,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  sub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  type: {
    marginTop: 6,
    fontWeight: "600",
  },

  time: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },

  statusBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },

  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  actionBtn: {
    marginTop: 12,
    backgroundColor: "#0A7AFF",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  actionText: {
    color: "#fff",
    fontWeight: "600",
  },

  rateBtn: {
    marginTop: 12,
    backgroundColor: "#F59E0B",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  rateText: {
    color: "#000",
    fontWeight: "700",
  },
});