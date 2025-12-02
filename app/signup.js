import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message"; // 

const BASE_URL = "http://192.168.1.8:8000";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSentModal, setEmailSentModal] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [passwordY, setPasswordY] = useState(0);





  // ✅ Strong password checker
  const isStrongPassword = (pwd) => {
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;
    const common = [
      "1234",
      "password",
      "shane2004",
      "abc123",
      "qwerty",
      "admin",
      "test",
    ];
    return strongRegex.test(pwd) && !common.some((w) => pwd.toLowerCase().includes(w));
  };

  const passwordChecks = (pwd) => {
  return {
    lower: /[a-z]/.test(pwd),
    upper: /[A-Z]/.test(pwd),
    number: /\d/.test(pwd),
    symbol: /[@$!%*?&#^]/.test(pwd),
    length: pwd.length >= 8,
    noRepeat: !/(.)\1\1/.test(pwd), // no more than 2 consecutive identical chars
  };
};


  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const isValidContact = (num) => /^09\d{9}$/.test(num);

  const handleSignUp = async () => {
    if (!name || !username || !email || !contactNumber || !address || !password || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill out all required fields.",
      });
      return;
    }

    if (!isValidEmail(email)) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please enter a valid email address.",
      });
      return;
    }

    if (!isValidContact(contactNumber)) {
      Toast.show({
        type: "error",
        text1: "Invalid Contact Number",
        text2: "Enter an 11-digit number starting with 09.",
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Password Mismatch",
        text2: "Your passwords do not match.",
      });
      return;
    }

    if (!isStrongPassword(password)) {
      Toast.show({
        type: "error",
        text1: "Weak Password",
        text2:
          "Use at least 8 characters with uppercase, lowercase, number, and symbol.",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${BASE_URL}/api/register/`,
        {
          name,
          username,
          email,
          contactNumber,
          address,
          password,
          confirmPassword,
        },
        { headers: { "Content-Type": "application/json" }, timeout: 8000 }
      );

      if (response.data?.success === true) {
        Toast.show({
          type: "success",
          text1: "Registration Successful",
          text2: "Please check your email to verify your account.",
        });
        setTimeout(() => router.replace("/login"), 1500);
      } else if (response.data?.message?.includes("username")) {
        Toast.show({
          type: "error",
          text1: "Username Taken",
          text2: "Please choose a different username.",
        });
      } else if (response.data?.message?.includes("email")) {
        Toast.show({
          type: "error",
          text1: "Email Already Registered",
          text2: "Try logging in instead.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Registration Failed",
          text2: response.data?.message || "Please try again.",
        });
      }
    } catch (err) {
      console.error("Signup error:", err.response?.data || err.message);
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Unable to connect to server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <LinearGradient colors={["#4FC3F7", "#1E88E5"]} style={styles.gradient}>

       {emailSentModal && (
          <View style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 30,
            zIndex: 9999
          }}>
            <View style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              width: "100%",
              padding: 30,
              alignItems: "center"
            }}>
              <Ionicons name="mail-unread-outline" size={70} color="#1976D2" />

              <Text style={{
                fontSize: 22,
                fontWeight: "800",
                marginTop: 15,
                textAlign: "center",
                color: "#1976D2"
              }}>
                Verify your email
              </Text>

              <Text style={{
                marginTop: 10,
                fontSize: 15,
                color: "#444",
                textAlign: "center"
              }}>
                We’ve sent a verification link to:
              </Text>

              <Text style={{
                marginTop: 5,
                fontWeight: "700",
                color: "#000",
                textAlign: "center"
              }}>
                {sentEmail}
              </Text>

              <Text style={{
                marginTop: 10,
                fontSize: 14,
                color: "#666",
                textAlign: "center"
              }}>
                Open the link to activate your account.
              </Text>

              <TouchableOpacity
                onPress={() => router.replace("/login")}
                style={{
                  marginTop: 25,
                  backgroundColor: "#1976D2",
                  paddingVertical: 12,
                  paddingHorizontal: 40,
                  borderRadius: 10
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Continue to Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header / Logo */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>TrailLend</Text>
            <Text style={styles.subtitle}>Join our growing community 🌿</Text>
          </View>

          {/* Registration Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Your Account</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Contact Number"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Address / Purok / Street"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor="#999"
            />

            {/* PASSWORD FIELD */}
            <View
              style={styles.passwordWrapper}
              onLayout={(e) => {
                const { y, height } = e.nativeEvent.layout;
                setPasswordY(y + height + 5); // correct offset
              }}
            >
          <TextInput
            style={styles.inputPassword}
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);

              // 🔥 Auto-hide popup when password becomes strong
              if (isStrongPassword(text)) {
                setShowPasswordRules(false);
              }
            }}
            secureTextEntry={!showPassword}
            placeholderTextColor="#999"
            onFocus={() => setShowPasswordRules(true)}
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

              {/* PASSWORD RULES POPUP */}
              {showPasswordRules && (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setShowPasswordRules(false)}
                  style={[styles.rulesOverlay, { top: passwordY }]}
                >
                  <View style={styles.rulesBox}>
                    {Object.entries(passwordChecks(password)).map(([key, valid]) => (
                      <View
                        key={key}
                        style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}
                      >
                        <Ionicons
                          name={valid ? "checkmark-circle" : "close-circle"}
                          size={18}
                          color={valid ? "green" : "red"}
                        />
                        <Text
                          style={{
                            marginLeft: 6,
                            color: valid ? "green" : "red",
                            fontSize: 13,
                          }}
                        >
                          {key === "lower" && "Have at least one lowercase letter"}
                          {key === "upper" && "Have at least one capital letter"}
                          {key === "number" && "Have at least one number"}
                          {key === "symbol" && "Have at least one special symbol"}
                          {key === "length" && "Be at least 8 characters"}
                          {key === "noRepeat" &&
                            "Must not contain more than 2 identical characters"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              )}
            {/* Confirm Password */}
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.inputPassword}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirm(!showConfirm)}
              >
                <Ionicons
                  name={showConfirm ? "eye-off" : "eye"}
                  size={22}
                  color="#1976D2"
                />
              </TouchableOpacity>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSignUp}
              disabled={loading}
            >
              <LinearGradient
                colors={["#64B5F6", "#1976D2"]}
                start={[0, 0]}
                end={[1, 0]}
                style={[styles.button, loading && { opacity: 0.6 }]}
              >
                <Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>
                  {loading ? "Creating Account..." : "Sign Up"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Already have account */}
            <View style={styles.loginRow}>
              <Text style={{ color: "#333" }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.loginText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require("../assets/community.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
            <Text style={styles.communityText}>
              Lending, Sharing, and Growing Together 💫
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  headerContainer: { alignItems: "center", marginBottom: 30 },
  title: { fontSize: 42, fontWeight: "bold", color: "#fff" },
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
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1976D2",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 15,
    color: "#333",
  },
  passwordWrapper: { position: "relative", marginBottom: 15 },
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
  eyeIcon: { position: "absolute", right: 15, top: 13 },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 20,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 8 },
  loginRow: { flexDirection: "row", justifyContent: "center" },
  loginText: { color: "#1976D2", fontWeight: "700" },
  illustrationContainer: { alignItems: "center", marginTop: 10 },
  illustration: { width: 220, height: 60, opacity: 0.9 },
  communityText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
rulesOverlay: {
  position: "absolute",
  left: 20,
  right: 20,
  backgroundColor: "transparent",
  zIndex: 999,
  // remove top here because dynamic top is added in JSX
},

rulesBox: {
  backgroundColor: "#fff",
  padding: 15,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#ddd",
  elevation: 6,
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowOffset: { width: 0, height: 3 },
  shadowRadius: 6,
},

rulesTitle: {
  fontWeight: "700",
  fontSize: 14,
  marginBottom: 8,
},

});

