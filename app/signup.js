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

  // --- REQUIRED FIELD CHECKS ---
  if (!name.trim()) {
    return Toast.show({
      type: "error",
      text1: "Full Name Required",
      text2: "Please enter your full name.",
    });
  }

  if (!username.trim()) {
    return Toast.show({
      type: "error",
      text1: "Username Required",
      text2: "Please enter a username.",
    });
  }

  if (!email.trim()) {
    return Toast.show({
      type: "error",
      text1: "Email Required",
      text2: "Please enter your email.",
    });
  }

  if (!contactNumber.trim()) {
    return Toast.show({
      type: "error",
      text1: "Contact Number Required",
      text2: "Please enter your phone number.",
    });
  }

  if (!address.trim()) {
    return Toast.show({
      type: "error",
      text1: "Address Required",
      text2: "Please enter your address.",
    });
  }

  if (!password.trim()) {
    return Toast.show({
      type: "error",
      text1: "Password Required",
      text2: "Please enter a password.",
    });
  }

  if (!confirmPassword.trim()) {
    return Toast.show({
      type: "error",
      text1: "Confirm Password",
      text2: "Please re-enter your password.",
    });
  }

  // --- FORMAT CHECKS ---
  if (!isValidEmail(email)) {
    return Toast.show({
      type: "error",
      text1: "Invalid Email",
      text2: "Please enter a valid email address.",
    });
  }

  if (!isValidContact(contactNumber)) {
    return Toast.show({
      type: "error",
      text1: "Invalid Phone Number",
      text2: "Your number must start with 09 and have 11 digits.",
    });
  }

  // --- PASSWORD MATCH ---
  if (password !== confirmPassword) {
    return Toast.show({
      type: "error",
      text1: "Passwords Don't Match",
      text2: "Make sure both passwords match.",
    });
  }

  // --- PASSWORD STRENGTH ---
  if (!isStrongPassword(password)) {
    return Toast.show({
      type: "error",
      text1: "Weak Password",
      text2: "Use 8+ characters with upper/lowercase, a number, and a symbol.",
    });
  }


  // --- API REQUEST ---
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

    const res = response.data;

    // --- SUCCESS ---
    if (res?.success === true) {
      Toast.show({
        type: "success",
        text1: "Account Created!",
        text2: "Check your email to verify your account.",
      });

      setTimeout(() => router.replace("/login"), 1500);
      return;
    }

    // --- SPECIFIC SERVER ERRORS ---
    if (res?.message?.toLowerCase().includes("username")) {
      return Toast.show({
        type: "error",
        text1: "Username Taken",
        text2: "Please choose another username.",
      });
    }

    if (res?.message?.toLowerCase().includes("email")) {
      return Toast.show({
        type: "error",
        text1: "Email Already Registered",
        text2: "Use another email or try logging in.",
      });
    }

    // --- GENERAL SERVER MESSAGE ---
    return Toast.show({
      type: "error",
      text1: "Signup Failed",
      text2: res?.message || "Something went wrong.",
    });

  } catch (err) {
    console.log("Signup error:", err.response?.data || err.message);

    // 🔥 Backend responded but with an error
    if (err.response) {
      const message = err.response.data?.message?.toLowerCase() || "";

      if (message.includes("email")) {
        return Toast.show({
          type: "error",
          text1: "Email Already Registered",
          text2: "Try another email or log in instead.",
        });
      }

      if (message.includes("username")) {
        return Toast.show({
          type: "error",
          text1: "Username Already Taken",
          text2: "Choose a different username.",
        });
      }

      if (message.includes("password")) {
        return Toast.show({
          type: "error",
          text1: "Password Error",
          text2: "Please double-check your password.",
        });
      }

      return Toast.show({
        type: "error",
        text1: "Signup Failed",
        text2: err.response.data.message || "Please try again.",
      });
    }

    // ❌ FULL NETWORK FAILURE
    return Toast.show({
      type: "error",
      text1: "Connection Error",
      text2: "Server unreachable. Check your internet.",
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

            {/* FULL NAME */}
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor="#999"
              />
            </View>

            {/* USERNAME */}
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor="#999"
              />
            </View>

            {/* EMAIL */}
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="example@gmail.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* CONTACT NUMBER */}
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.inputLabel}>Contact Number</Text>
              <TextInput
                style={styles.input}
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder="09xxxxxxxxx"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            {/* ADDRESS */}
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.inputLabel}>Address / Purok / Street</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                placeholderTextColor="#999"
              />
            </View>

            {/* PASSWORD */}
            <View
              style={styles.passwordWrapper}
              onLayout={(e) => {
                const { y, height } = e.nativeEvent.layout;
                setPasswordY(y + height + 5);
              }}
            >
              <Text style={styles.inputLabel}>Password</Text>

              <TextInput
                style={styles.inputPassword}
                placeholder="Enter password"
                value={password}
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                onChangeText={(text) => {
                  setPassword(text);
                  if (isStrongPassword(text)) setShowPasswordRules(false);
                }}
                onFocus={() => setShowPasswordRules(true)}
              />

              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#1976D2" />
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
            {/* CONFIRM PASSWORD */}
            <View style={styles.passwordWrapper}>
              <Text style={styles.inputLabel}>Confirm Password</Text>

              <TextInput
                style={styles.inputPassword}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                placeholderTextColor="#999"
              />

              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons name={showConfirm ? "eye-off" : "eye"} size={22} color="#1976D2" />
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

  headerContainer: { 
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
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 20,
    width: "100%",
    padding: 22,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1976D2",
    marginBottom: 22,
    textAlign: "center",
  },

  /* -------- LABEL -------- */
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginLeft: 2,
  },

  /* -------- NORMAL INPUT -------- */
  input: {
    width: "100%",
    height: 52,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 18,
    marginBottom: 0,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  /* -------- PASSWORD FIELD -------- */
  passwordWrapper: { 
    position: "relative", 
    marginBottom: 18 
  },

  inputPassword: {
    width: "100%",
    height: 52,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingRight: 45,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  eyeIcon: { 
    position: "absolute", 
    right: 15, 
    top: 38, 
  },

  /* -------- BUTTON -------- */
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 20,
  },

  buttonText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 16, 
    marginLeft: 8 
  },

  /* -------- LOGIN ROW -------- */
  loginRow: { 
    flexDirection: "row", 
    justifyContent: "center" 
  },

  loginText: { 
    color: "#1976D2", 
    fontWeight: "700" 
  },

  /* -------- FOOTER / IMAGE -------- */
  illustrationContainer: { 
    alignItems: "center", 
    marginTop: 12 
  },

  illustration: { 
    width: 220, 
    height: 60, 
    opacity: 0.9 
  },

  communityText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },

  /* -------- PASSWORD RULES POPUP -------- */
  rulesOverlay: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "transparent",
    zIndex: 999,
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
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },

  rulesTitle: {
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 8,
  },
});

