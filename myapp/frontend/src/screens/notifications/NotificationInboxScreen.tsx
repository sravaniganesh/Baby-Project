import React, { useEffect, useState, useCallback } from "react";
import {
View,
Text,
FlatList,
StyleSheet,
ActivityIndicator,
RefreshControl,
TouchableOpacity,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import API from "../../config/api";
import { connectSocket } from "../../services/socket";
import { SectionList } from "react-native";

const NotificationInboxScreen = () => {
const navigation = useNavigation<any>();

const [notifications, setNotifications] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);

const fetchNotifications = async () => {
try {
const res = await API.get("/notifications");
setNotifications(res.data);
} catch (err) {
console.log("Notification fetch error", err);
} finally {
setLoading(false);
setRefreshing(false);
}
};

useEffect(() => {
fetchNotifications();

const socket = connectSocket();

socket.on("new_notification", (notification: any) => {
setNotifications((prev) => [notification, ...prev]);
});

return () => {
socket.off("new_notification");
};

}, []);

const onRefresh = useCallback(() => {
setRefreshing(true);
fetchNotifications();
}, []);

// 🔔 ADDITIVE — Notification icons
const getNotificationIcon = (type: string) => {
switch (type) {
case "CHAT_MESSAGE":
case "DOCTOR_MESSAGE":
return "💬";

case "PREMIUM":
return "⭐";

case "STAGE":
return "👶";

case "ORDER_UPDATE":
return "🛒";

case "ADMIN":
return "📢";

default:
return "🔔";
}
};

// Smart routing
const handleNotificationPress = (notification: any) => {
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

case "ORDER_UPDATE":
navigation.navigate("Orders");
break;

case "PREMIUM":
navigation.navigate("PremiumPlans");
break;

case "STAGE":
navigation.navigate("Home");
break;

default:
navigation.navigate("Home");
}
};

const renderItem = ({ item }: any) => (
<TouchableOpacity
onPress={() => handleNotificationPress(item)}
style={[styles.card, !item.isRead && styles.unreadCard]}

>

<View style={styles.row}>
<Text style={styles.icon}>{getNotificationIcon(item.type)}</Text>

<View style={styles.content}>
<Text style={styles.title}>{item.title}</Text>

<Text style={styles.message}>{item.message}</Text>

<Text style={styles.time}>
{new Date(item.createdAt).toLocaleString()}
</Text>
</View>
</View>

</TouchableOpacity>
);

if (loading) {
return ( <View style={styles.center}> <ActivityIndicator size="large" /> </View>
);
}

if (notifications.length === 0) {
return ( <View style={styles.center}> <Text style={styles.emptyText}>No notifications yet</Text> </View>
);
}

const groupNotifications = () => {
const today: any[] = [];
const yesterday: any[] = [];
const earlier: any[] = [];

const now = new Date();

notifications.forEach((n) => {
const created = new Date(n.createdAt);
const diffDays = Math.floor(
(now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
);

if (diffDays === 0) {
today.push(n);
} else if (diffDays === 1) {
yesterday.push(n);
} else {
earlier.push(n);
}
});

const sections = [];

if (today.length) sections.push({ title: "Today", data: today });
if (yesterday.length) sections.push({ title: "Yesterday", data: yesterday });
if (earlier.length) sections.push({ title: "Earlier", data: earlier });

return sections;
};



return (
<SectionList
sections={groupNotifications()}
keyExtractor={(item) => item._id}
renderItem={renderItem}
renderSectionHeader={({ section: { title } }) => ( <Text style={styles.sectionTitle}>{title}</Text>
)}
contentContainerStyle={styles.container}
refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
}
/>
);

};

export default NotificationInboxScreen;

const styles = StyleSheet.create({
container: {
padding: 15,
},

card: {
backgroundColor: "#fff",
padding: 15,
borderRadius: 10,
marginBottom: 10,
elevation: 2,
},

unreadCard: {
borderLeftWidth: 4,
borderLeftColor: "#f4b400",
},

row: {
flexDirection: "row",
alignItems: "flex-start",
},

icon: {
fontSize: 22,
marginRight: 10,
},

content: {
flex: 1,
},

title: {
fontWeight: "bold",
fontSize: 16,
},

message: {
marginTop: 5,
color: "#555",
},

time: {
marginTop: 8,
fontSize: 12,
color: "#999",
},

emptyText: {
color: "#777",
fontSize: 16,
},

center: {
flex: 1,
justifyContent: "center",
alignItems: "center",
},
sectionTitle: {
fontSize: 16,
fontWeight: "bold",
marginBottom: 8,
marginTop: 15,
color: "#444",
},
});
