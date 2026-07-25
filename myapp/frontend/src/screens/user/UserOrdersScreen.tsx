import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";



const UserOrdersScreen = () => {
  const navigation = useNavigation<any>();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] =
    useState<"ALL" | "ACTIVE" | "CANCELLED">("ALL");

  /* ================= STATUS HELPERS ================= */

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PLACED":
        return styles.statusPlaced;
      case "SHIPPED":
        return styles.statusShipped;
      case "CANCELLED":
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PLACED":
        return "Order Placed";
      case "SHIPPED":
        return "Shipped";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatOrderTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* ================= API ================= */

  const loadOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await API.get('/orders/my', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(res.data || []);
    } catch (err) {
      console.error("Load user orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders();
    }, [])
  );

  const filteredOrders = orders.filter((item) => {
    if (filter === "CANCELLED") return item.status === "CANCELLED";
    if (filter === "ACTIVE") return item.status !== "CANCELLED";
    return true;
  });

  /* ================= INVOICE ACTIONS ================= */

  const downloadInvoice = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await API.get(
  `/invoice/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Invoice", "Invoice opened in browser");
    } catch {
      Alert.alert("Error", "Failed to download invoice");
    }
  };

  const emailInvoice = async (orderId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await API.post(
  `/invoice/${orderId}/email`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Invoice sent to your email");
    } catch {
      Alert.alert("Error", "Failed to email invoice");
    }
  };

  /* ================= RENDER ITEM ================= */

  const renderItem = ({ item }: any) => {
    const isCancelled = item.status === "CANCELLED";

    // ✅ FINAL PRICE — NO AUTO DISCOUNT
    const totalPrice =
      item.totalAmount ?? item.price * item.quantity;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isCancelled && styles.cancelledCard,
        ]}
        onPress={() =>
          navigation.navigate("UserOrderDetail", {
            order: item,
          })
        }
        activeOpacity={0.88}
      >
        {/* PRICE + STATUS */}
        <View style={styles.rowBetween}>
          <Text style={styles.price}>₹ {totalPrice}</Text>

          <View
            style={[
              styles.statusBadge,
              getStatusStyle(item.status),
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.qtyText}>
          Qty: {item.quantity}
        </Text>

        <Text style={styles.offerInfo}>
          Best price applied (offers if any)
        </Text>

        <View style={styles.divider} />

        <Text style={styles.date}>
          Ordered on {formatOrderDate(item.createdAt)} •{" "}
          {formatOrderTime(item.createdAt)}
        </Text>

        {/* 🌸 INVOICE ACTIONS */}
        {item.status === "DELIVERED" && (
          <View style={styles.invoiceRow}>
            <TouchableOpacity
              style={styles.invoiceBtn}
              onPress={() => downloadInvoice(item.orderItemId)}
            >
              <Icon name="download-outline" size={16} />
              <Text style={styles.invoiceText}>Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.invoiceBtn}
              onPress={() => emailInvoice(item.orderItemId)}
            >
              <Icon name="mail-outline" size={16} />
              <Text style={styles.invoiceText}>Email</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.tapHint}>
          Tap to view order details →
        </Text>
      </TouchableOpacity>
    );
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* FILTERS */}
      <View style={styles.filterRow}>
        {["ALL", "ACTIVE", "CANCELLED"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              filter === f && styles.activeFilter,
            ]}
            onPress={() => setFilter(f as any)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f &&
                  styles.activeFilterText,
              ]}
            >
              {f === "ALL"
                ? "All"
                : f === "ACTIVE"
                ? "Active"
                : "Cancelled"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.orderItemId}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>
            You haven’t placed any orders yet 💖
          </Text>
        }
      />
    </View>
  );
};

export default UserOrdersScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#FFF1F2", // 🌸 soft pink
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 4,
  },

  cancelledCard: {
    opacity: 0.55,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },

  qtyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#374151",
  },

  offerInfo: {
    marginTop: 6,
    fontSize: 12,
    color: "#EC4899", // 💖
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },

  date: {
    fontSize: 12,
    color: "#6B7280",
  },

  tapHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#9CA3AF",
  },

  invoiceRow: {
    flexDirection: "row",
    marginTop: 12,
  },

  invoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FCE7F3",
  },

  invoiceText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#9D174D",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },

  statusPlaced: {
    backgroundColor: "#EC4899",
  },

  statusShipped: {
    backgroundColor: "#F59E0B",
  },

  statusCancelled: {
    backgroundColor: "#EF4444",
  },

  statusDefault: {
    backgroundColor: "#9CA3AF",
  },

  filterRow: {
    flexDirection: "row",
    marginBottom: 12,
  },

  filterBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FCE7F3",
    alignItems: "center",
  },

  activeFilter: {
    backgroundColor: "#EC4899",
  },

  filterText: {
    fontWeight: "bold",
    color: "#9D174D",
  },

  activeFilterText: {
    color: "#fff",
  },

  empty: {
    textAlign: "center",
    marginTop: 50,
    color: "#9CA3AF",
    fontSize: 14,
  },
});
