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
  Platform,
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
    if (Platform.OS === "web") {
      openGallery();
      return;
    }

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
      const asset = res.assets[0];

      if (Platform.OS === "web") {
        if (!(asset.file instanceof Blob)) {
          throw new Error("The selected image file is unavailable.");
        }

        form.append("image", asset.file, asset.fileName || "product.jpg");
      } else {
        form.append("image", {
          uri: asset.uri,
          name: "product.jpg",
          type: "image/jpeg",
        } as any);
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      if (Platform.OS !== "web") {
        headers["Content-Type"] = "multipart/form-data";
      }

      const upload = await API.post(
        "/seller/products/upload-image",
        form,
        {
          headers,
        }
      );

      setImages(prev => [...prev, upload.data.imageUrl]);
    } catch (error: any) {
      console.log("IMAGE UPLOAD ERROR:", error);
      console.log("IMAGE UPLOAD RESPONSE:", error?.response?.data);
      console.log("IMAGE UPLOAD STATUS:", error?.response?.status);
      console.log("IMAGE UPLOAD MESSAGE:", error?.message);

      Alert.alert(
        "Image upload failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unknown upload error"
      );
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

    if (images.length === 0) {
      Alert.alert(
        "Product Image Required",
        "Please add at least one product image."
      );
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
          description,

          // Required product fields
          mainCategory,
          category: categoryKey,
          productType,

          mrp: Number(mrp),
          price: Number(sellingPrice),
          stock: inStock ? Number(stockQty) : 0,
          images,

          // Keep existing attribute structure
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

          // Required delivery structure
          delivery: {
            channel: deliveryChannel,
            charge: 0,
            weightInGrams,
          },

          // Keep existing policy structure
          policies: {
            returnable,
            replaceable,
            exchangeable,
            note:
              "For replacement/exchange, delivery charges will be applied as per selected delivery channel",
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert(
        "Product Submitted",
        "Your product has been submitted for admin approval.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "ADD PRODUCT ERROR:",
        error?.response?.data || error?.message || error
      );

      Alert.alert(
        "Failed to add product",
        error?.response?.data?.message || "Please try again."
      );
    }
  };

  /* ================= UI ================= */
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Product</Text>

      {/* CATEGORY */}
      <View style={styles.card}>
        <Text style={styles.section}>Category</Text>

        {Object.keys(CATEGORY_MASTER).map(key => (
          <TouchableOpacity
            key={key}
            style={[
              styles.option,
              mainCategory === key && styles.selected,
            ]}
            onPress={() => {
              setMainCategory(key);
              setCategoryKey(null);
              setProductType(null);
              setImages([]);
            }}
          >
            <Text
              style={[
                styles.optionText,
                mainCategory === key && styles.selectedOptionText,
              ]}
            >
              {CATEGORY_MASTER[key].label}
            </Text>
          </TouchableOpacity>
        ))}

        {mainCategory && (
          <>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowSubCat(!showSubCat)}
            >
              <Text style={styles.dropdownText}>
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
                    setImages([]);
                    setShowSubCat(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>
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
              <Text style={styles.dropdownText}>
                {productType || "Select Product Type"}
              </Text>
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
                  <Text style={styles.dropdownItemText}>{p}</Text>
                </TouchableOpacity>
              ))}
          </>
        )}
      </View>

      {/* IMAGES */}
      {productType && (
        <View style={styles.imageCard}>
          <View style={styles.imageHeader}>
            <View>
              <Text style={styles.imageTitle}>Product Images</Text>
              <Text style={styles.imageSubtitle}>
                Add clear photos of your product
              </Text>
            </View>

            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>
                {images.length} {images.length === 1 ? "Image" : "Images"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.imageUploadBox}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {uploading ? (
              <>
                <ActivityIndicator size="large" />
                <Text style={styles.uploadingText}>
                  Uploading image...
                </Text>
              </>
            ) : (
              <>
                <View style={styles.uploadIconCircle}>
                  <Text style={styles.uploadIcon}>+</Text>
                </View>

                <Text style={styles.uploadTitle}>
                  Add Product Image
                </Text>

                <Text style={styles.uploadSubtitle}>
                  Camera or Gallery
                </Text>
              </>
            )}
          </TouchableOpacity>

          {images.length > 0 && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Uploaded Images</Text>

              <View style={styles.imageRow}>
                {images.map((img, i) => (
                  <View key={i} style={styles.imagePreviewWrapper}>
                    <Image
                      source={{ uri: img }}
                      style={styles.image}
                    />

                    {i === 0 && (
                      <View style={styles.mainImageBadge}>
                        <Text style={styles.mainImageText}>Main</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.imageHint}>
            Use clear, well-lit product photos. At least one image is required.
          </Text>
        </View>
      )}

      {/* PRICING */}
      {productType && (
        <>
          <View style={styles.card}>
            <Text style={styles.section}>Pricing</Text>

            <TextInput
              style={styles.input}
              placeholder="MRP"
              value={mrp}
              onChangeText={setMrp}
            />

            <TextInput
              style={styles.input}
              placeholder="Selling Price"
              value={sellingPrice}
              onChangeText={setSellingPrice}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Inventory & Weight</Text>

            <TouchableOpacity onPress={() => setInStock(!inStock)}>
              <Text>
                {inStock ? "In Stock" : "Out of Stock"}
              </Text>
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
                  onPress={() =>
                    setWeightUnit(u.key as "g" | "kg")
                  }
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

            <Text
              style={{
                fontSize: 12,
                marginTop: 6,
                color: "#555",
              }}
            >
              Note: Delivery charges for replacement/exchange will apply as per
              selected delivery channel.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>
              Return / Replacement Policy
            </Text>

            <Text>
              Return: {returnable ? "Allowed" : "Not Allowed"}
            </Text>

            <Text>
              Replacement: {replaceable ? "Allowed" : "Not Allowed"}
            </Text>

            <Text>
              Exchange: {exchangeable ? "Allowed" : "Not Allowed"}
            </Text>
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
                  setAttributes(prev => ({
                    ...prev,
                    [a]: v,
                  }))
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

          <TouchableOpacity
            style={styles.submit}
            onPress={submitProduct}
          >
            <Text style={styles.submitText}>
              Submit Product
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

export default SellerAddProductScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#F6F8FC",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 14,
    color: "#111827",
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  section: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
    color: "#111827",
  },

  option: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 7,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },

  optionText: {
    fontSize: 14,
    color: "#374151",
  },

  selected: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB",
  },

  selectedOptionText: {
    color: "#1D4ED8",
    fontWeight: "600",
  },

  dropdown: {
    padding: 13,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: "#F9FAFB",
    borderColor: "#D1D5DB",
  },

  dropdownText: {
    color: "#374151",
    fontSize: 14,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
  },

  dropdownItemText: {
    color: "#374151",
    fontSize: 14,
  },

  input: {
    borderWidth: 1,
    borderRadius: 9,
    padding: 11,
    marginTop: 8,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
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

  /* ================= IMAGE SECTION ================= */

  imageCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  imageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  imageTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  imageSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  imageCountBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  imageCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },

  imageUploadBox: {
    height: 145,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#60A5FA",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FBFF",
  },

  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  uploadIcon: {
    fontSize: 28,
    color: "#2563EB",
    fontWeight: "300",
    marginTop: -2,
  },

  uploadTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D4ED8",
  },

  uploadSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  uploadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
  },

  previewContainer: {
    marginTop: 16,
  },

  previewTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },

  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
  },

  imagePreviewWrapper: {
    position: "relative",
    marginRight: 9,
    marginBottom: 9,
  },

  image: {
    width: 78,
    height: 78,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  mainImageBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "#111827",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },

  mainImageText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
  },

  imageHint: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 5,
    lineHeight: 16,
  },

  submit: {
    backgroundColor: "#0A7AFF",
    padding: 15,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: "center",
    elevation: 2,
  },

  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});