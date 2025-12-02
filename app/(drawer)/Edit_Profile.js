import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";

const BASE_URL = "http://192.168.1.8:8000";

export default function EditProfile() {
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(true);

  const absUrl = (u) => (!u ? "" : u.startsWith("http") ? u : `${BASE_URL}${u}`);

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem("username");
      const token = await AsyncStorage.getItem("accessToken");

      if (!storedUsername || !token) {
        Toast.show({
          type: "error",
          text1: "Session Expired",
          text2: "Please log in again.",
        });
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${BASE_URL}/api/user_profile/?username=${encodeURIComponent(storedUsername)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();

      if (data.success) {
        const d = data.data || {};
        setName(d.name || "");
        setUsername(d.username || "");
        setMobile(d.contactNumber || "");
        setAddress(d.address || "");
        setImage(d.image ? absUrl(d.image) : null);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.message || "Failed to fetch profile.",
        });
      }
    } catch (err) {
      console.error("fetchProfile:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to fetch profile details.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,

      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!name || !mobile || !address) {
        Toast.show({
          type: "error",
          text1: "Missing Fields",
          text2: "Please fill in all required fields.",
        });
        return;
      }

      if (!/^09\d{9}$/.test(mobile)) {
        Toast.show({
          type: "error",
          text1: "Invalid Contact Number",
          text2: "Enter a valid 11-digit number starting with 09.",
        });
        return;
      }

      if (newPassword && newPassword !== confirmPassword) {
        Toast.show({
          type: "error",
          text1: "Password Mismatch",
          text2: "Passwords do not match.",
        });
        return;
      }

      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Session Expired",
          text2: "Please log in again.",
        });
        return;
      }

      const formData = new FormData();
      formData.append("username", username);
      formData.append("name", name);
      formData.append("contactNumber", mobile);
      formData.append("address", address);
      if (newPassword) formData.append("password", newPassword);

      if (image && !image.startsWith("http")) {
        formData.append("profile_image", {
          uri: image,
          name: "profile.jpg",
          type: "image/jpeg",
        });
      }

      const res = await fetch(`${BASE_URL}/api/update_profile/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        Toast.show({
          type: "success",
          text1: "Profile Updated",
          text2: "Your changes were saved successfully!",
        });
        setNewPassword("");
        setConfirmPassword("");
        fetchProfile();
      } else {
        Toast.show({
          type: "error",
          text1: "Update Failed",
          text2: data.message || "Please try again.",
        });
      }
    } catch (err) {
      console.error("handleSave:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update profile.",
      });
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#4FC3F7", "#1E88E5"]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading profile...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#4FC3F7", "#1E88E5"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Section */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            <Image
              source={image ? { uri: image } : require("../../assets/default_profile.jpg")}
              style={styles.profileImage}
            />
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.subtitle}>Update your account details below</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { backgroundColor: "#f1f1f1" }]}
            placeholder="Username"
            value={username}
            editable={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Contact Number"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
          />

          {/* Password with toggle */}
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.inputPassword}
              placeholder="New Password (optional)"
              secureTextEntry={!showNewPass}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPass(!showNewPass)}
            >
              <Ionicons
                name={showNewPass ? "eye-off" : "eye"}
                size={22}
                color="#1976D2"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.inputPassword}
              placeholder="Confirm Password"
              secureTextEntry={!showConfirmPass}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPass(!showConfirmPass)}
            >
              <Ionicons
                name={showConfirmPass ? "eye-off" : "eye"}
                size={22}
                color="#1976D2"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <LinearGradient colors={["#64B5F6", "#1976D2"]} style={styles.saveGradient}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 20, paddingBottom: 40 },
  profileHeader: { alignItems: "center", marginBottom: 20 },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#fff",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: -4,
    backgroundColor: "#1976D2",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  subtitle: { color: "#e0f7fa", fontSize: 14, marginTop: 2 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  passwordWrapper: { position: "relative", marginVertical: 6 },
  inputPassword: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingRight: 40,
  },
  eyeIcon: { position: "absolute", right: 15, top: 13 },
  saveButton: { marginTop: 20, borderRadius: 12, overflow: "hidden" },
  saveGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
