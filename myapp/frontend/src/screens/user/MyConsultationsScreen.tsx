
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import API from "../../config/api";

interface ProposedSlot {
  scheduledAt: string;
  slotTime: string;
}

interface Consultation {
  _id: string;
  doctorId: {
    name: string;
    specialization: string;
  };
  hospitalId?: {
    name: string;
    city?: string;
    state?: string;
  };
  consultationType: "video" | "hospital";
  preferredDate?: string;
  scheduledAt?: string;
  proposedAt?: string;
  proposedSlots?: ProposedSlot[];
  slotTime?: string;
  consultationFee?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  status: string;
  chatId?: string;
}

const MyConsultationsScreen = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [selectedSlotByConsultation, setSelectedSlotByConsultation] =
    useState<Record<string, number>>({});

  const fetchConsultations = useCallback(async () => {
    try {
      const res = await API.get("/consultations/my");

      const data = res.data?.consultations;

setConsultations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log(
        "CONSULTATIONS FETCH ERROR:",
        err?.response?.data || err?.message
      );

      Alert.alert("Error", "Unable to load consultations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh whenever the patient returns to My Consultations.
  // This keeps proposed and accepted appointment details up to date.
  useFocusEffect(
    useCallback(() => {
      fetchConsultations();
    }, [fetchConsultations])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConsultations();
  };

  // All hospital appointment dates are displayed in IST.
  const formatDate = (date?: string) => {
    if (!date) return "Not scheduled";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Invalid date";
    }

    return parsed.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Backend stores slotTime as HH:mm (24-hour format).
  // Display it as 12-hour AM/PM.
  const formatTime = (time?: string, scheduledAt?: string) => {
    if (time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      const [hours, minutes] = time.split(":").map(Number);
      const suffix = hours >= 12 ? "PM" : "AM";
      const displayHour = hours % 12 || 12;

      return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
    }

    if (scheduledAt) {
      const parsed = new Date(scheduledAt);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
    }

    return "Not scheduled";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "#16A34A";

      case "REQUESTED":
      case "SLOT_PROPOSED":
      case "AWAITING_PAYMENT":
        return "#F59E0B";

      case "REJECTED":
      case "CANCELLED":
        return "#EF4444";

      case "COMPLETED":
        return "#6B7280";

      default:
        return "#6B7280";
    }
  };

  const getProposedSlots = (item: Consultation): ProposedSlot[] => {
    if (
      Array.isArray(item.proposedSlots) &&
      item.proposedSlots.length > 0
    ) {
      return item.proposedSlots;
    }

    // Backward compatibility with older single-slot proposals.
    if (item.proposedAt) {
      const date = new Date(item.proposedAt);

      if (!Number.isNaN(date.getTime())) {
        const hours = String(
          Number(
            date.toLocaleString("en-GB", {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              hour12: false,
            })
          )
        ).padStart(2, "0");

        const minutes = date.toLocaleString("en-GB", {
          timeZone: "Asia/Kolkata",
          minute: "2-digit",
        });

        return [
          {
            scheduledAt: item.proposedAt,
            slotTime: `${hours}:${minutes}`,
          },
        ];
      }
    }

    return [];
  };

  /* =================================
     SELECT PROPOSED SLOT
  ================================= */

  const handleSelectSlot = (consultationId: string, index: number) => {
    setSelectedSlotByConsultation((previous) => ({
      ...previous,
      [consultationId]: index,
    }));
  };

  /* =================================
     ACCEPT SELECTED HOSPITAL SLOT
  ================================= */

  const handleAcceptSlot = async (item: Consultation) => {
    const proposedSlots = getProposedSlots(item);

    const selectedIndex = selectedSlotByConsultation[item._id];

    if (
      proposedSlots.length === 0 ||
      !Number.isInteger(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= proposedSlots.length
    ) {
      Alert.alert(
        "Select Appointment",
        "Please select one of the appointment options first."
      );
      return;
    }

    Alert.alert(
      "Confirm Appointment Time",
      `Do you want to accept ${formatDate(
        proposedSlots[selectedIndex].scheduledAt
      )} at ${formatTime(
        proposedSlots[selectedIndex].slotTime,
        proposedSlots[selectedIndex].scheduledAt
      )}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Accept",
          onPress: async () => {
            try {
              setProcessingId(item._id);

              const res = await API.patch(
                `/consultations/${item._id}/accept-slot`,
                {
                  slotIndex: selectedIndex,
                }
              );

              Alert.alert(
                "Appointment Update",
                res.data?.message ||
                  "Selected appointment time accepted."
              );

              await fetchConsultations();
            } catch (err: any) {
              console.log(
                "ACCEPT SLOT ERROR:",
                err?.response?.data || err?.message
              );

              Alert.alert(
                "Unable to Accept",
                err?.response?.data?.message ||
                  "The selected slot may no longer be available. Please refresh and try another option."
              );

              await fetchConsultations();
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  /* =================================
     REJECT PROPOSED SLOT
  ================================= */

  const handleRejectSlot = (item: Consultation) => {
    Alert.alert(
      "Reject Appointment",
      "Are you sure you want to reject all the proposed appointment options?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(item._id);

              const res = await API.patch(
                `/consultations/${item._id}/reject-slot`
              );

              Alert.alert(
                "Appointment",
                res.data?.message || "Appointment proposal rejected."
              );

              setSelectedSlotByConsultation((previous) => {
                const updated = { ...previous };
                delete updated[item._id];
                return updated;
              });

              await fetchConsultations();
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.response?.data?.message ||
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

  /* =================================
     PAYMENT METHOD SELECTION
     CURRENT BACKEND: HOSPITAL ONLY
  ================================= */

 const handlePayment = (item: Consultation) => {
  if (
    item.consultationType !== "hospital" ||
    item.status !== "AWAITING_PAYMENT"
  ) {
    return;
  }

  Alert.alert(
    "Choose Payment Method",
    `Consultation fee: ₹${Number(
      item.consultationFee || 0
    ).toLocaleString("en-IN")}`,
    [
      {
        text: "Pay at Hospital",
        onPress: () => processPayment(item, "PAY_AT_HOSPITAL"),
      },
      {
        text: "Pay using Wallet",
        onPress: () => processPayment(item, "WALLET"),
      },
      {
        text: "Pay Online (Demo)",
        onPress: () => startDemoPayment(item),
      },
    ],
    { cancelable: true }
  );
};



  const processPayment = async (
    item: Consultation,
    paymentMethod: "WALLET" | "PAY_AT_HOSPITAL"
  ) => {
    try {
      setProcessingId(item._id);

      const res = await API.post(
        `/consultations/${item._id}/pay`,
        { paymentMethod }
      );

      Alert.alert(
        "Payment Update",
        res.data?.message || "Payment selection processed."
      );

      await fetchConsultations();
    } catch (err: any) {
      console.log(
        "CONSULTATION PAYMENT ERROR:",
        err?.response?.data || err?.message
      );

      Alert.alert(
        "Payment Failed",
        err?.response?.data?.message ||
          "Unable to process payment. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  };

/* =================================
   START DEMO ONLINE PAYMENT
================================= */

const startDemoPayment = async (item: Consultation) => {
  try {
    setProcessingId(item._id);

    const response = await API.post(
      `/consultations/${item._id}/demo-payment/start`
    );

    const paymentId = response.data?.payment?._id;

    if (!paymentId) {
      throw new Error("Payment ID was not returned by the server.");
    }

    Alert.alert(
      "Demo Payment",
      `Consultation fee: ₹${Number(item.consultationFee || 0).toLocaleString("en-IN")}\n\nChoose a result to test the payment flow.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => fetchConsultations(),
        },
        {
          text: "Simulate Failure",
          style: "destructive",
          onPress: () => completeDemoPayment(item, paymentId, "FAILED"),
        },
        {
          text: "Simulate Success",
          onPress: () => completeDemoPayment(item, paymentId, "SUCCESS"),
        },
      ]
    );
  } catch (err: any) {
    console.log(
      "DEMO PAYMENT START ERROR:",
      err?.response?.data || err?.message
    );

    Alert.alert(
      "Unable to Start Payment",
      err?.response?.data?.message ||
        err?.message ||
        "Please try again."
    );
  } finally {
    setProcessingId(null);
  }
};


/* =================================
   COMPLETE DEMO PAYMENT
================================= */

const completeDemoPayment = async (
  item: Consultation,
  paymentId: string,
  outcome: "SUCCESS" | "FAILED"
) => {
  try {
    setProcessingId(item._id);

    const response = await API.post(
      `/consultations/${item._id}/demo-payment/complete`,
      {
        paymentId,
        outcome,
      }
    );

    if (outcome === "SUCCESS") {
      Alert.alert(
        "Payment Successful",
        `${response.data?.message || "Demo payment completed successfully."}\n\nYour appointment is confirmed.`
      );
    } else {
      Alert.alert(
        "Payment Failed",
        `${response.data?.message || "Demo payment failed."}\n\nYour appointment is still awaiting payment. You can retry.`
      );
    }

    await fetchConsultations();
  } catch (err: any) {
    console.log(
      "DEMO PAYMENT COMPLETE ERROR:",
      err?.response?.data || err?.message
    );

    Alert.alert(
      "Payment Error",
      err?.response?.data?.message ||
        "Unable to complete the demo payment. Please refresh and try again."
    );

    await fetchConsultations();
  } finally {
    setProcessingId(null);
  }
};


  /* =================================
     APPOINTMENT INFORMATION
  ================================= */

  const handleStartConsultation = (item: Consultation) => {
    if (item.consultationType === "video") {
      Alert.alert(
        "Video Consultation",
        "Your video session will become available after the doctor accepts your request and the required payment and session workflow is completed."
      );
      return;
    }

    Alert.alert(
      "Hospital Appointment",
      `Please visit ${
        item.hospitalId?.name || "the hospital"
      } on ${formatDate(item.scheduledAt)} at ${
        formatTime(item.slotTime, item.scheduledAt)
      }.`
    );
  };

  /* =================================
     LOADING
  ================================= */

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0A7AFF" />
        <Text style={styles.loadingText}>
          Loading consultations...
        </Text>
      </View>
    );
  }

  /* =================================
     UI
  ================================= */

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.screenHeader}>
            <Text style={styles.screenTitle}>My Consultations</Text>
            <Text style={styles.screenSubtitle}>
              View your requests, appointment options and confirmed visits.
            </Text>
            <View style={styles.headerSummary}>
              <Text style={styles.headerSummaryText}>
                {consultations.length} {consultations.length === 1 ? "consultation" : "consultations"}
              </Text>
              <Text style={styles.headerSummaryHint}>Pull down to refresh</Text>
            </View>
          </View>
        }
        data={consultations}
        keyExtractor={(item) => item._id}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>🩺</Text>
            </View>
            <Text style={styles.emptyTitle}>No consultations yet</Text>
            <Text style={styles.emptyDescription}>
              Your consultation requests and appointments will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const proposedSlots = getProposedSlots(item);

          const selectedIndex =
            selectedSlotByConsultation[item._id];

          const isProcessing = processingId === item._id;

          return (
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.doctorAvatar}>
                  <Text style={styles.doctorAvatarText}>
                    {(item.doctorId?.name || "D").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.doctorHeading}>
                  <Text style={styles.name}>
                    Dr. {item.doctorId?.name || "Doctor"}
                  </Text>
                  {!!item.doctorId?.specialization && (
                    <Text style={styles.sub}>
                      {item.doctorId.specialization}
                    </Text>
                  )}
                </View>
                <View style={styles.typeChip}>
                  <Text style={styles.typeChipText}>
                    {item.consultationType === "video" ? "VIDEO" : "HOSPITAL"}
                  </Text>
                </View>
              </View>

              {item.consultationType === "hospital" && (
                <>
                  <Text style={styles.time}>
                    Hospital: {item.hospitalId?.name || "Hospital"}
                  </Text>

                  {item.status === "REQUESTED" && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Preferred date</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(item.preferredDate)}
                      </Text>
                    </View>
                  )}

                  {item.status === "SLOT_PROPOSED" && (
                    <View style={styles.proposalSection}>
                      <Text style={styles.proposalTitle}>
                        Choose your appointment
                      </Text>

                      <Text style={styles.proposalDescription}>
                        The doctor has shared these available options. Select the one that works best for you.
                      </Text>

                      {proposedSlots.length > 0 ? (
                        proposedSlots.map((slot, index) => {
                          const selected = selectedIndex === index;

                          return (
                            <TouchableOpacity
                              key={`${item._id}-${index}`}
                              style={[
                                styles.slotOption,
                                selected && styles.selectedSlotOption,
                              ]}
                              onPress={() =>
                                handleSelectSlot(item._id, index)
                              }
                              disabled={isProcessing}
                              activeOpacity={0.8}
                            >
                              <View style={styles.slotRadio}>
                                {selected && (
                                  <View style={styles.slotRadioInner} />
                                )}
                              </View>

                              <View style={styles.slotDetails}>
                                <Text
                                  style={[
                                    styles.slotDate,
                                    selected && styles.selectedSlotText,
                                  ]}
                                >
                                  {formatDate(slot.scheduledAt)}
                                </Text>

                                <Text
                                  style={[
                                    styles.slotTime,
                                    selected && styles.selectedSlotText,
                                  ]}
                                >
                                  {formatTime(
                                    slot.slotTime,
                                    slot.scheduledAt
                                  )}
                                </Text>
                              </View>

                              {selected && (
                                <Text style={styles.selectedLabel}>
                                  SELECTED
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <Text style={styles.info}>
                          No appointment options were returned. Please refresh.
                        </Text>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          (
                            isProcessing ||
                            selectedIndex === undefined ||
                            proposedSlots.length === 0
                          ) && styles.disabledBtn,
                        ]}
                        disabled={
                          isProcessing ||
                          selectedIndex === undefined ||
                          proposedSlots.length === 0
                        }
                        onPress={() => handleAcceptSlot(item)}
                      >
                        <Text style={styles.actionText}>
                          {isProcessing
                            ? "Processing..."
                            : "Accept Selected Time"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectBtn}
                        disabled={isProcessing}
                        onPress={() => handleRejectSlot(item)}
                      >
                        <Text style={styles.rejectText}>
                          Reject appointment options
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {item.scheduledAt && (
                    <>
                      <View style={styles.appointmentDetail}>
                        <Text style={styles.detailLabel}>Appointment date</Text>
                        <Text style={styles.appointmentValue}>
                          {formatDate(item.scheduledAt)}
                        </Text>
                      </View>

                      <View style={styles.appointmentDetail}>
                        <Text style={styles.detailLabel}>Appointment time</Text>
                        <Text style={styles.appointmentValue}>
                          {formatTime(item.slotTime, item.scheduledAt)}
                        </Text>
                      </View>
                    </>
                  )}
                </>
              )}

              {item.consultationType === "video" && (
                <Text style={styles.time}>
                  Video consultation request
                </Text>
              )}

              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Consultation fee</Text>
                <Text style={styles.feeValue}>
                  ₹{Number(item.consultationFee || 0).toLocaleString("en-IN")}
                </Text>
              </View>

              <View style={styles.paymentMetaRow}>
                <Text style={styles.paymentMetaLabel}>Payment</Text>
                <Text style={styles.paymentMetaValue}>
                  {(item.paymentStatus || "PENDING").replace(/_/g, " ")}
                  {item.paymentMethod
                    ? ` · ${item.paymentMethod.replace(/_/g, " ")}`
                    : ""}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(item.status),
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {({
                    REQUESTED: "REQUEST SENT",
                    SLOT_PROPOSED: "CHOOSE A TIME",
                    AWAITING_PAYMENT: "PAYMENT REQUIRED",
                    CONFIRMED: "CONFIRMED",
                    COMPLETED: "COMPLETED",
                    CANCELLED: "CANCELLED",
                    REJECTED: "REJECTED",
                  } as Record<string, string>)[item.status] || item.status.replace(/_/g, " ")}
                </Text>
              </View>

              {/* WAITING FOR DOCTOR */}

              {item.status === "REQUESTED" && (
                <Text style={styles.info}>
                  Waiting for the doctor or authorized assistant to review your request.
                </Text>
              )}

              {/* HOSPITAL PAYMENT */}

              {item.consultationType === "hospital" &&
                item.status === "AWAITING_PAYMENT" && (
                  <View style={styles.paymentSection}>
                    <Text style={styles.paymentInfo}>
                      Your appointment time has been accepted.
                      Choose a payment method to continue.
                    </Text>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      disabled={isProcessing}
                      onPress={() => handlePayment(item)}
                    >
                      <Text style={styles.actionText}>
                        {isProcessing
                          ? "Processing..."
                          : "Choose Payment Method"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

              {/* PAY AT HOSPITAL */}

              {item.consultationType === "hospital" &&
                item.status === "CONFIRMED" &&
                item.paymentMethod === "PAY_AT_HOSPITAL" &&
                item.paymentStatus === "PENDING" && (
                  <Text style={styles.pendingPayment}>
                    Appointment confirmed. Please pay at the hospital.
                    Payment is still pending.
                  </Text>
                )}

              {/* CONFIRMED */}

              {item.status === "CONFIRMED" && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleStartConsultation(item)}
                >
                  <Text style={styles.actionText}>
                    {item.consultationType === "video"
                      ? "Video Session Status"
                      : "View Hospital Appointment"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* COMPLETED */}

              {item.status === "COMPLETED" && (
                <TouchableOpacity
                  style={styles.rateBtn}
                  onPress={() =>
                    Alert.alert("Rating", "Rating feature coming soon.")
                  }
                >
                  <Text style={styles.rateText}>
                    Rate Doctor ⭐
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

export default MyConsultationsScreen;

/* =================================
   STYLES
================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F5FB"
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },

  loadingText: {
    marginTop: 10,
    color: "#6B7280",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#6B7280",
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#EEEAF5",
    shadowColor: "#30204F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2
  },

  name: {
    fontSize: 16,
    fontWeight: "800",
    color: "#252238"
  },

  sub: {
    fontSize: 12,
    color: "#817B91",
    marginTop: 4
  },

  type: {
    marginTop: 9,
    fontWeight: "600",
    color: "#374151",
  },

  time: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
  },

  proposalSection: {
    marginTop: 16,
    padding: 15,
    backgroundColor: "#F8F5FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8DFFC"
  },

  proposalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
  },

  proposalDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
    marginBottom: 10,
  },

  slotOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9E4F1",
    borderRadius: 13,
    padding: 13,
    marginBottom: 9
  },

  selectedSlotOption: {
    borderColor: "#7045C5",
    backgroundColor: "#F3EEFF"
  },

  slotRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  slotRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#7045C5"
  },

  slotDetails: {
    flex: 1,
  },

  slotDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },

  slotTime: {
    fontSize: 14,
    fontWeight: "800",
    color: "#7045C5",
    marginTop: 4
  },

  selectedSlotText: {
    color: "#5B35A5"
  },

  selectedLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#7045C5"
  },

  info: {
    marginTop: 12,
    color: "#92400E",
    fontSize: 13,
    lineHeight: 19,
  },

  statusBadge: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    alignSelf: "flex-start"
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  actionBtn: {
    marginTop: 13,
    backgroundColor: "#7045C5",
    paddingVertical: 14,
    borderRadius: 13,
    alignItems: "center"
  },

  disabledBtn: {
    backgroundColor: "#9CA3AF",
  },

  rejectBtn: {
    marginTop: 9,
    backgroundColor: "#FFF0F0",
    paddingVertical: 13,
    borderRadius: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F8D5D5"
  },

  actionText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13
  },

  paymentSection: {
    marginTop: 10,
  },

  paymentInfo: {
    color: "#374151",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },

  pendingPayment: {
    marginTop: 12,
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#FFF7E6",
    color: "#98620A",
    fontSize: 12,
    lineHeight: 19
  },

  rateBtn: {
    marginTop: 13,
    backgroundColor: "#F59E0B",
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: "center",
  },

  rateText: {
    color: "#000000",
    fontWeight: "700",
  },

  screenHeader: {
    paddingTop: 8,
    paddingBottom: 17,
  },
  screenTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: "#252238",
  },
  screenSubtitle: {
    color: "#817B91",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  headerSummary: {
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#EEE8FA",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerSummaryText: {
    color: "#5B35A5",
    fontSize: 12,
    fontWeight: "800",
  },
  headerSummaryHint: {
    color: "#81739C",
    fontSize: 11,
  },
  emptyCard: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 26,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEAF5",
  },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "#F1EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyEmoji: {
    fontSize: 30,
  },
  emptyTitle: {
    marginTop: 15,
    fontSize: 17,
    fontWeight: "800",
    color: "#252238",
  },
  emptyDescription: {
    marginTop: 7,
    textAlign: "center",
    color: "#817B91",
    fontSize: 13,
    lineHeight: 20,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  doctorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#EEE8FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  doctorAvatarText: {
    color: "#7045C5",
    fontSize: 20,
    fontWeight: "900",
  },
  doctorHeading: {
    flex: 1,
  },
  typeChip: {
    backgroundColor: "#F1EDFF",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeChipText: {
    color: "#7045C5",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F2EFF7",
  },
  detailLabel: {
    color: "#817B91",
    fontSize: 12,
    fontWeight: "600",
  },
  detailValue: {
    color: "#383248",
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  appointmentDetail: {
    marginTop: 10,
    padding: 13,
    borderRadius: 13,
    backgroundColor: "#F4F0FC",
  },
  appointmentValue: {
    color: "#5B35A5",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#F0EDF5",
  },
  feeLabel: {
    color: "#817B91",
    fontSize: 12,
    fontWeight: "600",
  },
  feeValue: {
    color: "#15966A",
    fontSize: 17,
    fontWeight: "900",
  },
  paymentMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 9,
  },
  paymentMetaLabel: {
    color: "#817B91",
    fontSize: 11,
  },
  paymentMetaValue: {
    color: "#5D586B",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    flexShrink: 1,
    marginLeft: 10,
  },
  rejectText: {
    color: "#B42318",
    fontWeight: "800",
    fontSize: 13,
  },

});
