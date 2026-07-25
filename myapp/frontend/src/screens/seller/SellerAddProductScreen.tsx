// @ts-nocheck
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../config/api";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import {
  CATEGORY_MASTER,
  POLICY_RULES,
} from "../../constants/categoryMaster";

/* ================= DELIVERY CHANNELS ================= */
const DELIVERY_CHANNELS = [
  { key: "STANDARD", label: "Standard Delivery" },
  { key: "EXPRESS", label: "Express Delivery" },
];

/* ================= WEIGHT UNITS ================= */
const WEIGHT_UNITS = [
  { key: "g", label: "Grams (g)" },
  { key: "kg", label: "Kilograms (kg)" },
];

const SellerAddProductScreen = ({ navigation }: any) => {
  /* ================= CATEGORY ================= */
  const [mainCategory, setMainCategory] = useState<string | null>(null);
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [productType, setProductType] = useState<string | null>(null);

  const [showSubCat, setShowSubCat] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  /* ================= IMAGES ================= */
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  /* ================= PRICING ================= */
  const [mrp, setMrp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  /* ================= INVENTORY ================= */
  const [inStock, setInStock] = useState(true);
  const [stockQty, setStockQty] = useState("");

  /* ================= LOGISTICS ================= */
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"g" | "kg">("g");
  const [deliveryChannel, setDeliveryChannel] = useState<string | null>(null);

  /* ================= TAX ================= */
  const [gstPercent, setGstPercent] = useState("");
  const [hsn, setHsn] = useState("");
  const [sku, setSku] = useState("");

  /* ================= POLICIES ================= */
  const [returnable, setReturnable] = useState(false);
  const [replaceable, setReplaceable] = useState(false);
  const [exchangeable, setExchangeable] = useState(false);

  /* ================= ATTRIBUTES ================= */
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [description, setDescription] = useState("");

  const selectedAttributes =
    mainCategory && categoryKey
      ? CATEGORY_MASTER[mainCategory].categories[categoryKey].attributes
      : [];

  /* ================= POLICY RULES ================= */
  const allowedPolicies = useMemo(() => {
    if (!categoryKey) return null;
    return POLICY_RULES[categoryKey as keyof typeof POLICY_RULES] || null;
  }, [categoryKey]);

  useEffect(() => {
    if (!allowedPolicies) return;
    setReturnable(allowedPolicies.returnable);
    setReplaceable(allowedPolicies.replaceable);
    setExchangeable(allowedPolicies.exchangeable);
  }, [allowedPolicies]);

  /* ================= IMAGE PICK ================= */
  const pickImage = () => {
    Alert.alert("Add Image", "Choose source", [
      { text: "Camera", onPress: openCamera },
      { text: "Gallery", onPress: openGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openGallery = () =>
    launchImageLibrary({ mediaType: "photo", quality: 0.7 }, handleImage);
  const openCamera = () =>
    launchCamera({ mediaType: "photo", quality: 0.7 }, handleImage);

  const handleImage = async (res: any) => {
    if (!res.assets?.[0]) return;
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem("token");

      const form = new FormData();
      form.append("image", {
        uri: res.assets[0].uri,
        name: "product.jpg",
        type: "image/jpeg",
      } as any);

     const upload = await API.post(
  "/seller/products/upload-image",
  form,
  { headers: { Authorization: `Bearer ${token}` } }
);

      setImages(prev => [...prev, upload.data.imageUrl]);
    } catch {
      Alert.alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ================= SUBMIT ================= */
  const submitProduct = async () => {
    if (!mainCategory || !categoryKey || !productType) {
      Alert.alert("Complete category selection");
      return;
    }

    if (!mrp || !sellingPrice || !weight || !deliveryChannel) {
      Alert.alert("Pricing, weight & delivery channel required");
      return;
    }

    if (inStock && !stockQty) {
      Alert.alert("Enter stock quantity");
      return;
    }

    const weightInGrams =
      weightUnit === "kg" ? Number(weight) * 1000 : Number(weight);

    try {
      const token = await AsyncStorage.getItem("token");

await API.post(
  "/seller/products",
        {
          title: productType,
          mrp: Number(mrp),
          price: Number(sellingPrice), // delivery added later by platform
          stock: inStock ? Number(stockQty) : 0,
          images,
          attributes: {
            mainCategory,
            category: categoryKey,
            productType,
            specifications: attributes,
            description,
            weight: weightInGrams,
            weightUnit,
            deliveryChannel,
            gstPercent,
            hsn,
            sku,
          },
          policies: {
            returnable,
            replaceable,
            exchangeable,
            note:
              "For replacement/exchange, delivery charges will be applied as per selected delivery channel",
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Product added successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Failed to add product");
    }
  };

  /* ================= UI ================= */
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Product</Text>

      {/* IMAGES */}
      <View style={styles.card}>
        <Text style={styles.section}>Product Images</Text>
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {uploading ? <ActivityIndicator /> : <Text>+ Add Image</Text>}
        </TouchableOpacity>
        <View style={styles.imageRow}>
          {images.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.image} />
          ))}
        </View>
      </View>

      {/* CATEGORY */}
      <View style={styles.card}>
        <Text style={styles.section}>Category</Text>

        {Object.keys(CATEGORY_MASTER).map(key => (
          <TouchableOpacity
            key={key}
            style={[styles.option, mainCategory === key && styles.selected]}
            onPress={() => {
              setMainCategory(key);
              setCategoryKey(null);
              setProductType(null);
            }}
          >
            <Text>{CATEGORY_MASTER[key].label}</Text>
          </TouchableOpacity>
        ))}

        {mainCategory && (
          <>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowSubCat(!showSubCat)}
            >
              <Text>
                {categoryKey
                  ? CATEGORY_MASTER[mainCategory].categories[categoryKey].label
                  : "Select Sub Category"}
              </Text>
            </TouchableOpacity>

            {showSubCat &&
              Object.keys(
                CATEGORY_MASTER[mainCategory].categories
              ).map(key => (
                <TouchableOpacity
                  key={key}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setCategoryKey(key);
                    setProductType(null);
                    setShowSubCat(false);
                  }}
                >
                  <Text>
                    {CATEGORY_MASTER[mainCategory].categories[key].label}
                  </Text>
                </TouchableOpacity>
              ))}
          </>
        )}

        {categoryKey && (
          <>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowProducts(!showProducts)}
            >
              <Text>{productType || "Select Product Type"}</Text>
            </TouchableOpacity>

            {showProducts &&
              CATEGORY_MASTER[mainCategory!].categories[
                categoryKey
              ].products.map(p => (
                <TouchableOpacity
                  key={p}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setProductType(p);
                    setShowProducts(false);
                  }}
                >
                  <Text>{p}</Text>
                </TouchableOpacity>
              ))}
          </>
        )}
      </View>

      {/* PRICING */}
      {productType && (
        <>
          <View style={styles.card}>
            <Text style={styles.section}>Pricing</Text>
            <TextInput style={styles.input} placeholder="MRP" value={mrp} onChangeText={setMrp} />
            <TextInput style={styles.input} placeholder="Selling Price" value={sellingPrice} onChangeText={setSellingPrice} />
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Inventory & Weight</Text>
            <TouchableOpacity onPress={() => setInStock(!inStock)}>
              <Text>{inStock ? "In Stock" : "Out of Stock"}</Text>
            </TouchableOpacity>

            {inStock && (
              <TextInput
                style={styles.input}
                placeholder="Stock Quantity"
                value={stockQty}
                onChangeText={setStockQty}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Weight"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />

            <View style={{ flexDirection: "row", marginTop: 8 }}>
              {WEIGHT_UNITS.map(u => (
                <TouchableOpacity
                  key={u.key}
                  style={[
                    styles.unitBtn,
                    weightUnit === u.key && styles.selected,
                  ]}
                  onPress={() => setWeightUnit(u.key as "g" | "kg")}
                >
                  <Text>{u.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Delivery Channel</Text>
            {DELIVERY_CHANNELS.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.option,
                  deliveryChannel === c.key && styles.selected,
                ]}
                onPress={() => setDeliveryChannel(c.key)}
              >
                <Text>{c.label}</Text>
              </TouchableOpacity>
            ))}
            <Text style={{ fontSize: 12, marginTop: 6, color: "#555" }}>
              Note: Delivery charges for replacement/exchange will apply as per
              selected delivery channel.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Return / Replacement Policy</Text>
            <Text>Return: {returnable ? "Allowed" : "Not Allowed"}</Text>
            <Text>Replacement: {replaceable ? "Allowed" : "Not Allowed"}</Text>
            <Text>Exchange: {exchangeable ? "Allowed" : "Not Allowed"}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Product Details</Text>
            {selectedAttributes.map(a => (
              <TextInput
                key={a}
                style={styles.input}
                placeholder={a}
                value={attributes[a] || ""}
                onChangeText={v =>
                  setAttributes(prev => ({ ...prev, [a]: v }))
                }
              />
            ))}
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Product Description"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TouchableOpacity style={styles.submit} onPress={submitProduct}>
            <Text style={styles.submitText}>Submit Product</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

export default SellerAddProductScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  section: { fontWeight: "bold", marginBottom: 8 },

  option: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 6,
    borderColor: "#ccc",
  },
  selected: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB",
  },

  dropdown: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: "#F9FAFB",
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderColor: "#ccc",
  },

  unitBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 6,
    borderColor: "#ccc",
    alignItems: "center",
  },

  imageBox: {
    height: 100,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  imageRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  image: { width: 70, height: 70, borderRadius: 8, marginRight: 8 },

  submit: {
    backgroundColor: "#0A7AFF",
    padding: 14,
    borderRadius: 10,
    marginVertical: 20,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "bold" },
});
