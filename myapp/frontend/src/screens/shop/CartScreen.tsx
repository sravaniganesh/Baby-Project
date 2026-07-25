import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";



const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/200x200.png?text=Product";

const CartScreen = () => {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<any>();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      const res = await API.get('/shop/cart', {
  headers: { Authorization: `Bearer ${token}` },
});

      setCart(res.data);
    } catch (err) {
      console.error("Load cart error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     REMOVE ITEM
  ============================ */
  const removeFromCart = async (productId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await API.post(
  `/shop/cart/remove`,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadCart();
    } catch {
      Alert.alert("Error", "Failed to remove item");
    }
  };

  /* ============================
     MOVE TO WISHLIST
  ============================ */
  const moveToWishlist = async (productId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");

      await API.post(
  `/wishlist/toggle`,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await removeFromCart(productId);
    } catch {
      Alert.alert("Error", "Failed to move to wishlist");
    }
  };

  /* ============================
     CART TOTALS (DELIVERY INCLUDED – HIDDEN)
  ============================ */
  const cartSummary = useMemo(() => {
    let totalMrp = 0;
    let sellerAmount = 0;
    let deliveryAmount = 0;

    (cart?.items || []).forEach((item: any) => {
      const product = item.productId;
      const qty = item.quantity;

      const sellingPrice = item.priceAtAddTime;
      const discount = product?.discountPercent || 0;

      const finalProductPrice =
        discount > 0
          ? Math.round(
              sellingPrice - (sellingPrice * discount) / 100
            )
          : sellingPrice;

      const itemDeliveryCharge =
        Number(item.deliveryCharge || 0); // ✅ SAFE ADD

      totalMrp += sellingPrice * qty;
      sellerAmount += finalProductPrice * qty;
      deliveryAmount += itemDeliveryCharge * qty;
    });

    const totalPayable = sellerAmount + deliveryAmount;

    return {
      totalMrp,
      sellerAmount,
      deliveryAmount,
      totalPayable,
      totalSavings: totalMrp - sellerAmount,
    };
  }, [cart]);

  /* ============================
     ITEM UI
  ============================ */
  const renderItem = ({ item }: any) => {
    const product = item.productId;
    const sellingPrice = item.priceAtAddTime;

    const discount = product?.discountPercent || 0;

    const finalPrice =
      discount > 0
        ? Math.round(
            sellingPrice - (sellingPrice * discount) / 100
          )
        : sellingPrice;

    return (
      <View style={styles.card}>
        <Image
          source={{
            uri:
              product?.images && product.images.length > 0
                ? product.images[0]
                : PLACEHOLDER_IMAGE,
          }}
          style={styles.image}
        />

        <View style={styles.info}>
          <Text style={styles.title}>{product?.title}</Text>
          <Text>Qty: {item.quantity}</Text>

          <Text style={styles.oldPrice}>₹ {sellingPrice}</Text>
          <Text style={styles.finalPrice}>₹ {finalPrice}</Text>

          <Text style={styles.freeDelivery}>Free Delivery</Text>

          {discount > 0 && (
            <Text style={styles.save}>
              You save ₹ {(sellingPrice - finalPrice) * item.quantity}
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => moveToWishlist(product._id)}
            >
              <Text style={styles.link}>Move to Wishlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => removeFromCart(product._id)}
            >
              <Text style={[styles.link, styles.remove]}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart?.items || []}
        keyExtractor={(item: any) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Your cart is empty
          </Text>
        }
      />

      {cart?.items?.length > 0 && (
        <>
          <View style={styles.summary}>
            <Row label="Total MRP" value={cartSummary.totalMrp} />
            <Row
              label="You Save"
              value={cartSummary.totalSavings}
              green
            />
            <Row label="Delivery" value={"FREE"} />
            <Row
              label="Payable"
              value={cartSummary.totalPayable}
              bold
            />
          </View>

          <TouchableOpacity
            style={styles.continue}
            onPress={() =>
              navigation.navigate("SelectAddress", {
                sellerAmount: cartSummary.sellerAmount,
                deliveryAmount: cartSummary.deliveryAmount,
                totalPayable: cartSummary.totalPayable,
              })
            }
          >
            <Text style={styles.continueText}>
              Continue
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const Row = ({
  label,
  value,
  bold,
  green,
}: any) => (
  <View style={styles.row}>
    <Text
      style={[
        bold && styles.bold,
        green && styles.green,
      ]}
    >
      {label}
    </Text>
    <Text
      style={[
        bold && styles.bold,
        green && styles.green,
      ]}
    >
      {typeof value === "number" ? `₹ ${value}` : value}
    </Text>
  </View>
);

export default CartScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    elevation: 2,
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#eee",
  },

  info: {
    flex: 1,
    marginLeft: 10,
  },

  title: {
    fontWeight: "bold",
    fontSize: 15,
  },

  oldPrice: {
    textDecorationLine: "line-through",
    color: "#999",
    marginTop: 4,
  },

  finalPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },

  freeDelivery: {
    fontSize: 12,
    color: "#16A34A",
    marginTop: 2,
  },

  save: {
    color: "#16A34A",
    fontSize: 13,
    marginTop: 2,
  },

  actions: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "space-between",
  },

  link: {
    color: "#0A7AFF",
    fontSize: 13,
  },

  remove: {
    color: "#DC2626",
  },

  summary: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    elevation: 3,
    marginTop: 6,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },

  bold: { fontWeight: "bold" },
  green: { color: "#16A34A" },

  continue: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  continueText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  empty: {
    textAlign: "center",
    marginTop: 50,
    color: "#888",
  },
});
