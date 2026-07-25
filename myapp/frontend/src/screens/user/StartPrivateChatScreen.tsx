import React, { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";

const StartPrivateChatScreen = () => {
  const navigation = useNavigation<any>();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/private-chat/start", {
        username: username.toLowerCase().trim(),
      });

      navigation.navigate("PrivateChat", {
        chatId: res.data.chatId,
      });

    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "User not found"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start Private Chat</Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.prefix}>@</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          autoCapitalize="none"
          style={styles.input}
        />
      </View>

      <Text style={styles.note}>
        Only women registered in the app can be contacted.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleStartChat}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Start Chat</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default StartPrivateChatScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fafafa",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 14,
  },
  prefix: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ff5a5f",
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  note: {
    marginTop: 10,
    fontSize: 13,
    color: "#777",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#ff5a5f",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
