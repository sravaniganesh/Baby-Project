import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import API from "../../config/api";
import { connectSocket } from "../../services/socket";

interface Doctor {
  _id: string;
  name: string;
  specialization?: string;
  experience?: number;
  rating?: number;
  availability?: "online" | "offline";
  chatPrice?: number;
  city?: string;
  state?: string;
  profileImage?: string;
}

const DoctorsScreen = () => {
  const navigation = useNavigation<any>();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeChats, setActiveChats] = useState<any>({});
  const [search, setSearch] = useState("");

  /* ================= FETCH ================= */
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await API.get("/doctors");

      const list = res.data?.doctors || res.data || [];
      setDoctors(list);
      setFilteredDoctors(list);
    } catch {
      setDoctors([]);
      setFilteredDoctors([]);
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  const socket = connectSocket();

  fetchDoctors();

  /* 🔥 SLOT AVAILABLE LISTENER */
  socket.on("slotAvailable", () => {
    Alert.alert(
      "Slots Available",
      "Doctor has added new consultation slots"
    );

    /* 🔥 AUTO REFRESH DOCTORS */
    fetchDoctors();
  });

  return () => {
    socket.off("slotAvailable");
  };
}, []);

  /* ================= SEARCH ================= */
  useEffect(() => {
    if (!search.trim()) return setFilteredDoctors(doctors);

    const filtered = doctors.filter((doc) =>
      doc.name?.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredDoctors(filtered);
  }, [search, doctors]);

  /* ================= CHECK CHAT ================= */
  const checkChatStatus = async (doctorId: string) => {
    try {
      const res = await API.get(`/chat/check/${doctorId}`);

      setActiveChats((prev: any) => ({
        ...prev,
        [doctorId]: {
          status: res.data?.status,
          chatId: res.data?.chatId,
        },
      }));
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      doctors.forEach((doc) => checkChatStatus(doc._id));
    }, [doctors])
  );

  /* ================= CHAT ================= */
  const handleChatPress = async (doctor: Doctor) => {
    try {
      const chat = activeChats[doctor._id];

      if (doctor.availability !== "online") {
        Alert.alert("Doctor Offline");
        return;
      }

      if (chat?.status === "requested") {
        Alert.alert("Waiting", "Doctor has not accepted yet");
        return;
      }

      if (["accepted", "active"].includes(chat?.status || "")) {
        navigation.navigate("DoctorChat", {
          chatId: chat.chatId,
          doctorId: doctor._id,
          doctorName: doctor.name,
        });
        return;
      }

      const wallet = await API.get("/wallet");

      if ((wallet.data.balance || 0) < (doctor.chatPrice || 0)) {
        Alert.alert("Low Balance", "Please recharge wallet");
        navigation.navigate("Profile");
        return;
      }

      Alert.alert("Start Chat", "Proceed with payment?", [
        { text: "Cancel" },
        {
          text: "Continue",
          onPress: async () => {
            const res = await API.post("/chat/start", {
              doctorId: doctor._id,
            });

            if (!res?.data?.chat?._id) return;

            setActiveChats((prev: any) => ({
              ...prev,
              [doctor._id]: {
                status: "requested",
                chatId: res.data.chat._id,
              },
            }));
          },
        },
      ]);
    } catch {}
  };

  /* ================= NAVIGATION ================= */
  const goVideo = (doctor: Doctor) => {
    navigation.navigate("ConsultationRequest", {
      doctorId: doctor._id,
      type: "video",
    });
  };

  const goHospital = (doctor: Doctor) => {
    navigation.navigate("ConsultationRequest", {
      doctorId: doctor._id,
      type: "hospital",
    });
  };

  /* ================= UI ================= */
  const renderDoctor = ({ item }: { item: Doctor }) => {
    const chat = activeChats[item._id];

    const getChatText = () => {
      if (item.availability !== "online") return "Notify";
      if (chat?.status === "requested") return "Waiting";
      if (["accepted", "active"].includes(chat?.status || ""))
        return "Continue";
      return "Chat";
    };

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          {/* DP */}
          <Image
            source={{
              uri:
                item.profileImage ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            }}
            style={styles.dp}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>

            <Text style={styles.sub}>
              {item.specialization || "General"} •{" "}
              {item.experience || 0} yrs
            </Text>

            <Text>⭐ {item.rating || 0}</Text>

            <Text style={styles.price}>
              ₹{item.chatPrice || 0}
            </Text>

            <Text
              style={{
                color:
                  item.availability === "online" ? "green" : "gray",
              }}
            >
              {item.availability === "online"
                ? "Online"
                : "Offline"}
            </Text>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => handleChatPress(item)}
          >
            <Text style={styles.btnText}>{getChatText()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.videoBtn}
            onPress={() => goVideo(item)}
          >
            <Text style={styles.btnText}>Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hospitalBtn}
            onPress={() => goHospital(item)}
          >
            <Text style={styles.btnText}>Hospital</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text>Loading Doctors...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        placeholder="Search doctor..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item._id}
        renderItem={renderDoctor}
      />
    </View>
  );
};

export default DoctorsScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 14,
    borderRadius: 12,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
  },
  dp: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sub: {
    color: "#555",
  },
  price: {
    color: "green",
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
  },
  chatBtn: {
    flex: 1,
    backgroundColor: "#8B5CF6",
    padding: 10,
    borderRadius: 6,
    marginRight: 5,
  },
  videoBtn: {
    flex: 1,
    backgroundColor: "#2563EB",
    padding: 10,
    borderRadius: 6,
    marginRight: 5,
  },
  hospitalBtn: {
    flex: 1,
    backgroundColor: "#10B981",
    padding: 10,
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
  search: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
});