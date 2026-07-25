import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/300x300.png?text=Product";

type Product = {
  _id: string;
  title: string;
  price: number;
  stock: number;
  isActive: boolean;
  images?: string[];
  discountType?: "PERCENT" | "FLAT";
  discountValue?: number;
  isOfferActive?: boolean;

  // ✅ ADMIN APPROVAL (SAFE ADD)
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
};

const SellerProductsScreen = () => {
  const navigation = useNavigation<any>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [discount, setDiscount] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [])
  );

  const loadProducts = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

     const res = await API.get('/seller/products', {
  headers: { Authorization: `Bearer ${token}` },
});

      setProducts(res.data || []);
    } catch (err) {
      console.error("Load seller products error:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyOffer = async (productId: string) => {
    if (!discount) {
      Alert.alert("Error", "Enter discount percentage");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Auth error", "Please login again");
        return;
      }

      await API.patch(
  `/seller/products/${productId}/offer`,
        {
          isOfferActive: true,
          discountType: "PERCENT",
          discountValue: Number(discount),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Success", "Offer applied successfully");
      setEditingId(null);
      setDiscount("");
      loadProducts();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to apply offer"
      );
    }
  };

  const deleteProduct = async (productId: string) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) return;

              await API.delete(
  `/seller/products/${productId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              Alert.alert("Success", "Product deleted");
              loadProducts();
            } catch {
              Alert.alert("Error", "Failed to delete product");
            }
          },
        },
      ]
    );
  };

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;

    let color = "#F59E0B";
    if (status === "APPROVED") color = "#16A34A";
    if (status === "REJECTED") color = "#DC2626";

    return (
      <Text style={[styles.statusBadge, { color }]}>
        {status}
      </Text>
    );
  };

  const renderItem = ({ item }: { item: Product }) => {
    const hasDiscount =
      item.isOfferActive &&
      item.discountType === "PERCENT" &&
      typeof item.discountValue === "number";

    const imageUrl =
      item.images && item.images.length > 0
        ? item.images[0]
        : PLACEHOLDER_IMAGE;

    const isApproved = item.approvalStatus === "APPROVED";

    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.image} />

        <View style={styles.rowBetween}>
          <Text style={styles.title}>{item.title}</Text>
          {renderStatusBadge(item.approvalStatus)}
        </View>

        <Text style={styles.price}>₹ {item.price}</Text>

        {item.approvalStatus === "REJECTED" &&
          item.rejectionReason && (
            <Text style={styles.rejectText}>
              Reason: {item.rejectionReason}
            </Text>
          )}

        {hasDiscount && (
          <Text style={styles.badge}>{item.discountValue}% OFF</Text>
        )}

        {editingId === item._id ? (
          <>
            <TextInput
              placeholder="Discount %"
              value={discount}
              onChangeText={setDiscount}
              keyboardType="numeric"
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => applyOffer(item._id)}
            >
              <Text style={styles.btnText}>Save Offer</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[
              styles.offerBtn,
              !isApproved && styles.disabledBtn,
            ]}
            disabled={!isApproved}
            onPress={() => setEditingId(item._id)}
          >
            <Text style={styles.btnText}>
              {isApproved
                ? "Apply Offer"
                : "Awaiting Approval"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteProduct(item._id)}
        >
          <Text style={styles.deleteText}>Delete Product</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() =>
            navigation.getParent()?.navigate("SellerAddProduct")
          }
        >
          <Text style={styles.addBtnText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No products found</Text>
        }
      />
    </View>
  );
};

export default SellerProductsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  addBtn: {
    backgroundColor: "#0A7AFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },

  image: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#eee",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: { fontSize: 16, fontWeight: "bold" },
  price: { marginTop: 4 },

  statusBadge: {
    fontSize: 12,
    fontWeight: "bold",
  },

  rejectText: {
    marginTop: 4,
    color: "#DC2626",
    fontSize: 12,
  },

  badge: {
    marginTop: 4,
    color: "#FF9500",
    fontWeight: "bold",
  },

  offerBtn: {
    marginTop: 10,
    backgroundColor: "#0A7AFF",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  disabledBtn: {
    backgroundColor: "#9CA3AF",
  },

  saveBtn: {
    marginTop: 10,
    backgroundColor: "#34C759",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  btnText: { color: "#fff", fontWeight: "bold" },

  input: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
  },

  deleteBtn: {
    marginTop: 8,
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },

  deleteText: {
    color: "#fff",
    fontWeight: "bold",
  },

  empty: { textAlign: "center", marginTop: 40, color: "#888" },
});
