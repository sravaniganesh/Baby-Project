import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import API from "../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";



const SellerProfileScreen = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Identity
  const [sellerType, setSellerType] = useState<"INDIVIDUAL" | "BUSINESS">(
    "INDIVIDUAL"
  );
  const [panNumber, setPanNumber] = useState("");
  const [panName, setPanName] = useState("");

  // Business
  const [businessName, setBusinessName] = useState("");

  // Address
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");

  // GST
  const [hasGST, setHasGST] = useState(false);
  const [gstType, setGstType] = useState<"REGULAR" | "COMPOSITION">("REGULAR");
  const [gstNumber, setGstNumber] = useState("");
  const [gstState, setGstState] = useState("");

  // Bank
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIFSC, setBankIFSC] = useState("");
  const [bankName, setBankName] = useState("");

  // Status
  const [sellerCategory, setSellerCategory] = useState("");
  const [profileCompleted, setProfileCompleted] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await API.get('/seller/profile', {
  headers: { Authorization: `Bearer ${token}` },
});

      const p = res.data.profile;

      setSellerType(p.sellerType || "INDIVIDUAL");
      setPanNumber(p.panNumber || "");
      setPanName(p.panName || "");
      setBusinessName(p.businessName || "");

      setAddressLine1(p.addressLine1 || "");
      setAddressLine2(p.addressLine2 || "");
      setCity(p.city || "");
      setStateName(p.state || "");
      setPincode(p.pincode || "");

      setHasGST(!!p.hasGST);
      setGstType(p.gstType || "REGULAR");
      setGstNumber(p.gstNumber || "");
      setGstState(p.gstState || "");

      setBankAccountHolder(p.bankAccountHolder || "");
      setBankAccountNumber(p.bankAccountNumber || "");
      setBankIFSC(p.bankIFSC || "");
      setBankName(p.bankName || "");

      setSellerCategory(p.sellerCategory || "");
      setProfileCompleted(!!p.profileCompleted);
    } catch {
      Alert.alert("Error", "Failed to load seller profile");
    } finally {
      setInitialLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!panNumber || !addressLine1 || !stateName || !pincode) {
      Alert.alert("Validation", "Please fill all mandatory fields");
      return;
    }

    if (hasGST && !gstNumber) {
      Alert.alert("Validation", "GST number is required");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await API.post(
  `/seller/profile`,
        {
          sellerType,
          panNumber,
          panName,
          businessName,
          addressLine1,
          addressLine2,
          city,
          state: stateName,
          pincode,
          hasGST,
          gstType,
          gstNumber,
          gstState,
          bankAccountHolder,
          bankAccountNumber,
          bankIFSC,
          bankName,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Seller profile updated");
      loadProfile();
    } catch {
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.section}>Seller Identity</Text>

      <TextInput
        style={styles.input}
        placeholder="PAN Number"
        value={panNumber}
        onChangeText={setPanNumber}
        autoCapitalize="characters"
      />

      <TextInput
        style={styles.input}
        placeholder="PAN Name"
        value={panName}
        onChangeText={setPanName}
      />

      <Text style={styles.section}>Business & Address</Text>

      <TextInput
        style={styles.input}
        placeholder="Business / Shop Name"
        value={businessName}
        onChangeText={setBusinessName}
      />

      <TextInput
        style={styles.input}
        placeholder="Address Line 1"
        value={addressLine1}
        onChangeText={setAddressLine1}
      />

      <TextInput
        style={styles.input}
        placeholder="Address Line 2"
        value={addressLine2}
        onChangeText={setAddressLine2}
      />

      <TextInput
        style={styles.input}
        placeholder="City"
        value={city}
        onChangeText={setCity}
      />

      <TextInput
        style={styles.input}
        placeholder="State"
        value={stateName}
        onChangeText={setStateName}
      />

      <TextInput
        style={styles.input}
        placeholder="Pincode"
        value={pincode}
        onChangeText={setPincode}
        keyboardType="numeric"
      />

      // 🔽 ONLY GST SECTION BELOW IS MODIFIED (REST SAME)

<Text style={styles.section}>GST Information</Text>

<View style={styles.row}>
  <Text>Do you have GST?</Text>
  <Switch
    value={hasGST}
    onValueChange={(val) => {
      setHasGST(val);
      if (!val) {
        setGstType("REGULAR"); // reset safely
        setGstNumber("");
        setGstState("");
      }
    }}
  />
</View>

{hasGST && (
  <>
    {/* GST TYPE SELECTION */}
    <Text style={styles.subLabel}>GST Type</Text>

    <View style={styles.gstTypeRow}>
      <TouchableOpacity
        style={[
          styles.gstTypeBtn,
          gstType === "REGULAR" && styles.gstTypeActive,
        ]}
        onPress={() => setGstType("REGULAR")}
      >
        <Text
          style={[
            styles.gstTypeText,
            gstType === "REGULAR" &&
              styles.gstTypeTextActive,
          ]}
        >
          Regular GST
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.gstTypeBtn,
          gstType === "COMPOSITION" &&
            styles.gstTypeActive,
        ]}
        onPress={() => setGstType("COMPOSITION")}
      >
        <Text
          style={[
            styles.gstTypeText,
            gstType === "COMPOSITION" &&
              styles.gstTypeTextActive,
          ]}
        >
          Composition Scheme
        </Text>
      </TouchableOpacity>
    </View>

    <TextInput
      style={styles.input}
      placeholder="GST Number"
      value={gstNumber}
      onChangeText={setGstNumber}
      autoCapitalize="characters"
    />

    <TextInput
      style={styles.input}
      placeholder="GST Registered State"
      value={gstState}
      onChangeText={setGstState}
    />

    <View style={styles.infoBox}>
      <Text>
        {gstType === "COMPOSITION"
          ? "⚠ Composition sellers can sell only within their registered state"
          : "✔ Regular GST sellers can sell across India"}
      </Text>
    </View>
  </>
)}


      <Text style={styles.section}>Bank Details</Text>

      <TextInput
        style={styles.input}
        placeholder="Account Holder Name"
        value={bankAccountHolder}
        onChangeText={setBankAccountHolder}
      />

      <TextInput
        style={styles.input}
        placeholder="Account Number"
        value={bankAccountNumber}
        onChangeText={setBankAccountNumber}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="IFSC Code"
        value={bankIFSC}
        onChangeText={setBankIFSC}
        autoCapitalize="characters"
      />

      <TextInput
        style={styles.input}
        placeholder="Bank Name"
        value={bankName}
        onChangeText={setBankName}
      />

      <Text style={styles.section}>Profile Status</Text>
      <Text>Seller Category: {sellerCategory}</Text>
      <Text>Profile Completed: {profileCompleted ? "Yes" : "No"}</Text>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={saveProfile}
        disabled={loading}
      >
        <Text style={styles.saveText}>
          {loading ? "Saving..." : "Save Profile"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default SellerProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: { fontSize: 18, fontWeight: "bold", marginVertical: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: "#eef5ff",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: "#0A7AFF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  subLabel: {
  fontWeight: "bold",
  marginBottom: 6,
},

gstTypeRow: {
  flexDirection: "row",
  marginBottom: 12,
},

gstTypeBtn: {
  flex: 1,
  paddingVertical: 10,
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 6,
  marginRight: 8,
  alignItems: "center",
},

gstTypeActive: {
  backgroundColor: "#0A7AFF",
  borderColor: "#0A7AFF",
},

gstTypeText: {
  color: "#333",
  fontWeight: "600",
},

gstTypeTextActive: {
  color: "#fff",
},

  saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
