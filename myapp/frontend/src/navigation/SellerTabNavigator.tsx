import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import SellerOrdersScreen from "../screens/seller/SellerOrdersScreen";
import SellerProductsScreen from "../screens/seller/SellerProductsScreen";
import SellerEarningsScreen from "../screens/seller/SellerEarningsScreen";
import SellerProfileScreen from "../screens/seller/SellerProfileScreen";

const Tab = createBottomTabNavigator();

const SellerTabNavigator = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Orders" component={SellerOrdersScreen} />
      <Tab.Screen name="Products" component={SellerProductsScreen} />
      <Tab.Screen name="Earnings" component={SellerEarningsScreen} />
      <Tab.Screen name="Profile" component={SellerProfileScreen} />
    </Tab.Navigator>
  );
};

export default SellerTabNavigator;
