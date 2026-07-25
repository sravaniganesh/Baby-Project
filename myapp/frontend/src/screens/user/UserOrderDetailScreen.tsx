import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../config/api";



/* ---------------- TYPES ---------------- */

type OrderItem = {
  orderItemId: string;
  productId: string;
  title: string;
  sellerId: string;
  price: number; // selling price
  quantity: number;
  status: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  taxAmount?: number;
  totalAmount?: number;
  createdAt: string;
};

type RouteParams = {
  order: OrderItem;
};

/* ---------------- ORDER FLOW ---------------- */

const STATUS_FLOW = ["PLACED", "ACCEPTED", "SHIPPED", "DELIVERED"];

const UserOrderDetailScreen = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();
  const navigation = useNavigation<any>();
  const { order } = route.params;

  /* ---------------- STATUS ---------------- */

  const currentIndex = STATUS_FLOW.indexOf(order.status);

  const getLabel = (s: string) => {
    switch (s) {
      case "PLACED":
        return "Placed";
      case "ACCEPTED":
        return "Accepted";
      case "SHIPPED":
        return "Shipped";
      case "DELIVERED":
        return "Delivered";
      default:
        return s;
    }
  };

  /* ---------------- PRICE (CORRECT – NO AUTO DISCOUNT) ---------------- */

  const mrpTotal = order.price * order.quantity;
  const finalPaid = order.totalAmount ?? mrpTotal;
  const totalSavings = mrpTotal - finalPaid;

  /* ---------------- ACTIONS ---------------- */

  const downloadInvoice = () => {
    const url = `/invoice/${order.orderItemId}`;
    Linking.openURL(url);
  };

  const emailInvoice = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await API.post(
  `/invoice/${order.orderItemId}/email`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", "Invoice sent to your email");
    } catch {
      Alert.alert("Error", "Failed to send invoice");
    }
  };

  const handleReorder = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await API.post(
  `/shop/cart/add`,
        { productId: order.productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Added to Cart");
      navigation.navigate("Shop", { screen: "Cart" });
    } catch {
      Alert.alert("Error", "Reorder failed");
    }
  };

  const handleReview = () => {
    navigation.navigate("AddReview", {
      productId: order.productId,
      orderItemId: order.orderItemId,
    });
  };

  const canCancel =
    order.status === "PLACED" || order.status === "ACCEPTED";
  const isDelivered = order.status === "DELIVERED";

  /* ---------------- UI ---------------- */

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Order Details</Text>

      {/* ORDER TIMELINE */}
      <View style={styles.timeline}>
        {STATUS_FLOW.map((s, i) => {
          const active = i <= currentIndex;
          return (
            <View key={s} style={styles.timelineItem}>
              <View
                style={[
                  styles.circle,
                  active && styles.circleActive,
                ]}
              >
                {active && <Text style={styles.check}>✓</Text>}
              </View>
              <Text
                style={[
                  styles.timelineLabel,
                  active && styles.timelineLabelActive,
                ]}
              >
                {getLabel(s)}
              </Text>
              {i < STATUS_FLOW.length - 1 && (
                <View
                  style={[
                    styles.line,
                    active && styles.lineActive,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* PRODUCT INFO */}
      <View style={styles.card}>
        <Text style={styles.label}>Product</Text>
        <Text style={styles.value}>{order.title}</Text>

        <Text style={styles.label}>Quantity</Text>
        <Text style={styles.value}>{order.quantity}</Text>

        <Text style={styles.label}>Ordered On</Text>
        <Text style={styles.value}>
          {new Date(order.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* PRICE SUMMARY */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Price Summary</Text>

        <View style={styles.row}>
          <Text>Total MRP</Text>
          <Text>₹ {mrpTotal}</Text>
        </View>

        <View style={styles.row}>
          <Text>Your Price</Text>
          <Text>₹ {finalPaid}</Text>
        </View>

        {totalSavings > 0 && (
          <View style={styles.row}>
            <Text style={styles.saveText}>You Save</Text>
            <Text style={styles.saveText}>₹ {totalSavings}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.total}>Paid Amount</Text>
          <Text style={styles.total}>₹ {finalPaid}</Text>
        </View>
      </View>

      {/* INVOICE */}
      {isDelivered && (
        <>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.darkBtn}
              onPress={downloadInvoice}
            >
              <Text style={styles.btnText}>Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.darkBtn}
              onPress={emailInvoice}
            >
              <Text style={styles.btnText}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* RATE & REVIEW */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rate this product</Text>
            <View style={{ flexDirection: "row", marginVertical: 8 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Text key={i} style={{ fontSize: 22 }}>⭐</Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={handleReview}
            >
              <Text style={styles.reviewText}>Write a Review</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ACTIONS */}
      <TouchableOpacity style={styles.reorderBtn} onPress={handleReorder}>
        <Text style={styles.reorderText}>Buy Again</Text>
      </TouchableOpacity>

      {canCancel && (
        <TouchableOpacity style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default UserOrderDetailScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F9FAFB" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },

  timeline: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  timelineItem: { flex: 1, alignItems: "center" },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: { backgroundColor: "#16A34A" },
  check: { color: "#fff", fontWeight: "bold" },
  timelineLabel: { fontSize: 11, color: "#9CA3AF", marginTop: 6 },
  timelineLabelActive: { color: "#16A34A", fontWeight: "bold" },
  line: {
    position: "absolute",
    top: 13,
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: "#E5E7EB",
  },
  lineActive: { backgroundColor: "#16A34A" },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  label: { fontSize: 13, color: "#6B7280", marginTop: 10 },
  value: { fontSize: 15 },

  summaryBox: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  summaryTitle: { fontWeight: "bold", marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  saveText: { color: "#16A34A", fontWeight: "bold" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 8 },
  total: { fontWeight: "bold", fontSize: 16 },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  darkBtn: {
    flex: 1,
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },
  btnText: { color: "#fff", fontWeight: "bold" },

  reviewBtn: {
    backgroundColor: "#FDE68A",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  reviewText: { fontWeight: "bold", color: "#92400E" },

  reorderBtn: {
    backgroundColor: "#0A7AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  reorderText: { color: "#fff", fontWeight: "bold" },

  cancelBtn: {
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: { color: "#fff", fontWeight: "bold" },

  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
});
