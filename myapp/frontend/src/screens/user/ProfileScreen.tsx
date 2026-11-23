
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import {
  getAssistantInvitations,
  getAssistantWorkspaces,
} from "../../services/assistantService";

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  const [invitationCount, setInvitationCount] = useState(0);
  const [workspaceCount, setWorkspaceCount] = useState(0);
  const [assistantLoading, setAssistantLoading] = useState(true);

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

  // Refresh assistant information whenever Profile is opened
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadAssistantData = async () => {
        setAssistantLoading(true);

        try {
          const [invitationResult, workspaceResult] =
            await Promise.allSettled([
              getAssistantInvitations(),
              getAssistantWorkspaces(),
            ]);

          if (!isActive) return;

          if (invitationResult.status === "fulfilled") {
            const invitations =
              invitationResult.value?.invitations || [];
            setInvitationCount(invitations.length);
          }

          if (workspaceResult.status === "fulfilled") {
            const workspaces =
              workspaceResult.value?.workspaces || [];
            setWorkspaceCount(workspaces.length);
          }
        } catch (error) {
          console.log("Assistant profile loading error:", error);
        } finally {
          if (isActive) {
            setAssistantLoading(false);
          }
        }
      };

      loadAssistantData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const showAssistantSection =
    invitationCount > 0 || workspaceCount > 0;

  const MenuCard = ({
    icon,
    title,
    subtitle,
    onPress,
  }: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={styles.menuCard}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={styles.menuIcon}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>

      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* PROFILE HEADER */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>
        </View>

        <Text style={styles.name}>{user?.name || "User"}</Text>

        <Text style={styles.username}>
          @{user?.username || "username"}
        </Text>

        <View style={styles.stageBadge}>
          <Text style={styles.stageIcon}>✿</Text>
          <Text style={styles.stageText}>{getStageLabel()}</Text>
        </View>
      </View>

      {/* PERSONAL INFORMATION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Text>✉</Text>
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>
                {user?.email || "Not available"}
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Text>@</Text>
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>
                @{user?.username || "username"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ACCOUNT MENU */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Account</Text>

        <View style={styles.menuList}>
          <MenuCard
            icon="📦"
            title="My Orders"
            subtitle="Track and manage your purchases"
            onPress={() => navigation.navigate("UserOrders")}
          />

          <MenuCard
            icon="🌸"
            title="My Life Stage"
            subtitle="Update your current life stage"
            onPress={() => navigation.navigate("WomenOnboarding")}
          />

          <MenuCard
            icon="💳"
            title="Transactions"
            subtitle="View your payment history"
            onPress={() => navigation.navigate("UserTransactions")}
          />

          <MenuCard
            icon="✏️"
            title="Edit Username"
            subtitle="Update your profile username"
            onPress={() => navigation.navigate("EditUsername")}
          />

          <MenuCard
            icon="👛"
            title="My Wallet"
            subtitle="Manage your wallet and balance"
            onPress={() => navigation.navigate("Wallet")}
          />
        </View>
      </View>

      {/* DOCTOR ASSISTANT */}
      {showAssistantSection && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctor Assistant</Text>

          <View style={styles.assistantCard}>
            <View style={styles.assistantHeader}>
              <View style={styles.assistantIcon}>
                <Text style={styles.assistantIconText}>🩺</Text>
              </View>

              <View style={styles.assistantHeaderContent}>
                <Text style={styles.assistantTitle}>
                  Assistant Workspace
                </Text>
                <Text style={styles.assistantSubtitle}>
                  Manage your doctor invitations and workspaces
                </Text>
              </View>
            </View>

            {invitationCount > 0 && (
              <TouchableOpacity
                style={styles.assistantAction}
                activeOpacity={0.75}
                onPress={() =>
                  navigation.navigate("AssistantInvitations")
                }
              >
                <View>
                  <Text style={styles.assistantActionTitle}>
                    Pending Invitations
                  </Text>
                  <Text style={styles.assistantActionSubtitle}>
                    Review and respond to doctor invitations
                  </Text>
                </View>

                <View style={styles.countBadge}>
                  <Text style={styles.countText}>
                    {invitationCount}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {workspaceCount > 0 && (
              <TouchableOpacity
                style={styles.assistantAction}
                activeOpacity={0.75}
                onPress={() =>
                  navigation.navigate("AssistantWorkspace")
                }
              >
                <View>
                  <Text style={styles.assistantActionTitle}>
                    My Doctor Workspaces
                  </Text>
                  <Text style={styles.assistantActionSubtitle}>
                    Access your accepted doctor workspaces
                  </Text>
                </View>

                <View style={styles.countBadge}>
                  <Text style={styles.countText}>
                    {workspaceCount}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* LOGOUT */}
      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.8}
        onPress={logout}
      >
        <Text style={styles.logoutIcon}>↪</Text>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Made with love for every stage of her journey ♡
      </Text>
    </ScrollView>
  );
};

export default ProfileScreen;

// STYLES

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9FA",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 45,
  },

  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },

  avatarOuter: {
    padding: 5,
    borderRadius: 60,
    backgroundColor: "#FCE4EC",
    marginBottom: 13,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#E86A91",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  avatarText: {
    fontSize: 35,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  name: {
    fontSize: 23,
    fontWeight: "800",
    color: "#30232A",
    letterSpacing: 0.3,
  },

  username: {
    fontSize: 14,
    color: "#9A8790",
    marginTop: 4,
  },

  stageBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCE8EF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    marginTop: 13,
  },

  stageIcon: {
    color: "#D94F7D",
    fontSize: 15,
    marginRight: 6,
  },

  stageText: {
    color: "#C74370",
    fontWeight: "700",
    fontSize: 12,
  },

  section: {
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#34252D",
    marginBottom: 13,
    marginLeft: 3,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 17,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#F4E8ED",
    elevation: 2,
    shadowColor: "#D8A9B9",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },

  infoIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: "#FFF0F4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    color: "#A08D95",
    fontSize: 12,
    marginBottom: 4,
  },

  infoValue: {
    color: "#352830",
    fontSize: 14,
    fontWeight: "700",
  },

  infoDivider: {
    height: 1,
    backgroundColor: "#F5EDF0",
    marginLeft: 52,
  },

  menuList: {
    gap: 11,
  },

  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3E8ED",
    elevation: 2,
    shadowColor: "#D8A9B9",
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
  },

  menuIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#FFF0F4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  menuIconText: {
    fontSize: 21,
  },

  menuContent: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#352830",
  },

  menuSubtitle: {
    fontSize: 12,
    color: "#9A8991",
    marginTop: 4,
  },

  arrow: {
    fontSize: 27,
    color: "#C7AAB5",
    marginLeft: 8,
  },

  assistantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F2DCE5",
    elevation: 2,
    shadowColor: "#D8A9B9",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  assistantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  assistantIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FCE8EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  assistantIconText: {
    fontSize: 23,
  },

  assistantHeaderContent: {
    flex: 1,
  },

  assistantTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3C2932",
  },

  assistantSubtitle: {
    fontSize: 11,
    color: "#9A8991",
    marginTop: 4,
  },

  assistantAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: "#F5E9EE",
  },

  assistantActionTitle: {
    color: "#49313D",
    fontSize: 13,
    fontWeight: "700",
  },

  assistantActionSubtitle: {
    color: "#A08D95",
    fontSize: 11,
    marginTop: 4,
  },

  countBadge: {
    minWidth: 29,
    height: 29,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: "#E86A91",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  countText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#FFF0F2",
    borderWidth: 1,
    borderColor: "#F7D8E1",
    padding: 16,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },

  logoutIcon: {
    color: "#D64D70",
    fontSize: 19,
    marginRight: 9,
  },

  logoutText: {
    color: "#D64D70",
    fontWeight: "800",
    fontSize: 15,
  },

  footerText: {
    textAlign: "center",
    color: "#B59AA5",
    fontSize: 11,
    marginTop: 22,
  },
});
