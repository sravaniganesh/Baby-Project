import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";

const { width } = Dimensions.get("window");



/* ================= TYPES ================= */
type Product = {
  _id: string;
  title: string;
  price: number;
  mrp?: number;
  discountPercent?: number;
  category?: string;
  images?: string[];
  rating?: number;
  ratingCount?: number;
   stock?: number;
    attributes?: {
    deliveryCharge?: number;
  };

};

type Banner = {
  _id: string;
  imageUrl: string;
};

/* ================= CONSTANTS ================= */
const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/400x400.png?text=Product";

const HERO_CATEGORIES = [
  { key: "WOMEN", label: "Women" },
  { key: "BABY_GIRL", label: "Baby Girl" },
  { key: "BABY_BOY", label: "Baby Boy" },
];

const CATEGORY_ICON_GRID = [
  { label: "Women Fashion", value: "WOMEN", icon: "woman", bg: "#FCE7F3" },
  { label: "Kids Fashion", value: "BABY_GIRL", icon: "shirt", bg: "#E0E7FF" },
  { label: "Kids Footwear", value: "FOOTWEAR", icon: "walk", bg: "#DCFCE7" },
  { label: "Toys", value: "TOYS", icon: "game-controller", bg: "#FEF3C7" },
  { label: "Accessories", value: "ACCESSORIES", icon: "bag", bg: "#FFE4E6" },

  { label: "Ethnic Wear", value: "ETHNIC", icon: "sparkles", bg: "#ECFEFF" },
  { label: "Casual Wear", value: "CASUAL", icon: "sunny", bg: "#FFF7ED" },
  { label: "Party Wear", value: "PARTY", icon: "star", bg: "#FDF2F8" },
  { label: "Winter Wear", value: "WINTER", icon: "snow", bg: "#F0F9FF" },
  { label: "Summer Wear", value: "SUMMER", icon: "cloud", bg: "#FEFCE8" },

  { label: "New Born", value: "NEWBORN", icon: "happy", bg: "#F0FDF4" },
  { label: "School Wear", value: "SCHOOL", icon: "book", bg: "#EEF2FF" },
  { label: "Night Wear", value: "NIGHT", icon: "moon", bg: "#FAE8FF" },
  { label: "Inner Wear", value: "INNER", icon: "heart", bg: "#FFE4E6" },
  { label: "Combo Sets", value: "COMBO", icon: "albums", bg: "#FFF1F2" },

  { label: "Trending", value: "TRENDING", icon: "flame", bg: "#FEF3C7" },
  { label: "Offers", value: "OFFERS", icon: "pricetag", bg: "#ECFEFF" },
  { label: "Top Rated", value: "TOP", icon: "thumbs-up", bg: "#F0FDF4" },
  { label: "Budget Buy", value: "BUDGET", icon: "cash", bg: "#FEFCE8" },
];

const PROMOS = [
  "Top Selling",
  "Trending Now",
  "Limited Offer",
  "Best Picks",
  "Popular Today",
];
const matchesCategory = (product: any, selectedCategory: string) => {
  if (selectedCategory === "ALL") return true;

  const attr = product.attributes || {};

  // Main category match (Women / Kids)
  if (attr.mainCategory === selectedCategory) return true;

  // Sub category match (TOYS, FOOTWEAR, etc.)
  if (attr.category === selectedCategory) return true;

  return false;
};

