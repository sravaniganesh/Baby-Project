import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import API from "../../config/api";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

interface ChatUser {
  _id: string;
  name: string;
  username: string;
}

interface PrivateChat {
  _id: string;
  participants: ChatUser[];
  updatedAt: string;
}

const PrivateChatListScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [chats, setChats] = useState<PrivateChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const res = await API.get("/private-chat");
      setChats(res.data || []);
    } catch (err) {
      console.log("Private chat list error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (chat: PrivateChat) => {
    navigation.navigate("PrivateChat", {
      chatId: chat._id,
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ff5a5f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Private Messages</Text>

        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => navigation.navigate("StartPrivateChat")}
        >
          <Text style={styles.newChatText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>
            Start a new chat using username
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            // 🔥 SAFE: find other user properly
            const otherUser = item.participants.find(
              (p) => p._id !== user?._id
            );

            return (
              <TouchableOpacity
                style={styles.chatCard}
                onPress={() => openChat(item)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {otherUser?.name?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {otherUser?.name || "User"}
                  </Text>
                  <Text style={styles.username}>
                    @{otherUser?.username || "username"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

export default PrivateChatListScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 16,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  header: {
    fontSize: 22,
    fontWeight: "600",
  },

  newChatBtn: {
    backgroundColor: "#ff5a5f",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  newChatText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ff5a5f",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
  },

  username: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },

  emptyState: {
    marginTop: 80,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  emptySub: {
    fontSize: 13,
    color: "#777",
    marginTop: 6,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
