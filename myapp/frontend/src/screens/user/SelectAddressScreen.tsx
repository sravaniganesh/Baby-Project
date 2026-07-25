import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native"; // ✅ ADD



const SelectAddressScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* ===============================
     ✅ READ AMOUNTS FROM CART
  =============================== */
  const route = useRoute<any>();

  const sellerAmount = route?.params?.sellerAmount ?? 0;
  const deliveryAmount = route?.params?.deliveryAmount ?? 0;
  const totalPayable = route?.params?.totalPayable ?? 0;

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await API.get('/user/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAddresses(res.data || []);
    } catch (err) {
      Alert.alert("Error", "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     CONFIRM ADDRESS
  =============================== */
  const confirmAddress = () => {
    if (!selectedId) {
      Alert.alert("Error", "Please select an address");
      return;
    }

    const selectedAddress = addresses.find(
      (a) => a._id === selectedId
    );

    navigation.navigate("PlaceOrder", {
      address: selectedAddress,

      // ✅ PASS AMOUNTS FOR ORDER CREATION
      sellerAmount,
      deliveryAmount,
      totalPayable,
    });
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.card,
        selectedId === item._id && styles.selected,
      ]}
      onPress={() => setSelectedId(item._id)}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text>
        {item.house}, {item.area}
      </Text>
      <Text>
        {item.city}, {item.state} - {item.pincode}
      </Text>
      <Text>📞 {item.phone}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Select Delivery Address
      </Text>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No addresses found
          </Text>
        }
      />

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate("AddAddress")}
      >
        <Text style={styles.addText}>
          + Add New Address
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.confirmBtn}
        onPress={confirmAddress}
      >
        <Text style={styles.confirmText}>
          Deliver Here
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SelectAddressScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },

  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  selected: {
    borderColor: "#0A7AFF",
    backgroundColor: "#EAF2FF",
  },
  name: {
    fontWeight: "bold",
    marginBottom: 4,
  },

  addBtn: {
    marginTop: 10,
    alignItems: "center",
  },
  addText: {
    color: "#0A7AFF",
    fontWeight: "bold",
  },

  confirmBtn: {
    marginTop: 20,
    backgroundColor: "#34C759",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },
});
