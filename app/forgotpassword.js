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
import Toast from "react-native-toast-message";

const BASE_URL = "http://192.168.1.8:8000";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = email, 2 = code, 3 = reset password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // --- SEND CODE ---
  const handleSendCode = async () => {
    if (!email) {
      Toast.show({
        type: "error",
        text1: "Missing Email",
        text2: "Please enter your registered email address.",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("send_code", "true");
      formData.append("email", email);

      await axios.post(`${BASE_URL}/forgot_password/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Toast.show({
        type: "success",
        text1: "Verification Sent",
        text2: "A 6-digit code has been sent to your email.",
      });

      setStep(2);
    } catch (err) {
      console.error("Send Code Error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to send reset code. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- VERIFY CODE ---
  const handleVerifyCode = async () => {
    if (!code) {
      Toast.show({
        type: "error",
        text1: "Missing Code",
        text2: "Please enter your verification code.",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("verify_code", "true");
      formData.append("reset_code", code);

      const res = await axios.post(`${BASE_URL}/forgot_password/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: "Code Verified",
          text2: "Verification successful! You can now reset your password.",
        });
        setStep(3);
      }
    } catch (err) {
      console.error("Verify Code Error:", err);
      Toast.show({
        type: "error",
        text1: "Invalid Code",
        text2: "Please enter a valid verification code.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- RESEND CODE ---
  const handleResendCode = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resend_code", "true");

      await axios.post(`${BASE_URL}/forgot_password/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      Toast.show({
        type: "info",
        text1: "Code Resent",
        text2: "A new verification code has been sent to your email.",
      });
    } catch (err) {
      console.error("Resend Code Error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to resend code. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- PASSWORD STRENGTH CHECK ---
  const isStrongPassword = (pwd) => {
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;
    const common = ["1234", "password", "shane2004", "abc123", "qwerty"];
    return strongRegex.test(pwd) && !common.some((w) => pwd.includes(w));
  };

  // --- RESET PASSWORD ---
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill in all password fields.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Password Mismatch",
        text2: "Your passwords do not match.",
      });
      return;
    }

    if (!isStrongPassword(newPassword)) {
      Toast.show({
        type: "error",
        text1: "Weak Password",
        text2:
          "Use at least 8 characters with uppercase, lowercase, number, and symbol.",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("new_password", newPassword);
      formData.append("confirm_password", confirmPassword);

      await axios.post(`${BASE_URL}/verify-reset-code/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      Toast.show({
        type: "success",
        text1: "Password Reset Successful",
        text2: "You can now log in with your new password.",
      });

      setTimeout(() => router.replace("/login"), 1500);
    } catch (err) {
      console.error("Reset Password Error:", err);
      Toast.show({
        type: "error",
        text1: "Reset Failed",
        text2: "Could not reset your password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#4FC3F7", "#1E88E5"]} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/TRAILLEND-ICON.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>TrailLend</Text>
          </View>

          <View style={styles.card}>
            {step === 1 && (
              <>
                <Text style={styles.heading}>Forgot Password</Text>
                <Text style={styles.subText}>
                  Enter your email address to receive a verification code.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Email Address"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity activeOpacity={0.9} onPress={handleSendCode}>
                  <LinearGradient
                    colors={["#64B5F6", "#1976D2"]}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={[styles.button, loading && { opacity: 0.6 }]}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "Sending..." : "Send"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/login")}>
                  <Text style={styles.link}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.heading}>Verification Code</Text>
                <Text style={styles.subText}>
                  Enter the 6-digit code we sent to your email.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Code"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  value={code}
                  onChangeText={setCode}
                />

                <TouchableOpacity activeOpacity={0.9} onPress={handleVerifyCode}>
                  <LinearGradient
                    colors={["#64B5F6", "#1976D2"]}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={[styles.button, loading && { opacity: 0.6 }]}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "Verifying..." : "Verify"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleResendCode}>
                  <Text style={styles.link}>Resend Code</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.heading}>Set New Password</Text>
                <Text style={styles.subText}>
                  Enter and confirm your new password.
                </Text>

                {/* New Password */}
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.inputPassword}
                    placeholder="New Password"
                    placeholderTextColor="#999"
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

                {/* Confirm Password */}
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.inputPassword}
                    placeholder="Confirm Password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirm}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
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

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={["#64B5F6", "#1976D2"]}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={[styles.button, loading && { opacity: 0.6 }]}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "Saving..." : "Save Password"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  logoContainer: { alignItems: "center", marginBottom: 20 },
  logo: { width: 90, height: 90 },
  title: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    width: "100%",
    padding: 20,
    elevation: 5,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1976D2",
    textAlign: "center",
    marginBottom: 10,
  },
  subText: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#333",
    marginBottom: 15,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: {
    color: "#1976D2",
    textAlign: "center",
    textDecorationLine: "underline",
    fontWeight: "600",
    marginTop: 5,
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
});
