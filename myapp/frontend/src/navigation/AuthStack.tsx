import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AuthChoiceScreen from "../screens/auth/AuthChoiceScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import DoctorLoginScreen from "../screens/auth/DoctorLoginScreen";
import SellerLoginScreen from "../screens/auth/SellerLoginScreen";

/* ================== NEW REGISTER IMPORTS (ADDED) ================== */
import RegisterScreen from "../screens/auth/RegisterScreen";
import DoctorRegisterScreen from "../screens/auth/DoctorRegisterScreen";
import SellerRegisterScreen from "../screens/auth/SellerRegisterScreen";

export type AuthStackParamList = {
  AuthChoice: undefined;
  Login: undefined;
  DoctorLogin: undefined;
  SellerLogin: undefined;

  /* ================== NEW REGISTER ROUTES (ADDED) ================== */
  UserRegister: undefined;
  DoctorRegister: undefined;
  SellerRegister: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} />
      <Stack.Screen name="SellerLogin" component={SellerLoginScreen} />

      {/* ================== NEW REGISTER SCREENS (ADDED) ================== */}
      <Stack.Screen name="UserRegister" component={RegisterScreen} />
      <Stack.Screen name="DoctorRegister" component={DoctorRegisterScreen} />
      <Stack.Screen name="SellerRegister" component={SellerRegisterScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
