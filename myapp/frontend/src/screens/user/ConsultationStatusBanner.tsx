
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import API from "../../config/api";

interface Consultation {
  _id: string;
  status: string;
  consultationType?: string;
  createdAt?: string;
  doctorId?: {
    name?: string;
  };
}

const ConsultationStatusBanner = () => {
  const navigation = useNavigation<any>();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await API.get("/consultations/my");
      const raw = response.data?.consultations;

      let list: Consultation[] = [];

      if (Array.isArray(raw)) {
        list = raw;
      } else if (Array.isArray(response.data)) {
        list = response.data;
      } else if (Array.isArray(response.data?.data)) {
        list = response.data.data;
      }

      setConsultations(list);
    } catch (error: any) {
      console.log(
        "CONSULTATION BANNER ERROR:",
        error?.response?.data || error?.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus])
  );

  if (loading) {
    return null;
  }

  const confirmed = consultations.filter(
    (item) => item.status === "CONFIRMED"
  ).length;

  const waiting = consultations.filter(
    (item) => item.status === "REQUESTED"
  ).length;

  const slotsAvailable = consultations.filter(
    (item) => item.status === "SLOT_PROPOSED"
  ).length;

  const paymentPending = consultations.filter(
    (item) => item.status === "AWAITING_PAYMENT"
  ).length;

  const totalActive =
    confirmed + waiting + slotsAvailable + paymentPending;

  if (totalActive === 0) {
    return null;
  }

  const statusItems = [
    {
      count: confirmed,
      title: "Appointments confirmed",
      description: "Your appointments are successfully booked",
      icon: "✓",
      color: "#28745F",
      background: "#F0F7F2",
      border: "#D9E9DD",
    },
    {
      count: waiting,
      title: "Awaiting confirmation",
      description: "Waiting for your doctor or hospital",
      icon: "◷",
      color: "#A47732",
      background: "#FBF6EA",
      border: "#EFE3C7",
    },
    {
      count: slotsAvailable,
      title: "Appointment times available",
      description: "Choose your preferred appointment time",
      icon: "↗",
      color: "#49718D",
      background: "#EFF5F8",
      border: "#DCE8EF",
    },
    {
      count: paymentPending,
      title: "Payment pending",
      description: "Complete payment to confirm your booking",
      icon: "₹",
      color: "#B36D36",
      background: "#FCF3EA",
      border: "#F0DFCE",
    },
  ].filter((item) => item.count > 0);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => navigation.navigate("MyConsultations")}
      style={styles.container}
    >
      <View style={styles.topAccent} />

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>✚</Text>
        </View>

        <View style={styles.headerDetails}>
          <Text style={styles.eyebrow}>YOUR HEALTH JOURNEY</Text>
          <Text style={styles.heading}>Consultation updates</Text>
          <Text style={styles.subheading}>
            Your appointments, all in one place
          </Text>
        </View>

        <View style={styles.totalBadge}>
          <Text style={styles.totalNumber}>{totalActive}</Text>
          <Text style={styles.totalLabel}>ACTIVE</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsContainer}>
        {statusItems.map((item, index) => (
          <View
            key={item.title}
            style={[
              styles.statCard,
              {
                backgroundColor: item.background,
                borderColor: item.border,
              },
              index !== statusItems.length - 1 && styles.statSpacing,
            ]}
          >
            <View style={styles.statNumberWrap}>
              <Text style={[styles.statNumber, { color: item.color }]}>
                {item.count}
              </Text>
            </View>

            <View style={styles.statDetails}>
              <Text style={styles.statTitle}>{item.title}</Text>
              <Text style={styles.statDescription}>
                {item.description}
              </Text>
            </View>

            <View
              style={[
                styles.statIconWrap,
                { backgroundColor: "#FFFFFF" },
              ]}
            >
              <Text style={[styles.statIcon, { color: item.color }]}>
                {item.icon}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>View your consultation details</Text>
        </View>

        <Text style={styles.footerArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFEFA",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#EAE5D9",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#283D36",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  topAccent: {
    height: 4,
    backgroundColor: "#B99A62",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 17,
    paddingBottom: 15,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#EAF2EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#DCE8DE",
  },

  headerIconText: {
    color: "#28634F",
    fontSize: 21,
    fontWeight: "800",
  },

  headerDetails: {
    flex: 1,
  },

  eyebrow: {
    color: "#A58A58",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 4,
  },

  heading: {
    color: "#203F36",
    fontSize: 16,
    fontWeight: "800",
  },

  subheading: {
    color: "#89918A",
    fontSize: 11,
    marginTop: 4,
  },

  totalBadge: {
    backgroundColor: "#F4F0E6",
    borderRadius: 13,
    minWidth: 54,
    paddingHorizontal: 9,
    paddingVertical: 7,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9DFC9",
  },

  totalNumber: {
    color: "#866D3E",
    fontSize: 19,
    fontWeight: "800",
  },

  totalLabel: {
    color: "#967F53",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginTop: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#F0EDE5",
    marginHorizontal: 16,
  },

  statsContainer: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 3,
  },

  statCard: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 65,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },

  statSpacing: {
    marginBottom: 8,
  },

  statNumberWrap: {
    width: 37,
    alignItems: "center",
    justifyContent: "center",
  },

  statNumber: {
    fontSize: 23,
    fontWeight: "900",
  },

  statDetails: {
    flex: 1,
    marginLeft: 8,
  },

  statTitle: {
    color: "#30433A",
    fontSize: 12,
    fontWeight: "800",
  },

  statDescription: {
    color: "#7E8981",
    fontSize: 10,
    marginTop: 4,
  },

  statIconWrap: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  statIcon: {
    fontSize: 17,
    fontWeight: "800",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0EDE5",
  },

  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#B99A62",
    marginRight: 8,
  },

  footerText: {
    color: "#557064",
    fontSize: 11,
    fontWeight: "700",
  },

  footerArrow: {
    color: "#A58A58",
    fontSize: 23,
    fontWeight: "700",
  },
});

export default ConsultationStatusBanner;
