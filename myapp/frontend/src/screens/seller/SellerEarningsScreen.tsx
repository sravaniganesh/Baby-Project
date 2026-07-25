import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SellerEarningsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await API.get('/seller/earnings', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

      setTotal(res.data.totalEarnings || 0);
      setItems(res.data.items || []);
    } catch (err) {
      console.error("Load earnings error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.amount}>₹ {item.amount}</Text>
      <Text>Qty: {item.quantity}</Text>
      <Text style={styles.sub}>OrderItem: {item.orderItemId}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalValue}>₹ {total}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.orderItemId}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No shipped items yet</Text>
        }
      />
    </View>
  );
};

export default SellerEarningsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  totalBox: {
    backgroundColor: "#0A7AFF",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  totalLabel: {
    color: "#fff",
    fontSize: 14,
  },
  totalValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sub: {
    fontSize: 12,
    color: "#666",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },
});
