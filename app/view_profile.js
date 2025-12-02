import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";

const BASE_URL = "http://192.168.1.8:8000";

export default function ViewProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("username");
        const token = await AsyncStorage.getItem("accessToken");

        if (!storedUsername || !token) {
          Alert.alert("Session expired", "Please log in again.");
          setLoading(false);
          router.replace("/login");
          return;
        }

        const res = await axios.get(`${BASE_URL}/api/user_profile/`, {
          params: { username: storedUsername },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success) setUser(res.data.data);
        else Alert.alert("Error", res.data?.message || "Failed to load profile");
      } catch (err) {
        console.error("Profile fetch error:", err.message);
        Alert.alert("Error", "Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={{ marginTop: 10, color: "#333" }}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#555" }}>No profile found.</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#4FC3F7", "#1E88E5"]}
      start={[0, 0]}
      end={[0, 1]}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.header}>Profile</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* PROFILE */}
        <View style={styles.profileTop}>
          <View style={styles.circleDecoration1} />
          <View style={styles.circleDecoration2} />

          <View style={styles.profileImageWrapper}>
            <Image
              source={
                user.image
                  ? { uri: user.image.startsWith("http") ? user.image : `${BASE_URL}${user.image}` }
                  : require("../assets/default_profile.jpg")
              }
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.username}>@{user.username}</Text>
        </View>

        {/* INFO CARD */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color="#1E88E5" style={styles.icon} />
            <View>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.value}>{user.name}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="at-outline" size={20} color="#1E88E5" style={styles.icon} />
            <View>
              <Text style={styles.label}>Username</Text>
              <Text style={styles.value}>{user.username}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#1E88E5" style={styles.icon} />
            <View>
              <Text style={styles.label}>Contact</Text>
              <Text style={styles.value}>{user.contactNumber || "—"}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#1E88E5" style={styles.icon} />
            <View>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{user.address || "—"}</Text>
            </View>
          </View>
        </View>

        {/* EDIT BUTTON */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("(drawer)/Edit_Profile")}
          style={styles.buttonWrapper}
        >
          <LinearGradient
            colors={["#64B5F6", "#1976D2"]}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.gradientButton}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Edit Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 50,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 8,
    borderRadius: 8,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  profileTop: {
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  profileImageWrapper: {
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 100,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
  },
  username: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  circleDecoration1: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 100,
    height: 100,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 50,
  },
  circleDecoration2: {
    position: "absolute",
    bottom: -50,
    right: -50,
    width: 120,
    height: 120,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 60,
  },
  infoContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 13,
    color: "#888",
  },
  value: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  buttonWrapper: {
    marginTop: 30,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  gradientButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
  },
});
