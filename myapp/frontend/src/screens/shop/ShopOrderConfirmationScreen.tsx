
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import API from "../../config/api";

type PaymentOutcome =
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

type PaymentStatus =
  | "LOADING"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "ERROR"
  | "UNAVAILABLE";

interface Payment {
  _id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  transactionReference: string;
}

const ShopOrderConfirmationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const orderId = route.params?.orderId;

  const [payment, setPayment] = useState<Payment | null>(null);

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("LOADING");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState(
    "Initializing your payment..."
  );

  /* =====================================================
     1. CREATE PAYMENT ATTEMPT
  ===================================================== */

  const createPaymentAttempt = useCallback(async () => {
    if (!orderId) {
      setPaymentStatus("ERROR");
      setMessage("Order ID is missing. Please contact support.");
      return;
    }

    // Payment simulator is development-only.
    if (!__DEV__) {
      setPaymentStatus("UNAVAILABLE");
      setMessage(
        "The development payment simulator is not available in this build."
      );
      return;
    }

    try {
      setLoading(true);
      setPaymentStatus("LOADING");

      const response = await API.post(
        `/shop/payment/${orderId}/create`
      );

      const paymentData = response.data?.payment;

      if (!paymentData?._id) {
        throw new Error(
          "Payment attempt ID was not returned by the server."
        );
      }

      setPayment(paymentData);
      setPaymentStatus("PENDING");

      setMessage(
        "Your order has been created. Complete the payment to confirm your order."
      );
    } catch (error: any) {
      console.error(
        "CREATE SHOP PAYMENT ERROR:",
        error?.response?.data || error.message
      );

      setPaymentStatus("ERROR");

      setMessage(
        error?.response?.data?.message ||
          error.message ||
          "Unable to initialize payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /* =====================================================
     2. INITIALIZE PAYMENT WHEN SCREEN OPENS
  ===================================================== */

  useEffect(() => {
    createPaymentAttempt();
  }, [createPaymentAttempt]);

  /* =====================================================
     3. SIMULATE PAYMENT
  ===================================================== */

  const simulatePayment = async (
    outcome: PaymentOutcome
  ) => {
    if (!__DEV__) {
      Alert.alert(
        "Unavailable",
        "Payment simulation is available only in development."
      );
      return;
    }

    if (!payment?._id || loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        `/shop/payment/attempt/${payment._id}/simulate`,
        {
          outcome,
        }
      );

      if (response.data?.payment) {
        setPayment(response.data.payment);
      }

      if (outcome === "SUCCESS") {
        setPaymentStatus("SUCCESS");

        setMessage(
          "Payment successful! Your order is now confirmed."
        );
      } else if (outcome === "FAILED") {
        setPaymentStatus("FAILED");

        setMessage(
          "Payment failed. Your order is still pending. You can retry."
        );
      } else {
        setPaymentStatus("CANCELLED");

        setMessage(
          "Payment was cancelled. Your order is still pending. You can retry."
        );
      }
    } catch (error: any) {
      console.error(
        "SHOP PAYMENT SIMULATION ERROR:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "Payment Error",
        error?.response?.data?.message ||
          "Unable to process payment simulation. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     4. RETRY PAYMENT
  ===================================================== */

  const handleRetry = () => {
    if (!__DEV__ || loading) {
      return;
    }

    setPayment(null);
    createPaymentAttempt();
  };

  /* =====================================================
     5. CONTINUE SHOPPING
  ===================================================== */

  const continueShopping = () => {
    navigation.popToTop();
  };

  /* =====================================================
     6. PAYMENT STATUS COLOR
  ===================================================== */

  const getStatusStyle = () => {
    switch (paymentStatus) {
      case "SUCCESS":
        return styles.success;

      case "FAILED":
      case "ERROR":
        return styles.failed;

      case "CANCELLED":
        return styles.cancelled;

      case "UNAVAILABLE":
        return styles.unavailable;

      default:
        return styles.pending;
    }
  };

  const getDisplayStatus = () => {
    switch (paymentStatus) {
      case "LOADING":
        return "INITIALIZING";

      case "UNAVAILABLE":
        return "UNAVAILABLE";

      default:
        return paymentStatus;
    }
  };

  /* =====================================================
     7. SCREEN UI
  ===================================================== */

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Order Confirmation
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Order ID
        </Text>

        <Text style={styles.value}>
          {orderId || "Not available"}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>
          Payment Status
        </Text>

        <Text
          style={[
            styles.status,
            getStatusStyle(),
          ]}
        >
          {getDisplayStatus()}
        </Text>

        {payment?.amount !== undefined && (
          <>
            <View style={styles.divider} />

            <Text style={styles.label}>
              Amount Payable
            </Text>

            <Text style={styles.amount}>
              ₹ {Number(payment.amount).toFixed(2)}
            </Text>
          </>
        )}

        <Text style={styles.message}>
          {message}
        </Text>
      </View>

      {/* LOADING INDICATOR */}

      {loading && (
        <ActivityIndicator
          size="large"
          color="#28a745"
          style={styles.loader}
        />
      )}

      {/* DEVELOPMENT PAYMENT SIMULATOR */}

      {__DEV__ &&
        !loading &&
        paymentStatus === "PENDING" && (
          <View style={styles.simulator}>
            <Text style={styles.simulatorTitle}>
              Development Payment Simulator
            </Text>

            <Text style={styles.simulatorDescription}>
              No real money will be deducted. Select an outcome to test the payment flow.
            </Text>

            <TouchableOpacity
              style={styles.successButton}
              onPress={() =>
                simulatePayment("SUCCESS")
              }
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                Simulate Success
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.failedButton}
              onPress={() =>
                simulatePayment("FAILED")
              }
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                Simulate Failure
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() =>
                simulatePayment("CANCELLED")
              }
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                Simulate Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {/* RETRY PAYMENT */}

      {__DEV__ &&
        !loading &&
        (
          paymentStatus === "FAILED" ||
          paymentStatus === "CANCELLED" ||
          paymentStatus === "ERROR"
        ) && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.buttonText}>
              Retry Payment
            </Text>
          </TouchableOpacity>
        )}

      {/* SUCCESSFUL PAYMENT */}

      {!loading &&
        paymentStatus === "SUCCESS" && (
          <View style={styles.successContainer}>
            <Text style={styles.successMessage}>
              Your order has been placed successfully!
            </Text>

            <TouchableOpacity
              style={styles.successButton}
              onPress={continueShopping}
            >
              <Text style={styles.buttonText}>
                Continue Shopping
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {/* INITIALIZATION ERROR */}

      {!loading &&
        paymentStatus === "UNAVAILABLE" && (
          <Text style={styles.infoMessage}>
            This screen is intended for development testing.
          </Text>
        )}
    </View>
  );
};

export default ShopOrderConfirmationScreen;

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f6fa",
  },

  heading: {
    fontSize: 23,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#222",
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    elevation: 2,
  },

  label: {
    color: "#777",
    fontSize: 13,
  },

  value: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 5,
    color: "#222",
  },

  status: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 6,
  },

  pending: {
    color: "#2563eb",
  },

  success: {
    color: "#16a34a",
  },

  failed: {
    color: "#dc2626",
  },

  cancelled: {
    color: "#d97706",
  },

  unavailable: {
    color: "#777",
  },

  amount: {
    fontSize: 23,
    fontWeight: "bold",
    marginTop: 5,
    color: "#222",
  },

  message: {
    marginTop: 18,
    color: "#555",
    lineHeight: 21,
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 14,
  },

  simulator: {
    marginTop: 25,
    gap: 12,
  },

  simulatorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },

  simulatorDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
  },

  successButton: {
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 12,
  },

  failedButton: {
    backgroundColor: "#dc2626",
    padding: 15,
    borderRadius: 9,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#d97706",
    padding: 15,
    borderRadius: 9,
    alignItems: "center",
  },

  retryButton: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  loader: {
    marginTop: 25,
  },

  successContainer: {
    marginTop: 10,
  },

  successMessage: {
    color: "#16a34a",
    fontWeight: "600",
    marginTop: 20,
    fontSize: 15,
  },

  infoMessage: {
    marginTop: 20,
    color: "#777",
    fontSize: 13,
  },
});
