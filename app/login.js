import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuth } from "../lib/authStorage";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";

const BASE_URL = "http://192.168.1.8:8000";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load saved login data
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem("savedUsername");
        const savedPassword = await AsyncStorage.getItem("savedPassword");
        const savedRemember = await AsyncStorage.getItem("rememberMe");

        if (savedRemember === "true" && savedUsername && savedPassword) {
          setUsername(savedUsername);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (err) {
        console.warn("Error loading saved credentials:", err);
      }
    };
    loadSavedCredentials();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please enter both username and password.",
      });
      return;
    }

    try {
      // Clear old status so new accounts don't inherit "Bad"
      await AsyncStorage.removeItem("borrowerStatus");

      const res = await axios.post(
        `${BASE_URL}/api/login/`,
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = res.data;

      // ⭐ Save "Bad" but do NOT show modal here anymore
      if (data.borrower_status === "Bad") {
        await AsyncStorage.setItem("borrowerStatus", "Bad");
      }

      const { access, refresh } = data;

      if (!access || !refresh) {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: "No access tokens received.",
        });
        return;
      }

      await setAuth({ access, refresh, username });
      await AsyncStorage.setItem("access_token", access);
      await AsyncStorage.setItem("refresh_token", refresh);

      // Remember Me handling
      if (rememberMe) {
        await AsyncStorage.multiSet([
          ["savedUsername", username],
          ["savedPassword", password],
          ["rememberMe", "true"],
        ]);
      } else {
        await AsyncStorage.multiRemove([
          "savedUsername",
          "savedPassword",
          "rememberMe",
        ]);
      }

      // Fetch borrower info
      let borrowerStatus = "Good";
      try {
        const borrowerRes = await fetch(`${BASE_URL}/api/me_borrower/`, {
          headers: { Authorization: `Bearer ${access}` },
        });

        if (borrowerRes.ok) {
          const borrowerData = await borrowerRes.json();
          borrowerStatus = borrowerData.borrower_status || "Good";

          await AsyncStorage.multiSet([
            ["borrowerUserID", String(borrowerData.user_id || "")],
            ["fullName", borrowerData.full_name || ""],
            ["contactNumber", borrowerData.contact_number || ""],
            ["address", borrowerData.address || ""],
            ["borrowerStatus", borrowerStatus],
            ["lateCount", String(borrowerData.late_count || "0")],
          ]);
        }
      } catch (err) {
        console.warn("Error fetching borrower info:", err);
      }

      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: "Welcome to TrailLend!",
      });

      setTimeout(() => {
        router.replace({
          pathname: "/(drawer)/AdminDashboard",
          params: { status: borrowerStatus },
        });
      }, 1500);
    } catch (err) {
      console.error("Login error:", err);
      const message =
        err.response?.data?.message || "Invalid username or password";

      if (message.toLowerCase().includes("verify")) {
        Toast.show({
          type: "info",
          text1: "Email Verification Required",
          text2: "Please verify your email before logging in.",
        });
      } else if (message.toLowerCase().includes("invalid")) {
        Toast.show({
          type: "error",
          text1: "Invalid Credentials",
          text2: "Please check your username or password.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: message || "An unexpected error occurred.",
        });
      }
    }
  };

  return (
    <LinearGradient colors={["#4FC3F7", "#1E88E5"]} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.title}>TrailLend</Text>
            <Text style={styles.subtitle}>
              Empowering the Community Together 🌿
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Log In to Your Account</Text>

            {/* Username */}
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            {/* Password */}
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.inputLabel}>Password</Text>

              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.inputPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />

                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={22}
                    color="#1976D2"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Row: Remember Me + Forgot Password */}
            <View style={styles.row}>
              <View style={styles.rememberMe}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  thumbColor={rememberMe ? "#1976D2" : "#ccc"}
                />
                <Text style={{ marginLeft: 8, color: "#333" }}>Remember Me</Text>
              </View>

              <TouchableOpacity onPress={() => router.push("/forgotpassword")}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity activeOpacity={0.9} onPress={handleLogin}>
              <LinearGradient
                colors={["#64B5F6", "#1976D2"]}
                start={[0, 0]}
                end={[1, 0]}
                style={styles.loginButton}
              >
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Log In</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Signup Link */}
            <View style={styles.signup}>
              <Text style={{ color: "#333" }}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/signup")}>
                <Text style={styles.signupText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.illustrationContainer}>
            <Image
              source={require("../assets/community.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
            <Text style={styles.communityText}>
              Together, we build a stronger community.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { 
    flex: 1 
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },

  logoContainer: { 
    alignItems: "center", 
    marginBottom: 30 
  },

  title: { 
    fontSize: 42, 
    fontWeight: "bold", 
    color: "#fff" 
  },

  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    textAlign: "center",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    width: "100%",
    padding: 22,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1976D2",
    marginBottom: 25,
    textAlign: "center",
  },

  /* ⭐ LABELS */
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginLeft: 2,
  },

  /* ⭐ USERNAME INPUT */
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#333",
  },

  /* ⭐ PASSWORD INPUT */
  passwordWrapper: { 
    position: "relative", 
    marginBottom: 15 
  },

  inputPassword: {
    width: "100%",
    height: 50,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingRight: 40,
    fontSize: 15,
    color: "#333",
  },

  eyeIcon: { 
    position: "absolute", 
    right: 15, 
    top: 13 
  },

  /* Row: Remember me + Forgot Password */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 20,
  },

  rememberMe: { 
    flexDirection: "row", 
    alignItems: "center" 
  },

  forgotPassword: {
    color: "#1976D2",
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  loginButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 20,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },

  signup: { 
    flexDirection: "row", 
    justifyContent: "center",
    marginBottom: 5 
  },

  signupText: { 
    color: "#1976D2", 
    fontWeight: "700" 
  },

  illustrationContainer: { 
    alignItems: "center", 
    marginTop: 20 
  },

  illustration: { 
    width: 220, 
    height: 120, 
    opacity: 0.9 
  },

  communityText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
});
