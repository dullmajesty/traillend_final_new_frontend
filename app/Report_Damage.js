import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "../lib/authStorage";
import Toast from "react-native-toast-message";
import { useRoute } from "@react-navigation/native";

export default function DamageReport() {
  // ROUTE PARAMS RECEIVED FROM SelectItemToReport.js
  const route = useRoute();
  const params = route.params || {};  
    const {
      reservation_id,
      item_id,
      item_name,
      quantity,
      image_url,
      date_borrowed,
      date_return,
      items = [] } = route.params;

  

  const [reportType, setReportType] = useState("Damage");
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState("");
  const [quantityAffected, setQuantityAffected] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const BASE = "http://192.168.1.8:8000";
  const SUBMIT_URL = BASE + "/api/damage-report/";


  // PICK IMAGE
 const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.9,
});

  if (!result.canceled) {
    setImage(result.assets[0].uri);
  }
};


  // SUBMIT REPORT
  const handleSubmit = async () => {
    if (!location || !quantityAffected || !description || !image) {
      return Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill out all fields and upload an image.",
      });
    }

    if (parseInt(quantityAffected) <= 0 || isNaN(quantityAffected)) {
      return Toast.show({
        type: "error",
        text1: "Invalid Quantity",
        text2: "Quantity must be a positive number.",
      });
    }

    setLoading(true);

    try {
      const auth = await getAuth();
      const token = auth?.accessToken;

      const formData = new FormData();
      formData.append("report_type", reportType);
      formData.append("location", location);
      formData.append("quantity_affected", quantityAffected);
      formData.append("description", description);

      // THE SELECTED ITEM
      formData.append("item_id", item_id);

      // RESERVATION
      formData.append("reservation_id", reservation_id);

      formData.append("image", {
        uri: image,
        name: "report.jpg",
        type: "image/jpeg",
      });


      const response = await fetch(SUBMIT_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
    },
    body: formData,
  });

  // Read RAW server response
  const raw = await response.text();
  console.log("RAW SERVER RESPONSE:", raw);

  // Try parsing JSON safely
  let data = {};
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.log("❌ JSON PARSE ERROR:", e);
    Toast.show({
      type: "error",
      text1: "Server Error",
      text2: "Internal server error occurred. Check Django logs.",
    });
    return;
  }

  console.log("JSON DATA:", data);


      if (data.success || data.status === "success") {
        Toast.show({
          type: "success",
          text1: `${reportType} Report Submitted`,
          text2: "Your report has been successfully submitted.",
        });

        setImage(null);
        setLocation("");
        setQuantityAffected("");
        setDescription("");
      } else {
        Toast.show({
          type: "error",
          text1: "Submission Failed",
          text2: data.message || "Please try again.",
        });
      }
    } catch (err) {
      console.log("SUBMISSION ERROR:", err);
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Unable to submit the report.",
      });
    }

    setLoading(false);
  };

  // ==========================================================================================
  // ======================================== UI =============================================
  // ==========================================================================================

  return (
    <LinearGradient colors={["#4FC3F7", "#1E88E5"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="warning-outline" size={30} color="#fff" />
            <Text style={styles.subtitle}>
              Submit accurate details for damaged or lost items.
            </Text>
          </View>

          {/* SELECTED ITEM PREVIEW */}
          <View style={styles.selectedItemBox}>
            <Text style={styles.selectedItemTitle}>Reporting Item:</Text>

            <Text style={styles.selectedItemName}>{item_name}</Text>
            <Text style={styles.selectedItemInfo}>Qty Borrowed: {quantity}</Text>
            <Text style={styles.selectedItemInfo}>
              {date_borrowed} → {date_return}
            </Text>

            {image_url && (
              <Image source={{ uri: image_url }} style={styles.selectedItemImg} />
            )}
          </View>

          {/* REPORT FORM CARD */}
          <View style={styles.card}>
            {/* REPORT TYPE */}
            <Text style={styles.label}>Report Type</Text>

            <View style={styles.selectorContainer}>
              <TouchableOpacity
                onPress={() => setReportType("Damage")}
                style={[
                  styles.selectorBtn,
                  reportType === "Damage" && styles.selectorActive,
                ]}
              >
                <Text
                  style={[
                    styles.selectorText,
                    reportType === "Damage" && styles.selectorTextActive,
                  ]}
                >
                  Damage
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setReportType("Loss")}
                style={[
                  styles.selectorBtn,
                  reportType === "Loss" && styles.selectorActive,
                ]}
              >
                <Text
                  style={[
                    styles.selectorText,
                    reportType === "Loss" && styles.selectorTextActive,
                  ]}
                >
                  Loss
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info Note */}
            <Text style={styles.note}>
              ⚠️ Provide details such as location, quantity, and a clear description.
            </Text>

            {/* IMAGE UPLOAD */}
            <Text style={styles.label}>Upload {reportType} Image</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Ionicons name="cloud-upload-outline" size={18} color="#1976D2" />
              <Text style={styles.uploadText}>
                {image ? "Change Image" : "Choose Image"}
              </Text>
            </TouchableOpacity>

            {image && <Image source={{ uri: image }} style={styles.preview} />}

            {/* LOCATION */}
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Stage left side"
              placeholderTextColor="#777"
              value={location}
              onChangeText={setLocation}
            />

            {/* QUANTITY */}
            <Text style={styles.label}>Quantity {reportType} Affected</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={quantityAffected}
              onChangeText={setQuantityAffected}
            />

            {/* DESCRIPTION */}
            <Text style={styles.label}>Describe the {reportType}</Text>
            <TextInput
              style={[styles.input, { height: 90 }]}
              placeholder="Provide detailed description"
              placeholderTextColor="#777"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            {/* SUBMIT */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={["#64B5F6", "#1976D2"]}
                style={styles.submitGradient}
              >
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitText}>
                  {loading ? "Submitting..." : "Submit Report"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ==========================================================================================
// ======================================== STYLES ===========================================
// ==========================================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { alignItems: "center", marginBottom: 20 },
  subtitle: {
    color: "#E3F2FD",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },

  // Selected item
  selectedItemBox: {
    padding: 15,
    backgroundColor: "#E3F2FD",
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#90CAF9",
  },
  selectedItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1976D2",
    marginBottom: 5,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0D47A1",
  },
  selectedItemInfo: { color: "#444", fontSize: 12 },
  selectedItemImg: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginTop: 10,
  },

  // Card form
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  // selector
  selectorContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#90CAF9",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
  },
  selectorActive: {
    backgroundColor: "#1976D2",
    borderColor: "#1976D2",
  },
  selectorText: {
    color: "#1976D2",
    fontWeight: "600",
  },
  selectorTextActive: {
    color: "#fff",
  },

  note: {
    color: "#1976D2",
    fontSize: 13,
    marginBottom: 15,
    fontWeight: "500",
  },

  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#90CAF9",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#E3F2FD",
    marginBottom: 10,
  },
  uploadText: { color: "#1976D2", fontWeight: "600" },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 15,
  },

  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 6 },

  input: {
    backgroundColor: "#F7F9FC",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    fontSize: 14,
    color: "#000",
  },

  submitButton: { marginTop: 5, borderRadius: 12, overflow: "hidden" },
  submitGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    gap: 8,
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
