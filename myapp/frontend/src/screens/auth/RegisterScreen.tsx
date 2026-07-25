import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import API from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const RegisterScreen = ({ navigation }: any) => {
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [womenCategory, setWomenCategory] = useState("teen");

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !username || !womenCategory) {
      return Alert.alert("Error", "All fields required");
    }

    if (password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    try {
      const res = await API.post("/auth/register/user", {
        name,
        email,
        phone,
        password,
        username,
        womenCategory,
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
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Name"
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
        placeholder="Username (lowercase only)"
        value={username}
        onChangeText={(text) => setUsername(text.toLowerCase())}
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {/* Simple women category selector */}
      <Text style={styles.label}>Select Life Stage</Text>

      <View style={styles.categoryContainer}>
        {["teen", "married", "pregnant", "post_pregnancy"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.categoryButton,
              womenCategory === item && styles.categorySelected,
            ]}
            onPress={() => setWomenCategory(item)}
          >
            <Text
              style={
                womenCategory === item
                  ? styles.categoryTextSelected
                  : styles.categoryText
              }
            >
              {item.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 20 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },

  label: {
    marginBottom: 8,
    fontWeight: "600",
  },

  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },

  categoryButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },

  categorySelected: {
    backgroundColor: "#ff5a5f",
    borderColor: "#ff5a5f",
  },

  categoryText: {
    color: "#333",
  },

  categoryTextSelected: {
    color: "#fff",
  },

  button: {
    backgroundColor: "#ff5a5f",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: { color: "#fff", fontWeight: "600" },

  link: { marginTop: 15, textAlign: "center", color: "#007AFF" },
});
