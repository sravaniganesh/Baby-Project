
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../config/api";

type Hospital = {
  _id: string;
  name: string;
  hospitalType?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isVerified?: boolean;
};

type Association = {
  _id: string;
  hospitalId: Hospital | string;
  department?: string;
  designation?: string;
  consultationFee?: number;
  consultationDuration?: number;
  bookingMode?: string;
  status: "pending" | "approved" | "rejected";
  isActive?: boolean;
};

type TabType = "my" | "find";

type ScreenProps = {
  route?: {
    params?: {
      doctor?: {
        _id?: string;
        id?: string;
      };
      doctorId?: string;
      permissions?: {
        manageHospitalFees?: boolean;
      };
    };
  };
};

const DoctorHospitalEnrollmentScreen = ({ route }: ScreenProps) => {
  // When opened by an assistant, the selected doctor's ID is passed in route params.
  // When opened by a doctor, no doctorId param is needed; the backend uses the JWT. 
  const doctorId =
    route?.params?.doctor?._id ||
    route?.params?.doctor?.id ||
    route?.params?.doctorId;

  const isAssistantMode = Boolean(doctorId);
  const canManageHospitalFees =
    !isAssistantMode || route?.params?.permissions?.manageHospitalFees === true;
  const [activeTab, setActiveTab] = useState<TabType>("my");

  const [associations, setAssociations] = useState<Association[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");

  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(
    null
  );

  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [editingFeeAssociationId, setEditingFeeAssociationId] =
    useState<string | null>(null);
  const [feeEditValue, setFeeEditValue] = useState("");
  const [feeUpdating, setFeeUpdating] = useState(false);

  const loadMyHospitals = useCallback(async () => {
    try {
      setLoading(true);

      const response = await API.get("/doctor-hospitals/my", {
        params: doctorId ? { doctorId } : {},
      });

      setAssociations(response.data?.associations || []);
    } catch (error: any) {
      console.log(
        "LOAD DOCTOR HOSPITALS ERROR:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "Unable to load hospitals",
        error?.response?.data?.message ||
          "Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const searchHospitals = useCallback(async () => {
    try {
      setSearchLoading(true);

      const response = await API.get("/doctor-hospitals/search", {
        params: {
          search: search.trim(),
          city: city.trim(),
          ...(doctorId ? { doctorId } : {}),
        },
      });

      setHospitals(response.data?.hospitals || []);
    } catch (error: any) {
      console.log(
        "SEARCH HOSPITALS ERROR:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "Search failed",
        error?.response?.data?.message ||
          "Unable to search hospitals. Please try again."
      );
    } finally {
      setSearchLoading(false);
    }
  }, [search, city, doctorId]);

  useEffect(() => {
    loadMyHospitals();
  }, [loadMyHospitals]);

  useEffect(() => {
    if (activeTab !== "find") return;

    const timer = setTimeout(() => {
      searchHospitals();
    }, 400);

    return () => clearTimeout(timer);
  }, [activeTab, search, city, searchHospitals]);

  const onRefresh = async () => {
    setRefreshing(true);

    if (activeTab === "my") {
      await loadMyHospitals();
    } else {
      await searchHospitals();
    }

    setRefreshing(false);
  };

  const getHospital = (association: Association): Hospital | null => {
    if (
      association.hospitalId &&
      typeof association.hospitalId === "object"
    ) {
      return association.hospitalId;
    }

    return null;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return styles.approvedStatus;
      case "rejected":
        return styles.rejectedStatus;
      default:
        return styles.pendingStatus;
    }
  };

  const isAlreadyAssociated = (hospitalId: string) => {
    return associations.some((association) => {
      const associatedHospitalId =
        typeof association.hospitalId === "object"
          ? association.hospitalId?._id
          : association.hospitalId;

      return (
        associatedHospitalId === hospitalId &&
        (association.status === "pending" ||
          association.status === "approved")
      );
    });
  };

  const openRequestForm = (hospital: Hospital) => {
    if (isAlreadyAssociated(hospital._id)) {
      Alert.alert(
        "Already requested",
        "You already have a pending request or approved association with this hospital."
      );
      return;
    }

    setSelectedHospital(hospital);
    setDepartment("");
    setDesignation("");
    setConsultationFee("");
  };

  const submitRequest = async () => {
    if (!selectedHospital) return;

    if (!department.trim()) {
      Alert.alert("Required", "Please enter your department.");
      return;
    }

    if (!designation.trim()) {
      Alert.alert("Required", "Please enter your designation.");
      return;
    }

    if (!consultationFee.trim()) {
      Alert.alert("Required", "Please enter your consultation fee.");
      return;
    }

    const fee = Number(consultationFee);
    
    if (!Number.isFinite(fee) || fee < 0) {
      Alert.alert("Invalid fee", "Please enter a valid consultation fee.");
      return;
    }

  

    try {
      setSubmitting(true);

      const response = await API.post("/doctor-hospitals/request", {
        hospitalId: selectedHospital._id,
        department: department.trim(),
        designation: designation.trim(),
        consultationFee: fee,
        ...(doctorId ? { doctorId } : {}),
      });

      Alert.alert(
        "Request submitted",
        response.data?.message ||
          "Your hospital association request has been submitted for admin approval."
      );

      setSelectedHospital(null);
      setActiveTab("my");

      await loadMyHospitals();
    } catch (error: any) {
      console.log(
        "HOSPITAL REQUEST ERROR:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "Request failed",
        error?.response?.data?.message ||
          "Unable to submit your request. Please try again."
      );

      if (error?.response?.status === 409) {
        await loadMyHospitals();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateHospitalFee = async (associationId: string) => {
    if (!feeEditValue.trim()) {
      Alert.alert("Required", "Please enter the consultation fee.");
      return;
    }

    const fee = Number(feeEditValue);

    if (!Number.isFinite(fee) || fee < 0) {
      Alert.alert("Invalid fee", "Please enter a valid consultation fee.");
      return;
    }

    try {
      setFeeUpdating(true);

      const response = await API.patch(
        `/doctor-hospitals/${associationId}/fee`,
        { consultationFee: fee }
      );

      Alert.alert(
        "Fee updated",
        response.data?.message || "Consultation fee updated successfully."
      );

      setEditingFeeAssociationId(null);
      setFeeEditValue("");
      await loadMyHospitals();
    } catch (error: any) {
      console.log(
        "UPDATE HOSPITAL FEE ERROR:",
        error?.response?.data || error?.message
      );

      Alert.alert(
        "Update failed",
        error?.response?.data?.message ||
          "Unable to update consultation fee. Please try again."
      );
    } finally {
      setFeeUpdating(false);
    }
  };

  const renderAssociation = ({ item }: { item: Association }) => {
    const hospital = getHospital(item);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.hospitalIcon}>
            <Text style={styles.hospitalIconText}>H</Text>
          </View>

          <View style={styles.hospitalTitleContainer}>
            <Text style={styles.hospitalName}>
              {hospital?.name || "Hospital details unavailable"}
            </Text>

            <Text style={styles.locationText}>
              {[hospital?.city, hospital?.state]
                .filter(Boolean)
                .join(", ") || "Location unavailable"}
            </Text>
          </View>

          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={styles.statusText}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {hospital?.isVerified !== undefined && (
          <Text
            style={[
              styles.verificationText,
              hospital.isVerified
                ? styles.verifiedText
                : styles.notVerifiedText,
            ]}
          >
            {hospital.isVerified
              ? "✓ Verified hospital"
              : "Not yet verified"}
          </Text>
        )}

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Department</Text>
          <Text style={styles.detailValue}>
            {item.department || "Not specified"}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Designation</Text>
          <Text style={styles.detailValue}>
            {item.designation || "Not specified"}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Consultation fee</Text>
          <Text style={styles.detailValue}>
            ₹{item.consultationFee ?? 0}
          </Text>
        </View>

        {item.status === "approved" &&
          item.isActive !== false &&
          canManageHospitalFees && (
            <View style={{ marginTop: 8 }}>
              {editingFeeAssociationId === item._id ? (
                <>
                  <Text style={styles.inputLabel}>
                    Update consultation fee (₹)
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new consultation fee"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={feeEditValue}
                    onChangeText={setFeeEditValue}
                  />

                  <View style={styles.feeActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        styles.feeActionButton,
                        feeUpdating && styles.disabledButton,
                      ]}
                      disabled={feeUpdating}
                      onPress={() => updateHospitalFee(item._id)}
                    >
                      {feeUpdating ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Save Fee</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        styles.feeActionButton,
                        styles.cancelFeeButton,
                      ]}
                      disabled={feeUpdating}
                      onPress={() => {
                        setEditingFeeAssociationId(null);
                        setFeeEditValue("");
                      }}
                    >
                      <Text style={styles.primaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    setEditingFeeAssociationId(item._id);
                    setFeeEditValue(String(item.consultationFee ?? 0));
                  }}
                >
                  <Text style={styles.primaryButtonText}>
                    Update Consultation Fee
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        {item.status === "pending" && (
          <Text style={styles.infoMessage}>
            Your request is waiting for admin approval.
          </Text>
        )}

        {item.status === "rejected" && (
          <Text style={styles.rejectedMessage}>
            Your request was rejected. You can submit a new request from Find
            Hospitals.
          </Text>
        )}
      </View>
    );
  };

  const renderHospital = ({ item }: { item: Hospital }) => {
    const alreadyRequested = isAlreadyAssociated(item._id);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.hospitalIcon}>
            <Text style={styles.hospitalIconText}>H</Text>
          </View>

          <View style={styles.hospitalTitleContainer}>
            <Text style={styles.hospitalName}>{item.name}</Text>

            <Text style={styles.locationText}>
              {[item.city, item.state].filter(Boolean).join(", ")}
            </Text>
          </View>
        </View>

        {item.hospitalType ? (
          <Text style={styles.hospitalType}>{item.hospitalType}</Text>
        ) : null}

        {item.address ? (
          <Text style={styles.addressText}>{item.address}</Text>
        ) : null}

        <Text
          style={[
            styles.verificationText,
            item.isVerified ? styles.verifiedText : styles.notVerifiedText,
          ]}
        >
          {item.isVerified
            ? "✓ Verified hospital"
            : "Not yet verified"}
        </Text>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            alreadyRequested && styles.disabledButton,
          ]}
          disabled={alreadyRequested}
          onPress={() => openRequestForm(item)}
        >
          <Text style={styles.primaryButtonText}>
            {alreadyRequested ? "Already requested / approved" : "Request to Join"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRequestForm = () => {
    if (!selectedHospital) return null;

    return (
      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.formTitle}>Hospital Association Request</Text>
            <Text style={styles.formHospitalName}>
              {selectedHospital.name}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setSelectedHospital(null)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>Department *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Cardiology"
          placeholderTextColor="#999"
          value={department}
          onChangeText={setDepartment}
        />

        <Text style={styles.inputLabel}>Designation *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Senior Consultant"
          placeholderTextColor="#999"
          value={designation}
          onChangeText={setDesignation}
        />

        <Text style={styles.inputLabel}>Consultation Fee (₹) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter consultation fee"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={consultationFee}
          onChangeText={setConsultationFee}
        />

        <Text style={styles.formNote}>
          Your request will remain pending until the platform admin reviews
          and approves it.
        </Text>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            submitting && styles.disabledButton,
          ]}
          onPress={submitRequest}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Submit Association Request
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Hospitals</Text>
        <Text style={styles.headerSubtitle}>
          {isAssistantMode
            ? "Managing hospital associations for the selected doctor"
            : "Manage your hospital associations"}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "my" && styles.activeTab]}
          onPress={() => {
            setSelectedHospital(null);
            setActiveTab("my");
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "my" && styles.activeTabText,
            ]}
          >
            My Hospitals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "find" && styles.activeTab]}
          onPress={() => {
            setSelectedHospital(null);
            setActiveTab("find");
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "find" && styles.activeTabText,
            ]}
          >
            Find Hospitals
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "my" ? (
        loading && associations.length === 0 ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#087F8C" />
            <Text style={styles.loadingText}>Loading your hospitals...</Text>
          </View>
        ) : (
          <FlatList
            data={associations}
            keyExtractor={(item) => item._id}
            renderItem={renderAssociation}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#087F8C"]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No hospitals yet</Text>
                <Text style={styles.emptyText}>
                  Search for a hospital and submit an association request to
                  start consulting there.
                </Text>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setActiveTab("find")}
                >
                  <Text style={styles.primaryButtonText}>
                    Find Hospitals
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        )
      ) : (
        <ScrollView
          style={styles.findContainer}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#087F8C"]}
            />
          }
        >
          <Text style={styles.sectionDescription}>
            Search active hospitals and request to join their medical team.
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search hospital name"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Filter by city"
            placeholderTextColor="#999"
            value={city}
            onChangeText={setCity}
          />

          {renderRequestForm()}

          {searchLoading ? (
            <ActivityIndicator
              size="large"
              color="#087F8C"
              style={{ marginTop: 25 }}
            />
          ) : hospitals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No hospitals found</Text>
              <Text style={styles.emptyText}>
                Try another hospital name or city.
              </Text>
            </View>
          ) : (
            <FlatList
              data={hospitals}
              keyExtractor={(item) => item._id}
              renderItem={renderHospital}
              scrollEnabled={false}
            />
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

export default DoctorHospitalEnrollmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7F8",
  },
  header: {
    backgroundColor: "#087F8C",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#D9F1F2",
    fontSize: 13,
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E7ECEE",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#087F8C",
  },
  tabText: {
    color: "#718087",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#087F8C",
  },
  listContent: {
    padding: 16,
    paddingBottom: 35,
  },
  findContainer: {
    flex: 1,
  },
  sectionDescription: {
    color: "#66757C",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E8EA",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#263238",
    marginBottom: 11,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E8EDEF",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  hospitalIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#E4F4F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  hospitalIconText: {
    color: "#087F8C",
    fontSize: 20,
    fontWeight: "800",
  },
  hospitalTitleContainer: {
    flex: 1,
  },
  hospitalName: {
    color: "#263238",
    fontSize: 16,
    fontWeight: "700",
  },
  locationText: {
    color: "#77858B",
    fontSize: 12,
    marginTop: 4,
  },
  hospitalType: {
    color: "#087F8C",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
  },
  addressText: {
    color: "#68777D",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
  },
  verifiedText: {
    color: "#16834A",
  },
  notVerifiedText: {
    color: "#B7791F",
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginLeft: 8,
  },
  approvedStatus: {
    backgroundColor: "#E2F5EA",
  },
  pendingStatus: {
    backgroundColor: "#FFF3D9",
  },
  rejectedStatus: {
    backgroundColor: "#FCE8E8",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#35434A",
  },
  divider: {
    height: 1,
    backgroundColor: "#E9EEF0",
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    color: "#718087",
    fontSize: 13,
  },
  detailValue: {
    color: "#263238",
    fontSize: 13,
    fontWeight: "600",
    maxWidth: "55%",
    textAlign: "right",
  },
  infoMessage: {
    color: "#9A6A13",
    backgroundColor: "#FFF7E7",
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    marginTop: 7,
  },
  rejectedMessage: {
    color: "#B42318",
    backgroundColor: "#FFF0EF",
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    marginTop: 7,
  },
  primaryButton: {
    backgroundColor: "#087F8C",
    borderRadius: 9,
    paddingVertical: 13,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  feeActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  feeActionButton: {
    flex: 1,
  },
  cancelFeeButton: {
    backgroundColor: "#718087",
  },
  disabledButton: {
    backgroundColor: "#A8B8BB",
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 45,
  },
  emptyTitle: {
    color: "#263238",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: "#77858B",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#718087",
    fontSize: 13,
    marginTop: 12,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 16,
    marginTop: 7,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#B9DCDD",
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  formTitle: {
    color: "#263238",
    fontSize: 16,
    fontWeight: "700",
  },
  formHospitalName: {
    color: "#087F8C",
    fontSize: 13,
    marginTop: 5,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F3F4",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#526168",
    fontSize: 24,
    lineHeight: 27,
  },
  inputLabel: {
    color: "#45545B",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 9,
  },
  input: {
    backgroundColor: "#FAFCFC",
    borderWidth: 1,
    borderColor: "#DFE7E9",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "#263238",
    fontSize: 14,
  },
  formNote: {
    color: "#77858B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 13,
  },
});
