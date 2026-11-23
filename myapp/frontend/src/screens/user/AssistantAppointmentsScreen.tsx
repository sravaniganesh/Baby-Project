
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  getAssistantWorkspaces,
  getAssistantAppointments,
  acceptAssistantAppointment,
  rejectAssistantAppointment,
  rescheduleAssistantAppointment,
  changeAssistantAppointmentSlot,
} from "../../services/assistantService";
import DateTimePicker from "@react-native-community/datetimepicker";

const AssistantAppointmentsScreen = () => {
  const route = useRoute<any>();

  const { doctor, doctorId, permissions } = route.params || {};

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [proposedSlotTimes, setProposedSlotTimes] = useState<string[]>(["", "", ""]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimeIndex, setActiveTimeIndex] = useState<number | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());
  const pendingAlertShown = useRef(false);

  const canRespond = permissions?.respondToAppointments === true;
  const canReschedule =
    permissions?.rescheduleAppointments === true;
  const canViewContact =
    permissions?.viewPatientContact === true;

  const loadAppointments = useCallback(async (showLoader = true) => {
    if (!doctorId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      }

      const data = await getAssistantAppointments(doctorId);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.appointments)
        ? data.appointments
        : [];

      setAppointments(list);
    } catch (error: any) {
      console.error(
        "ASSISTANT APPOINTMENTS ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Unable to load appointments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Check every accepted doctor workspace once when this screen opens.
  // The visible appointment list remains limited to the selected doctor.
  useEffect(() => {
    if (pendingAlertShown.current) return;
    pendingAlertShown.current = true;

    const checkPendingRequests = async () => {
      try {
        const workspaceResponse = await getAssistantWorkspaces();
        const workspaces = Array.isArray(workspaceResponse)
          ? workspaceResponse
          : Array.isArray(workspaceResponse?.workspaces)
          ? workspaceResponse.workspaces
          : [];

        const appointmentLists = await Promise.all(
          workspaces.map(async (workspace: any) => {
            // Appointment listing requires the viewAppointments permission.
            if (workspace?.permissions?.viewAppointments !== true) return [];

            const workspaceDoctorId =
              workspace?.doctor?._id ||
              workspace?.doctor?.id ||
              workspace?.doctorId;

            if (!workspaceDoctorId) return [];

            const response = await getAssistantAppointments(workspaceDoctorId);
            return Array.isArray(response)
              ? response
              : Array.isArray(response?.appointments)
              ? response.appointments
              : [];
          })
        );

        const pendingCount = appointmentLists.reduce(
          (total: number, list: any[]) =>
            total + list.filter(
              (appointment: any) =>
                String(appointment?.status || "").toUpperCase() === "REQUESTED"
            ).length,
          0
        );

        if (pendingCount > 0) {
          Alert.alert(
            "New appointment requests",
            `You have ${pendingCount} pending appointment request(s) across your doctor workspaces.`
          );
        }
      } catch (error: any) {
        // Do not block this doctor's appointment screen if the summary check fails.
        console.warn(
          "ASSISTANT PENDING REQUEST CHECK ERROR:",
          error?.response?.data || error
        );
      }
    };

    checkPendingRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments(false);
  };

  const getAppointmentId = (item: any) =>
    item?._id || item?.id;

  const getPatient = (item: any) =>
    item?.userId || item?.patientId || item?.user || {};

  const formatDate = (value: any) => {
    if (!value) return "Not scheduled";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleAccept = (appointmentId: string) => {
    Alert.alert(
      "Accept Appointment",
      "Are you sure you want to accept this appointment request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            try {
              setProcessingId(appointmentId);

              await acceptAssistantAppointment(doctorId, appointmentId);

              Alert.alert("Success", "Appointment accepted.");
              await loadAppointments(false);
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "Unable to accept appointment."
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = (appointmentId: string) => {
    Alert.alert(
      "Reject Appointment",
      "Are you sure you want to reject this appointment request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(appointmentId);

              await rejectAssistantAppointment(doctorId, appointmentId);

              Alert.alert("Success", "Appointment rejected.");
              await loadAppointments(false);
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "Unable to reject appointment."
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const formatTime12 = (time: string) => {
    if (!time) return "Select time";

    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const openTimePicker = (index: number) => {
    setActiveTimeIndex(index);
    setPickerValue(new Date());
    setShowTimePicker(true);
  };

  const handleTimePickerChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);

    if (event.type === "dismissed" || !selectedDate || activeTimeIndex === null) {
      setActiveTimeIndex(null);
      return;
    }

    const hours = String(selectedDate.getHours()).padStart(2, "0");
    const minutes = String(selectedDate.getMinutes()).padStart(2, "0");
    const selectedTime = `${hours}:${minutes}`;

    setProposedSlotTimes((previous) => {
      const updated = [...previous];
      updated[activeTimeIndex] = selectedTime;
      return updated;
    });

    setPickerValue(selectedDate);
    setActiveTimeIndex(null);
  };

  const openReschedule = (item: any) => {
    const appointmentId = getAppointmentId(item);
    if (!appointmentId) return;

    setRescheduleId(appointmentId);
    setNewDate("");
    setNewTime("");
    setProposedSlotTimes(["", "", ""]);
    setShowTimePicker(false);
    setActiveTimeIndex(null);
  };

  const handleReschedule = async (
    appointmentId: string,
    currentStatus: string
  ) => {
    const isHospitalRequest = currentStatus === "REQUESTED";
    const selectedTimes = proposedSlotTimes.filter(Boolean);

    if (isHospitalRequest) {
      if (selectedTimes.length < 1 || selectedTimes.length > 3) {
        Alert.alert("Missing details", "Please select at least one appointment time.");
        return;
      }

      if (new Set(selectedTimes).size !== selectedTimes.length) {
        Alert.alert("Duplicate times", "Please select different appointment times.");
        return;
      }
    } else {
      // Preserve the existing confirmed-appointment rescheduling workflow.
      if (!newDate.trim() || !newTime.trim()) {
        Alert.alert("Missing details", "Please enter the new date and time.");
        return;
      }

      const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(newDate.trim());
      const timeValid = /^([01]\d|2[0-3]):[0-5]\d$/.test(newTime.trim());

      if (!dateValid || !timeValid) {
        Alert.alert("Invalid format", "Enter date as YYYY-MM-DD and time as HH:mm.");
        return;
      }
    }

    try {
      setProcessingId(appointmentId);

      if (isHospitalRequest) {
        await rescheduleAssistantAppointment(doctorId, appointmentId, selectedTimes);
      } else {
        await changeAssistantAppointmentSlot(
          doctorId,
          appointmentId,
          newDate.trim(),
          newTime.trim()
        );
      }

      setRescheduleId(null);
      setNewDate("");
      setNewTime("");
      setProposedSlotTimes(["", "", ""]);
      setShowTimePicker(false);
      setActiveTimeIndex(null);

      Alert.alert(
        "Success",
        isHospitalRequest
          ? "Appointment time options have been sent to the patient."
          : "Appointment date and time updated."
      );
      await loadAppointments(false);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Unable to reschedule appointment."
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>
          Loading appointments...
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
        <Text style={styles.heading}>Appointments</Text>
        <Text style={styles.subheading}>
          Dr. {doctor?.name || "Doctor"}
        </Text>
        <Text style={styles.count}>
          {appointments.length} appointment(s)
        </Text>
      </View>

      {appointments.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No appointments found
          </Text>
          <Text style={styles.emptyText}>
            Appointments assigned to this doctor's workspace
            will appear here.
          </Text>
        </View>
      ) : (
        appointments.map((item) => {
          const appointmentId = getAppointmentId(item);
          const patient = getPatient(item);
          const status = String(item?.status || "UNKNOWN").toUpperCase();

          const isRequested = status === "REQUESTED";
          const consultationType = String(
            item?.consultationType || ""
          ).toLowerCase();
          const isHospitalRequest =
            isRequested && consultationType === "hospital";
          const isVideoRequest =
            isRequested && consultationType === "video";
          const canRescheduleThis = status === "CONFIRMED";

          const busy = processingId === appointmentId;

          return (
            <View
              key={appointmentId}
              style={styles.appointmentCard}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.patientName}>
                  {patient?.name ||
                    patient?.fullName ||
                    "Patient"}
                </Text>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {status}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(
                    item?.scheduledAt ||
                      item?.proposedAt ||
                      item?.preferredDate
                  )}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {item?.slotTime || "Not specified"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>
                  {item?.consultationType || "Not specified"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fee</Text>
                <Text style={styles.detailValue}>
                  ₹{item?.consultationFee ?? 0}
                </Text>
              </View>

              {canViewContact && (
                <View style={styles.contactSection}>
                  <Text style={styles.contactHeading}>
                    Patient Contact
                  </Text>

                  <Text style={styles.contactText}>
                    Email: {patient?.email || "Not available"}
                  </Text>

                  <Text style={styles.contactText}>
                    Phone: {patient?.phone || patient?.mobile || "Not available"}
                  </Text>
                </View>
              )}

              {busy && (
                <ActivityIndicator
                  style={styles.actionLoader}
                  color="#4f46e5"
                />
              )}

              {!busy && isVideoRequest && canRespond && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(appointmentId)}
                  >
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleReject(appointmentId)}
                  >
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!busy && isHospitalRequest && (
                <View style={styles.buttonRow}>
                  {canReschedule && (
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => openReschedule(item)}
                    >
                      <Text style={styles.buttonText}>
                        Propose Date & Time
                      </Text>
                    </TouchableOpacity>
                  )}

                  {canRespond && (
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleReject(appointmentId)}
                    >
                      <Text style={styles.buttonText}>Reject</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {!busy && canReschedule && canRescheduleThis && (
                <TouchableOpacity
                  style={styles.rescheduleButton}
                  onPress={() => openReschedule(item)}
                >
                  <Text style={styles.rescheduleButtonText}>
                    Reschedule
                  </Text>
                </TouchableOpacity>
              )}

              {!busy && rescheduleId === appointmentId && (
                <View style={styles.rescheduleForm}>
                  <Text style={styles.formTitle}>
                    {isHospitalRequest
                      ? "Propose appointment times"
                      : "New appointment date and time"}
                  </Text>

                  {isHospitalRequest ? (
                    <>
                      <Text style={styles.detailLabel}>Patient's preferred date</Text>
                      <Text style={styles.preferredDate}>
                        {formatDate(item?.preferredDate)}
                      </Text>

                      <Text style={styles.timePickerHeading}>
                        Select up to 3 available times
                      </Text>

                      {[0, 1, 2].map((index) => (
                        <View key={index} style={styles.timePickerRow}>
                          <Text style={styles.timeOptionLabel}>Option {index + 1}</Text>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => openTimePicker(index)}
                          >
                            <Text style={styles.timePickerButtonText}>
                              {proposedSlotTimes[index]
                                ? formatTime12(proposedSlotTimes[index])
                                : "Select time"}
                            </Text>
                          </TouchableOpacity>
                          {!!proposedSlotTimes[index] && (
                            <TouchableOpacity
                              style={styles.clearTimeButton}
                              onPress={() => {
                                setProposedSlotTimes((previous) => {
                                  const updated = [...previous];
                                  updated[index] = "";
                                  return updated;
                                });
                              }}
                            >
                              <Text style={styles.clearTimeText}>Clear</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </>
                  ) : (
                    <>
                      <TextInput
                        style={styles.input}
                        placeholder="Date (YYYY-MM-DD)"
                        value={newDate}
                        onChangeText={setNewDate}
                        autoCapitalize="none"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Time (HH:mm, 24-hour)"
                        value={newTime}
                        onChangeText={setNewTime}
                        autoCapitalize="none"
                      />
                    </>
                  )}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleReschedule(appointmentId, status)}
                    >
                      <Text style={styles.buttonText}>
                        {isHospitalRequest ? "Send Proposal" : "Save Changes"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setRescheduleId(null);
                        setNewDate("");
                        setNewTime("");
                        setProposedSlotTimes(["", "", ""]);
                        setShowTimePicker(false);
                        setActiveTimeIndex(null);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}

      {showTimePicker && (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={handleTimePickerChange}
        />
      )}

      <Text style={styles.notice}>
        Appointment actions are available only when the doctor
        has granted the required permissions.
      </Text>
    </ScrollView>
  );
};

export default AssistantAppointmentsScreen;

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
    backgroundColor: "#f5f6fa",
  },
  loadingText: {
    marginTop: 10,
    color: "#777",
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
  count: {
    fontSize: 12,
    color: "#4f46e5",
    marginTop: 12,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 14,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  emptyText: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  appointmentCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  patientName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },
  statusBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4f46e5",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: "#888",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  contactSection: {
    backgroundColor: "#f5f6fa",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  contactHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginBottom: 7,
  },
  contactText: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#21864b",
    padding: 12,
    borderRadius: 9,
    alignItems: "center",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#dc3545",
    padding: 12,
    borderRadius: 9,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  rescheduleButton: {
    backgroundColor: "#eef2ff",
    padding: 12,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 12,
  },
  rescheduleButtonText: {
    color: "#4f46e5",
    fontSize: 13,
    fontWeight: "700",
  },
  rescheduleForm: {
    backgroundColor: "#f5f6fa",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
    fontSize: 13,
    color: "#222",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    padding: 12,
    borderRadius: 9,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#444",
    fontSize: 13,
    fontWeight: "700",
  },
  actionLoader: {
    marginTop: 15,
  },
  preferredDate: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginTop: 6,
    marginBottom: 16,
  },
  timePickerHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  timePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  timeOptionLabel: {
    width: 65,
    fontSize: 12,
    color: "#666",
  },
  timePickerButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  timePickerButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
  },
  clearTimeButton: {
    padding: 8,
  },
  clearTimeText: {
    color: "#dc3545",
    fontSize: 12,
    fontWeight: "600",
  },
  notice: {
    fontSize: 12,
    color: "#777",
    lineHeight: 19,
    marginTop: 12,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
});
