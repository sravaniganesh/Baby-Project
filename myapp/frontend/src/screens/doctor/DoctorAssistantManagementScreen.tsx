
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import API from "../../config/api";

type Permissions = {
  viewAppointments: boolean;
  respondToAppointments: boolean;
  manageSlots: boolean;
  rescheduleAppointments: boolean;
  viewPatientContact: boolean;
};

type AssistantRelationship = {
  _id: string;
  assistantId: {
    _id: string;
    name?: string;
    email?: string;
    username?: string;
  } | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";
  permissions: Permissions;
  invitedAt?: string;
};

const defaultPermissions: Permissions = {
  viewAppointments: true,
  respondToAppointments: false,
  manageSlots: false,
  rescheduleAppointments: false,
  viewPatientContact: false,
};

const permissionLabels: {
  key: keyof Permissions;
  title: string;
  description: string;
}[] = [
  {
    key: "viewAppointments",
    title: "View Appointments",
    description: "View your appointment schedule",
  },
  {
    key: "respondToAppointments",
    title: "Respond to Appointments",
    description: "Respond to appointment requests",
  },
  {
    key: "manageSlots",
    title: "Manage Availability",
    description: "Manage your available time slots",
  },
  {
    key: "rescheduleAppointments",
    title: "Reschedule Appointments",
    description: "Reschedule existing appointments",
  },
  {
    key: "viewPatientContact",
    title: "View Patient Contact",
    description: "Access patient contact information",
  },
];

