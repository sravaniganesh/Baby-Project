import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";

import RootStack from "./src/navigation/RootStack";

import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import { NotificationProvider } from "./src/context/NotificationContext";

import { connectSocket } from "./src/services/socket";

import InAppNotificationBanner from "./src/components/notifications/InAppNotificationBanner";
import NotificationBanner from "./src/components/NotificationBanner";

const App = () => {

  useEffect(() => {
    // 🔥 Connect socket once globally
    connectSocket();
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>

          <NavigationContainer>

            {/* 🔔 In-app notifications */}
            <InAppNotificationBanner />
            <NotificationBanner />

            {/* Main Navigation */}
            <RootStack />

          </NavigationContainer>

        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;