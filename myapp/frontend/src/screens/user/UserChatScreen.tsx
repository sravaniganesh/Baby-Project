import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import API from "../../config/api";
import { connectSocket } from "../../services/socket";

const SESSION_BLOCK_SECONDS = 300; // 5 minutes

const UserChatScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { chatId, doctorId, doctorName } = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const [chatStatus, setChatStatus] = useState("requested");

  const [isUserInChat, setIsUserInChat] = useState(false);
  const [isDoctorInChat, setIsDoctorInChat] = useState(false);

  const [seconds, setSeconds] = useState(0);

  const socketRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  /* ================= INIT SOCKET ================= */
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    // Join chat
    socket.emit("joinChat", { chatId, role: "user" });
    setIsUserInChat(true);

    /* ================= RECEIVE MESSAGE ================= */
    socket.on("receiveMessage", (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });

    /* ================= CHAT STATUS ================= */
    socket.on("chatStatus", (data: any) => {
      setChatStatus(data.status);
      setIsDoctorInChat(data.isDoctorInChat);
      setIsUserInChat(data.isUserInChat);
    });

    /* ================= TIMER SYNC (OPTIONAL BACKEND) ================= */
    socket.on("timerUpdate", (time: number) => {
      setSeconds(time);
    });

    return () => {
      socket.emit("leaveChat", { chatId, role: "user" });
      socket.disconnect();

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /* ================= TIMER + BILLING ================= */
  useEffect(() => {
    if (chatStatus === "active" && isDoctorInChat && isUserInChat) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setSeconds((prev) => {
            const newTime = prev + 1;

            // 🔥 Every 5 minutes → billing check
            if (newTime % SESSION_BLOCK_SECONDS === 0) {
              handleSessionCheck(newTime);
            }

            return newTime;
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [chatStatus, isDoctorInChat, isUserInChat]);

  /* ================= SESSION CHECK ================= */
  const handleSessionCheck = async (time: number) => {
    try {
      const wallet = await API.get("/wallet");

      if ((wallet.data.balance || 0) <= 0) {
        stopChatDueToLowBalance();
      }
    } catch {}
  };

  /* ================= STOP CHAT ================= */
  const stopChatDueToLowBalance = () => {
    if (!socketRef.current) return;

    socketRef.current.emit("endChat", {
      chatId,
      reason: "low_balance",
    });

    Alert.alert(
      "Session Ended",
      "Your wallet balance is low. Please recharge to continue.",
      [
        {
          text: "Recharge",
          onPress: () => navigation.navigate("Profile"),
        },
      ]
    );
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = () => {
    if (!input.trim()) return;

    socketRef.current.emit("sendMessage", {
      chatId,
      text: input,
    });

    setInput("");
  };

  /* ================= STATUS TEXT ================= */
  const getStatusText = () => {
    if (chatStatus === "requested") return "Waiting for doctor...";
    if (chatStatus === "accepted") return "Doctor accepted. Waiting to start";
    if (chatStatus === "active") return "Consultation ongoing";
    if (chatStatus === "paused") return "Chat paused";
    if (chatStatus === "ended") return "Session ended";
    return "";
  };

  /* ================= FORMAT TIMER ================= */
  const formatTime = () => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${("0" + sec).slice(-2)}`;
  };

  /* ================= UI ================= */
  return (
    <View style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.name}>{doctorName}</Text>
        <Text style={styles.status}>{getStatusText()}</Text>
        <Text style={styles.timer}>{formatTime()}</Text>
      </View>

      {/* MESSAGES */}
      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.msg}>
            <Text>{item.text}</Text>
          </View>
        )}
      />

      {/* INPUT */}
      {chatStatus === "active" && isDoctorInChat && (
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            style={styles.input}
            placeholder="Type message..."
          />

          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={{ color: "#fff" }}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default UserChatScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  header: {
    padding: 12,
    backgroundColor: "#F3F4F6",
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  status: {
    color: "#555",
    marginTop: 4,
  },
  timer: {
    marginTop: 4,
    color: "green",
    fontWeight: "bold",
  },
  msg: {
    padding: 10,
  },
  inputRow: {
    flexDirection: "row",
    padding: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
  },
  sendBtn: {
    backgroundColor: "#8B5CF6",
    marginLeft: 10,
    padding: 12,
    borderRadius: 8,
  },
});