
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import API from "../../config/api";

type BookingMode = "request" | "instant";

const ConsultationRequestScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { doctorId, hospitalId, hospitalName, type, bookingMode: routeBookingMode, consultationFee: routeConsultationFee } =
    route.params || {};

  const isHospital = type === "hospital";
  const isVideo = type === "video";

  const [doctor, setDoctor] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [groupedSlots, setGroupedSlots] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [preferredDates, setPreferredDates] = useState<string[]>([]);

  const [bookingMode, setBookingMode] =
    useState<BookingMode>("request");

  const [consultationFee, setConsultationFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const isInstantHospital =
    isHospital && bookingMode === "instant";

  /* ================= FETCH DATA ================= */

  const buildPreferredDates = () => {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 0; i < 14; i += 1) {
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + i
      );
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
    }

    return dates;
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!doctorId) {
        Alert.alert("Error", "Doctor information is missing.");
        return;
      }

      if (isHospital && !hospitalId) {
        Alert.alert("Hospital Missing", "Please go back and select a hospital.");
        return;
      }

      // Request mode is independent of doctor-details and available-slots APIs.
      // Initialize the preferred date immediately so the user can submit a request.
      const requestedMode: BookingMode =
        routeBookingMode === "instant" ? "instant" : "request";

      if (isHospital && requestedMode === "request") {
        setBookingMode("request");
        setConsultationFee(routeConsultationFee ?? 0);
        setSlots([]);
        setGroupedSlots({});
        setSelectedSlot(null);
        const dates = buildPreferredDates();
        setPreferredDates(dates);
        setSelectedDate(dates[0] || null);

        // Doctor details are optional for request mode. Load them in the
        // background; a failure must not block preferred-date selection.
        API.get(`/doctors/${doctorId}`)
          .then((docRes: any) => {
            const doctorData = docRes.data?.doctor || docRes.data;
            setDoctor(doctorData);
            if (routeConsultationFee == null) {
  // Use the fee passed from the selected hospital association.
  // Do not use the doctor's general profile fee here.
  setConsultationFee(0);
}
          })
          .catch((error: any) => {
            console.log(
              "OPTIONAL DOCTOR DETAILS LOAD ERROR:",
              error?.response?.status,
              error?.response?.data || error?.message
            );
          });
        return;
      }

      // Video and instant booking retain their existing data-loading behavior.
      const docRes = await API.get(`/doctors/${doctorId}`);
      const doctorData = docRes.data?.doctor || docRes.data;
      setDoctor(doctorData);

      if (isVideo) {
        setConsultationFee(
          doctorData?.adminOverride?.consultationFee ??
            doctorData?.consultationFee ??
            doctorData?.videoPrice ??
            0
        );
        setBookingMode("request");
        return;
      }

      if (!isHospital) {
        Alert.alert("Invalid Consultation", "Invalid consultation type.");
        return;
      }

      setBookingMode("instant");
      const slotRes = await API.get(
        `/doctors/hospital/${doctorId}/${hospitalId}/slots`
      );
      const response = slotRes.data || {};

      const responseMode: BookingMode =
        response.bookingMode === "request" ? "request" : "instant";
      setBookingMode(responseMode);
      setConsultationFee(
        response.consultationFee ??
          routeConsultationFee ??
          doctorData?.consultationFee ??
          doctorData?.hospitalPrice ??
          0
      );

      if (responseMode === "request") {
        setSlots([]);
        setGroupedSlots({});
        const dates = buildPreferredDates();
        setPreferredDates(dates);
        setSelectedDate(dates[0] || null);
        setSelectedSlot(null);
        return;
      }

      setPreferredDates([]);
      const slotList = Array.isArray(response.slots) ? response.slots : [];
      setSlots(slotList);

      const grouped: any = {};
      slotList.forEach((slot: any) => {
        if (!grouped[slot.date]) grouped[slot.date] = [];
        grouped[slot.date].push(slot);
      });

      setGroupedSlots(grouped);
      const dates = Object.keys(grouped);
      setSelectedDate(dates[0] || null);
      setSelectedSlot(null);
    } catch (error: any) {
      console.log(
        "CONSULTATION FETCH ERROR:",
        error?.response?.status,
        error?.response?.data || error?.message
      );

      Alert.alert(
        "Unable to Load",
        error?.response?.data?.message ||
          "Could not load consultation details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= PRICE ================= */

  const getPrice = () => consultationFee || 0;

  /* ================= DATE FORMAT ================= */

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);

    return {
      day: date
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase(),
      month: date.toLocaleDateString("en-US", {
        month: "short",
      }),
      date: date.getDate(),
    };
  };

  /* ================= BOOK CONSULTATION ================= */

  const handleBooking = async () => {
    if (booking) return;

    if (!doctorId) {
      Alert.alert("Error", "Doctor information is missing.");
      return;
    }

    if (isHospital && !hospitalId) {
      Alert.alert("Hospital Missing", "Please select a hospital.");
      return;
    }

    // Only instant hospital booking requires a selected slot.
    if (isInstantHospital && !selectedSlot) {
      Alert.alert(
        "Select Appointment Time",
        "Please choose an available date and time."
      );
      return;
    }

    if (isHospital && !isInstantHospital && !selectedDate) {
      Alert.alert(
        "Select Preferred Date",
        "Please choose your preferred consultation date."
      );
      return;
    }

    try {
      setBooking(true);

      // Booking payload belongs inside handleBooking.
      const bookingData: any = {
        doctorId,
        consultationType: type,
      };

      if (isHospital) {
        bookingData.hospitalId = hospitalId;
      }

      // Request mode sends a preferred date only; no time is selected yet.
      if (isHospital && !isInstantHospital) {
        bookingData.preferredDate = selectedDate;
      }

      // Add date/time only for instant hospital booking.
      if (isInstantHospital) {
        bookingData.scheduledAt = selectedSlot.date;
        bookingData.slotTime = selectedSlot.time;
      }

      console.log("CONSULTATION BOOKING REQUEST:", bookingData);

      // Keep the existing consultation booking route.
      const res = await API.post(
        "/consultations/book",
        bookingData
      );

      if (!res?.data?.success) {
        Alert.alert(
          "Booking Failed",
          res?.data?.message || "Unable to submit your request."
        );
        return;
      }

      const successMessage = isVideo
  ? "Your video consultation request has been submitted successfully. The doctor or authorized assistant will review it. Payment will be available after acceptance."
  : isInstantHospital
  ? "Your appointment has been booked successfully. You can check the appointment details in My Consultations."
  : "Your consultation request has been submitted successfully. The doctor or authorized assistant will review your preferred date and share available appointment times. You can track your request in My Consultations.";

Alert.alert("Request Submitted Successfully", successMessage, [
  {
    text: "OK",
    onPress: () => navigation.goBack(),
  },
]);
    } catch (error: any) {
      console.log(
        "CONSULTATION BOOKING ERROR:",
        error?.response?.status,
        error?.response?.data || error?.message
      );

      Alert.alert(
        "Unable to Submit",
        error?.response?.data?.message ||
          "Something went wrong while submitting your consultation request."
      );
    } finally {
      setBooking(false);
    }
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#7045C5" />
        <Text style={styles.loadingText}>
          Preparing consultation...
        </Text>
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#FFFFFF"
        barStyle="dark-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerEmoji}>
              {isVideo ? "🎥" : "🏥"}
            </Text>
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              {isVideo ? "Video Consultation" : "Hospital Visit"}
            </Text>

            <Text style={styles.subtitle}>
              {isVideo
                ? "Consult with your doctor online"
                : hospitalName || "Hospital consultation"}
            </Text>
          </View>
        </View>

        {/* PRICE CARD */}

        <View style={styles.priceCard}>
          <View>
            <Text style={styles.priceLabel}>
              Consultation Fee
            </Text>

            <Text style={styles.priceValue}>
  {getPrice() > 0
    ? `₹${getPrice().toLocaleString("en-IN")}`
    : "Fee unavailable"}
</Text>

<Text style={styles.priceHint}>
  {getPrice() > 0
    ? "No payment is taken at this step"
    : "Please confirm the fee with the hospital"}
</Text>

</View>

<View style={styles.priceIcon}>
            <Text style={styles.rupeeIcon}>₹</Text>
          </View>
        </View>

        {/* DOCTOR INFORMATION */}

        {doctor && (
          <View style={styles.doctorCard}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.doctorAvatarText}>
                {doctor.name?.charAt(0)?.toUpperCase() || "D"}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.doctorName}>
                Dr. {doctor.name || "Doctor"}
              </Text>

              <Text style={styles.doctorSpecialization}>
                {doctor.specialization || "Medical Specialist"}
              </Text>
            </View>

            <View style={styles.doctorTag}>
  <Text style={styles.doctorTagText}>DOCTOR</Text>
</View>
          </View>
        )}

        {/* REQUEST MODE: HOSPITAL OR VIDEO */}

        {!isInstantHospital && (
          <View style={styles.requestCard}>
            <View style={styles.requestIconContainer}>
              <Text style={styles.requestEmoji}>
                {isVideo ? "🩺" : "📅"}
              </Text>
            </View>

            <Text style={styles.requestTitle}>
              {isVideo
                ? "Request Your Consultation"
                : "Flexible Appointment Request"}
            </Text>

            <Text style={styles.requestDescription}>
              {isVideo
                ? "Submit your request now. The doctor or authorized assistant will review and accept it. You can complete wallet payment after acceptance."
                : "No need to select an appointment time now. The doctor or authorized assistant will review your request and propose an available date and time."}
            </Text>

            {!isVideo && (
              <View style={styles.preferredDateSection}>
                <Text style={styles.preferredDateTitle}>
                  Select Your Preferred Date
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.preferredDateRow}
                >
                  {preferredDates.map((date) => {
                    const selected = selectedDate === date;
                    const formatted = formatDate(date);

                    return (
                      <TouchableOpacity
                        key={date}
                        style={[
                          styles.dateBtn,
                          selected && styles.activeDate,
                        ]}
                        onPress={() => setSelectedDate(date)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            selected && styles.activeText,
                          ]}
                        >
                          {formatted.day}
                        </Text>
                        <Text
                          style={[
                            styles.dateText,
                            selected && styles.activeText,
                          ]}
                        >
                          {formatted.date}
                        </Text>
                        <Text
                          style={[
                            styles.monthText,
                            selected && styles.activeText,
                          ]}
                        >
                          {formatted.month}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoCheck}>✓</Text>
              <Text style={styles.infoText}>
                No time slot selection required
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoCheck}>✓</Text>
              <Text style={styles.infoText}>
                Doctor reviews your request
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoCheck}>✓</Text>
              <Text style={styles.infoText}>
                You decide the next step after acceptance
              </Text>
            </View>
          </View>
        )}

        {/* INSTANT HOSPITAL BOOKING */}

        {isInstantHospital && (
          <>
            <Text style={styles.sectionTitle}>
              Select Appointment Date
            </Text>

            {Object.keys(groupedSlots).length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dateRow}
              >
                {Object.keys(groupedSlots).map((date) => {
                  const selected = selectedDate === date;
                  const formatted = formatDate(date);

                  return (
                    <TouchableOpacity
                      key={date}
                      style={[
                        styles.dateBtn,
                        selected && styles.activeDate,
                      ]}
                      onPress={() => {
                        setSelectedDate(date);
                        setSelectedSlot(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          selected && styles.activeText,
                        ]}
                      >
                        {formatted.day}
                      </Text>

                      <Text
                        style={[
                          styles.dateText,
                          selected && styles.activeText,
                        ]}
                      >
                        {formatted.date}
                      </Text>

                      <Text
                        style={[
                          styles.monthText,
                          selected && styles.activeText,
                        ]}
                      >
                        {formatted.month}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.noSlotsCard}>
                <Text style={styles.noSlotsEmoji}>📅</Text>

                <Text style={styles.noSlotsTitle}>
                  No slots available
                </Text>

                <Text style={styles.noSlotsDescription}>
                  No appointment slots are currently available for this
                  hospital.
                </Text>
              </View>
            )}

            {selectedDate && groupedSlots[selectedDate] && (
              <>
                <Text style={styles.sectionTitle}>
                  Select Appointment Time
                </Text>

                <View style={styles.timeGrid}>
                  {groupedSlots[selectedDate].map(
                    (slot: any) => {
                      const selected =
                        selectedSlot?._id === slot._id;

                      return (
                        <TouchableOpacity
                          key={slot._id}
                          style={[
                            styles.timeBtn,
                            selected && styles.activeTime,
                          ]}
                          onPress={() => setSelectedSlot(slot)}
                        >
                          <Text
                            style={[
                              styles.timeText,
                              selected && styles.activeText,
                            ]}
                          >
                            {slot.time}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              </>
            )}
          </>
        )}

        {/* PAYMENT NOTE */}

        <View style={styles.paymentNote}>
          <Text style={styles.paymentNoteIcon}>🔒</Text>

          <Text style={styles.paymentNoteText}>
            No payment will be deducted now. Payment options will be
            available at the appropriate stage after doctor acceptance.
          </Text>
        </View>

        {/* BOOK BUTTON */}

        <TouchableOpacity
          style={[
            styles.bookBtn,
            (booking ||
              (isInstantHospital && !selectedSlot)) &&
              styles.disabledBtn,
          ]}
          onPress={handleBooking}
          disabled={
            booking ||
            (isInstantHospital && !selectedSlot)
          }
          activeOpacity={0.85}
        >
          {booking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.btnText}>
              {isVideo
                ? "Request Video Consultation"
                : "Book Consultation"}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.bottomNote}>
          You can track your request in My Consultations.
        </Text>
      </ScrollView>
    </View>
  );
};

export default ConsultationRequestScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7FC",
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 35,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F7FC",
  },

  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  headerIcon: {
    width: 55,
    height: 55,
    borderRadius: 17,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  headerEmoji: {
    fontSize: 27,
  },

  headerTextContainer: {
    flex: 1,
  },

  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#1F2937",
  },

  subtitle: {
    fontSize: 13,
    color: "#77738A",
    marginTop: 4,
  },

 priceCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 20,
  padding: 20,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
  borderWidth: 1,
  borderColor: "#EEE8FA",
  shadowColor: "#39236B",
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.07,
  shadowRadius: 12,
  elevation: 3,
},

  priceLabel: {
    color: "#77738A",
    fontSize: 13,
    fontWeight: "500",
  },

  priceValue: {
    fontSize: 27,
    fontWeight: "800",
    color: "#15966A",
    marginTop: 4,
  },

  priceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#E8F8F1",
    justifyContent: "center",
    alignItems: "center",
  },

  rupeeIcon: {
    fontSize: 23,
    color: "#15966A",
    fontWeight: "700",
  },

  doctorCard: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#FFFFFF",
  padding: 16,
  borderRadius: 19,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: "#F0EDF7",
  shadowColor: "#39236B",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 2,
},

  doctorAvatar: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  doctorAvatarText: {
    color: "#6D42C7",
    fontSize: 21,
    fontWeight: "800",
  },

  doctorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#252238",
  },

  doctorSpecialization: {
    color: "#77738A",
    fontSize: 12,
    marginTop: 4,
  },

 doctorTag: {
  backgroundColor: "#F1EDFF",
  paddingHorizontal: 9,
  paddingVertical: 6,
  borderRadius: 8,
},

