import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

import API from "../../config/api";

import { connectSocket, safeJoinRoom } from "../../services/socket";
interface StageMessage {
  _id: string;
  stageKey: string;
  sender: {
    _id: string;
    name: string;
  };
  text: string;
  createdAt: string;
}

const WomenChatScreen = ({ route }: any) => {
  const selectedStageKey = route?.params?.stageKey;

  const [messages, setMessages] = useState<StageMessage[]>([]);
  const [text, setText] = useState("");

  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<any>(null);

  /* ================= LOAD ================= */

  useEffect(() => {
    const init = async () => {
      try {
       const socket = socketRef.current || connectSocket();
socketRef.current = socket;

        // 🔥 JOIN ROOM FIRST

if (socket.connected) {
  socket.emit("join_room", `women_${selectedStageKey}`);
} else {
  socket.once("connect", () => {
    socket.emit("join_room", `women_${selectedStageKey}`);
  });
}

        // 🔥 CLEAR OLD LISTENER SAFELY
        socket.off("women:new_message");

        socket.on("women:new_message", (msg: StageMessage) => {
        
          setMessages((prev) => {
            const exists = prev.some((m) => m._id === msg._id);
            if (exists) return prev;
            return [...prev, msg];
          });
        });

        // 🔥 THEN FETCH HISTORY
        const res = await API.get("/women-chat/messages", {
          params: { stageKey: selectedStageKey },
        });

        setMessages(res.data.messages || []);

        // Scroll to bottom after load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 200);

      } catch (err) {
        console.log("Women chat init error:", err);
      }
    };

    init();

    return () => {
      // 🔥 Clean listener on stage change
      socketRef.current?.off("women:new_message");
    };
  }, [selectedStageKey]);

  /* ================= SEND ================= */

  const handleSend = async () => {
    if (!text.trim()) return;

    const messageText = text;
    setText("");

    try {
      await API.post("/women-chat/send", {
        text: messageText,
        stageKey: selectedStageKey,
      });
    } catch (err) {
      console.log("Send error:", err);
    }
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.message}>
            <Text style={styles.sender}>{item.sender?.name}</Text>
            <Text>{item.text}</Text>
          </View>
        )}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Share your thoughts..."
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WomenChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#fff" },
  message: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
  },
  sender: { fontWeight: "600", color: "#ff5a5f" },
  inputRow: { flexDirection: "row", marginTop: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#ff5a5f",
    padding: 10,
    borderRadius: 6,
  },
  sendText: { color: "#fff", fontWeight: "600" },
});