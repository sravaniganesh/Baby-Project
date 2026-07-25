import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AuthStack from "./AuthStack";
import UserTabs from "./UserTabs";
import DoctorStack from "./DoctorStack";
import SellerStackNavigator from "./SellerStackNavigator";

import WomenOnboardingScreen from "../screens/user/WomenOnboardingScreen";
import { useAuth } from "../context/AuthContext";
import PremiumPlansScreen from "../screens/premium/PremiumPlansScreen";
import NotificationInboxScreen from "../screens/notifications/NotificationInboxScreen";

export type RootStackParamList = {
  Auth: undefined;
  User: undefined;
  Seller: undefined;
  Doctor: undefined;

  WomenOnboarding: undefined;
  PremiumPlans: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStack = () => {
  const { token, role, loading, needsWomenOnboarding } = useAuth();

  // ⏳ Prevent auth race condition
  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* AUTH */}
      {!token && (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}

      {/* WOMEN ONBOARDING */}
      {token &&
 role === "user" &&
 needsWomenOnboarding === true && (
  <Stack.Screen
    name="WomenOnboarding"
    component={WomenOnboardingScreen}
  />
)}

      {/* USER MAIN APP */}
      {token && role === "user" && !needsWomenOnboarding && (
        <Stack.Screen name="User" component={UserTabs} />
      )}

      {/* DOCTOR APP */}
      {token && role === "doctor" && (
        <Stack.Screen name="Doctor" component={DoctorStack} />
      )}

      {/* SELLER APP */}
      {token && role === "seller" && (
        <Stack.Screen
          name="Seller"
          component={SellerStackNavigator}
        />
      )}

      {/* GLOBAL SCREENS */}

      <Stack.Screen
        name="PremiumPlans"
        component={PremiumPlansScreen}
        options={{
          headerShown: true,
          title: "Premium Plans",
        }}
      />

      <Stack.Screen
        name="Notifications"
        component={NotificationInboxScreen}
        options={{
          headerShown: true,
          title: "Notifications",
        }}
      />

    </Stack.Navigator>
  );
};

export default RootStack;