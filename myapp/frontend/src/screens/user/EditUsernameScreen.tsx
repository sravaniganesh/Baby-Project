import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import API from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const EditUsernameScreen = ({ navigation }: any) => {
  const { user, login, token, role } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  /* ===============================
     CHECK AVAILABILITY
  =============================== */

  useEffect(() => {
    if (username.length < 3) {
      setAvailable(null);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setChecking(true);

        const res = await API.get("/user/username-check", {
          params: { username },
        });

        setAvailable(res.data.available);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 600);

    return () => clearTimeout(delay);
  }, [username]);

  /* ===============================
     SAVE USERNAME
  =============================== */

  const handleSave = async () => {
    if (!available) return;

    try {
      setLoading(true);

      const res = await API.put("/user/username", {
        username: username.trim(),
      });

      login({
        token: token!,
        role,
        user: { ...user, username: res.data.username },
      });

      Alert.alert("Success", "Username updated successfully");
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Update failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    username.length >= 3 &&
    /^[a-z0-9_]+$/.test(username) &&
    available === true;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your username</Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.prefix}>@</Text>

        <TextInput
          style={styles.input}
          value={username}
          onChangeText={(text) =>
            setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""))
          }
          autoCapitalize="none"
          placeholder="username"
        />

        {checking && (
          <ActivityIndicator size="small" color="#999" />
        )}
      </View>

      {username.length < 3 && username.length > 0 && (
        <Text style={styles.error}>
          Minimum 3 characters required
        </Text>
      )}

      {available === false && (
        <Text style={styles.error}>
          Username already taken
        </Text>
      )}

      {available === true && (
        <Text style={styles.success}>
          Username available ✓
        </Text>
      )}

      <Text style={styles.note}>
        You can change your username once every 30 days.
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          !isValid && styles.buttonDisabled,
        ]}
        onPress={handleSave}
        disabled={!isValid || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Save Changes
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default EditUsernameScreen;

/* =============================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f6f7fb",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },

  prefix: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 6,
    color: "#888",
  },

  input: {
    flex: 1,
    fontSize: 16,
  },

  error: {
    marginTop: 10,
    color: "#ff3b30",
    fontSize: 13,
  },

  success: {
    marginTop: 10,
    color: "#34c759",
    fontSize: 13,
  },

  note: {
    marginTop: 14,
    fontSize: 13,
    color: "#888",
  },

  button: {
    marginTop: 30,
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },

  buttonDisabled: {
    backgroundColor: "#ccc",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
