import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SellerTabNavigator from "./SellerTabNavigator";
import SellerAddProductScreen from "../screens/seller/SellerAddProductScreen";

const Stack = createNativeStackNavigator();

const SellerStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SellerTabs"
        component={SellerTabNavigator}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="SellerAddProduct"
        component={SellerAddProductScreen}
        options={{ title: "Add Product" }}
      />
    </Stack.Navigator>
  );
};

export default SellerStackNavigator;
