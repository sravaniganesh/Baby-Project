import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";



/* ================= TYPES ================= */
type Product = {
  _id: string;
  title: string;
  price: number;
  mrp?: number;
  images?: string[];
  rating?: number;
  ratingCount?: number;
  stock?: number;
  description?: string;
  specifications?: Record<string, string>;
};

type RouteParams = {
  params: {
    product: Product;
  };
};

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/600x600.png?text=Product";

/* ================= COMPONENT ================= */
const ProductDetailScreen = () => {
  const route = useRoute<RouteProp<RouteParams, "params">>();
  const navigation = useNavigation<any>();
  const { product } = route.params;

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isWished, setIsWished] = useState(false);

  const [related, setRelated] = useState<Product[]>([]);
  const [showDesc, setShowDesc] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);

  /* ================= WISHLIST ================= */
  useEffect(() => {
    checkWishlist();
    loadRelated();
  }, []);

  const checkWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await API.get('/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsWished(res.data.some((p: any) => p._id === product._id));
    } catch {}
  };

  const toggleWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await API.post(
  `/wishlist/toggle`,
        { productId: product._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsWished(res.data.wished);
    } catch {
      Alert.alert("Error", "Wishlist failed");
    }
  };

  /* ================= RELATED PRODUCTS ================= */
  const loadRelated = async () => {
    try {
      const res = await API.get(
  `/shop/products/${product._id}/related`

      );
      setRelated(res.data || []);
    } catch {}
  };

  /* ================= CART ================= */
  const addToCart = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      await API.post(
  `/shop/cart/add`,
        { productId: product._id, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Product added to cart");
    } catch {
      Alert.alert("Error", "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  /* ================= PRICING ================= */
  const sellingPrice = product.price;
  const mrp = product.mrp;
  const showMrp = mrp && mrp > sellingPrice;
  const savings = showMrp ? mrp! - sellingPrice : 0;

  const inStock = (product.stock ?? 0) > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* IMAGE */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.images?.[0] || PLACEHOLDER_IMAGE }}
          style={styles.image}
        />

        <TouchableOpacity style={styles.wishlistIcon} onPress={toggleWishlist}>
          <Icon
            name={isWished ? "heart" : "heart-outline"}
            size={26}
            color="#EF4444"
          />
        </TouchableOpacity>
      </View>

      {/* TITLE */}
      <Text style={styles.title}>{product.title}</Text>

      {/* RATING SUMMARY */}
      <View style={styles.ratingRow}>
        <Icon name="star" size={16} color="#FACC15" />
        <Text style={styles.ratingText}>
          {product.rating || 0} ({product.ratingCount || 0} ratings)
        </Text>
      </View>

      {/* STOCK */}
      <Text
        style={[
          styles.stock,
          { color: inStock ? "#16A34A" : "#DC2626" },
        ]}
      >
        {inStock ? "In Stock" : "Out of Stock"}
      </Text>

      {/* PRICE */}
      {showMrp && <Text style={styles.oldPrice}>₹ {mrp}</Text>}
      <Text style={styles.price}>₹ {sellingPrice}</Text>
      {savings > 0 && (
        <Text style={styles.saveText}>You save ₹ {savings}</Text>
      )}

      {/* DESCRIPTION */}
      <TouchableOpacity
        onPress={() => {
          LayoutAnimation.easeInEaseOut();
          setShowDesc(!showDesc);
        }}
        style={styles.toggleHeader}
      >
        <Text style={styles.toggleTitle}>Product Description</Text>
        <Icon name={showDesc ? "chevron-up" : "chevron-down"} size={20} />
      </TouchableOpacity>

      {showDesc && (
        <Text style={styles.descText}>
          {product.description || "No description provided"}
        </Text>
      )}

      {/* SPECIFICATIONS */}
      <TouchableOpacity
        onPress={() => {
          LayoutAnimation.easeInEaseOut();
          setShowSpecs(!showSpecs);
        }}
        style={styles.toggleHeader}
      >
        <Text style={styles.toggleTitle}>Specifications</Text>
        <Icon name={showSpecs ? "chevron-up" : "chevron-down"} size={20} />
      </TouchableOpacity>

      {showSpecs && (
        <View style={styles.specBox}>
          {product.specifications ? (
            Object.entries(product.specifications).map(([k, v]) => (
              <Text key={k} style={styles.specText}>
                • {k}: {v}
              </Text>
            ))
          ) : (
            <Text>No specifications</Text>
          )}
        </View>
      )}

      {/* QUANTITY */}
      <View style={styles.qtyRow}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => setQuantity(q => Math.max(1, q - 1))}
        >
          <Text style={styles.qtyText}>−</Text>
        </TouchableOpacity>

        <Text style={styles.qtyValue}>{quantity}</Text>

        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => setQuantity(q => q + 1)}
        >
          <Text style={styles.qtyText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ADD TO CART */}
      <TouchableOpacity
        style={[styles.addBtn, !inStock && { opacity: 0.5 }]}
        onPress={addToCart}
        disabled={!inStock || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.addText}>Add to Cart</Text>
        )}
      </TouchableOpacity>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Related Products</Text>
          <FlatList
            data={related}
            horizontal
            keyExtractor={item => item._id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.relatedCard}
                onPress={() =>
                  navigation.push("ProductDetail", { product: item })
                }
              >
                <Image
                  source={{
                    uri: item.images?.[0] || PLACEHOLDER_IMAGE,
                  }}
                  style={styles.relatedImage}
                />
                <Text numberOfLines={1} style={styles.relatedTitle}>
                  {item.title}
                </Text>
                <Text style={styles.relatedPrice}>₹ {item.price}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </ScrollView>
  );
};

export default ProductDetailScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 320, borderRadius: 16 },
  wishlistIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 30,
  },
  title: { fontSize: 20, fontWeight: "bold", marginTop: 16 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  ratingText: { marginLeft: 6, fontSize: 14 },
  stock: { marginTop: 6, fontWeight: "bold" },
  oldPrice: {
    marginTop: 6,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  price: { fontSize: 22, fontWeight: "bold", color: "#16A34A" },
  saveText: { color: "#16A34A", marginTop: 4 },
  toggleHeader: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  toggleTitle: { fontWeight: "bold", fontSize: 16 },
  descText: { marginTop: 8, color: "#374151" },
  specBox: { marginTop: 8 },
  specText: { color: "#374151", marginVertical: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  qtyBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  qtyText: { fontSize: 20, fontWeight: "bold" },
  qtyValue: { marginHorizontal: 20, fontSize: 18, fontWeight: "bold" },
  addBtn: {
    marginTop: 24,
    backgroundColor: "#0A7AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  addText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  sectionTitle: { marginTop: 24, fontSize: 16, fontWeight: "bold" },
  relatedCard: { width: 120, marginRight: 12 },
  relatedImage: { width: "100%", height: 120, borderRadius: 10 },
  relatedTitle: { fontSize: 12, marginTop: 4 },
  relatedPrice: { fontWeight: "bold" },
});
