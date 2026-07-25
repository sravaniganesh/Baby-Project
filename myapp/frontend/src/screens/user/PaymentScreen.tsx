import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PaymentScreen = ({ route, navigation }: any) => {
  const {
    type = "chat",
    doctorId,
    doctorName,
    amount = 0,
    duration,
    chatId,
    isExtend = false,
  } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

 useEffect(() => {
  fetchWallet();
}, []);

const fetchWallet = async () => {
  try {
    const res = await API.get("/wallet");
    setWalletBalance(res.data.balance || 0);
  } catch (err) {
    console.log("Wallet fetch error", err);
  }
};

  /* ===============================
     💳 PAYMENT (ONLINE)
  =============================== */
  const handlePayment = async () => {
    if (loading) return;

    if (!doctorId || !amount) {
      Alert.alert("Error", "Invalid payment data");
      return;
    }

    try {
      setLoading(true);

      // ✅ CREATE PAYMENT
      const paymentRes = await API.post("/payment/create", {
  type,
  doctor: doctorId,        // ✅ REQUIRED
  referenceId: doctorId,   // ✅ CRITICAL FIX
  amount,
  chatId,
  isExtend,
  method: "online",
});

     if (paymentRes?.data?.status !== "success") {
  console.log("❌ Payment Response:", paymentRes.data);
  Alert.alert("Payment Failed", paymentRes?.data?.message || "Try again");
  return;
}


      // ✅ START CHAT (ONLY AFTER PAYMENT)
      const chatRes = await API.post("/chat/start", {
        doctorId,
      });

      if (!chatRes?.data?.chat?._id) {
        Alert.alert("Error", "Chat not created");
        return;
      }

      Alert.alert(
        "Request Sent",
        "Waiting for doctor to accept your request"
      );

      navigation.goBack();

// small delay ensures DoctorsScreen mounted
setTimeout(() => {
  navigation.navigate("Doctor");
}, 100);
    } catch (err: any) {
      console.log(err?.response?.data);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Payment failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     💰 WALLET PAYMENT
  =============================== */
  const handleWalletPayment = async () => {
    if ((walletBalance || 0) < amount) {
      Alert.alert("Insufficient Balance");
      return;
    }

    try {
      setLoading(true);

      // ✅ CREATE PAYMENT (wallet)
    const paymentRes = await API.post("/payment/create", {
  type,
  doctor: doctorId,        // ✅ REQUIRED
  referenceId: doctorId,   // ✅ CRITICAL FIX
  amount,
  method: "wallet",
  chatId,
  isExtend,
});

    if (paymentRes?.data?.status !== "success") {
  console.log("❌ Payment Response:", paymentRes.data);
  Alert.alert("Payment Failed", paymentRes?.data?.message || "Try again");
  return;
}

      // ✅ START CHAT
      const chatRes = await API.post("/chat/start", {
        doctorId,
      });

      if (!chatRes?.data?.chat?._id) {
        Alert.alert("Error", "Chat not created");
        return;
      }

      Alert.alert(
        "Request Sent",
        "Waiting for doctor to accept your request"
      );

      navigation.goBack();
    } catch (err: any) {
      console.log(err?.response?.data);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Wallet payment failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     ➕ ADD MONEY
  =============================== */
  const handleAddMoney = async () => {
    try {
      setLoading(true);

      const res = await API.post("/payment/create", {
        type: "wallet",
        amount: 100,
      });

      if (res.data.walletBalance !== undefined) {
        setWalletBalance(res.data.walletBalance);
        await fetchWallet(); // ensure latest balance
      }

      Alert.alert("Success", "₹100 added");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to add money"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Payment</Text>

      <Text style={styles.info}>Doctor: {doctorName}</Text>
      <Text style={styles.detail}>
        Chat Duration: {duration || 5} minutes
      </Text>

      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>Amount</Text>
        <Text style={styles.amount}>₹{amount}</Text>
      </View>

      <Text style={{ marginTop: 10 }}>
        Wallet Balance: ₹{walletBalance}
      </Text>

      <TouchableOpacity
        style={styles.payBtn}
        onPress={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payText}>Pay & Continue</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.walletBtn}
        onPress={handleWalletPayment}
      >
        <Text style={styles.walletText}>
          Use Wallet & Continue
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addMoneyBtn}
        onPress={handleAddMoney}
      >
        <Text style={styles.addMoneyText}>
          Add ₹100 to Wallet
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PaymentScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },

  info: {
    fontSize: 16,
  },

  detail: {
    fontSize: 14,
    marginBottom: 20,
    color: "#6B7280",
  },

  amountBox: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  amountLabel: {
    fontSize: 14,
    color: "#6B7280",
  },

  amount: {
    fontSize: 28,
    fontWeight: "700",
  },

  payBtn: {
    marginTop: 30,
    backgroundColor: "#0A7AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  payText: {
    color: "#fff",
    fontWeight: "700",
  },

  walletBtn: {
    marginTop: 12,
    backgroundColor: "#8B5CF6",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  walletText: {
    color: "#fff",
    fontWeight: "700",
  },

  addMoneyBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#EC4899",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  addMoneyText: {
    color: "#EC4899",
    fontWeight: "600",
  },
});