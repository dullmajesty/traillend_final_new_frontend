import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ReservationStatus() {
  const [selectedFilter, setSelectedFilter] = useState("Pending");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Added "In Use" filter
  const filters = ["Pending", "Upcoming", "In Use", "Past", "Cancelled"];

  useEffect(() => {
    fetchReservations();

  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      const res = await fetch("http://192.168.1.8:8000/api/user_reservations/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("RESERVATIONS RESPONSE:", JSON.stringify(data, null, 2));
      if (data.success) setReservations(data.reservations);
      else setError("No reservations found.");
    } catch (err) {
      console.error(err);
      setError("Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (id) => {
    Alert.alert("Cancel Reservation", "Are you sure you want to cancel this?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await fetch(
              `http://192.168.1.8:8000/api/reservations/${id}/cancel/`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            const data = await res.json();
            if (data.success) {
              Alert.alert("Success", "Reservation cancelled successfully!");
              setModalVisible(false);
              fetchReservations();
            } else {
              Alert.alert("Error", data.message || "Unable to cancel reservation.");
            }
          } catch (error) {
            console.error(error);
            Alert.alert("Error", "Something went wrong.");
          }
        },
      },
    ]);
  };

  //  Added new color for "in use"
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFC107";
      case "approved":
        return "#4CAF50";
      case "in use":
        return "#2196F3"; // blue tone for active usage
      case "declined":
        return "#E53935";
      case "cancelled":
        return "#757575";
      case "returned":
        return "#1976D2";
      default:
        return "#555";
    }
  };

  //  Added filter for "In Use"
  const filteredReservations = reservations.filter((r) => {
    if (selectedFilter === "Pending") return r.status === "pending";
    if (selectedFilter === "Upcoming") return r.status === "approved";
    if (selectedFilter === "In Use") return r.status === "in use";
    if (selectedFilter === "Past") return r.status === "returned";
    if (selectedFilter === "Cancelled")
      return r.status === "Cancelled" || r.status === "declined";
    return false;
  });


  const renderReservation = ({ item }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.9}
    onPress={() => {
      setSelectedReservation(item);
      setModalVisible(true);
      console.log("ITEM:", item);

    }}
  >
    <View style={{ flexDirection: "row", width: "100%" }}>
      
      {/* IMAGE */}
      {item.items && item.items.length > 0 ? (
        <Image source={{ uri: item.items[0].image_url }} style={styles.image} />
      ) : (
        <Image
          source={require("../../assets/default_item.png")}
          style={styles.image}
        />
      )}

      {/* RIGHT SIDE TEXT */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        
        {/* NAME */}
        <Text style={styles.itemName}>
          {item.items?.length > 0 ? item.items[0].name : "No Item"}
        </Text>

        {/* QTY */}
        <Text style={styles.detail}>
          Qty: {item.items?.length > 0 ? item.items[0].quantity : 0}
        </Text>

        {/* + more items */}
        {item.items?.length > 1 && (
          <Text style={{ fontSize: 12, color: "#1E88E5", marginTop: 2 }}>
            +{item.items.length - 1} more items
          </Text>
        )}

        {/* DATES */}
        <Text style={styles.detail}>
          Borrowed: {item.date_borrowed || "—"}
        </Text>
        <Text style={styles.detail}>
          Return: {item.date_return || "—"}
        </Text>

        {/* STATUS */}
        <View
          style={[
            styles.statusPill,
            { backgroundColor: getStatusColor(item.status) + "33" },
          ]}
        >
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>

    {/* Arrow */}
    <Ionicons
      name="chevron-forward"
      size={20}
      color="#888"
      style={{ position: "absolute", right: 12, top: 12 }}
    />
  </TouchableOpacity>
);

  
  return (
    <LinearGradient colors={["#4FC3F7", "#1E88E5"]} style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterWrapper}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterPill,
              selectedFilter === filter && styles.selectedPill,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.selectedText,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reservation List */}
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : error ? (
          <Text style={styles.noData}>{error}</Text>
        ) : filteredReservations.length === 0 ? (
          <Text style={styles.noData}>
            No {selectedFilter.toLowerCase()} reservations found.
          </Text>
        ) : (
          <FlatList
            data={filteredReservations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderReservation}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* MODAL */}
        <Modal visible={modalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {selectedReservation && (
                <>
                  <Ionicons
                    name="information-circle-outline"
                    size={30}
                    color="#ffffffff"
                  />

                  <Text style={styles.modalTitle}>
                    {selectedReservation.items?.length > 1
                      ? "Multiple Items"
                      : selectedReservation.items?.length === 1
                      ? selectedReservation.items[0].name
                      : "No Item"}
                  </Text>


                  {/* 🔹 SHOW ALL ITEMS */}
                 <View style={{ width: "100%", marginBottom: 10 }}>
                  {selectedReservation.items?.map((it, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Image
                        source={
                          it.image_url ? { uri: it.image_url } : require("../../assets/default_item.png")
                        }
                        style={{
                          width: 65,
                          height: 65,
                          borderRadius: 10,
                          marginRight: 10,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: "#0e0c0cff" }}>
                          {it.name}
                        </Text>
                        <Text style={{ fontSize: 13, color: "#140c0cff" }}>
                          Qty: {it.quantity}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                  {/* 🔹 DETAILS */}
                  <View style={styles.modalContent}>
                    <Text style={styles.modalDetail}>
                      <Text style={styles.bold}>Borrowed:</Text>{" "}
                      {selectedReservation.date_borrowed || "—"}
                    </Text>

                    <Text style={styles.modalDetail}>
                      <Text style={styles.bold}>Return:</Text>{" "}
                      {selectedReservation.date_return || "—"}
                    </Text>

                    <Text style={styles.modalDetail}>
                      <Text style={styles.bold}>Status:</Text>{" "}
                      <Text
                        style={{
                          color: getStatusColor(selectedReservation.status),
                        }}
                      >
                        {selectedReservation.status.toUpperCase()}
                      </Text>
                    </Text>

                    {/* 🔹 FIXED: Reason for Borrowing */}
                    <Text style={styles.modalDetail}>
                    <Text style={styles.bold}>Priority:</Text>{" "}
                    {selectedReservation.priority || "N/A"}
                  </Text>

                  </View>

                  {/* Cancel Button */}
                  {selectedReservation.status === "pending" && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => cancelReservation(selectedReservation.id)}
                    >
                      <Text style={styles.cancelText}>Cancel Reservation</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

    </LinearGradient>
  );
}

// =================== STYLES ===================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  filterWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 30,
    padding: 5,
  },
  filterPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectedPill: {
    backgroundColor: "#FFC107",
  },
  filterText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  selectedText: {
    color: "#1E1E1E",
    fontWeight: "700",
  },
  listContainer: { flex: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  image: { width: 70, height: 70, borderRadius: 10 },
  itemName: { fontSize: 16, fontWeight: "700", color: "#1E88E5" },
  detail: { fontSize: 13, color: "#555" },
  statusPill: {
    marginTop: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  status: { fontSize: 12, fontWeight: "700" },
  noData: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    marginTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#4FC3F7",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: width * 0.85,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#343232ff",
    marginTop: 8,
    marginBottom: 10,
  },
  itemRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 10,
  backgroundColor: "rgba(255,255,255,0.1)", 
  padding: 10,
  borderRadius: 10,
},

  modalImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
    marginVertical: 10,
  },
  modalContent: { width: "100%", marginBottom: 10 },
  modalDetail: {
  fontSize: 14,
  color: "#ffffff",
  marginVertical: 2,
},
  bold: { fontWeight: "600", color: "#ffffff" },

  cancelButton: {
    backgroundColor: "#E53935",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 25,
    marginTop: 8,
  },
  cancelText: { color: "#fff", fontWeight: "bold" },
  closeButton: {
    backgroundColor: "#1E88E5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 10,
  },
  closeText: { color: "#fff", fontWeight: "bold" },
});
