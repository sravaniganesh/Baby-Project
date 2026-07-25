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
import { useRoute } from "@react-navigation/native";
import { connectSocket } from "../../services/socket";

const DoctorChatScreen = () => {
  const route = useRoute<any>();

  const { chatId, userName } = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const [chatStatus, setChatStatus] = useState("requested");

  const [isDoctorInChat, setIsDoctorInChat] = useState(false);
  const [isUserInChat, setIsUserInChat] = useState(false);

  const [seconds, setSeconds] = useState(0);

  const socketRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  /* ================= SOCKET INIT ================= */
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.emit("joinChat", { chatId, role: "doctor" });
    setIsDoctorInChat(true);

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

    /* ================= TIMER SYNC ================= */
    socket.on("timerUpdate", (time: number) => {
      setSeconds(time);
    });

    return () => {
      socket.emit("leaveChat", { chatId, role: "doctor" });
      socket.disconnect();

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /* ================= TIMER (DISPLAY ONLY) ================= */
  useEffect(() => {
    if (chatStatus === "active" && isDoctorInChat && isUserInChat) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [chatStatus, isDoctorInChat, isUserInChat]);

  /* ================= ACCEPT CHAT ================= */
  const handleAccept = () => {
    if (!socketRef.current) return;

    socketRef.current.emit("acceptChat", { chatId });
  };

  /* ================= END CHAT ================= */
  const handleEndChat = () => {
    if (!socketRef.current) return;

    socketRef.current.emit("endChat", {
      chatId,
      reason: "doctor_end",
    });

    Alert.alert("Chat Ended");
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
    if (chatStatus === "requested") return "New request";
    if (chatStatus === "accepted") return "Accepted. Waiting user...";
    if (chatStatus === "active") return "Consultation ongoing";
    if (chatStatus === "paused") return "User left. Paused";
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
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.status}>{getStatusText()}</Text>
        <Text style={styles.timer}>{formatTime()}</Text>
      </View>

      {/* ACTIONS */}
      {chatStatus === "requested" && (
        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
          <Text style={styles.btnText}>Accept Request</Text>
        </TouchableOpacity>
      )}

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
      {chatStatus === "active" && isUserInChat && (
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

      {/* END BUTTON */}
      {chatStatus === "active" && (
        <TouchableOpacity style={styles.endBtn} onPress={handleEndChat}>
          <Text style={styles.btnText}>End Chat</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default DoctorChatScreen;

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
    backgroundColor: "#2563EB",
    marginLeft: 10,
    padding: 12,
    borderRadius: 8,
  },
  acceptBtn: {
    backgroundColor: "#10B981",
    margin: 10,
    padding: 12,
    borderRadius: 8,
  },
  endBtn: {
    backgroundColor: "#EF4444",
    margin: 10,
    padding: 12,
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});