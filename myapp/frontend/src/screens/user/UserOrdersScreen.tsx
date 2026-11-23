
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

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

const UserOrdersScreen = () => {
  const navigation = useNavigation<any>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] =
    useState<"ALL" | "ACTIVE" | "CANCELLED">("ALL");

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getPaymentLabel = (status?: string) => {
    switch (status) {
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

  const getPaymentStyle = (status?: string) => {
    switch (status) {
      case "SUCCESS":
        return styles.paymentSuccess;
      case "PENDING":
        return styles.paymentPending;
      case "FAILED":
      case "CANCELLED":
        return styles.paymentFailed;
      default:
        return styles.paymentDefault;
    }
  };

  const getOrderStatus = (items: OrderItem[]) => {
    if (items.length > 0 && items.every(item => item.status === "CANCELLED")) {
      return "CANCELLED";
    }

    if (items.some(item => item.status === "SHIPPED")) {
      return "SHIPPED";
    }

    if (items.some(item => item.status === "ACCEPTED")) {
      return "ACCEPTED";
    }

    if (items.some(item => item.status === "PLACED")) {
      return "PLACED";
    }

    if (items.every(item => item.status === "DELIVERED")) {
      return "DELIVERED";
    }

    return items[0]?.status || "UNKNOWN";
  };

  const loadOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setOrders([]);
        return;
      }

      const res = await API.get("/orders/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const orderItems = res.data || [];

      // Group individual products under their parent checkout order.
      const grouped: Record<string, Order> = {};

      orderItems.forEach((item: any) => {
        const key = item.orderId || item.orderItemId;

        if (!grouped[key]) {
          grouped[key] = {
            orderId: key,
            items: [],
            paymentStatus: item.paymentStatus,
            paymentMethod: item.paymentMethod,
            paymentReference: item.paymentReference,
            paidAt: item.paidAt,
            orderTotal: item.orderTotal,
            itemsSubtotal: item.itemsSubtotal,
            discountAmount: item.discountAmount,
            customerDeliveryCharge: item.customerDeliveryCharge,
            platformFee: item.platformFee,
            createdAt: item.createdAt,
          };
        }

        grouped[key].items.push({
          orderItemId: item.orderItemId,
          productId: item.productId,
          title: item.title,
          sellerId: item.sellerId,
          price: item.price,
          quantity: item.quantity,
          status: item.status,
        });
      });

      const groupedOrders = Object.values(grouped).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setOrders(groupedOrders);
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

  const filteredOrders = orders.filter(order => {
    const allCancelled =
      order.items.length > 0 &&
      order.items.every(item => item.status === "CANCELLED");

    if (filter === "CANCELLED") return allCancelled;
    if (filter === "ACTIVE") return !allCancelled;

    return true;
  });

  const renderItem = ({ item }: { item: Order }) => {
    const orderStatus = getOrderStatus(item.items);
    const totalQuantity = item.items.reduce(
      (sum, product) => sum + product.quantity,
      0
    );

    const isCancelled = orderStatus === "CANCELLED";

    return (
      <TouchableOpacity
        style={[styles.card, isCancelled && styles.cancelledCard]}
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate("UserOrderDetail", {
            order: item,
          })
        }
      >
        <View style={styles.rowBetween}>
          <Text style={styles.orderTitle}>
            Order #{item.orderId.slice(-8).toUpperCase()}
          </Text>

          <View
            style={[
              styles.paymentBadge,
              getPaymentStyle(item.paymentStatus),
            ]}
          >
            <Text style={styles.paymentText}>
              {getPaymentLabel(item.paymentStatus)}
            </Text>
          </View>
        </View>

        <Text style={styles.productCount}>
          {item.items.length} product(s) · {totalQuantity} item(s)
        </Text>

        <View style={styles.divider} />

        {item.items.map(product => (
          <View key={product.orderItemId} style={styles.productRow}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.title}</Text>
              <Text style={styles.productSub}>
                Qty: {product.quantity}
              </Text>
            </View>

            <Text style={styles.productPrice}>
              ₹{product.price * product.quantity}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.rowBetween}>
          <Text style={styles.secondaryText}>Order status</Text>
          <Text style={styles.orderStatus}>{orderStatus}</Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.secondaryText}>Payment method</Text>
          <Text style={styles.paymentMethod}>
            {item.paymentMethod || "Not available"}
          </Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.secondaryText}>Order date</Text>
          <Text style={styles.date}>
            {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            {item.paymentStatus === "SUCCESS"
              ? "Total Paid"
              : "Order Total"}
          </Text>

          <Text style={styles.totalPrice}>
            ₹{item.orderTotal ?? 0}
          </Text>
        </View>

        <Text style={styles.tapHint}>
          Tap to view order details →
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {["ALL", "ACTIVE", "CANCELLED"].map(f => (
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
                filter === f && styles.activeFilterText,
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
        keyExtractor={item => item.orderId}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#FFF1F2",
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
    opacity: 0.65,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  productCount: {
    marginTop: 7,
    fontSize: 12,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  productSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },
  productPrice: {
    fontWeight: "600",
    color: "#374151",
  },
  paymentBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 15,
  },
  paymentSuccess: {
    backgroundColor: "#DCFCE7",
  },
  paymentPending: {
    backgroundColor: "#FEF3C7",
  },
  paymentFailed: {
    backgroundColor: "#FEE2E2",
  },
  paymentDefault: {
    backgroundColor: "#E5E7EB",
  },
  paymentText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
  },
  secondaryText: {
    fontSize: 12,
    color: "#6B7280",
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  paymentMethod: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  date: {
    fontSize: 12,
    color: "#374151",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111827",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#9D174D",
  },
  tapHint: {
    marginTop: 12,
    fontSize: 12,
    color: "#9CA3AF",
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
