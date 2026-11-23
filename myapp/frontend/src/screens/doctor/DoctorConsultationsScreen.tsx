
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import API from "../../config/api";

const DoctorConsultationsScreen = () => {
  const navigation = useNavigation<any>();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposingId, setProposingId] = useState<string | null>(null);
  // Times are stored as HH:mm for the existing backend API,
  // but the doctor selects and sees them in 12-hour AM/PM format.
  const [slotTimeInputs, setSlotTimeInputs] = useState<Record<string, string[]>>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null);
  const [activeTimeIndex, setActiveTimeIndex] = useState<number | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());

  const formatTime12 = (time: string) => {
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    if (!match) return "";
    const hours = Number(match[1]);
    const minutes = match[2];
    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${suffix}`;
  };

  const toHHmm = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const openTimePicker = (consultationId: string, index: number) => {
    const existingTime = slotTimeInputs[consultationId]?.[index];
    const initialDate = new Date();

    if (existingTime && /^\d{2}:\d{2}$/.test(existingTime)) {
      const [hours, minutes] = existingTime.split(":").map(Number);
      initialDate.setHours(hours, minutes, 0, 0);
    }

    setActiveConsultationId(consultationId);
    setActiveTimeIndex(index);
    setPickerValue(initialDate);
    setShowTimePicker(true);
  };

  const handleTimePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowTimePicker(false);
      setActiveConsultationId(null);
      setActiveTimeIndex(null);
      return;
    }

    if (selectedDate && activeConsultationId && activeTimeIndex !== null) {
      const selectedTime = toHHmm(selectedDate);
      setSlotTimeInputs((prev) => {
        const current = [...(prev[activeConsultationId] || ["", "", ""])];
        current[activeTimeIndex] = selectedTime;
        return { ...prev, [activeConsultationId]: current };
      });
    }

    setPickerValue(selectedDate || pickerValue);
    setShowTimePicker(false);
    setActiveConsultationId(null);
    setActiveTimeIndex(null);
  };
  

  /* ================= DATE FORMAT ================= */

  const formatDate = (value: any) => {
    if (!value) return "Not specified";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not specified";

    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  /* ================= FETCH ================= */

  const fetchData = async () => {
    console.log("DOCTOR CONSULTATIONS: fetchData started");
    try {
      setLoading(true);

      /* CHAT REQUESTS */
      let chatList: any[] = [];

      try {
        const chatRes = await API.get("/chat/doctor/requests");
        const chats = chatRes.data?.consultations || [];

        chatList = chats.map((c: any) => ({
          ...c,
          type: "chat",
        }));
      } catch (error) {
        console.log("Doctor chat requests fetch error:", error);
      }

      /* DOCTOR CONSULTATIONS */
      let consultationList: any[] = [];

      try {
        console.log("Calling doctor consultations API...");
        const consultationRes = await API.get(
          "/doctor/consultations/my"
        );
        console.log("API response:", consultationRes.data);

        console.log(
  "DOCTOR CONSULTATIONS API RESPONSE:",
  JSON.stringify(consultationRes.data, null, 2)
);

        const consultations = Array.isArray(consultationRes.data)
          ? consultationRes.data
          : [];

        consultationList = consultations.map((item: any) => ({
          ...item,
          type: item.consultationType || item.type || "consultation",
          userName:
            item.userId?.name ||
            item.userName ||
            "User",
          hospitalName:
            item.hospitalId?.name ||
            item.hospitalName ||
            "Hospital",
        }));
      } catch (error) {
        console.log("Doctor consultations fetch error:", error);
      }

      /* NOTIFICATION REQUESTS */
      let notifyList: any[] = [];

      try {
        const notifyRes = await API.get(
          "/consultation/notify/doctor"
        );

        notifyList = (notifyRes.data || []).map((item: any) => ({
          ...item,
          type: "notify",
          userName: item.userName || "User",
        }));
      } catch (error) {
        console.log("Doctor notification requests fetch error:", error);
      }

      /* MERGE */
      setData([
        ...chatList,
        ...consultationList,
        ...notifyList,
      ]);
    } catch (error) {
      console.log("Doctor consultation screen error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  /* ================= ACCEPT CHAT ================= */

  const handleAccept = async (chatId: string) => {
    try {
      await API.post(`/chat/${chatId}/accept`);

      setData((prev) =>
        prev.map((item) =>
          item._id === chatId
            ? { ...item, status: "accepted" }
            : item
        )
      );

      Alert.alert("Success", "Chat request accepted.");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Unable to accept chat request."
      );
    }
  };

  /* ================= OPEN CHAT ================= */

  const openChat = (item: any) => {
    navigation.navigate("DoctorChat", {
      chatId: item._id,
      userName: item.userName,
    });
  };

  /* ================= PROPOSE HOSPITAL SLOTS ================= */

 const handleProposeSlots = async (consultationId: string) => {
  const enteredTimes = slotTimeInputs[consultationId] || [];
  const slotTimes = enteredTimes
    .map((time) => time.trim())
    .filter((time) => time.length > 0);

  if (slotTimes.length === 0) {
    Alert.alert("Appointment Times Required", "Please select at least one appointment time.");
    return;
  }

  const validTimeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (slotTimes.some((time) => !validTimeFormat.test(time))) {
    Alert.alert("Invalid Time", "Please select valid appointment times.");
    return;
  }

  if (new Set(slotTimes).size !== slotTimes.length) {
    Alert.alert("Duplicate Times", "Please select different appointment times.");
    return;
  }

  if (slotTimes.length > 3) {
    Alert.alert("Maximum Limit", "You can propose a maximum of 3 appointment times.");
    return;
  }

  try {
    setProposingId(consultationId);

    const response = await API.patch(
      `/doctor/consultations/${consultationId}/propose-slot`,
      { slotTimes }
    );

    const slots = response.data?.availableSlots || [];

    setData((prev) =>
      prev.map((item) =>
        item._id === consultationId
          ? {
              ...item,
              ...response.data?.consultation,
              status: "SLOT_PROPOSED",
              availableSlots: slots,
            }
          : item
      )
    );

    const slotMessage = slotTimes
      .map((time, index) => `${index + 1}. ${formatTime12(time)}`)
      .join("\n");

    Alert.alert(
      "Appointment Times Sent",
      `${response.data?.message || "Appointment times sent to the user."}\n\n${slotMessage}`
    );

    await fetchData();
  } catch (error: any) {
    Alert.alert(
      "Unable to Send Appointment Times",
      error?.response?.data?.message ||
        "Please check the appointment times and try again."
    );
  } finally {
    setProposingId(null);
  }
};

  /* ================= RENDER ================= */

  const renderItem = ({ item }: any) => {
    const isChat = item.type === "chat";
    const isHospital = item.type === "hospital";
    const isVideo = item.type === "video";
    const isNotify = item.type === "notify";

    return (
      <View style={styles.card}>
        <Text style={styles.name}>
          {item.userName || "User"}
        </Text>

        <Text style={styles.type}>
          {item.type?.toUpperCase()}
        </Text>

        {/* CHAT */}
        {isChat && (
          <>
            <Text style={styles.info}>
              Status: {item.status}
            </Text>

            {item.status === "requested" && (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAccept(item._id)}
              >
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>
            )}

            {["accepted", "active", "paused"].includes(
              item.status
            ) && (
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => openChat(item)}
              >
                <Text style={styles.btnText}>Open Chat</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* HOSPITAL CONSULTATION */}
        {isHospital && (
          <>
            <Text style={styles.info}>
              Hospital: {item.hospitalName}
            </Text>

            <Text style={styles.info}>
              Preferred date: {formatDate(item.preferredDate)}
            </Text>

            <Text style={styles.info}>
              Status: {item.status}
            </Text>

            {item.status === "REQUESTED" && (
              <>
                <Text style={styles.info}>
                  Select up to 3 appointment times for the preferred date.
                </Text>

                {[0, 1, 2].map((index) => {
                  const selectedTime = slotTimeInputs[item._id]?.[index] || "";
                  return (
                    <TouchableOpacity
                      key={`${item._id}-${index}`}
                      style={styles.timePickerButton}
                      onPress={() => openTimePicker(item._id, index)}
                      disabled={proposingId === item._id}
                    >
                      <Text style={selectedTime ? styles.selectedTimeText : styles.timePlaceholder}>
                        {selectedTime
                          ? `Appointment time ${index + 1}: ${formatTime12(selectedTime)}`
                          : `Select appointment time ${index + 1}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[
                    styles.proposeBtn,
                    proposingId === item._id && styles.disabledBtn,
                  ]}
                  disabled={proposingId === item._id}
                  onPress={() => handleProposeSlots(item._id)}
                >
                  {proposingId === item._id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Send Appointment Times</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {item.status === "SLOT_PROPOSED" && (
              <Text style={styles.proposedText}>
                Available slots sent. Waiting for user selection.
              </Text>
            )}

            {[
              "AWAITING_PAYMENT",
              "CONFIRMED",
              "IN_PROGRESS",
              "COMPLETED",
            ].includes(item.status) && (
              <Text style={styles.confirmedText}>
                Appointment status: {item.status.replace(/_/g, " ")}
              </Text>
            )}
          </>
        )}

        {/* VIDEO CONSULTATION */}
        {isVideo && (
          <>
            <Text style={styles.info}>
              Date: {formatDate(item.scheduledAt || item.date)}
            </Text>

            <Text style={styles.info}>
              Time: {item.slotTime || item.time || "Not specified"}
            </Text>

            <Text style={styles.info}>
              Status: {item.status}
            </Text>
          </>
        )}

        {/* NOTIFICATION REQUEST */}
        {isNotify && (
          <>
            <Text style={styles.info}>
              User requested notification
            </Text>

            <Text style={styles.notifyText}>
              Waiting for available slots
            </Text>
          </>
        )}

        {/* OTHER CONSULTATION TYPES */}
        {!isChat &&
          !isHospital &&
          !isVideo &&
          !isNotify && (
            <Text style={styles.info}>
              Status: {item.status}
            </Text>
          )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
        <Text>Loading consultations...</Text>
      </View>
    );
  }

  return (
    <>
    <FlatList
      data={data}
      keyExtractor={(item, index) =>
        item._id || `item-${index}`
      }
      renderItem={renderItem}
      refreshing={loading}
      onRefresh={fetchData}
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          No consultations or requests found.
        </Text>
      }
    />

    {showTimePicker && (
      <DateTimePicker
        value={pickerValue}
        mode="time"
        is24Hour={false}
        display={Platform.OS === "ios" ? "spinner" : "default"}
        onChange={handleTimePickerChange}
      />
    )}
    </>
  );
};

export default DoctorConsultationsScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 14,
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#111827",
  },
  type: {
    marginTop: 5,
    marginBottom: 8,
    color: "#2563EB",
    fontWeight: "bold",
  },
  info: {
    marginTop: 5,
    color: "#374151",
  },
  acceptBtn: {
    backgroundColor: "#10B981",
    padding: 11,
    marginTop: 10,
    borderRadius: 6,
  },
  chatBtn: {
    backgroundColor: "#2563EB",
    padding: 11,
    marginTop: 10,
    borderRadius: 6,
  },
  proposeBtn: {
    backgroundColor: "#2563EB",
    padding: 12,
    marginTop: 12,
    borderRadius: 7,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  proposedText: {
    color: "#D97706",
    marginTop: 10,
    fontWeight: "600",
  },
  confirmedText: {
    color: "#059669",
    marginTop: 10,
    fontWeight: "600",
  },
  notifyText: {
    color: "#F59E0B",
    marginTop: 5,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#6B7280",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 7,
    padding: 13,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
  },
  selectedTimeText: {
    color: "#111827",
    fontSize: 14,
  },
  timePlaceholder: {
    color: "#999999",
    fontSize: 14,
  },
});
