import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import API from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const DoctorRegisterScreen = ({ navigation }: any) => {
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [hospital, setHospital] = useState("");

  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const handleRegister = async () => {
    if (
      !name ||
      !email ||
      !password ||
      !specialization ||
      !experience ||
      !hospital ||
      !city.trim()
    ) {
      return Alert.alert("Error", "Please fill all required fields including city");
    }

    if (password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    try {
      // 🔥 DEBUG LOG (VERY IMPORTANT)
      console.log("REGISTER PAYLOAD:", {
        name,
        email,
        city,
        state,
      });

      const res = await API.post("/auth/register/doctor", {
        name,
        email,
        password,
        specialization,
        experience: Number(experience),
        hospital,
        phone,
        city: city.trim(),     // ✅ FORCE CLEAN VALUE
        state: state.trim(),   // ✅ FORCE CLEAN VALUE
      });

      await login(res.data);

    } catch (err: any) {
      console.log("REGISTER ERROR:", err?.response?.data);

      Alert.alert(
        "Error",
        err?.response?.data?.message || "Registration failed"
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Doctor Registration</Text>

      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Phone (optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TextInput
        placeholder="Specialization (e.g. Gynecologist)"
        value={specialization}
        onChangeText={setSpecialization}
        style={styles.input}
      />

      <TextInput
        placeholder="Experience (years)"
        value={experience}
        onChangeText={setExperience}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Hospital / Clinic Name"
        value={hospital}
        onChangeText={setHospital}
        style={styles.input}
      />

      {/* CITY */}
      <TextInput
        placeholder="City (Required)"
        value={city}
        onChangeText={(text) => setCity(text)}
        style={styles.input}
      />

      {/* STATE */}
      <TextInput
        placeholder="State (Optional)"
        value={state}
        onChangeText={(text) => setState(text)}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register as Doctor</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("DoctorLogin")}>
        <Text style={styles.link}>Already registered? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default DoctorRegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  link: {
    marginTop: 15,
    textAlign: "center",
    color: "#007AFF",
  },
});