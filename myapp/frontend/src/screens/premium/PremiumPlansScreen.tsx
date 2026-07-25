import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const PremiumPlansScreen = () => {
  const navigation = useNavigation<any>();

  const handleBack = () => {
    // ✅ SAFETY: only goBack if possible
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // fallback (should rarely happen)
navigation.goBack()    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* HEADER */}
      <Text style={styles.title}>Go Premium ✨</Text>
      <Text style={styles.subtitle}>
        Unlock unlimited doctor consultations and priority support
      </Text>

      {/* BENEFITS */}
      <View style={styles.benefitBox}>
        <Text style={styles.benefit}>✔ Unlimited doctor chat</Text>
        <Text style={styles.benefit}>✔ Priority response</Text>
        <Text style={styles.benefit}>✔ Chat history saved</Text>
        <Text style={styles.benefit}>✔ Future premium features</Text>
      </View>

      {/* MONTHLY PLAN */}
      <View style={styles.planCard}>
        <Text style={styles.planTitle}>Monthly Plan</Text>
        <Text style={styles.planPrice}>₹199 / month</Text>

        <TouchableOpacity
          style={styles.planBtn}
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "Payment integration will be enabled next"
            )
          }
        >
          <Text style={styles.planBtnText}>Upgrade Now</Text>
        </TouchableOpacity>
      </View>

      {/* YEARLY PLAN */}
      <View style={styles.planCard}>
        <Text style={styles.planTitle}>Yearly Plan</Text>
        <Text style={styles.planPrice}>₹1999 / year (Save 15%)</Text>

        <TouchableOpacity
          style={[styles.planBtn, styles.bestPlan]}
          onPress={() =>
            Alert.alert(
              "Coming Soon",
              "Payment integration will be enabled next"
            )
          }
        >
          <Text style={styles.planBtnText}>Best Value</Text>
        </TouchableOpacity>
      </View>

      {/* BACK */}
      <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
        <Text style={styles.backText}>← Back to Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default PremiumPlansScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
  },
  benefitBox: {
    marginTop: 16,
    backgroundColor: "#EEF2FF",
    padding: 14,
    borderRadius: 12,
  },
  benefit: {
    fontSize: 14,
    marginBottom: 6,
    color: "#1F2937",
  },
  planCard: {
    marginTop: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    elevation: 3,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  planPrice: {
    fontSize: 16,
    marginTop: 6,
    color: "#0A7AFF",
    fontWeight: "600",
  },
  planBtn: {
    marginTop: 14,
    backgroundColor: "#0A7AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  bestPlan: {
    backgroundColor: "#22C55E",
  },
  planBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  backBtn: {
    marginTop: 28,
    alignItems: "center",
  },
  backText: {
    color: "#0A7AFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
