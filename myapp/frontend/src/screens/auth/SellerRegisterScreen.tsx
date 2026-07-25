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

const SellerRegisterScreen = ({ navigation }: any) => {
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      return Alert.alert("Error", "All fields are required");
    }

    if (password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    try {
      const res = await API.post("/auth/register/seller", {
        name,
        email,
        password,
        phone,
      });

      // 🔥 Auto login
      await login(res.data);

    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Registration failed"
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Seller Registration</Text>

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
        placeholder="Phone"
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

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register as Seller</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SellerLogin")}>
        <Text style={styles.link}>Already registered? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default SellerRegisterScreen;

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
    backgroundColor: "#ff9800",
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
