import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UserStack from "./UserStack";

export type AppStackParamList = {
  User: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="User" component={UserStack} />
    </Stack.Navigator>
  );
};

export default AppStack;
