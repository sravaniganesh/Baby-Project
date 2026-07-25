import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import API from "../../config/api";

const ManageSlotsScreen = () => {
  const [slots, setSlots] = useState<any[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"video" | "hospital">("video");

  /* ================= FETCH SLOTS ================= */
  const fetchSlots = async () => {
    try {
      const res = await API.get("/doctor/slots");
      setSlots(res.data?.slots || []);
    } catch {
      setSlots([]);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  /* ================= ADD SLOT ================= */
  const handleAddSlot = async () => {
    try {
      if (!date || !time) {
        Alert.alert("Enter date and time");
        return;
      }

      const res = await API.post("/doctor/slots", {
        date,
        time,
        type, // 🔥 IMPORTANT
      });

      if (!res?.data?.success) {
        Alert.alert("Failed to add slot");
        return;
      }

      setDate("");
      setTime("");

      fetchSlots();
    } catch {
      Alert.alert("Error adding slot");
    }
  };

  /* ================= DELETE SLOT ================= */
  const handleDelete = async (slotId: string) => {
    try {
      await API.delete(`/doctor/slots/${slotId}`);
      fetchSlots();
    } catch {}
  };

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Slots</Text>

      {/* TYPE SELECT */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            type === "video" && styles.activeType,
          ]}
          onPress={() => setType("video")}
        >
          <Text style={styles.typeText}>Video</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeBtn,
            type === "hospital" && styles.activeType,
          ]}
          onPress={() => setType("hospital")}
        >
          <Text style={styles.typeText}>Hospital</Text>
        </TouchableOpacity>
      </View>

      {/* INPUTS */}
      <TextInput
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        style={styles.input}
      />

      <TextInput
        placeholder="Time (10:30 AM)"
        value={time}
        onChangeText={setTime}
        style={styles.input}
      />

      {/* ADD BUTTON */}
      <TouchableOpacity style={styles.addBtn} onPress={handleAddSlot}>
        <Text style={styles.btnText}>Add Slot</Text>
      </TouchableOpacity>

      {/* SLOT LIST */}
      <FlatList
        data={slots}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.slot}>
            <Text>
              {item.date} • {item.time} • {item.type}
            </Text>

            {item.isBooked && (
              <Text style={{ color: "red" }}>Booked</Text>
            )}

            {!item.isBooked && (
              <TouchableOpacity
                onPress={() => handleDelete(item._id)}
              >
                <Text style={{ color: "blue" }}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
};

export default ManageSlotsScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  addBtn: {
    backgroundColor: "#10B981",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  slot: {
    padding: 12,
    marginTop: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    marginTop: 10,
  },
  typeBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#E5E7EB",
    marginRight: 5,
    borderRadius: 6,
  },
  activeType: {
    backgroundColor: "#8B5CF6",
  },
  typeText: {
    textAlign: "center",
    color: "#000",
  },
});