/* ================= COMPONENT ================= */
const ShopHomeScreen = () => {
  const navigation = useNavigation<any>();

  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    loadWishlist();
    loadBanners();
  }, []);
  useEffect(() => {
  if (search.trim().length > 0) {
    setSelectedCategory("ALL");
  }
}, [search]);


  const loadProducts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res = await API.get('/shop/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await API.get('/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlistIds(res.data.map((p: any) => p._id));
    } catch {}
  };

  const loadBanners = async () => {
    try {
      const res = await API.get('/banners/public');
      setBanners(res.data || []);
    } catch {}
  };

  const toggleWishlist = async (productId: string) => {
    const token = await AsyncStorage.getItem("token");
    const res = await API.post(
  `/wishlist/toggle`,
      { productId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setWishlistIds((prev) =>
      res.data.wished
        ? [...prev, productId]
        : prev.filter((id) => id !== productId)
    );
  };

 const filteredProducts = useMemo(() => {
  return products.filter((p) => {
    const matchSearch = p.title
      .toLowerCase()
      .includes(search.toLowerCase());

    // If user is searching, ignore category completely
    if (search.trim().length > 0) {
      return matchSearch;
    }

    // Normal category filtering
    if (selectedCategory === "ALL") return true;

    return matchesCategory(p, selectedCategory);

  });
}, [products, search, selectedCategory]);


  /* ================= HEADER ================= */
  const ListHeader = () => (
    <View>
      {banners.length > 0 && (
        <FlatList
          data={banners}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} />
          )}
        />
      )}

      <TextInput
        style={styles.search}
        placeholder="Search women & kids products"
        value={search}
        onChangeText={setSearch}
      />

    <View style={styles.heroRow}>
  {HERO_CATEGORIES.map((c) => (
    <TouchableOpacity
      key={c.key}
      style={styles.heroCard}
      onPress={() => setSelectedCategory(c.key)}
    >
      <Icon
        name={
          c.key === "WOMEN"
            ? "woman"
            : c.key === "BABY_GIRL"
            ? "heart"
            : "happy"
        }
        size={22}
        color="#0369A1"
        style={{ marginBottom: 4 }}
      />

      <Text style={styles.heroText}>{c.label}</Text>
    </TouchableOpacity>
  ))}
</View>

      <Text style={styles.sectionTitle}>Best Selling Products</Text>
      <FlatList
        data={products.slice(0, 10)}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bestCard}
            onPress={() =>
              navigation.navigate("ProductDetail", { product: item })
            }
          >
            <Image
              source={{ uri: item.images?.[0] || PLACEHOLDER_IMAGE }}
              style={styles.bestImage}
            />
            <Text numberOfLines={1} style={styles.bestText}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.sectionTitle}>Women’s Best Picks</Text>
      <FlatList
        data={PROMOS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i, idx) => `w-${idx}`}
        renderItem={({ item }) => (
          <View style={styles.promoCard}>
            <Text style={styles.promoText}>{item}</Text>
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Kids Special</Text>
      <FlatList
        data={PROMOS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i, idx) => `k-${idx}`}
        renderItem={({ item }) => (
          <View style={styles.promoCard}>
            <Text style={styles.promoText}>{item}</Text>
          </View>
        )}
      />

      <View style={styles.adBox}>
        <Text style={styles.adText}>Google Ad</Text>
      </View>
      <TouchableOpacity
  onPress={() => setSelectedCategory("ALL")}
  style={{ marginLeft: 12, marginBottom: 8 }}
>
  <Text style={{ color: "#0A7AFF", fontWeight: "bold" }}>
    Show All Products
  </Text>
</TouchableOpacity>


      <View style={styles.iconGrid}>
        {CATEGORY_ICON_GRID.map((c) => (
          <TouchableOpacity
            key={c.label}
            style={[styles.iconCard, { backgroundColor: c.bg }]}
            onPress={() => setSelectedCategory(c.value)}
          >
            <Icon name={c.icon} size={24} color="#111827" />
            <Text style={styles.iconLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.adBox}>
        <Text style={styles.adText}>Google Ad</Text>
      </View>

      <Text style={styles.sectionTitle}>All Products</Text>
    </View>
  );

  /* ================= PRODUCT CARD ================= */
  const renderProduct = ({ item }: { item: Product }) => {
    const mrp = item.mrp;

    const sellerDiscount = item.discountPercent || 0;

   const sellingPrice =
  sellerDiscount > 0
    ? Math.round((mrp ?? item.price) - ((mrp ?? item.price) * sellerDiscount) / 100)
    : item.price;
const isInStock = (item.stock ?? 0) > 0;

const deliveryCharge = item.attributes?.deliveryCharge || 0;

const finalPayablePrice = sellingPrice + deliveryCharge;


const totalSavings =
  mrp && mrp > sellingPrice ? mrp - sellingPrice : 0;



    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate("ProductDetail", { product: item })
          }
        >
          <Image
  source={{ uri: item.images?.[0] || PLACEHOLDER_IMAGE }}
  style={styles.productImage}
  resizeMode="cover"
/>

          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          {item.rating && (
            <View style={styles.ratingRow}>
              <Icon name="star" size={12} color="#FACC15" />
              <Text style={styles.ratingText}>
                {item.rating} ({item.ratingCount || 0})
              </Text>
            </View>
          )}

          {mrp && mrp > sellingPrice && (
  <Text style={styles.oldPrice}>₹ {mrp}</Text>
)}

          <Text style={styles.sellingPrice}>₹ {sellingPrice}</Text>
         
          <Text style={styles.finalPrice}>Final ₹ {finalPayablePrice}</Text>

          <Text
  style={[
    styles.stockText,
    { color: isInStock ? "#16A34A" : "#DC2626" },
  ]}
>
  {isInStock ? "In Stock" : "Out of Stock"}
</Text>

          <Text style={styles.savedText}>
            You save ₹{totalSavings}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.wishlistIcon}
          onPress={() => toggleWishlist(item._id)}
        >
          <Icon
            name={
              wishlistIds.includes(item._id)
                ? "heart"
                : "heart-outline"
            }
            size={18}
            color="#EF4444"
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0A7AFF" />
      </View>
    );
  }

 return (
  <FlatList
    data={filteredProducts}
    keyExtractor={(item) => item._id}
    renderItem={renderProduct}
    numColumns={3}
    columnWrapperStyle={{ justifyContent: "space-between" }}
    ListHeaderComponent={ListHeader}
    ListFooterComponent={<View style={{ height: 40 }} />}
    ListEmptyComponent={
      <Text style={styles.emptyText}>No products found</Text>
    }
    contentContainerStyle={{
      paddingHorizontal: 12,
      paddingBottom: 20,
      backgroundColor: "#F9FAFB",
      flexGrow: 1,
    }}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"   // ⭐ THIS FIX
  />
);
};

