
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  useRoute,
  useNavigation,
} from "@react-navigation/native";

const AssistantDoctorWorkspaceScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { doctor, permissions, relationshipId } = route.params || {};

  const doctorId = doctor?._id || doctor?.id;

  const permissionItems = [
    {
      key: "viewAppointments",
      title: "View Appointments",
      description: "View appointment requests and schedules.",
    },
    {
      key: "respondToAppointments",
      title: "Respond to Appointments",
      description: "Accept or reject appointment requests.",
    },
    {
      key: "manageSlots",
      title: "Manage Appointment Slots",
      description: "Manage the doctor's available appointment slots.",
    },
    {
      key: "rescheduleAppointments",
      title: "Reschedule Appointments",
      description: "Reschedule existing appointments.",
    },
    {
      key: "viewPatientContact",
      title: "View Patient Contact",
      description: "View limited patient contact information.",
    },
    {
  key: "manageHospitalFees",
  title: "Manage Hospital Fees",
  description: "Manage hospital associations and consultation fees."
},
  ];

  const canViewAppointments =
    permissions?.viewAppointments === true;

  const canManageSlots =
    permissions?.manageSlots === true;

  const openAppointments = () => {
    if (!doctorId) {
      Alert.alert("Error", "Doctor information is missing.");
      return;
    }

    navigation.navigate("AssistantAppointments", {
      doctor,
      doctorId,
      permissions,
      relationshipId,
    });
  };

  const openAvailability = () => {
    if (!doctorId) {
      Alert.alert("Error", "Doctor information is missing.");
      return;
    }

    navigation.navigate("AssistantAvailability", {
      doctor,
      doctorId,
      permissions,
      relationshipId,
    });
  };
  const openHospitalManagement = () => {
  if (!doctorId) {
    Alert.alert("Error", "Doctor information is missing.");
    return;
  }

  navigation.navigate("DoctorHospitalEnrollment", {
    doctor,
    doctorId,
    permissions,
    relationshipId,
  });
};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.doctorName}>
          Dr. {doctor?.name || "Doctor"}
        </Text>

        <Text style={styles.specialization}>
          {doctor?.specialization || "Medical Professional"}
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            Active Relationship
          </Text>
        </View>
      </View>

      {/* WORKSPACE ACTIONS */}

      <Text style={styles.sectionTitle}>
        Doctor Workspace
      </Text>

      <Text style={styles.sectionSubtitle}>
        Access the tasks permitted by the doctor.
      </Text>

      {permissions?.manageHospitalFees === true && (
  <TouchableOpacity
    style={styles.actionButton}
    onPress={openHospitalManagement}
  >
    <Text style={styles.actionButtonText}>
      Manage Hospitals
    </Text>
  </TouchableOpacity>
)}

      {canViewAppointments && (
        <TouchableOpacity
          style={styles.actionCard}
          onPress={openAppointments}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.iconText}>📅</Text>
          </View>

          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>
              Appointments
            </Text>

            <Text style={styles.actionDescription}>
              View appointment schedules and manage requests
              according to your permissions.
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      )}
      

      {canManageSlots && (
        <TouchableOpacity
          style={styles.actionCard}
          onPress={openAvailability}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.iconText}>⏰</Text>
          </View>

          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>
              Manage Availability
            </Text>

            <Text style={styles.actionDescription}>
              View and manage the doctor's appointment slots.
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      )}

      {!canViewAppointments && !canManageSlots && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No workspace actions available
          </Text>

          <Text style={styles.emptyDescription}>
            The doctor has not enabled appointment or
            availability access for your account.
          </Text>
        </View>
      )}

      {/* PERMISSIONS */}

      <Text style={styles.sectionTitle}>
        Your Permissions
      </Text>

      <Text style={styles.sectionSubtitle}>
        These permissions are controlled by the doctor.
      </Text>

      {permissionItems.map((item) => {
        const enabled = permissions?.[item.key] === true;

        return (
          <View key={item.key} style={styles.permissionCard}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>
                {item.title}
              </Text>

              <Text style={styles.permissionDescription}>
                {item.description}
              </Text>
            </View>

            <View
              style={[
                styles.permissionBadge,
                enabled ? styles.enabled : styles.disabled,
              ]}
            >
              <Text
                style={[
                  styles.permissionStatus,
                  enabled ? styles.enabledText : styles.disabledText,
                ]}
              >
                {enabled ? "Allowed" : "Not allowed"}
              </Text>
            </View>
          </View>
        );
      })}

      <Text style={styles.notice}>
        You can only access information and perform actions that
        the doctor has permitted. Clinical decisions remain with
        the doctor.
      </Text>
    </ScrollView>
  );
};

export default AssistantDoctorWorkspaceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  content: {
    padding: 16,
    paddingBottom: 35,
  },
  header: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 16,
    marginBottom: 25,
    elevation: 2,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },
  specialization: {
    fontSize: 14,
    color: "#777",
    marginTop: 6,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e9f8ef",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
  },
  badgeText: {
    color: "#21864b",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#222",
    marginTop: 5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 5,
    marginBottom: 15,
  },
  actionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  iconText: {
    fontSize: 21,
  },
  actionInfo: {
    flex: 1,
    paddingRight: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  actionDescription: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 28,
    color: "#888",
  },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 22,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  emptyDescription: {
    fontSize: 13,
    color: "#777",
    lineHeight: 19,
    marginTop: 6,
  },
  permissionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
  },
  permissionInfo: {
    flex: 1,
    paddingRight: 8,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  permissionDescription: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
    lineHeight: 18,
  },
  permissionBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  enabled: {
    backgroundColor: "#e9f8ef",
  },
  disabled: {
    backgroundColor: "#f1f1f1",
  },
  permissionStatus: {
    fontSize: 11,
    fontWeight: "600",
  },
  enabledText: {
    color: "#21864b",
  },
  disabledText: {
    color: "#888",
  },
  notice: {
    fontSize: 12,
    color: "#777",
    lineHeight: 19,
    marginTop: 15,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  actionButton: {
  backgroundColor: "#ff6b81",
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 10,
  marginBottom: 12,
  alignItems: "center",
},

actionButtonText: {
  color: "#ffffff",
  fontSize: 15,
  fontWeight: "600",
},
});
