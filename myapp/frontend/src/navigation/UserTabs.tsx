import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/user/HomeScreen';
import UserStack from './UserStack';
import DoctorsScreen from '../screens/user/DoctorsScreen';
import UserChatScreen from '../screens/user/UserChatScreen';
import ProfileStack from './ProfileStack';
import ShopStackNavigator from "./ShopStackNavigator";

import ConsultationRequestScreen from "../screens/user/ConsultationRequestScreen";
import MyConsultationsScreen from "../screens/user/MyConsultationsScreen";
import DoctorProfileScreen from "../screens/user/DoctorProfileScreen";

import { useNotifications } from "../context/NotificationContext";
import PaymentScreen from "../screens/user/PaymentScreen";
/* ---------- Doctor Stack (USER SIDE) ---------- */

export type DoctorStackParamList = {
  DoctorsList: undefined;

  DoctorChat: {
    doctorId: string;
    doctorName: string;
  };

  ConsultationRequest: {
    doctorId: string;
    doctorName: string;
  };

  MyConsultations: undefined;

  DoctorProfile: {
    doctor: any;
  };
  Payment: {
  type: "chat" | "order";
  doctorId?: string;
  doctorName?: string;
  orderId?: string;
  amount?: number;
};
};

const DoctorStackNav = createNativeStackNavigator<DoctorStackParamList>();

const DoctorStack = () => {
  return (
   <DoctorStackNav.Navigator initialRouteName="DoctorsList"
      screenOptions={{
        
      }}
    >
      <DoctorStackNav.Screen
  name="Payment"
  component={PaymentScreen}
  options={{ title: "Payment" }}
/>

      <DoctorStackNav.Screen
        name="DoctorsList"
        component={DoctorsScreen}
        options={{ title: 'Doctors' }}
      />

      <DoctorStackNav.Screen
        name="DoctorProfile"
        component={DoctorProfileScreen}
        options={{ title: "Doctor Profile" }}
      />

      {/* ✅ CHAT moved ABOVE consultation for better stack resolution */}
      <DoctorStackNav.Screen
        name="DoctorChat"
        component={UserChatScreen}
        options={({ route }) => ({
          title: route.params?.doctorName || "Chat",
        })}
      />

      <DoctorStackNav.Screen
        name="ConsultationRequest"
        component={ConsultationRequestScreen}
        options={{ title: "Consult Doctor" }}
      />

      <DoctorStackNav.Screen
        name="MyConsultations"
        component={MyConsultationsScreen}
        options={{ title: "My Consultations" }}
      />

    </DoctorStackNav.Navigator>
  );
};

/* ---------- Notification Bell ---------- */

const NotificationBell = () => {
  const navigation = useNavigation<any>();
  const { unreadCount, refreshUnread } = useNotifications();

  const handlePress = async () => {
    try {
      await refreshUnread();
    } catch (err) {
      console.log("Refresh unread error", err);
    }

    navigation.navigate("Notifications");
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{ marginRight: 15 }}
    >
      <View>
        <MaterialCommunityIcons
          name="bell-outline"
          size={24}
          color="#333"
        />

        {unreadCount > 0 && (
          <View
            style={{
              position: "absolute",
              right: -6,
              top: -4,
              backgroundColor: "#ff4d6d",
              borderRadius: 10,
              paddingHorizontal: 5,
              paddingVertical: 1,
              minWidth: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 10 }}>
              {unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/* ---------- Tabs ---------- */

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, focused }: { icon: string; focused: boolean }) => (
  <MaterialCommunityIcons
    name={icon}
    size={24}
    color={focused ? "#ff6b81" : "#777"}
  />
);

const UserTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerTitle: "Maa App",
        headerRight: () => <NotificationBell />,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}
    >

      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home-outline" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Community"
        component={UserStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="forum-outline" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Doctor"
        component={DoctorStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="stethoscope" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Shop"
        component={ShopStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="shopping-outline" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="account-outline" focused={focused} />
          ),
        }}
      />

    </Tab.Navigator>
  );
};

export default UserTabs;