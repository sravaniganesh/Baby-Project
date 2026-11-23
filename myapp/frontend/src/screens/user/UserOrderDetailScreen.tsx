
import React, { useState } from "react";
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

type OrderItem = {
  orderItemId: string;
  productId: string;
  title: string;
  sellerId: string;
  price: number;
  quantity: number;
  status: string;
};

type Order = {
  orderId: string;
  items: OrderItem[];
  paymentStatus?: string;
  paymentMethod?: string;
  paymentReference?: string | null;
  paidAt?: string | null;
  orderTotal?: number;
  itemsSubtotal?: number;
  discountAmount?: number;
  customerDeliveryCharge?: number;
  platformFee?: number;
  createdAt: string;
};

type RouteParams = {
  order: Order;
};

const STATUS_FLOW = ["PLACED", "ACCEPTED", "SHIPPED", "DELIVERED"];

const UserOrderDetailScreen = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();
  const navigation = useNavigation<any>();

  const [order, setOrder] = useState<Order>(route.params.order);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not available";

    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPaymentLabel = () => {
    switch (order.paymentStatus) {
      case "SUCCESS":
        return "Payment Successful";
      case "PENDING":
        return "Payment Pending";
      case "FAILED":
        return "Payment Failed";
      case "CANCELLED":
        return "Payment Cancelled";
      case "REFUNDED":
        return "Refunded";
      default:
        return "Payment Not Available";
    }
  };

  const getPaymentColor = () => {
    switch (order.paymentStatus) {
      case "SUCCESS":
        return "#16A34A";
      case "PENDING":
        return "#D97706";
      case "FAILED":
      case "CANCELLED":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const getLabel = (status: string) => {
    switch (status) {
      case "PLACED":
        return "Placed";
      case "ACCEPTED":
        return "Accepted";
      case "SHIPPED":
        return "Shipped";
      case "DELIVERED":
        return "Delivered";
      default:
        return status;
    }
  };

  const downloadInvoice = async (item: OrderItem) => {
    try {
      const token = await AsyncStorage.getItem("token");

      await API.get(`/invoice/${item.orderItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert("Invoice", "Invoice request completed.");
    } catch (error) {
      Alert.alert("Error", "Failed to download invoice");
    }
  };

  const emailInvoice = async (item: OrderItem) => {
    try {
      const token = await AsyncStorage.getItem("token");

      await API.post(
        `/invoice/${item.orderItemId}/email`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Invoice sent to your email");
    } catch {
      Alert.alert("Error", "Failed to send invoice");
    }
  };

  const handleReorder = async (item: OrderItem) => {
    try {
      const token = await AsyncStorage.getItem("token");

      await API.post(
        "/shop/cart/add",
        { productId: item.productId, quantity: item.quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", `${item.title} added to cart`, [
        { text: "Continue" },
        {
          text: "View Cart",
          onPress: () => navigation.navigate("Shop", { screen: "Cart" }),
        },
      ]);
    } catch {
      Alert.alert("Error", "Reorder failed");
    }
  };

  const handleReview = (item: OrderItem) => {
    navigation.navigate("AddReview", {
      productId: item.productId,
      orderItemId: item.orderItemId,
    });
  };

  const handleCancel = (item: OrderItem) => {
    Alert.alert(
      "Cancel Product",
      `Are you sure you want to cancel ${item.title}?`,
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Cancel Product",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");

              await API.patch(
                `/orders/${item.orderItemId}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );

              setOrder(previous => ({
                ...previous,
                items: previous.items.map(product =>
                  product.orderItemId === item.orderItemId
                    ? { ...product, status: "CANCELLED" }
                    : product
                ),
              }));

              Alert.alert("Success", "Product cancelled successfully");
            } catch (error: any) {
              Alert.alert(
                "Unable to Cancel",
                error?.response?.data?.message || "Failed to cancel product"
              );
            }
          },
        },
      ]
    );
  };

  const renderTimeline = (status: string) => {
    const currentIndex = STATUS_FLOW.indexOf(status);

    if (status === "CANCELLED" || status === "PENDING_PAYMENT") {
      return (
        <Text
          style={[
            styles.specialStatus,
            status === "CANCELLED" && styles.cancelledText,
            status === "PENDING_PAYMENT" && styles.pendingText,
          ]}
        >
          {status === "CANCELLED" ? "Product Cancelled" : "Awaiting Payment"}
        </Text>
      );
    }

    return (
      <View style={styles.timeline}>
        {STATUS_FLOW.map((step, index) => {
          const active = currentIndex >= index;

          return (
            <View key={step} style={styles.timelineItem}>
              <View style={[styles.circle, active && styles.circleActive]}>
                {active && <Text style={styles.check}>✓</Text>}
              </View>

              <Text
                style={[
                  styles.timelineLabel,
                  active && styles.timelineLabelActive,
                ]}
              >
                {getLabel(step)}
              </Text>

              {index < STATUS_FLOW.length - 1 && (
                <View
                  style={[
                    styles.line,
                    index < currentIndex && styles.lineActive,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const totalQuantity = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const isPaid = order.paymentStatus === "SUCCESS";

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Order Details</Text>

      <View style={styles.card}>
        <Text style={styles.orderNumber}>
          Order #{order.orderId.slice(-8).toUpperCase()}
        </Text>

        <Text style={styles.mutedText}>
          Ordered on {formatDate(order.createdAt)}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Payment Information</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Payment status</Text>
          <Text style={[styles.paymentValue, { color: getPaymentColor() }]}>
            {getPaymentLabel()}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Payment method</Text>
          <Text style={styles.value}>
            {order.paymentMethod || "Not available"}
          </Text>
        </View>

        {order.paymentReference ? (
          <View style={styles.referenceContainer}>
            <Text style={styles.label}>Payment reference</Text>
            <Text style={styles.reference}>
              {order.paymentReference}
            </Text>
          </View>
        ) : null}

        {isPaid && order.paidAt ? (
          <View style={styles.row}>
            <Text style={styles.label}>Paid on</Text>
            <Text style={styles.value}>{formatDate(order.paidAt)}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionHeading}>
        Products in this order ({order.items.length})
      </Text>

      {order.items.map(item => {
        const canCancel =
          isPaid &&
          (item.status === "PLACED" || item.status === "ACCEPTED");

        const isDelivered = item.status === "DELIVERED";

        return (
          <View key={item.orderItemId} style={styles.productCard}>
            <Text style={styles.productTitle}>{item.title}</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Quantity</Text>
              <Text style={styles.value}>{item.quantity}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Unit price</Text>
              <Text style={styles.value}>₹{item.price}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Product total</Text>
              <Text style={styles.productTotal}>
                ₹{item.price * item.quantity}
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Delivery Status</Text>
            {renderTimeline(item.status)}

            {isDelivered && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.darkBtn}
                  onPress={() => downloadInvoice(item)}
                >
                  <Text style={styles.btnText}>Invoice</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.darkBtn}
                  onPress={() => emailInvoice(item)}
                >
                  <Text style={styles.btnText}>Email</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.reorderBtn}
                onPress={() => handleReorder(item)}
              >
                <Text style={styles.reorderText}>Buy Again</Text>
              </TouchableOpacity>

              {canCancel && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancel(item)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            {isDelivered && (
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => handleReview(item)}
              >
                <Text style={styles.reviewText}>Write a Review</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <View style={styles.summaryBox}>
        <Text style={styles.sectionTitle}>Order Price Summary</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Items subtotal</Text>
          <Text style={styles.value}>
            ₹{order.itemsSubtotal ?? order.items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            )}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Delivery charge</Text>
          <Text style={styles.value}>
            ₹{order.customerDeliveryCharge ?? 0}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Platform fee</Text>
          <Text style={styles.value}>₹{order.platformFee ?? 0}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.grandTotalLabel}>
            {isPaid ? "Total Paid" : "Order Total"}
          </Text>
          <Text style={styles.grandTotal}>
            ₹{order.orderTotal ?? 0}
          </Text>
        </View>

        {!isPaid && (
          <Text style={styles.pendingNotice}>
            Payment has not been confirmed for this order.
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

export default UserOrderDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#FFF1F2",
  },
  heading: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    elevation: 3,
    marginBottom: 18,
  },
  orderNumber: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111827",
  },
  mutedText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },
  productCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 14,
    elevation: 3,
    marginBottom: 15,
  },
  productTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#9D174D",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  value: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  paymentValue: {
    fontSize: 13,
    fontWeight: "bold",
  },
  referenceContainer: {
    marginTop: 8,
  },
  reference: {
    fontSize: 11,
    color: "#374151",
    marginTop: 4,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  timeline: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  timelineItem: {
    flex: 1,
    alignItems: "center",
  },
  circle: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: {
    backgroundColor: "#16A34A",
  },
  check: {
    color: "#fff",
    fontWeight: "bold",
  },
  timelineLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 5,
  },
  timelineLabelActive: {
    color: "#16A34A",
    fontWeight: "bold",
  },
  line: {
    position: "absolute",
    top: 12,
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: "#E5E7EB",
    zIndex: -1,
  },
  lineActive: {
    backgroundColor: "#16A34A",
  },
  specialStatus: {
    marginVertical: 12,
    fontWeight: "bold",
  },
  cancelledText: {
    color: "#DC2626",
  },
  pendingText: {
    color: "#D97706",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  darkBtn: {
    flex: 1,
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  reorderBtn: {
    flex: 1,
    backgroundColor: "#0A7AFF",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },
  reorderText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },
  cancelText: {
    color: "#B91C1C",
    fontWeight: "bold",
  },
  reviewBtn: {
    backgroundColor: "#FDE68A",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 10,
  },
  reviewText: {
    fontWeight: "bold",
    color: "#92400E",
  },
  summaryBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    elevation: 3,
    marginBottom: 25,
  },
  grandTotalLabel: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#111827",
  },
  grandTotal: {
    fontWeight: "bold",
    fontSize: 19,
    color: "#9D174D",
  },
  pendingNotice: {
    color: "#B45309",
    fontSize: 12,
    marginTop: 10,
  },
});
