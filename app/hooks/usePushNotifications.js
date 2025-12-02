// app/hooks/usePushNotifications.js
import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.1.8:8000"; // Update if needed

// Notification behavior config
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef();
  const responseListener = useRef();

  async function registerForPushNotificationsAsync() {
    try {
      if (!Device.isDevice) {
        alert("Push notifications only work on real devices!");
        return;
      }

      // Android channel
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 200, 200, 200], // merged compromise
        lightColor: "#1976D2",
      });

      // Permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (finalStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        alert("Permission for notifications was denied.");
        return;
      }

      // Expo push token
      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: "ff6f68d3-15c6-430f-ab03-9a9724a1ec4a",
      });

      console.log("📌 EXPO TOKEN:", token);

      setExpoPushToken(token);
      await AsyncStorage.setItem("expoPushToken", token);

      // Send to backend
      const access = await AsyncStorage.getItem("access_token");
      if (access) {
        await fetch(`${API_URL}/api/save_device_token/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        console.log("✅ Token saved in backend");
      }
    } catch (error) {
      console.log("❌ Error registering for notifications:", error);
    }
  }

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Foreground listener
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📩 Notification received in foreground:", notification);
      });

    // When user taps the notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("📨 Notification interaction:", response);
      });

    // Cleanup
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken };
}
