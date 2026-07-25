import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import API from "../../config/api";

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
  };
  text: string;
  createdAt: string;
}

const PrivateChatScreen = ({ route }: any) => {
  const { chatId } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const res = await API.get(`/private-chat/${chatId}`);
      setMessages(res.data || []);
    } catch (err) {
      console.log("Load private messages error:", err);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    const messageText = text;
    setText("");

    try {
      const res = await API.post(
        `/private-chat/${chatId}/send`,
        { text: messageText }
      );

      setMessages(prev => [...prev, res.data]);

      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.log("Private send error:", err);
    }
  };

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
      />

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          style={styles.input}
          placeholder="Type a message..."
        />
        <TouchableOpacity
          onPress={handleSend}
          style={styles.sendBtn}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PrivateChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
  },
  message: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
  },
  sender: {
    fontWeight: "600",
    color: "#ff5a5f",
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#ff5a5f",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 10,
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
});