doctorTagText: {
  color: "#7045C5",
  fontSize: 9,
  fontWeight: "800",
  letterSpacing: 0.6,
},

 requestCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 22,
  padding: 21,
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#EDE8FA",
  marginTop: 5,
  shadowColor: "#39236B",
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
},

  requestIconContainer: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "#F1EDFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  requestEmoji: {
    fontSize: 31,
  },

  requestTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#28233B",
    textAlign: "center",
  },

  requestDescription: {
    color: "#77738A",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 17,
  },

  preferredDateSection: {
    alignSelf: "stretch",
    marginTop: 4,
    marginBottom: 8,
  },

  preferredDateTitle: {
    color: "#28233B",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
  },

  preferredDateRow: {
    paddingRight: 4,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: 11,
  },

  infoCheck: {
    color: "#15966A",
    fontWeight: "800",
    fontSize: 15,
    marginRight: 10,
  },

  infoText: {
    color: "#514D60",
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#28233B",
    marginTop: 12,
    marginBottom: 13,
  },

  dateRow: {
    marginBottom: 15,
  },

  dateBtn: {
    width: 65,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    marginRight: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAE6F2",
  },

  activeDate: {
    backgroundColor: "#7045C5",
    borderColor: "#7045C5",
  },

  dayText: {
    fontSize: 10,
    color: "#77738A",
    fontWeight: "600",
  },

  dateText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#29243B",
    marginVertical: 4,
  },

  monthText: {
    fontSize: 11,
    color: "#77738A",
  },

  activeText: {
    color: "#FFFFFF",
  },

  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },

  timeBtn: {
    paddingVertical: 11,
    paddingHorizontal: 17,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 9,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EAE6F2",
  },

  activeTime: {
    backgroundColor: "#7045C5",
    borderColor: "#7045C5",
  },

  timeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#514D60",
  },

  noSlotsCard: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 15,
  },

  noSlotsEmoji: {
    fontSize: 32,
  },

  noSlotsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#29243B",
    marginTop: 10,
  },

  noSlotsDescription: {
    color: "#77738A",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  paymentNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFA",
    padding: 13,
    borderRadius: 13,
    marginTop: 20,
  },

  paymentNoteIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  paymentNoteText: {
    flex: 1,
    color: "#625879",
    fontSize: 12,
    lineHeight: 18,
  },

bookBtn: {
  backgroundColor: "#7045C5",
  paddingVertical: 17,
  borderRadius: 16,
  marginTop: 22,
  alignItems: "center",
  justifyContent: "center",
  elevation: 4,
  shadowColor: "#4B2B91",
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
},

  disabledBtn: {
    backgroundColor: "#AAA3BA",
    elevation: 0,
  },

  btnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  bottomNote: {
    color: "#8A8499",
    textAlign: "center",
    fontSize: 11,
    marginTop: 13,
  },
  priceHint: {
  color: "#8A8499",
  fontSize: 11,
  marginTop: 5,
},
});
