import { Stack } from "expo-router";
import Toast from "react-native-toast-message";
import usePushNotifications from "./hooks/usePushNotifications";
import { useEffect } from "react";

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
      <Toast position="top" topOffset={100} visibilityTime={5000} />
    </>
  );
}
