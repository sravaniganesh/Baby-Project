import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DoctorHomeScreen from "../screens/doctor/DoctorHomeScreen";
import DoctorChatScreen from "../screens/doctor/DoctorChatScreen";
import DoctorProfileScreen from "../screens/doctor/DoctorProfileScreen";
import DoctorConsultationsScreen from "../screens/doctor/DoctorConsultationsScreen";
import DoctorPricingScreen from "../screens/doctor/DoctorPricingScreen";

export type DoctorStackParamList = {
  DoctorHome: undefined;
  DoctorChat: {
    chatId: string;
    userName: string;
  };
 
  DoctorProfile: undefined;
  DoctorConsultations: undefined;
  DoctorPricing: undefined;
};

const Stack = createNativeStackNavigator<DoctorStackParamList>();

const DoctorStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DoctorHome"
        component={DoctorHomeScreen}
        options={{ title: "Doctor Home" }}
      />

      <Stack.Screen
        name="DoctorChat"
        component={DoctorChatScreen}
        options={({ route }) => ({
          title: route.params?.userName || "Chat",
        })}
      />

      <Stack.Screen
        name="DoctorProfile"
        component={DoctorProfileScreen}
        options={{ title: "MyProfile" }}
      />
      <Stack.Screen
  name="DoctorPricing"
  component={DoctorPricingScreen}
  options={{ title: "Pricing Settings" }}
/>
      <Stack.Screen
  name="DoctorConsultations"
  component={DoctorConsultationsScreen}
  options={{ title: "Consultations" }}
/>
  
      
    </Stack.Navigator>
  );
};

export default DoctorStack;
