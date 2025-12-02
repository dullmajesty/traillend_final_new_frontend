import { Stack } from "expo-router";
import Toast from "react-native-toast-message";
import usePushNotifications from "./hooks/usePushNotifications";
import { useEffect } from "react";
import { toastConfig } from "../component/toastConfig";

export default function RootLayout() {
  const { expoPushToken } = usePushNotifications(); // 🔥 register + listeners

  useEffect(() => {
    if (expoPushToken) {
      console.log("📌 Expo Push Token:", expoPushToken);
    }
  }, [expoPushToken]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />

      {/* Global Toast for notifications */}
      <Toast 
        config={toastConfig}
        position="top" 
        topOffset={80} 
        visibilityTime={4000} />
    </>
  );
}