const DoctorAssistantManagementScreen = () => {
  const [identifier, setIdentifier] = useState("");
  const [relationships, setRelationships] = useState<
    AssistantRelationship[]
  >([]);
  const [draftPermissions, setDraftPermissions] = useState<
    Record<string, Permissions>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  /* ================= LOAD ASSISTANTS ================= */

  const loadAssistants = async () => {
    try {
      const response = await API.get("/doctor-assistants/my");

      const list = response.data?.relationships || [];
      setRelationships(list);

      const drafts: Record<string, Permissions> = {};

      list.forEach((item: AssistantRelationship) => {
        drafts[item._id] = {
          ...defaultPermissions,
          ...item.permissions,
        };
      });

      setDraftPermissions(drafts);
    } catch (error: any) {
      console.log(
        "ASSISTANT LIST ERROR:",
        error?.response?.data || error.message
      );

      Alert.alert("Error", "Unable to load assistants.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchData = async () => {
        setLoading(true);
        try {
          await loadAssistants();
        } finally {
          if (active) setLoading(false);
        }
      };

      fetchData();

      return () => {
        active = false;
      };
    }, [])
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadAssistants();
    setRefreshing(false);
  };

  /* ================= INVITE ASSISTANT ================= */

  const sendInvitation = async () => {
    const value = identifier.trim().toLowerCase();

    if (!value) {
      Alert.alert("Required", "Enter an email address or username.");
      return;
    }

    const isEmail = value.includes("@");

    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      Alert.alert("Invalid Email", "Enter a valid email address.");
      return;
    }

    try {
      setSending(true);

      const payload = isEmail
        ? { email: value, permissions: defaultPermissions }
        : { username: value, permissions: defaultPermissions };

      const response = await API.post(
        "/doctor-assistants/invite",
        payload
      );

      setIdentifier("");

      Alert.alert(
        "Invitation Sent",
        response.data?.message || "Assistant invitation sent successfully."
      );

      await loadAssistants();
    } catch (error: any) {
      Alert.alert(
        "Invitation Failed",
        error?.response?.data?.message ||
          "Unable to send invitation. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  /* ================= UPDATE DRAFT PERMISSIONS ================= */

  const togglePermission = (
    relationshipId: string,
    permission: keyof Permissions,
    value: boolean
  ) => {
    setDraftPermissions((previous) => ({
      ...previous,
      [relationshipId]: {
        ...(previous[relationshipId] || defaultPermissions),
        [permission]: value,
      },
    }));
  };

  /* ================= SAVE PERMISSIONS ================= */

  const savePermissions = async (relationshipId: string) => {
    try {
      setSavingId(relationshipId);

      const permissions =
        draftPermissions[relationshipId] || defaultPermissions;

      const response = await API.patch(
        `/doctor-assistants/${relationshipId}/permissions`,
        { permissions }
      );

      Alert.alert(
        "Updated",
        response.data?.message || "Permissions updated successfully."
      );

      await loadAssistants();
    } catch (error: any) {
      Alert.alert(
        "Update Failed",
        error?.response?.data?.message ||
          "Unable to update assistant permissions."
      );
    } finally {
      setSavingId(null);
    }
  };

  /* ================= REVOKE ACCESS ================= */

  const revokeAssistant = (relationshipId: string, name: string) => {
    Alert.alert(
      "Revoke Assistant Access",
      `Are you sure you want to revoke ${name}'s access?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Revoke Access",
          style: "destructive",
          onPress: async () => {
            try {
              setSavingId(relationshipId);

              const response = await API.patch(
                `/doctor-assistants/${relationshipId}/revoke`
              );

              Alert.alert(
                "Access Revoked",
                response.data?.message || "Assistant access revoked."
              );

              await loadAssistants();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "Unable to revoke assistant access."
              );
            } finally {
              setSavingId(null);
            }
          },
        },
      ]
    );
  };

  /* ================= STATUS DISPLAY ================= */

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return styles.acceptedBadge;
      case "PENDING":
        return styles.pendingBadge;
      case "DECLINED":
        return styles.declinedBadge;
      default:
        return styles.revokedBadge;
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Loading assistant management...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Assistant Team</Text>
        <Text style={styles.headerSubtitle}>
          Invite trusted users to help manage your practice.
          You control their access and permissions.
        </Text>
      </View>

      {/* INVITE CARD */}

      <View style={styles.inviteCard}>
        <View style={styles.inviteHeader}>
          <View style={styles.inviteIcon}>
            <Text style={styles.inviteIconText}>＋</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.inviteTitle}>Invite an Assistant</Text>
            <Text style={styles.inviteSubtitle}>
              Invite an existing registered user
            </Text>
          </View>
        </View>

        <Text style={styles.inputLabel}>Email or Username</Text>

        <TextInput
          style={styles.input}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="Enter email or username"
          placeholderTextColor="#A0ADB1"
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!sending}
        />

        <View style={styles.defaultInfo}>
          <Text style={styles.defaultInfoText}>
            Default access: View appointments only. You can change
            permissions after the user accepts your invitation.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.inviteButton, sending && styles.disabledButton]}
          activeOpacity={0.85}
          onPress={sendInvitation}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.inviteButtonText}>Send Invitation</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ASSISTANT LIST */}

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Your Assistants</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{relationships.length}</Text>
        </View>
      </View>

      {relationships.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>👩‍💻</Text>
          <Text style={styles.emptyTitle}>No Assistants Yet</Text>
          <Text style={styles.emptySubtitle}>
            Invite an existing user to start building your assistant team.
          </Text>
        </View>
      ) : (
        relationships.map((item) => {
          const assistant = item.assistantId;
          const assistantName = assistant?.name || "User";
          const permissions =
            draftPermissions[item._id] || defaultPermissions;

          const isAccepted = item.status === "ACCEPTED";
          const isBusy = savingId === item._id;

          return (
            <View key={item._id} style={styles.assistantCard}>
              <View style={styles.assistantHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {assistantName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.assistantDetails}>
                  <Text style={styles.assistantName}>
                    {assistantName}
                  </Text>

                  <Text style={styles.assistantEmail}>
                    {assistant?.email || assistant?.username || ""}
                  </Text>
                </View>

                <View style={getStatusStyle(item.status)}>
                  <Text style={styles.statusText}>
                    {item.status}
                  </Text>
                </View>
              </View>

              {isAccepted && (
                <>
                  <View style={styles.permissionDivider} />

                  <Text style={styles.permissionHeading}>
                    Assistant Permissions
                  </Text>

                  {permissionLabels.map((permission) => (
                    <View
                      key={permission.key}
                      style={styles.permissionRow}
                    >
                      <View style={styles.permissionInfo}>
                        <Text style={styles.permissionTitle}>
                          {permission.title}
                        </Text>
                        <Text style={styles.permissionDescription}>
                          {permission.description}
                        </Text>
                      </View>

                      <Switch
                        value={permissions[permission.key]}
                        onValueChange={(value) =>
                          togglePermission(
                            item._id,
                            permission.key,
                            value
                          )
                        }
                        trackColor={{
                          false: "#D8E0E3",
                          true: "#91D5C9",
                        }}
                        thumbColor={
                          permissions[permission.key]
                            ? "#0F766E"
                            : "#F4F4F4"
                        }
                        disabled={isBusy}
                      />
                    </View>
                  ))}

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      isBusy && styles.disabledButton,
                    ]}
                    onPress={() => savePermissions(item._id)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>
                        Save Permissions
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {item.status === "PENDING" && (
                <Text style={styles.statusDescription}>
                  Waiting for the user to accept your invitation.
                </Text>
              )}

              {item.status === "DECLINED" && (
                <Text style={styles.statusDescription}>
                  This user declined the invitation.
                  You can send a new invitation using the form above.
                </Text>
              )}

              {item.status === "REVOKED" && (
                <Text style={styles.statusDescription}>
                  Access to your workspace has been revoked.
                </Text>
              )}

              {(item.status === "PENDING" ||
                item.status === "ACCEPTED") && (
                <TouchableOpacity
                  style={styles.revokeButton}
                  onPress={() =>
                    revokeAssistant(item._id, assistantName)
                  }
                  disabled={isBusy}
                >
                  <Text style={styles.revokeButtonText}>
                    Revoke Access
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      <Text style={styles.footer}>
        You remain in control of your assistant relationships and access.
      </Text>
    </ScrollView>
  );
};

export default DoctorAssistantManagementScreen;

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
    marginBottom: 22,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#183B46",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#718096",
    lineHeight: 20,
    marginTop: 7,
  },
  inviteCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E1ECEC",
    marginBottom: 27,
    elevation: 2,
    shadowColor: "#315B66",
    shadowOpacity: 0.07,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
  },
  inviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  inviteIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#DDF3F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  inviteIconText: {
    fontSize: 27,
    color: "#0F766E",
    fontWeight: "600",
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#183B46",
  },
  inviteSubtitle: {
    fontSize: 12,
    color: "#829198",
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#40545B",
    marginBottom: 8,
  },
  input: {
    height: 51,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DFE8EA",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#183B46",
    backgroundColor: "#FAFCFC",
  },
  defaultInfo: {
    backgroundColor: "#EFF8F6",
    padding: 12,
    borderRadius: 11,
    marginTop: 13,
  },
  defaultInfoText: {
    color: "#52736F",
    fontSize: 11,
    lineHeight: 17,
  },
  inviteButton: {
    backgroundColor: "#0F766E",
    padding: 15,
    borderRadius: 13,
    alignItems: "center",
    marginTop: 16,
  },
  inviteButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#183B46",
  },
  totalBadge: {
    backgroundColor: "#DDF3F0",
    borderRadius: 15,
    minWidth: 27,
    height: 27,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 9,
  },
  totalText: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EFF1",
  },
  emptyIcon: {
    fontSize: 35,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    color: "#183B46",
    fontWeight: "800",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#829198",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 7,
  },
  assistantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5ECEE",
    elevation: 2,
    shadowColor: "#315B66",
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
  },
  assistantHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: "#DDF3F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    color: "#0F766E",
    fontWeight: "800",
  },
  assistantDetails: {
    flex: 1,
  },
  assistantName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#183B46",
  },
  assistantEmail: {
    fontSize: 11,
    color: "#829198",
    marginTop: 4,
  },
  acceptedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },
  declinedBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },
  revokedBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#43535A",
  },
  permissionDivider: {
    height: 1,
    backgroundColor: "#EDF1F2",
    marginVertical: 16,
  },
  permissionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#183B46",
    marginBottom: 7,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F3F4",
  },
  permissionInfo: {
    flex: 1,
    paddingRight: 8,
  },
  permissionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#40545B",
  },
  permissionDescription: {
    fontSize: 10,
    color: "#91A0A5",
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: "#0F766E",
    padding: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  statusDescription: {
    fontSize: 11,
    color: "#829198",
    lineHeight: 17,
    marginTop: 13,
  },
  revokeButton: {
    borderWidth: 1,
    borderColor: "#F2CACA",
    padding: 11,
    borderRadius: 11,
    alignItems: "center",
    marginTop: 15,
    backgroundColor: "#FFF7F7",
  },
  revokeButtonText: {
    color: "#D94841",
    fontWeight: "700",
    fontSize: 12,
  },
  footer: {
    textAlign: "center",
    color: "#91A0A5",
    fontSize: 11,
    marginTop: 17,
    lineHeight: 18,
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
