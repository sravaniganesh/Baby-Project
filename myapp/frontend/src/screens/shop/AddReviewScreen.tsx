import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../config/api";
import Icon from "react-native-vector-icons/Ionicons";

/* ---------------- TYPES ---------------- */

type RouteParams = {
  productId: string;
  orderItemId: string;
};

const AddReviewScreen = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();
  const navigation = useNavigation<any>();
  const { productId, orderItemId } = route.params;

  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- SUBMIT REVIEW ---------------- */

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert("Rating required", "Please select a rating");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      await API.post(
  `/reviews`,
        {
          productId,
          orderItemId,
          rating,
          review,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert("Thank you!", "Review submitted successfully");
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Review failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Rate Product</Text>

      {/* STAR RATING */}
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setRating(i)}
          >
            <Icon
              name={rating >= i ? "star" : "star-outline"}
              size={36}
              color="#FACC15"
              style={{ marginHorizontal: 4 }}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.ratingText}>
        {rating > 0 ? `${rating} / 5` : "Tap to rate"}
      </Text>

      {/* REVIEW INPUT */}
      <TextInput
        style={styles.input}
        placeholder="Write your review (optional)"
        multiline
        value={review}
        onChangeText={setReview}
      />

      {/* SUBMIT */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={submitReview}
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? "Submitting..." : "Submit Review"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddReviewScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9FAFB",
  },

  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },

  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },

  ratingText: {
    textAlign: "center",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  submitBtn: {
    marginTop: 24,
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
