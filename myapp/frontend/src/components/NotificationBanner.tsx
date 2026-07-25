import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { connectSocket } from "../services/socket";
import { useNavigation } from "@react-navigation/native";

const NotificationBanner = () => {
  const navigation = useNavigation<any>();
  const [notification, setNotification] = useState<any>(null);

  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const socket = connectSocket();

    if (!socket) return;

    socket.on("new_notification", (data: any) => {
      setNotification(data);

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        hideBanner();
      }, 4000);
    });

    return () => {
      socket.off("new_notification");
    };
  }, []);

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setNotification(null));
  };

  const handlePress = () => {
    if (!notification) return;

    const type = notification.type;
    const data = notification.data || {};

    switch (type) {
      case "CHAT_MESSAGE":
      case "DOCTOR_MESSAGE":
        navigation.navigate("UserChat", {
          chatId: data.chatId,
          doctorId: data.doctorId,
          doctorName: data.doctorName || "Doctor",
        });
        break;

      case "PREMIUM":
        navigation.navigate("PremiumPlans");
        break;

      case "ORDER_UPDATE":
        navigation.navigate("Orders");
        break;

      default:
        navigation.navigate("Notifications");
    }

    hideBanner();
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <TouchableOpacity onPress={handlePress} style={styles.banner}>
        <Text style={styles.title}>🔔 {notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default NotificationBanner;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    zIndex: 9999,
  },

  banner: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 10,
    elevation: 5,
  },

  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  message: {
    color: "#ddd",
    marginTop: 2,
    fontSize: 13,
  },
});