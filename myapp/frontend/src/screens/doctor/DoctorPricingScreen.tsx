import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import API from "../../config/api";

const DoctorPricingScreen = () => {
  const [chatPrice, setChatPrice] = useState("");
  const [chatDuration, setChatDuration] = useState("");

  const [videoFee, setVideoFee] = useState("");
  const [videoDuration, setVideoDuration] = useState("");

  const [hospitalFee, setHospitalFee] = useState("");
  const [hospitalType, setHospitalType] = useState<"free" | "paid">("paid");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const res = await API.get("/doctor/profile");
      const d = res.data;

      setChatPrice(String(d.chatPrice || ""));
      setChatDuration(String(d.chatDuration || ""));

      setVideoFee(String(d.consultationFee || ""));
      setVideoDuration(String(d.consultationDuration || ""));

      setHospitalFee(String(d.consultationFee || ""));
      setHospitalType(d.hospitalConsultationType || "paid");

    } catch (err) {
      console.log("Pricing load error", err);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      await API.put("/doctor/update-pricing", {
        chatPrice: Number(chatPrice),
        chatDuration: Number(chatDuration),
        consultationFee: Number(videoFee),
        consultationDuration: Number(videoDuration),
        hospitalConsultationType: hospitalType,
      });

      Alert.alert("Success", "Pricing updated successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to update pricing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pricing Settings</Text>

      {/* CHAT */}
      <Text style={styles.section}>Chat Pricing</Text>

      <TextInput
        placeholder="Price (₹)"
        value={chatPrice}
        onChangeText={setChatPrice}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Duration (minutes)"
        value={chatDuration}
        onChangeText={setChatDuration}
        keyboardType="numeric"
        style={styles.input}
      />

      {/* VIDEO */}
      <Text style={styles.section}>Video Consultation</Text>

      <TextInput
        placeholder="Fee (₹)"
        value={videoFee}
        onChangeText={setVideoFee}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Duration (minutes)"
        value={videoDuration}
        onChangeText={setVideoDuration}
        keyboardType="numeric"
        style={styles.input}
      />

      {/* HOSPITAL */}
      <Text style={styles.section}>Hospital Consultation</Text>

      <TextInput
        placeholder="Fee (₹)"
        value={hospitalFee}
        onChangeText={setHospitalFee}
        keyboardType="numeric"
        style={styles.input}
      />

      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            hospitalType === "free" && styles.activeBtn,
          ]}
          onPress={() => setHospitalType("free")}
        >
          <Text style={hospitalType === "free" ? styles.activeText : {}}>
            FREE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeBtn,
            hospitalType === "paid" && styles.activeBtn,
          ]}
          onPress={() => setHospitalType("paid")}
        >
          <Text style={hospitalType === "paid" ? styles.activeText : {}}>
            PAID
          </Text>
        </TouchableOpacity>
      </View>

      {/* SAVE */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveText}>
          {loading ? "Saving..." : "Save Pricing"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default DoctorPricingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },

  section: {
    marginTop: 16,
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },

  row: {
    flexDirection: "row",
    marginTop: 10,
  },

  typeBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: "#eee",
    alignItems: "center",
    marginRight: 6,
    borderRadius: 6,
  },

  activeBtn: {
    backgroundColor: "#10B981",
  },

  activeText: {
    color: "#fff",
    fontWeight: "600",
  },

  saveBtn: {
    marginTop: 24,
    backgroundColor: "#0A7AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
  },
});