
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  ScrollView,
  StatusBar,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import API from "../../config/api";
import { connectSocket } from "../../services/socket";
import ConsultationStatusBanner from "./ConsultationStatusBanner";

type SearchType = "city" | "hospital" | "doctor";

interface Hospital {
  _id: string;
  name: string;
  hospitalType?: string;
  address?: string;
  city?: string;
  state?: string;
  logo?: string;
  description?: string;
  isVerified?: boolean;
  verificationStatus?: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization?: string;
  experience?: number;
  rating?: number;
  avatar?: string;
  profileImage?: string;
  city?: string;
  state?: string;
}

interface DoctorHospitalResult {
  doctor: Doctor;
  hospital: Hospital | null;
  consultationFee?: number;
  consultationDuration?: number;
  bookingMode?: "request" | "instant";
  doctorType?: "hospital" | "independent";
}

interface HospitalGroup {
  hospital: Hospital;
  doctors: DoctorHospitalResult[];
}
const DoctorsScreen = () => {
  const navigation = useNavigation<any>();

  const [searchType, setSearchType] = useState<SearchType>("city");
  const [searchText, setSearchText] = useState("");

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [results, setResults] = useState<DoctorHospitalResult[]>([]);

  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // --------------------------------------------------
  // LOAD ACTIVE HOSPITALS
  // --------------------------------------------------

  const fetchHospitals = useCallback(async () => {
    try {
      const response = await API.get("/doctors/hospitals");

      const list = response.data?.hospitals || [];

      setHospitals(Array.isArray(list) ? list : []);
    } catch (error) {
      console.log("Hospital loading error:", error);
      setHospitals([]);
      Alert.alert("Unable to load", "Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // --------------------------------------------------
  // SEARCH DOCTORS / HOSPITALS / CITY
  // --------------------------------------------------

  const performSearch = async (
    value: string,
    type: SearchType
  ) => {
    
    const query = value.trim();

    if (!query) {
      Alert.alert(
        "Enter search details",
        `Please enter a ${type} name to search.`
      );
      return;
    }

    setSearching(true);
    setShowResults(true);
    setSelectedHospital(null);

    try {
      const response = await API.get("/doctors/search", {
        params: {
          [type]: query,
        },
      });
     

      console.log("========== FRONTEND DOCTOR SEARCH ==========");
console.log("Search type:", type);
console.log("Search value:", query);
console.log("Full API response:", JSON.stringify(response.data, null, 2));

const list = response.data?.results || [];

console.log("Results array:", list);
console.log("Results count:", list.length);
console.log(
  "Independent doctors:",
  list.filter((item: DoctorHospitalResult) => item.doctor && !item.hospital).length
);

setResults(Array.isArray(list) ? list : []);
    } catch (error: any) {
      console.log("Doctor search error:", error);
      setResults([]);

      Alert.alert(
        "Search failed",
        error?.response?.data?.message ||
          "Unable to search right now. Please try again."
      );
    } finally {
      setSearching(false);
    }
  };

  // --------------------------------------------------
  // SELECT A HOSPITAL
  // --------------------------------------------------

  const openHospital = async (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setSearchType("hospital");
    setSearchText(hospital.name);
    setShowResults(true);
    setSearching(true);

    try {
      const response = await API.get("/doctors/search", {
        params: {
          hospital: hospital.name,
        },
      });


      const list = response.data?.results || [];

      setResults(
        Array.isArray(list)
          ? list.filter(
              (item: DoctorHospitalResult) =>
                item.hospital?._id === hospital._id
            )
          : []
      );
    } catch (error) {
      console.log("Hospital doctors error:", error);
      setResults([]);
      Alert.alert(
        "Unable to load doctors",
        "Please try again."
      );
    } finally {
      setSearching(false);
    }
  };

  // --------------------------------------------------
  // SOCKET LISTENER
  // --------------------------------------------------

  useEffect(() => {
    const socket = connectSocket();

    const handleSlotAvailable = () => {
      Alert.alert(
        "New consultation slots",
        "A doctor has updated their availability."
      );

      if (selectedHospital) {
        openHospital(selectedHospital);
      }
    };

    socket.on("slotAvailable", handleSlotAvailable);

    return () => {
      socket.off("slotAvailable", handleSlotAvailable);
    };
  }, [selectedHospital]);

  // --------------------------------------------------
  // GROUP DOCTORS BY HOSPITAL
  // --------------------------------------------------
const hospitalGroups = useMemo(() => {
  const groups: HospitalGroup[] = [];

  results.forEach((item: DoctorHospitalResult) => {
    const hospital = item?.hospital;

    if (!hospital || !item?.doctor) return;

    const existingGroup = groups.find(
      (entry) => entry.hospital._id === hospital._id
    );

    if (existingGroup) {
      existingGroup.doctors.push(item);
    } else {
      groups.push({
        hospital,
        doctors: [item],
      });
    }
  });

  return groups;
}, [results]);

const independentResults = useMemo(
  () => results.filter((item) => Boolean(item?.doctor && !item?.hospital)),
  [results]
);

  // --------------------------------------------------
  // RESET SEARCH
  // --------------------------------------------------

  const resetSearch = () => {
    setSearchText("");
    setSearchType("city");
    setResults([]);
    setSelectedHospital(null);
    setShowResults(false);
  };

  // --------------------------------------------------
  // CONSULTATION NAVIGATION
  // --------------------------------------------------

  const bookHospitalConsultation = (
    item: DoctorHospitalResult
  ) => {
    if (!item.hospital) {
      Alert.alert(
        "Hospital consultation unavailable",
        "This doctor is listed as an independent doctor. Hospital consultation booking is available only for doctors linked to a hospital."
      );
      return;
    }

    navigation.navigate("ConsultationRequest", {
      doctorId: item.doctor._id,
      hospitalId: item.hospital._id,
      hospitalName: item.hospital.name,
      bookingMode: item.bookingMode || "request",
      consultationFee: item.consultationFee || 0,
      type: "hospital",
    });
  };

  // --------------------------------------------------
  // SEARCH TYPE SELECTOR
  // --------------------------------------------------

  const renderSearchTypes = () => {
    const options: { label: string; value: SearchType }[] = [
      { label: "City", value: "city" },
      { label: "Hospital", value: "hospital" },
      { label: "Doctor", value: "doctor" },
    ];

    return (
      <View style={styles.searchTypeContainer}>
        {options.map((option) => {
          const active = searchType === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.searchTypeButton,
                active && styles.searchTypeActive,
              ]}
              onPress={() => {
                setSearchType(option.value);
                setSearchText("");
              }}
            >
              <Text
                style={[
                  styles.searchTypeText,
                  active && styles.searchTypeTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // --------------------------------------------------
  // DOCTOR CARD
  // --------------------------------------------------

  const renderDoctor = (item: DoctorHospitalResult) => {
    const doctor = item.doctor;
    const imageUri = doctor.avatar || doctor.profileImage;

    return (
      <View
        key={`${doctor._id}-${item.hospital?._id || "independent"}`}
        style={styles.doctorCard}
      >
        <View style={styles.doctorTop}>
          <Image
            source={
              imageUri
                ? { uri: imageUri }
                : {
                    uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                  }
            }
            style={styles.doctorImage}
          />

          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>
              {doctor.name || "Doctor"}
            </Text>

            <Text style={styles.specialization}>
              {doctor.specialization || "General Physician"}
            </Text>

            <Text style={styles.experience}>
              {doctor.experience ?? 0} years experience
            </Text>

            <Text style={styles.rating}>
              ⭐ {Number(doctor.rating || 0).toFixed(1)}
            </Text>
          </View>
        </View>

       <View style={styles.feeContainer}>
  <View style={styles.feeItem}>
    <Text style={styles.feeLabel}>Consultation fee</Text>
    <Text style={styles.feeValue}>
      ₹{Number(item.consultationFee || 0)}
    </Text>
  </View>
</View>

        {item.hospital ? (
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => bookHospitalConsultation(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.bookButtonText}>
              Book Hospital Consultation
            </Text>
            <Text style={styles.bookArrow}>›</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.experience}>
            Independent Doctor · {doctor.city || "Location unavailable"}
          </Text>
        )}

        <TouchableOpacity
          style={styles.videoButton}
          disabled
          activeOpacity={1}
        >
          <Text style={styles.videoButtonText}>
            Video Consultation · Coming Soon
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // --------------------------------------------------
  // HOSPITAL CARD
  // --------------------------------------------------

  const renderHospital = (hospital: Hospital) => {
    const verified =
      hospital.isVerified === true ||
      hospital.verificationStatus === "Verified";

    return (
      <TouchableOpacity
        key={hospital._id}
        style={styles.hospitalCard}
        onPress={() => openHospital(hospital)}
        activeOpacity={0.85}
      >
        <View style={styles.hospitalIcon}>
          {hospital.logo ? (
            <Image
              source={{ uri: hospital.logo }}
              style={styles.hospitalLogo}
            />
          ) : (
            <Text style={styles.hospitalEmoji}>✚</Text>
          )}
        </View>

        <View style={styles.hospitalInfo}>
          <Text style={styles.hospitalName}>
            {hospital.name}
          </Text>

          <Text style={styles.hospitalLocation}>
            {[hospital.city, hospital.state]
              .filter(Boolean)
              .join(", ") || "Location not available"}
          </Text>

          <View style={styles.verificationRow}>
            <View
              style={[
                styles.verificationDot,
                {
                  backgroundColor: verified ? "#16A34A" : "#D97706",
                },
              ]}
            />

            <Text
              style={[
                styles.verificationText,
                {
                  color: verified ? "#15803D" : "#B45309",
                },
              ]}
            >
              {verified ? "Verified" : "Not yet verified"}
            </Text>
          </View>
        </View>

        <Text style={styles.hospitalArrow}>›</Text>
      </TouchableOpacity>
    );
  };

  // --------------------------------------------------
  // MAIN HEADER
  // --------------------------------------------------

  const renderHeader = () => (
    <View>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>YOUR HEALTH, YOUR CHOICE</Text>
        <Text style={styles.heroTitle}>
          Find the right{"\n"}doctor for you.
        </Text>
        <Text style={styles.heroSubtitle}>
          Discover hospitals and consult experienced doctors near you.
        </Text>

        <View style={styles.heroDecoration}>
          <Text style={styles.heroDecorationText}>✚</Text>
        </View>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.searchHeading}>
          Find a consultation
        </Text>

        {renderSearchTypes()}

        <View style={styles.searchInputRow}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={
              searchType === "city"
                ? "Enter your city"
                : searchType === "hospital"
                ? "Enter hospital name"
                : "Enter doctor name"
            }
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() =>
              performSearch(searchText, searchType)
            }
          />
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => performSearch(searchText, searchType)}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.searchButtonText}>
              Search
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {showResults ? (
        <View style={styles.resultsHeading}>
          <View>
            <Text style={styles.sectionTitle}>
              {selectedHospital
                ? "Available doctors"
                : "Search results"}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {results.length} doctor(s) found
            </Text>
          </View>

          <TouchableOpacity onPress={resetSearch}>
            <Text style={styles.resetText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resultsHeading}>
          <View>
            <Text style={styles.sectionTitle}>
              Explore hospitals
            </Text>
            <Text style={styles.sectionSubtitle}>
              Choose a hospital to see its approved doctors
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>
          Finding hospitals...
        </Text>
      </View>
    );
  }

  // --------------------------------------------------
  // MAIN SCREEN
  // --------------------------------------------------

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#F5F8FA"
        barStyle="dark-content"
      />

      {showResults ? (
        <FlatList
          data={hospitalGroups}
          keyExtractor={(item) => item.hospital._id}
         ListHeaderComponent={
  <View>
    {renderHeader()}
    <ConsultationStatusBanner />
    {independentResults.map(renderDoctor)}
  </View>
}
          renderItem={({ item }) => (
            <View style={styles.resultHospital}>
              <View style={styles.resultHospitalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultHospitalName}>
                    {item.hospital.name}
                  </Text>

                  <Text style={styles.resultHospitalLocation}>
                    {[item.hospital.city, item.hospital.state]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>

                <View
                  style={[
                    styles.smallVerification,
                    {
                      backgroundColor:
                        item.hospital.isVerified ||
                        item.hospital.verificationStatus === "Verified"
                          ? "#DCFCE7"
                          : "#FEF3C7",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.smallVerificationText,
                      {
                        color:
                          item.hospital.isVerified ||
                          item.hospital.verificationStatus === "Verified"
                            ? "#15803D"
                            : "#92400E",
                      },
                    ]}
                  >
                    {item.hospital.isVerified ||
                    item.hospital.verificationStatus === "Verified"
                      ? "Verified"
                      : "Not yet verified"}
                  </Text>
                </View>
              </View>

              {item.doctors.map(renderDoctor)}
            </View>
          )}
          ListEmptyComponent={
            independentResults.length > 0 ? null : (
              <View style={styles.emptyContainer}>
                {searching ? (
                  <ActivityIndicator size="large" color="#0F766E" />
                ) : (
                  <>
                    <Text style={styles.emptyIcon}>⌕</Text>
                    <Text style={styles.emptyTitle}>
                      No doctors found
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      Try another city, hospital, or doctor name.
                    </Text>

                    <TouchableOpacity
                      style={styles.emptyButton}
                      onPress={resetSearch}
                    >
                      <Text style={styles.emptyButtonText}>
                        Explore hospitals
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={
  <View>
    {renderHeader()}
    <ConsultationStatusBanner />
  </View>
}
          renderItem={({ item }) => renderHospital(item)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                No active hospitals available
              </Text>
              <Text style={styles.emptySubtitle}>
                Please check again later.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

export default DoctorsScreen;

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FA",
  },

  listContent: {
    paddingBottom: 30,
  },

  hero: {
    backgroundColor: "#0F766E",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 22,
    borderRadius: 22,
    overflow: "hidden",
  },

  heroEyebrow: {
    color: "#BFEDE5",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "800",
  },

  heroSubtitle: {
    color: "#D7F3EF",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    maxWidth: "85%",
  },

  heroDecoration: {
    position: "absolute",
    right: -12,
    bottom: -25,
    width: 115,
    height: 115,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroDecorationText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 65,
    fontWeight: "800",
  },

  searchCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  searchHeading: {
    color: "#172B35",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 13,
  },

  searchTypeContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F6",
    borderRadius: 11,
    padding: 4,
    marginBottom: 13,
  },

  searchTypeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },

  searchTypeActive: {
    backgroundColor: "#0F766E",
  },

  searchTypeText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 13,
  },

  searchTypeTextActive: {
    color: "#FFFFFF",
  },

  searchInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 11,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },

  searchIcon: {
    color: "#0F766E",
    fontSize: 25,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: "#172B35",
    paddingVertical: 13,
    fontSize: 14,
  },

  searchButton: {
    backgroundColor: "#0F766E",
    borderRadius: 11,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },

  searchButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  resultsHeading: {
    marginHorizontal: 18,
    marginTop: 24,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    color: "#172B35",
    fontSize: 19,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#84919B",
    fontSize: 12,
    marginTop: 4,
  },

  resetText: {
    color: "#0F766E",
    fontWeight: "800",
    fontSize: 13,
  },

  hospitalCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAF0F2",
  },

  hospitalIcon: {
    width: 53,
    height: 53,
    borderRadius: 14,
    backgroundColor: "#E5F4F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    overflow: "hidden",
  },

  hospitalLogo: {
    width: "100%",
    height: "100%",
  },

  hospitalEmoji: {
    color: "#0F766E",
    fontSize: 29,
    fontWeight: "800",
  },

  hospitalInfo: {
    flex: 1,
  },

  hospitalName: {
    color: "#172B35",
    fontSize: 15,
    fontWeight: "800",
  },

  hospitalLocation: {
    color: "#7B8993",
    fontSize: 12,
    marginTop: 5,
  },

  verificationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  verificationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  verificationText: {
    fontSize: 11,
    fontWeight: "700",
  },

  hospitalArrow: {
    color: "#0F766E",
    fontSize: 28,
    marginLeft: 8,
  },

  resultHospital: {
    marginHorizontal: 16,
    marginBottom: 15,
    padding: 13,
    backgroundColor: "#EAF3F2",
    borderRadius: 17,
  },

  resultHospitalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 3,
  },

  resultHospitalName: {
    color: "#173C3B",
    fontSize: 15,
    fontWeight: "800",
  },

  resultHospitalLocation: {
    color: "#718582",
    fontSize: 12,
    marginTop: 4,
  },

  smallVerification: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },

  smallVerificationText: {
    fontSize: 10,
    fontWeight: "800",
  },

  doctorCard: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    marginTop: 9,
    borderWidth: 1,
    borderColor: "#E8EEEE",
  },

  doctorTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  doctorImage: {
    width: 66,
    height: 66,
    borderRadius: 17,
    backgroundColor: "#E9EFF0",
    marginRight: 13,
  },

  doctorDetails: {
    flex: 1,
  },

  doctorName: {
    color: "#172B35",
    fontSize: 16,
    fontWeight: "800",
  },

  specialization: {
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },

  experience: {
    color: "#718096",
    fontSize: 12,
    marginTop: 4,
  },

  rating: {
    color: "#A16207",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "700",
  },

  feeContainer: {
    flexDirection: "row",
    backgroundColor: "#F6F9F9",
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    alignItems: "center",
  },

  feeItem: {
    flex: 1,
  },

  feeLabel: {
    color: "#87949B",
    fontSize: 11,
  },

  feeValue: {
    color: "#173C3B",
    fontWeight: "800",
    fontSize: 14,
    marginTop: 5,
  },

  feeDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#DDE7E6",
    marginHorizontal: 12,
  },

  bookButton: {
    backgroundColor: "#0F766E",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  bookButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },

  bookArrow: {
    color: "#FFFFFF",
    fontSize: 22,
    marginLeft: 8,
    lineHeight: 22,
  },

  videoButton: {
    backgroundColor: "#F1F3F5",
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E5E9",
  },

  videoButtonText: {
    color: "#9AA3AD",
    fontSize: 12,
    fontWeight: "700",
  },

  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 55,
  },

  emptyIcon: {
    color: "#0F766E",
    fontSize: 42,
    marginBottom: 8,
  },

  emptyTitle: {
    color: "#263B45",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
  },

  emptySubtitle: {
    color: "#89959D",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  emptyButton: {
    backgroundColor: "#0F766E",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9,
    marginTop: 18,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F8FA",
  },

  loadingText: {
    color: "#64748B",
    marginTop: 12,
    fontSize: 13,
  },
});
