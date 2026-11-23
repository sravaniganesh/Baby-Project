
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { getAssistantWorkspaces } from "../../services/assistantService";

const AssistantWorkspaceScreen = () => {
  const navigation = useNavigation<any>();

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkspaces = useCallback(async () => {
    try {
      const response = await getAssistantWorkspaces();
      setWorkspaces(response.workspaces || []);
    } catch (error) {
      console.log("Load assistant workspaces error:", error);
      Alert.alert("Error", "Unable to load doctor workspaces.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkspaces();
    }, [loadWorkspaces])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff5a5f" />
        <Text style={styles.loadingText}>Loading workspaces...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>My Doctor Workspaces</Text>

      <Text style={styles.subtitle}>
        Manage your assistant responsibilities for each doctor.
      </Text>

      {workspaces.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Active Workspaces</Text>
          <Text style={styles.emptyText}>
            Once you accept a doctor's invitation, their workspace will appear here.
          </Text>
        </View>
      ) : (
        workspaces.map((item) => (
          <TouchableOpacity
            key={item.relationshipId}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("AssistantDoctorWorkspace", {
                relationshipId: item.relationshipId,
                doctor: item.doctor,
                permissions: item.permissions,
              })
            }
          >
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.doctor?.name?.charAt(0)?.toUpperCase() || "D"}
                </Text>
              </View>

              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>
                  Dr. {item.doctor?.name || "Doctor"}
                </Text>

                <Text style={styles.specialization}>
                  {item.doctor?.specialization || "Medical Professional"}
                </Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Active Workspace</Text>
            </View>

            <Text style={styles.tapText}>
              Tap to open workspace
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

export default AssistantWorkspaceScreen;

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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffecec",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ff5a5f",
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },
  specialization: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
  arrow: {
    fontSize: 28,
    color: "#999",
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e9f8ef",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#21864b",
  },
  tapText: {
    fontSize: 12,
    color: "#888",
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 16,
    alignItems: "center",
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
    lineHeight: 20,
  },
});
