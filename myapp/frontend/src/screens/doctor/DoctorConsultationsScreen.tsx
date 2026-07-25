import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import API from "../../config/api";

const DoctorConsultationsScreen = () => {
  const navigation = useNavigation<any>();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */
  const fetchData = async () => {
    try {
      setLoading(true);

      /* 🔹 CHAT */
      const chatRes = await API.get("/chat/doctor/requests");
      const chats = chatRes.data?.consultations || [];

      const chatList = chats.map((c: any) => ({
        ...c,
        type: "chat",
      }));

      /* 🔹 BOOKINGS */
      let bookingList: any[] = [];
      try {
        const bookingRes = await API.get("/consultation/doctor");
        bookingList = (bookingRes.data || []).map((b: any) => ({
          _id: b._id,
          userName: b.userName || "User",
          type: b.type, // video / hospital
          status: "booked",
          date: b.date,
          time: b.time,
        }));
      } catch {
        bookingList = [];
      }

      /* 🔥 NOTIFY REQUESTS */
let notifyList: any[] = [];

try {
  const res = await API.get("/consultation/notify/doctor");

  notifyList = (res.data || []).map((n: any) => ({
    _id: n._id,
    userName: n.userName || "User",
    type: "notify",
    status: "requested",
  }));
} catch {
  notifyList = [];
}

      /* 🔹 MERGE */
      setData([...chatList, ...bookingList]);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= ACCEPT ================= */
  const handleAccept = async (chatId: string) => {
    try {
      await API.post(`/chat/${chatId}/accept`);

      setData((prev) =>
        prev.map((c) =>
          c._id === chatId ? { ...c, status: "accepted" } : c
        )
      );
    } catch {}
  };

  /* ================= OPEN CHAT ================= */
  const openChat = (item: any) => {
    navigation.navigate("DoctorChat", {
      chatId: item._id,
      userName: item.userName,
    });
  };

  /* ================= UI ================= */
  const renderItem = ({ item }: any) => {
    return (
      <View style={styles.card}>
        <Text style={styles.name}>{item.userName}</Text>

        <Text style={styles.type}>
          {item.type?.toUpperCase()}
        </Text>

        {/* CHAT */}
        {item.type === "chat" && (
          <>
            <Text>Status: {item.status}</Text>

            {item.status === "requested" && (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAccept(item._id)}
              >
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>
            )}

            {["accepted", "active", "paused"].includes(item.status) && (
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => openChat(item)}
              >
                <Text style={styles.btnText}>Open Chat</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* VIDEO / HOSPITAL */}
        {item.type !== "chat" && (
          <>
            <Text>
              {item.date} • {item.time}
            </Text>

            <Text style={{ color: "green", marginTop: 5 }}>
              Booked
            </Text>
          </>
        )}
        {item.type === "notify" && (
  <>
    <Text style={{ marginTop: 5 }}>
      User requested notification
    </Text>

    <Text style={{ color: "#F59E0B", marginTop: 5 }}>
      Waiting for slots
    </Text>
  </>
)}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
    />
  );
};

export default DoctorConsultationsScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 12,
    margin: 10,
    borderRadius: 8,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  type: {
    marginTop: 5,
    color: "#2563EB",
    fontWeight: "bold",
  },
  acceptBtn: {
    backgroundColor: "#10B981",
    padding: 10,
    marginTop: 10,
    borderRadius: 6,
  },
  chatBtn: {
    backgroundColor: "#2563EB",
    padding: 10,
    marginTop: 10,
    borderRadius: 6,
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
});