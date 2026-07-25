import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SellerProductsScreen from "../screens/seller/SellerProductsScreen";
import SellerAddProductScreen from "../screens/seller/SellerAddProductScreen";

const Stack = createNativeStackNavigator();

const SellerProductsStack = () => {
  return (
    <Stack.Navigator initialRouteName="SellerProducts">
      <Stack.Screen
        name="SellerProducts"
        component={SellerProductsScreen}
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

export default SellerProductsStack;
