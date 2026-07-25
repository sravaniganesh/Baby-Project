import React, { useEffect, useState } from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNotifications } from "../../context/NotificationContext";
import { useNavigation } from "@react-navigation/native";

const InAppNotificationBanner = () => {
  const { notifications } = useNotifications();
  const navigation = useNavigation<any>();
  const [visibleNotification, setVisibleNotification] = useState<any>(null);

  useEffect(() => {
    if (notifications.length === 0) return;

    const latest = notifications[0];
    setVisibleNotification(latest);

    const timer = setTimeout(() => {
      setVisibleNotification(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [notifications]);

  if (!visibleNotification) return null;

  const handlePress = () => {
    const type = visibleNotification.type;
    const data = visibleNotification.data || {};

    setVisibleNotification(null);

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

      default:
        navigation.navigate("Notifications");
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Text style={styles.title}>{visibleNotification.title}</Text>
      <Text style={styles.message}>{visibleNotification.message}</Text>
    </TouchableOpacity>
  );
};

export default InAppNotificationBanner;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 10,
    zIndex: 999,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
  },
  message: {
    color: "#ddd",
    marginTop: 3,
  },
});