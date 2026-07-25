import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import API from "../../config/api";

const DoctorProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    specialization: "",
    experience: "",
    hospital: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await API.get("/doctor/profile");
      setProfile({
        name: res.data.name || "",
        specialization: res.data.specialization || "",
        experience: String(res.data.experience || ""),
        hospital: res.data.hospital || "",
      });
    } catch (err) {
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);

      await API.put("/doctor/profile", {
        ...profile,
        experience: Number(profile.experience),
      });

      Alert.alert("Success", "Profile updated");
    } catch (err) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={profile.name}
        onChangeText={(v) => setProfile({ ...profile, name: v })}
      />

      <TextInput
        style={styles.input}
        placeholder="Specialization"
        value={profile.specialization}
        onChangeText={(v) => setProfile({ ...profile, specialization: v })}
      />

      <TextInput
        style={styles.input}
        placeholder="Experience (years)"
        keyboardType="numeric"
        value={profile.experience}
        onChangeText={(v) => setProfile({ ...profile, experience: v })}
      />

      <TextInput
        style={styles.input}
        placeholder="Hospital"
        value={profile.hospital}
        onChangeText={(v) => setProfile({ ...profile, hospital: v })}
      />

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={saveProfile}
        disabled={saving}
      >
        <Text style={styles.saveText}>
          {saving ? "Saving..." : "Save Profile"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default DoctorProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: { color: "#fff", fontWeight: "600" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
