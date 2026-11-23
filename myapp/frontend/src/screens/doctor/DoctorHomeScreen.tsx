
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import API from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const DoctorHomeScreen = () => {
  const navigation = useNavigation<any>();

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { logout } = useAuth();

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/doctor/profile");
        const doc = res.data?.doctor || res.data;
        setDoctor(doc);
      } catch (error) {
        Alert.alert("Error", "Failed to load doctor profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Preparing your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.title}>Doctor Dashboard</Text>
        </View>

        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>⚕</Text>
        </View>
      </View>

      {/* DOCTOR PROFILE */}
      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {doctor?.name?.charAt(0)?.toUpperCase() || "D"}
            </Text>
          </View>

          <View style={styles.profileDetails}>
            <Text style={styles.name}>
              Dr. {doctor?.name || "Doctor"}
            </Text>

            <Text style={styles.specialization}>
              {doctor?.specialization || "Medical Professional"}
            </Text>
          </View>

          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓</Text>
          </View>
        </View>

        <View style={styles.profileDivider} />

        <Text style={styles.email}>
          ✉  {doctor?.email || "Email not available"}
        </Text>
      </View>

      {/* QUICK ACTIONS */}
      <Text style={styles.sectionTitle}>Practice Management</Text>

      <TouchableOpacity
        style={styles.consultationCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("DoctorConsultations")}
      >
        <View style={styles.actionIconBlue}>
          <Text style={styles.actionIconText}>📋</Text>
        </View>

        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>My Consultations</Text>
          <Text style={styles.actionSubtitle}>
            View and manage patient consultations
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("DoctorHospitalEnrollment")}
      >
        <View style={styles.actionIconGreen}>
          <Text style={styles.actionIconText}>🏥</Text>
        </View>

        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>My Hospitals</Text>
          <Text style={styles.actionSubtitle}>
            Find hospitals and manage associations
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* ASSISTANT MANAGEMENT */}
      <Text style={styles.sectionTitle}>Team Management</Text>

      <View style={styles.assistantCard}>
        <View style={styles.assistantTop}>
          <View style={styles.assistantIcon}>
            <Text style={styles.assistantIconText}>👩‍💻</Text>
          </View>

          <View style={styles.assistantInfo}>
            <Text style={styles.assistantTitle}>
              Manage Assistants
            </Text>

            <Text style={styles.assistantSubtitle}>
              Invite and manage people who assist with your practice
            </Text>
          </View>
        </View>

        <View style={styles.assistantDivider} />

        <View style={styles.assistantFeatures}>
          <Text style={styles.featureText}>✓  Invite existing users</Text>
          <Text style={styles.featureText}>✓  Manage individual permissions</Text>
          <Text style={styles.featureText}>✓  Revoke access anytime</Text>
        </View>

        <TouchableOpacity
          style={styles.inviteButton}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate("DoctorAssistantManagement")
          }
        >
          <Text style={styles.inviteButtonText}>
            +  Manage Assistants
          </Text>
        </TouchableOpacity>
      </View>

      {/* OTHER SETTINGS */}
      <Text style={styles.sectionTitle}>Account Settings</Text>

      <TouchableOpacity
        style={styles.menuCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("DoctorPricing")}
      >
        <View style={styles.actionIconPurple}>
          <Text style={styles.actionIconText}>💰</Text>
        </View>

        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Manage Pricing</Text>
          <Text style={styles.actionSubtitle}>
            Set your consultation charges
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("DoctorProfile")}
      >
        <View style={styles.actionIconOrange}>
          <Text style={styles.actionIconText}>👤</Text>
        </View>

        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>My Profile</Text>
          <Text style={styles.actionSubtitle}>
            View and update your professional details
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* LOGOUT */}
      <TouchableOpacity
        style={styles.logoutButton}
        activeOpacity={0.85}
        onPress={logout}
      >
        <Text style={styles.logoutIcon}>↪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Your practice, your team, your control.
      </Text>
    </ScrollView>
  );
};

