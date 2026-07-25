import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthStack";

type Props = NativeStackScreenProps<AuthStackParamList, "AuthChoice">;

const AuthChoiceScreen = ({ navigation }: Props) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Welcome</Text>
      <Text style={styles.subHeader}>Choose your platform</Text>

      {/* USER CARD */}
      <View style={styles.card}>
        <Icon name="account-circle" size={40} color="#ff5a5f" />
        <Text style={styles.cardTitle}>User</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate("UserRegister")}
          >
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DOCTOR CARD */}
      <View style={styles.card}>
        <Icon name="stethoscope" size={40} color="#4CAF50" />
        <Text style={styles.cardTitle}>Doctor</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate("DoctorLogin")}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate("DoctorRegister")}
          >
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SELLER CARD */}
      <View style={styles.card}>
        <Icon name="store" size={40} color="#ff9800" />
        <Text style={styles.cardTitle}>Seller</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate("SellerLogin")}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate("SellerRegister")}
          >
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default AuthChoiceScreen;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#f8f9fb",
    flexGrow: 1,
  },

  header: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },

  subHeader: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  loginBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },

  registerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },

  loginText: {
    color: "#fff",
    fontWeight: "600",
  },

  registerText: {
    color: "#333",
    fontWeight: "600",
  },
});
