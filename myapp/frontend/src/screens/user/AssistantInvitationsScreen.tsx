
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  getAssistantInvitations,
  acceptAssistantInvitation,
  declineAssistantInvitation,
} from "../../services/assistantService";

const AssistantInvitationsScreen = () => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    try {
      const response = await getAssistantInvitations();
      setInvitations(response.invitations || []);
    } catch (error) {
      console.log("Load assistant invitations error:", error);
      Alert.alert("Error", "Unable to load invitations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleAccept = async (id: string) => {
    try {
      setProcessingId(id);

      await acceptAssistantInvitation(id);

      Alert.alert(
        "Invitation Accepted",
        "You can now access this doctor's assistant workspace."
      );

      await loadInvitations();
    } catch (error) {
      console.log("Accept invitation error:", error);
      Alert.alert("Error", "Unable to accept this invitation.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    Alert.alert(
      "Decline Invitation",
      "Are you sure you want to decline this invitation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(id);

              await declineAssistantInvitation(id);

              await loadInvitations();

              Alert.alert("Done", "Invitation declined.");
            } catch (error) {
              console.log("Decline invitation error:", error);
              Alert.alert("Error", "Unable to decline this invitation.");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff5a5f" />
        <Text style={styles.loadingText}>Loading invitations...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>Doctor Invitations</Text>

      <Text style={styles.subtitle}>
        Doctors who invite you to assist them will appear here.
      </Text>

      {invitations.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No Pending Invitations
          </Text>

          <Text style={styles.emptyText}>
            You don't have any new doctor invitations right now.
          </Text>
        </View>
      ) : (
        invitations.map((item) => {
          const doctor = item.doctorId;
          const isProcessing = processingId === item._id;

          return (
            <View key={item._id} style={styles.card}>
              <Text style={styles.doctorName}>
                Dr. {doctor?.name || "Doctor"}
              </Text>

              <Text style={styles.specialization}>
                {doctor?.specialization || "Medical Professional"}
              </Text>

              <Text style={styles.description}>
                This doctor has invited you to join their assistant team.
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  disabled={!!processingId}
                  onPress={() => handleAccept(item._id)}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.acceptText}>Accept</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.declineButton}
                  disabled={!!processingId}
                  onPress={() => handleDecline(item._id)}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

export default AssistantInvitationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  content: {
    padding: 16,
    paddingBottom: 35,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#777",
  },
  heading: {
    fontSize: 23,
    fontWeight: "700",
    color: "#222",
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 7,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  specialization: {
    fontSize: 14,
    color: "#ff5a5f",
    marginTop: 5,
  },
  description: {
    fontSize: 13,
    color: "#777",
    marginTop: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#ff5a5f",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptText: {
    color: "#fff",
    fontWeight: "700",
  },
  declineButton: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  declineText: {
    color: "#444",
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
  },
  emptyText: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
  },
});
