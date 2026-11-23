import React, { useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";

import ShopHomeScreen from "../screens/shop/ShopHomeScreen";
import CartScreen from "../screens/shop/CartScreen";
import ProductDetailScreen from "../screens/shop/ProductDetailScreen";
import WishlistScreen from "../screens/shop/WishlistScreen";
import AddAddressScreen from "../screens/user/AddAddressScreen";
import SelectAddressScreen from "../screens/user/SelectAddressScreen";
import PlaceOrderScreen from "../screens/user/PlaceOrderScreen";
import AddReviewScreen from "../screens/shop/AddReviewScreen";
import ShopOrderConfirmationScreen from "../screens/shop/ShopOrderConfirmationScreen";

const Stack = createNativeStackNavigator();

const ShopStackNavigator = () => {
  // ⚠️ This count is DISPLAY ONLY
  // Real updates happen inside ShopHomeScreen
  const [wishlistCount, setWishlistCount] = useState(0);

  return (
    <Stack.Navigator>
      {/* 🏠 SHOP HOME */}
      <Stack.Screen
        name="ShopHome"
        component={ShopHomeScreen}
        options={({ navigation }) => ({
          title: "Shop",
          headerRight: () => (
            <View style={styles.headerIcons}>
              {/* ❤️ WISHLIST */}
              <TouchableOpacity
                onPress={() => navigation.navigate("Wishlist")}
                style={styles.iconWrapper}
              >
                <Icon
                  name="heart-outline"
                  size={22}
                  color="#EF4444"
                />

                {wishlistCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {wishlistCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* 🛒 CART */}
              <TouchableOpacity
                onPress={() => navigation.navigate("Cart")}
              >
                <Icon
                  name="cart-outline"
                  size={22}
                  color="#000"
                />
              </TouchableOpacity>
            </View>
          ),
        })}
      />

      {/* 🛒 CART */}
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: "My Cart" }}
      />

      {/* 📦 PRODUCT DETAIL */}
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: "Product Details" }}
      />

      {/* ❤️ WISHLIST */}
      <Stack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{ title: "Wishlist" }}
      />

      {/* 📍 ADDRESS FLOW */}
      <Stack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ title: "Add Address" }}
      />
      <Stack.Screen
        name="SelectAddress"
        component={SelectAddressScreen}
        options={{ title: "Select Address" }}
      />
      <Stack.Screen
        name="PlaceOrder"
        component={PlaceOrderScreen}
        options={{ title: "Place Order" }}
      />
      <Stack.Screen
  name="AddReview"
  component={AddReviewScreen}
  options={{ title: "Rate Product" }}
/>
<Stack.Screen
  name="ShopOrderConfirmation"
  component={ShopOrderConfirmationScreen}
  options={{
    title: "Order Confirmation",
  }}
/>

      
    </Stack.Navigator>
  );
};

export default ShopStackNavigator;

/* =============================
   STYLES
============================== */
const styles = StyleSheet.create({
  headerIcons: {
    flexDirection: "row",
    marginRight: 12,
    alignItems: "center",
  },
  iconWrapper: {
    marginRight: 18,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#DC2626",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});
