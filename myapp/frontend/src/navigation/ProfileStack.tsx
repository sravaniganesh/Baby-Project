import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "../screens/user/ProfileScreen";
import UserOrdersScreen from "../screens/user/UserOrdersScreen";
import UserOrderDetailScreen from "../screens/user/UserOrderDetailScreen";
import WomenOnboardingScreen from "../screens/user/WomenOnboardingScreen";
import EditUsernameScreen from "../screens/user/EditUsernameScreen";
import UserTransactionsScreen from "../screens/user/UserTransactionsScreen";
import WalletScreen from "../screens/user/WalletScreen";

export type ProfileStackParamList = {
  ProfileHome: undefined;
  UserOrders: undefined;
  UserOrderDetail: undefined;
 
  WomenOnboarding: undefined;
  EditUsername: undefined;
    UserTransactions: undefined;
    Wallet: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileStack = () => {
  return (
    <Stack.Navigator initialRouteName="ProfileHome">
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />

      <Stack.Screen
        name="UserOrders"
        component={UserOrdersScreen}
        options={{ title: "My Orders" }}
      />

      <Stack.Screen
        name="UserOrderDetail"
        component={UserOrderDetailScreen}
        options={{ title: "Order Details" }}
      />

      <Stack.Screen
  name="WomenOnboarding"
  component={WomenOnboardingScreen}
  options={{ title: "Update Life Stage" }}
/>

<Stack.Screen
  name="EditUsername"
  component={EditUsernameScreen}
  options={{ title: "Edit Username" }}
/>
<Stack.Screen
   name="UserTransactions"
   component={UserTransactionsScreen}
    />
    <Stack.Screen name="Wallet" component={WalletScreen} />

    </Stack.Navigator>
  );
};

export default ProfileStack;