export default ShopHomeScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  bannerImage: {
    width: width - 24,
    height: 160,
    borderRadius: 14,
    marginHorizontal: 12,
    marginTop: 12,
  },
  search: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    margin: 12,
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 12,
    marginBottom: 12,
  },
  heroCard: {
    width: "32%",
    height: 90,
    backgroundColor: "#E0F2FE",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { fontWeight: "bold", color: "#0369A1" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 12,
    marginVertical: 8,
  },
  promoCard: {
    width: width - 24,
    height: 140,
    backgroundColor: "#DBEAFE",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 12,
  },
  promoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E40AF",
  },
  bestCard: {
    width: 120,
    marginHorizontal: 8,
  },
  bestImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
  },
  bestText: {
    fontSize: 12,
    marginTop: 4,
  },
  adBox: {
    height: 80,
    backgroundColor: "#E5E7EB",
    margin: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  adText: {
    color: "#6B7280",
    fontWeight: "bold",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 12,
  },
  iconCard: {
    width: "18%",
    height: 80,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconLabel: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
  },
 card: {
  backgroundColor: "#fff",
  borderRadius: 12,
  padding: 8,
  marginBottom: 12,
  width: "32%",
  elevation: 4,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
},
  productImage: {
    width: "100%",
    height: 110,
    borderRadius: 8,
  },
  title: { fontSize: 13, fontWeight: "600" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    marginLeft: 4,
  },
  oldPrice: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
    fontSize: 12,
  },
  sellingPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  extraOffer: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
  },
  finalPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#16A34A",
  },
  savedText: {
    fontSize: 11,
    color: "#059669",
  },
  wishlistIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
  textAlign: "center",
  marginTop: 40,
  color: "#6B7280",
  fontSize: 14,
},
freeDelivery: {
  fontSize: 11,
  color: "#2563EB",
  fontWeight: "600",
},
stockText: {
  fontSize: 11,
  fontWeight: "600",
  marginTop: 2,
},



});
