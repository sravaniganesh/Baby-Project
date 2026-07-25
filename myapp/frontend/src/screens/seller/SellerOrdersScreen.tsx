import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "../../context/AuthContext";

/* ================= STATUS COLOR ================= */
const getStatusColor = (status: string) => {
  switch (status) {
    case "PLACED":
      return "#FACC15"; // yellow
    case "ACCEPTED":
      return "#3B82F6"; // blue
    case "SHIPPED":
      return "#22C55E"; // green
    case "DELIVERED":
      return "#16A34A"; // dark green
    default:
      return "#9CA3AF";
  }
};
const formatDate = (date: string) => {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


const SellerOrdersScreen = () => {
  const { logout } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ORDERS ================= */
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await API.get('/seller/orders', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

      setOrders(res.data || []);
    } catch (err) {
      console.error("Load seller orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (
    orderItemId: string,
    action: "accept" | "ship" | "deliver"
  ) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await API.patch(
  `/seller/orders/${orderItemId}/${action}`,
  {},

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Success", `Order ${action}ed successfully`);
      loadOrders(); // 🔄 refresh list
    } catch (err) {
      console.error("Update order error:", err);
      Alert.alert("Error", "Action failed");
    }
  };

  /* ================= RENDER ITEM ================= */
  const renderItem = ({ item }: any) => (
   <View style={styles.card}>
  <Text style={styles.title}>{item.title}</Text>

  <Text style={styles.date}>
    Ordered on: {formatDate(item.createdAt)}
  </Text>

  <Text style={styles.price}>₹ {item.price * item.quantity}</Text>



      {/* STATUS BADGE */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      >
        <Text style={styles.statusText}>{item.status}</Text>
      </View>

      {/* ACTION BUTTONS */}
      {item.status === "PLACED" && (
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() =>
            updateStatus(item.orderItemId, "accept")
          }
        >
          <Text style={styles.btnText}>Accept</Text>
        </TouchableOpacity>
      )}

      {item.status === "ACCEPTED" && (
        <TouchableOpacity
          style={styles.shipBtn}
          onPress={() =>
            updateStatus(item.orderItemId, "ship")
          }
        >
          <Text style={styles.btnText}>Mark Shipped</Text>
        </TouchableOpacity>
      )}

      {item.status === "SHIPPED" && (
        <TouchableOpacity
          style={styles.deliverBtn}
          onPress={() =>
            updateStatus(item.orderItemId, "deliver")
          }
        >
          <Text style={styles.btnText}>Mark Delivered</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      {/* LOGOUT */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={logout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.orderItemId}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No orders yet</Text>
        }
      />
    </View>
  );
};

export default SellerOrdersScreen;

/* ================= STYLES ================= */
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
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginVertical: 6,
  },
  statusText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },

  acceptBtn: {
    marginTop: 8,
    backgroundColor: "#0A7AFF",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  shipBtn: {
    marginTop: 8,
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  deliverBtn: {
    marginTop: 8,
    backgroundColor: "#16A34A",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },

  logoutBtn: {
    alignSelf: "flex-end",
    marginBottom: 10,
    backgroundColor: "#ff3b30",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
  title: {
  fontSize: 16,
  fontWeight: "bold",
  marginBottom: 4,
},
date: {
  fontSize: 12,
  color: "#6B7280",
  marginBottom: 4,
},


});