export default DoctorHomeScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FA",
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  greeting: {
    color: "#718096",
    fontSize: 13,
    marginBottom: 4,
  },

  title: {
    color: "#183B46",
    fontSize: 23,
    fontWeight: "800",
  },

  headerIcon: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: "#DDF3F0",
    justifyContent: "center",
    alignItems: "center",
  },

  headerIconText: {
    fontSize: 27,
    color: "#0F766E",
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    padding: 19,
    borderRadius: 21,
    marginBottom: 27,
    borderWidth: 1,
    borderColor: "#E8EFF1",
    elevation: 3,
    shadowColor: "#315B66",
    shadowOpacity: 0.07,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "#DDF3F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  avatarText: {
    color: "#0F766E",
    fontSize: 25,
    fontWeight: "800",
  },

  profileDetails: {
    flex: 1,
  },

  name: {
    fontSize: 17,
    color: "#183B46",
    fontWeight: "800",
  },

  specialization: {
    fontSize: 12,
    color: "#0F766E",
    fontWeight: "600",
    marginTop: 5,
  },

  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },

  verifiedText: {
    color: "#15803D",
    fontWeight: "800",
  },

  profileDivider: {
    height: 1,
    backgroundColor: "#EDF1F2",
    marginVertical: 15,
  },

  email: {
    fontSize: 12,
    color: "#718096",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#183B46",
    marginBottom: 13,
    marginLeft: 2,
  },

  consultationCard: {
    backgroundColor: "#EAF3FF",
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
    borderWidth: 1,
    borderColor: "#DCEAFF",
  },

  menuCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
    borderWidth: 1,
    borderColor: "#E9EFF1",
    elevation: 1,
  },

  actionIconBlue: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#D8E9FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  actionIconGreen: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#DDF3E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  actionIconPurple: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#EEE7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  actionIconOrange: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#FFF0DF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  actionIconText: {
    fontSize: 21,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#263E47",
  },

  actionSubtitle: {
    fontSize: 11,
    color: "#829198",
    marginTop: 5,
  },

  arrow: {
    fontSize: 27,
    color: "#A5B4B9",
    marginLeft: 8,
  },

  assistantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 21,
    padding: 17,
    marginBottom: 27,
    borderWidth: 1,
    borderColor: "#DCEDEB",
    elevation: 2,
    shadowColor: "#315B66",
    shadowOpacity: 0.07,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
  },

  assistantTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  assistantIcon: {
    width: 51,
    height: 51,
    borderRadius: 17,
    backgroundColor: "#DDF3F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  assistantIconText: {
    fontSize: 23,
  },

  assistantInfo: {
    flex: 1,
  },

  assistantTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#164B49",
  },

  assistantSubtitle: {
    fontSize: 11,
    color: "#788D91",
    marginTop: 5,
    lineHeight: 17,
  },

  assistantDivider: {
    height: 1,
    backgroundColor: "#EDF3F2",
    marginVertical: 15,
  },

  assistantFeatures: {
    gap: 9,
    marginBottom: 17,
  },

  featureText: {
    color: "#52736F",
    fontSize: 12,
    fontWeight: "600",
  },

  inviteButton: {
    backgroundColor: "#0F766E",
    paddingVertical: 14,
    borderRadius: 13,
    alignItems: "center",
  },

  inviteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  logoutButton: {
    backgroundColor: "#FFF1F0",
    borderWidth: 1,
    borderColor: "#FADBD8",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 12,
  },

  logoutIcon: {
    color: "#D94841",
    fontSize: 19,
    marginRight: 8,
  },

  logoutText: {
    color: "#D94841",
    fontSize: 14,
    fontWeight: "800",
  },

  footer: {
    textAlign: "center",
    color: "#9AADB0",
    fontSize: 11,
    marginTop: 20,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F8FA",
  },

  loadingText: {
    marginTop: 12,
    color: "#718096",
    fontSize: 13,
  },
});
