
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";

import { useRoute } from "@react-navigation/native";

import {
  getAssistantAvailability,
  createAssistantAvailability,
  updateAssistantAvailability,
  deleteAssistantAvailability,
} from "../../services/assistantService";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const AssistantAvailabilityScreen = () => {
  const route = useRoute<any>();

  const { doctor, doctorId, permissions } = route.params || {};

  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState("30");
  const [hospitalId, setHospitalId] = useState("");

  const canManageSlots = permissions?.manageSlots === true;

  const loadAvailability = useCallback(async (showLoader = true) => {
    if (!doctorId) {
      setAvailability([]);
      setLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      }

      const data = await getAssistantAvailability(doctorId);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.availability)
        ? data.availability
        : [];

      setAvailability(list);
    } catch (error: any) {
      console.error(
        "ASSISTANT AVAILABILITY ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Unable to load availability."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAvailability(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setDayOfWeek(1);
    setStartTime("09:00");
    setEndTime("17:00");
    setSlotDuration("30");
    setHospitalId("");
  };

  const getId = (item: any) => item?._id || item?.id;

  const validateForm = () => {
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!timePattern.test(startTime.trim())) {
      Alert.alert("Invalid start time", "Use HH:mm format, for example 09:00.");
      return false;
    }

    if (!timePattern.test(endTime.trim())) {
      Alert.alert("Invalid end time", "Use HH:mm format, for example 17:00.");
      return false;
    }

    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(":").map(Number);
      return hours * 60 + minutes;
    };

    if (toMinutes(endTime) <= toMinutes(startTime)) {
      Alert.alert(
        "Invalid time range",
        "End time must be later than start time."
      );
      return false;
    }

    const duration = Number(slotDuration);

    if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
      Alert.alert(
        "Invalid duration",
        "Enter a valid slot duration in minutes."
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!canManageSlots) {
      Alert.alert(
        "Permission denied",
        "The doctor has not granted availability management permission."
      );
      return;
    }

    if (!doctorId) {
      Alert.alert("Error", "Doctor information is missing.");
      return;
    }

    if (!validateForm()) return;

    const payload = {
      hospitalId: hospitalId.trim() || null,
      dayOfWeek,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      slotDuration: Number(slotDuration),
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateAssistantAvailability(doctorId, editingId, payload);
        Alert.alert("Success", "Availability updated.");
      } else {
        await createAssistantAvailability(doctorId, payload);
        Alert.alert("Success", "Availability added.");
      }

      resetForm();
      await loadAvailability(false);
    } catch (error: any) {
      console.error(
        "SAVE ASSISTANT AVAILABILITY ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Unable to save availability."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(getId(item));
    setDayOfWeek(Number(item?.dayOfWeek ?? 1));
    setStartTime(item?.startTime || "09:00");
    setEndTime(item?.endTime || "17:00");
    setSlotDuration(String(item?.slotDuration || 30));

    const itemHospitalId =
      typeof item?.hospitalId === "object"
        ? item?.hospitalId?._id
        : item?.hospitalId;

    setHospitalId(itemHospitalId ? String(itemHospitalId) : "");
  };

  const handleDeactivate = (availabilityId: string) => {
    Alert.alert(
      "Deactivate Availability",
      "Are you sure you want to deactivate this schedule?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);

              await deleteAssistantAvailability(doctorId, availabilityId);

              Alert.alert("Success", "Availability deactivated.");

              if (editingId === availabilityId) {
                resetForm();
              }

              await loadAvailability(false);
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "Unable to deactivate availability."
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async (item: any) => {
    const availabilityId = getId(item);

    if (!availabilityId) return;

    try {
      setSaving(true);

      await updateAssistantAvailability(doctorId, availabilityId, {
  isActive: true,
});

      Alert.alert("Success", "Availability activated.");
      await loadAvailability(false);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Unable to activate availability."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!canManageSlots) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionTitle}>
          Access not allowed
        </Text>
        <Text style={styles.permissionText}>
          The doctor has not granted permission to manage availability.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>
          Loading availability...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.heading}>
          Manage Availability
        </Text>

        <Text style={styles.subheading}>
          Dr. {doctor?.name || "Doctor"}
        </Text>
      </View>

      {/* ADD / EDIT FORM */}

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>
          {editingId ? "Edit Availability" : "Add Availability"}
        </Text>

        <Text style={styles.label}>Select Day</Text>

        <View style={styles.daysContainer}>
          {DAYS.map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                dayOfWeek === index && styles.selectedDay,
              ]}
              onPress={() => setDayOfWeek(index)}
            >
              <Text
                style={[
                  styles.dayText,
                  dayOfWeek === index && styles.selectedDayText,
                ]}
              >
                {day.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Start Time</Text>

        <TextInput
          style={styles.input}
          value={startTime}
          onChangeText={setStartTime}
          placeholder="09:00"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />

        <Text style={styles.label}>End Time</Text>

        <TextInput
          style={styles.input}
          value={endTime}
          onChangeText={setEndTime}
          placeholder="17:00"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />

        <Text style={styles.label}>
          Slot Duration (minutes)
        </Text>

        <TextInput
          style={styles.input}
          value={slotDuration}
          onChangeText={setSlotDuration}
          placeholder="30"
          keyboardType="numeric"
        />

        <Text style={styles.label}>
          Hospital ID (optional)
        </Text>

        <TextInput
          style={styles.input}
          value={hospitalId}
          onChangeText={setHospitalId}
          placeholder="Leave empty for independent availability"
          autoCapitalize="none"
        />

        <Text style={styles.helperText}>
          Leave Hospital ID empty for an independent doctor's schedule.
          For hospital-specific availability, enter the approved hospital
          association's ID.
        </Text>

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {editingId ? "Update Availability" : "Add Availability"}
            </Text>
          )}
        </TouchableOpacity>

        {editingId && (
          <TouchableOpacity
            style={styles.cancelEditButton}
            onPress={resetForm}
            disabled={saving}
          >
            <Text style={styles.cancelEditText}>
              Cancel Editing
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* EXISTING AVAILABILITY */}

      <Text style={styles.sectionTitle}>
        Existing Schedules
      </Text>

      {availability.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No availability schedules
          </Text>

          <Text style={styles.emptyText}>
            Add a weekly schedule using the form above.
          </Text>
        </View>
      ) : (
        availability.map((item) => {
          const availabilityId = getId(item);
          const active = item?.isActive !== false;

          const itemHospitalId =
            typeof item?.hospitalId === "object"
              ? item?.hospitalId?._id
              : item?.hospitalId;

          return (
            <View
              key={availabilityId}
              style={styles.scheduleCard}
            >
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleDay}>
                  {DAYS[Number(item?.dayOfWeek)] || "Unknown day"}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    active ? styles.activeBadge : styles.inactiveBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      active ? styles.activeText : styles.inactiveText,
                    ]}
                  >
                    {active ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>

              <Text style={styles.scheduleTime}>
                {item?.startTime} - {item?.endTime}
              </Text>

              <Text style={styles.scheduleDetail}>
                Slot duration: {item?.slotDuration || 30} minutes
              </Text>

              <Text style={styles.scheduleDetail}>
                {itemHospitalId
                  ? `Hospital ID: ${itemHospitalId}`
                  : "Independent availability"}
              </Text>

              {active ? (
                <View style={styles.scheduleActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(item)}
                    disabled={saving}
                  >
                    <Text style={styles.editButtonText}>
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deactivateButton}
                    onPress={() => handleDeactivate(availabilityId)}
                    disabled={saving}
                  >
                    <Text style={styles.deactivateButtonText}>
                      Deactivate
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.activateButton}
                  onPress={() => handleReactivate(item)}
                  disabled={saving}
                >
                  <Text style={styles.activateButtonText}>
                    Activate
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      <Text style={styles.notice}>
        Availability changes affect the doctor's booking schedule.
        Confirm the selected day, time and hospital before saving.
      </Text>
    </ScrollView>
  );
};

export default AssistantAvailabilityScreen;

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
    padding: 25,
    backgroundColor: "#f5f6fa",
  },
  loadingText: {
    marginTop: 10,
    color: "#777",
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  permissionText: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 18,
    elevation: 2,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },
  subheading: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
  formCard: {
    backgroundColor: "#fff",
    padding: 17,
    borderRadius: 15,
    marginBottom: 25,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    marginBottom: 7,
    marginTop: 12,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: "#f1f1f1",
  },
  selectedDay: {
    backgroundColor: "#4f46e5",
  },
  dayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  selectedDayText: {
    color: "#fff",
  },
  input: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#222",
  },
  helperText: {
    fontSize: 11,
    color: "#888",
    lineHeight: 17,
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: "#4f46e5",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  cancelEditButton: {
    padding: 12,
    alignItems: "center",
    marginTop: 5,
  },
  cancelEditText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 14,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  emptyText: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 7,
  },
  scheduleCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 1,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleDay: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activeBadge: {
    backgroundColor: "#e9f8ef",
  },
  inactiveBadge: {
    backgroundColor: "#f1f1f1",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  activeText: {
    color: "#21864b",
  },
  inactiveText: {
    color: "#888",
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4f46e5",
    marginTop: 12,
  },
  scheduleDetail: {
    fontSize: 12,
    color: "#777",
    marginTop: 7,
  },
  scheduleActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#eef2ff",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: "#4f46e5",
    fontSize: 12,
    fontWeight: "700",
  },
  deactivateButton: {
    flex: 1,
    backgroundColor: "#fff0f0",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  deactivateButtonText: {
    color: "#dc3545",
    fontSize: 12,
    fontWeight: "700",
  },
  activateButton: {
    backgroundColor: "#e9f8ef",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  activateButtonText: {
    color: "#21864b",
    fontSize: 12,
    fontWeight: "700",
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
});
