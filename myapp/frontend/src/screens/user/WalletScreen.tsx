import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import API from "../../config/api";

const WalletScreen = () => {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");

  /* ================= GET WALLET ================= */
  const fetchWallet = async () => {
    try {
      const res = await API.get("/wallet");
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.log("Wallet fetch error", err);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  /* ================= ADD MONEY ================= */
  const handleAddMoney = async () => {
    const value = Number(amount);

    if (!value || value <= 0) {
      Alert.alert("Enter valid amount");
      return;
    }

    try {
      const res = await API.post("/wallet/add", {
        amount: value,
      });

      setBalance(res.data.balance);
      setAmount("");

      Alert.alert("Success", "Money added to wallet");
    } catch (err) {
      Alert.alert("Error", "Failed to add money");
    }
  };

  return (
    <View style={styles.container}>
      {/* BALANCE */}
      <Text style={styles.title}>Wallet Balance</Text>
      <Text style={styles.balance}>₹ {balance}</Text>

      {/* INPUT */}
      <TextInput
        placeholder="Enter amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
      />

      {/* ADD BUTTON */}
      <TouchableOpacity style={styles.button} onPress={handleAddMoney}>
        <Text style={styles.buttonText}>Add Money</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WalletScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "600",
  },
  balance: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#8B5CF6",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});