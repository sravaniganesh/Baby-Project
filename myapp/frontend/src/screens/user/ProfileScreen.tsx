import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  const getStageLabel = () => {
    switch (user?.womenCategory) {
      case "teen":
        return "Teen & College Life";
      case "married":
        return "Married Life";
      case "pregnant":
        return "Pregnancy";
      case "post_pregnancy":
        return "Post Pregnancy";
      default:
        return "Not Selected";
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ================= HEADER ================= */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>

        <Text style={styles.name}>{user?.name || "User"}</Text>
        <Text style={styles.username}>
          @{user?.username || "username"}
        </Text>

        <View style={styles.stageBadge}>
          <Text style={styles.stageText}>{getStageLabel()}</Text>
        </View>
      </View>

      {/* ================= USER INFO CARD (NEW) ================= */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📧 Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🆔 Username</Text>
          <Text style={styles.infoValue}>@{user?.username}</Text>
        </View>
      </View>

      {/* ================= ACTION CARDS ================= */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("UserOrders")}
        >
          <Text style={styles.cardTitle}>📦 My Orders</Text>
          <Text style={styles.cardSubtitle}>
            View your recent purchases
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("WomenOnboarding")}
        >
          <Text style={styles.cardTitle}>🌸 Update My Life Stage</Text>
          <Text style={styles.cardSubtitle}>
            Change your current life stage
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
  style={{
    padding: 12,
    backgroundColor: "#0A7AFF",
    borderRadius: 8,
    marginTop: 10,
  }}
  onPress={() => navigation.navigate("UserTransactions")}
>
  <Text style={{ color: "#fff", textAlign: "center" }}>
    View Transactions
  </Text>
</TouchableOpacity>

        {/* NEW: Future Username Edit Button */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("EditUsername")}
        >
          <Text style={styles.cardTitle}>✏️ Edit Username</Text>
          <Text style={styles.cardSubtitle}>
            You can change once every 30 days
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Wallet")}>
  <Text>Wallet</Text>
</TouchableOpacity>
      </View>

      {/* ================= LOGOUT ================= */}
      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.85}
        onPress={logout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  profileHeader: {
    alignItems: "center",
    marginBottom: 25,
  },

  avatar: {
    width: 95,
    height: 95,
    borderRadius: 50,
    backgroundColor: "#ff5a5f",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    elevation: 4,
  },

  avatarText: {
    fontSize: 36,
    color: "#fff",
    fontWeight: "700",
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },

  username: {
    fontSize: 15,
    color: "#777",
    marginTop: 4,
  },

  stageBadge: {
    marginTop: 12,
    backgroundColor: "#ffecec",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },

  stageText: {
    color: "#ff5a5f",
    fontWeight: "600",
    fontSize: 13,
  },

  /* NEW INFO CARD */
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    elevation: 2,
  },

  infoRow: {
    marginVertical: 6,
  },

  infoLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },

  section: {
    gap: 14,
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 13,
    color: "#777",
  },

  logoutBtn: {
    marginTop: 35,
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
