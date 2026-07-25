import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import API from "../../config/api";
import { ScrollView } from "react-native";

const ConsultationRequestScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { doctorId, type } = route.params;

  const [doctor, setDoctor] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [groupedSlots, setGroupedSlots] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /* ================= FETCH ================= */
  const fetchData = async () => {
  try {
    setLoading(true);

    const docRes = await API.get(`/doctors/${doctorId}`);
    setDoctor(docRes.data?.doctor || docRes.data);

    const slotRes = await API.get(
      `/doctors/${doctorId}/slots?type=${type}`
    );

    const slotList = slotRes.data?.slots || [];

    setSlots(slotList);

    /* 🔥 GROUP SLOTS BY DATE */
    const grouped: any = {};

    slotList.forEach((slot: any) => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });

    setGroupedSlots(grouped);

    /* 🔥 SET DEFAULT DATE */
    const dates = Object.keys(grouped);
    if (dates.length > 0) {
      setSelectedDate(dates[0]);
    }

  } catch {
    setDoctor(null);
    setSlots([]);
    setGroupedSlots({});
  } finally {
    setLoading(false);
  }
};
  

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= PRICE ================= */
  const getPrice = () => {
  if (!doctor) return 0;

  if (type === "video") return doctor.consultationFee || doctor.videoPrice || 0;
  if (type === "hospital")
    return doctor.consultationFee || doctor.hospitalPrice || 0;

  return 0;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);

  const day = date.toLocaleDateString("en-US", {
    weekday: "short",
  });

  const month = date.toLocaleDateString("en-US", {
    month: "short",
  });

  const dateNum = date.getDate();

  return {
    day: day.toUpperCase(),
    month,
    date: dateNum,
  };
};

const handleNotify = async () => {
  try {
    await API.post("/consultation/notify", {
      doctorId,
      type,
    });

    Alert.alert(
      "Request Sent",
      "You will be notified when slots are available"
    );
  } catch (err) {
    Alert.alert("Error", "Failed to send request");
  }
};

  /* ================= BOOK ================= */
 const handleBooking = async () => {
  try {
    /* ✅ FIRST: VALIDATIONS (ADD HERE) */
    if (slots.length === 0) {
      
      return;
    }

    if (!selectedSlot) {
      Alert.alert("Select a slot", "Please choose a time slot");
      return;
    }
   

    /* 🔽 EXISTING CODE CONTINUES */
    setBooking(true);

    const wallet = await API.get("/wallet");

    if ((wallet.data.balance || 0) < getPrice()) {
      Alert.alert("Low Balance", "Recharge wallet");
      navigation.navigate("Profile");
      return;
    }

    const res = await API.post("/consultation/book", {
      doctorId,
      slotId: selectedSlot._id,
      type,
    });

    if (!res?.data?.success) {
      Alert.alert("Booking failed");
      return;
    }

    Alert.alert("Success", "Consultation booked");

    navigation.goBack();
  } catch {
    Alert.alert("Error booking");
  } finally {
    setBooking(false);
  }
};
  /* ================= UI ================= */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text>Loading slots...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {type === "video" ? "Video Consultation" : "Hospital Visit"}
      </Text>

      <Text style={styles.price}>
        Price: ₹{getPrice()}
      </Text>

      {/* SLOT LIST */}
{/* ================= EMPTY STATE ================= */}
{slots.length === 0 && (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📅</Text>

    <Text style={styles.emptyTitle}>
      No slots available
    </Text>

    <Text style={styles.emptySub}>
      Doctor hasn’t added availability yet
    </Text>

    <View style={styles.emptyActions}>
      <TouchableOpacity
  style={styles.notifyBtn}
  onPress={handleNotify}
>
  <Text style={styles.notifyText}>Notify Me</Text>
</TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.secondaryText}>
          Try Another Doctor
        </Text>
      </TouchableOpacity>
    </View>
  </View>
)}

{/* ================= DATE SELECT ================= */}
{Object.keys(groupedSlots).length > 0 && (
  <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  style={styles.dateRow}
>
   {Object.keys(groupedSlots).map((date) => {
  const selected = selectedDate === date;

  const d = formatDate(date); // ✅ MUST BE HERE

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
      <Text style={[styles.dayText, selected && styles.activeText]}>
        {d.day}
      </Text>

      <Text style={[styles.dateText, selected && styles.activeText]}>
        {d.date}
      </Text>

      <Text style={[styles.monthText, selected && styles.activeText]}>
        {d.month}
      </Text>
    </TouchableOpacity>
  );
})}
    
 </ScrollView>
)}

{/* ================= TIME SELECT ================= */}
{selectedDate && groupedSlots[selectedDate] && (
  <View style={styles.timeGrid}>
    {groupedSlots[selectedDate].map((slot: any) => {
      const selected = selectedSlot?._id === slot._id;

      return (
       <TouchableOpacity
  key={slot._id}
  style={[
    styles.timeBtn,
    selected && styles.activeTime,
  ]}
  onPress={() => setSelectedSlot(slot)}
>
  <Text style={[styles.timeText, selected && styles.activeText]}>
    {slot.time}
  </Text>
</TouchableOpacity>
      );
    })}
  </View>
)}
      

      {/* BOOK BUTTON */}
      <TouchableOpacity
  style={[
    styles.bookBtn,
    (!selectedSlot || slots.length === 0) && {
      backgroundColor: "#9CA3AF",
    },
  ]}
  onPress={handleBooking}
  disabled={!selectedSlot || slots.length === 0 || booking}
>
  <Text style={styles.btnText}>
    {booking ? "Booking..." : "Confirm Booking"}
  </Text>
</TouchableOpacity>
    </View>
  );
};

export default ConsultationRequestScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  price: {
    marginVertical: 10,
    color: "green",
    fontWeight: "bold",
  },
  slot: {
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  selectedSlot: {
    backgroundColor: "#8B5CF6",
  },
  bookBtn: {
    backgroundColor: "#10B981",
    padding: 14,
    marginTop: 20,
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
  marginTop: 50,
  alignItems: "center",
},

emptyIcon: {
  fontSize: 40,
},

emptyTitle: {
  fontSize: 16,
  fontWeight: "bold",
  marginTop: 10,
},

emptySub: {
  color: "#666",
  marginTop: 5,
},

emptyActions: {
  flexDirection: "row",
  marginTop: 15,
},

notifyBtn: {
  backgroundColor: "#2563EB",
  padding: 10,
  borderRadius: 6,
  marginRight: 10,
},

notifyText: {
  color: "#fff",
  fontWeight: "bold",
},

secondaryBtn: {
  padding: 10,
},

secondaryText: {
  color: "#2563EB",
},
dateRow: {
  marginVertical: 10,
},

dateBtn: {
  padding: 10,
  backgroundColor: "#E5E7EB",
  borderRadius: 8,
  marginRight: 10,   // 👈 important spacing
  alignItems: "center",
  width: 60,
},

activeDate: {
  backgroundColor: "#2563EB",
},

timeGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 10,
},

timeBtn: {
  paddingVertical: 8,
  paddingHorizontal: 14,
  backgroundColor: "#F3F4F6",
  borderRadius: 20,
  margin: 5,
},

activeTime: {
  backgroundColor: "#8B5CF6",
},
dayText: {
  fontSize: 10,
  color: "#6B7280",
},

dateText: {
  fontSize: 16,
  fontWeight: "bold",
},

monthText: {
  fontSize: 10,
  color: "#6B7280",
},

activeText: {
  color: "#fff",
},
timeText: {
  fontSize: 14,
  fontWeight: "500",
},
});