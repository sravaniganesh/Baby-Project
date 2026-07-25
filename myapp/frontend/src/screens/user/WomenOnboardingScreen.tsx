import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import API from "../../config/api";
import { useAuth } from "../../context/AuthContext";


const WomenOnboardingScreen = ({ navigation }: any) => {
  const [category, setCategory] = useState<
    "teen" | "married" | "pregnant" | "post_pregnancy" | null
  >(null);

  const [pregnancyStartDate, setPregnancyStartDate] = useState<Date | null>(
    null
  );
  const [babyBirthDate, setBabyBirthDate] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const { refreshUser } = useAuth();

  /* ===============================
     HELPERS
     =============================== */

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate) return;

    if (category === "pregnant") {
      setPregnancyStartDate(selectedDate);
    }

    if (category === "post_pregnancy") {
      setBabyBirthDate(selectedDate);
    }
  };

  const canContinue =
  category === "teen" ||
  category === "married" ||
  (category === "pregnant" && pregnancyStartDate) ||
  (category === "post_pregnancy" && babyBirthDate);
 

  /* ===============================
     SAVE PROFILE
     =============================== */
const handleSave = async () => {
  if (!category) return;

  const payload: any = {
    womenCategory: category,
  };

  if (category === "pregnant" && pregnancyStartDate) {
    payload.pregnancyStartDate = pregnancyStartDate;
  }

  if (category === "post_pregnancy" && babyBirthDate) {
    payload.babyBirthDate = babyBirthDate;
  }

  try {
    console.log("🔥 ONBOARDING SAVE START");
    console.log("📦 Payload:", payload);

    setSaving(true);

    const res = await API.put("/user/update", payload);

    console.log("✅ API SUCCESS:", res?.data);

    // ✅ Refresh user (important)
    await refreshUser();

    console.log("✅ USER REFRESHED");

  } catch (error: any) {
    console.log("❌ ONBOARDING ERROR:", error?.response || error.message);

    Alert.alert(
      "Error",
      error?.response?.data?.message ||
        error.message ||
        "Failed to save profile"
    );

  } finally {
    console.log("🛑 STOP LOADING");
    setSaving(false);
  }
};


  /* ===============================
     UI
     =============================== */

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tell us about you</Text>
        <Text style={styles.subtitle}>
          This helps us personalize your experience. You can change this later.
        </Text>
      </View>

      {/* Category Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your current life stage</Text>

        {[
          { key: "teen", label: "🌱 Teen" },
          { key: "married", label: "💍 Married" },
          { key: "pregnant", label: "🤰 Pregnant" },
          { key: "post_pregnancy", label: "👶 Post Pregnancy" },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.optionCard,
              category === item.key && styles.optionActive,
            ]}
            activeOpacity={0.8}
            onPress={() => {
              setCategory(item.key as any);
              setPregnancyStartDate(null);
              setBabyBirthDate(null);
            }}
          >
            <Text style={styles.optionText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conditional Date Picker */}
      {category === "pregnant" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            When did your pregnancy start?
          </Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {pregnancyStartDate
                ? pregnancyStartDate.toDateString()
                : "Select date"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {category === "post_pregnancy" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            When was your baby born?
          </Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {babyBirthDate
                ? babyBirthDate.toDateString()
                : "Select date"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueBtn,
          (!canContinue || saving) && styles.continueDisabled,
        ]}
        disabled={!canContinue || saving}
        activeOpacity={0.85}
        onPress={handleSave}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.continueText}>Save & Continue</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default WomenOnboardingScreen;

/* ===============================
   STYLES
   =============================== */

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: "#fafafa",
    flexGrow: 1,
  },

  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#222",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },

  optionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  optionActive: {
    borderColor: "#ff5a5f",
    backgroundColor: "#fff0f0",
  },
  optionText: {
    fontSize: 15,
    color: "#222",
  },

  dateButton: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dateText: {
    fontSize: 14,
    color: "#333",
  },

  continueBtn: {
    backgroundColor: "#ff5a5f",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  continueDisabled: {
    backgroundColor: "#ccc",
  },
  continueText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
