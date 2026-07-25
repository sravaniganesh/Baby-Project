import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import API from "../../config/api";

const UserTransactionsScreen = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await API.get("/payment/my-transactions");
      setTransactions(res.data || []);
    } catch (err) {
      console.log("❌ Transaction error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.type}>
        {(item.type || "UNKNOWN").toUpperCase()}
      </Text>

      <Text>Amount: ₹{item.amount}</Text>
      <Text>Method: {item.method}</Text>
      <Text>Status: {item.status}</Text>

      <Text style={styles.date}>
        {item.createdAt
          ? new Date(item.createdAt).toLocaleString()
          : "N/A"}
      </Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Transactions</Text>

      {transactions.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          No transactions found
        </Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item: any) => item._id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

export default UserTransactionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },

  card: {
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    marginBottom: 10,
  },

  type: {
    fontWeight: "700",
    marginBottom: 5,
  },

  date: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },
});