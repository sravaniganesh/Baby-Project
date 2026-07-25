import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";


const SELLER_BASE_DISCOUNT = 20; // % display-only

const PlaceOrderScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [loading, setLoading] = useState(false);

  // 🆕 CART SUMMARY (PRICE ONLY)
  const [summary, setSummary] = useState<{
    totalMrp: number;
    totalSavings: number;
    payable: number;
  } | null>(null);

  const address = route?.params?.address;

  /* =====================================
     🆕 DELIVERY-CHANNEL AMOUNTS (ADDITIVE)
  ===================================== */
  const sellerAmountFromRoute =
    route?.params?.sellerAmount ?? 0;

  const deliveryAmountFromRoute =
    route?.params?.deliveryAmount ?? 0;

  const totalPayableFromRoute =
    route?.params?.totalPayable ?? 0;

  useEffect(() => {
    loadCartSummary();
  }, []);

  // 🧮 LOAD CART SUMMARY (YOUR EXISTING LOGIC – UNTOUCHED)
  const loadCartSummary = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await API.get('/shop/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let totalMrp = 0;
      let totalPayable = 0;

      res.data?.items?.forEach((item: any) => {
        const product = item.productId;
        const mrp = item.priceAtAddTime;

        const sellerPrice = Math.round(
          mrp - (mrp * SELLER_BASE_DISCOUNT) / 100
        );

        const specialDiscount = product?.discountPercent || 0;

        const finalPrice =
          specialDiscount > 0
            ? Math.round(
                sellerPrice -
                  (sellerPrice * specialDiscount) / 100
              )
            : sellerPrice;

        totalMrp += mrp * item.quantity;
        totalPayable += finalPrice * item.quantity;
      });

      setSummary({
        totalMrp,
        totalSavings: totalMrp - totalPayable,
        payable: totalPayable,
      });
    } catch {
      // silent fail – summary is optional
    }
  };

  if (!address) {
    return (
      <View style={styles.center}>
        <Text>No address selected</Text>
      </View>
    );
  }

  /* =====================================
     FINAL PAYABLE (HIDDEN DELIVERY)
  ===================================== */
  const finalPayable =
    totalPayableFromRoute > 0
      ? totalPayableFromRoute
      : summary?.payable ?? 0;

  const placeOrder = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Auth error", "Please login again");
        return;
      }

      await API.post(
  `/shop/order/place`,
        {
          // 🆕 ADDITIVE FIELDS (BACKEND CAN USE LATER)
          sellerAmount:
            sellerAmountFromRoute ||
            summary?.payable ||
            0,

          deliveryAmount: deliveryAmountFromRoute || 0,

          payableAmount: finalPayable,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Success", "Order placed successfully", [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("User", {
              screen: "Profile",
              params: {
                screen: "UserOrders",
              },
            });
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Order Failed",
        err?.response?.data?.message ||
          "Something went wrong while placing order"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Review & Place Order</Text>

      <Text style={styles.section}>Delivery Address</Text>

      <View style={styles.card}>
        <Text style={styles.name}>{address.name}</Text>
        <Text>{address.addressLine}</Text>
        <Text>
          {address.city}, {address.state} - {address.pincode}
        </Text>
        <Text>📞 {address.phone}</Text>
      </View>

      {/* 🧾 PRICE SUMMARY (NO DELIVERY SHOWN) */}
      {(summary || totalPayableFromRoute > 0) && (
        <>
          <Text style={styles.section}>Price Summary</Text>
          <View style={styles.card}>
            {summary && (
              <>
                <View style={styles.row}>
                  <Text>Total MRP</Text>
                  <Text>₹ {summary.totalMrp}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.saveText}>You Save</Text>
                  <Text style={styles.saveText}>
                    ₹ {summary.totalSavings}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.row}>
              <Text style={styles.payLabel}>Payable</Text>
              <Text style={styles.payLabel}>
                ₹ {finalPayable}
              </Text>
            </View>
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.6 }]}
        onPress={placeOrder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Place Order</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default PlaceOrderScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  section: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
  },
  name: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  saveText: {
    color: "#28a745",
    fontWeight: "bold",
  },
  payLabel: {
    fontWeight: "bold",
    fontSize: 16,
  },
  btn: {
    backgroundColor: "#34C759",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
