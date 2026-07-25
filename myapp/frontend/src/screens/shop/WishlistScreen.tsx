import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";

const { width } = Dimensions.get("window");


/* ================= TYPES ================= */
type Product = {
  _id: string;
  title: string;
  price: number;
  discountPercent?: number;
};

const SELLER_BASE_DISCOUNT = 20;

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/400x400.png?text=Product";

/* ================= COMPONENT ================= */
const WishlistScreen = () => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res = await API.get('/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(res.data || []);
    } catch (err) {
      console.error("LOAD WISHLIST ERROR", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await API.post(
  `/wishlist/toggle`,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWishlist((prev) =>
        prev.filter((p) => p._id !== productId)
      );
    } catch {
      Alert.alert("Error", "Failed to remove");
    }
  };

  const moveToCart = async (productId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");

      await API.post(
  `/shop/cart/add`,
        { productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Added to cart");
    } catch {
      Alert.alert("Error", "Failed to add to cart");
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    const mrp = item.price;
    const sellerPrice = Math.round(
      mrp - (mrp * SELLER_BASE_DISCOUNT) / 100
    );

    const discount = item.discountPercent || 0;
    const finalPrice =
      discount > 0
        ? Math.round(
            sellerPrice -
              (sellerPrice * discount) / 100
          )
        : sellerPrice;

    return (
      <View style={styles.card}>
        <Image
          source={{ uri: PLACEHOLDER_IMAGE }}
          style={styles.image}
        />

        {discount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {discount}% OFF
            </Text>
          </View>
        )}

        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.oldPrice}>
          ₹ {mrp}
        </Text>
        <Text style={styles.price}>
          ₹ {finalPrice}
        </Text>

        <View style={styles.actions}>
          {/* ❌ REMOVE */}
          <TouchableOpacity
            onPress={() =>
              removeFromWishlist(item._id)
            }
          >
            <Icon
              name="trash-outline"
              size={18}
              color="#DC2626"
            />
          </TouchableOpacity>

          {/* 🛒 MOVE TO CART */}
          <TouchableOpacity
            onPress={() =>
              moveToCart(item._id)
            }
          >
            <Icon
              name="cart-outline"
              size={18}
              color="#0A7AFF"
            />
          </TouchableOpacity>
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

  if (wishlist.length === 0) {
    return (
      <View style={styles.empty}>
        <Icon
          name="heart-outline"
          size={64}
          color="#9CA3AF"
        />
        <Text style={styles.emptyText}>
          Your wishlist is empty
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={wishlist}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      numColumns={3}
      columnWrapperStyle={{
        justifyContent: "space-between",
      }}
      contentContainerStyle={{
        padding: 12,
      }}
    />
  );
};

export default WishlistScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    width: "32%",
    marginBottom: 12,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    marginBottom: 6,
  },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#DC2626",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
  },
  oldPrice: {
    fontSize: 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  price: {
    fontSize: 13,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 16,
  },
});
